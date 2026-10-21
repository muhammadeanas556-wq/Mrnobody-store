import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle2, AlertCircle, Upload, X, Loader2, GripVertical, ArrowUp, ArrowDown } from 'lucide-react';
import { uploadImage } from './lib';
import { STATUS_STYLE } from '../lib/format';

/* ---------- Toasts ---------- */
const ToastCtx = createContext(() => {});
export function ToastProvider({ children }) {
  const [list, setList] = useState([]);
  const push = useCallback((msg, type = 'success') => {
    const id = Math.random();
    setList((l) => [...l, { id, msg, type }]);
    setTimeout(() => setList((l) => l.filter((t) => t.id !== id)), type === 'error' ? 6000 : 3000);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2" aria-live="polite">
        <AnimatePresence>
          {list.map((t) => (
            <motion.div key={t.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 30 }}
              className={`flex max-w-sm items-start gap-2 rounded-lg px-4 py-3 text-sm text-white shadow-lift ${t.type === 'error' ? 'bg-rose-600' : 'bg-ink'}`}>
              {t.type === 'error' ? <AlertCircle size={17} className="mt-0.5 shrink-0" /> : <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-emerald-400" />}
              {t.msg}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>
  );
}
export const useToast = () => useContext(ToastCtx);

/* ---------- Layout bits ---------- */
export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-display text-2xl font-bold">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-gray-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({ title, children, actions, className = '' }) {
  return (
    <section className={`card p-5 ${className}`}>
      {(title || actions) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title && <h2 className="font-display text-base font-semibold">{title}</h2>}
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

export function StatusBadge({ status }) {
  return <span className={`chip capitalize ${STATUS_STYLE[status] || 'bg-gray-100 text-gray-600 ring-gray-200'}`}>{status}</span>;
}

export function Toggle({ checked, onChange, label, description }) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4">
      <span>
        <span className="text-sm font-medium">{label}</span>
        {description && <span className="block text-xs text-gray-500">{description}</span>}
      </span>
      <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition ${checked ? 'bg-brand' : 'bg-gray-300'}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${checked ? 'left-[22px]' : 'left-0.5'}`} />
      </button>
    </label>
  );
}

export function Field({ label, hint, children, className = '' }) {
  return (
    <label className={`block ${className}`}>
      <span className="label">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-gray-500">{hint}</span>}
    </label>
  );
}

export function SaveBar({ saving, dirty = true, onSave, label = 'Save changes' }) {
  return (
    <button type={onSave ? 'button' : 'submit'} onClick={onSave} disabled={saving || !dirty} className="btn-primary">
      {saving ? <><Loader2 size={16} className="animate-spin" /> Saving…</> : label}
    </button>
  );
}

/* ---------- Image upload (single) ---------- */
export function ImageInput({ value, onChange, folder = 'banners', label = 'Image', aspect = 'aspect-video' }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const ref = useRef();
  const pick = async (file) => {
    if (!file) return;
    setBusy(true); setErr('');
    try { const { url } = await uploadImage(file, folder); onChange(url); } catch (e) { setErr(e.message); }
    finally { setBusy(false); if (ref.current) ref.current.value = ''; }
  };
  return (
    <div>
      <span className="label">{label}</span>
      <div className={`relative ${aspect} overflow-hidden rounded-lg border-2 border-dashed border-line bg-mist`}>
        {value ? <img src={value} alt="" className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-xs text-gray-400">No image</div>}
        {busy && <div className="absolute inset-0 grid place-items-center bg-white/70"><Loader2 className="animate-spin text-brand" /></div>}
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        <button type="button" onClick={() => ref.current?.click()} className="btn-outline btn-sm"><Upload size={14} /> Upload</button>
        {value && <button type="button" onClick={() => onChange('')} className="btn-ghost btn-sm text-sale">Remove</button>}
      </div>
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
      <input className="input mt-2 h-9 text-xs" placeholder="…or paste an image URL" value={value || ''} onChange={(e) => onChange(e.target.value)} />
      {err && <p className="field-error">{err}</p>}
    </div>
  );
}

/* ---------- Multi image manager (product gallery) ---------- */
export function GalleryInput({ images, onChange }) {
  const [busy, setBusy] = useState(0);
  const [err, setErr] = useState('');
  const ref = useRef();
  const pick = async (files) => {
    const list = [...(files || [])];
    if (!list.length) return;
    setErr(''); setBusy(list.length);
    const added = [];
    for (const f of list) {
      try { const r = await uploadImage(f, 'products'); added.push({ url: r.url, storage_path: r.path, alt: '' }); }
      catch (e) { setErr(e.message); }
      setBusy((b) => b - 1);
    }
    onChange([...images, ...added]);
    if (ref.current) ref.current.value = '';
  };
  const move = (i, d) => {
    const j = i + d;
    if (j < 0 || j >= images.length) return;
    const next = [...images];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  return (
    <div>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {images.map((im, i) => (
          <div key={im.id || im.url} className="group relative">
            <div className="aspect-[4/5] overflow-hidden rounded-lg bg-mist ring-1 ring-line">
              <img src={im.url} alt={im.alt} className="h-full w-full object-cover" />
            </div>
            {i === 0 && <span className="absolute left-1.5 top-1.5 rounded bg-brand px-1.5 py-0.5 text-[10px] font-bold text-white">MAIN</span>}
            <button type="button" onClick={() => onChange(images.filter((_, k) => k !== i))} className="absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full bg-white text-sale shadow" aria-label="Remove image"><X size={13} /></button>
            <div className="mt-1 flex justify-center gap-1">
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="grid h-6 w-6 place-items-center rounded border border-line disabled:opacity-30" aria-label="Move left"><ArrowUp size={12} className="-rotate-90" /></button>
              <GripVertical size={14} className="mt-1 text-gray-300" aria-hidden />
              <button type="button" onClick={() => move(i, 1)} disabled={i === images.length - 1} className="grid h-6 w-6 place-items-center rounded border border-line disabled:opacity-30" aria-label="Move right"><ArrowDown size={12} className="-rotate-90" /></button>
            </div>
          </div>
        ))}
        <button type="button" onClick={() => ref.current?.click()} className="grid aspect-[4/5] place-items-center rounded-lg border-2 border-dashed border-line text-gray-500 transition hover:border-brand hover:text-brand">
          {busy ? <span className="flex flex-col items-center gap-1 text-xs"><Loader2 className="animate-spin" /> Uploading {busy}…</span> : <span className="flex flex-col items-center gap-1 text-xs"><Upload size={20} /> Add images</span>}
        </button>
      </div>
      <input ref={ref} type="file" accept="image/*" multiple className="hidden" onChange={(e) => pick(e.target.files)} />
      {err && <p className="field-error">{err}</p>}
      <p className="mt-2 text-xs text-gray-500">Images are compressed and stored in Supabase Storage. The first image is the main product photo.</p>
    </div>
  );
}

export function Empty({ children }) {
  return <div className="rounded-lg border border-dashed border-line p-10 text-center text-sm text-gray-500">{children}</div>;
}
