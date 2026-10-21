import { useState } from 'react';

const FALLBACK = `data:image/svg+xml;utf8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><rect width="400" height="400" fill="#EEF2F6"/><path d="M170 228v-56h12l18 24 18-24h12v56h-13v-34l-17 22-17-22v34z" fill="#C9D2DD"/></svg>',
)}`;

/** Lazy image with graceful fallback and fade-in. */
export default function Img({ src, alt = '', className = '', eager = false, sizes, ...rest }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const real = !failed && src ? src : FALLBACK;
  const srcSet = !failed && src?.includes('images.unsplash.com')
    ? [400, 700, 1000].map((w) => `${src.replace(/w=\d+/, `w=${w}`)} ${w}w`).join(', ')
    : undefined;
  return (
    <img
      src={real}
      srcSet={srcSet}
      sizes={srcSet ? sizes || '(max-width: 640px) 50vw, 20vw' : undefined}
      alt={alt}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      fetchpriority={eager ? 'high' : undefined}
      onLoad={() => setLoaded(true)}
      onError={() => { setFailed(true); setLoaded(true); }}
      className={`${className} transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
      {...rest}
    />
  );
}
