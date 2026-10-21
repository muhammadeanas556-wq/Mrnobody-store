import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, Save } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAsync } from '../hooks/useAsync';
import { PageHeader, Empty, useToast, Panel } from './ui';
import { must } from './lib';
import { fmtDate, variantLabel } from '../lib/format';
import { PageLoader, ErrorNote } from '../components/ui/States';

export default function Inventory() {
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const low = params.get('low') === '1';
  const [q, setQ] = useState('');
  const [edits, setEdits] = useState({});
  const [saving, setSaving] = useState(false);
  const { data, loading, error, reload } = useAsync(async () => {
    const [v, m] = await Promise.all([
      supabase.from('product_variants').select('id, sku, size, color, stock, is_active, product:products(id, name, status)').order('stock'),
      supabase.from('inventory_movements').select('id, change, reason, created_at, variant:product_variants(size, color, product:products(name))').order('created_at', { ascending: false }).limit(25),
    ]);
    return { variants: must(v), moves: must(m) };
  }, []);

  const list = useMemo(() => {
    if (!data) return [];
    const t = q.trim().toLowerCase();
    return data.variants.filter((v) => v.product && v.product.status !== 'archived' && (!low || v.stock <= 3) && (!t || v.product.name.toLowerCase().includes(t) || (v.sku || '').toLowerCase().includes(t)));
  }, [data, q, low]);

  if (loading) return <PageLoader />;
  if (error) return <ErrorNote>{error.message}</ErrorNote>;

  const dirty = Object.keys(edits).length;
  const saveAll = async () => {
    setSaving(true);
    try {
      const moves = [];
      for (const [id, val] of Object.entries(edits)) {
        const before = data.variants.find((v) => v.id === id);
        const n = Number(val);
        if (!Number.isInteger(n) || n < 0) throw new Error('Stock must be a whole number ≥ 0');
        must(await supabase.from('product_variants').update({ stock: n }).eq('id', id));
        if (before.stock !== n) moves.push({ variant_id: id, change: n - before.stock, reason: n > before.stock ? 'restock' : 'adjustment' });
      }
      if (moves.length) await supabase.from('inventory_movements').insert(moves);
      toast(`Updated ${moves.length} stock level${moves.length === 1 ? '' : 's'}`);
      setEdits({}); reload();
    } catch (x) { toast(x.message, 'error'); } finally { setSaving(false); }
  };

  return (
    <>
      <PageHeader title="Inventory" subtitle="Stock is tracked per variant and deducted automatically when orders are placed." actions={
        <button onClick={saveAll} disabled={!dirty || saving} className="btn-primary btn-sm"><Save size={14} /> Save {dirty || ''} change{dirty === 1 ? '' : 's'}</button>
      } />
      <div className="card mb-4 flex flex-wrap items-center gap-3 p-3">
        <div className="relative min-w-[200px] flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input h-10 pl-9" placeholder="Search by product or SKU…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search inventory" />
        </div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4 accent-[rgb(var(--brand))]" checked={low} onChange={(e) => setParams(e.target.checked ? { low: '1' } : {})} /> Low stock only (≤ 3)</label>
      </div>
      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        {!list.length ? <Empty>No variants match.</Empty> : (
          <div className="card overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead><tr className="border-b border-line text-left text-xs uppercase tracking-wider text-gray-500"><th className="px-4 py-3">Product</th><th className="px-3 py-3">Variant</th><th className="px-3 py-3">SKU</th><th className="px-4 py-3">Stock</th></tr></thead>
              <tbody>
                {list.map((v) => {
                  const val = edits[v.id] ?? v.stock;
                  return (
                    <tr key={v.id} className="border-b border-line/60 last:border-0">
                      <td className="px-4 py-2.5"><Link to={`/admin/products/${v.product.id}`} className="font-medium hover:text-brand">{v.product.name}</Link>{v.product.status !== 'active' && <span className="ml-2 text-xs text-gray-400">({v.product.status})</span>}</td>
                      <td className="px-3 py-2.5 text-gray-600">{variantLabel(v) || 'Standard'}</td>
                      <td className="px-3 py-2.5 text-xs text-gray-500">{v.sku || '—'}</td>
                      <td className="px-4 py-2.5">
                        <input className={`input h-9 w-24 ${Number(val) === 0 ? 'border-rose-300 text-sale' : Number(val) <= 3 ? 'border-amber-300' : ''}`} inputMode="numeric" value={val} aria-label={`Stock for ${v.product.name} ${variantLabel(v)}`}
                          onChange={(e) => { const s = e.target.value.replace(/\D/g, ''); setEdits((x) => { const n = { ...x }; if (String(v.stock) === s) delete n[v.id]; else n[v.id] = s; return n; }); }} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <Panel title="Recent stock movements">
          {!data.moves.length ? <p className="text-sm text-gray-500">No movements yet.</p> : (
            <ul className="space-y-2.5 text-sm">
              {data.moves.map((m) => (
                <li key={m.id} className="flex justify-between gap-3">
                  <span className="min-w-0"><span className="block truncate">{m.variant?.product?.name || 'Deleted variant'}</span><span className="text-xs capitalize text-gray-400">{m.reason} · {fmtDate(m.created_at, { dateStyle: 'short', timeStyle: 'short' })}</span></span>
                  <b className={m.change > 0 ? 'text-emerald-600' : 'text-sale'}>{m.change > 0 ? '+' : ''}{m.change}</b>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}
