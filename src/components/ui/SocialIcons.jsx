// Simple, original line glyphs for social platforms (brand marks are not reproduced).
const base = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' };

export const FacebookIcon = (p) => (
  <svg {...base} {...p}><path d="M14 8h3V4h-3a4 4 0 0 0-4 4v3H7v4h3v6h4v-6h3l1-4h-4V8z" /></svg>
);
export const InstagramIcon = (p) => (
  <svg {...base} {...p}><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r=".6" fill="currentColor" /></svg>
);
export const TikTokIcon = (p) => (
  <svg {...base} {...p}><path d="M14 3v11.5a3.5 3.5 0 1 1-3.5-3.5" /><path d="M14 3c.5 2.8 2.3 4.5 5 4.8" /></svg>
);
export const YouTubeIcon = (p) => (
  <svg {...base} {...p}><rect x="2.5" y="5.5" width="19" height="13" rx="4" /><path d="M10 9.5v5l4.5-2.5z" fill="currentColor" /></svg>
);
export const WhatsAppIcon = (p) => (
  <svg {...base} {...p}><path d="M4 20l1.3-3.9A8 8 0 1 1 8 18.8z" /><path d="M9 9.5c.3 2.2 2.3 4.2 4.5 4.6l1.2-1.1 1.8.9-.3 1.5c-3.6.4-7.5-3.4-7.2-7.1l1.5-.3.8 1.8z" /></svg>
);
