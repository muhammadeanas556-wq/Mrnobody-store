import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Wand2, ExternalLink, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { PageHeader, Panel, Field, Toggle, GalleryInput, useToast } from './ui';
import { must, removeStorageFiles } from './lib';
import { slugify, pkr, discountPct } from '../lib/format';
import { PageLoader, ErrorNote } from '../components/ui/States';

const blank = {
  name: '', slug: '', description: '', category_id: '', price: '', compare_at_price: '', status: 'draft',
  is_featured: false, is_new_arrival: true, is_best_seller: false, meta_title: '', meta_description: '',
};
const newVariant = (o = {}) => ({ _key: crypto.randomUUID(), id: null, size: '', color: '', sku: '', price: '', stock: 0, is_active: true, ...o });

export default function ProductEditor() {
  const { id } = useParams();
  const isNew = id === 'new';
  const nav = useNavigate();
  const toast = useToast();
  const [p, setP] = useState(blank);
  const [images, setImages] = useState([]);
  const [origImages, setOrigImages] = useState([]);
  const [variants, setVariants] = useState([newVariant()]);
  const [origVariants, setOrigVariants] = useState([]);
  const [categories, setCategories] = useState([]);
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const [discount, setDiscount] = useState('');
  const [opts, setOpts] = useState({ sizes: '', colors: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const cats = must(await supabase.from('categories').select('id, name').order('position'));
        setCategories(cats);
        if (!isNew) {
          const d = must(await supabase.from('products').select('*, images:product_images(*), variants:product_variants(*)').eq('id', id).single());
          const { images: im, variants: vs, ...rest } = d;
          setP({ ...blank, ...rest, price: String(rest.price), compare_at_price: rest.compare_at_price ? String(rest.compare_at_price) : '', category_id: rest.category_id || '', meta_title: rest.meta_title || '', meta_description: rest.meta_description || '' });
          const sortedIm = [...im].sort((a, b) => a.position - b.position);
          setImages(sortedIm); setOrigImages(sortedIm);
          const sortedV = [...vs].sort((a, b) => a.position - b.position).map((v) => ({ ...v, _key: v.id, price: v.price ?? '', size: v.size || '', color: v.color || '', sku: v.sku || '' }));
          setVariants(sortedV.length ? sortedV : [newVariant()]); setOrigVariants(sortedV);
          setOpts({ sizes: [...new Set(vs.map((v) => v.size).filter(Boolean))].join(', '), colors: [...new Set(vs.map((v) => v.color).filter(Boolean))].join(', ') });
        } else if (cats[0]) {
          setP((x) => ({ ...x, category_id: cats[0].id }));
        }
      } catch (e) { setError(e.message); }
      setLoading(false);
    })();
  }, [id, isNew]);

  const set = (k) => (e) => {
    const v = e?.target ? (e.target.type === 'checkbox' ? e.target.checked : e.target.value) : e;
    setP((x) => ({ ...x, [k]: v, ...(k === 'name' && !slugTouched ? { slug: slugify(v) } : {}) }));
  };
  const setV = (key, k, v) => setVariants((vs) => vs.map((x) => (x._key === key ? { ...x, [k]: v } : x)));

  const applyDiscount = () => {
    const pct = Number(discount);
    const base = Number(p.compare_at_price || p.price);
    if (!pct || pct <= 0 || pct >= 95 || !base) return toast('Enter an original price and a discount between 1 and 94%', 'error');
    setP((x) => ({ ...x, compare_at_price: String(base), price: String(Math.round(base * (1 - pct / 100))) }));
  };

  const generate = () => {
    const sizes = opts.sizes.split(',').map((s) => s.trim()).filter(Boolean);
    const colors = opts.colors.split(',').map((s) => s.trim()).filter(Boolean);
    const combos = [];
    for (const c of colors.length ? colors : ['']) for (const s of sizes.length ? sizes : ['']) combos.push({ color: c, size: s });
    setVariants((cur) => combos.map(({ color, size }) => cur.find((v) => v.color === color && v.size === size) || newVariant({ color, size })));
  };

  const save = async (e) => {
    e.preventDefault();
    setError('');
    const price = Number(p.price);
    const compare = p.compare_at_price === '' ? null : Number(p.compare_at_price);
    if (!p.name.trim()) return setError('Product name is required.');
    if (!/^[a-z0-9-]+$/.test(p.slug)) return setError('URL slug may only contain lowercase letters, numbers and hyphens.');
    if (!Number.isFinite(price) || price < 0) return setError('Enter a valid selling price.');
    if (compare !== null && (!Number.isFinite(compare) || compare < price)) return setError('Original price must be higher than the selling price (or left blank).');
    if (!variants.length) return setError('Add at least one variant (stock row).');
    const keys = variants.map((v) => `${v.color}|${v.size}`);
    if (new Set(keys).size !== keys.length) return setError('Two variants have the same colour and size.');
    if (variants.some((v) => !Number.isInteger(Number(v.stock)) || Number(v.stock) < 0)) return setError('Stock must be a whole number of 0 or more.');
    if (p.status === 'active' && !images.length) return setError('Add at least one image before publishing.');

    setSaving(true);
    try {
      const row = {
        name: p.name.trim(), slug: p.slug, description: p.description, category_id: p.category_id || null,
        price, compare_at_price: compare, status: p.status, is_featured: p.is_featured, is_new_arrival: p.is_new_arrival, is_best_seller: p.is_best_seller,
        meta_title: p.meta_title || null, meta_description: p.meta_description || null,
        ...(isNew ? {} : { is_demo: false }),
      };
      const saved = isNew
        ? must(await supabase.from('products').insert(row).select('id').single())
        : must(await supabase.from('products').update(row).eq('id', id).select('id').single());
      const pid = saved.id;

      // images
      const keepIds = images.filter((i) => i.id).map((i) => i.id);
      const removed = origImages.filter((o) => !keepIds.includes(o.id));
      if (removed.length) {
        must(await supabase.from('product_images').delete().in('id', removed.map((r) => r.id)));
        await removeStorageFiles(removed.map((r) => r.storage_path));
      }
      for (const [pos, im] of images.entries()) {
        if (im.id) must(await supabase.from('product_images').update({ position: pos, alt: im.alt || p.name }).eq('id', im.id));
        else must(await supabase.from('product_images').insert({ product_id: pid, url: im.url, storage_path: im.storage_path || null, alt: im.alt || p.name, position: pos }));
      }

      // variants
      const keepV = variants.filter((v) => v.id).map((v) => v.id);
      const removedV = origVariants.filter((o) => !keepV.includes(o.id));
      if (removedV.length) must(await supabase.from('product_variants').delete().in('id', removedV.map((r) => r.id)));
      const movements = [];
      for (const [pos, v] of variants.entries()) {
        const vrow = {
          product_id: pid, size: v.size.trim() || null, color: v.color.trim() || null,
          sku: v.sku.trim() || null, price: v.price === '' || v.price == null ? null : Number(v.price),
          stock: Number(v.stock), is_active: v.is_active, position: pos,
        };
        if (v.id) {
          const before = origVariants.find((o) => o.id === v.id);
          must(await supabase.from('product_variants').update(vrow).eq('id', v.id));
          if (before && before.stock !== vrow.stock) movements.push({ variant_id: v.id, change: vrow.stock - before.stock, reason: 'adjustment' });
        } else {
          const ins = must(await supabase.from('product_variants').insert(vrow).select('id').single());
          if (vrow.stock) movements.push({ variant_id: ins.id, change: vrow.stock, reason: 'restock' });
        }
      }
      if (movements.length) await supabase.from('inventory_movements').insert(movements);

      toast(isNew ? 'Product created' : 'Product saved');
      if (isNew) nav(`/admin/products/${pid}`, { replace: true });
      else {
        // reload fresh state so ids/positions match the database
        const d = must(await supabase.from('products').select('images:product_images(*), variants:product_variants(*)').eq('id', pid).single());
        const im = [...d.images].sort((a, b) => a.position - b.position);
        setImages(im); setOrigImages(im);
        const vs = [...d.variants].sort((a, b) => a.position - b.position).map((v) => ({ ...v, _key: v.id, price: v.price ?? '', size: v.size || '', color: v.color || '', sku: v.sku || '' }));
        setVariants(vs); setOrigVariants(vs);
      }
    } catch (x) {
      setError(x.message.includes('already in use') ? 'That URL slug or SKU is already used by another product.' : x.message);
    } finally { setSaving(false); }
  };

  if (loading) return <PageLoader />;
  const totalStock = variants.reduce((s, v) => s + (Number(v.stock) || 0), 0);
  const off = discountPct(p.price, p.compare_at_price);

  return (
    <form onSubmit={save}>
      <Link to="/admin/products" className="mb-3 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-ink"><ArrowLeft size={14} /> Products</Link>
      <PageHeader title={isNew ? 'Add product' : p.name || 'Edit product'} actions={
        <>
          {!isNew && p.status === 'active' && <a href={`/product/${p.slug}`} target="_blank" rel="noreferrer" className="btn-outline btn-sm"><ExternalLink size={14} /> View on store</a>}
          <button className="btn-primary btn-sm" disabled={saving}>{saving ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : 'Save product'}</button>
        </>
      } />
      {error && <div className="mb-4"><ErrorNote>{error}</ErrorNote></div>}

      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <Panel title="Details">
            <div className="grid gap-4">
              <Field label="Product name"><input className="input" value={p.name} onChange={set('name')} required /></Field>
              <Field label="URL slug" hint={`Storefront URL: /product/${p.slug || '…'}`}>
                <input className="input" value={p.slug} onChange={(e) => { setSlugTouched(true); setP({ ...p, slug: slugify(e.target.value) }); }} />
              </Field>
              <Field label="Description"><textarea rows={6} className="input" value={p.description} onChange={set('description')} /></Field>
            </div>
          </Panel>

          <Panel title="Images"><GalleryInput images={images} onChange={setImages} /></Panel>

          <Panel title="Pricing (PKR)">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Selling price"><input className="input" inputMode="decimal" value={p.price} onChange={set('price')} required /></Field>
              <Field label="Original price" hint="Optional. Shown crossed out when higher than the selling price."><input className="input" inputMode="decimal" value={p.compare_at_price} onChange={set('compare_at_price')} /></Field>
            </div>
            <div className="mt-4 flex flex-wrap items-end gap-2 rounded-lg bg-mist p-3">
              <Field label="Quick discount %" className="w-36"><input className="input h-10" inputMode="numeric" value={discount} onChange={(e) => setDiscount(e.target.value.replace(/\D/g, ''))} /></Field>
              <button type="button" onClick={applyDiscount} className="btn-outline btn-sm h-10">Apply to original price</button>
              {off > 0 && <span className="ml-auto chip bg-rose-50 text-sale ring-rose-200">Currently {off}% off</span>}
            </div>
          </Panel>

          <Panel title={`Variants & inventory — ${totalStock} in stock`}>
            <div className="mb-4 grid gap-3 rounded-lg bg-mist p-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
              <Field label="Sizes (comma separated)"><input className="input h-10" placeholder="S, M, L, XL" value={opts.sizes} onChange={(e) => setOpts({ ...opts, sizes: e.target.value })} /></Field>
              <Field label="Colours (comma separated)"><input className="input h-10" placeholder="Black, White" value={opts.colors} onChange={(e) => setOpts({ ...opts, colors: e.target.value })} /></Field>
              <button type="button" onClick={generate} className="btn-outline btn-sm h-10"><Wand2 size={14} /> Generate variants</button>
            </div>
            <div className="-mx-5 overflow-x-auto">
              <table className="w-full min-w-[680px] text-sm">
                <thead><tr className="border-b border-line text-left text-xs uppercase tracking-wider text-gray-500">
                  <th className="px-5 py-2">Colour</th><th className="px-2 py-2">Size</th><th className="px-2 py-2">SKU</th><th className="px-2 py-2">Price override</th><th className="px-2 py-2">Stock</th><th className="px-2 py-2">Active</th><th className="px-5 py-2" />
                </tr></thead>
                <tbody>
                  {variants.map((v) => (
                    <tr key={v._key} className="border-b border-line/60">
                      <td className="px-5 py-2"><input className="input h-9" value={v.color} onChange={(e) => setV(v._key, 'color', e.target.value)} placeholder="—" aria-label="Colour" /></td>
                      <td className="px-2 py-2"><input className="input h-9 w-20" value={v.size} onChange={(e) => setV(v._key, 'size', e.target.value)} placeholder="—" aria-label="Size" /></td>
                      <td className="px-2 py-2"><input className="input h-9" value={v.sku} onChange={(e) => setV(v._key, 'sku', e.target.value)} placeholder="Optional" aria-label="SKU" /></td>
                      <td className="px-2 py-2"><input className="input h-9 w-28" inputMode="decimal" value={v.price} onChange={(e) => setV(v._key, 'price', e.target.value)} placeholder={p.price ? pkr(p.price) : ''} aria-label="Variant price" /></td>
                      <td className="px-2 py-2"><input className="input h-9 w-20" inputMode="numeric" value={v.stock} onChange={(e) => setV(v._key, 'stock', e.target.value.replace(/\D/g, ''))} aria-label="Stock" /></td>
                      <td className="px-2 py-2"><input type="checkbox" className="h-4 w-4 accent-[rgb(var(--brand))]" checked={v.is_active} onChange={(e) => setV(v._key, 'is_active', e.target.checked)} aria-label="Variant active" /></td>
                      <td className="px-5 py-2 text-right"><button type="button" onClick={() => setVariants((vs) => vs.filter((x) => x._key !== v._key))} className="grid h-8 w-8 place-items-center rounded text-sale hover:bg-rose-50" aria-label="Remove variant"><Trash2 size={15} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button type="button" onClick={() => setVariants((vs) => [...vs, newVariant()])} className="btn-ghost btn-sm mt-3"><Plus size={14} /> Add variant row</button>
            <p className="mt-2 text-xs text-gray-500">Products without sizes or colours need a single row with just the stock quantity. Leave “Price override” blank to use the selling price.</p>
          </Panel>

          <Panel title="Search engine listing">
            <div className="grid gap-4">
              <Field label="Meta title" hint="Defaults to “Product name | MrNobody”"><input className="input" maxLength={70} value={p.meta_title} onChange={set('meta_title')} /></Field>
              <Field label="Meta description" hint="About 150 characters"><textarea rows={2} maxLength={170} className="input" value={p.meta_description} onChange={set('meta_description')} /></Field>
            </div>
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title="Status">
            <select className="input" value={p.status} onChange={set('status')} aria-label="Status">
              <option value="active">Active — visible in store</option>
              <option value="draft">Draft — hidden</option>
              <option value="archived">Archived — hidden</option>
            </select>
          </Panel>
          <Panel title="Organisation">
            <Field label="Category">
              <select className="input" value={p.category_id} onChange={set('category_id')}>
                <option value="">— None —</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
            <div className="mt-5 space-y-4">
              <Toggle label="Featured" description="Shown in Trending Now" checked={p.is_featured} onChange={set('is_featured')} />
              <Toggle label="New Arrival" description="Shown in the New Arrivals tab" checked={p.is_new_arrival} onChange={set('is_new_arrival')} />
              <Toggle label="Best Seller" description="Shown in the Best Selling tab" checked={p.is_best_seller} onChange={set('is_best_seller')} />
            </div>
          </Panel>
          <Panel title="Preview">
            <div className="overflow-hidden rounded-lg bg-mist">
              <div className="relative aspect-[4/5]">
                {images[0] ? <img src={images[0].url} alt="" className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-xs text-gray-400">No image</div>}
                {off > 0 && <span className="absolute left-2 top-2 rounded bg-sale px-2 py-0.5 text-[11px] font-bold text-white">-{off}%</span>}
                {p.is_new_arrival && <span className={`absolute left-2 ${off > 0 ? 'top-8' : 'top-2'} rounded bg-brand px-2 py-0.5 text-[11px] font-bold text-white`}>NEW</span>}
              </div>
            </div>
            <p className="mt-3 text-[11px] uppercase tracking-wider text-gray-400">{categories.find((c) => c.id === p.category_id)?.name}</p>
            <p className="font-medium">{p.name || 'Product name'}</p>
            <p className="mt-0.5"><b>{pkr(p.price)}</b>{off > 0 && <span className="ml-2 text-sm text-gray-400 line-through">{pkr(p.compare_at_price)}</span>}</p>
            <p className={`text-xs font-medium ${totalStock ? 'text-emerald-600' : 'text-sale'}`}>{totalStock ? 'In stock' : 'Out of stock'}</p>
          </Panel>
        </div>
      </div>
    </form>
  );
}
