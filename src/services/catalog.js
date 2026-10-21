// Public catalogue reads. Uses Supabase (RLS: only active/visible rows) when configured,
// otherwise falls back to the read-only demo catalogue so the design can be previewed.
import { supabase, isConfigured } from '../lib/supabase';
import { demoCategories, demoProducts, demoBanners, defaultSettings, defaultPages } from '../data/demo';

const PRODUCT_SELECT = '*, category:categories(id, slug, name), images:product_images(id, url, alt, position), variants:product_variants(id, sku, size, color, price, stock, is_active, position)';

export function normalizeProduct(p, ratings) {
  if (!p) return null;
  const images = [...(p.images || [])].sort((a, b) => a.position - b.position);
  const variants = [...(p.variants || [])].filter((v) => v.is_active !== false).sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  const stock = variants.reduce((s, v) => s + (v.stock || 0), 0);
  const sizes = [...new Set(variants.map((v) => v.size).filter(Boolean))];
  const colors = [...new Set(variants.map((v) => v.color).filter(Boolean))];
  const r = ratings?.[p.id];
  return {
    ...p,
    price: Number(p.price),
    compare_at_price: p.compare_at_price ? Number(p.compare_at_price) : null,
    category: p.category || demoCategories.find((c) => c.id === p.category_id) || null,
    images,
    image: images[0]?.url || '',
    variants,
    stock,
    sizes,
    colors,
    avg_rating: r?.avg_rating ? Number(r.avg_rating) : null,
    review_count: r?.review_count || 0,
  };
}

async function ratingsFor(ids) {
  if (!isConfigured || !ids.length) return {};
  const { data } = await supabase.from('product_rating_stats').select('*').in('product_id', ids);
  return Object.fromEntries((data || []).map((r) => [r.product_id, r]));
}

