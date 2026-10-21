import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import Img from '../ui/Img';

const INTERVAL = 6000;

function CTA({ to, children, primary }) {
  const ext = /^https?:/.test(to || '');
  const cls = primary ? 'btn-primary h-12 px-7' : 'btn-outline h-12 px-7 bg-white/60 backdrop-blur';
  if (!to) return null;
  return ext ? <a href={to} className={cls}>{children}</a> : <Link to={to} className={cls}>{children}</Link>;
}

export default function HeroSlider({ slides }) {
  const [i, setI] = useState(0);
  const [dir, setDir] = useState(1);
  const [paused, setPaused] = useState(false);
  const reduce = useReducedMotion();
  const timer = useRef();
  const n = slides.length;

  const go = useCallback((next, d) => {
    setDir(d ?? (next > i ? 1 : -1));
    setI(((next % n) + n) % n);
  }, [i, n]);

  useEffect(() => {
    if (paused || n < 2 || reduce) return;
    timer.current = setTimeout(() => go(i + 1, 1), INTERVAL);
    return () => clearTimeout(timer.current);
  }, [i, paused, n, go, reduce]);

  if (!n) return null;
  const s = slides[i];

  const text = {
    hidden: { opacity: 0, x: -40 },
    show: (k) => ({ opacity: 1, x: 0, transition: { delay: 0.15 + k * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] } }),
  };

  return (
    <section
      className="relative overflow-hidden bg-gradient-to-r from-mist via-[#EEF4FB] to-brand-soft"
      aria-roledescription="carousel"
      aria-label="Featured promotions"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {/* decorative shapes */}
      <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-brand/5" aria-hidden />
      <div className="pointer-events-none absolute bottom-[-120px] right-[30%] h-80 w-80 rounded-full border-[40px] border-brand/5" aria-hidden />

      <AnimatePresence initial={false} custom={dir} mode="popLayout">
        <motion.div
          key={s.id}
          custom={dir}
          className="container-site relative grid min-h-[440px] items-center gap-4 md:min-h-[520px] md:grid-cols-[1fr_1.05fr]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          drag={n > 1 ? 'x' : false}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.18}
          onDragEnd={(_, info) => {
            if (info.offset.x < -60) go(i + 1, 1);
            else if (info.offset.x > 60) go(i - 1, -1);
          }}
          role="group"
          aria-roledescription="slide"
          aria-label={`${i + 1} of ${n}`}
        >
          <div className="relative z-10 order-2 pb-14 pt-2 md:order-1 md:py-16">
            {s.eyebrow && (
              <motion.p custom={0} variants={text} initial="hidden" animate="show" className="flex items-center gap-3 text-sm font-semibold tracking-[0.25em] text-brand">
                <span className="h-[2px] w-10 bg-brand" aria-hidden /> {s.eyebrow}
              </motion.p>
            )}
            <motion.h2 custom={1} variants={text} initial="hidden" animate="show" className="mt-4 font-display text-[40px] font-extrabold leading-[1.02] tracking-tight text-ink sm:text-6xl lg:text-[72px]">
              {s.title}
            </motion.h2>
            {s.subtitle && (
              <motion.p custom={2} variants={text} initial="hidden" animate="show" className="mt-4 font-display text-2xl font-bold text-brand sm:text-3xl">
                {s.subtitle}
              </motion.p>
            )}
            {s.body && (
              <motion.p custom={3} variants={text} initial="hidden" animate="show" className="mt-4 max-w-md text-[15px] leading-relaxed text-gray-600">
                {s.body}
              </motion.p>
            )}
            <motion.div custom={4} variants={text} initial="hidden" animate="show" className="mt-8 flex flex-wrap gap-3">
              <CTA to={s.button_link} primary>{s.button_text || 'SHOP NOW'} <ArrowRight size={16} /></CTA>
              {s.secondary_text && <CTA to={s.secondary_link}>{s.secondary_text}</CTA>}
            </motion.div>
          </div>

          <motion.div
            className="relative order-1 h-[300px] sm:h-[380px] md:order-2 md:h-[520px]"
            initial={{ opacity: 0, scale: 1.04, x: dir * 30 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="absolute inset-y-6 right-0 w-full overflow-hidden rounded-[28px] md:inset-y-8 md:rounded-[36px]">
              <Img src={s.image_url} alt={s.title || 'MrNobody collection'} eager={i === 0} sizes="(max-width:768px) 100vw, 55vw"
                className="h-full w-full object-cover object-top [mask-image:linear-gradient(90deg,transparent_0%,#000_22%)] md:[mask-image:linear-gradient(90deg,transparent_0%,#000_28%)]" draggable={false} />
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {n > 1 && (
        <>
          <button onClick={() => go(i - 1, -1)} className="absolute left-3 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-ink shadow transition hover:bg-brand hover:text-white lg:grid" aria-label="Previous slide"><ChevronLeft size={20} /></button>
          <button onClick={() => go(i + 1, 1)} className="absolute right-3 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-ink shadow transition hover:bg-brand hover:text-white lg:grid" aria-label="Next slide"><ChevronRight size={20} /></button>
          <div className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 gap-2" role="tablist" aria-label="Choose slide">
            {slides.map((sl, k) => (
              <button key={sl.id} role="tab" aria-selected={k === i} aria-label={`Go to slide ${k + 1}`} onClick={() => go(k)}
                className={`h-2.5 rounded-full transition-all duration-300 ${k === i ? 'w-8 bg-brand' : 'w-2.5 bg-ink/20 hover:bg-ink/40'}`} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
