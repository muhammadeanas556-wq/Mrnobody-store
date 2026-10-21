import { useState } from 'react';
import { ArrowUp, ArrowDown, Plus, Trash2, KeyRound } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useSettings } from './useSettings';
import { PageHeader, Panel, Field, Toggle, ImageInput, SaveBar, useToast } from './ui';
import { TRUST_ICONS } from '../components/homepage/TrustRow';
import { PageLoader, ErrorNote } from '../components/ui/States';
import { useAdminAuth } from './auth';

const TABS = ['Store', 'Contact & Social', 'Delivery', 'Homepage', 'Appearance', 'Account'];

function ChangePassword() {
  const toast = useToast();
  const { session } = useAdminAuth();
  const [cur, setCur] = useState('');
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [busy, setBusy] = useState(false);
  const strong = pw.length >= 12 && /[a-z]/.test(pw) && /[A-Z]/.test(pw) && /\d/.test(pw);
  const submit = async (e) => {
    e.preventDefault();
    if (!strong) return toast('Use 12+ characters with upper & lower case letters and a number.', 'error');
    if (pw !== pw2) return toast('Passwords do not match', 'error');
    setBusy(true);
    try {
      // Re-verify the current password before changing it.
      const { error: e1 } = await supabase.auth.signInWithPassword({ email: session.user.email, password: cur });
      if (e1) throw new Error('Current password is incorrect.');
      const { error: e2 } = await supabase.auth.updateUser({ password: pw });
      if (e2) throw e2;
      toast('Password changed'); setCur(''); setPw(''); setPw2('');
    } catch (x) { toast(x.message, 'error'); } finally { setBusy(false); }
  };
  return (
    <Panel title="Change password">
      <p className="mb-4 rounded-md bg-amber-50 p-3 text-sm text-amber-800">If you are still using the initial setup password, change it now — use a long, unique password before launch.</p>
      <form onSubmit={submit} className="grid max-w-md gap-4">
        <Field label="Current password"><input type="password" autoComplete="current-password" className="input" value={cur} onChange={(e) => setCur(e.target.value)} /></Field>
        <Field label="New password" hint={pw && !strong ? 'Needs 12+ characters, upper & lower case and a number.' : 'At least 12 characters.'}><input type="password" autoComplete="new-password" className="input" value={pw} onChange={(e) => setPw(e.target.value)} /></Field>
        <Field label="Confirm new password"><input type="password" autoComplete="new-password" className="input" value={pw2} onChange={(e) => setPw2(e.target.value)} /></Field>
        <button className="btn-primary w-fit" disabled={busy}><KeyRound size={15} /> {busy ? 'Updating…' : 'Update password'}</button>
      </form>
    </Panel>
  );
}

