import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, X, SearchX, ChevronRight } from 'lucide-react';
import { useStore } from '../contexts/StoreContext';
import { useAsync } from '../hooks/useAsync';
import { useSEO } from '../hooks/useSEO';
import { fetchProducts } from '../services/catalog';
import ProductGrid from '../components/products/ProductGrid';
import Modal from '../components/ui/Modal';
import { EmptyState, ErrorNote } from '../components/ui/States';

const PAGE = 20;
const SORTS = [
  ['newest', 'Newest'],
  ['popular', 'Most popular'],
  ['price-asc', 'Price: low to high'],
  ['price-desc', 'Price: high to low'],
  ['rating', 'Top rated'],
  ['name', 'Name A–Z'],
];

function Filters({ params, set, categories, sizes, colors }) {
  const [min, setMin] = useState(params.get('min') || '');
  const [max, setMax] = useState(params.get('max') || '');
  useEffect(() => { setMin(params.get('min') || ''); setMax(params.get('max') || ''); }, [params]);
  const list = (k) => (params.get(k) || '').split(',').filter(Boolean);
  const toggle = (k, v) => {
    const cur = list(k);
    set(k, (cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v]).join(','));
  };
  const cat = params.get('category');

  return (
    <div className="space-y-7">
      <div>
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wider">Categories</h3>
        <ul className="space-y-1 text-sm">
          <li><button onClick={() => set('category', '')} className={`w-full rounded px-2 py-1.5 text-left hover:bg-mist ${!cat ? 'font-semibold text-brand' : ''}`}>All products</button></li>
          {categories.map((c) => (
            <li key={c.id}>
              <button onClick={() => set('category', c.slug)} className={`w-full rounded px-2 py-1.5 text-left hover:bg-mist ${cat === c.slug ? 'font-semibold text-brand' : ''}`} aria-pressed={cat === c.slug}>{c.name}</button>
            </li>
          ))}
        </ul>
      </div>
      <form onSubmit={(e) => { e.preventDefault(); set({ min, max }); }}>
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wider">Price (Rs.)</h3>
        <div className="flex items-center gap-2">
          <label className="sr-only" htmlFor="pmin">Minimum price</label>
          <input id="pmin" className="input h-10" inputMode="numeric" placeholder="Min" value={min} onChange={(e) => setMin(e.target.value.replace(/\D/g, ''))} />
          <span className="text-gray-400">–</span>
          <label className="sr-only" htmlFor="pmax">Maximum price</label>
          <input id="pmax" className="input h-10" inputMode="numeric" placeholder="Max" value={max} onChange={(e) => setMax(e.target.value.replace(/\D/g, ''))} />
        </div>
        <button className="btn-outline-brand btn-sm mt-3 w-full">Apply price</button>
      </form>
      {sizes.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wider">Size</h3>
          <div className="flex flex-wrap gap-2">
            {sizes.map((s) => (
              <button key={s} onClick={() => toggle('size', s)} aria-pressed={list('size').includes(s)}
                className={`h-9 min-w-[42px] rounded-md border px-2.5 text-sm transition ${list('size').includes(s) ? 'border-brand bg-brand text-white' : 'border-line hover:border-ink'}`}>{s}</button>
            ))}
          </div>
        </div>
      )}
      {colors.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wider">Colour</h3>
          <div className="flex flex-wrap gap-2">
            {colors.map((c) => (
              <button key={c} onClick={() => toggle('color', c)} aria-pressed={list('color').includes(c)}
                className={`h-9 rounded-full border px-3.5 text-sm transition ${list('color').includes(c) ? 'border-brand bg-brand-soft font-semibold text-brand' : 'border-line hover:border-ink'}`}>{c}</button>
            ))}
          </div>
        </div>
      )}
      <div>
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wider">Availability</h3>
        <label className="flex cursor-pointer items-center gap-2.5 text-sm">
          <input type="checkbox" className="h-4 w-4 accent-[rgb(var(--brand))]" checked={params.get('avail') === 'in'} onChange={(e) => set('avail', e.target.checked ? 'in' : '')} /> In stock only
        </label>
        <label className="mt-2 flex cursor-pointer items-center gap-2.5 text-sm">
          <input type="checkbox" className="h-4 w-4 accent-[rgb(var(--brand))]" checked={params.get('sale') === '1'} onChange={(e) => set('sale', e.target.checked ? '1' : '')} /> On sale
        </label>
      </div>
    </div>
  );
}

