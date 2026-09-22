import { html } from 'hono/html';

export const HeadScripts = () => {
    return html`
        <script>
            (function() {
                try {
                    localStorage.removeItem('picoPreferredColorScheme');
                } catch (e) {}
                document.documentElement.setAttribute('data-theme', 'light');
            })();
        </script>
    `;
};