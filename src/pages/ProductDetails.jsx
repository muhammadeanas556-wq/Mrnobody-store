import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, ShoppingBag, Zap, Truck, RotateCcw, Banknote, ChevronRight, PackageX, Star, Expand } from 'lucide-react';
import { useAsync } from '../hooks/useAsync';
import { useSEO } from '../hooks/useSEO';
import { fetchProduct, fetchProducts, fetchReviews, submitReview } from '../services/catalog';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';
import { useStore } from '../contexts/StoreContext';
import Img from '../components/ui/Img';
import Modal from '../components/ui/Modal';
import { Price, StockText, Stars } from '../components/products/Price';
import VariantPicker, { useVariantSelection } from '../components/products/VariantPicker';
import QtyStepper from '../components/cart/QtyStepper';
import ProductGrid from '../components/products/ProductGrid';
import { PageLoader, EmptyState } from '../components/ui/States';
import { pkr, fmtDate } from '../lib/format';
import { isConfigured } from '../lib/supabase';

function Gallery({ images, name }) {
  const [i, setI] = useState(0);
  const [zoom, setZoom] = useState(null);
  const [full, setFull] = useState(false);
  const cur = images[i];
  return (
    <div className="flex flex-col-reverse gap-3 md:flex-row">
      {images.length > 1 && (
        <div className="no-scrollbar flex gap-2 overflow-x-auto md:w-20 md:flex-col">
          {images.map((im, k) => (
            <button key={im.id || k} onClick={() => setI(k)} aria-label={`Show image ${k + 1}`} aria-current={k === i}
              className={`aspect-[4/5] w-16 shrink-0 overflow-hidden rounded-md ring-2 transition md:w-full ${k === i ? 'ring-brand' : 'ring-transparent opacity-70 hover:opacity-100'}`}>
              <Img src={im.url} alt="" className="h-full w-full object-cover" sizes="80px" />
            </button>
          ))}
        </div>
      )}
      <div
        className="relative flex-1 cursor-zoom-in overflow-hidden rounded-xl bg-mist"
        onMouseMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          setZoom({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
        }}
        onMouseLeave={() => setZoom(null)}
        onClick={() => setFull(true)}
      >
        <AnimatePresence mode="wait">
          <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} className="aspect-[4/5]">
            <Img src={cur?.url} alt={cur?.alt || name} eager sizes="(max-width:768px) 100vw, 50vw"
              className="h-full w-full object-cover transition-transform duration-200"
              style={zoom ? { transform: 'scale(1.9)', transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined} />
          </motion.div>
        </AnimatePresence>
        <span className="absolute bottom-3 right-3 grid h-9 w-9 place-items-center rounded-full bg-white/90 shadow" aria-hidden><Expand size={16} /></span>
      </div>
      <Modal open={full} onClose={() => setFull(false)} label={`${name} images`} className="!w-[min(96vw,900px)] bg-black">
        <Img src={cur?.url?.replace(/w=\d+/, 'w=1600')} alt={cur?.alt || name} className="max-h-[88vh] w-full object-contain" />
        {images.length > 1 && (
          <div className="flex justify-center gap-2 p-3">
            {images.map((im, k) => <button key={k} onClick={() => setI(k)} className={`h-2.5 w-2.5 rounded-full ${k === i ? 'bg-white' : 'bg-white/40'}`} aria-label={`Image ${k + 1}`} />)}
          </div>
        )}
      </Modal>
    </div>
  );
}

