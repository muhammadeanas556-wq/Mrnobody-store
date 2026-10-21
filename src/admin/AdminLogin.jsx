import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Lock, Mail, Loader2, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { useAdminAuth } from './auth';
import { supabase } from '../lib/supabase';

function Shell({ title, subtitle, children }) {
  return (
    <div className="grid min-h-screen place-items-center bg-mist px-4">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center justify-center gap-2">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-brand text-white">
            <svg viewBox="0 0 64 64" className="h-5 w-5" aria-hidden="true"><path d="M10 50V14h8l14 19 14-19h8v36h-9V30L32 46 19 30v20z" fill="currentColor" /></svg>
          </span>
          <span className="font-display text-2xl font-extrabold">Mr<span className="text-brand">Nobody</span> <span className="text-sm font-semibold text-gray-400">Admin</span></span>
        </div>
        <div className="card p-7">
          <h1 className="font-display text-xl font-bold">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </div>
  );
}

export function AdminLogin() {
  const { session, isAdmin, loading, signIn } = useAdminAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  if (!loading && session && isAdmin) return <Navigate to={loc.state?.from || '/admin'} replace />;

  const submit = async (e) => {
    e.preventDefault();
    setErr(''); setBusy(true);
    try { await signIn(email, password); nav(loc.state?.from || '/admin', { replace: true }); }
    catch (x) { setErr(x.message); }
    finally { setBusy(false); }
  };

  return (
    <Shell title="Sign in" subtitle="Store administrators only.">
      <form onSubmit={submit} className="space-y-4">
        <label className="block"><span className="label">Email</span>
          <span className="relative block"><Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="email" required autoComplete="username" className="input pl-9" value={email} onChange={(e) => setEmail(e.target.value)} /></span>
        </label>
        <label className="block"><span className="label">Password</span>
          <span className="relative block"><Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type={show ? 'text' : 'password'} required autoComplete="current-password" className="input px-9" value={password} onChange={(e) => setPassword(e.target.value)} />
            <button type="button" onClick={() => setShow(!show)} className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center text-gray-400" aria-label={show ? 'Hide password' : 'Show password'}>{show ? <EyeOff size={15} /> : <Eye size={15} />}</button>
          </span>
        </label>
        {err && <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700" role="alert">{err}</p>}
        <button className="btn-primary h-11 w-full" disabled={busy}>{busy ? <Loader2 size={17} className="animate-spin" /> : 'Sign in'}</button>
        <div className="flex justify-between text-sm">
          <Link to="/admin/forgot-password" className="text-brand hover:underline">Forgot password?</Link>
          <Link to="/" className="text-gray-500 hover:text-ink">← Back to store</Link>
        </div>
      </form>
    </Shell>
  );
}

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState({ s: 'idle', m: '' });
  const submit = async (e) => {
    e.preventDefault();
    setState({ s: 'busy' });
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/admin/reset-password` });
    // Same message either way, so the form does not reveal which emails exist.
    setState(error && error.status !== 400 ? { s: 'error', m: error.message } : { s: 'done', m: 'If that email belongs to an admin, a reset link has been sent.' });
  };
  return (
    <Shell title="Reset password" subtitle="We’ll email you a secure reset link.">
      {state.s === 'done' ? <p className="text-sm text-emerald-700">{state.m}</p> : (
        <form onSubmit={submit} className="space-y-4">
          <label className="block"><span className="label">Email</span><input type="email" required className="input" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
          {state.s === 'error' && <p className="text-sm text-sale">{state.m}</p>}
          <button className="btn-primary w-full" disabled={state.s === 'busy'}>Send reset link</button>
        </form>
      )}
      <Link to="/admin/login" className="mt-5 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-ink"><ArrowLeft size={14} /> Back to sign in</Link>
    </Shell>
  );
}

export function ResetPassword() {
  const { session } = useAdminAuth();
  const nav = useNavigate();
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [state, setState] = useState({ s: 'idle', m: '' });
  const submit = async (e) => {
    e.preventDefault();
    if (pw.length < 12) return setState({ s: 'error', m: 'Use at least 12 characters.' });
    if (pw !== pw2) return setState({ s: 'error', m: 'Passwords do not match.' });
    setState({ s: 'busy' });
    const { error } = await supabase.auth.updateUser({ password: pw });
    if (error) return setState({ s: 'error', m: error.message });
    nav('/admin', { replace: true });
  };
  return (
    <Shell title="Choose a new password">
      {!session ? <p className="text-sm text-gray-600">Open this page from the reset link in your email. The link may have expired — <Link className="text-brand underline" to="/admin/forgot-password">request a new one</Link>.</p> : (
        <form onSubmit={submit} className="space-y-4">
          <label className="block"><span className="label">New password</span><input type="password" autoComplete="new-password" className="input" value={pw} onChange={(e) => setPw(e.target.value)} /></label>
          <label className="block"><span className="label">Confirm password</span><input type="password" autoComplete="new-password" className="input" value={pw2} onChange={(e) => setPw2(e.target.value)} /></label>
          {state.s === 'error' && <p className="text-sm text-sale">{state.m}</p>}
          <button className="btn-primary w-full" disabled={state.s === 'busy'}>Update password</button>
        </form>
      )}
    </Shell>
  );
}

export function SetupRequired() {
  return (
    <Shell title="Admin setup required" subtitle="The authentication backend is not configured yet.">
      <ol className="list-decimal space-y-2 pl-5 text-sm text-gray-700">
        <li>Create a Supabase project and run the SQL in <code className="rounded bg-mist px-1">supabase/migrations</code> and <code className="rounded bg-mist px-1">supabase/seed.sql</code>.</li>
        <li>Add <code className="rounded bg-mist px-1">VITE_SUPABASE_URL</code> and <code className="rounded bg-mist px-1">VITE_SUPABASE_ANON_KEY</code> to your environment (Netlify → Environment variables) and redeploy.</li>
        <li>Create the admin user in Supabase Authentication, then run <code className="rounded bg-mist px-1">supabase/admin-setup.sql</code>.</li>
      </ol>
      <p className="mt-4 text-xs text-gray-500">Full instructions are in README.md. No login is available until this is done.</p>
      <Link to="/" className="btn-outline mt-6 w-full">Back to store</Link>
    </Shell>
  );
}
