import { Star, Clock, UtensilsCrossed } from 'lucide-react';

// A store in the same shape as the store page header: its cover photo as the
// card's background (or its logo, blurred, until it has one), the round logo
// on the card's bottom edge, and the name and details under the logo.
export default function StoreCard({ r, onClick, style }) {
  const open = r.is_open ?? r.isOpen ?? true;
  const img = r.image_url || r.image;
  const cover = r.cover_url || r.coverUrl;
  const time = r.delivery_time ?? r.deliveryTime;
  const fee = r.delivery_fee ?? r.deliveryFee;
  const kind = r.cuisine ?? r.category;
  return (
    <button onClick={onClick} style={style} aria-label={r.name} className="store-card group block w-full text-center animate-fade-up">
      <div className="store-hero relative">
        <div className="store-cover is-sm">
          {cover
            ? <img src={cover} alt="" loading="lazy" />
            : img && <img src={img} alt="" loading="lazy" className="is-blur" />}
        </div>
        <div className="store-hero-photo is-sm">
          {img
            ? <img src={img} alt="" loading="lazy" className="transition-transform duration-500 group-hover:scale-105" />
            : <span className="w-full h-full flex items-center justify-center"><UtensilsCrossed className="w-7 h-7 text-forest-300/40" /></span>}
          {!open && <span className="absolute inset-0 bg-black/55 flex items-center justify-center text-white text-[11px] font-bold">Closed</span>}
        </div>
      </div>
      <div className="px-1 pt-[2.85rem]">
        <p className="text-white font-heading font-bold text-[.95rem] leading-snug truncate">{r.name}</p>
        <div className="flex items-center justify-center gap-1.5 text-[11px] mt-1">
          <span className="flex items-center gap-0.5 text-ember-400 font-semibold">
            <Star className="w-3 h-3 fill-current" />{Number(r.rating ?? 0).toFixed(1)}
          </span>
          {time != null && (<>
            <span className="text-white/20">•</span>
            <span className="flex items-center gap-0.5 text-forest-200/70"><Clock className="w-3 h-3" />{time} min</span>
          </>)}
        </div>
        <p className="text-forest-200/60 text-[11px] mt-0.5 truncate">
          {kind && <span className="capitalize">{kind}</span>}{kind && fee != null && ' · '}{fee != null && `₱${fee} delivery`}
        </p>
      </div>
    </button>
  );
}
