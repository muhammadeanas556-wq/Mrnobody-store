import { useEffect } from 'react';

function setMeta(attr, key, content) {
  if (!content) return;
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

/** Lightweight per-page SEO: title, description, OG tags and optional JSON-LD. */
export function useSEO({ title, description, image, jsonLd, noindex } = {}) {
  useEffect(() => {
    if (title) document.title = title;
    setMeta('name', 'description', description);
    setMeta('property', 'og:title', title);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:image', image);
    setMeta('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow');
    let script;
    if (jsonLd) {
      script = document.createElement('script');
      script.type = 'application/ld+json';
      script.text = JSON.stringify(jsonLd);
      document.head.appendChild(script);
    }
    return () => script?.remove();
  }, [title, description, image, noindex, JSON.stringify(jsonLd || null)]); // eslint-disable-line react-hooks/exhaustive-deps
}
