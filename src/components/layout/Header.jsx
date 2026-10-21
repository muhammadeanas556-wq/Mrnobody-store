import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { Search, Heart, ShoppingBag, Menu, ChevronDown, X, ChevronRight } from 'lucide-react';
import Logo from './Logo';
import SearchPanel from './SearchPanel';
import Modal from '../ui/Modal';
import Img from '../ui/Img';
import { useStore } from '../../contexts/StoreContext';
import { useCart } from '../../contexts/CartContext';
import { useWishlist } from '../../contexts/WishlistContext';

const LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/shop', label: 'Shop', dropdown: true },
  { to: '/shop?category=men', label: 'Men' },
  { to: '/shop?category=women', label: 'Women' },
  { to: '/shop?category=accessories', label: 'Accessories' },
  { to: '/shop?new=1', label: 'New Arrivals' },
  { to: '/shop?sale=1', label: 'Sale', sale: true },
];

function Badge({ n, k }) {
  return (
    <AnimatePresence mode="popLayout">
      {n > 0 && (
        <motion.span
          key={k}
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.4, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 18 }}
          className="absolute -right-1.5 -top-1.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-brand px-1 text-[10px] font-bold text-white ring-2 ring-white"
        >
          {n > 99 ? '99+' : n}
        </motion.span>
      )}
    </AnimatePresence>
  );
}

export default function Header() {
  const { categories } = useStore();
  const { count, setOpen, pulse } = useCart();
  const wish = useWishlist();
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [drop, setDrop] = useState(false);
  const loc = useLocation();
  const currentHref = loc.pathname + loc.search;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  useEffect(() => { setMenuOpen(false); setDrop(false); setSearchOpen(false); }, [loc.pathname, loc.search]);

  const isActive = (l) => (l.end ? loc.pathname === '/' : l.to.includes('?') ? currentHref === l.to : loc.pathname === l.to && !loc.search);

  return (
    <header className={`sticky top-0 z-50 bg-white transition-shadow duration-300 ${scrolled ? 'shadow-[0_6px_24px_-12px_rgba(16,24,40,.25)]' : 'border-b border-line'}`}>
      <motion.div
        className="container-site flex h-[72px] items-center gap-4"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <button className="-ml-2 grid h-10 w-10 place-items-center rounded-md hover:bg-mist lg:hidden" onClick={() => setMenuOpen(true)} aria-label="Open menu">
          <Menu size={22} />
        </button>
        <Logo />

        <nav className="mx-auto hidden lg:block" aria-label="Main">
          <ul className="flex items-center gap-1">
            {LINKS.map((l) => (
              <li key={l.label} className="relative" onMouseEnter={() => l.dropdown && setDrop(true)} onMouseLeave={() => l.dropdown && setDrop(false)}>
                <NavLink
                  to={l.to}
                  className={`group relative flex items-center gap-1 px-3.5 py-2 text-[14.5px] font-medium transition-colors ${isActive(l) ? 'text-brand' : l.sale ? 'text-sale hover:text-sale' : 'text-ink hover:text-brand'}`}
                  aria-haspopup={l.dropdown ? 'true' : undefined}
                  aria-expanded={l.dropdown ? drop : undefined}
                  onFocus={() => l.dropdown && setDrop(true)}
                >
                  {l.label}
                  {l.dropdown && <ChevronDown size={14} className={`transition-transform ${drop ? 'rotate-180' : ''}`} />}
                  <span className={`absolute inset-x-3.5 -bottom-0.5 h-[2px] origin-left rounded bg-brand transition-transform duration-300 ${isActive(l) ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`} />
                </NavLink>
                {l.dropdown && (
                  <AnimatePresence>
                    {drop && (
                      <motion.div
                        className="absolute left-1/2 top-full z-50 w-[620px] -translate-x-1/2 pt-3"
                        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} transition={{ duration: 0.2 }}
                      >
                        <div className="grid grid-cols-2 gap-1 rounded-xl border border-line bg-white p-3 shadow-lift">
                          {categories.map((c) => (
                            <Link key={c.id} to={`/shop?category=${c.slug}`} className="flex items-center gap-3 rounded-lg p-2 transition hover:bg-mist" onBlur={(e) => !e.currentTarget.closest('ul')?.contains(e.relatedTarget) && setDrop(false)}>
                              <Img src={c.image_url} alt="" className="h-11 w-11 rounded-md object-cover" />
                              <span className="text-sm font-medium">{c.name}</span>
                            </Link>
                          ))}
                          <Link to="/shop" className="col-span-2 mt-1 flex items-center justify-center gap-1 rounded-lg bg-brand-soft py-2.5 text-sm font-semibold text-brand hover:bg-brand hover:text-white">
                            Browse all products <ChevronRight size={15} />
                          </Link>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                )}
              </li>
            ))}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-1 lg:ml-0">
          <button onClick={() => setSearchOpen((v) => !v)} className="grid h-10 w-10 place-items-center rounded-full transition hover:bg-mist hover:text-brand" aria-label="Search" aria-expanded={searchOpen}>
            <Search size={20} />
          </button>
          <Link to="/wishlist" className="relative grid h-10 w-10 place-items-center rounded-full transition hover:bg-mist hover:text-brand" aria-label={`Wishlist, ${wish.count} items`}>
            <Heart size={20} />
            <Badge n={wish.count} k={`w${wish.count}`} />
          </Link>
          <motion.button
            key={pulse}
            animate={pulse ? { scale: [1, 1.18, 1] } : undefined}
            transition={{ duration: 0.45 }}
            onClick={() => setOpen(true)}
            className="relative grid h-10 w-10 place-items-center rounded-full transition hover:bg-mist hover:text-brand"
            aria-label={`Cart, ${count} items`}
          >
            <ShoppingBag size={20} />
            <Badge n={count} k={`c${count}`} />
          </motion.button>
        </div>
      </motion.div>

      <SearchPanel open={searchOpen} onClose={() => setSearchOpen(false)} />

      <Modal open={menuOpen} onClose={() => setMenuOpen(false)} side="left" label="Menu">
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center justify-between border-b border-line px-4">
            <Logo />
            <button onClick={() => setMenuOpen(false)} className="grid h-9 w-9 place-items-center rounded-full hover:bg-mist" aria-label="Close menu"><X size={20} /></button>
          </div>
          <nav className="flex-1 overflow-y-auto p-3" aria-label="Mobile">
            {LINKS.filter((l) => !l.dropdown).map((l, i) => (
              <motion.div key={l.label} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 + i * 0.04 }}>
                <Link to={l.to} className={`flex items-center justify-between rounded-lg px-3 py-3 text-[15px] font-medium hover:bg-mist ${l.sale ? 'text-sale' : ''}`}>
                  {l.label} <ChevronRight size={16} className="text-gray-400" />
                </Link>
              </motion.div>
            ))}
            <p className="mt-4 px-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Categories</p>
            <div className="mt-2 grid grid-cols-2 gap-2 px-1">
              {categories.map((c) => (
                <Link key={c.id} to={`/shop?category=${c.slug}`} className="flex items-center gap-2 rounded-lg border border-line p-2 text-[13px] font-medium hover:border-brand">
                  <Img src={c.image_url} alt="" className="h-9 w-9 rounded object-cover" /> <span className="leading-tight">{c.name}</span>
                </Link>
              ))}
            </div>
          </nav>
          <div className="border-t border-line p-4">
            <Link to="/shop" className="btn-primary w-full">Shop all products</Link>
          </div>
        </div>
      </Modal>
    </header>
  );
}
