import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { Info } from 'lucide-react';
import AnnouncementBar from './AnnouncementBar';
import Header from './Header';
import Footer from './Footer';
import CartDrawer from '../cart/CartDrawer';
import FloatingActions from './FloatingActions';
import { useStore } from '../../contexts/StoreContext';

export default function StoreLayout() {
  const { pathname, search } = useLocation();
  const { demo } = useStore();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);

  return (
    <div className="flex min-h-screen flex-col overflow-x-clip">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[100] focus:rounded focus:bg-white focus:px-4 focus:py-2 focus:shadow">Skip to content</a>
      {demo && (
        <div className="bg-amber-50 text-amber-900">
          <p className="container-site flex items-center justify-center gap-2 py-1.5 text-center text-xs">
            <Info size={13} /> Demo preview — showing sample products. Connect Supabase (see README) to enable the live store, checkout and admin.
          </p>
        </div>
      )}
      <AnnouncementBar />
      <Header />
      <AnimatePresence mode="wait">
        <motion.main
          id="main"
          key={pathname + (pathname === '/shop' ? '' : search)}
          className="flex-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
        >
          <Outlet />
        </motion.main>
      </AnimatePresence>
      <Footer />
      <CartDrawer />
      <FloatingActions />
    </div>
  );
}
