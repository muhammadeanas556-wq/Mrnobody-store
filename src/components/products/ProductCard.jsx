import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Heart, Eye, ShoppingBag, Check } from 'lucide-react';
import Img from '../ui/Img';
import { Price, StockText, Stars } from './Price';
import QuickView from './QuickView';
import { useCart } from '../../contexts/CartContext';
import { useWishlist } from '../../contexts/WishlistContext';
import { discountPct } from '../../lib/format';

export default function ProductCard({ product, eager = false }) {
  const [qv, setQv] = useState(false);
  const [added, setAdded] = useState(false);
  const { add } = useCart();
  const wish = useWishlist();
  const off = discountPct(product.price, product.compare_at_price);
  const inWish = wish.has(product.id);
  const second = product.images[1]?.url;
  const out = product.stock <= 0;
  const simple = product.variants.length === 1;

  const quickAdd = (e) => {
    e.preventDefault();
    if (out) return;
    if (!simple) return setQv(true);
    add(product, product.variants[0], 1, { openDrawer: false });
    setAdded(true);
    setTimeout(() => setAdded(false), 1400);
  };

  return (
    <article className="group relative">
      <div className="relative overflow-hidden rounded-lg bg-mist">
        <Link to={`/product/${product.slug}`} className="block aspect-[4/5]" aria-label={product.name}>
          <Img src={product.image} alt={product.images[0]?.alt || product.name} eager={eager}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]" />
          {second && (
            <Img src={second} alt="" aria-hidden="true"
              className="absolute inset-0 h-full w-full object-cover !opacity-0 transition-all duration-700 group-hover:scale-[1.06] group-hover:!opacity-100" />
          )}
        </Link>

        <div className="pointer-events-none absolute left-2.5 top-2.5 flex flex-col gap-1.5">
          {off > 0 && (
            <motion.span initial={{ scale: 0.6, opacity: 0 }} whileInView={{ scale: 1, opacity: 1 }} viewport={{ once: true }} transition={{ type: 'spring', stiffness: 400, damping: 15 }}
              className="rounded bg-sale px-2 py-0.5 text-[11px] font-bold text-white shadow-sm">-{off}%</motion.span>
          )}
          {product.is_new_arrival && <span className="rounded bg-brand px-2 py-0.5 text-[11px] font-bold text-white shadow-sm">NEW</span>}
          {product.is_demo && <span className="rounded bg-white/90 px-1.5 py-0.5 text-[10px] font-semibold text-gray-500 ring-1 ring-line">DEMO</span>}
        </div>

        <motion.button
          whileTap={{ scale: 0.8 }}
          onClick={() => wish.toggle(product.id)}
          className={`absolute right-2.5 top-2.5 grid h-9 w-9 place-items-center rounded-full bg-white shadow-sm transition hover:scale-110 ${inWish ? 'text-sale' : 'text-ink'}`}
          aria-label={inWish ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
          aria-pressed={inWish}
        >
          <motion.span key={String(inWish)} initial={{ scale: 0.5 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 12 }}>
            <Heart size={17} className={inWish ? 'fill-current' : ''} />
          </motion.span>
        </motion.button>

        {out && <div className="absolute inset-x-0 bottom-0 bg-ink/70 py-1.5 text-center text-xs font-semibold uppercase tracking-wider text-white">Sold out</div>}

        {!out && (
          <div className="absolute inset-x-2.5 bottom-2.5 hidden translate-y-3 gap-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100 md:flex">
            <button onClick={() => setQv(true)} className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-white text-ink shadow transition hover:bg-ink hover:text-white" aria-label={`Quick view ${product.name}`}>
              <Eye size={17} />
            </button>
            <button onClick={quickAdd} className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-md bg-brand text-[13px] font-semibold text-white shadow transition hover:bg-brand-dark">
              {added ? <><Check size={16} /> Added</> : <><ShoppingBag size={15} /> {simple ? 'Add to Cart' : 'Choose Options'}</>}
            </button>
          </div>
        )}
        {!out && (
          <button onClick={quickAdd} className="absolute bottom-2.5 right-2.5 grid h-9 w-9 place-items-center rounded-full bg-brand text-white shadow md:hidden" aria-label={`Add ${product.name} to cart`}>
            {added ? <Check size={16} /> : <ShoppingBag size={16} />}
          </button>
        )}
      </div>

      <div className="mt-3 space-y-1 px-0.5">
        {product.category && <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400">{product.category.name}</p>}
        <h3 className="line-clamp-1 text-[14.5px] font-medium text-ink">
          <Link to={`/product/${product.slug}`} className="hover:text-brand">{product.name}</Link>
        </h3>
        <Stars rating={product.avg_rating} count={product.review_count} />
        <Price price={product.price} compare={product.compare_at_price} />
        <StockText stock={product.stock} />
      </div>

      <QuickView product={product} open={qv} onClose={() => setQv(false)} />
    </article>
  );
}
