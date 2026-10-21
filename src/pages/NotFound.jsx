import { Link } from 'react-router-dom';
import { useSEO } from '../hooks/useSEO';

export default function NotFound() {
  useSEO({ title: 'Page not found | MrNobody', noindex: true });
  return (
    <div className="container-site py-24 text-center">
      <p className="font-display text-7xl font-extrabold text-brand">404</p>
      <h1 className="mt-4 font-display text-2xl font-bold">This page doesn’t exist</h1>
      <p className="mt-2 text-gray-500">The link may be broken or the page may have moved.</p>
      <div className="mt-8 flex justify-center gap-3"><Link to="/" className="btn-primary">Go home</Link><Link to="/shop" className="btn-outline">Shop now</Link></div>
    </div>
  );
}
