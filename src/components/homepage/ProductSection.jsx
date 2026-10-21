import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import ProductGrid from '../products/ProductGrid';
import { Reveal } from '../ui/Reveal';
import { useAsync } from '../../hooks/useAsync';

/** Titled product row used for Trending / Best Sellers / New Arrivals. */
export default function ProductSection({ title, subtitle, load, link, id, tinted }) {
  const { data, loading } = useAsync(load, [id]);
  if (!loading && !data?.length) return null;
  return (
    <section className={tinted ? 'mt-16 bg-mist py-14' : 'pt-16'} aria-labelledby={`${id}-title`}>
      <div className="container-site">
        <Reveal className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h2 id={`${id}-title`} className="section-title">{title}</h2>
            {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
          </div>
          {link && <Link to={link} className="group hidden shrink-0 items-center gap-1 text-sm font-semibold text-brand sm:inline-flex">View all <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" /></Link>}
        </Reveal>
        <ProductGrid products={data || []} loading={loading} skeletons={5} />
        {link && <div className="mt-8 text-center sm:hidden"><Link to={link} className="btn-outline-brand btn-sm">View all</Link></div>}
      </div>
    </section>
  );
}
