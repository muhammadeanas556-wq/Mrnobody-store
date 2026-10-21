import { Link } from 'react-router-dom';
import { useStore } from '../../contexts/StoreContext';

export default function Logo({ light = false, className = '' }) {
  const { settings } = useStore();
  if (settings.logo_url) {
    return (
      <Link to="/" className={`flex items-center ${className}`} aria-label="MrNobody home">
        <img src={settings.logo_url} alt="MrNobody" className="h-9 w-auto" />
      </Link>
    );
  }
  return (
    <Link to="/" className={`group flex items-center gap-2 ${className}`} aria-label="MrNobody home">
      <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand text-white shadow-sm transition-transform duration-300 group-hover:rotate-[-6deg]">
        <svg viewBox="0 0 64 64" className="h-5 w-5" aria-hidden="true"><path d="M10 50V14h8l14 19 14-19h8v36h-9V30L32 46 19 30v20z" fill="currentColor" /></svg>
      </span>
      <span className={`font-display text-[22px] font-extrabold tracking-tight ${light ? 'text-white' : 'text-ink'}`}>
        Mr<span className="text-brand">Nobody</span>
      </span>
    </Link>
  );
}
