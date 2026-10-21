import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { ShoppingBag, Trash2, ArrowLeft, Truck, Info } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useCartSync } from '../hooks/useCartSync';
import { useSEO } from '../hooks/useSEO';
import Img from '../components/ui/Img';
import QtyStepper from '../components/cart/QtyStepper';
import { EmptyState } from '../components/ui/States';
import { pkr } from '../lib/format';

export default function Cart() {
  const { items, setQty, remove, subtotal, delivery, total, remainingForFree, threshold, clear } = useCart();
  const { notes } = useCartSync();
  useSEO({ title: 'Shopping Cart | MrNobody', noindex: true });

  if (!items.length) {
    return (
      <div className="container-site py-10">
        <EmptyState icon={ShoppingBag} title="Your cart is empty" text="Looks like you haven’t added anything yet." action={<Link to="/shop" className="btn-primary">Start shopping</Link>} />
      </div>
    );
  }

  return (
    <div className="container-site py-10">
      <h1 className="font-display text-3xl font-bold">Shopping Cart</h1>
      {notes.length > 0 && (
        <div className="mt-4 space-y-1 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800" role="status">
          {notes.map((n, i) => <p key={i} className="flex gap-2"><Info size={15} className="mt-0.5 shrink-0" /> {n}</p>)}
        </div>
      )}
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
        <div>
          <div className="hidden grid-cols-[1fr_140px_120px_40px] gap-4 border-b border-line pb-3 text-xs font-semibold uppercase tracking-wider text-gray-500 md:grid">
            <span>Product</span><span>Quantity</span><span className="text-right">Total</span><span />
          </div>
          <ul className="divide-y divide-line">
            <AnimatePresence initial={false}>
              {items.map((i) => (
                <motion.li key={i.variant_id} layout exit={{ opacity: 0, x: -30 }} className="grid grid-cols-[80px_1fr] gap-4 py-5 md:grid-cols-[1fr_140px_120px_40px] md:items-center">
                  <div className="col-span-2 flex gap-4 md:col-span-1">
                    <Link to={`/product/${i.slug}`} className="shrink-0"><Img src={i.image} alt={i.name} className="h-28 w-[88px] rounded-md bg-mist object-cover" /></Link>
                    <div className="min-w-0">
                      <Link to={`/product/${i.slug}`} className="font-medium hover:text-brand">{i.name}</Link>
                      {i.label && <p className="mt-0.5 text-sm text-gray-500">{i.label}</p>}
                      <p className="mt-1 text-sm font-semibold">{pkr(i.price)}</p>
                      <div className="mt-3 flex items-center gap-3 md:hidden">
                        <QtyStepper size="sm" value={i.qty} max={i.max} onChange={(q) => setQty(i.variant_id, q)} />
                        <button onClick={() => remove(i.variant_id)} className="text-xs text-gray-500 underline">Remove</button>
                      </div>
                    </div>
                  </div>
                  <div className="hidden md:block"><QtyStepper size="sm" value={i.qty} max={i.max} onChange={(q) => setQty(i.variant_id, q)} /></div>
                  <p className="hidden text-right font-semibold md:block">{pkr(i.price * i.qty)}</p>
                  <button onClick={() => remove(i.variant_id)} className="hidden h-9 w-9 place-items-center rounded-full text-gray-400 hover:bg-rose-50 hover:text-sale md:grid" aria-label={`Remove ${i.name}`}><Trash2 size={16} /></button>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
          <div className="mt-4 flex justify-between">
            <Link to="/shop" className="btn-ghost"><ArrowLeft size={16} /> Continue shopping</Link>
            <button onClick={clear} className="btn-ghost text-sale">Clear cart</button>
          </div>
        </div>

        <aside className="card h-fit p-6 lg:sticky lg:top-28">
          <h2 className="font-display text-lg font-semibold">Order Summary</h2>
          {threshold > 0 && (
            <p className="mt-3 flex items-center gap-2 rounded-md bg-brand-soft px-3 py-2 text-[13px] text-brand">
              <Truck size={15} /> {remainingForFree > 0 ? <>Add {pkr(remainingForFree)} more for free delivery</> : 'Free delivery unlocked'}
            </p>
          )}
          <dl className="mt-4 space-y-2.5 text-sm">
            <div className="flex justify-between"><dt className="text-gray-600">Subtotal</dt><dd className="font-medium">{pkr(subtotal)}</dd></div>
            <div className="flex justify-between"><dt className="text-gray-600">Delivery</dt><dd className="font-medium">{delivery ? pkr(delivery) : 'Free'}</dd></div>
            <div className="flex justify-between border-t border-line pt-3 text-base font-bold"><dt>Total</dt><dd>{pkr(total)}</dd></div>
          </dl>
          <p className="mt-2 text-xs text-gray-500">Final prices and stock are confirmed when you place your order. Promo codes can be applied at checkout.</p>
          <Link to="/checkout" className="btn-primary mt-5 h-12 w-full">Proceed to Checkout</Link>
        </aside>
      </div>
    </div>
  );
}
