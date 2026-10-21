import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import Img from '../ui/Img';
import { Reveal } from '../ui/Reveal';

export default function PromoBanner({ banner }) {
  if (!banner) return null;
  return (
    <section className="container-site pt-16" aria-label="Promotion">
      <Reveal>
        <Link to={banner.button_link || '/shop'} className="group relative block overflow-hidden rounded-2xl bg-brand">
          <div className="absolute inset-y-0 right-0 w-full md:w-3/5">
            <Img src={banner.image_url} alt="" sizes="(max-width:768px) 100vw, 60vw"
              className="h-full w-full object-cover opacity-40 transition-transform duration-[1200ms] group-hover:scale-105 md:opacity-100 md:[mask-image:linear-gradient(90deg,transparent,#000_35%)]" />
          </div>
          <div className="relative max-w-xl px-6 py-12 text-white sm:px-12 sm:py-16">
            {banner.eyebrow && (
              <span className="inline-block animate-pulse rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold tracking-[0.2em]">{banner.eyebrow}</span>
            )}
            <h2 className="mt-4 font-display text-3xl font-extrabold leading-tight sm:text-5xl">{banner.title}</h2>
            {banner.subtitle && <p className="mt-3 text-white/85">{banner.subtitle}</p>}
            <span className="mt-7 inline-flex h-12 items-center gap-2 bg-white px-7 text-sm font-bold text-brand transition-all group-hover:gap-3" style={{ borderRadius: 'var(--radius-btn)' }}>
              {banner.button_text || 'SHOP NOW'} <ArrowRight size={16} />
            </span>
          </div>
        </Link>
      </Reveal>
    </section>
  );
}
