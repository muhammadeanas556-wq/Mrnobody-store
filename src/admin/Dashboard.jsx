import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Clock, CheckCircle2, Truck, XCircle, Wallet, Package, AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAsync } from '../hooks/useAsync';
import { PageHeader, Panel, StatusBadge, Empty } from './ui';
import { pkr, fmtDate } from '../lib/format';
import { PageLoader, ErrorNote } from '../components/ui/States';
import { must } from './lib';

function SalesChart({ daily }) {
  const [hover, setHover] = useState(null);
  const max = Math.max(1, ...daily.map((d) => Number(d.total)));
  const W = 720, H = 220, pad = 28, bw = (W - pad) / daily.length;
  const total = daily.reduce((s, d) => s + Number(d.total), 0);
  return (
    <div>
      <p className="mb-3 text-sm text-gray-500">{pkr(total)} across {daily.reduce((s, d) => s + d.orders, 0)} orders (excludes cancelled/returned)</p>
      <div className="relative">
        <svg viewBox={`0 0 ${W} ${H + 24}`} className="w-full" role="img" aria-label="Daily sales for the last 30 days">
          {[0, 0.5, 1].map((t) => (
            <g key={t}>
              <line x1={pad} x2={W} y1={H - t * (H - 10)} y2={H - t * (H - 10)} stroke="#E6E8EC" strokeDasharray={t ? '3 4' : ''} />
              <text x={pad - 4} y={H - t * (H - 10) + 3} fontSize="9" textAnchor="end" fill="#9AA4B2">{t ? `${Math.round((max * t) / 1000)}k` : '0'}</text>
            </g>
          ))}
          {daily.map((d, i) => {
            const h = (Number(d.total) / max) * (H - 10);
            return (
              <g key={d.day} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
                <rect x={pad + i * bw} y={0} width={bw} height={H} fill="transparent" />
                <rect x={pad + i * bw + bw * 0.18} y={H - h} width={bw * 0.64} height={Math.max(h, Number(d.total) ? 2 : 0)} rx="3"
                  fill={hover === i ? 'rgb(var(--brand-dark))' : 'rgb(var(--brand))'} />
                {i % 5 === 0 && <text x={pad + i * bw + bw / 2} y={H + 16} fontSize="9" textAnchor="middle" fill="#9AA4B2">{new Date(d.day).toLocaleDateString('en-PK', { day: 'numeric', month: 'short' })}</text>}
              </g>
            );
          })}
        </svg>
        {hover !== null && (
          <div className="pointer-events-none absolute -top-2 rounded-md bg-ink px-2.5 py-1.5 text-xs text-white shadow" style={{ left: `${((pad + hover * bw) / W) * 100}%` }}>
            <b>{fmtDate(daily[hover].day)}</b><br />{pkr(daily[hover].total)} · {daily[hover].orders} orders
          </div>
        )}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { data, loading, error } = useAsync(async () => {
    const [stats, orders, products] = await Promise.all([
      supabase.rpc('admin_stats', { p_days: 30 }),
      supabase.from('orders').select('id, order_number, customer_name, city, total, status, created_at').order('created_at', { ascending: false }).limit(8),
      supabase.from('products').select('id, name, slug, price, status, created_at, images:product_images(url, position)').order('created_at', { ascending: false }).limit(5),
    ]);
    return { stats: must(stats), orders: must(orders), products: must(products) };
  }, []);

  if (loading) return <PageLoader />;
  if (error) return <ErrorNote>{error.message}</ErrorNote>;
  const s = data.stats;
  const cards = [
    ['Total Orders', s.total_orders, ShoppingCart, 'text-brand bg-brand-soft', '/admin/orders'],
    ['Pending', s.pending, Clock, 'text-amber-600 bg-amber-50', '/admin/orders?status=pending'],
    ['Confirmed / In progress', s.confirmed, Truck, 'text-indigo-600 bg-indigo-50', '/admin/orders?status=confirmed,processing,shipped'],
    ['Delivered', s.delivered, CheckCircle2, 'text-emerald-600 bg-emerald-50', '/admin/orders?status=delivered'],
    ['Cancelled / Returned', s.cancelled, XCircle, 'text-rose-600 bg-rose-50', '/admin/orders?status=cancelled,returned'],
    ['Delivered Revenue', pkr(s.revenue), Wallet, 'text-emerald-600 bg-emerald-50', null, `Open orders: ${pkr(s.pipeline_revenue - s.revenue)}`],
    ['Products', s.products, Package, 'text-brand bg-brand-soft', '/admin/products'],
    ['Low Stock Variants', s.low_stock, AlertTriangle, 'text-amber-600 bg-amber-50', '/admin/inventory?low=1', '3 units or fewer'],
  ];

  return (
    <>
      <PageHeader title="Dashboard" subtitle="Live figures from your store database." />
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {cards.map(([label, value, Icon, tone, to, hint]) => {
          const inner = (
            <div className="card flex h-full items-start gap-3 p-4 transition hover:shadow-lift">
              <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg ${tone}`}><Icon size={19} /></span>
              <div className="min-w-0">
                <p className="text-xs font-medium text-gray-500">{label}</p>
                <p className="mt-0.5 truncate font-display text-xl font-bold">{value}</p>
                {hint && <p className="text-[11px] text-gray-400">{hint}</p>}
              </div>
            </div>
          );
          return to ? <Link key={label} to={to}>{inner}</Link> : <div key={label}>{inner}</div>;
        })}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[2fr_1fr]">
        <Panel title="Sales — last 30 days"><SalesChart daily={s.daily} /></Panel>
        <Panel title="Best-selling products">
          {!s.best_sellers.length ? <Empty>No sales yet.</Empty> : (
            <ol className="space-y-3">
              {s.best_sellers.map((b, i) => (
                <li key={b.product_id || i} className="flex items-center gap-3 text-sm">
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-mist text-xs font-bold">{i + 1}</span>
                  <span className="min-w-0 flex-1 truncate font-medium">{b.name}</span>
                  <span className="text-right text-xs text-gray-500">{b.qty} sold<br />{pkr(b.revenue)}</span>
                </li>
              ))}
            </ol>
          )}
        </Panel>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[2fr_1fr]">
        <Panel title="Recent orders" actions={<Link to="/admin/orders" className="text-sm font-semibold text-brand">View all</Link>}>
          {!data.orders.length ? <Empty>No orders yet. They will appear here as soon as customers check out.</Empty> : (
            <div className="-mx-5 overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-line text-left text-xs uppercase tracking-wider text-gray-500"><th className="px-5 py-2">Order</th><th className="px-3 py-2">Customer</th><th className="px-3 py-2">Date</th><th className="px-3 py-2">Status</th><th className="px-5 py-2 text-right">Total</th></tr></thead>
                <tbody>
                  {data.orders.map((o) => (
                    <tr key={o.id} className="border-b border-line/60 last:border-0 hover:bg-mist">
                      <td className="px-5 py-3"><Link to={`/admin/orders/${o.id}`} className="font-semibold text-brand hover:underline">{o.order_number}</Link></td>
                      <td className="px-3 py-3">{o.customer_name}<span className="block text-xs text-gray-400">{o.city}</span></td>
                      <td className="px-3 py-3 text-gray-500">{fmtDate(o.created_at)}</td>
                      <td className="px-3 py-3"><StatusBadge status={o.status} /></td>
                      <td className="px-5 py-3 text-right font-semibold">{pkr(o.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
        <Panel title="Recent products" actions={<Link to="/admin/products/new" className="text-sm font-semibold text-brand">Add product</Link>}>
          <ul className="space-y-3">
            {data.products.map((p) => (
              <li key={p.id}>
                <Link to={`/admin/products/${p.id}`} className="flex items-center gap-3 rounded-lg p-1 hover:bg-mist">
                  <img src={[...p.images].sort((a, b) => a.position - b.position)[0]?.url} alt="" className="h-12 w-10 rounded bg-mist object-cover" />
                  <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{p.name}</span><span className="text-xs text-gray-500">{pkr(p.price)} · {p.status}</span></span>
                </Link>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </>
  );
}
