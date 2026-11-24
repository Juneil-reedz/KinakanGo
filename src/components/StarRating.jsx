import { Star } from 'lucide-react';

// 1–5 stars. Pass onChange to make it clickable; leave it out to just display a value.
export default function StarRating({ value = 0, onChange, size = 'w-6 h-6', label }) {
  const stars = [1, 2, 3, 4, 5];
  return (
    <div className="flex items-center gap-1" role={onChange ? 'radiogroup' : undefined} aria-label={label}>
      {stars.map(n => {
        const on = n <= value;
        const icon = <Star className={`${size} ${on ? 'text-ember-400 fill-ember-400' : 'text-forest-200/25'}`} />;
        return onChange ? (
          <button key={n} type="button" role="radio" aria-checked={n === value} aria-label={`${n} star${n > 1 ? 's' : ''}`}
            onClick={() => onChange(n)} className="p-0.5 transition-transform hover:scale-110">
            {icon}
          </button>
        ) : <span key={n}>{icon}</span>;
      })}
    </div>
  );
}
