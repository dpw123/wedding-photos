import { html } from 'hono/html';
import { SocialMetaTags } from '../utils/metaTags';
import { PreloadAssets } from '../utils/preloader';
import { HeadScripts } from '../utils/headScripts';
import { getPicoCSS } from '../../utils/getPicoCSS';

export const Layout = (props) => {
  const c = props.c;
  const prefetchType = props.prefetch;
  const desc = props.desc || c.env.DESCRIPTION;
  const gallery = props.gallery;

  const isSingleGallery = !!gallery;
  const bannerTitle = isSingleGallery ? gallery.GalleryName : "Wedding Photo Gallery";
  const bannerDate = isSingleGallery && gallery.PartyDate ? new Date(gallery.PartyDate).toLocaleDateString(c.t("date_locale"), { day: "numeric", month: "long", year: "numeric" }) : null;

  return (
    html`
    <!DOCTYPE html>
    <html data-theme="light" lang=${c.t()}>
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
        <title>${props.title ? `${props.title} | Lauren & Daniel` : 'Lauren & Daniel | Wedding Gallery'}</title>
        ${<SocialMetaTags title={props.title} desc={desc} url={c.req.url} />}
        ${<PreloadAssets type={prefetchType} c={c} />}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
        <link href="https://fonts.googleapis.com/css2?family=WindSong:wght@400;500&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" />
        <link rel="stylesheet" href="${getPicoCSS(c)}" />
        <link rel="stylesheet" href="/static/style.css" />
        <link rel="stylesheet" href="/static/gallery.css" />
        <link rel="stylesheet" href="/static/photoswipe.css" />
        ${<HeadScripts />}
      </head>
      <body>
        <a href="https://danlauren.wedding" aria-label="Return to wedding website">
          <img class="site-logo" src="/static/images/logo.png" alt="Wedding Logo" />
        </a>

        <header class="wedding-header">
          <div class="wedding-hero">
            <h1 class="wedding-title-compact">
              ${isSingleGallery ? bannerTitle : html`<a href="/" style="color: inherit; text-decoration: none;">Wedding Photo Gallery</a>`}
            </h1>
            ${bannerDate ? html`
              <div class="wedding-date" style="margin-top: 0.2rem; margin-bottom: 0.3rem;">
                <span class="pill"><i class="bi bi-calendar-event"></i> ${bannerDate}</span>
              </div>
            ` : ''}
            <div class="decorative-line"></div>
            <nav class="button-row" aria-label="Gallery navigation">
              <a class="button" href="https://danlauren.wedding">
                <i class="bi bi-arrow-left"></i> ${c.t("wedding_website_link")}
              </a>
              <a class="button" href="/">
                <i class="bi bi-images"></i> ${c.t("all_albums_link")}
              </a>
              ${isSingleGallery && gallery.Password ? html`
                <a class="button" href="/${gallery.GalleryTableName}/logout">
                  ${c.t("forget_gallery_password")}
                </a>
              ` : ''}
            </nav>
          </div>
        </header>

        <main>
          ${props.children}
        </main>

        <footer>
          <hr />
          <div>Made with love for family and friends.</div>
          <div style="font-weight: 600; margin-top: 0.35rem;">Lauren Cheveralls &amp; Daniel Welch &bull; 31 August 2027</div>
          <div class="footer-credits">
            <a href="/admin">Admin Panel</a>
          </div>
        </footer>
      </body>
    </html>`
  );
};
