// GET /sitemap.xml — built from live categories, products and pages.
import { createClient } from '@supabase/supabase-js';

export default async (req) => {
  const site = (process.env.SITE_URL || new URL(req.url).origin).replace(/\/$/, '');
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY; // public reads only, RLS applies
  const urls = ['/', '/shop'].map((p) => ({ loc: site + p }));

  if (url && key) {
    const sb = createClient(url, key, { auth: { persistSession: false } });
    const [cats, prods, pages] = await Promise.all([
      sb.from('categories').select('slug, updated_at'),
      sb.from('products').select('slug, updated_at').eq('status', 'active'),
      sb.from('pages').select('slug, updated_at'),
    ]);
    for (const c of cats.data || []) urls.push({ loc: `${site}/shop?category=${c.slug}`, lastmod: c.updated_at });
    for (const p of prods.data || []) urls.push({ loc: `${site}/product/${p.slug}`, lastmod: p.updated_at });
    for (const p of pages.data || []) urls.push({ loc: `${site}/page/${p.slug}`, lastmod: p.updated_at });
  }

  const esc = (s) => s.replace(/&/g, '&amp;');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map((u) => `  <url><loc>${esc(u.loc)}</loc>${u.lastmod ? `<lastmod>${u.lastmod.slice(0, 10)}</lastmod>` : ''}</url>`)
    .join('\n')}\n</urlset>`;
  return new Response(xml, { headers: { 'content-type': 'application/xml', 'cache-control': 'public, max-age=3600' } });
};
