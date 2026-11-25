import { useId } from 'react';

// KinakanGo badge: a rider with a steaming food box crossing the bridge in
// front of Bud Bongao at sunset, from the brand's own animation.
// `animated` adds the class hooks the opening splash animates (see .sp-* in index.css).
export default function KinakanLogo({ className = 'w-12 h-12', animated = false, title = 'KinakanGo' }) {
  const id = useId().replace(/:/g, '');
  const a = (name) => (animated ? name : undefined);
  return (
    <svg viewBox="0 0 64 64" className={className} role="img" aria-label={title}>
      <defs>
        <clipPath id={`${id}c`}><circle cx="32" cy="32" r="30" /></clipPath>
        <linearGradient id={`${id}s`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffc35c" /><stop offset="1" stopColor="#f7931e" />
        </linearGradient>
      </defs>
      <g clipPath={`url(#${id}c)`}>
        <rect className={a('sp-sky')} width="64" height="64" fill={`url(#${id}s)`} />
        <circle className={a('sp-sun')} cx="46" cy="17" r="5" fill="#fff4e6" opacity=".9" />
        {/* Bud Bongao */}
        <g className={a('sp-mountain')}>
          <path d="M-2 47C4 42 8 38 11 35c2-2 4-2 6-4.5l3-4.5c1.5-2 2.6-2.4 3.6-4.6L26.5 15c1-2 2.8-2 3.8 0l2.6 5.2c1.2 2.2 3 3 5 4.6 4.6 3.8 8 9.6 12 22.2z" fill="#1d7a43" />
          <path d="M28.4 13.6c.6 0 1.3.5 1.9 1.4l2.6 5.2c1.2 2.2 3 3 5 4.6 4.6 3.8 8 9.6 12 22.2H35c-.6-7-2-13-4.2-19-.9-2.6-1.6-6.4-2.4-14.4z" fill="#135c31" />
        </g>
        {/* sea */}
        <g className={a('sp-sea')}>
          <rect y="46" width="64" height="18" fill="#2a9fd6" />
          <path className={a('sp-wave')} d="M-14 54c3-1.6 6-1.6 9 0s6 1.6 9 0 6-1.6 9 0 6 1.6 9 0 6-1.6 9 0 6 1.6 9 0 6-1.6 9 0 6 1.6 9 0 6-1.6 9 0" fill="none" stroke="#8fd3f4" strokeWidth="1.6" strokeLinecap="round" />
          <path className={a('sp-wave2')} d="M-8 59.5c3-1.4 6-1.4 9 0s6 1.4 9 0 6-1.4 9 0 6 1.4 9 0 6-1.4 9 0 6 1.4 9 0 6-1.4 9 0 6 1.4 9 0" fill="none" stroke="#8fd3f4" strokeWidth="1.4" strokeLinecap="round" opacity=".7" />
        </g>
        {/* bridge */}
        <g className={a('sp-bridge')} fill="#fff4e6">
          <rect x="-2" y="46.2" width="68" height="2.6" />
          <path d="M14 48.8v3.4M30 48.8v3.4M46 48.8v3.4" stroke="#fff4e6" strokeWidth="2" />
        </g>
        {/* rider with a steaming food box */}
        <g className={a('sp-rider')}>
          <g transform="translate(30.5 24.6) scale(.43)">
            <g>
              <path className={a('sp-steam')} d="M8 5c-3-3 3-5.5 0-9M15 5c-3-3 3-5.5 0-9" fill="none" stroke="#fff4e6" strokeWidth="3.4" strokeLinecap="round" />
              <rect x="3" y="15" width="15" height="13" rx="2.5" fill="#fff4e6" />
              <path d="M9 34 H30 L37 25 H46 L51 36 Z" fill="#fff4e6" />
              <path d="M44 25 L52 41" stroke="#fff4e6" strokeWidth="4" strokeLinecap="round" />
              <path d="M41 15 H47" stroke="#2a211b" strokeWidth="3.5" strokeLinecap="round" />
              <path d="M27 15 L22 29 L33 31 L35 38" fill="none" stroke="#2a211b" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M28 17 L42 16" stroke="#2a211b" strokeWidth="4" strokeLinecap="round" />
              <circle cx="29" cy="8" r="6" fill="#2a211b" />
              <path d="M24 7 A6 6 0 0 1 35 6.5 Z" fill="#f7931e" />
            </g>
            <circle cx="14" cy="42" r="7.5" fill="#2a211b" /><circle cx="14" cy="42" r="2.8" fill="#fff4e6" />
            <circle cx="52" cy="42" r="7.5" fill="#2a211b" /><circle cx="52" cy="42" r="2.8" fill="#fff4e6" />
          </g>
        </g>
      </g>
      <circle className={a('sp-ring')} cx="32" cy="32" r="30" fill="none" stroke="#fff4e6" strokeWidth="2.4" pathLength="100" />
    </svg>
  );
}
