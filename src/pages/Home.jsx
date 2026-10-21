import { useStore } from '../contexts/StoreContext';
import { useSEO } from '../hooks/useSEO';
import HeroSlider from '../components/homepage/HeroSlider';
import TrustRow from '../components/homepage/TrustRow';
import CategoryCollage from '../components/homepage/CategoryCollage';
import FeaturedProducts from '../components/homepage/FeaturedProducts';
import ProductSection from '../components/homepage/ProductSection';
import ShopByCategory from '../components/homepage/ShopByCategory';
import PromoBanner from '../components/homepage/PromoBanner';
import Newsletter from '../components/homepage/Newsletter';
import { fetchProducts } from '../services/catalog';
import { PageLoader } from '../components/ui/States';

const loaders = {
  trending: () => fetchProducts({ featured: true, sort: 'popular', limit: 5 }),
  bestsellers: () => fetchProducts({ sort: 'popular', limit: 5 }),
  newarrivals: () => fetchProducts({ sort: 'newest', limit: 5 }),
};

export default function Home() {
  const { settings, banners, categories, loading } = useStore();
  useSEO({
    title: `${settings.store_name || 'MrNobody'} — ${settings.tagline || 'Discover Your Style'}`,
    description: 'Shop men’s and women’s fashion, shoes, watches, bags, accessories and lifestyle products in Pakistan. Prices in PKR, Cash on Delivery.',
    jsonLd: { '@context': 'https://schema.org', '@type': 'OnlineStore', name: settings.store_name || 'MrNobody', url: window.location.origin, currenciesAccepted: 'PKR' },
  });
  if (loading) return <PageLoader />;

  const hero = banners.filter((b) => b.placement === 'hero');
  const collage = banners.filter((b) => b.placement === 'collage');
  const promo = banners.find((b) => b.placement === 'promo');

  const sections = {
    hero: <HeroSlider slides={hero} />,
    trust: <TrustRow items={settings.trust} />,
    collage: <CategoryCollage banners={collage} />,
    featured: <FeaturedProducts />,
    trending: <ProductSection id="trending" title="Trending Now" subtitle="What shoppers are loving this week" load={loaders.trending} link="/shop?featured=1" />,
    categories: <ShopByCategory categories={categories} />,
    bestsellers: <ProductSection id="bestsellers" title="Best Sellers" subtitle="Our most popular picks" load={loaders.bestsellers} link="/shop?sort=popular" tinted />,
    newarrivals: <ProductSection id="newarrivals" title="New Arrivals" subtitle="Fresh styles just landed" load={loaders.newarrivals} link="/shop?sort=newest" />,
    promo: <PromoBanner banner={promo} />,
    newsletter: <Newsletter />,
  };

  const order = (settings.sections?.length ? settings.sections : Object.keys(sections).map((key) => ({ key, visible: true })))
    .filter((s) => s.visible !== false && sections[s.key]);

  return (
    <>
      <h1 className="sr-only">{settings.store_name || 'MrNobody'} — online fashion & lifestyle store</h1>
      {order.map((s) => <div key={s.key}>{sections[s.key]}</div>)}
    </>
  );
}
