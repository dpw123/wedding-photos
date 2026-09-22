import { html } from 'hono/html';

export const HeadScripts = () => {
    return html`
        <script>
            (function() {
            var theme = localStorage.getItem('picoPreferredColorScheme');
                if (!theme) {
                theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
            }
            document.documentElement.setAttribute('data-theme', theme);
            document.addEventListener('DOMContentLoaded', function() {
                if (theme === 'dark') {
                document.querySelector('input[name="color-mode-toggle"]').checked = true;
                }
            });
            })();
        </script>
    `;
};