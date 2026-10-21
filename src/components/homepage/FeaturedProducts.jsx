import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Star } from 'lucide-react';
import ProductGrid from '../products/ProductGrid';
import { Reveal } from '../ui/Reveal';
import { EmptyState } from '../ui/States';
import { useAsync } from '../../hooks/useAsync';
import { fetchProducts, fetchTopRated } from '../../services/catalog';

const TABS = [
  { key: 'new', label: 'New Arrivals', load: () => fetchProducts({ newArrival: true, limit: 10 }), more: '/shop?new=1' },
  { key: 'best', label: 'Best Selling', load: () => fetchProducts({ bestSeller: true, sort: 'popular', limit: 10 }), more: '/shop?best=1&sort=popular' },
  { key: 'top', label: 'Top Rated', load: () => fetchTopRated(10), more: '/shop?sort=rating' },
];

export default function FeaturedProducts() {
  const [tab, setTab] = useState('new');
  const t = TABS.find((x) => x.key === tab);
  const { data, loading } = useAsync(t.load, [tab]);

  return (
    <section className="container-site pt-16" aria-labelledby="featured-title">
      <Reveal className="text-center">
        <h2 id="featured-title" className="section-title">Featured Products</h2>
        <div className="mt-5 inline-flex flex-wrap justify-center gap-1 rounded-full bg-mist p-1" role="tablist" aria-label="Featured product lists">
          {TABS.map((x) => (
            <button key={x.key} role="tab" aria-selected={tab === x.key} onClick={() => setTab(x.key)}
              className={`relative rounded-full px-5 py-2 text-sm font-semibold transition-colors ${tab === x.key ? 'text-white' : 'text-gray-600 hover:text-ink'}`}>
              {tab === x.key && <motion.span layoutId="feat-tab" className="absolute inset-0 rounded-full bg-brand shadow" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />}
              <span className="relative">{x.label}</span>
            </button>
          ))}
        </div>
      </Reveal>
      <div className="mt-9" role="tabpanel">
        {!loading && !data?.length ? (
          <EmptyState icon={Star} title={tab === 'top' ? 'No ratings yet' : 'Nothing here yet'}
            text={tab === 'top' ? 'Top Rated fills in automatically once customers leave reviews and you approve them.' : 'Mark products in the admin dashboard to show them here.'} />
        ) : (
          <ProductGrid products={data || []} loading={loading} />
        )}
      </div>
      {!!data?.length && (
        <div className="mt-10 text-center">
          <Link to={t.more} className="btn-outline-brand">View all {t.label.toLowerCase()}</Link>
        </div>
      )}
    </section>
  );
}
