import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { useWishlist } from '../contexts/WishlistContext';
import { useAsync } from '../hooks/useAsync';
import { useSEO } from '../hooks/useSEO';
import { fetchProducts } from '../services/catalog';
import ProductGrid from '../components/products/ProductGrid';
import { EmptyState } from '../components/ui/States';

export default function Wishlist() {
  const { ids } = useWishlist();
  useSEO({ title: 'Wishlist | MrNobody', noindex: true });
  const { data, loading } = useAsync(() => (ids.length ? fetchProducts({ ids }) : []), [ids.join()]);
  return (
    <div className="container-site py-10">
      <h1 className="font-display text-3xl font-bold">My Wishlist</h1>
      <p className="mt-1 text-sm text-gray-500">Saved on this device.</p>
      <div className="mt-8">
        {!ids.length || (!loading && !data?.length) ? (
          <EmptyState icon={Heart} title="Your wishlist is empty" text="Tap the heart on any product to save it here." action={<Link to="/shop" className="btn-primary">Discover products</Link>} />
        ) : (
          <ProductGrid products={data || []} loading={loading} skeletons={Math.min(ids.length, 10)} />
        )}
      </div>
    </div>
  );
}
