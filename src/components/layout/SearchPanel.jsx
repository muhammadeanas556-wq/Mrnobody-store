import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { Search, X, ArrowRight } from 'lucide-react';
import { fetchProducts } from '../../services/catalog';
import { pkr } from '../../lib/format';
import Img from '../ui/Img';

export default function SearchPanel({ open, onClose }) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const [busy, setBusy] = useState(false);
  const input = useRef(null);
  const nav = useNavigate();

  useEffect(() => {
    if (open) setTimeout(() => input.current?.focus(), 60);
    else { setQ(''); setResults([]); }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) { setResults([]); return; }
    setBusy(true);
    const t = setTimeout(() => {
      fetchProducts({ q: term, limit: 6 }).then(setResults).catch(() => setResults([])).finally(() => setBusy(false));
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  const submit = (e) => {
    e.preventDefault();
    if (!q.trim()) return;
    nav(`/shop?q=${encodeURIComponent(q.trim())}`);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="fixed inset-0 z-[55] bg-ink/30" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div
            className="absolute inset-x-0 top-full z-[60] border-t border-line bg-white shadow-lift"
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22 }}
            role="search"
          >
            <div className="container-site py-5">
              <form onSubmit={submit} className="flex items-center gap-3 rounded-lg border border-line px-4 focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/15">
                <Search size={18} className="text-gray-400" aria-hidden />
                <label htmlFor="site-search" className="sr-only">Search products</label>
                <input id="site-search" ref={input} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search for shirts, sneakers, watches…" className="h-12 flex-1 bg-transparent text-[15px] outline-none" autoComplete="off" />
                <button type="button" onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full text-gray-500 hover:bg-mist" aria-label="Close search"><X size={17} /></button>
              </form>
              {q.trim().length >= 2 && (
                <div className="mt-4">
                  {busy && !results.length ? (
                    <p className="text-sm text-gray-500">Searching…</p>
                  ) : results.length ? (
                    <>
                      <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {results.map((p) => (
                          <li key={p.id}>
                            <Link to={`/product/${p.slug}`} onClick={onClose} className="flex items-center gap-3 rounded-lg p-2 hover:bg-mist">
                              <Img src={p.image} alt={p.name} className="h-14 w-14 rounded-md object-cover" />
                              <span className="min-w-0">
                                <span className="block truncate text-sm font-medium">{p.name}</span>
                                <span className="text-sm font-semibold text-brand">{pkr(p.price)}</span>
                              </span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                      <button onClick={submit} className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand hover:underline">
                        See all results for “{q.trim()}” <ArrowRight size={14} />
                      </button>
                    </>
                  ) : (
                    <p className="text-sm text-gray-500">No products match “{q.trim()}”.</p>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
