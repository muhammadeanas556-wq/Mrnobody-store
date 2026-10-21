import ProductCard from './ProductCard';
import { SkeletonCard } from '../ui/States';
import { Stagger, StaggerItem } from '../ui/Reveal';

export const GRID = 'grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5';

export default function ProductGrid({ products, loading, skeletons = 10, cols = GRID }) {
  if (loading) {
    return (
      <div className={cols}>
        {Array.from({ length: skeletons }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    );
  }
  return (
    <Stagger className={cols} key={products.map((p) => p.id).join()}>
      {products.map((p, i) => (
        <StaggerItem key={p.id}>
          <ProductCard product={p} eager={i < 4} />
        </StaggerItem>
      ))}
    </Stagger>
  );
}
