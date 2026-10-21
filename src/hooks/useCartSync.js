import { useEffect, useState } from 'react';
import { useCart } from '../contexts/CartContext';
import { fetchProducts } from '../services/catalog';

/** Re-checks cart lines against live prices/stock when a cart or checkout page opens. */
export function useCartSync() {
  const { items, sync } = useCart();
  const [notes, setNotes] = useState([]);
  const [syncing, setSyncing] = useState(false);
  const ids = [...new Set(items.map((i) => i.product_id))].sort().join(',');
  useEffect(() => {
    if (!ids) return;
    let alive = true;
    setSyncing(true);
    fetchProducts({ ids: ids.split(',') })
      .then((products) => alive && setNotes(sync(products)))
      .catch(() => {})
      .finally(() => alive && setSyncing(false));
    return () => { alive = false; };
  }, [ids]); // eslint-disable-line react-hooks/exhaustive-deps
  return { notes, syncing };
}
