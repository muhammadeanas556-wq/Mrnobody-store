import { motion } from 'motion/react';
import { Truck, ShieldCheck, RotateCcw, Headset, Banknote, Gift, Clock, BadgeCheck } from 'lucide-react';

export const TRUST_ICONS = { truck: Truck, shield: ShieldCheck, rotate: RotateCcw, headset: Headset, cash: Banknote, gift: Gift, clock: Clock, badge: BadgeCheck };

export default function TrustRow({ items = [] }) {
  if (!items.length) return null;
  return (
    <section className="border-b border-line bg-white" aria-label="Our services">
      <div className="container-site grid grid-cols-2 divide-line py-6 lg:grid-cols-4 lg:divide-x">
        {items.map((t, k) => {
          const Icon = TRUST_ICONS[t.icon] || BadgeCheck;
          return (
            <motion.div key={k} className="flex items-center gap-3.5 px-2 py-3 sm:px-6"
              initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: k * 0.08, duration: 0.5 }}>
              <motion.span
                className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-brand-soft text-brand"
                initial={{ rotate: -20, scale: 0.7 }} whileInView={{ rotate: 0, scale: 1 }} viewport={{ once: true }}
                transition={{ delay: 0.15 + k * 0.08, type: 'spring', stiffness: 260, damping: 14 }}
              >
                <Icon size={24} strokeWidth={1.6} aria-hidden />
              </motion.span>
              <div>
                <h3 className="text-[15px] font-semibold">{t.title}</h3>
                <p className="text-[13px] text-gray-500">{t.text}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
