import { Loader2 } from 'lucide-react';

export function Spinner({ className = '', size = 22 }) {
  return <Loader2 size={size} className={`animate-spin text-brand ${className}`} aria-label="Loading" />;
}

export function PageLoader() {
  return (
    <div className="grid min-h-[40vh] place-items-center">
      <Spinner size={28} />
    </div>
  );
}

export function EmptyState({ icon: Icon, title, text, action }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      {Icon && (
        <div className="mb-4 grid h-16 w-16 place-items-center rounded-full bg-brand-soft text-brand">
          <Icon size={28} strokeWidth={1.6} />
        </div>
      )}
      <h3 className="font-display text-lg font-semibold">{title}</h3>
      {text && <p className="mt-1.5 max-w-sm text-sm text-gray-500">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorNote({ children }) {
  return <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{children}</div>;
}

export function SkeletonCard() {
  return (
    <div className="animate-pulse">
      <div className="aspect-[4/5] rounded-lg bg-mist" />
      <div className="mt-3 h-3 w-3/4 rounded bg-mist" />
      <div className="mt-2 h-3 w-1/3 rounded bg-mist" />
    </div>
  );
}
