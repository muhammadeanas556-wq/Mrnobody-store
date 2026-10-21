import { useEffect, useState } from 'react';
import { Check, Trash2, Download, Plus, Star, ExternalLink } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAsync } from '../hooks/useAsync';
import { useSettings } from './useSettings';
import { PageHeader, Panel, Field, Toggle, Empty, SaveBar, useToast } from './ui';
import { must, toCSV, download } from './lib';
import { fmtDate, slugify } from '../lib/format';
import { PageLoader, ErrorNote } from '../components/ui/States';

const TABS = ['Pages', 'Footer', 'Reviews', 'Newsletter'];

function PagesEditor() {
  const toast = useToast();
  const { data, loading, error, reload } = useAsync(async () => must(await supabase.from('pages').select('*').order('slug')), []);
  const [sel, setSel] = useState(null);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (data && !sel && data[0]) setSel(data[0].slug); }, [data, sel]);
  useEffect(() => { const p = data?.find((x) => x.slug === sel); if (p) setForm({ ...p }); }, [sel, data]);
  if (loading) return <PageLoader />;
  if (error) return <ErrorNote>{error.message}</ErrorNote>;

  const save = async () => {
    setSaving(true);
    try { must(await supabase.from('pages').upsert({ slug: form.slug, title: form.title, body: form.body, is_published: form.is_published })); toast('Page saved'); reload(); }
    catch (x) { toast(x.message, 'error'); } finally { setSaving(false); }
  };
  const add = async () => {
    const title = prompt('New page title');
    if (!title) return;
    const slug = slugify(title);
    try { must(await supabase.from('pages').insert({ slug, title, body: '' })); await reload(); setSel(slug); } catch (x) { toast(x.message, 'error'); }
  };
  const remove = async () => {
    if (!confirm(`Delete page “${form.title}”? Footer links to it will show “Page not found”.`)) return;
    try { must(await supabase.from('pages').delete().eq('slug', form.slug)); setSel(null); reload(); } catch (x) { toast(x.message, 'error'); }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
      <div className="card h-fit p-2">
        {data.map((p) => (
          <button key={p.slug} onClick={() => setSel(p.slug)} className={`block w-full rounded-md px-3 py-2 text-left text-sm ${sel === p.slug ? 'bg-brand text-white' : 'hover:bg-mist'}`}>{p.title}</button>
        ))}
        <button onClick={add} className="mt-1 flex w-full items-center gap-1.5 rounded-md px-3 py-2 text-sm font-semibold text-brand hover:bg-mist"><Plus size={14} /> New page</button>
      </div>
      {form && (
        <Panel title={form.title} actions={<a href={`/page/${form.slug}`} target="_blank" rel="noreferrer" className="btn-ghost btn-sm"><ExternalLink size={14} /> /page/{form.slug}</a>}>
          <div className="space-y-4">
            <Field label="Title"><input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field>
            <Field label="Content" hint="Plain text. Leave a blank line between paragraphs."><textarea rows={14} className="input font-[inherit] leading-relaxed" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} /></Field>
            <Toggle label="Published" checked={form.is_published} onChange={(v) => setForm({ ...form, is_published: v })} />
            <div className="flex justify-between"><button onClick={remove} className="btn-ghost btn-sm text-sale"><Trash2 size={14} /> Delete page</button><SaveBar saving={saving} onSave={save} /></div>
          </div>
        </Panel>
      )}
    </div>
  );
}

function FooterEditor() {
  const toast = useToast();
  const { settings: s, set, save, saving, dirty } = useSettings();
  if (!s) return <PageLoader />;
  const onSave = async () => { try { await save(); toast('Footer saved'); } catch (x) { toast(x.message, 'error'); } };
  return (
    <Panel title="Footer content" actions={<SaveBar saving={saving} dirty={dirty} onSave={onSave} />}>
      <div className="grid max-w-2xl gap-4">
        <Field label="About text"><textarea rows={3} className="input" value={s.footer_about} onChange={(e) => set('footer_about', e.target.value)} /></Field>
        <Field label="Payment methods shown" hint="Comma separated, e.g. Cash on Delivery">
          <input className="input" value={(s.payment_methods || []).join(', ')} onChange={(e) => set('payment_methods', e.target.value.split(',').map((x) => x.trim()).filter(Boolean))} />
        </Field>
        <p className="text-sm text-gray-500">Contact details, support hours and social links are edited under <b>Settings → Contact & Social</b>. Quick links point to the pages in the Pages tab.</p>
      </div>
    </Panel>
  );
}