function demoFilter(list, f) {
  let out = list.filter((p) => p.status === 'active');
  if (f.category) {
    const c = demoCategories.find((x) => x.slug === f.category);
    out = out.filter((p) => p.category_id === c?.id);
  }
  if (f.q) {
    const q = f.q.toLowerCase();
    out = out.filter((p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
  }
  if (f.featured) out = out.filter((p) => p.is_featured);
  if (f.newArrival) out = out.filter((p) => p.is_new_arrival);
  if (f.bestSeller) out = out.filter((p) => p.is_best_seller);
  if (f.sale) out = out.filter((p) => p.compare_at_price && p.compare_at_price > p.price);
  if (f.min) out = out.filter((p) => p.price >= f.min);
  if (f.max) out = out.filter((p) => p.price <= f.max);
  return out;
}

function sortList(list, sort) {
  const s = [...list];
  switch (sort) {
    case 'price-asc': return s.sort((a, b) => a.price - b.price);
    case 'price-desc': return s.sort((a, b) => b.price - a.price);
    case 'popular': return s.sort((a, b) => b.sold_count - a.sold_count);
    case 'rating': return s.sort((a, b) => (b.avg_rating || 0) - (a.avg_rating || 0));
    case 'name': return s.sort((a, b) => a.name.localeCompare(b.name));
    default: return s.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }
}

/**
 * Fetch products. Filters: category(slug), q, featured, newArrival, bestSeller, sale, min, max, sort, limit, ids
 * Size / colour / availability filtering happens client-side over the variant data.
 */
export async function fetchProducts(f = {}) {
  if (!isConfigured) {
    let list = demoFilter(demoProducts, f).map((p) => normalizeProduct(p));
    if (f.ids) list = list.filter((p) => f.ids.includes(p.id));
    list = sortList(list, f.sort);
    return f.limit ? list.slice(0, f.limit) : list;
  }
  let q = supabase.from('products').select(PRODUCT_SELECT).eq('status', 'active');
  if (f.category) {
    const { data: c } = await supabase.from('categories').select('id').eq('slug', f.category).maybeSingle();
    if (!c) return [];
    q = q.eq('category_id', c.id);
  }
  if (f.q) {
    const term = f.q.replace(/[%,()]/g, ' ').trim();
    q = q.or(`name.ilike.%${term}%,description.ilike.%${term}%`);
  }
  if (f.featured) q = q.eq('is_featured', true);
  if (f.newArrival) q = q.eq('is_new_arrival', true);
  if (f.bestSeller) q = q.eq('is_best_seller', true);
  if (f.min) q = q.gte('price', f.min);
  if (f.max) q = q.lte('price', f.max);
  if (f.ids) q = q.in('id', f.ids);
  if (f.sort === 'price-asc') q = q.order('price', { ascending: true });
  else if (f.sort === 'price-desc') q = q.order('price', { ascending: false });
  else if (f.sort === 'popular') q = q.order('sold_count', { ascending: false });
  else if (f.sort === 'name') q = q.order('name');
  else q = q.order('created_at', { ascending: false });
  if (f.limit && !f.sale && f.sort !== 'rating') q = q.limit(f.limit);
  const { data, error } = await q;
  if (error) throw error;
  const ratings = await ratingsFor((data || []).map((p) => p.id));
  let list = (data || []).map((p) => normalizeProduct(p, ratings));
  if (f.sale) list = list.filter((p) => p.compare_at_price && p.compare_at_price > p.price);
  if (f.sort === 'rating') list = sortList(list.filter((p) => p.avg_rating), 'rating');
  return f.limit ? list.slice(0, f.limit) : list;
}

export async function fetchTopRated(limit = 10) {
  if (!isConfigured) return []; // no genuine reviews in demo mode
  const { data } = await supabase.from('product_rating_stats').select('*').order('avg_rating', { ascending: false }).limit(limit * 2);
  const ids = (data || []).map((r) => r.product_id);
  if (!ids.length) return [];
  const list = await fetchProducts({ ids });
  return list.sort((a, b) => (b.avg_rating || 0) - (a.avg_rating || 0)).slice(0, limit);
}

export async function fetchProduct(slug) {
  if (!isConfigured) return normalizeProduct(demoProducts.find((p) => p.slug === slug));
  const { data, error } = await supabase.from('products').select(PRODUCT_SELECT).eq('slug', slug).eq('status', 'active').maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return normalizeProduct(data, await ratingsFor([data.id]));
}

export async function fetchReviews(productId) {
  if (!isConfigured) return [];
  const { data } = await supabase.from('product_reviews').select('id, name, rating, comment, created_at').eq('product_id', productId).eq('is_approved', true).order('created_at', { ascending: false }).limit(30);
  return data || [];
}

export async function submitReview(review) {
  if (!isConfigured) throw new Error('Reviews are available once the store database is connected.');
  const { error } = await supabase.from('product_reviews').insert({ ...review, is_approved: false });
  if (error) throw error;
}

export async function fetchStoreBootstrap() {
  if (!isConfigured) {
    return { settings: defaultSettings, categories: demoCategories, banners: demoBanners, demo: true };
  }
  const [s, c, b] = await Promise.all([
    supabase.from('site_settings').select('data').eq('id', 1).maybeSingle(),
    supabase.from('categories').select('*').eq('is_visible', true).order('position'),
    supabase.from('banners').select('*').eq('is_active', true).order('position'),
  ]);
  return {
    settings: { ...defaultSettings, ...(s.data?.data || {}) },
    categories: c.data || [],
    banners: b.data || [],
    demo: false,
  };
}

export async function fetchPage(slug) {
  if (!isConfigured) return defaultPages.find((p) => p.slug === slug) || null;
  const { data } = await supabase.from('pages').select('*').eq('slug', slug).eq('is_published', true).maybeSingle();
  return data;
}

export async function subscribeNewsletter(email) {
  if (!isConfigured) throw new Error('Newsletter sign-up is available once the store database is connected.');
  const { error } = await supabase.from('newsletter_subscribers').insert({ email: email.trim().toLowerCase() });
  if (error && error.code !== '23505') throw new Error('Please enter a valid email address.');
}

export async function checkPromo(code, subtotal) {
  if (!isConfigured) return { valid: false, message: 'Promo codes work once the store database is connected.' };
  const { data, error } = await supabase.rpc('check_promo', { p_code: code, p_subtotal: subtotal });
  if (error) return { valid: false, message: 'Could not check this code.' };
  return data;
}

export async function placeOrder(payload) {
  if (!isConfigured) {
    throw new Error('Checkout is disabled in demo preview. Connect Supabase and deploy to Netlify to accept orders.');
  }
  const res = await fetch('/api/place-order', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
  let body = {};
  try { body = await res.json(); } catch { /* non-JSON */ }
  if (!res.ok) {
    const err = new Error(body.error || (res.status === 404 ? 'Order service not found. Make sure the site is deployed on Netlify (or run `netlify dev`).' : 'Could not place order.'));
    err.code = body.code;
    throw err;
  }
  return body.order;
}
