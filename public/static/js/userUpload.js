import { sha256 } from "/static/js/crypto-hash/browser.js";

const CONCURRENT_UPLOAD_LIMIT = 4;

class GuestUploader {
  constructor(config) {
    this.dialog = config.dialog;
    this.openBtn = config.openBtn;
    this.closeBtn = config.closeBtn;
    this.form = config.form;
    this.passcodeInput = config.passcodeInput;
    this.fileInput = config.fileInput;
    this.dropArea = config.dropArea;
    this.filesSummary = config.filesSummary;
    this.submitBtn = config.submitBtn;
    this.progressSection = config.progressSection;
    this.progressBar = config.progressBar;
    this.currentCounter = config.currentCounter;
    this.maxCounter = config.maxCounter;
    this.statusBox = config.statusBox;
    this.galleryName = config.galleryName;

    this.fileList = [];
    this.isUploading = false;

    this.init();
  }

  init() {
    if (!this.dialog) return;

    // Load saved passcode from sessionStorage
    const savedPasscode = sessionStorage.getItem(`upload_passcode_${this.galleryName}`);
    if (savedPasscode && this.passcodeInput) {
      this.passcodeInput.value = savedPasscode;
    }

    // Dialog controls
    if (this.openBtn) {
      this.openBtn.addEventListener("click", () => {
        this.statusBox.innerHTML = "";
        this.dialog.showModal();
      });
    }

    if (this.closeBtn) {
      this.closeBtn.addEventListener("click", () => {
        if (!this.isUploading) this.dialog.close();
      });
    }

    // Light dismiss (click backdrop to close)
    this.dialog.addEventListener("click", (event) => {
      if (event.target === this.dialog && !this.isUploading) {
        this.dialog.close();
      }
    });

    // File input changes
    if (this.fileInput) {
      this.fileInput.addEventListener("change", () => {
        this.fileList = Array.from(this.fileInput.files);
        this.updateFilesSummary();
      });
    }

    // Drag & Drop
    if (this.dropArea) {
      ["dragenter", "dragover"].forEach((eventName) => {
        this.dropArea.addEventListener(
          eventName,
          (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.dropArea.classList.add("dragover");
          },
          false
        );
      });

      ["dragleave", "drop"].forEach((eventName) => {
        this.dropArea.addEventListener(
          eventName,
          (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.dropArea.classList.remove("dragover");
          },
          false
        );
      });

      this.dropArea.addEventListener(
        "drop",
        (e) => {
          const dt = e.dataTransfer;
          if (dt.files && dt.files.length > 0) {
            const imageFiles = Array.from(dt.files).filter((file) =>
              file.type.startsWith("image/")
            );
            this.fileList = imageFiles;
            this.updateFilesSummary();
          }
        },
        false
      );
    }

    // Form submission
    if (this.form) {
      this.form.addEventListener("submit", this.handleSubmit.bind(this));
    }
  }

  updateFilesSummary() {
    if (!this.filesSummary) return;
    if (this.fileList.length === 0) {
      this.filesSummary.innerHTML = "";
      return;
    }

    const totalBytes = this.fileList.reduce((acc, f) => acc + f.size, 0);
    const sizeFormatted = (totalBytes / (1024 * 1024)).toFixed(1);
    this.filesSummary.innerHTML = `
      <div class="summary-pill">
        <i class="bi bi-check2-circle"></i>
        <strong>${this.fileList.length}</strong> photo${this.fileList.length === 1 ? "" : "s"} selected (${sizeFormatted} MB)
      </div>
    `;
  }

  async handleSubmit(event) {
    event.preventDefault();
    if (this.isUploading) return;

    const passcode = this.passcodeInput ? this.passcodeInput.value.trim() : "";
    if (!passcode) {
      this.showStatus("Please enter the upload passcode.", "danger");
      this.passcodeInput?.focus();
      return;
    }

    if (this.fileList.length === 0) {
      this.showStatus("Please choose at least one photo to upload.", "danger");
      return;
    }

    // Save passcode in sessionStorage
    sessionStorage.setItem(`upload_passcode_${this.galleryName}`, passcode);

    this.isUploading = true;
    this.submitBtn.disabled = true;
    this.submitBtn.innerHTML = `<span class="spinner-border spinner-border-sm" role="status"></span> Uploading...`;
    this.progressSection.style.display = "block";
    this.statusBox.innerHTML = "";

    this.progressBar.setAttribute("value", "0");
    this.progressBar.setAttribute("max", "100");
    this.maxCounter.innerText = String(this.fileList.length);
    this.currentCounter.innerText = "0";

    try {
      const results = await this.uploadBatch(this.fileList, passcode, CONCURRENT_UPLOAD_LIMIT);
      this.handleUploadCompletion(results);
    } catch (error) {
      console.error("Batch upload failed:", error);
      this.showStatus(`Upload failed: ${error.message}`, "danger");
      this.resetControls();
    }
  }

  showStatus(message, type = "info") {
    this.statusBox.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
  }

  resetControls() {
    this.isUploading = false;
    this.submitBtn.disabled = false;
    this.submitBtn.innerHTML = `<i class="bi bi-cloud-arrow-up"></i> Start Upload`;
  }

