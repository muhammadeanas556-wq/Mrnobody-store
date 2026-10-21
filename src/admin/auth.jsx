import { createContext, useContext, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { PageLoader } from '../components/ui/States';

// NOTE: this client-side check only decides what UI to show. The real protection is
// Row Level Security + public.is_admin() in the database: a non-admin session cannot
// read orders/customers or write any store data, whatever the browser does.

const AuthCtx = createContext(null);

async function checkAdmin(user) {
  if (!user) return false;
  const { data, error } = await supabase.from('admin_users').select('user_id').eq('user_id', user.id).maybeSingle();
  return !error && !!data;
}

export function AdminAuthProvider({ children }) {
  const [state, setState] = useState({ loading: true, session: null, isAdmin: false, recovery: false });

  useEffect(() => {
    let alive = true;
    supabase.auth.getSession().then(async ({ data }) => {
      const s = data.session;
      const ok = await checkAdmin(s?.user);
      if (alive) setState((st) => ({ ...st, loading: false, session: s, isAdmin: ok }));
    });
    const { data: sub } = supabase.auth.onAuthStateChange(async (event, s) => {
      const ok = await checkAdmin(s?.user);
      if (alive) setState((st) => ({ ...st, loading: false, session: s, isAdmin: ok, recovery: event === 'PASSWORD_RECOVERY' || st.recovery }));
    });
    return () => { alive = false; sub.subscription.unsubscribe(); };
  }, []);

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) throw new Error(error.message === 'Invalid login credentials' ? 'Incorrect email or password.' : error.message);
    const ok = await checkAdmin(data.user);
    if (!ok) {
      await supabase.auth.signOut();
      throw new Error('This account does not have admin access.');
    }
    setState((st) => ({ ...st, session: data.session, isAdmin: true }));
  };
  const signOut = async () => { await supabase.auth.signOut(); setState((st) => ({ ...st, session: null, isAdmin: false })); };

  return <AuthCtx.Provider value={{ ...state, signIn, signOut }}>{children}</AuthCtx.Provider>;
}

export const useAdminAuth = () => useContext(AuthCtx);

export function RequireAdmin({ children }) {
  const { loading, session, isAdmin } = useAdminAuth();
  const loc = useLocation();
  if (loading) return <PageLoader />;
  if (!session || !isAdmin) return <Navigate to="/admin/login" replace state={{ from: loc.pathname }} />;
  return children;
}
