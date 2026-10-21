import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAsync } from '../hooks/useAsync';
import { PageHeader, StatusBadge, Empty, useToast } from './ui';
import { must, toCSV, download } from './lib';
import { pkr, fmtDate, ORDER_STATUSES } from '../lib/format';
import { PageLoader, ErrorNote } from '../components/ui/States';

const PER = 25;

export default function Orders() {
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const statuses = (params.get('status') || '').split(',').filter(Boolean);
  const q = params.get('q') || '';
  const page = Number(params.get('page') || 1);
  const [term, setTerm] = useState(q);

  const build = (sel, opts) => {
    let r = supabase.from('orders').select(sel, opts).order('created_at', { ascending: false });
    if (statuses.length) r = r.in('status', statuses);
    if (q) {
      const t = q.replace(/[%,()]/g, '').trim();
      r = r.or(`order_number.ilike.%${t}%,customer_name.ilike.%${t}%,phone.ilike.%${t}%`);
    }
    return r;
  };

  const { data, loading, error } = useAsync(async () => {
    const res = await build('id, order_number, customer_name, phone, city, total, status, payment_method, created_at, items:order_items(quantity)', { count: 'exact' }).range((page - 1) * PER, page * PER - 1);
    return { rows: must(res), count: res.count || 0 };
  }, [params.toString()]);

  const setP = (k, v) => { const n = new URLSearchParams(params); v ? n.set(k, v) : n.delete(k); if (k !== 'page') n.delete('page'); setParams(n); };

  const exportCSV = async () => {
    try {
      const rows = must(await build('order_number, created_at, status, customer_name, phone, email, province, city, address, subtotal, discount, delivery_fee, total, payment_method, promo_code, courier, tracking_number, notes, admin_notes, items:order_items(product_name, variant_label, quantity, unit_price)').limit(5000));
      const flat = rows.map(({ items, ...o }) => ({ ...o, created_at: fmtDate(o.created_at, { dateStyle: 'short', timeStyle: 'short' }), items: items.map((i) => `${i.quantity}x ${i.product_name}${i.variant_label ? ` (${i.variant_label})` : ''} @ ${i.unit_price}`).join('; ') }));
      download(`mrnobody-orders-${new Date().toISOString().slice(0, 10)}.csv`, toCSV(flat));
    } catch (x) { toast(x.message, 'error'); }
  };

  return (
    <>
      <PageHeader title="Orders" subtitle={data ? `${data.count} order${data.count === 1 ? '' : 's'}` : ''} actions={<button onClick={exportCSV} className="btn-outline btn-sm"><Download size={14} /> Export CSV</button>} />
      <div className="card mb-4 space-y-3 p-3">
        <form onSubmit={(e) => { e.preventDefault(); setP('q', term.trim()); }} className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input h-10 pl-9" placeholder="Search by order number, name or phone — press Enter" value={term} onChange={(e) => setTerm(e.target.value)} aria-label="Search orders" />
        </form>
        <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
          <button onClick={() => setP('status', '')} className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold ${!statuses.length ? 'bg-brand text-white' : 'bg-mist text-gray-600 hover:bg-line'}`}>All</button>
          {ORDER_STATUSES.map((s) => (
            <button key={s} onClick={() => setP('status', statuses.length === 1 && statuses[0] === s ? '' : s)} className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold capitalize ${statuses.includes(s) ? 'bg-brand text-white' : 'bg-mist text-gray-600 hover:bg-line'}`}>{s}</button>
          ))}
        </div>
      </div>
      {loading ? <PageLoader /> : error ? <ErrorNote>{error.message}</ErrorNote> : !data.rows.length ? <Empty>No orders found.</Empty> : (
        <>
          <div className="card overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead><tr className="border-b border-line text-left text-xs uppercase tracking-wider text-gray-500"><th className="px-4 py-3">Order</th><th className="px-3 py-3">Date</th><th className="px-3 py-3">Customer</th><th className="px-3 py-3">Items</th><th className="px-3 py-3">Status</th><th className="px-4 py-3 text-right">Total</th></tr></thead>
              <tbody>
                {data.rows.map((o) => (
                  <tr key={o.id} className="border-b border-line/60 last:border-0 hover:bg-mist/60">
                    <td className="px-4 py-3"><Link to={`/admin/orders/${o.id}`} className="font-semibold text-brand hover:underline">{o.order_number}</Link><span className="block text-xs uppercase text-gray-400">{o.payment_method}</span></td>
                    <td className="px-3 py-3 text-gray-600">{fmtDate(o.created_at, { dateStyle: 'medium', timeStyle: 'short' })}</td>
                    <td className="px-3 py-3">{o.customer_name}<span className="block text-xs text-gray-400">{o.phone} · {o.city}</span></td>
                    <td className="px-3 py-3 text-gray-600">{o.items.reduce((s, i) => s + i.quantity, 0)}</td>
                    <td className="px-3 py-3"><StatusBadge status={o.status} /></td>
                    <td className="px-4 py-3 text-right font-semibold">{pkr(o.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {data.count > PER && (
            <div className="mt-4 flex items-center justify-end gap-2 text-sm">
              <button disabled={page <= 1} onClick={() => setP('page', String(page - 1))} className="btn-outline btn-sm"><ChevronLeft size={14} /></button>
              <span>Page {page} of {Math.ceil(data.count / PER)}</span>
              <button disabled={page * PER >= data.count} onClick={() => setP('page', String(page + 1))} className="btn-outline btn-sm"><ChevronRight size={14} /></button>
            </div>
          )}
        </>
      )}
    </>
  );
}
