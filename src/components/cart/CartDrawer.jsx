import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { ShoppingBag, Trash2, X, Truck } from 'lucide-react';
import Modal from '../ui/Modal';
import Img from '../ui/Img';
import QtyStepper from './QtyStepper';
import { useCart } from '../../contexts/CartContext';
import { pkr } from '../../lib/format';
import { EmptyState } from '../ui/States';

export default function CartDrawer() {
  const { items, open, setOpen, setQty, remove, subtotal, delivery, total, threshold, remainingForFree, count } = useCart();
  const close = () => setOpen(false);
  const pct = threshold ? Math.min(100, (subtotal / threshold) * 100) : 0;

  return (
    <Modal open={open} onClose={close} side="right" label="Shopping cart">
      <div className="flex h-full flex-col">
        <div className="flex h-16 items-center justify-between border-b border-line px-5">
          <h2 className="font-display text-lg font-semibold">Your Cart <span className="text-gray-400">({count})</span></h2>
          <button onClick={close} className="grid h-9 w-9 place-items-center rounded-full hover:bg-mist" aria-label="Close cart"><X size={20} /></button>
        </div>

        {!items.length ? (
          <div className="flex flex-1 items-center">
            <EmptyState icon={ShoppingBag} title="Your cart is empty" text="Browse the collection and add something you love." action={<Link to="/shop" onClick={close} className="btn-primary">Start shopping</Link>} />
          </div>
        ) : (
          <>
            {threshold > 0 && (
              <div className="border-b border-line bg-brand-soft/60 px-5 py-3">
                <p className="flex items-center gap-2 text-[13px]">
                  <Truck size={15} className="text-brand" />
                  {remainingForFree > 0 ? <>Add <b>{pkr(remainingForFree)}</b> more for free delivery</> : <b className="text-brand">You’ve unlocked free delivery!</b>}
                </p>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white">
                  <motion.div className="h-full rounded-full bg-brand" initial={false} animate={{ width: `${pct}%` }} transition={{ duration: 0.5 }} />
                </div>
              </div>
            )}
            <ul className="flex-1 divide-y divide-line overflow-y-auto px-5">
              <AnimatePresence initial={false}>
                {items.map((i) => (
                  <motion.li key={i.variant_id} layout initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 40, height: 0 }} className="flex gap-3 py-4">
                    <Link to={`/product/${i.slug}`} onClick={close} className="shrink-0">
                      <Img src={i.image} alt={i.name} className="h-24 w-20 rounded-md bg-mist object-cover" />
                    </Link>
                    <div className="min-w-0 flex-1">
                      <div className="flex justify-between gap-2">
                        <Link to={`/product/${i.slug}`} onClick={close} className="line-clamp-2 text-sm font-medium hover:text-brand">{i.name}</Link>
                        <button onClick={() => remove(i.variant_id)} className="h-7 w-7 shrink-0 rounded text-gray-400 hover:bg-rose-50 hover:text-sale" aria-label={`Remove ${i.name}`}><Trash2 size={15} className="mx-auto" /></button>
                      </div>
                      {i.label && <p className="mt-0.5 text-xs text-gray-500">{i.label}</p>}
                      <div className="mt-2 flex items-center justify-between">
                        <QtyStepper size="sm" value={i.qty} max={i.max} onChange={(q) => setQty(i.variant_id, q)} />
                        <span className="text-sm font-semibold">{pkr(i.price * i.qty)}</span>
                      </div>
                    </div>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
            <div className="space-y-2 border-t border-line p-5 text-sm">
              <div className="flex justify-between"><span className="text-gray-600">Subtotal</span><span className="font-medium">{pkr(subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Delivery</span><span className="font-medium">{delivery ? pkr(delivery) : 'Free'}</span></div>
              <div className="flex justify-between border-t border-line pt-2 text-base font-bold"><span>Total</span><span>{pkr(total)}</span></div>
              <div className="grid grid-cols-2 gap-2 pt-2">
                <Link to="/cart" onClick={close} className="btn-outline">View Cart</Link>
                <Link to="/checkout" onClick={close} className="btn-primary">Checkout</Link>
              </div>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