export default function Shop() {
  const [params, setParams] = useSearchParams();
  const { categories } = useStore();
  const [shown, setShown] = useState(PAGE);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const cat = categories.find((c) => c.slug === params.get('category'));
  const q = params.get('q') || '';
  const flags = { newArrival: params.get('new') === '1', sale: params.get('sale') === '1', bestSeller: params.get('best') === '1', featured: params.get('featured') === '1' };
  const sort = params.get('sort') || 'newest';
  const serverKey = ['category', 'q', 'new', 'sale', 'best', 'featured', 'min', 'max', 'sort'].map((k) => params.get(k)).join('|');

  const { data, loading, error } = useAsync(
    () => fetchProducts({ category: params.get('category') || undefined, q: q || undefined, ...flags, min: Number(params.get('min')) || undefined, max: Number(params.get('max')) || undefined, sort }),
    [serverKey],
  );
  useEffect(() => setShown(PAGE), [params]);

  const all = data || [];
  const sizes = useMemo(() => [...new Set(all.flatMap((p) => p.sizes))], [all]);
  const colors = useMemo(() => [...new Set(all.flatMap((p) => p.colors))], [all]);
  const want = (k) => (params.get(k) || '').split(',').filter(Boolean);
  const filtered = useMemo(() => {
    const sz = want('size'), co = want('color'), inStock = params.get('avail') === 'in';
    return all.filter((p) => {
      const vs = p.variants.filter((v) => (!sz.length || sz.includes(v.size)) && (!co.length || co.includes(v.color)) && (!inStock || v.stock > 0));
      return vs.length > 0;
    });
  }, [all, params]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (k, v) => {
    const next = new URLSearchParams(params);
    const entries = typeof k === 'object' ? Object.entries(k) : [[k, v]];
    for (const [kk, vv] of entries) (vv ? next.set(kk, vv) : next.delete(kk));
    setParams(next, { replace: false });
    setFiltersOpen(false);
  };

  const title = q ? `Search: “${q}”` : cat ? cat.name : flags.newArrival ? 'New Arrivals' : flags.sale ? 'Sale' : flags.bestSeller ? 'Best Sellers' : flags.featured ? 'Trending Now' : 'Shop All';
  useSEO({ title: `${title} | MrNobody`, description: `Browse ${title.toLowerCase()} at MrNobody. Prices in PKR with Cash on Delivery across Pakistan.` });

  const active = [...['category', 'q', 'min', 'max', 'size', 'color', 'avail', 'sale', 'new', 'best', 'featured'].filter((k) => params.get(k))];
  const filterProps = { params, set, categories, sizes, colors };

  return (
    <div className="container-site py-8">
      <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1 text-xs text-gray-500">
        <Link to="/" className="hover:text-brand">Home</Link> <ChevronRight size={12} /> <Link to="/shop" className="hover:text-brand">Shop</Link>
        {title !== 'Shop All' && <><ChevronRight size={12} /> <span className="text-ink">{title}</span></>}
      </nav>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">{title}</h1>
          {!loading && <p className="mt-1 text-sm text-gray-500">{filtered.length} product{filtered.length === 1 ? '' : 's'}</p>}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setFiltersOpen(true)} className="btn-outline btn-sm lg:hidden"><SlidersHorizontal size={15} /> Filters{active.length ? ` (${active.length})` : ''}</button>
          <label htmlFor="sort" className="sr-only">Sort by</label>
          <select id="sort" className="input h-9 w-auto text-[13px]" value={sort} onChange={(e) => set('sort', e.target.value)}>
            {SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
      </div>

      {active.length > 0 && (
        <div className="mb-6 flex flex-wrap items-center gap-2">
          {active.map((k) => (
            <button key={k} onClick={() => set(k, '')} className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold text-brand hover:bg-brand hover:text-white">
              {k === 'category' ? cat?.name || params.get(k) : k === 'avail' ? 'In stock' : k === 'new' ? 'New arrivals' : k === 'best' ? 'Best sellers' : k === 'featured' ? 'Trending' : k === 'sale' ? 'On sale' : `${k}: ${params.get(k)}`}
              <X size={12} />
            </button>
          ))}
          <Link to="/shop" className="text-xs font-semibold text-gray-500 underline hover:text-ink">Clear all</Link>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
        <aside className="hidden lg:block" aria-label="Filters"><Filters {...filterProps} /></aside>
        <div>
          {error ? (
            <ErrorNote>Could not load products. Please refresh the page.</ErrorNote>
          ) : !loading && !filtered.length ? (
            <EmptyState icon={SearchX} title="No products found" text="Try removing a filter or searching for something else." action={<Link to="/shop" className="btn-primary">View all products</Link>} />
          ) : (
            <>
              <ProductGrid products={filtered.slice(0, shown)} loading={loading} skeletons={8} cols="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 md:grid-cols-3 xl:grid-cols-4" />
              {shown < filtered.length && (
                <div className="mt-10 text-center">
                  <p className="mb-3 text-xs text-gray-500">Showing {shown} of {filtered.length}</p>
                  <button onClick={() => setShown((s) => s + PAGE)} className="btn-outline-brand">Load more</button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <Modal open={filtersOpen} onClose={() => setFiltersOpen(false)} side="left" label="Filters">
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center justify-between border-b border-line px-5">
            <h2 className="font-display text-lg font-semibold">Filters</h2>
            <button onClick={() => setFiltersOpen(false)} className="grid h-9 w-9 place-items-center rounded-full hover:bg-mist" aria-label="Close filters"><X size={20} /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-5"><Filters {...filterProps} /></div>
        </div>
      </Modal>
    </div>
  );
}