function ReviewsModeration() {
  const toast = useToast();
  const [show, setShow] = useState('pending');
  const { data, loading, reload } = useAsync(async () => {
    let q = supabase.from('product_reviews').select('*, product:products(name, slug)').order('created_at', { ascending: false }).limit(200);
    if (show === 'pending') q = q.eq('is_approved', false);
    return must(await q);
  }, [show]);
  const act = async (r, approve) => {
    try {
      if (approve) must(await supabase.from('product_reviews').update({ is_approved: true }).eq('id', r.id));
      else must(await supabase.from('product_reviews').delete().eq('id', r.id));
      reload();
    } catch (x) { toast(x.message, 'error'); }
  };
  return (
    <Panel title="Customer reviews" actions={
      <select className="input h-9 w-auto" value={show} onChange={(e) => setShow(e.target.value)} aria-label="Filter reviews"><option value="pending">Awaiting approval</option><option value="all">All reviews</option></select>
    }>
      <p className="-mt-2 mb-4 text-xs text-gray-500">Only approved reviews are shown publicly and counted in star ratings / Top Rated.</p>
      {loading ? <PageLoader /> : !data.length ? <Empty>No reviews {show === 'pending' ? 'waiting for approval' : 'yet'}.</Empty> : (
        <ul className="divide-y divide-line">
          {data.map((r) => (
            <li key={r.id} className="flex gap-4 py-4">
              <div className="min-w-0 flex-1">
                <p className="text-sm"><b>{r.name}</b> on <a href={`/product/${r.product?.slug}`} target="_blank" rel="noreferrer" className="text-brand hover:underline">{r.product?.name}</a> · <span className="text-gray-400">{fmtDate(r.created_at)}</span></p>
                <p className="mt-1 flex">{[1, 2, 3, 4, 5].map((n) => <Star key={n} size={13} className={n <= r.rating ? 'fill-gold text-gold' : 'text-gray-300'} />)}</p>
                {r.comment && <p className="mt-1 text-sm text-gray-600">{r.comment}</p>}
              </div>
              <div className="flex shrink-0 items-start gap-1">
                {!r.is_approved ? <button onClick={() => act(r, true)} className="btn-primary btn-sm"><Check size={14} /> Approve</button> : <span className="chip bg-emerald-50 text-emerald-700 ring-emerald-200">Approved</span>}
                <button onClick={() => act(r, false)} className="grid h-9 w-9 place-items-center rounded text-sale hover:bg-rose-50" aria-label="Delete review"><Trash2 size={15} /></button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

function NewsletterList() {
  const { data, loading } = useAsync(async () => must(await supabase.from('newsletter_subscribers').select('email, created_at').order('created_at', { ascending: false })), []);
  if (loading) return <PageLoader />;
  return (
    <Panel title={`Newsletter subscribers (${data.length})`} actions={data.length > 0 && <button onClick={() => download('mrnobody-subscribers.csv', toCSV(data))} className="btn-outline btn-sm"><Download size={14} /> Export CSV</button>}>
      {!data.length ? <Empty>No subscribers yet.</Empty> : (
        <ul className="max-h-[60vh] divide-y divide-line overflow-y-auto text-sm">
          {data.map((r) => <li key={r.email} className="flex justify-between py-2"><span>{r.email}</span><span className="text-gray-400">{fmtDate(r.created_at)}</span></li>)}
        </ul>
      )}
    </Panel>
  );
}

export default function Content() {
  const [tab, setTab] = useState('Pages');
  return (
    <>
      <PageHeader title="Website Content" subtitle="Information pages, footer, reviews and newsletter." />
      <div className="no-scrollbar mb-6 flex gap-1 overflow-x-auto border-b border-line" role="tablist">
        {TABS.map((t) => <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={`-mb-px whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-semibold ${tab === t ? 'border-brand text-brand' : 'border-transparent text-gray-500 hover:text-ink'}`}>{t}</button>)}
      </div>
      {tab === 'Pages' && <PagesEditor />}
      {tab === 'Footer' && <FooterEditor />}
      {tab === 'Reviews' && <ReviewsModeration />}
      {tab === 'Newsletter' && <NewsletterList />}
    </>
  );
}
