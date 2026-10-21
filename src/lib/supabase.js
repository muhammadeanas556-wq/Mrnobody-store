import { createClient } from '@supabase/supabase-js';

// Public values (safe to publish — data is protected by Row Level Security).
// Netlify environment variables override these if set.
const url = import.meta.env.VITE_SUPABASE_URL || 'https://ozuuejpgnosmgdagmuuk.supabase.co';
const anon =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im96dXVlanBnbm9zbWdkYWdtdXVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI1OTc4MzEsImV4cCI6MjEwODE3MzgzMX0.Z4kgVUDJtzuGTWMrzE4XSPNWRJ9Ke7BWnoxeStesAwQ';

/** True when Supabase connection details are present. */
export const isConfigured = Boolean(url && anon);

/** Browser client — uses the public anon key only. All access is governed by RLS. */
export const supabase = isConfigured
  ? createClient(url, anon, { auth: { persistSession: true, autoRefreshToken: true, storageKey: 'mrnobody-admin-auth' } })
  : null;

export const MEDIA_BUCKET = 'store-media';
