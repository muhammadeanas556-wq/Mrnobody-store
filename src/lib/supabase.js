import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;

/** True when the public Supabase env vars are present. */
export const isConfigured = Boolean(url && anon);

/** Browser client — uses the public anon key only. All access is governed by RLS. */
export const supabase = isConfigured
  ? createClient(url, anon, { auth: { persistSession: true, autoRefreshToken: true, storageKey: 'mrnobody-admin-auth' } })
  : null;

export const MEDIA_BUCKET = 'store-media';
