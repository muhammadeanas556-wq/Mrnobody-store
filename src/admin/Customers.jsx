import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Download } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAsync } from '../hooks/useAsync';
import { PageHeader, Empty } from './ui';
import { must, toCSV, download } from './lib';
import { pkr, fmtDate } from '../lib/format';
import { PageLoader, ErrorNote } from '../components/ui/States';

export default function Customers() {
  const [q, setQ] = useState('');
  const { data, loading, error } = useAsync(async () => must(await supabase.from('customers').select('*').order('created_at', { ascending: false }).limit(2000)), []);
  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    return (data || []).filter((c) => !t || c.full_name.toLowerCase().includes(t) || c.phone.includes(t) || (c.email || '').toLowerCase().includes(t) || (c.city || '').toLowerCase().includes(t));
  }, [data, q]);
  if (loading) return <PageLoader />;
  if (error) return <ErrorNote>{error.message}</ErrorNote>;
  return (
    <>
      <PageHeader title="Customers" subtitle="Created automatically from checkout (matched by mobile number)." actions={
        <button className="btn-outline btn-sm" onClick={() => download('mrnobody-customers.csv', toCSV(list.map(({ id, ...c }) => c)))}><Download size={14} /> Export CSV</button>
      } />
      <div className="card mb-4 p-3">
        <div className="relative"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input h-10 pl-9" placeholder="Search name, phone, email or city…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search customers" /></div>
      </div>
      {!list.length ? <Empty>No customers yet.</Empty> : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[700px] text-sm">
            <thead><tr className="border-b border-line text-left text-xs uppercase tracking-wider text-gray-500"><th className="px-4 py-3">Customer</th><th className="px-3 py-3">Phone</th><th className="px-3 py-3">City</th><th className="px-3 py-3">Orders</th><th className="px-3 py-3">Spent</th><th className="px-4 py-3">Since</th></tr></thead>
            <tbody>
              {list.map((c) => (
                <tr key={c.id} className="border-b border-line/60 last:border-0 hover:bg-mist/60">
                  <td className="px-4 py-3 font-medium">{c.full_name}{c.email && <span className="block text-xs font-normal text-gray-400">{c.email}</span>}</td>
                  <td className="px-3 py-3"><Link to={`/admin/orders?q=${encodeURIComponent(c.phone)}`} className="text-brand hover:underline">{c.phone}</Link></td>
                  <td className="px-3 py-3 text-gray-600">{c.city}{c.province && <span className="block text-xs text-gray-400">{c.province}</span>}</td>
                  <td className="px-3 py-3">{c.orders_count}</td>
                  <td className="px-3 py-3 font-medium">{pkr(c.total_spent)}</td>
                  <td className="px-4 py-3 text-gray-500">{fmtDate(c.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
