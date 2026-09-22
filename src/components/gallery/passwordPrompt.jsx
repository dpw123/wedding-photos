import { Layout } from "./layout";

export const PasswordPrompt = ({ galleryName, error, c }) => (
  <Layout title={galleryName} c={c}>
    <section>
      <div className="gallery-controls">
        <a href="./" className="button">
          <i className="bi bi-arrow-left"></i> {c.t("all_albums_link")}
        </a>
      </div>
      <article className="password">
        <div className="password-box-header">
          <div className="monogram">Private Album</div>
          <h2>{galleryName}</h2>
          <div className="decorative-line"></div>
          <p style="color: var(--color-pink-dark); font-weight: 600;">{c.t("gallery_password_required")}</p>
          {error && <div style="margin-top: 0.5rem;"><strong className="error">{error}</strong></div>}
        </div>
        <form className="password" method="POST">
          <label htmlFor="galleryPasswordInput">
            <input
              id="galleryPasswordInput"
              type="password"
              name="password"
              className="form-control"
              placeholder={c.t("enter_password")}
              required
              autocomplete="current-password"
            />
          </label>
          <button type="submit" className="button primary full-width">
            <i className="bi bi-unlock"></i> {c.t("open_gallery")}
          </button>
        </form>
      </article>
    </section>
  </Layout>
);
