// POST /api/place-order
// The browser sends only customer details + [{variant_id, quantity}].
// Prices, stock, delivery fee and promo discounts are recalculated inside
// the Postgres function public.place_order(), which only the service role may call.
import { createClient } from '@supabase/supabase-js';

const json = (status, body) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

export default async (req) => {
  if (req.method !== 'POST') return json(405, { error: 'Method not allowed' });

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return json(503, { error: 'Ordering is not configured yet. The store owner needs to set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Netlify.' });

  let body;
  try {
    body = await req.json();
  } catch {
    return json(400, { error: 'Invalid request.' });
  }

  // Honeypot for simple bots
  if (body.website) return json(400, { error: 'Invalid request.' });

  const items = Array.isArray(body.items) ? body.items : [];
  if (!items.length) return json(400, { error: 'Your cart is empty.' });
  if (items.length > 50) return json(400, { error: 'Too many items in one order.' });
  const clean = [];
  for (const it of items) {
    const q = Number.parseInt(it?.quantity, 10);
    if (!UUID.test(String(it?.variant_id)) || !Number.isFinite(q) || q < 1 || q > 50) {
      return json(400, { error: 'Your cart contains an invalid item. Please refresh and try again.' });
    }
    clean.push({ variant_id: it.variant_id, quantity: q });
  }

  const payload = {
    full_name: str(body.full_name, 80),
    phone: str(body.phone, 20),
    email: str(body.email, 120),
    province: str(body.province, 60),
    city: str(body.city, 60),
    address: str(body.address, 400),
    notes: str(body.notes, 500),
    promo_code: str(body.promo_code, 40),
    items: clean,
  };

  const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await supabase.rpc('place_order', { p: payload });

  if (error) {
    const m = /^(VALIDATION|STOCK|UNAVAILABLE|PROMO): (.*)$/s.exec(error.message || '');
    if (m) return json(m[1] === 'STOCK' ? 409 : 400, { error: m[2], code: m[1] });
    console.error('place_order failed', error);
    return json(500, { error: 'We could not place your order right now. Please try again in a moment.' });
  }
  return json(200, { order: data });
};
