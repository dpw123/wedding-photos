import { Layout } from "./layout";
import { getImageWithTransforms } from "../../utils/galleryPath";
import {
  getGalleriesFromD1,
  getIndywidualGalleryFromD1wApproved,
} from "../../utils/db";
import { html } from "hono/html";

export const Gallery = ({ gallery, images, c }) => (
  <Layout title={gallery.GalleryName} c={c} prefetch="single">
    <section>
      <div className="gallery-controls">
        <a href="./" className="button">
          <i className="bi bi-arrow-left"></i> {c.t("all_albums_link")}
        </a>
        <div className="gallery-actions">
          {gallery.UploadPasscode && (
            <button id="openUploadBtn" className="button primary" type="button">
              <i className="bi bi-cloud-arrow-up"></i> {c.t("upload_photos_button")}
            </button>
          )}
          {gallery.Password && (
            <a href={gallery.GalleryTableName + "/logout"} className="button">
              {c.t("forget_gallery_password")}
            </a>
          )}
        </div>
      </div>

      <div className="gallery-info">
        <h1 className="gallery-title">{gallery.GalleryName}</h1>
        {gallery.PartyDate && (
          <div className="gallery-date">
            <span className="pill">
              <i className="bi bi-calendar-event"></i>{" "}
              {new Date(gallery.PartyDate).toLocaleDateString(c.t("date_locale"), {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>
        )}
        {gallery.Tags && (
          <div className="gallery-tags">
            <small>
              <i className="bi bi-tags"></i> {gallery.Tags}
            </small>
          </div>
        )}
        {gallery.TextField && (
          <p className="gallery-description">{gallery.TextField}</p>
        )}
      </div>

      {gallery.UploadPasscode && (
        <dialog
          id="uploadDialog"
          className="upload-dialog"
          data-gallery={gallery.GalleryTableName}
        >
          <article className="upload-modal-content">
            <header className="upload-modal-header">
              <button
                type="button"
                className="close-btn"
                id="closeUploadDialog"
                aria-label="Close dialog"
              >
                &times;
              </button>
              <h3>{c.t("upload_modal_title")}</h3>
              <p className="modal-subtitle">{c.t("upload_modal_desc")}</p>
            </header>

            <form id="userUploadForm">
              <label htmlFor="userPasscodeInput">
                <strong>{c.t("enter_upload_passcode")}</strong>
                <input
                  type="password"
                  id="userPasscodeInput"
                  name="passcode"
                  placeholder={c.t("upload_passcode_placeholder")}
                  required
                  autocomplete="off"
                />
              </label>

              <div className="file-drop-area" id="fileDropArea">
                <div className="drop-area-content">
                  <i className="bi bi-images upload-icon"></i>
                  <span className="drop-area-title">Select photos or drag &amp; drop</span>
                  <span className="drop-area-desc">JPG, PNG, HEIC, WebP up to 100MB</span>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  id="userFileInput"
                  name="file"
                  required
                />
              </div>

              <div id="selectedFilesSummary" className="selected-files-summary"></div>

              <button type="submit" id="userSubmitBtn" className="button primary full-width">
                <i className="bi bi-cloud-arrow-up"></i> {c.t("upload_photos_button")}
              </button>
            </form>

            <div id="uploadProgressSection" style="display: none; margin-top: 1.2rem;">
              <progress id="userProgressBar" role="progressbar" value="0" min="0" max="100"></progress>
              <div className="upload-counter">
                <span>Uploading: </span>
                <span id="userCurrentCounter">0</span> / <span id="userMaxCounter">0</span>
              </div>
            </div>

            <div id="userUploadStatus"></div>
          </article>
        </dialog>
      )}

      <div id="mansory-wraper">
        {images.length === 0 ? (
          <div style="text-align: center; padding: 3rem 1rem;">
            <p className="text-muted">{c.t("no_images_message")}</p>
          </div>
        ) : (
          <div id="masonry-container">
            {images.map((image) => (
              <div class="masonry-item" key={image.path}>
                <div class="masonry-item-content">
                  <div class="placeholder"></div>
                  <a
                    href={getImageWithTransforms(c, image.path, "full")}
                    data-pswp-width={image.width}
                    data-pswp-height={image.height}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <img
                      src={getImageWithTransforms(
                        c,
                        image.path,
                        "gallery-thumb"
                      )}
                      alt={image.name}
                      loading="lazy"
                    />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>

    {html`
      <script
        type="module"
        src="https://unpkg.com/imagesloaded@5/imagesloaded.pkgd.min.js"
      ></script>
      <script type="module" src="/static/js/initPhotoSwipe.js"></script>
      <script type="module" src="/static/js/masonry.js"></script>
      ${gallery.UploadPasscode ? html`<script type="module" src="/static/js/userUpload.js"></script>` : ''}
    `}
  </Layout>
);

export async function handleGalleryRoute(c) {
  const galleryTableName = c.req.param("galleryTableName");
  const { results: galleries } = await getGalleriesFromD1(c);
  const gallery = galleries.find(
    (g) => g.GalleryTableName === galleryTableName
  );

  if (!gallery) return c.notFound();

  const { results: images } = await getIndywidualGalleryFromD1wApproved(
    c,
    galleryTableName
  );
  // Append gallery password and name to context
  c.set("KV-Gallery-Password", gallery.Password);
  c.set("KV-Gallery-Name", gallery.GalleryName);

  return c.html(<Gallery gallery={gallery} images={images || []} c={c} />);
}
