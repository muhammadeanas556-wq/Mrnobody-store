import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useStore } from './StoreContext';
import { variantLabel } from '../lib/format';

const CartCtx = createContext(null);
const KEY = 'mrnobody-cart-v1';

const read = () => {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
};

export function CartProvider({ children }) {
  const { settings } = useStore();
  const [items, setItems] = useState(read);
  const [open, setOpen] = useState(false);
  const [pulse, setPulse] = useState(0);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(items)); } catch { /* storage full/blocked */ }
  }, [items]);

  // keep tabs in sync
  useEffect(() => {
    const onStorage = (e) => e.key === KEY && setItems(read());
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const add = useCallback((product, variant, qty = 1, { openDrawer = true } = {}) => {
    if (!variant) return;
    const price = Number(variant.price ?? product.price);
    setItems((cur) => {
      const ex = cur.find((i) => i.variant_id === variant.id);
      if (ex) {
        return cur.map((i) => (i.variant_id === variant.id ? { ...i, qty: Math.min(i.qty + qty, variant.stock), max: variant.stock, price } : i));
      }
      return [
        ...cur,
        {
          variant_id: variant.id,
          product_id: product.id,
          slug: product.slug,
          name: product.name,
          image: product.image || product.images?.[0]?.url || '',
          label: variantLabel(variant),
          price,
          compare: product.compare_at_price,
          qty: Math.min(qty, variant.stock),
          max: variant.stock,
        },
      ];
    });
    setPulse((p) => p + 1);
    setToast({ name: product.name, at: Date.now() });
    if (openDrawer) setOpen(true);
  }, []);

  const setQty = useCallback((variantId, qty) => {
    setItems((cur) => cur.map((i) => (i.variant_id === variantId ? { ...i, qty: Math.max(1, Math.min(qty, i.max || 50)) } : i)));
  }, []);
  const remove = useCallback((variantId) => setItems((cur) => cur.filter((i) => i.variant_id !== variantId)), []);
  const clear = useCallback(() => setItems([]), []);

  /** Re-sync cart with live product data (price / stock / availability). */
  const sync = useCallback((products) => {
    const byVariant = new Map();
    for (const p of products) for (const v of p.variants) byVariant.set(v.id, { p, v });
    const notes = [];
    setItems((cur) =>
      cur
        .map((i) => {
          const hit = byVariant.get(i.variant_id);
          if (!hit) { notes.push(`${i.name} is no longer available and was removed.`); return null; }
          const price = Number(hit.v.price ?? hit.p.price);
          const max = hit.v.stock;
          if (max <= 0) { notes.push(`${i.name}${i.label ? ` (${i.label})` : ''} is out of stock and was removed.`); return null; }
          if (price !== i.price) notes.push(`The price of ${i.name} has been updated.`);
          if (i.qty > max) notes.push(`Only ${max} of ${i.name} available — quantity adjusted.`);
          return { ...i, price, max, qty: Math.min(i.qty, max), image: hit.p.image || i.image, name: hit.p.name };
        })
        .filter(Boolean),
    );
    return notes;
  }, []);

  const totals = useMemo(() => {
    const count = items.reduce((s, i) => s + i.qty, 0);
    const subtotal = items.reduce((s, i) => s + i.qty * i.price, 0);
    const threshold = Number(settings.free_shipping_threshold || 0);
    const fee = Number(settings.delivery_fee || 0);
    const delivery = !items.length ? 0 : threshold > 0 && subtotal >= threshold ? 0 : fee;
    return { count, subtotal, delivery, total: subtotal + delivery, threshold, remainingForFree: threshold > 0 ? Math.max(0, threshold - subtotal) : 0 };
  }, [items, settings.delivery_fee, settings.free_shipping_threshold]);

  return (
    <CartCtx.Provider value={{ items, add, setQty, remove, clear, sync, open, setOpen, pulse, toast, setToast, ...totals }}>
      {children}
    </CartCtx.Provider>
  );
}

export const useCart = () => useContext(CartCtx);
