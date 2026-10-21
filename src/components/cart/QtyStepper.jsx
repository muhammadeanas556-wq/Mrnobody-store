import { Minus, Plus } from 'lucide-react';

export default function QtyStepper({ value, onChange, max = 50, min = 1, size = 'md', label = 'Quantity' }) {
  const h = size === 'sm' ? 'h-8' : 'h-11';
  const w = size === 'sm' ? 'w-8' : 'w-11';
  return (
    <div className={`inline-flex ${h} items-center overflow-hidden rounded-md border border-line bg-white`} role="group" aria-label={label}>
      <button type="button" className={`grid ${h} ${w} place-items-center transition hover:bg-mist disabled:opacity-40`} onClick={() => onChange(value - 1)} disabled={value <= min} aria-label="Decrease quantity"><Minus size={14} /></button>
      <input
        className="h-full w-10 border-x border-line text-center text-sm font-semibold outline-none"
        value={value}
        inputMode="numeric"
        aria-label={label}
        onChange={(e) => {
          const n = parseInt(e.target.value.replace(/\D/g, ''), 10);
          if (!Number.isNaN(n)) onChange(Math.max(min, Math.min(max, n)));
        }}
      />
      <button type="button" className={`grid ${h} ${w} place-items-center transition hover:bg-mist disabled:opacity-40`} onClick={() => onChange(value + 1)} disabled={value >= max} aria-label="Increase quantity"><Plus size={14} /></button>
    </div>
  );
}
