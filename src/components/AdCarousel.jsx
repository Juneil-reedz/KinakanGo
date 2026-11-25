import { useRef, useState } from 'react';
import AdVideo from './AdVideo';

// Silent KinakanGo ads in a row you swipe sideways, with dots underneath.
const ADS = [
  { name: 'kinakango-ad',          label: 'KinakanGo ad: browse, order and track' },
  { name: 'kinakango-ad-tracking', label: 'KinakanGo ad: watch your order come to you on a live map' },
  { name: 'kinakango-ad-local',    label: 'KinakanGo ad: your local favorite restaurants in one app' },
];

export default function AdCarousel() {
  const track = useRef(null);
  const [active, setActive] = useState(0);

  const onScroll = () => {
    const el = track.current;
    if (el) setActive(Math.round(el.scrollLeft / el.clientWidth));
  };
  const goTo = (i) => {
    const el = track.current;
    if (el) el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' });
  };

  return (
    <div>
      <div ref={track} onScroll={onScroll}
        className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide rounded-3xl">
        {ADS.map(ad => (
          <div key={ad.name} className="w-full flex-shrink-0 snap-center snap-always">
            <AdVideo name={ad.name} label={ad.label} />
          </div>
        ))}
      </div>
      <div className="flex justify-center gap-1.5 mt-2.5" role="tablist" aria-label="Ads">
        {ADS.map((ad, i) => (
          <button key={ad.name} role="tab" aria-selected={active === i} aria-label={`Ad ${i + 1}`}
            onClick={() => goTo(i)}
            className={`h-1.5 rounded-full transition-all ${active === i ? 'w-5 bg-ember-500' : 'w-1.5 bg-[rgba(var(--fg-rgb),.25)]'}`} />
        ))}
      </div>
    </div>
  );
}
