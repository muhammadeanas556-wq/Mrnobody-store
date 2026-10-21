import { Star } from 'lucide-react';
import { pkr, discountPct } from '../../lib/format';

export function Price({ price, compare, size = 'md' }) {
  const off = discountPct(price, compare);
  const big = size === 'lg';
  return (
    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
      <span className={`font-bold text-ink ${big ? 'text-2xl sm:text-3xl' : 'text-[15px]'}`}>{pkr(price)}</span>
      {off > 0 && <span className={`text-gray-400 line-through ${big ? 'text-base' : 'text-[13px]'}`}>{pkr(compare)}</span>}
      {big && off > 0 && <span className="chip bg-rose-50 text-sale ring-rose-200">Save {off}%</span>}
    </div>
  );
}

export function StockText({ stock, low = 5 }) {
  if (stock <= 0) return <span className="text-xs font-medium text-sale">Out of stock</span>;
  if (stock <= low) return <span className="text-xs font-medium text-amber-600">Only {stock} left</span>;
  return <span className="text-xs font-medium text-emerald-600">In stock</span>;
}

/** Only rendered when genuine approved reviews exist. */
export function Stars({ rating, count, size = 13 }) {
  if (!rating || !count) return null;
  return (
    <div className="flex items-center gap-1" aria-label={`Rated ${rating} out of 5 from ${count} reviews`}>
      <div className="flex">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star key={i} size={size} className={i <= Math.round(rating) ? 'fill-gold text-gold' : 'text-gray-300'} />
        ))}
      </div>
      <span className="text-xs text-gray-500">({count})</span>
    </div>
  );
}
