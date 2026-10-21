import { Link } from 'react-router-dom';
import { Mail, Phone, Clock, MapPin, Banknote } from 'lucide-react';
import Logo from './Logo';
import { useStore } from '../../contexts/StoreContext';
import { FacebookIcon, InstagramIcon, TikTokIcon, YouTubeIcon } from '../ui/SocialIcons';

const QUICK = [
  ['About Us', '/page/about'],
  ['Contact Us', '/page/contact'],
  ['Shop', '/shop'],
  ['Delivery Information', '/page/delivery'],
  ['Return Policy', '/page/returns'],
  ['Privacy Policy', '/page/privacy'],
  ['Terms & Conditions', '/page/terms'],
];

export default function Footer() {
  const { settings, categories } = useStore();
  const social = [
    ['Facebook', settings.social?.facebook, FacebookIcon],
    ['Instagram', settings.social?.instagram, InstagramIcon],
    ['TikTok', settings.social?.tiktok, TikTokIcon],
    ['YouTube', settings.social?.youtube, YouTubeIcon],
  ].filter(([, url]) => url);

  return (
    <footer className="mt-20 border-t border-line bg-mist">
      <div className="container-site grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-gray-600">{settings.footer_about}</p>
          {social.length > 0 && (
            <div className="mt-5 flex gap-2">
              {social.map(([name, url, Icon]) => (
                <a key={name} href={url} target="_blank" rel="noopener noreferrer" aria-label={name}
                  className="grid h-10 w-10 place-items-center rounded-full bg-white text-ink shadow-card transition hover:-translate-y-0.5 hover:bg-brand hover:text-white">
                  <Icon />
                </a>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider">Quick Links</h2>
          <ul className="mt-4 space-y-2.5 text-sm text-gray-600">
            {QUICK.map(([l, to]) => (
              <li key={to}><Link to={to} className="transition hover:text-brand">{l}</Link></li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider">Categories</h2>
          <ul className="mt-4 space-y-2.5 text-sm text-gray-600">
            {categories.slice(0, 8).map((c) => (
              <li key={c.id}><Link to={`/shop?category=${c.slug}`} className="transition hover:text-brand">{c.name}</Link></li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider">Customer Support</h2>
          <ul className="mt-4 space-y-3 text-sm text-gray-600">
            {settings.contact_phone && <li className="flex gap-2.5"><Phone size={16} className="mt-0.5 shrink-0 text-brand" /><a href={`tel:${settings.contact_phone}`} className="hover:text-brand">{settings.contact_phone}</a></li>}
            {settings.contact_email && <li className="flex gap-2.5"><Mail size={16} className="mt-0.5 shrink-0 text-brand" /><a href={`mailto:${settings.contact_email}`} className="hover:text-brand">{settings.contact_email}</a></li>}
            {settings.support_hours && <li className="flex gap-2.5"><Clock size={16} className="mt-0.5 shrink-0 text-brand" />{settings.support_hours}</li>}
            {settings.address && <li className="flex gap-2.5"><MapPin size={16} className="mt-0.5 shrink-0 text-brand" />{settings.address}</li>}
          </ul>
          {settings.payment_methods?.length > 0 && (
            <>
              <h3 className="mt-6 text-xs font-bold uppercase tracking-wider text-gray-500">We accept</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {settings.payment_methods.map((m) => (
                  <span key={m} className="inline-flex items-center gap-1.5 rounded-md bg-white px-3 py-1.5 text-xs font-semibold shadow-card"><Banknote size={14} className="text-brand" /> {m}</span>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
      <div className="border-t border-line">
        <div className="container-site flex flex-col items-center justify-between gap-2 py-5 text-xs text-gray-500 sm:flex-row">
          <p>© {new Date().getFullYear()} {settings.store_name || 'MrNobody'}. All rights reserved.</p>
          <p>Prices in Pakistani Rupees (PKR).</p>
        </div>
      </div>
    </footer>
  );
}
