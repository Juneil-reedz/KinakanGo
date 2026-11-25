// KinakanGo mark: a takeaway bag on the move (speed lines) with a map pin on it.
// Draw it on the orange plate; `cut` is the colour that shows through the pin.
export default function KinakanLogo({ className = 'w-10 h-10', cut = '#f7931e', title = 'KinakanGo' }) {
  return (
    <svg viewBox="0 0 64 64" className={className} role="img" aria-label={title}>
      <g transform="translate(3.5 -3)">
      {/* speed lines */}
      <g stroke="currentColor" strokeWidth="3.6" strokeLinecap="round" fill="none">
        <path d="M5 30h9" opacity=".95" />
        <path d="M2 39h11" opacity=".75" />
        <path d="M6 48h7" opacity=".55" />
      </g>
      {/* handle */}
      <path d="M29 24v-4a7 7 0 0 1 14 0v4" fill="none" stroke="currentColor" strokeWidth="3.6" strokeLinecap="round" />
      {/* bag */}
      <path d="M21.5 22h29a2 2 0 0 1 2 1.85l2.3 30A3 3 0 0 1 51.8 57H20.2a3 3 0 0 1-3-3.15l2.3-30A2 2 0 0 1 21.5 22z" fill="currentColor" />
      {/* folded top edge */}
      <path d="M20.6 29h30.8" stroke={cut} strokeWidth="1.6" opacity=".35" />
      {/* map pin */}
      <path d="M36 33.5c-4.4 0-8 3.4-8 7.7 0 5.6 8 12.3 8 12.3s8-6.7 8-12.3c0-4.3-3.6-7.7-8-7.7z" fill={cut} />
      <circle cx="36" cy="41.2" r="3" fill="currentColor" />
      </g>
    </svg>
  );
}
