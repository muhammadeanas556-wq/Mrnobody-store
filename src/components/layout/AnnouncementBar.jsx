import { Phone, Truck, Sparkles } from 'lucide-react';
import { useStore } from '../../contexts/StoreContext';

export default function AnnouncementBar() {
  const { settings } = useStore();
  const msgs = (settings.announcements || []).filter(Boolean);
  if (!msgs.length && !settings.announcement_left) return null;
  const loop = [...msgs, ...msgs, ...msgs, ...msgs];
  return (
    <div className="bg-brand text-white">
      <div className="container-site flex h-9 items-center gap-4 text-[12.5px]">
        {settings.announcement_left && (
          <div className="hidden shrink-0 items-center gap-1.5 md:flex">
            <Truck size={14} aria-hidden /> <span>{settings.announcement_left}</span>
          </div>
        )}
        <div className="relative flex-1 overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]" aria-label="Announcements">
          <div className="flex w-max animate-marquee gap-12 whitespace-nowrap hover:[animation-play-state:paused]">
            {loop.map((m, i) => (
              <span key={i} className="flex items-center gap-2 font-medium" aria-hidden={i >= msgs.length}>
                <Sparkles size={12} className="opacity-80" /> {m}
              </span>
            ))}
          </div>
        </div>
        {(settings.contact_phone || settings.announcement_right) && (
          <div className="hidden shrink-0 items-center gap-1.5 lg:flex">
            <Phone size={13} aria-hidden /> <span>{settings.announcement_right || settings.contact_phone}</span>
          </div>
        )}
      </div>
    </div>
  );
}
