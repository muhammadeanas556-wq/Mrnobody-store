import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAsync } from '../hooks/useAsync';
import { PageHeader, Field, Toggle, Empty, useToast } from './ui';
import { must } from './lib';
import { pkr, fmtDate } from '../lib/format';
import Modal from '../components/ui/Modal';
import { PageLoader, ErrorNote } from '../components/ui/States';

const toLocal = (d) => (d ? new Date(d).toISOString().slice(0, 16) : '');

export default function Promotions() {
  const toast = useToast();
  const [edit, setEdit] = useState(null);
  const { data, loading, error, reload } = useAsync(async () => must(await supabase.from('promotions').select('*').order('created_at', { ascending: false })), []);
  if (loading) return <PageLoader />;
  if (error) return <ErrorNote>{error.message}</ErrorNote>;

  const save = async (e) => {
    e.preventDefault();
    const value = Number(edit.value), min = Number(edit.min_order || 0);
    if (!/^[A-Z0-9_-]{3,30}$/.test(edit.code)) return toast('Code: 3–30 letters/numbers', 'error');
    if (!(value > 0) || (edit.discount_type === 'percent' && value > 90)) return toast('Enter a valid discount value (percent max 90)', 'error');
    const row = { code: edit.code, description: edit.description || null, discount_type: edit.discount_type, value, min_order: min, max_uses: edit.max_uses ? Number(edit.max_uses) : null,
      starts_at: edit.starts_at ? new Date(edit.starts_at).toISOString() : null, ends_at: edit.ends_at ? new Date(edit.ends_at).toISOString() : null, is_active: edit.is_active };
    try {
      if (edit.id) must(await supabase.from('promotions').update(row).eq('id', edit.id));
      else must(await supabase.from('promotions').insert(row));
      toast('Promotion saved'); setEdit(null); reload();
    } catch (x) { toast(x.message, 'error'); }
  };
  const remove = async (p) => { if (!confirm(`Delete code ${p.code}?`)) return; try { must(await supabase.from('promotions').delete().eq('id', p.id)); reload(); } catch (x) { toast(x.message, 'error'); } };
  const status = (p) => {
    const now = Date.now();
    if (!p.is_active) return ['Inactive', 'bg-gray-100 text-gray-600 ring-gray-200'];
    if (p.ends_at && new Date(p.ends_at) < now) return ['Expired', 'bg-rose-50 text-rose-700 ring-rose-200'];
    if (p.starts_at && new Date(p.starts_at) > now) return ['Scheduled', 'bg-sky-50 text-sky-700 ring-sky-200'];
    if (p.max_uses && p.used_count >= p.max_uses) return ['Used up', 'bg-amber-50 text-amber-700 ring-amber-200'];
    return ['Live', 'bg-emerald-50 text-emerald-700 ring-emerald-200'];
  };

  return (
    <>
      <PageHeader title="Promotions" subtitle="Promo codes customers can enter at checkout. Discounts are verified on the server." actions={
        <button onClick={() => setEdit({ code: '', description: '', discount_type: 'percent', value: '10', min_order: '0', max_uses: '', starts_at: '', ends_at: '', is_active: true })} className="btn-primary btn-sm"><Plus size={15} /> New code</button>
      } />
      <p className="mb-4 text-sm text-gray-500">For product-level sales, set an Original price on the product — the storefront shows the discount badge automatically.</p>
      {!data.length ? <Empty>No promo codes yet.</Empty> : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead><tr className="border-b border-line text-left text-xs uppercase tracking-wider text-gray-500"><th className="px-4 py-3">Code</th><th className="px-3 py-3">Discount</th><th className="px-3 py-3">Min order</th><th className="px-3 py-3">Uses</th><th className="px-3 py-3">Valid</th><th className="px-3 py-3">Status</th><th className="px-4 py-3" /></tr></thead>
            <tbody>
              {data.map((p) => {
                const [label, cls] = status(p);
                return (
                  <tr key={p.id} className="border-b border-line/60 last:border-0">
                    <td className="px-4 py-3"><b className="font-mono">{p.code}</b>{p.description && <span className="block text-xs text-gray-400">{p.description}</span>}</td>
                    <td className="px-3 py-3">{p.discount_type === 'percent' ? `${Number(p.value)}%` : pkr(p.value)}</td>
                    <td className="px-3 py-3">{Number(p.min_order) ? pkr(p.min_order) : '—'}</td>
                    <td className="px-3 py-3">{p.used_count}{p.max_uses ? ` / ${p.max_uses}` : ''}</td>
                    <td className="px-3 py-3 text-xs text-gray-500">{p.starts_at ? fmtDate(p.starts_at) : 'Now'} → {p.ends_at ? fmtDate(p.ends_at) : 'No end'}</td>
                    <td className="px-3 py-3"><span className={`chip ${cls}`}>{label}</span></td>
                    <td className="px-4 py-3"><div className="flex justify-end gap-1">
                      <button onClick={() => setEdit({ ...p, value: String(p.value), min_order: String(p.min_order), max_uses: p.max_uses ?? '', starts_at: toLocal(p.starts_at), ends_at: toLocal(p.ends_at) })} className="grid h-8 w-8 place-items-center rounded hover:bg-mist" title="Edit"><Pencil size={15} /></button>
                      <button onClick={() => remove(p)} className="grid h-8 w-8 place-items-center rounded text-sale hover:bg-rose-50" title="Delete"><Trash2 size={15} /></button>
                    </div></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <Modal open={!!edit} onClose={() => setEdit(null)} label="Edit promotion" className="!w-[min(94vw,560px)]">
        {edit && (
          <form onSubmit={save} className="grid gap-4 p-6 sm:grid-cols-2">
            <h2 className="font-display text-lg font-semibold sm:col-span-2">{edit.id ? 'Edit code' : 'New promo code'}</h2>
            <Field label="Code" className="sm:col-span-2"><input className="input font-mono uppercase" value={edit.code} onChange={(e) => setEdit({ ...edit, code: e.target.value.toUpperCase().replace(/\s/g, '') })} data-autofocus /></Field>
            <Field label="Description (internal)" className="sm:col-span-2"><input className="input" value={edit.description || ''} onChange={(e) => setEdit({ ...edit, description: e.target.value })} /></Field>
            <Field label="Type"><select className="input" value={edit.discount_type} onChange={(e) => setEdit({ ...edit, discount_type: e.target.value })}><option value="percent">Percentage</option><option value="fixed">Fixed amount (Rs.)</option></select></Field>
            <Field label={edit.discount_type === 'percent' ? 'Percent off' : 'Amount off (Rs.)'}><input className="input" inputMode="decimal" value={edit.value} onChange={(e) => setEdit({ ...edit, value: e.target.value })} /></Field>
            <Field label="Minimum order (Rs.)"><input className="input" inputMode="decimal" value={edit.min_order} onChange={(e) => setEdit({ ...edit, min_order: e.target.value })} /></Field>
            <Field label="Max uses (blank = unlimited)"><input className="input" inputMode="numeric" value={edit.max_uses} onChange={(e) => setEdit({ ...edit, max_uses: e.target.value.replace(/\D/g, '') })} /></Field>
            <Field label="Starts"><input type="datetime-local" className="input" value={edit.starts_at} onChange={(e) => setEdit({ ...edit, starts_at: e.target.value })} /></Field>
            <Field label="Ends"><input type="datetime-local" className="input" value={edit.ends_at} onChange={(e) => setEdit({ ...edit, ends_at: e.target.value })} /></Field>
            <div className="sm:col-span-2"><Toggle label="Active" checked={edit.is_active} onChange={(v) => setEdit({ ...edit, is_active: v })} /></div>
            <div className="flex justify-end gap-2 sm:col-span-2"><button type="button" onClick={() => setEdit(null)} className="btn-ghost">Cancel</button><button className="btn-primary">Save</button></div>
          </form>
        )}
      </Modal>
    </>
  );
}
