import { html } from 'hono/html'

// Around Google's general max length for a description tag
const MAX_DESC_LENGTH = 150;

export const SocialMetaTags = (props) => {
    const url = props.url;
    const title = props.title;
    const desc = (props.desc.length > MAX_DESC_LENGTH) ? props.desc.slice(0, MAX_DESC_LENGTH) + "..." : props.desc;
    const {origin} = new URL(url);
    
    return html`
        <meta name="title" content="${title}" />
        <meta name="description" content="${desc}" />
        
        <meta property="og:type" content="website" />
        <meta property="og:url" content="${url}" />
        <meta property="og:title" content="${title}" />
        <meta property="og:description" content="${desc}" />
        <meta property="og:image" content="${origin}/meta-card.png" />
        
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="${url}" />
        <meta property="twitter:title" content="${title}" />
        <meta property="twitter:description" content="${desc}" />
        <meta property="twitter:image" content="${origin}/meta-card.png" />
        <link rel="icon" type="image/png" href="${origin}/static/images/logo.png" />
        <link rel="shortcut icon" href="${origin}/static/images/logo.png" />
        <link rel="apple-touch-icon" href="${origin}/static/images/logo.png" />
        <link rel="manifest" href="${origin}/site.webmanifest" />
    `;
};