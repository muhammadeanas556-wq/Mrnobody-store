import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import Img from '../ui/Img';
import { Reveal } from '../ui/Reveal';

function PromoCard({ b, size = 'small', className = '' }) {
  if (!b) return null;
  const big = size === 'large';
  return (
    <Link to={b.button_link || '/shop'} className={`group relative block overflow-hidden rounded-xl bg-mist ${className}`} aria-label={`${b.title} — ${b.button_text || 'Shop now'}`}>
      <Img src={b.image_url} alt={b.title} sizes={big ? '(max-width:1024px) 100vw, 50vw' : '(max-width:1024px) 100vw, 25vw'}
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.07]" />
      <div className={`absolute inset-0 ${big ? 'bg-gradient-to-t from-ink/75 via-ink/20 to-transparent sm:bg-gradient-to-r sm:from-ink/70 sm:via-ink/25' : 'bg-gradient-to-r from-ink/70 via-ink/25 to-transparent'}`} />
      <div className={`relative flex h-full flex-col justify-end p-5 text-white sm:justify-center ${big ? 'sm:p-10' : 'sm:p-7'}`}>
        {b.eyebrow && <p className="text-[11px] font-semibold tracking-[0.22em] text-white/80">{b.eyebrow}</p>}
        <h3 className={`mt-1.5 font-display font-bold leading-tight ${big ? 'text-3xl sm:text-[42px]' : 'text-xl sm:text-2xl'}`}>{b.title}</h3>
        {b.subtitle && <p className={`mt-1.5 text-white/90 ${big ? 'text-base sm:text-lg' : 'text-sm'}`}>{b.subtitle}</p>}
        <span className={`mt-4 inline-flex w-fit items-center gap-2 bg-white text-ink transition-all duration-300 group-hover:gap-3 group-hover:bg-brand group-hover:text-white ${big ? 'h-11 px-6 text-sm' : 'h-9 px-4 text-xs'} font-semibold`} style={{ borderRadius: 'var(--radius-btn)' }}>
          {b.button_text || 'SHOP NOW'} <ArrowRight size={big ? 16 : 14} />
        </span>
      </div>
    </Link>
  );
}

export default function CategoryCollage({ banners }) {
  const slot = (s) => banners.find((b) => b.slot === s);
  const large = slot('large'), s1 = slot('small-1'), s2 = slot('small-2'), wide = slot('wide');
  if (!large && !s1 && !s2 && !wide) return null;
  return (
    <section className="container-site pt-14" aria-label="Shop by collection">
      <div className="grid gap-4 lg:grid-cols-2 lg:gap-5">
        <Reveal className="min-h-[340px] sm:min-h-[420px] lg:min-h-[540px]">
          <PromoCard b={large} size="large" className="h-full" />
        </Reveal>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-rows-2 lg:gap-5">
          <Reveal delay={0.08} className="min-h-[230px]"><PromoCard b={s1} className="h-full" /></Reveal>
          <Reveal delay={0.16} className="min-h-[230px]"><PromoCard b={s2} className="h-full" /></Reveal>
          <Reveal delay={0.24} className="min-h-[230px] sm:col-span-2"><PromoCard b={wide} className="h-full" /></Reveal>
        </div>
      </div>
    </section>
  );
}
