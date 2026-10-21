import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { defaultSettings } from '../data/demo';
import { must } from './lib';

/** Load / edit / save the single site_settings row. */
export function useSettings() {
  const [settings, setSettings] = useState(null);
  const [saved, setSaved] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    supabase.from('site_settings').select('data').eq('id', 1).maybeSingle().then(({ data, error: e }) => {
      if (e) return setError(e.message);
      const s = { ...defaultSettings, ...(data?.data || {}) };
      setSettings(s); setSaved(s);
    });
  }, []);

  const set = useCallback((k, v) => setSettings((s) => ({ ...s, [k]: v })), []);
  const save = useCallback(async (override) => {
    setSaving(true);
    try {
      const data = override || settings;
      must(await supabase.from('site_settings').upsert({ id: 1, data }));
      setSaved(data);
      return true;
    } finally { setSaving(false); }
  }, [settings]);

  const dirty = settings && saved && JSON.stringify(settings) !== JSON.stringify(saved);
  return { settings, set, setSettings, save, saving, dirty, error };
}
