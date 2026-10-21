import { Link } from 'react-router-dom';
import Img from '../ui/Img';
import { Reveal, Stagger, StaggerItem } from '../ui/Reveal';

export default function ShopByCategory({ categories }) {
  if (!categories.length) return null;
  return (
    <section className="container-site pt-16" aria-labelledby="cats-title">
      <Reveal className="mb-8 text-center">
        <h2 id="cats-title" className="section-title">Shop by Category</h2>
        <p className="mt-1 text-sm text-gray-500">Everything you need, all in one place</p>
      </Reveal>
      <Stagger className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8">
        {categories.map((c) => (
          <StaggerItem key={c.id}>
            <Link to={`/shop?category=${c.slug}`} className="group flex flex-col items-center text-center">
              <span className="relative block aspect-square w-full max-w-[150px] overflow-hidden rounded-full bg-mist ring-2 ring-transparent transition duration-300 group-hover:ring-brand group-hover:ring-offset-4">
                <Img src={c.image_url} alt="" sizes="150px" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
              </span>
              <span className="mt-3 text-[13.5px] font-semibold leading-tight transition group-hover:text-brand">{c.name}</span>
            </Link>
          </StaggerItem>
        ))}
      </Stagger>
    </section>
  );
}
