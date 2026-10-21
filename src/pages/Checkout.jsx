import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Banknote, Lock, Tag, Info, ShoppingBag, Loader2 } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useStore } from '../contexts/StoreContext';
import { useCartSync } from '../hooks/useCartSync';
import { useSEO } from '../hooks/useSEO';
import { checkPromo, placeOrder } from '../services/catalog';
import { pkr, PROVINCES, isPkMobile } from '../lib/format';
import { isConfigured } from '../lib/supabase';
import Img from '../components/ui/Img';
import { EmptyState, ErrorNote } from '../components/ui/States';

const FIELDS = { full_name: '', email: '', phone: '', province: '', city: '', address: '', notes: '' };

// Payment methods. Add online gateways here later (e.g. { id: 'card', label: 'Card', enabled: false }).
const PAYMENT_METHODS = [{ id: 'cod', label: 'Cash on Delivery', desc: 'Pay in cash when your order arrives.', enabled: true }];

export default function Checkout() {
  const { items, subtotal, threshold, clear } = useCart();
  const { settings } = useStore();
  const { notes } = useCartSync();
  const nav = useNavigate();
  const [f, setF] = useState(FIELDS);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');
  const [promoInput, setPromoInput] = useState('');
  const [promo, setPromo] = useState(null);
  const [promoMsg, setPromoMsg] = useState('');
  const [payment, setPayment] = useState('cod');
  useSEO({ title: 'Checkout | MrNobody', noindex: true });

  if (!items.length) {
    return <div className="container-site py-10"><EmptyState icon={ShoppingBag} title="Your cart is empty" text="Add products to your cart before checking out." action={<Link to="/shop" className="btn-primary">Browse products</Link>} /></div>;
  }

  const discount = promo?.discount || 0;
  const baseFee = Number(settings.delivery_fee || 0);
  const fee = threshold > 0 && subtotal - discount >= threshold ? 0 : baseFee;
  const total = subtotal - discount + fee;

  const set = (k) => (e) => { setF({ ...f, [k]: e.target.value }); if (errors[k]) setErrors({ ...errors, [k]: '' }); };

  const validate = () => {
    const e = {};
    if (f.full_name.trim().length < 3) e.full_name = 'Please enter your full name.';
    if (!isPkMobile(f.phone)) e.phone = 'Enter a valid Pakistani mobile number, e.g. 0300 1234567.';
    if (f.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email)) e.email = 'Please enter a valid email or leave it blank.';
    if (!f.province) e.province = 'Please select your province.';
    if (f.city.trim().length < 2) e.city = 'Please enter your city.';
    if (f.address.trim().length < 10) e.address = 'Please enter your complete address (house, street, area).';
    setErrors(e);
    if (Object.keys(e).length) document.getElementById(`co-${Object.keys(e)[0]}`)?.focus();
    return !Object.keys(e).length;
  };

  const applyPromo = async () => {
    if (!promoInput.trim()) return;
    setPromoMsg('');
    const r = await checkPromo(promoInput.trim(), subtotal);
    if (r.valid) { setPromo(r); setPromoMsg(`Code ${r.code} applied.`); }
    else { setPromo(null); setPromoMsg(r.message); }
  };

  const submit = async (e) => {
    e.preventDefault();
    setServerError('');
    if (!validate()) return;
    setSubmitting(true);
    try {
      const order = await placeOrder({
        ...f,
        website: e.target.website?.value || '',
        promo_code: promo?.code || '',
        payment_method: payment,
        items: items.map((i) => ({ variant_id: i.variant_id, quantity: i.qty })),
      });
      const summary = { ...order, customer_name: f.full_name, phone: f.phone, city: f.city };
      try { sessionStorage.setItem(`mrnobody-order-${order.order_number}`, JSON.stringify(summary)); } catch { /* ignore */ }
      clear();
      nav(`/order/${order.order_number}`, { replace: true, state: { order: summary } });
    } catch (err) {
      setServerError(err.message);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSubmitting(false);
    }
  };

  const field = (k, label, children, optional) => (
    <div>
      <label htmlFor={`co-${k}`} className="label">{label}{optional ? <span className="font-normal text-gray-400"> (optional)</span> : <span className="text-sale"> *</span>}</label>
      {children}
      {errors[k] && <p className="field-error" id={`co-${k}-err`} role="alert">{errors[k]}</p>}
    </div>
  );
  const aria = (k) => ({ id: `co-${k}`, 'aria-invalid': !!errors[k], 'aria-describedby': errors[k] ? `co-${k}-err` : undefined });

  return (
    <div className="container-site py-10">
      <h1 className="font-display text-3xl font-bold">Checkout</h1>
      {!isConfigured && <div className="mt-4"><ErrorNote>Checkout is disabled in the demo preview. Connect Supabase and deploy to Netlify to accept real orders (see README).</ErrorNote></div>}
      {serverError && <div className="mt-4"><ErrorNote>{serverError}</ErrorNote></div>}
      {notes.length > 0 && (
        <div className="mt-4 space-y-1 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800" role="status">
          {notes.map((n, i) => <p key={i} className="flex gap-2"><Info size={15} className="mt-0.5 shrink-0" /> {n}</p>)}
        </div>
      )}

      <form onSubmit={submit} noValidate className="mt-8 grid gap-8 lg:grid-cols-[1fr_420px]">
        <div className="space-y-8">
          <section className="card p-6">
            <h2 className="font-display text-lg font-semibold">Contact & Delivery</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">{field('full_name', 'Full name', <input {...aria('full_name')} className="input" autoComplete="name" value={f.full_name} onChange={set('full_name')} />)}</div>
              {field('phone', 'Mobile number', <input {...aria('phone')} className="input" type="tel" inputMode="tel" autoComplete="tel" placeholder="03XX XXXXXXX" value={f.phone} onChange={set('phone')} />)}
              {field('email', 'Email', <input {...aria('email')} className="input" type="email" autoComplete="email" value={f.email} onChange={set('email')} />, true)}
              {field('province', 'Province', <select {...aria('province')} className="input" value={f.province} onChange={set('province')} autoComplete="address-level1">
                  <option value="">Select province</option>
                  {PROVINCES.map((p) => <option key={p}>{p}</option>)}
                </select>)}
              {field('city', 'City', <input {...aria('city')} className="input" autoComplete="address-level2" value={f.city} onChange={set('city')} />)}
              <div className="sm:col-span-2">{field('address', 'Complete delivery address', <textarea {...aria('address')} rows={3} className="input" autoComplete="street-address" placeholder="House #, street, area, nearby landmark" value={f.address} onChange={set('address')} />)}</div>
              <div className="sm:col-span-2">{field('notes', 'Order notes', <textarea {...aria('notes')} rows={2} className="input" maxLength={500} value={f.notes} onChange={set('notes')} />, true)}</div>
              {/* honeypot */}
              <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
            </div>
          </section>

          <section className="card p-6">
            <h2 className="font-display text-lg font-semibold">Payment Method</h2>
            <div className="mt-4 space-y-3">
              {PAYMENT_METHODS.filter((m) => m.enabled).map((m) => (
                <label key={m.id} className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition ${payment === m.id ? 'border-brand bg-brand-soft/50' : 'border-line'}`}>
                  <input type="radio" name="payment" value={m.id} checked={payment === m.id} onChange={() => setPayment(m.id)} className="mt-1 accent-[rgb(var(--brand))]" />
                  <Banknote size={20} className="mt-0.5 text-brand" />
                  <span><b className="block text-sm">{m.label}</b><span className="text-[13px] text-gray-500">{m.desc}</span></span>
                </label>
              ))}
            </div>
          </section>
        </div>

        <aside className="card h-fit p-6 lg:sticky lg:top-28">
          <h2 className="font-display text-lg font-semibold">Your Order</h2>
          <ul className="mt-4 max-h-72 divide-y divide-line overflow-y-auto pr-1">
            {items.map((i) => (
              <li key={i.variant_id} className="flex gap-3 py-3">
                <span className="relative shrink-0">
                  <Img src={i.image} alt="" className="h-16 w-14 rounded-md bg-mist object-cover" />
                  <span className="absolute -right-2 -top-2 grid h-5 min-w-5 place-items-center rounded-full bg-ink px-1 text-[10px] font-bold text-white">{i.qty}</span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="line-clamp-1 text-sm font-medium">{i.name}</span>
                  {i.label && <span className="text-xs text-gray-500">{i.label}</span>}
                </span>
                <span className="text-sm font-semibold">{pkr(i.price * i.qty)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 border-t border-line pt-4">
            <label htmlFor="promo" className="label flex items-center gap-1.5"><Tag size={14} /> Promo code</label>
            <div className="flex gap-2">
              <input id="promo" className="input h-10 uppercase" value={promoInput} onChange={(e) => setPromoInput(e.target.value)} />
              <button type="button" onClick={applyPromo} className="btn-outline btn-sm h-10">Apply</button>
            </div>
            {promoMsg && <p className={`mt-1 text-xs ${promo ? 'text-emerald-600' : 'text-sale'}`}>{promoMsg}</p>}
          </div>
          <dl className="mt-4 space-y-2.5 border-t border-line pt-4 text-sm">
            <div className="flex justify-between"><dt className="text-gray-600">Subtotal</dt><dd>{pkr(subtotal)}</dd></div>
            {discount > 0 && <div className="flex justify-between text-emerald-600"><dt>Discount ({promo.code})</dt><dd>−{pkr(discount)}</dd></div>}
            <div className="flex justify-between"><dt className="text-gray-600">Delivery</dt><dd>{fee ? pkr(fee) : 'Free'}</dd></div>
            <div className="flex justify-between border-t border-line pt-3 text-lg font-bold"><dt>Total</dt><dd>{pkr(total)}</dd></div>
          </dl>
          <button className="btn-primary mt-5 h-12 w-full" disabled={submitting || !isConfigured}>
            {submitting ? <><Loader2 size={17} className="animate-spin" /> Placing order…</> : <><Lock size={16} /> Place Order — {pkr(total)}</>}
          </button>
          <p className="mt-3 text-center text-xs text-gray-500">By placing your order you agree to our <Link to="/page/terms" className="underline">Terms</Link> and <Link to="/page/returns" className="underline">Return Policy</Link>.</p>
        </aside>
      </form>
    </div>
  );
}
