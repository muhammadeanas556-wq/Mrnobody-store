import { supabase, MEDIA_BUCKET } from '../lib/supabase';

/** Resize + compress an image in the browser before upload (keeps storage & page weight low). */
export async function compressImage(file, maxSide = 1600, quality = 0.82) {
  if (!file.type.startsWith('image/') || file.type === 'image/svg+xml' || file.type === 'image/gif' || file.type === 'image/x-icon') return file;
  const bmp = await createImageBitmap(file).catch(() => null);
  if (!bmp) return file;
  const scale = Math.min(1, maxSide / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bmp.width * scale);
  canvas.height = Math.round(bmp.height * scale);
  canvas.getContext('2d').drawImage(bmp, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise((r) => canvas.toBlob(r, 'image/webp', quality));
  if (!blob || blob.size > file.size) return file;
  return new File([blob], file.name.replace(/\.\w+$/, '') + '.webp', { type: 'image/webp' });
}

/** Upload to Supabase Storage (admin-only by storage policy). Returns { url, path }. */
export async function uploadImage(file, folder = 'products') {
  if (file.size > 8 * 1024 * 1024) throw new Error(`${file.name} is larger than 8 MB.`);
  const f = await compressImage(file);
  const ext = (f.name.split('.').pop() || 'jpg').toLowerCase();
  const path = `${folder}/${new Date().toISOString().slice(0, 7)}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(MEDIA_BUCKET).upload(path, f, { cacheControl: '31536000', contentType: f.type, upsert: false });
  if (error) throw new Error(`Upload failed: ${error.message}`);
  const { data } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path);
  return { url: data.publicUrl, path };
}

export async function removeStorageFiles(paths) {
  const list = paths.filter(Boolean);
  if (list.length) await supabase.storage.from(MEDIA_BUCKET).remove(list);
}

/** Throws a readable error from a Supabase response. */
export function must({ data, error }) {
  if (error) {
    if (error.code === '23505') throw new Error('That value is already in use (must be unique).');
    if (error.code === '42501' || /row-level security/i.test(error.message)) throw new Error('Not authorised. Please sign in again as admin.');
    throw new Error(error.message);
  }
  return data;
}

export function toCSV(rows) {
  if (!rows.length) return '';
  const cols = Object.keys(rows[0]);
  const esc = (v) => {
    const s = v == null ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [cols.join(','), ...rows.map((r) => cols.map((c) => esc(r[c])).join(','))].join('\n');
}

export function download(name, text, type = 'text/csv') {
  const url = URL.createObjectURL(new Blob(['﻿' + text], { type }));
  const a = Object.assign(document.createElement('a'), { href: url, download: name });
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