function Reviews({ product }) {
  const { data: reviews, reload } = useAsync(() => fetchReviews(product.id), [product.id]);
  const [form, setForm] = useState({ name: '', rating: 5, comment: '' });
  const [state, setState] = useState({ s: 'idle', m: '' });
  const submit = async (e) => {
    e.preventDefault();
    if (form.name.trim().length < 2) return setState({ s: 'error', m: 'Please enter your name.' });
    setState({ s: 'busy' });
    try {
      await submitReview({ product_id: product.id, name: form.name.trim(), rating: form.rating, comment: form.comment.trim() || null });
      setState({ s: 'done', m: 'Thank you! Your review will appear once approved.' });
      setForm({ name: '', rating: 5, comment: '' });
      reload();
    } catch (err) {
      setState({ s: 'error', m: err.message });
    }
  };
  return (
    <section className="mt-16 grid gap-10 lg:grid-cols-[1fr_380px]" aria-labelledby="reviews-title">
      <div>
        <h2 id="reviews-title" className="section-title">Customer Reviews</h2>
        {product.review_count > 0 && <div className="mt-2"><Stars rating={product.avg_rating} count={product.review_count} size={16} /></div>}
        {!reviews?.length ? (
          <p className="mt-4 text-sm text-gray-500">No reviews yet. Be the first to share your experience.</p>
        ) : (
          <ul className="mt-6 divide-y divide-line">
            {reviews.map((r) => (
              <li key={r.id} className="py-4">
                <div className="flex items-center justify-between"><b className="text-sm">{r.name}</b><span className="text-xs text-gray-400">{fmtDate(r.created_at)}</span></div>
                <div className="mt-1"><Stars rating={r.rating} count={1} /></div>
                {r.comment && <p className="mt-2 text-sm text-gray-600">{r.comment}</p>}
              </li>
            ))}
          </ul>
        )}
      </div>
      {isConfigured && (
        <form onSubmit={submit} className="card h-fit space-y-4 p-6" noValidate>
          <h3 className="font-display text-lg font-semibold">Write a review</h3>
          {state.s === 'done' ? <p className="text-sm font-medium text-emerald-600" role="status">{state.m}</p> : (
            <>
              <div>
                <span className="label">Your rating</span>
                <div className="flex gap-1" role="radiogroup" aria-label="Rating">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button type="button" key={n} role="radio" aria-checked={form.rating === n} aria-label={`${n} star${n > 1 ? 's' : ''}`} onClick={() => setForm({ ...form, rating: n })}>
                      <Star size={24} className={n <= form.rating ? 'fill-gold text-gold' : 'text-gray-300'} />
                    </button>
                  ))}
                </div>
              </div>
              <div><label className="label" htmlFor="rv-name">Name</label><input id="rv-name" className="input" maxLength={60} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><label className="label" htmlFor="rv-c">Review (optional)</label><textarea id="rv-c" rows={3} maxLength={1000} className="input" value={form.comment} onChange={(e) => setForm({ ...form, comment: e.target.value })} /></div>
              {state.s === 'error' && <p className="field-error" role="alert">{state.m}</p>}
              <button className="btn-primary w-full" disabled={state.s === 'busy'}>Submit review</button>
            </>
          )}
        </form>
      )}
    </section>
  );
}