  async uploadBatch(files, passcode, concurrencyLimit) {
    const results = [];
    const queue = [...files];
    const active = new Set();

    return new Promise((resolve) => {
      const runNext = () => {
        if (queue.length === 0 && active.size === 0) {
          resolve(results);
          return;
        }

        while (active.size < concurrencyLimit && queue.length > 0) {
          const file = queue.shift();
          const p = this.processAndUploadFile(file, passcode, results).finally(() => {
            active.delete(p);
            const completed = results.length;
            const pct = Math.round((completed / files.length) * 100);
            this.progressBar.setAttribute("value", String(pct));
            this.currentCounter.innerText = String(completed);
            runNext();
          });
          active.add(p);
        }
      };

      runNext();
    });
  }

  async processAndUploadFile(file, passcode, results) {
    try {
      const { width, height } = await this.getImageSize(file);
      const hash = await this.generateImageHash(file);
      const { dateCreated, dateModified } = await this.readFileCreatedDate(file);

      const formData = new FormData();
      formData.append("file", file, file.name);
      formData.append("passcode", passcode);
      formData.append("width", width);
      formData.append("height", height);
      formData.append("hash", hash);
      formData.append("dateCreated", dateCreated);
      formData.append("dateModified", dateModified);

      // Current pathname normalized without trailing slash
      const uploadUrl = `${window.location.pathname.replace(/\/$/, "")}/upload`;

      const response = await fetch(uploadUrl, {
        method: "POST",
        body: formData,
      });

      const responseData = await response.json();

      if (!response.ok || !responseData.DB?.success) {
        const errorMsg = responseData.DB?.error || (response.status === 401 ? "Incorrect upload passcode." : "Upload failed.");
        throw new Error(errorMsg);
      }

      results.push({
        success: true,
        filename: file.name,
      });
    } catch (err) {
      results.push({
        success: false,
        filename: file.name,
        error: err.message,
      });
    }
  }

  handleUploadCompletion(results) {
    const successful = results.filter((r) => r.success);
    const failed = results.filter((r) => !r.success);

    if (successful.length === results.length && results.length > 0) {
      this.showStatus(
        `All <strong>${successful.length}</strong> photos uploaded successfully! Refreshing gallery in <span id="userReloadCount">3</span> seconds...`,
        "success"
      );

      let countdown = 3;
      const timer = setInterval(() => {
        countdown--;
        const counterEl = document.getElementById("userReloadCount");
        if (counterEl) counterEl.innerText = String(countdown);
        if (countdown <= 0) {
          clearInterval(timer);
          window.location.reload();
        }
      }, 1000);
    } else if (successful.length > 0) {
      const failedList = failed.map((f) => `<li>${f.filename}: ${f.error}</li>`).join("");
      this.showStatus(
        `<div>Uploaded <strong>${successful.length}</strong> of ${results.length} photos.</div>
         <div class="mt-2 text-sm text-danger">Failed photos:<ul>${failedList}</ul></div>
         <button type="button" class="button primary pill mt-2" onclick="window.location.reload()">Reload Gallery</button>`,
        "warning"
      );
      this.resetControls();
    } else {
      const errorDetail = failed[0]?.error || "Upload failed.";
      this.showStatus(`<strong>Upload failed:</strong> ${errorDetail}`, "danger");
      this.resetControls();
    }
  }

  async getImageSize(image) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => resolve({ width: img.width || 0, height: img.height || 0 });
        img.onerror = () => resolve({ width: 0, height: 0 });
        img.src = event.target.result;
      };
      reader.onerror = () => resolve({ width: 0, height: 0 });
      reader.readAsDataURL(image);
    });
  }

  async generateImageHash(image) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const hash = await sha256(event.target.result);
          resolve(hash);
        } catch (e) {
          resolve(Math.random().toString(36).substring(2));
        }
      };
      reader.onerror = () => resolve(Math.random().toString(36).substring(2));
      reader.readAsArrayBuffer(image);
    });
  }

  async readFileCreatedDate(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const view = new DataView(event.target.result);
          const dateCreated = view.getUint32(0, true) || Math.floor(Date.now() / 1000);
          const dateModified = view.getUint32(4, true) || Math.floor(Date.now() / 1000);
          resolve({ dateCreated, dateModified });
        } catch (e) {
          const now = Math.floor(Date.now() / 1000);
          resolve({ dateCreated: now, dateModified: now });
        }
      };
      reader.onerror = () => {
        const now = Math.floor(Date.now() / 1000);
        resolve({ dateCreated: now, dateModified: now });
      };
      reader.readAsArrayBuffer(file);
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const dialog = document.getElementById("uploadDialog");
  if (!dialog) return;

  const galleryName = dialog.getAttribute("data-gallery") || "";

  new GuestUploader({
    dialog: dialog,
    openBtn: document.getElementById("openUploadBtn"),
    closeBtn: document.getElementById("closeUploadDialog"),
    form: document.getElementById("userUploadForm"),
    passcodeInput: document.getElementById("userPasscodeInput"),
    fileInput: document.getElementById("userFileInput"),
    dropArea: document.getElementById("fileDropArea"),
    filesSummary: document.getElementById("selectedFilesSummary"),
    submitBtn: document.getElementById("userSubmitBtn"),
    progressSection: document.getElementById("uploadProgressSection"),
    progressBar: document.getElementById("userProgressBar"),
    currentCounter: document.getElementById("userCurrentCounter"),
    maxCounter: document.getElementById("userMaxCounter"),
    statusBox: document.getElementById("userUploadStatus"),
    galleryName: galleryName,
  });
});

