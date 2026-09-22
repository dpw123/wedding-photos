import { addImageToIndywidualGallery, getGalleriesFromD1 } from "../../utils/db";
import { cachePurgeSingle } from "../../utils/cachePurge";

export const handleUserUpload = async (c) => {
  const galleryName = c.req.param("galleryTableName");

  // 1. Fetch gallery details to verify UploadPasscode
  const { results: galleries } = await getGalleriesFromD1(c);
  const gallery = galleries?.find(
    (elem) => elem.GalleryTableName === galleryName
  );

  if (!gallery) {
    return c.json(
      {
        DB: {
          success: false,
          error: "Gallery not found",
        },
      },
      404
    );
  }

  // 2. Ensure an UploadPasscode is configured for this gallery
  if (!gallery.UploadPasscode || gallery.UploadPasscode.trim() === "") {
    return c.json(
      {
        DB: {
          success: false,
          error: "Guest uploads are not enabled for this gallery.",
        },
      },
      403
    );
  }

  const formData = await c.req.parseBody();
  const submittedPasscode = formData["passcode"];

  // 3. Verify the passcode
  if (
    !submittedPasscode ||
    String(submittedPasscode).trim() !== String(gallery.UploadPasscode).trim()
  ) {
    return c.json(
      {
        DB: {
          success: false,
          error: "Invalid upload passcode",
        },
      },
      401
    );
  }

  const file = formData["file"];
  const width = formData["width"] || 0;
  const height = formData["height"] || 0;
  const hash = formData["hash"] || "";
  const dateCreated = formData["dateCreated"] || Math.floor(Date.now() / 1000);
  const dateModified = formData["dateModified"] || Math.floor(Date.now() / 1000);

  if (!(file instanceof File)) {
    return c.json(
      {
        DB: {
          success: false,
          error: "Invalid file uploaded",
        },
      },
      400
    );
  }

  // Check file size (100MB limit)
  if (file.size > 100 * 1024 * 1024) {
    return c.json(
      {
        DB: {
          success: false,
          error: "File too large. Maximum 100MB allowed.",
        },
      },
      400
    );
  }

  const fileBuffer = await file.arrayBuffer();
  const fullName = file.name;
  const ext = fullName.split(".").pop();
  const orgName = fullName.split(".").shift();
  const newName = orgName + "_" + hash.toString().slice(0, 10);
  const path = `galleries/${galleryName}/${newName}.${ext}`;

  try {
    // Upload to Cloudflare R2
    const r2Response = await c.env.R2.put(path, fileBuffer);

    // Add to gallery database with approved = TRUE
    const { success } = await addImageToIndywidualGallery(
      c,
      galleryName,
      orgName,
      width,
      height,
      hash,
      path,
      dateCreated,
      dateModified
    );

    if (!success) {
      // Rollback R2 upload if database insert fails
      await c.env.R2.delete(path);
      throw new Error("Database insert failed");
    }

    // Purge cache for this single gallery so new photos show immediately upon refresh
    await cachePurgeSingle(c, galleryName);

    return c.json({
      image: {
        url: r2Response.key,
      },
      DB: {
        success: true,
        error: null,
      },
    });
  } catch (error) {
    console.error("Guest upload error:", error);
    return c.json(
      {
        image: {
          url: null,
        },
        DB: {
          success: false,
          error: error.message,
        },
      },
      500
    );
  }
};

