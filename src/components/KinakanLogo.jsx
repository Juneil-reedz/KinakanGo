import { useId } from 'react';

// KinakanGo emblem: a delivery food box on its way. The box wears the striped
// colours of the Tawi-Tawi vinta sail with a band of tumpal triangles (from
// Sama and Tausug weaving), carries a steaming bowl, and leaves speed lines.
// `animated` adds the class hooks the opening splash animates (see .sp-* in index.css).
const STRIPES = ['#e23b3b', '#ffc63d', '#1f9d55', '#2a9fd6', '#f7931e'];
const SPEED = [['M6 33h9', '#e23b3b'], ['M3.5 39.5h11.5', '#ffc63d'], ['M7 46h8', '#2a9fd6']];

export default function KinakanLogo({ className = 'w-12 h-12', animated = false, title = 'KinakanGo' }) {
  const id = useId().replace(/:/g, '');
  const a = (name) => (animated ? name : undefined);
  const delay = (s) => (animated ? { animationDelay: `${s}s` } : undefined);
  return (
    <svg viewBox="0 0 64 64" className={className} role="img" aria-label={title}>
      <defs>
        <clipPath id={`${id}f`}><path d="M20 27h24v25H20z" /></clipPath>
        <clipPath id={`${id}o`}><circle cx="32" cy="32" r="31" /></clipPath>
      </defs>
      <circle cx="32" cy="32" r="31" fill="#1c1410" />
      <circle className={a('sp-ring')} cx="32" cy="32" r="28.6" fill="none" stroke="#f7b048" strokeWidth="1" opacity=".55" pathLength="100" />
      <path d="M17 55.5h38" stroke="#f3e3c8" strokeWidth="1.2" strokeLinecap="round" opacity=".25" />
      <g clipPath={`url(#${id}o)`}>
        <g transform="translate(3 0)">
          {/* speed lines */}
          <g strokeWidth="2.6" strokeLinecap="round">
            {SPEED.map(([d, c], i) => (
              <path key={c} className={a('sp-speedline')} style={delay(1.05 + i * 0.1)} d={d} stroke={c} />
            ))}
          </g>
          <g className={a('sp-box')}>
            {/* steam */}
            <g fill="none" stroke="#f3e3c8" strokeWidth="1.8" strokeLinecap="round" opacity=".85">
              <path className={a('sp-steamline')} style={delay(1.7)} pathLength="100" d="M29 16c-1.8-1.8 1.8-3.4 0-5.4" />
              <path className={a('sp-steamline')} style={delay(1.85)} pathLength="100" d="M36 15c-1.8-1.8 1.8-3.4 0-5.4" />
            </g>
            {/* front: vinta stripes */}
            <g clipPath={`url(#${id}f)`}>
              {STRIPES.map((c, i) => (
                <rect key={c} className={a('sp-stripe')} style={delay(0.9 + i * 0.1)} x={20 + i * 4.8} y="27" width="4.9" height="25" fill={c} />
              ))}
            </g>
            {/* side */}
            <path d="M44 27l8-6v25l-8 6z" fill="#b8460f" />
            <path d="M44 33.5l8-6M44 40l8-6M44 46.5l8-6" stroke="#8f340a" strokeWidth="1" />
            {/* lid */}
            <path d="M20 27l8-6h24l-8 6z" fill="#f3e3c8" />
            <path d="M27 24.3h17" stroke="#c9b496" strokeWidth="1.4" strokeLinecap="round" />
            {/* tumpal band */}
            <path d="M20 30.3l2.4 3.2 2.4-3.2 2.4 3.2 2.4-3.2 2.4 3.2 2.4-3.2 2.4 3.2 2.4-3.2 2.4 3.2 2.4-3.2z" fill="#1c1410" opacity=".55" />
            {/* label: a steaming bowl */}
            <circle cx="32" cy="42" r="6.2" fill="#1c1410" />
            <path d="M27.6 41.2h8.8c0 2.6-2 4.4-4.4 4.4s-4.4-1.8-4.4-4.4z" fill="#f7931e" />
            <path d="M30 39.6c-.8-.8.8-1.5 0-2.4M33.4 39.6c-.8-.8.8-1.5 0-2.4" stroke="#f3e3c8" strokeWidth=".9" strokeLinecap="round" fill="none" />
          </g>
        </g>
      </g>
    </svg>
  );
}
