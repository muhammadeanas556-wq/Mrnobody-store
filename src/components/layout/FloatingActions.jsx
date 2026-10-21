import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowUp, CheckCircle2 } from 'lucide-react';
import { useStore } from '../../contexts/StoreContext';
import { useCart } from '../../contexts/CartContext';
import { WhatsAppIcon } from '../ui/SocialIcons';

export function waLink(number, message) {
  const digits = String(number || '').replace(/\D/g, '').replace(/^0/, '92');
  return digits ? `https://wa.me/${digits}?text=${encodeURIComponent(message || '')}` : null;
}

export default function FloatingActions() {
  const { settings } = useStore();
  const { toast, setToast } = useCart();
  const [showTop, setShowTop] = useState(false);
  const wa = settings.whatsapp_enabled ? waLink(settings.whatsapp_number, settings.whatsapp_message) : null;

  useEffect(() => {
    const on = () => setShowTop(window.scrollY > 700);
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast, setToast]);

  return (
    <>
      <div className="fixed bottom-5 right-4 z-40 flex flex-col items-end gap-3 sm:right-6">
        <AnimatePresence>
          {showTop && (
            <motion.button
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }}
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="grid h-11 w-11 place-items-center rounded-full bg-white text-ink shadow-lift ring-1 ring-line transition hover:bg-brand hover:text-white"
              aria-label="Scroll to top"
            >
              <ArrowUp size={18} />
            </motion.button>
          )}
        </AnimatePresence>
        {wa && (
          <a href={wa} target="_blank" rel="noopener noreferrer" aria-label="Chat with us on WhatsApp"
            className="grid h-14 w-14 place-items-center rounded-full bg-[#25D366] text-white shadow-lift transition hover:scale-105">
            <WhatsAppIcon width={28} height={28} strokeWidth={1.7} />
          </a>
        )}
      </div>
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.at}
            role="status"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-5 left-1/2 z-[90] flex -translate-x-1/2 items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm text-white shadow-lift"
          >
            <CheckCircle2 size={17} className="text-emerald-400" /> <span className="max-w-[60vw] truncate">{toast.name}</span> added to cart
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
