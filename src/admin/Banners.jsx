import { useState } from 'react';
import { Plus, Pencil, Trash2, ArrowUp, ArrowDown, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAsync } from '../hooks/useAsync';
import { PageHeader, Panel, Field, ImageInput, Toggle, Empty, useToast } from './ui';
import { must } from './lib';
import Modal from '../components/ui/Modal';
import { PageLoader, ErrorNote } from '../components/ui/States';

const SLOTS = [['large', 'Large left card (women’s)'], ['small-1', 'Small card — top left'], ['small-2', 'Small card — top right'], ['wide', 'Wide card — bottom']];
const GROUPS = [
  { key: 'hero', title: 'Hero slider', hint: 'Large rotating banners at the top of the homepage. Best image: portrait/landscape photo of a model, at least 1100px wide.' },
  { key: 'collage', title: 'Category promo cards', hint: 'The 4-card collage below the services row. Each card is assigned to a layout slot.' },
  { key: 'promo', title: 'Promotional discount banner', hint: 'The wide blue banner lower on the homepage. Only the first active one is shown.' },
];

export default function Banners() {
  const toast = useToast();
  const [edit, setEdit] = useState(null);
  const [saving, setSaving] = useState(false);
  const { data, loading, error, reload } = useAsync(async () => must(await supabase.from('banners').select('*').order('position')), []);
  if (loading) return <PageLoader />;
  if (error) return <ErrorNote>{error.message}</ErrorNote>;

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { id, created_at, updated_at, ...row } = edit;
      row.is_demo = false;
      if (id) must(await supabase.from('banners').update(row).eq('id', id));
      else must(await supabase.from('banners').insert({ ...row, position: Math.max(0, ...data.filter((b) => b.placement === row.placement).map((b) => b.position)) + 1 }));
      toast('Banner saved'); setEdit(null); reload();
    } catch (x) { toast(x.message, 'error'); } finally { setSaving(false); }
  };
  const update = async (b, patch) => { try { must(await supabase.from('banners').update(patch).eq('id', b.id)); reload(); } catch (x) { toast(x.message, 'error'); } };
  const remove = async (b) => { if (!confirm('Delete this banner?')) return; try { must(await supabase.from('banners').delete().eq('id', b.id)); toast('Banner deleted'); reload(); } catch (x) { toast(x.message, 'error'); } };
  const move = async (list, i, d) => {
    const a = list[i], b = list[i + d];
    if (!b) return;
    await update(a, { position: b.position });
    await update(b, { position: a.position === b.position ? a.position + d : a.position });
  };

  return (
    <>
      <PageHeader title="Homepage Banners" subtitle="Changes appear on the storefront immediately after saving." />
      <div className="space-y-6">
        {GROUPS.map((g) => {
          const list = data.filter((b) => b.placement === g.key);
          return (
            <Panel key={g.key} title={g.title} actions={<button onClick={() => setEdit({ placement: g.key, slot: g.key === 'collage' ? 'large' : null, eyebrow: '', title: '', subtitle: '', body: '', button_text: 'SHOP NOW', button_link: '/shop', secondary_text: '', secondary_link: '', image_url: '', is_active: true })} className="btn-outline btn-sm"><Plus size={14} /> Add</button>}>
              <p className="-mt-2 mb-4 text-xs text-gray-500">{g.hint}</p>
              {!list.length ? <Empty>No banners in this section.</Empty> : (
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {list.map((b, i) => (
                    <div key={b.id} className={`overflow-hidden rounded-lg ring-1 ring-line ${b.is_active ? '' : 'opacity-60'}`}>
                      <div className="relative aspect-[16/9] bg-mist">
                        {b.image_url && <img src={b.image_url} alt="" className="h-full w-full object-cover" />}
                        <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-ink/70 to-transparent p-3 text-white">
                          {b.eyebrow && <p className="text-[10px] font-semibold tracking-widest">{b.eyebrow}</p>}
                          <p className="font-display font-bold leading-tight">{b.title}</p>
                        </div>
                        {g.key === 'collage' && <span className="absolute left-2 top-2 rounded bg-white px-1.5 py-0.5 text-[10px] font-bold">{b.slot}</span>}
                        {b.is_demo && <span className="absolute right-2 top-2 rounded bg-amber-400 px-1.5 py-0.5 text-[10px] font-bold">DEMO</span>}
                      </div>
                      <div className="flex items-center gap-1 p-2">
                        {g.key === 'hero' && <>
                          <button onClick={() => move(list, i, -1)} disabled={!i} className="grid h-8 w-8 place-items-center rounded hover:bg-mist disabled:opacity-30" aria-label="Move earlier"><ArrowUp size={14} className="-rotate-90" /></button>
                          <button onClick={() => move(list, i, 1)} disabled={i === list.length - 1} className="grid h-8 w-8 place-items-center rounded hover:bg-mist disabled:opacity-30" aria-label="Move later"><ArrowDown size={14} className="-rotate-90" /></button>
                        </>}
                        <span className="ml-auto" />
                        <button onClick={() => update(b, { is_active: !b.is_active })} className="grid h-8 w-8 place-items-center rounded hover:bg-mist" title={b.is_active ? 'Hide' : 'Show'}>{b.is_active ? <Eye size={15} /> : <EyeOff size={15} />}</button>
                        <button onClick={() => setEdit({ ...b })} className="grid h-8 w-8 place-items-center rounded hover:bg-mist" title="Edit"><Pencil size={15} /></button>
                        <button onClick={() => remove(b)} className="grid h-8 w-8 place-items-center rounded text-sale hover:bg-rose-50" title="Delete"><Trash2 size={15} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Panel>
          );
        })}
      </div>

      <Modal open={!!edit} onClose={() => setEdit(null)} label="Edit banner" className="!w-[min(94vw,760px)]">
        {edit && (
          <form onSubmit={save} className="grid gap-4 p-6 md:grid-cols-2">
            <h2 className="font-display text-lg font-semibold md:col-span-2">{edit.id ? 'Edit banner' : 'New banner'}</h2>
            <div className="space-y-4">
              {edit.placement === 'collage' && (
                <Field label="Layout slot"><select className="input" value={edit.slot || 'large'} onChange={(e) => setEdit({ ...edit, slot: e.target.value })}>{SLOTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></Field>
              )}
              <Field label="Small heading (eyebrow)"><input className="input" value={edit.eyebrow || ''} onChange={(e) => setEdit({ ...edit, eyebrow: e.target.value })} placeholder="SEASON SALE" /></Field>
              <Field label="Headline"><input className="input" value={edit.title || ''} onChange={(e) => setEdit({ ...edit, title: e.target.value })} placeholder="MEN'S FASHION" data-autofocus /></Field>
              <Field label="Subtitle / discount"><input className="input" value={edit.subtitle || ''} onChange={(e) => setEdit({ ...edit, subtitle: e.target.value })} placeholder="UP TO 50% OFF" /></Field>
              {edit.placement === 'hero' && <Field label="Body text"><textarea rows={2} className="input" value={edit.body || ''} onChange={(e) => setEdit({ ...edit, body: e.target.value })} /></Field>}
              <div className="grid grid-cols-2 gap-3">
                <Field label="Button text"><input className="input" value={edit.button_text || ''} onChange={(e) => setEdit({ ...edit, button_text: e.target.value })} /></Field>
                <Field label="Button link"><input className="input" value={edit.button_link || ''} onChange={(e) => setEdit({ ...edit, button_link: e.target.value })} placeholder="/shop?category=men" /></Field>
              </div>
              {edit.placement === 'hero' && (
                <div className="grid grid-cols-2 gap-3">
                  <Field label="2nd button text"><input className="input" value={edit.secondary_text || ''} onChange={(e) => setEdit({ ...edit, secondary_text: e.target.value })} /></Field>
                  <Field label="2nd button link"><input className="input" value={edit.secondary_link || ''} onChange={(e) => setEdit({ ...edit, secondary_link: e.target.value })} /></Field>
                </div>
              )}
              <Toggle label="Active" checked={edit.is_active} onChange={(v) => setEdit({ ...edit, is_active: v })} />
            </div>
            <div>
              <ImageInput value={edit.image_url} onChange={(url) => setEdit({ ...edit, image_url: url })} folder="banners" aspect={edit.placement === 'hero' ? 'aspect-[4/3]' : 'aspect-video'} />
              <p className="mt-3 text-xs text-gray-500">Links can be internal paths like <code>/shop?category=women</code>, <code>/shop?sale=1</code>, <code>/product/your-product-slug</code>, or full URLs.</p>
            </div>
            <div className="flex justify-end gap-2 md:col-span-2"><button type="button" onClick={() => setEdit(null)} className="btn-ghost">Cancel</button><button className="btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save banner'}</button></div>
          </form>
        )}
      </Modal>
    </>
  );
}
