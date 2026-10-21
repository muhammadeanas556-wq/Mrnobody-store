import { useState } from 'react';
import { Mail, CheckCircle2 } from 'lucide-react';
import { subscribeNewsletter } from '../../services/catalog';
import { Reveal } from '../ui/Reveal';
import { isConfigured } from '../../lib/supabase';

export default function Newsletter() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState({ status: 'idle', msg: '' });
  if (!isConfigured) return null; // only shown when subscriptions are actually stored

  const submit = async (e) => {
    e.preventDefault();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return setState({ status: 'error', msg: 'Please enter a valid email address.' });
    setState({ status: 'busy', msg: '' });
    try {
      await subscribeNewsletter(email);
      setState({ status: 'done', msg: 'Thanks for subscribing!' });
      setEmail('');
    } catch (err) {
      setState({ status: 'error', msg: err.message });
    }
  };

  return (
    <section className="container-site pt-16" aria-labelledby="nl-title">
      <Reveal className="flex flex-col items-center gap-6 rounded-2xl bg-mist px-6 py-12 text-center lg:flex-row lg:justify-between lg:px-14 lg:text-left">
        <div className="flex flex-col items-center gap-4 lg:flex-row">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-brand text-white"><Mail size={24} /></span>
          <div>
            <h2 id="nl-title" className="font-display text-2xl font-bold">Join the MrNobody newsletter</h2>
            <p className="mt-1 text-sm text-gray-500">New arrivals and offers, straight to your inbox.</p>
          </div>
        </div>
        <form onSubmit={submit} className="w-full max-w-md" noValidate>
          {state.status === 'done' ? (
            <p className="flex items-center justify-center gap-2 font-semibold text-emerald-600" role="status"><CheckCircle2 size={18} /> {state.msg}</p>
          ) : (
            <>
              <div className="flex gap-2">
                <label htmlFor="nl-email" className="sr-only">Email address</label>
                <input id="nl-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Your email address" className="input h-12 flex-1" aria-invalid={state.status === 'error'} />
                <button className="btn-primary h-12" disabled={state.status === 'busy'}>Subscribe</button>
              </div>
              {state.status === 'error' && <p className="field-error text-left" role="alert">{state.msg}</p>}
            </>
          )}
        </form>
      </Reveal>
    </section>
  );
}
