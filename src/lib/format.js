const nf = new Intl.NumberFormat('en-PK', { maximumFractionDigits: 0 });

export const pkr = (n) => `Rs. ${nf.format(Math.round(Number(n) || 0))}`;

export const discountPct = (price, compare) =>
  compare && Number(compare) > Number(price) ? Math.round((1 - Number(price) / Number(compare)) * 100) : 0;

export const slugify = (s) =>
  String(s || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 80);

export const fmtDate = (d, opts = { dateStyle: 'medium' }) =>
  d ? new Intl.DateTimeFormat('en-PK', { ...opts, timeZone: 'Asia/Karachi' }).format(new Date(d)) : '';

export const variantLabel = (v) => [v?.color, v?.size].filter(Boolean).join(' / ');

export const PROVINCES = [
  'Punjab',
  'Sindh',
  'Khyber Pakhtunkhwa',
  'Balochistan',
  'Islamabad Capital Territory',
  'Gilgit-Baltistan',
  'Azad Jammu & Kashmir',
];

export const normalizePhone = (p) => {
  let s = String(p || '').replace(/[\s-]/g, '');
  if (s.startsWith('+92')) s = '0' + s.slice(3);
  else if (s.startsWith('92') && s.length === 12) s = '0' + s.slice(2);
  return s;
};
export const isPkMobile = (p) => /^03\d{9}$/.test(normalizePhone(p));

export const ORDER_STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'];
export const STATUS_STYLE = {
  pending: 'bg-amber-50 text-amber-700 ring-amber-200',
  confirmed: 'bg-sky-50 text-sky-700 ring-sky-200',
  processing: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
  shipped: 'bg-violet-50 text-violet-700 ring-violet-200',
  delivered: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  cancelled: 'bg-rose-50 text-rose-700 ring-rose-200',
  returned: 'bg-gray-100 text-gray-700 ring-gray-200',
};

export function hexToRgb(hex) {
  const h = String(hex || '').replace('#', '');
  if (!/^[0-9a-f]{6}$/i.test(h)) return null;
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
}
export function applyTheme(hex) {
  const rgb = hexToRgb(hex) || [8, 123, 216];
  const dark = rgb.map((c) => Math.round(c * 0.82));
  const soft = rgb.map((c) => Math.round(c + (255 - c) * 0.9));
  const root = document.documentElement.style;
  root.setProperty('--brand', rgb.join(' '));
  root.setProperty('--brand-dark', dark.join(' '));
  root.setProperty('--brand-soft', soft.join(' '));
}
