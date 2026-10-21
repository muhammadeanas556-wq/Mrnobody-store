import { createContext, useCallback, useContext, useEffect, useState } from 'react';

const WishCtx = createContext(null);
const KEY = 'mrnobody-wishlist-v1';

export function WishlistProvider({ children }) {
  const [ids, setIds] = useState(() => {
    try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
  });
  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(ids)); } catch { /* ignore */ }
  }, [ids]);
  const toggle = useCallback((id) => setIds((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id])), []);
  const has = useCallback((id) => ids.includes(id), [ids]);
  return <WishCtx.Provider value={{ ids, toggle, has, count: ids.length }}>{children}</WishCtx.Provider>;
}

export const useWishlist = () => useContext(WishCtx);
