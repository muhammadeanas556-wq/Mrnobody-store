import { useState } from 'react';
import { Plus, Pencil, Trash2, ArrowUp, ArrowDown, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAsync } from '../hooks/useAsync';
import { PageHeader, Field, ImageInput, Toggle, Empty, useToast } from './ui';
import { must } from './lib';
import { slugify } from '../lib/format';
import Modal from '../components/ui/Modal';
import { PageLoader, ErrorNote } from '../components/ui/States';

export default function Categories() {
  const toast = useToast();
  const [edit, setEdit] = useState(null);
  const [saving, setSaving] = useState(false);
  const { data, loading, error, reload } = useAsync(async () => {
    const [c, p] = await Promise.all([
      supabase.from('categories').select('*').order('position'),
      supabase.from('products').select('category_id'),
    ]);
    const counts = {};
    for (const r of must(p)) counts[r.category_id] = (counts[r.category_id] || 0) + 1;
    return { cats: must(c), counts };
  }, []);

  if (loading) return <PageLoader />;
  if (error) return <ErrorNote>{error.message}</ErrorNote>;
  const cats = data.cats;

  const save = async (e) => {
    e.preventDefault();
    if (!edit.name.trim()) return toast('Name is required', 'error');
    setSaving(true);
    try {
      const row = { name: edit.name.trim(), slug: edit.slug || slugify(edit.name), description: edit.description || '', image_url: edit.image_url || null, is_visible: edit.is_visible, parent_id: edit.parent_id || null };
      if (edit.id) must(await supabase.from('categories').update(row).eq('id', edit.id));
      else must(await supabase.from('categories').insert({ ...row, position: (cats.at(-1)?.position || 0) + 1 }));
      toast('Category saved'); setEdit(null); reload();
    } catch (x) { toast(x.message, 'error'); } finally { setSaving(false); }
  };
  const move = async (i, d) => {
    const a = cats[i], b = cats[i + d];
    if (!b) return;
    try {
      must(await supabase.from('categories').update({ position: b.position }).eq('id', a.id));
      must(await supabase.from('categories').update({ position: a.position === b.position ? a.position + d : a.position }).eq('id', b.id));
      reload();
    } catch (x) { toast(x.message, 'error'); }
  };
  const toggleVis = async (c) => {
    try { must(await supabase.from('categories').update({ is_visible: !c.is_visible }).eq('id', c.id)); reload(); } catch (x) { toast(x.message, 'error'); }
  };
  const remove = async (c) => {
    if (!confirm(`Delete "${c.name}"? Its ${data.counts[c.id] || 0} products will become uncategorised (not deleted).`)) return;
    try { must(await supabase.from('categories').delete().eq('id', c.id)); toast('Category deleted'); reload(); } catch (x) { toast(x.message, 'error'); }
  };

  return (
    <>
      <PageHeader title="Categories" subtitle="Order here controls navigation and Shop by Category." actions={<button onClick={() => setEdit({ name: '', slug: '', description: '', image_url: '', is_visible: true })} className="btn-primary btn-sm"><Plus size={15} /> Add category</button>} />
      {!cats.length ? <Empty>No categories yet.</Empty> : (
        <div className="card divide-y divide-line">
          {cats.map((c, i) => (
            <div key={c.id} className="flex items-center gap-3 p-3 sm:p-4">
              <div className="flex flex-col">
                <button onClick={() => move(i, -1)} disabled={!i} className="grid h-6 w-6 place-items-center rounded hover:bg-mist disabled:opacity-30" aria-label="Move up"><ArrowUp size={13} /></button>
                <button onClick={() => move(i, 1)} disabled={i === cats.length - 1} className="grid h-6 w-6 place-items-center rounded hover:bg-mist disabled:opacity-30" aria-label="Move down"><ArrowDown size={13} /></button>
              </div>
              <img src={c.image_url || ''} alt="" className="h-12 w-12 rounded-lg bg-mist object-cover" />
              <div className="min-w-0 flex-1">
                <p className="font-medium">{c.name} {!c.is_visible && <span className="chip ml-1 bg-gray-100 text-gray-500 ring-gray-200">Hidden</span>}</p>
                <p className="text-xs text-gray-500">/shop?category={c.slug} · {data.counts[c.id] || 0} products</p>
              </div>
              <button onClick={() => toggleVis(c)} className="grid h-8 w-8 place-items-center rounded hover:bg-mist" title={c.is_visible ? 'Hide' : 'Show'}>{c.is_visible ? <Eye size={16} /> : <EyeOff size={16} />}</button>
              <button onClick={() => setEdit({ ...c })} className="grid h-8 w-8 place-items-center rounded hover:bg-mist" title="Edit"><Pencil size={15} /></button>
              <button onClick={() => remove(c)} className="grid h-8 w-8 place-items-center rounded text-sale hover:bg-rose-50" title="Delete"><Trash2 size={15} /></button>
            </div>
          ))}
        </div>
      )}

      <Modal open={!!edit} onClose={() => setEdit(null)} label="Edit category" className="!w-[min(94vw,560px)]">
        {edit && (
          <form onSubmit={save} className="space-y-4 p-6">
            <h2 className="font-display text-lg font-semibold">{edit.id ? 'Edit category' : 'New category'}</h2>
            <Field label="Name"><input className="input" value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value, slug: edit.id ? edit.slug : slugify(e.target.value) })} data-autofocus /></Field>
            <Field label="URL slug" hint="Used in links such as /shop?category=slug"><input className="input" value={edit.slug} onChange={(e) => setEdit({ ...edit, slug: slugify(e.target.value) })} /></Field>
            <Field label="Parent category (optional)">
              <select className="input" value={edit.parent_id || ''} onChange={(e) => setEdit({ ...edit, parent_id: e.target.value })}>
                <option value="">— None —</option>
                {cats.filter((c) => c.id !== edit.id).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="Description"><textarea rows={2} className="input" value={edit.description || ''} onChange={(e) => setEdit({ ...edit, description: e.target.value })} /></Field>
            <ImageInput value={edit.image_url} onChange={(url) => setEdit({ ...edit, image_url: url })} folder="categories" aspect="aspect-[3/2]" />
            <Toggle label="Visible in store" checked={edit.is_visible} onChange={(v) => setEdit({ ...edit, is_visible: v })} />
            <div className="flex justify-end gap-2 pt-2"><button type="button" onClick={() => setEdit(null)} className="btn-ghost">Cancel</button><button className="btn-primary" disabled={saving}>Save</button></div>
          </form>
        )}
      </Modal>
    </>
  );
}
