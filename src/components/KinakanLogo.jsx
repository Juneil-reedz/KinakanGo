import { useId } from 'react';

// KinakanGo emblem: a takeout box with a carry handle, on its way. The box wears
// the striped colours of the Tawi-Tawi vinta sail with a band of tumpal
// triangles (from Sama and Tausug weaving), a food label, and speed lines.
// `animated` adds the class hooks the opening splash animates (see .sp-* in index.css).
const STRIPES = ['#e23b3b', '#ffc63d', '#1f9d55', '#2a9fd6', '#f7931e'];
const SPEED = [['M3 37h9', '#e23b3b'], ['M1 43.5h11', '#ffc63d'], ['M4 50h8', '#2a9fd6']];
const TUMPAL = 'M16 34l2.6 3.4 2.6-3.4 2.6 3.4 2.6-3.4 2.6 3.4 2.6-3.4 2.6 3.4 2.6-3.4 2.6 3.4 2.6-3.4z';

export default function KinakanLogo({ className = 'w-12 h-12', animated = false, title = 'KinakanGo' }) {
  const id = useId().replace(/:/g, '');
  const a = (name) => (animated ? name : undefined);
  const delay = (s) => (animated ? { animationDelay: `${s}s` } : undefined);
  return (
    <svg viewBox="0 0 64 64" className={className} role="img" aria-label={title}>
      <defs>
        <clipPath id={`${id}f`}><path d="M16 34h26v20H16z" /></clipPath>
        <clipPath id={`${id}o`}><circle cx="32" cy="32" r="31" /></clipPath>
      </defs>
      <circle cx="32" cy="32" r="31" fill="#1c1410" />
      <path d="M15 54.5h40" stroke="#f3e3c8" strokeWidth="1.2" strokeLinecap="round" opacity=".25" />
      <g clipPath={`url(#${id}o)`}>
        <g transform="translate(3 -2)">
          {/* speed lines */}
          <g strokeWidth="2.6" strokeLinecap="round">
            {SPEED.map(([d, c], i) => (
              <path key={c} className={a('sp-speedline')} style={delay(1.05 + i * 0.1)} d={d} stroke={c} />
            ))}
          </g>
          <g className={a('sp-box')}>
            {/* carry handle */}
            <g className={a('sp-handle')} style={delay(1.45)}>
              <path d="M24 22.5V15.5q0-1.5 1.5-1.5h17q1.5 0 1.5 1.5v7z" fill="#f3e3c8" />
              <rect x="29" y="16.3" width="10" height="3.2" rx="1.6" fill="#1c1410" />
            </g>
            {/* gable top: front panel and end */}
            <path d="M16 34l5-12h26l-5 12z" fill="#f7931e" />
            <path d="M21 22h26" stroke="#ffc27a" strokeWidth="1.2" strokeLinecap="round" />
            <path d="M42 34l5-12 5 6z" fill="#c9620a" />
            {/* front: vinta stripes */}
            <g clipPath={`url(#${id}f)`}>
              {STRIPES.map((c, i) => (
                <rect key={c} className={a('sp-stripe')} style={delay(0.9 + i * 0.1)} x={16 + i * 5.2} y="34" width="5.3" height="20" fill={c} />
              ))}
            </g>
            {/* side */}
            <path d="M42 34l10-6v20l-10 6z" fill="#b8460f" />
            {/* tumpal band */}
            <path d={TUMPAL} fill="#1c1410" opacity=".5" />
            <path d="M16 34h26" stroke="#1c1410" strokeWidth=".8" opacity=".6" />
            {/* label: a steaming bowl */}
            <circle cx="29" cy="45.5" r="5.4" fill="#1c1410" />
            <path d="M25.2 44.8h7.6c0 2.3-1.7 3.8-3.8 3.8s-3.8-1.5-3.8-3.8z" fill="#f7931e" />
            <path d="M27.6 43.4c-.7-.7.7-1.3 0-2.1M30.4 43.4c-.7-.7.7-1.3 0-2.1" stroke="#f3e3c8" strokeWidth=".8" strokeLinecap="round" fill="none" />
          </g>
        </g>
      </g>
    </svg>
  );
}
