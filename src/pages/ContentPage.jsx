import { Link, useParams } from 'react-router-dom';
import { FileQuestion, ChevronRight } from 'lucide-react';
import { useAsync } from '../hooks/useAsync';
import { useSEO } from '../hooks/useSEO';
import { fetchPage } from '../services/catalog';
import { PageLoader, EmptyState } from '../components/ui/States';

export default function ContentPage() {
  const { slug } = useParams();
  const { data: page, loading } = useAsync(() => fetchPage(slug), [slug]);
  useSEO({ title: page ? `${page.title} | MrNobody` : 'MrNobody', description: page?.body?.slice(0, 150) });
  if (loading) return <PageLoader />;
  if (!page) return <EmptyState icon={FileQuestion} title="Page not found" action={<Link to="/" className="btn-primary">Back to home</Link>} />;
  return (
    <div className="container-site max-w-3xl py-10">
      <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1 text-xs text-gray-500"><Link to="/" className="hover:text-brand">Home</Link> <ChevronRight size={12} /> <span>{page.title}</span></nav>
      <h1 className="font-display text-3xl font-bold sm:text-4xl">{page.title}</h1>
      <div className="mt-6 space-y-4 text-[15px] leading-relaxed text-gray-700">
        {page.body.split(/\n{2,}/).map((para, i) => <p key={i} className="whitespace-pre-line">{para}</p>)}
      </div>
    </div>
  );
}