export default function ProductDetails() {
  const { slug } = useParams();
  const nav = useNavigate();
  const { settings } = useStore();
  const { data: product, loading } = useAsync(() => fetchProduct(slug), [slug]);
  const { data: related } = useAsync(
    () => (product ? fetchProducts({ category: product.category?.slug, limit: 6 }).then((l) => l.filter((p) => p.id !== product.id).slice(0, 5)) : []),
    [product?.id],
  );
  const sel = useVariantSelection(product);
  const [qty, setQty] = useState(1);
  const [err, setErr] = useState('');
  const { add } = useCart();
  const wish = useWishlist();

  useSEO(product ? {
    title: product.meta_title || `${product.name} | MrNobody`,
    description: product.meta_description || product.description?.slice(0, 155),
    image: product.image,
    jsonLd: {
      '@context': 'https://schema.org', '@type': 'Product', name: product.name, image: product.images.map((i) => i.url), description: product.description,
      sku: product.variants[0]?.sku, category: product.category?.name, brand: { '@type': 'Brand', name: 'MrNobody' },
      offers: { '@type': 'Offer', priceCurrency: 'PKR', price: product.price, availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock', url: window.location.href },
      ...(product.review_count ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: product.avg_rating, reviewCount: product.review_count } } : {}),
    },
  } : { title: 'Product | MrNobody' });

  if (loading) return <PageLoader />;
  if (!product) {
    return <EmptyState icon={PackageX} title="Product not found" text="This product may have been removed or is no longer available." action={<Link to="/shop" className="btn-primary">Continue shopping</Link>} />;
  }

  const v = sel.variant;
  const stock = v ? v.stock : product.stock;
  const price = v?.price ?? product.price;

  const validate = () => {
    if (sel.needsSize) { setErr('Please select a size.'); return false; }
    if (!v) { setErr('Please choose an option.'); return false; }
    if (v.stock <= 0) { setErr('This option is out of stock.'); return false; }
    setErr('');
    return true;
  };

  return (
    <div className="container-site py-8">
      <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-1 text-xs text-gray-500">
        <Link to="/" className="hover:text-brand">Home</Link> <ChevronRight size={12} />
        <Link to="/shop" className="hover:text-brand">Shop</Link> <ChevronRight size={12} />
        {product.category && <><Link to={`/shop?category=${product.category.slug}`} className="hover:text-brand">{product.category.name}</Link> <ChevronRight size={12} /></>}
        <span className="text-ink">{product.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
        <Gallery images={product.images} name={product.name} />

        <div>
          {product.is_demo && <span className="chip mb-3 bg-amber-50 text-amber-700 ring-amber-200">Demo product</span>}
          {product.category && <p className="text-xs font-semibold uppercase tracking-wider text-brand">{product.category.name}</p>}
          <h1 className="mt-1 font-display text-3xl font-bold leading-tight sm:text-4xl">{product.name}</h1>
          <div className="mt-2"><Stars rating={product.avg_rating} count={product.review_count} size={15} /></div>
          <div className="mt-4"><Price price={price} compare={product.compare_at_price} size="lg" /></div>
          <div className="mt-2 flex items-center gap-3"><StockText stock={stock} />{v?.sku && <span className="text-xs text-gray-400">SKU: {v.sku}</span>}</div>

          <div className="mt-6 border-t border-line pt-6"><VariantPicker product={product} sel={sel} error={sel.needsSize ? err : ''} /></div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <QtyStepper value={qty} onChange={setQty} max={Math.max(1, stock)} />
            <button className="btn-primary h-12 flex-1" disabled={stock <= 0} onClick={() => validate() && add(product, v, qty)}>
              <ShoppingBag size={17} /> {stock > 0 ? 'Add to Cart' : 'Out of Stock'}
            </button>
            <motion.button whileTap={{ scale: 0.85 }} onClick={() => wish.toggle(product.id)} aria-pressed={wish.has(product.id)} aria-label="Toggle wishlist"
              className={`grid h-12 w-12 place-items-center rounded-md border transition ${wish.has(product.id) ? 'border-sale bg-rose-50 text-sale' : 'border-line hover:border-ink'}`}>
              <Heart size={19} className={wish.has(product.id) ? 'fill-current' : ''} />
            </motion.button>
          </div>
          <button className="btn-outline mt-3 h-12 w-full" disabled={stock <= 0} onClick={() => { if (validate()) { add(product, v, qty, { openDrawer: false }); nav('/checkout'); } }}>
            <Zap size={17} /> Buy Now
          </button>
          {err && !sel.needsSize && <p className="field-error" role="alert">{err}</p>}

          <ul className="mt-7 grid gap-3 rounded-xl bg-mist p-5 text-sm sm:grid-cols-3">
            <li className="flex items-start gap-2.5"><Banknote size={18} className="shrink-0 text-brand" /> Cash on Delivery</li>
            <li className="flex items-start gap-2.5"><Truck size={18} className="shrink-0 text-brand" />
              {Number(settings.free_shipping_threshold) > 0 ? `Free delivery over ${pkr(settings.free_shipping_threshold)}` : 'Delivery across Pakistan'}</li>
            <li className="flex items-start gap-2.5"><RotateCcw size={18} className="shrink-0 text-brand" /><Link to="/page/returns" className="hover:text-brand hover:underline">Return policy</Link></li>
          </ul>

          <div className="mt-8">
            <h2 className="text-sm font-bold uppercase tracking-wider">Description</h2>
            <div className="mt-3 whitespace-pre-line text-[15px] leading-relaxed text-gray-600">{product.description}</div>
          </div>
        </div>
      </div>

      <Reviews product={product} />

      {related?.length > 0 && (
        <section className="mt-16" aria-labelledby="rel-title">
          <h2 id="rel-title" className="section-title mb-8">You may also like</h2>
          <ProductGrid products={related} />
        </section>
      )}
    </div>
  );
}
