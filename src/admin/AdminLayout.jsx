import { useState } from 'react';
import { NavLink, Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, FolderTree, Boxes, ShoppingCart, Users, Image, BadgePercent, FileText, Settings, LogOut, Menu, ExternalLink, X } from 'lucide-react';
import { useAdminAuth } from './auth';
import { useEffect } from 'react';

const NAV = [
  ['', 'Dashboard', LayoutDashboard],
  ['products', 'Products', Package],
  ['categories', 'Categories', FolderTree],
  ['inventory', 'Inventory', Boxes],
  ['orders', 'Orders', ShoppingCart],
  ['customers', 'Customers', Users],
  ['banners', 'Homepage Banners', Image],
  ['promotions', 'Promotions', BadgePercent],
  ['content', 'Website Content', FileText],
  ['settings', 'Settings', Settings],
];

export default function AdminLayout() {
  const { session, signOut } = useAdminAuth();
  const [open, setOpen] = useState(false);
  const loc = useLocation();
  useEffect(() => setOpen(false), [loc.pathname]);
  useEffect(() => {
    let m = document.querySelector('meta[name="robots"]');
    if (!m) { m = document.createElement('meta'); m.name = 'robots'; document.head.appendChild(m); }
    m.content = 'noindex, nofollow';
    document.title = 'Admin | MrNobody';
  }, []);

  const sidebar = (
    <div className="flex h-full flex-col bg-white">
      <div className="flex h-16 items-center gap-2 border-b border-line px-5">
        <span className="grid h-8 w-8 place-items-center rounded-md bg-brand text-white">
          <svg viewBox="0 0 64 64" className="h-4 w-4" aria-hidden="true"><path d="M10 50V14h8l14 19 14-19h8v36h-9V30L32 46 19 30v20z" fill="currentColor" /></svg>
        </span>
        <span className="font-display text-lg font-extrabold">Mr<span className="text-brand">Nobody</span></span>
        <span className="ml-auto rounded bg-brand-soft px-1.5 py-0.5 text-[10px] font-bold text-brand">ADMIN</span>
      </div>
      <nav className="flex-1 overflow-y-auto p-3" aria-label="Admin">
        {NAV.map(([to, label, Icon]) => (
          <NavLink key={to} to={`/admin${to ? `/${to}` : ''}`} end={!to}
            className={({ isActive }) => `mb-0.5 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${isActive ? 'bg-brand text-white shadow-sm' : 'text-gray-600 hover:bg-mist hover:text-ink'}`}>
            <Icon size={18} /> {label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-line p-3">
        <button onClick={signOut} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-rose-50 hover:text-sale">
          <LogOut size={18} /> Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-mist">
      <aside className="no-print fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-line lg:block">{sidebar}</aside>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink/40" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 shadow-2xl">{sidebar}
            <button onClick={() => setOpen(false)} className="absolute right-3 top-4 grid h-8 w-8 place-items-center rounded-full bg-mist" aria-label="Close menu"><X size={16} /></button>
          </div>
        </div>
      )}
      <div className="lg:pl-64 print:!pl-0">
        <header className="no-print sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-white/90 px-4 backdrop-blur sm:px-6">
          <button onClick={() => setOpen(true)} className="grid h-9 w-9 place-items-center rounded-md hover:bg-mist lg:hidden" aria-label="Open menu"><Menu size={20} /></button>
          <Link to="/" target="_blank" className="btn-ghost btn-sm ml-auto"><ExternalLink size={14} /> View store</Link>
          <span className="hidden text-sm text-gray-500 sm:block">{session?.user?.email}</span>
          <span className="grid h-9 w-9 place-items-center rounded-full bg-brand text-sm font-bold text-white">{session?.user?.email?.[0]?.toUpperCase()}</span>
        </header>
        <main className="p-4 sm:p-6 lg:p-8 print:p-0"><Outlet /></main>
      </div>
    </div>
  );
}
