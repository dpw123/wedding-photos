export const ThemeSwitcher = (props) => {
    const c = props.c;
    return (
      <label id="theme-switcher" data-placement="left" data-tooltip={c.t("light_or_dark_mode")}>
        {/* theme switcher is rendered by the frontend js to avoid switching effect while reloading the page */}
      </label>
      
    );
};