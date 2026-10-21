import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Pencil, Archive, Trash2, ExternalLink, Star, Sparkles, TrendingUp } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAsync } from '../hooks/useAsync';
import { PageHeader, Empty, useToast } from './ui';
import { must, removeStorageFiles } from './lib';
import { pkr } from '../lib/format';
import { PageLoader, ErrorNote } from '../components/ui/States';

const STATUS_CHIP = { active: 'bg-emerald-50 text-emerald-700 ring-emerald-200', draft: 'bg-gray-100 text-gray-600 ring-gray-200', archived: 'bg-amber-50 text-amber-700 ring-amber-200' };

export default function Products() {
  const toast = useToast();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [cat, setCat] = useState('');
  const { data, loading, error, reload } = useAsync(async () => {
    const [p, c] = await Promise.all([
      supabase.from('products').select('id, name, slug, price, compare_at_price, status, is_demo, is_featured, is_new_arrival, is_best_seller, category_id, created_at, images:product_images(url, position, storage_path), variants:product_variants(stock)').order('created_at', { ascending: false }),
      supabase.from('categories').select('id, name').order('position'),
    ]);
    return { products: must(p), categories: must(c) };
  }, []);

  const list = useMemo(() => {
    if (!data) return [];
    const term = q.trim().toLowerCase();
    return data.products.filter((p) => (!term || p.name.toLowerCase().includes(term) || p.slug.includes(term)) && (!status || p.status === status) && (!cat || p.category_id === cat));
  }, [data, q, status, cat]);

  if (loading) return <PageLoader />;
  if (error) return <ErrorNote>{error.message}</ErrorNote>;
  const catName = Object.fromEntries(data.categories.map((c) => [c.id, c.name]));
  const demoCount = data.products.filter((p) => p.is_demo).length;

  const setProductStatus = async (p, s) => {
    try { must(await supabase.from('products').update({ status: s }).eq('id', p.id)); toast(`${p.name} → ${s}`); reload(); }
    catch (e) { toast(e.message, 'error'); }
  };
  const remove = async (p) => {
    if (!confirm(`Permanently delete "${p.name}"? Past orders keep their saved item details.`)) return;
    try {
      must(await supabase.from('products').delete().eq('id', p.id));
      await removeStorageFiles(p.images.map((i) => i.storage_path));
      toast('Product deleted'); reload();
    } catch (e) { toast(e.message, 'error'); }
  };
  const removeDemo = async () => {
    if (!confirm(`Delete all ${demoCount} demo products? This cannot be undone.`)) return;
    try { must(await supabase.from('products').delete().eq('is_demo', true)); toast('Demo products removed'); reload(); }
    catch (e) { toast(e.message, 'error'); }
  };

  return (
    <>
      <PageHeader title="Products" subtitle={`${data.products.length} total`} actions={
        <>
          {demoCount > 0 && <button onClick={removeDemo} className="btn-outline btn-sm text-sale"><Trash2 size={14} /> Remove {demoCount} demo products</button>}
          <Link to="/admin/products/new" className="btn-primary btn-sm"><Plus size={15} /> Add product</Link>
        </>
      } />
      <div className="card mb-4 flex flex-wrap gap-3 p-3">
        <div className="relative min-w-[200px] flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input h-10 pl-9" placeholder="Search products…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search products" />
        </div>
        <select className="input h-10 w-auto" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status">
          <option value="">All statuses</option><option value="active">Active</option><option value="draft">Draft</option><option value="archived">Archived</option>
        </select>
        <select className="input h-10 w-auto" value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Filter by category">
          <option value="">All categories</option>{data.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      {!list.length ? <Empty>No products match. <Link to="/admin/products/new" className="text-brand underline">Add a product</Link>.</Empty> : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead><tr className="border-b border-line text-left text-xs uppercase tracking-wider text-gray-500">
              <th className="px-4 py-3">Product</th><th className="px-3 py-3">Category</th><th className="px-3 py-3">Price</th><th className="px-3 py-3">Stock</th><th className="px-3 py-3">Status</th><th className="px-4 py-3 text-right">Actions</th>
            </tr></thead>
            <tbody>
              {list.map((p) => {
                const img = [...p.images].sort((a, b) => a.position - b.position)[0]?.url;
                const stock = p.variants.reduce((s, v) => s + v.stock, 0);
                return (
                  <tr key={p.id} className="border-b border-line/60 last:border-0 hover:bg-mist/60">
                    <td className="px-4 py-3">
                      <Link to={`/admin/products/${p.id}`} className="flex items-center gap-3">
                        <img src={img} alt="" className="h-12 w-10 rounded bg-mist object-cover" />
                        <span>
                          <span className="font-medium hover:text-brand">{p.name}</span>
                          <span className="mt-0.5 flex gap-1.5 text-gray-400">
                            {p.is_featured && <Star size={12} title="Featured" />}{p.is_new_arrival && <Sparkles size={12} title="New arrival" />}{p.is_best_seller && <TrendingUp size={12} title="Best seller" />}
                            {p.is_demo && <span className="text-[10px] font-semibold text-amber-600">DEMO</span>}
                          </span>
                        </span>
                      </Link>
                    </td>
                    <td className="px-3 py-3 text-gray-600">{catName[p.category_id] || '—'}</td>
                    <td className="px-3 py-3 font-medium">{pkr(p.price)}{p.compare_at_price > p.price && <span className="block text-xs text-gray-400 line-through">{pkr(p.compare_at_price)}</span>}</td>
                    <td className={`px-3 py-3 font-medium ${stock === 0 ? 'text-sale' : stock <= 5 ? 'text-amber-600' : ''}`}>{stock}<span className="block text-xs font-normal text-gray-400">{p.variants.length} variant{p.variants.length === 1 ? '' : 's'}</span></td>
                    <td className="px-3 py-3"><span className={`chip capitalize ${STATUS_CHIP[p.status]}`}>{p.status}</span></td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        {p.status === 'active' && <a href={`/product/${p.slug}`} target="_blank" rel="noreferrer" className="grid h-8 w-8 place-items-center rounded hover:bg-white" title="View on store"><ExternalLink size={15} /></a>}
                        <Link to={`/admin/products/${p.id}`} className="grid h-8 w-8 place-items-center rounded hover:bg-white" title="Edit"><Pencil size={15} /></Link>
                        {p.status !== 'archived'
                          ? <button onClick={() => setProductStatus(p, 'archived')} className="grid h-8 w-8 place-items-center rounded hover:bg-white" title="Archive"><Archive size={15} /></button>
                          : <button onClick={() => setProductStatus(p, 'draft')} className="rounded px-2 text-xs font-semibold text-brand hover:bg-white">Restore</button>}
                        <button onClick={() => remove(p)} className="grid h-8 w-8 place-items-center rounded text-sale hover:bg-white" title="Delete"><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
