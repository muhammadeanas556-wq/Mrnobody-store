import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Heart, ArrowRight } from 'lucide-react';
import Modal from '../ui/Modal';
import Img from '../ui/Img';
import { Price, StockText, Stars } from './Price';
import VariantPicker, { useVariantSelection } from './VariantPicker';
import QtyStepper from '../cart/QtyStepper';
import { useCart } from '../../contexts/CartContext';
import { useWishlist } from '../../contexts/WishlistContext';

export default function QuickView({ product, open, onClose }) {
  const sel = useVariantSelection(product);
  const [qty, setQty] = useState(1);
  const [img, setImg] = useState(0);
  const [err, setErr] = useState('');
  const { add } = useCart();
  const wish = useWishlist();
  if (!product) return null;
  const stock = sel.variant ? sel.variant.stock : product.stock;

  const onAdd = () => {
    if (sel.needsSize) return setErr('Please select a size.');
    if (!sel.variant || sel.variant.stock <= 0) return setErr('This option is out of stock.');
    setErr('');
    add(product, sel.variant, qty);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} label={`Quick view: ${product.name}`}>
      <div className="grid md:grid-cols-2">
        <div className="bg-mist p-4">
          <div className="aspect-[4/5] overflow-hidden rounded-lg">
            <Img src={product.images[img]?.url} alt={product.images[img]?.alt || product.name} className="h-full w-full object-cover" sizes="(max-width:768px) 90vw, 480px" />
          </div>
          {product.images.length > 1 && (
            <div className="mt-3 flex gap-2">
              {product.images.map((im, i) => (
                <button key={im.id || i} onClick={() => setImg(i)} className={`h-16 w-14 overflow-hidden rounded-md ring-2 ${i === img ? 'ring-brand' : 'ring-transparent'}`} aria-label={`View image ${i + 1}`}>
                  <Img src={im.url} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-col p-6 sm:p-8">
          {product.category && <p className="text-xs font-semibold uppercase tracking-wider text-brand">{product.category.name}</p>}
          <h2 className="mt-1 font-display text-2xl font-bold leading-tight">{product.name}</h2>
          <div className="mt-2"><Stars rating={product.avg_rating} count={product.review_count} /></div>
          <div className="mt-3"><Price price={sel.variant?.price ?? product.price} compare={product.compare_at_price} size="lg" /></div>
          <div className="mt-2"><StockText stock={stock} /></div>
          <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-gray-600">{product.description}</p>
          <div className="mt-5"><VariantPicker product={product} sel={sel} error={err && sel.needsSize ? err : ''} /></div>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <QtyStepper value={qty} onChange={setQty} max={Math.max(1, stock)} />
            <button className="btn-primary flex-1" onClick={onAdd} disabled={stock <= 0}><ShoppingBag size={17} /> {stock > 0 ? 'Add to Cart' : 'Out of Stock'}</button>
            <button onClick={() => wish.toggle(product.id)} className={`grid h-11 w-11 place-items-center rounded-md border transition ${wish.has(product.id) ? 'border-sale bg-rose-50 text-sale' : 'border-line hover:border-ink'}`} aria-label="Toggle wishlist" aria-pressed={wish.has(product.id)}>
              <Heart size={18} className={wish.has(product.id) ? 'fill-current' : ''} />
            </button>
          </div>
          {err && !sel.needsSize && <p className="field-error">{err}</p>}
          <Link to={`/product/${product.slug}`} onClick={onClose} className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-brand hover:underline">View full details <ArrowRight size={14} /></Link>
        </div>
      </div>
    </Modal>
  );
}