export default function Settings() {
  const toast = useToast();
  const { settings: s, set, save, saving, dirty, error } = useSettings();
  const [tab, setTab] = useState('Store');
  if (error) return <ErrorNote>{error}</ErrorNote>;
  if (!s) return <PageLoader />;

  const onSave = async () => { try { await save(); toast('Settings saved — live on the storefront'); } catch (x) { toast(x.message, 'error'); } };
  const txt = (k, props = {}) => <input className="input" value={s[k] ?? ''} onChange={(e) => set(k, e.target.value)} {...props} />;
  const moveSection = (i, d) => {
    const list = [...s.sections]; const j = i + d;
    if (j < 0 || j >= list.length) return;
    [list[i], list[j]] = [list[j], list[i]]; set('sections', list);
  };

  return (
    <>
      <PageHeader title="Settings" actions={tab !== 'Account' && <SaveBar saving={saving} dirty={dirty} onSave={onSave} />} />
      <div className="no-scrollbar mb-6 flex gap-1 overflow-x-auto border-b border-line" role="tablist">
        {TABS.map((t) => <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={`-mb-px whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-semibold ${tab === t ? 'border-brand text-brand' : 'border-transparent text-gray-500 hover:text-ink'}`}>{t}</button>)}
      </div>

      {tab === 'Store' && (
        <div className="grid gap-6 xl:grid-cols-2">
          <Panel title="Brand">
            <div className="grid gap-4">
              <Field label="Store name">{txt('store_name')}</Field>
              <Field label="Tagline">{txt('tagline')}</Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <ImageInput label="Logo (optional — replaces text logo)" value={s.logo_url} onChange={(v) => set('logo_url', v)} folder="brand" aspect="aspect-[3/1]" />
                <ImageInput label="Favicon" value={s.favicon_url} onChange={(v) => set('favicon_url', v)} folder="brand" aspect="aspect-square" />
              </div>
            </div>
          </Panel>
          <Panel title="Announcement bar">
            <div className="space-y-3">
              <Field label="Left text">{txt('announcement_left')}</Field>
              <Field label="Right text (defaults to phone)">{txt('announcement_right')}</Field>
              <span className="label">Scrolling messages</span>
              {s.announcements.map((m, i) => (
                <div key={i} className="flex gap-2">
                  <input className="input" value={m} onChange={(e) => set('announcements', s.announcements.map((x, k) => (k === i ? e.target.value : x)))} aria-label={`Message ${i + 1}`} />
                  <button type="button" onClick={() => set('announcements', s.announcements.filter((_, k) => k !== i))} className="grid h-11 w-11 shrink-0 place-items-center rounded-md text-sale hover:bg-rose-50" aria-label="Remove message"><Trash2 size={15} /></button>
                </div>
              ))}
              <button type="button" onClick={() => set('announcements', [...s.announcements, ''])} className="btn-ghost btn-sm"><Plus size={14} /> Add message</button>
            </div>
          </Panel>
        </div>
      )}

      {tab === 'Contact & Social' && (
        <div className="grid gap-6 xl:grid-cols-2">
          <Panel title="Customer support">
            <div className="grid gap-4">
              <Field label="Contact email">{txt('contact_email', { type: 'email' })}</Field>
              <Field label="Support phone">{txt('contact_phone')}</Field>
              <Field label="Support hours">{txt('support_hours')}</Field>
              <Field label="Address (optional)">{txt('address')}</Field>
            </div>
          </Panel>
          <Panel title="WhatsApp">
            <div className="grid gap-4">
              <Toggle label="Show floating WhatsApp button" checked={!!s.whatsapp_enabled} onChange={(v) => set('whatsapp_enabled', v)} description="Also adds a “Confirm on WhatsApp” button on the order confirmation page." />
              <Field label="WhatsApp number" hint="Your real business number, e.g. 03001234567 or 923001234567">{txt('whatsapp_number', { inputMode: 'tel' })}</Field>
              <Field label="Default message"><textarea rows={2} className="input" value={s.whatsapp_message || ''} onChange={(e) => set('whatsapp_message', e.target.value)} /></Field>
              {s.whatsapp_enabled && !s.whatsapp_number && <p className="text-xs text-sale">Add a number — the button stays hidden until then.</p>}
            </div>
          </Panel>
          <Panel title="Social links" className="xl:col-span-2">
            <div className="grid gap-4 sm:grid-cols-2">
              {['facebook', 'instagram', 'tiktok', 'youtube'].map((k) => (
                <Field key={k} label={k[0].toUpperCase() + k.slice(1)} hint="Leave blank to hide"><input className="input" placeholder="https://" value={s.social?.[k] || ''} onChange={(e) => set('social', { ...s.social, [k]: e.target.value })} /></Field>
              ))}
            </div>
          </Panel>
        </div>
      )}

      {tab === 'Delivery' && (
        <Panel title="Delivery charges">
          <div className="grid max-w-xl gap-4 sm:grid-cols-2">
            <Field label="Delivery fee (Rs.)" hint="Charged on every order below the threshold."><input className="input" inputMode="numeric" value={s.delivery_fee} onChange={(e) => set('delivery_fee', Number(e.target.value.replace(/\D/g, '')) || 0)} /></Field>
            <Field label="Free delivery threshold (Rs.)" hint="0 = never free."><input className="input" inputMode="numeric" value={s.free_shipping_threshold} onChange={(e) => set('free_shipping_threshold', Number(e.target.value.replace(/\D/g, '')) || 0)} /></Field>
          </div>
          <p className="mt-4 text-sm text-gray-500">These values are read by the server when an order is placed, so the customer is always charged what is configured here.</p>
        </Panel>
      )}

      {tab === 'Homepage' && (
        <div className="grid gap-6 xl:grid-cols-2">
          <Panel title="Sections — visibility & order">
            <ul className="divide-y divide-line">
              {s.sections.map((sec, i) => (
                <li key={sec.key} className="flex items-center gap-2 py-2.5">
                  <div className="flex flex-col">
                    <button type="button" onClick={() => moveSection(i, -1)} disabled={!i} className="grid h-5 w-6 place-items-center disabled:opacity-25" aria-label="Move up"><ArrowUp size={13} /></button>
                    <button type="button" onClick={() => moveSection(i, 1)} disabled={i === s.sections.length - 1} className="grid h-5 w-6 place-items-center disabled:opacity-25" aria-label="Move down"><ArrowDown size={13} /></button>
                  </div>
                  <div className="flex-1"><Toggle label={sec.label} checked={sec.visible !== false} onChange={(v) => set('sections', s.sections.map((x, k) => (k === i ? { ...x, visible: v } : x)))} /></div>
                </li>
              ))}
            </ul>
          </Panel>
          <Panel title="Trust & services row">
            <p className="-mt-2 mb-4 text-xs text-gray-500">Only promise what your business actually offers.</p>
            <div className="space-y-4">
              {s.trust.map((t, i) => (
                <div key={i} className="grid grid-cols-[110px_1fr] gap-2 rounded-lg bg-mist p-3">
                  <select className="input h-10" value={t.icon} onChange={(e) => set('trust', s.trust.map((x, k) => (k === i ? { ...x, icon: e.target.value } : x)))} aria-label="Icon">
                    {Object.keys(TRUST_ICONS).map((ic) => <option key={ic}>{ic}</option>)}
                  </select>
                  <input className="input h-10" value={t.title} onChange={(e) => set('trust', s.trust.map((x, k) => (k === i ? { ...x, title: e.target.value } : x)))} aria-label="Heading" />
                  <input className="input col-span-2 h-10" value={t.text} onChange={(e) => set('trust', s.trust.map((x, k) => (k === i ? { ...x, text: e.target.value } : x)))} aria-label="Description" />
                </div>
              ))}
            </div>
          </Panel>
        </div>
      )}

      {tab === 'Appearance' && (
        <Panel title="Theme">
          <div className="grid max-w-2xl gap-5 sm:grid-cols-2">
            <Field label="Primary colour" hint="Default MrNobody blue is #087BD8">
              <div className="flex gap-2">
                <input type="color" className="h-11 w-14 cursor-pointer rounded-md border border-line" value={s.primary_color} onChange={(e) => set('primary_color', e.target.value)} />
                <input className="input" value={s.primary_color} onChange={(e) => set('primary_color', e.target.value)} />
                <button type="button" className="btn-ghost btn-sm" onClick={() => set('primary_color', '#087BD8')}>Reset</button>
              </div>
            </Field>
            <Field label="Button corners">
              <select className="input" value={s.button_radius} onChange={(e) => set('button_radius', e.target.value)}>
                <option value="none">Square</option><option value="sm">Slightly rounded</option><option value="md">Rounded (default)</option><option value="full">Pill</option>
              </select>
            </Field>
            <Field label="Heading font">
              <select className="input" value={s.heading_font} onChange={(e) => set('heading_font', e.target.value)}>
                <option>Poppins</option><option>Inter</option>
              </select>
            </Field>
            <div>
              <span className="label">Preview</span>
              <div className="flex gap-2">
                <span className="inline-flex h-10 items-center px-5 text-sm font-semibold text-white" style={{ background: s.primary_color, borderRadius: { none: 0, sm: 3, md: 6, full: 999 }[s.button_radius] }}>SHOP NOW</span>
                <span className="inline-flex h-10 items-center border px-5 text-sm font-semibold" style={{ borderColor: s.primary_color, color: s.primary_color, borderRadius: { none: 0, sm: 3, md: 6, full: 999 }[s.button_radius], fontFamily: s.heading_font }}>Aa Heading</span>
              </div>
            </div>
          </div>
        </Panel>
      )}

      {tab === 'Account' && <ChangePassword />}
    </>
  );
}
