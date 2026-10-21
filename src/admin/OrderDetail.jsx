import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Printer, Phone, Mail, MapPin, Save } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAsync } from '../hooks/useAsync';
import { PageHeader, Panel, StatusBadge, Field, useToast } from './ui';
import { must } from './lib';
import { pkr, fmtDate, ORDER_STATUSES } from '../lib/format';
import { PageLoader, ErrorNote } from '../components/ui/States';

export default function OrderDetail() {
  const { id } = useParams();
  const toast = useToast();
  const { data, loading, error, reload } = useAsync(async () => {
    const [o, h, s] = await Promise.all([
      supabase.from('orders').select('*, items:order_items(*)').eq('id', id).single(),
      supabase.from('order_status_history').select('*').eq('order_id', id).order('created_at'),
      supabase.from('site_settings').select('data').eq('id', 1).maybeSingle(),
    ]);
    return { order: must(o), history: must(h), settings: s.data?.data || {} };
  }, [id]);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (data) setForm({ status: data.order.status, courier: data.order.courier || '', tracking_number: data.order.tracking_number || '', admin_notes: data.order.admin_notes || '', payment_status: data.order.payment_status });
  }, [data]);

  if (loading || !form) return error ? <ErrorNote>{error.message}</ErrorNote> : <PageLoader />;
  const o = data.order;

  const save = async () => {
    setSaving(true);
    try {
      must(await supabase.from('orders').update(form).eq('id', id));
      toast('Order updated'); reload();
    } catch (x) { toast(x.message.replace(/^.*?: /, ''), 'error'); } finally { setSaving(false); }
  };

  return (
    <>
      <div className="no-print">
        <Link to="/admin/orders" className="mb-3 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-ink"><ArrowLeft size={14} /> Orders</Link>
        <PageHeader title={`Order ${o.order_number}`} subtitle={`Placed ${fmtDate(o.created_at, { dateStyle: 'full', timeStyle: 'short' })}`}
          actions={<><StatusBadge status={o.status} /><button onClick={() => window.print()} className="btn-outline btn-sm"><Printer size={14} /> Print invoice</button></>} />

        <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            <Panel title="Items">
              <ul className="divide-y divide-line">
                {o.items.map((it) => (
                  <li key={it.id} className="flex items-center gap-3 py-3">
                    <img src={it.image_url || ''} alt="" className="h-14 w-12 rounded bg-mist object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{it.product_name}</p>
                      <p className="text-xs text-gray-500">{[it.variant_label, it.sku && `SKU ${it.sku}`].filter(Boolean).join(' · ')}</p>
                    </div>
                    <p className="text-sm text-gray-600">{it.quantity} × {pkr(it.unit_price)}</p>
                    <p className="w-24 text-right font-semibold">{pkr(it.line_total)}</p>
                  </li>
                ))}
              </ul>
              <dl className="mt-3 space-y-1.5 border-t border-line pt-3 text-sm">
                <div className="flex justify-between"><dt className="text-gray-600">Subtotal</dt><dd>{pkr(o.subtotal)}</dd></div>
                {Number(o.discount) > 0 && <div className="flex justify-between text-emerald-600"><dt>Discount {o.promo_code && `(${o.promo_code})`}</dt><dd>−{pkr(o.discount)}</dd></div>}
                <div className="flex justify-between"><dt className="text-gray-600">Delivery</dt><dd>{pkr(o.delivery_fee)}</dd></div>
                <div className="flex justify-between text-base font-bold"><dt>Total ({o.payment_method.toUpperCase()})</dt><dd>{pkr(o.total)}</dd></div>
              </dl>
            </Panel>
            <Panel title="Customer & delivery">
              <div className="grid gap-4 text-sm sm:grid-cols-2">
                <div>
                  <p className="font-semibold">{o.customer_name}</p>
                  <p className="mt-1 flex items-center gap-2 text-gray-600"><Phone size={14} /><a href={`tel:${o.phone}`} className="hover:text-brand">{o.phone}</a></p>
                  {o.email && <p className="mt-1 flex items-center gap-2 text-gray-600"><Mail size={14} /><a href={`mailto:${o.email}`} className="hover:text-brand">{o.email}</a></p>}
                </div>
                <p className="flex gap-2 text-gray-600"><MapPin size={14} className="mt-0.5 shrink-0" /><span>{o.address}<br />{o.city}, {o.province}</span></p>
              </div>
              {o.notes && <p className="mt-4 rounded-md bg-amber-50 p-3 text-sm text-amber-900"><b>Customer note:</b> {o.notes}</p>}
            </Panel>
          </div>

          <div className="space-y-6">
            <Panel title="Manage order">
              <div className="space-y-4">
                <Field label="Status" hint="Cancelling or marking as returned puts the items back into stock automatically.">
                  <select className="input capitalize" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                    {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </Field>
                <Field label="Payment status">
                  <select className="input" value={form.payment_status} onChange={(e) => setForm({ ...form, payment_status: e.target.value })}>
                    <option value="unpaid">Unpaid</option><option value="paid">Paid (cash collected)</option><option value="refunded">Refunded</option>
                  </select>
                </Field>
                <Field label="Courier"><input className="input" placeholder="e.g. TCS, Leopards, M&P" value={form.courier} onChange={(e) => setForm({ ...form, courier: e.target.value })} /></Field>
                <Field label="Tracking number"><input className="input" value={form.tracking_number} onChange={(e) => setForm({ ...form, tracking_number: e.target.value })} /></Field>
                <Field label="Internal notes"><textarea rows={3} className="input" value={form.admin_notes} onChange={(e) => setForm({ ...form, admin_notes: e.target.value })} /></Field>
                <button onClick={save} disabled={saving} className="btn-primary w-full"><Save size={15} /> {saving ? 'Saving…' : 'Save changes'}</button>
              </div>
            </Panel>
            <Panel title="History">
              <ol className="relative space-y-4 border-l border-line pl-5">
                {data.history.map((h) => (
                  <li key={h.id} className="text-sm">
                    <span className="absolute -left-[5px] mt-1.5 h-2.5 w-2.5 rounded-full bg-brand" />
                    <p className="font-medium capitalize">{h.status}{h.note && <span className="font-normal text-gray-500"> — {h.note}</span>}</p>
                    <p className="text-xs text-gray-400">{fmtDate(h.created_at, { dateStyle: 'medium', timeStyle: 'short' })}</p>
                  </li>
                ))}
              </ol>
            </Panel>
          </div>
        </div>
      </div>

      {/* Printable invoice */}
      <div className="hidden print:block">
        <div className="mx-auto max-w-2xl p-8 text-[13px] text-black">
          <div className="flex items-start justify-between border-b pb-4">
            <div>
              <p className="text-2xl font-extrabold">{data.settings.store_name || 'MrNobody'}</p>
              {data.settings.contact_phone && <p>{data.settings.contact_phone}</p>}
              {data.settings.contact_email && <p>{data.settings.contact_email}</p>}
            </div>
            <div className="text-right"><p className="text-lg font-bold">INVOICE</p><p>{o.order_number}</p><p>{fmtDate(o.created_at)}</p></div>
          </div>
          <div className="mt-4"><p className="font-bold">Deliver to</p><p>{o.customer_name} · {o.phone}</p><p>{o.address}, {o.city}, {o.province}</p></div>
          <table className="mt-6 w-full border-collapse">
            <thead><tr className="border-b text-left"><th className="py-2">Item</th><th>Qty</th><th className="text-right">Price</th><th className="text-right">Total</th></tr></thead>
            <tbody>{o.items.map((it) => <tr key={it.id} className="border-b"><td className="py-2">{it.product_name}{it.variant_label && ` (${it.variant_label})`}</td><td>{it.quantity}</td><td className="text-right">{pkr(it.unit_price)}</td><td className="text-right">{pkr(it.line_total)}</td></tr>)}</tbody>
          </table>
          <div className="ml-auto mt-4 w-60 space-y-1">
            <p className="flex justify-between"><span>Subtotal</span><span>{pkr(o.subtotal)}</span></p>
            {Number(o.discount) > 0 && <p className="flex justify-between"><span>Discount</span><span>−{pkr(o.discount)}</span></p>}
            <p className="flex justify-between"><span>Delivery</span><span>{pkr(o.delivery_fee)}</span></p>
            <p className="flex justify-between border-t pt-1 text-base font-bold"><span>Amount due (COD)</span><span>{pkr(o.total)}</span></p>
          </div>
          <p className="mt-10 text-center text-xs">Thank you for shopping with {data.settings.store_name || 'MrNobody'}.</p>
        </div>
      </div>
    </>
  );
}
