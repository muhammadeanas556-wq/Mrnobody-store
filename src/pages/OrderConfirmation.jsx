import { Link, useLocation, useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { CheckCircle2, Copy, Banknote } from 'lucide-react';
import { useState } from 'react';
import { useSEO } from '../hooks/useSEO';
import { useStore } from '../contexts/StoreContext';
import { pkr } from '../lib/format';
import { waLink } from '../components/layout/FloatingActions';
import { WhatsAppIcon } from '../components/ui/SocialIcons';
import Img from '../components/ui/Img';

export default function OrderConfirmation() {
  const { number } = useParams();
  const { state } = useLocation();
  const { settings } = useStore();
  const [copied, setCopied] = useState(false);
  useSEO({ title: `Order ${number} confirmed | MrNobody`, noindex: true });

  let order = state?.order;
  if (!order) {
    try { order = JSON.parse(sessionStorage.getItem(`mrnobody-order-${number}`) || 'null'); } catch { order = null; }
  }
  const wa = settings.whatsapp_number
    ? waLink(settings.whatsapp_number, `Hi MrNobody, I just placed order ${number}${order ? ` (total ${pkr(order.total)})` : ''}. Please confirm.`)
    : null;

  return (
    <div className="container-site max-w-2xl py-14 text-center">
      <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 16 }}
        className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-emerald-50 text-emerald-500">
        <CheckCircle2 size={44} strokeWidth={1.8} />
      </motion.div>
      <h1 className="mt-6 font-display text-3xl font-bold">Thank you for your order!</h1>
      <p className="mt-2 text-gray-600">Your order has been received and will be confirmed shortly{order?.customer_name ? `, ${order.customer_name.split(' ')[0]}` : ''}.</p>

      <div className="mx-auto mt-8 inline-flex items-center gap-3 rounded-xl border border-dashed border-brand bg-brand-soft px-6 py-4">
        <div className="text-left">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Order number</p>
          <p className="font-display text-2xl font-bold text-brand">{number}</p>
        </div>
        <button onClick={() => { navigator.clipboard?.writeText(number); setCopied(true); }} className="grid h-10 w-10 place-items-center rounded-md bg-white text-brand shadow-sm hover:bg-brand hover:text-white" aria-label="Copy order number">
          <Copy size={16} />
        </button>
      </div>
      {copied && <p className="mt-2 text-xs text-emerald-600" role="status">Copied!</p>}
      <p className="mt-3 text-sm text-gray-500">Please keep this number for any questions about your order.</p>

      {order && (
        <div className="card mt-10 p-6 text-left">
          <h2 className="font-display text-lg font-semibold">Order summary</h2>
          <ul className="mt-3 divide-y divide-line">
            {(order.items || []).map((it, k) => (
              <li key={k} className="flex items-center gap-3 py-3">
                <Img src={it.image_url} alt="" className="h-14 w-12 rounded bg-mist object-cover" />
                <span className="flex-1 text-sm"><b className="font-medium">{it.name}</b>{it.label && <span className="block text-xs text-gray-500">{it.label}</span>}</span>
                <span className="text-sm">{it.qty} × {pkr(it.unit)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-3 space-y-1.5 border-t border-line pt-3 text-sm">
            <div className="flex justify-between"><dt className="text-gray-600">Subtotal</dt><dd>{pkr(order.subtotal)}</dd></div>
            {Number(order.discount) > 0 && <div className="flex justify-between text-emerald-600"><dt>Discount</dt><dd>−{pkr(order.discount)}</dd></div>}
            <div className="flex justify-between"><dt className="text-gray-600">Delivery</dt><dd>{Number(order.delivery_fee) ? pkr(order.delivery_fee) : 'Free'}</dd></div>
            <div className="flex justify-between text-base font-bold"><dt>Total</dt><dd>{pkr(order.total)}</dd></div>
          </dl>
          <p className="mt-4 flex items-center gap-2 rounded-md bg-mist px-3 py-2 text-sm"><Banknote size={16} className="text-brand" /> Payment: Cash on Delivery — please keep {pkr(order.total)} ready.</p>
        </div>
      )}

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link to="/shop" className="btn-primary">Continue shopping</Link>
        {wa && (
          <a href={wa} target="_blank" rel="noopener noreferrer" className="btn border border-[#25D366] text-[#128C7E] hover:bg-[#25D366] hover:text-white">
            <WhatsAppIcon /> Confirm on WhatsApp
          </a>
        )}
      </div>
    </div>
  );
}
