import { Layout } from "./layout";
import {
  getGalleriesFromD1wGalleryIsPublic,
  upcomingPublicationDate,
} from "../../utils/db";
import { getImageWithTransforms } from "../../utils/galleryPath";

export const main = async (c) => {
  const [galleriesResponse, upcomingPublicationResponse] = await Promise.all([
    getGalleriesFromD1wGalleryIsPublic(c),
    upcomingPublicationDate(c),
  ]);

  const upcomingPublication = upcomingPublicationResponse?.results[0]?.PublicationDate ?? undefined;

  // in case of error or while initial run
  if (typeof galleriesResponse === "string") {
    console.log(galleriesResponse);
    return c.text(galleriesResponse, 202);
  }

  const { results: rawGalleries } = galleriesResponse;
  const hasGalleries = rawGalleries.length != 0;

  // Resolve cover image: use selected CoverImage or default to the first image in the album
  const galleries = await Promise.all(
    rawGalleries.map(async (gallery) => {
      let cover = gallery.CoverImage;
      if (!cover || cover.trim() === "") {
        try {
          const firstImage = await c.env.DB.prepare(
            `SELECT path FROM ${gallery.GalleryTableName} WHERE approved = TRUE ORDER BY rowid ASC LIMIT 1`
          ).first();
          if (firstImage && firstImage.path) {
            cover = firstImage.path;
          }
        } catch (e) {
          console.error("Error retrieving fallback cover image:", e);
        }
      }
      return {
        ...gallery,
        CoverImage: cover || "",
      };
    })
  );

  // Append context with date for the upcoming publication date
  c.set('KV-Cache-Expires', upcomingPublication);

  const isEmbed = c.req.path === '/embed' || c.req.query('embed') === 'true';

  return c.html(
    <Layout
      title={c.env.PAGE_TITLE}
      c={c}
      prefetch={hasGalleries ? "listing" : "none"}
      isEmbed={isEmbed}
    >
      <section>
        <div>
          {galleries.length == 0 ? (
            <div className="no-images-container text-center py-5" style="text-align: center; padding: 2.5rem 1rem;">
              <p className="text-muted" style="color: var(--color-green-dark); margin: 0;">
                {c.t("no_galleries_message")}{" "}
                {!isEmbed && (
                  <span>
                    <a href="./admin">{c.t("admin_link")}</a>{" "}
                    {c.t("create_gallery_message")}
                  </span>
                )}
              </p>
            </div>
          ) : (
            <div className="galleries-grid">
              {galleries.map((gallery) => (
                <a
                  href={"/" + gallery.GalleryTableName}
                  target={isEmbed ? "_blank" : undefined}
                  rel={isEmbed ? "noopener noreferrer" : undefined}
                  className="gallery-card"
                  key={gallery.GalleryTableName}
                >
                  {gallery.CoverImage !== "" ? (
                    <img
                      src={getImageWithTransforms(
                        c,
                        gallery.CoverImage,
                        "cover"
                      )}
                      alt={gallery.GalleryName}
                      width="433px"
                      height="220px"
                      className="gallery-card-image"
                    />
                  ) : (
                    <div
                      className="gallery-card-image"
                      style="display: flex; flex-direction: column; align-items: center; justify-content: center; background: var(--color-pink-light); color: var(--color-pink-dark);"
                    >
                      <i className="bi bi-images" style="font-size: 2.5rem; margin-bottom: 0.3rem;"></i>
                      <span style="font-size: 0.85rem; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Wedding Album</span>
                    </div>
                  )}
                  <div className="gallery-content">
                    <h2 className="gallery-name">{gallery.GalleryName}</h2>
                    {gallery.PartyDate && (
                      <div className="gallery-date">
                        <span className="pill">
                          <i className="bi bi-calendar-event"></i>
                          {new Date(gallery.PartyDate).toLocaleDateString(
                            c.t("date_locale"),
                            { day: "numeric", month: "long", year: "numeric" }
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};
