import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { fetchStoreBootstrap } from '../services/catalog';
import { defaultSettings } from '../data/demo';
import { applyTheme } from '../lib/format';

const StoreCtx = createContext(null);

export function StoreProvider({ children }) {
  const [state, setState] = useState({ settings: defaultSettings, categories: [], banners: [], demo: false, loading: true, error: null });

  const load = useCallback(async () => {
    try {
      const data = await fetchStoreBootstrap();
      setState({ ...data, loading: false, error: null });
    } catch (e) {
      setState((s) => ({ ...s, loading: false, error: e.message }));
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    applyTheme(state.settings.primary_color);
    if (state.settings.favicon_url) {
      const link = document.querySelector('link[rel="icon"]');
      if (link) link.href = state.settings.favicon_url;
    }
    document.documentElement.dataset.radius = state.settings.button_radius || 'md';
    document.documentElement.style.setProperty('--font-display', `"${state.settings.heading_font || 'Poppins'}"`);
  }, [state.settings]);

  return <StoreCtx.Provider value={{ ...state, reload: load }}>{children}</StoreCtx.Provider>;
}

export const useStore = () => useContext(StoreCtx);
