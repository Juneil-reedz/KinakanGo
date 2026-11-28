import { useId } from 'react';

// KinakanGo emblem: a Tawi-Tawi vinta. Its striped sail carries the colours of
// the vinta sails, and its hull is a food bowl with a band of tumpal triangles
// (from Sama and Tausug weaving) and an okir curl on the prow.
// `animated` adds the class hooks the opening splash animates (see .sp-* in index.css).
const STRIPES = ['#e23b3b', '#ffc63d', '#1f9d55', '#2a9fd6', '#f7931e'];
const TUMPAL = Array.from({ length: 8 }, (_, i) => `M${(14 + i * 4.4).toFixed(1)} 47.6l2.2 3 2.2-3z`).join('');

export default function KinakanLogo({ className = 'w-12 h-12', animated = false, title = 'KinakanGo' }) {
  const id = useId().replace(/:/g, '');
  const a = (name) => (animated ? name : undefined);
  return (
    <svg viewBox="0 0 64 64" className={className} role="img" aria-label={title}>
      <defs>
        <clipPath id={`${id}s`}><path d="M17 12.5 47 8q2 17-1 33.5H19q2-14.5-2-29z" /></clipPath>
        <clipPath id={`${id}o`}><circle cx="32" cy="32" r="31" /></clipPath>
        <clipPath id={`${id}c`}><circle cx="32" cy="32" r="28" /></clipPath>
      </defs>
      <circle cx="32" cy="32" r="31" fill="#1c1410" />
      <circle className={a('sp-ring')} cx="32" cy="32" r="28.6" fill="none" stroke="#f7b048" strokeWidth="1" opacity=".55" pathLength="100" />
      <g clipPath={`url(#${id}o)`}>
      <g className={a('sp-boat')}>
        {/* sail */}
        <g clipPath={`url(#${id}s)`}>
          {STRIPES.map((c, i) => (
            <rect key={c} className={a('sp-stripe')} style={animated ? { animationDelay: `${0.95 + i * 0.12}s` } : undefined}
              x={16 + i * 6.4} y="0" width="6.6" height="50" fill={c} />
          ))}
        </g>
        {/* spars and mast */}
        <g className={a('sp-spar')} stroke="#f3e3c8" strokeWidth="2" strokeLinecap="round">
          <path d="M15.5 13 48.5 7.6" />
          <path d="M17.5 41.8h30" />
          <path d="M32 41.8V45" strokeLinecap="butt" />
        </g>
        {/* hull: a bowl with tumpal band and okir prow */}
        <path d="M9 45h44c-1 7-9 11.5-22 11.5S10 52 9 45z" fill="#f7931e" />
        <path d="M9 45h44" stroke="#ffc27a" strokeWidth="1.6" strokeLinecap="round" />
        <path d={TUMPAL} fill="#c9620a" />
        <path d="M13.6 47.6h36.8" stroke="#c9620a" strokeWidth=".9" />
        <g fill="none" stroke="#f7931e" strokeWidth="2" strokeLinecap="round">
          <path className={a('sp-okir')} pathLength="100" d="M53 45c4-1 6.5-4 5.5-7-.9-2.6-4.1-2.4-4.3 0-.2 1.6 1.6 2.2 2.4 1.2" />
          <path d="M9 45c-3-1-4.2-3-3.4-4.6" />
        </g>
      </g>
      </g>
      {/* sea */}
      <g clipPath={`url(#${id}c)`}>
        <path className={a('sp-wave')} d="M-8.6 59.5c2.4-1.3 4.8-1.3 7.2 0s4.8 1.3 7.2 0 4.8-1.3 7.2 0 4.8 1.3 7.2 0 4.8-1.3 7.2 0 4.8 1.3 7.2 0 4.8-1.3 7.2 0 4.8 1.3 7.2 0 4.8-1.3 7.2 0" fill="none" stroke="#2a9fd6" strokeWidth="1.6" strokeLinecap="round" />
      </g>
    </svg>
  );
}
