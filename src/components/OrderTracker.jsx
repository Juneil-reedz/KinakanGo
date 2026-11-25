import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, AttributionControl, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  ArrowLeft, Check, ClipboardList, ChefHat, Bike, CheckCircle2, XCircle,
  Phone, MapPin, Clock, Store, Home as HomeIcon,
} from 'lucide-react';
import { request } from '../services/api';

const RIDER_LIVE_MS = 5000;

// OpenStreetMap's own tiles: free, no API key (CARTO's now ask for one).
// Dark mode darkens them with a CSS filter (.trk-tiles-dark).
const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

// Four steps, like the reference: placed → cooking → on the way → delivered
const STEPS = [
  { id: 'placed',    has: ['pending'],                       label: 'Placed' },
  { id: 'cooking',   has: ['accepted', 'preparing', 'ready'], label: 'Cooking' },
  { id: 'on_way',    has: ['picked_up'],                     label: 'On the way' },
  { id: 'delivered', has: ['delivered'],                     label: 'Delivered' },
];
const stepOf = (status) => Math.max(0, STEPS.findIndex(s => s.has.includes(status)));

const STAGE_TEXT = {
  pending:   ['Order placed',          'Waiting for the restaurant to accept your order.', ClipboardList],
  accepted:  ['Order accepted',        'The restaurant accepted your order and will start cooking soon.', ChefHat],
  preparing: ['Cooking your food',     'The restaurant is preparing your food.', ChefHat],
  ready:     ['Ready for pickup',      'Your food is packed and waiting for the rider.', ChefHat],
  picked_up: ['On the way',            'Your rider has your food and is heading to you.', Bike],
  delivered: ['Delivered',             'Enjoy your meal! Your order was delivered.', CheckCircle2],
  cancelled: ['Order cancelled',       'This order was cancelled.', XCircle],
  refunded:  ['Order refunded',        'This order was refunded.', XCircle],
};

// Geocoded addresses are kept for the session so reopening is instant
const geoCache = new Map();
async function geocode(address) {
  if (!address) return null;
  if (geoCache.has(address)) return geoCache.get(address);
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`, { headers: { 'Accept-Language': 'en' } });
    const data = await res.json();
    const loc = data.length ? { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) } : null;
    geoCache.set(address, loc);
    return loc;
  } catch { return null; }
}

const km = (a, b) => {
  if (!a || !b) return null;
  const R = 6371, rad = (d) => d * Math.PI / 180;
  const dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};
const fmtKm = (d) => d == null ? null : d < 1 ? `${Math.round(d * 1000)} m` : `${d.toFixed(1)} km`;

// Map markers are plain shapes (no circle behind them), each with a white outline
const SHAPES = {
  // A delivery rider on a motorcycle, with a food box on the back
  rider: `<svg viewBox="0 0 64 52" width="50" height="41" aria-hidden="true">
    <rect x="3" y="15" width="15" height="13" rx="2.5" fill="var(--c)"/>
    <path d="M9 34 H30 L37 25 H46 L51 36 Z" fill="var(--c)"/>
    <path d="M44 25 L52 41" stroke="var(--c)" stroke-width="4" stroke-linecap="round"/>
    <path d="M41 15 H47" stroke="#2a211b" stroke-width="3.5" stroke-linecap="round"/>
    <path d="M27 15 L22 29 L33 31 L35 38" fill="none" stroke="#2a211b" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M28 17 L42 16" stroke="#2a211b" stroke-width="4" stroke-linecap="round"/>
    <circle cx="29" cy="8" r="6" fill="#2a211b"/>
    <path d="M24 7 A6 6 0 0 1 35 6.5 Z" fill="var(--c)"/>
    <circle cx="14" cy="42" r="7.5" fill="#2a211b"/><circle cx="14" cy="42" r="2.8" fill="#fff"/>
    <circle cx="52" cy="42" r="7.5" fill="#2a211b"/><circle cx="52" cy="42" r="2.8" fill="#fff"/>
  </svg>`,
  // A house: roof, chimney and door
  home: `<svg viewBox="0 0 48 48" width="40" height="40" aria-hidden="true">
    <path d="M33 9 H39 V19 L33 14 Z" fill="var(--c)"/>
    <path d="M24 4 L45 23 H39 V44 H9 V23 H3 Z" fill="var(--c)" stroke-linejoin="round"/>
    <rect x="19" y="29" width="10" height="15" rx="1.5" fill="#fff"/>
  </svg>`,
  // A restaurant: striped awning over a shop front with a door and window
  rest: `<svg viewBox="0 0 48 48" width="40" height="40" aria-hidden="true">
    <rect x="7" y="20" width="34" height="24" fill="var(--c)"/>
    <path d="M4 8 H44 L46 20 Q41 25 36 20 Q30 25 24 20 Q18 25 12 20 Q7 25 2 20 Z" fill="var(--c)"/>
    <path d="M14 8 L12 20 M24 8 V20 M34 8 L36 20" stroke="#fff" stroke-width="2.5"/>
    <rect x="12" y="28" width="9" height="16" rx="1.5" fill="#fff"/>
    <rect x="26" y="28" width="10" height="8" rx="1.5" fill="#fff"/>
  </svg>`,
};

const pin = (kind, color, label, pulse = false) => L.divIcon({
  className: '', iconSize: [0, 0], iconAnchor: kind === 'rider' ? [25, 34] : [20, 36],
  html: `<div class="trk-pin trk-pin-${kind}" style="--c:${color}">
    ${pulse ? '<span class="trk-pin-pulse"></span>' : ''}
    <span class="trk-pin-shape">${SHAPES[kind]}</span>
    ${label ? `<span class="trk-pin-label">${label.replace(/[<>&"]/g, '')}</span>` : ''}
  </div>`,
});

// The rider's profile photo, or a bike badge if they have none (or it fails)
function RiderPhoto({ src, name }) {
  const [broken, setBroken] = useState(false);
  if (!src || broken) return (
    <span className="w-14 h-14 rounded-full btn-glow-orange flex items-center justify-center flex-shrink-0">
      <Bike className="w-6 h-6 text-white" />
    </span>
  );
  return (
    <span className="trk-rider-photo flex-shrink-0">
      <img src={src} alt={name ? `${name}'s photo` : 'Rider photo'} onError={() => setBroken(true)} />
      <span className="trk-rider-badge" aria-hidden="true"><Bike className="w-3 h-3" /></span>
    </span>
  );
}

function Fit({ points }) {
  const map = useMap();
  const key = points.map(p => `${p.lat.toFixed(4)},${p.lng.toFixed(4)}`).join('|');
  useEffect(() => {
    if (points.length > 1) map.fitBounds(L.latLngBounds(points.map(p => [p.lat, p.lng])), { padding: [60, 60], maxZoom: 16 });
    else if (points.length === 1) map.setView([points[0].lat, points[0].lng], 15);
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

/**
 * Full-screen order tracker.
 *  pending                      → no map, just the "order placed" step
 *  accepted / preparing / ready → map: restaurant and your home, and how far apart
 *    + rider assigned           → map: rider heading to the restaurant
 *  picked_up                    → map: only the rider and your home
 */
export default function OrderTracker({ order, onClose }) {
  const [rest, setRest]   = useState(null);
  const [home, setHome]   = useState(null);
  const [rider, setRider] = useState(null);

  const status = order.status;
  const cancelled = ['cancelled', 'refunded'].includes(status);
  const cooking = ['accepted', 'preparing', 'ready'].includes(status);
  const onWay = status === 'picked_up';
  const showMap = cooking || onWay;
  const riderStage = !!order.rider_id && (cooking || onWay);

  useEffect(() => {
    if (!showMap) return;
    let live = true;
    geocode(order.restaurant_address).then(l => live && setRest(l));
    geocode(order.delivery_address).then(l => live && setHome(l));
    return () => { live = false; };
  }, [showMap, order.restaurant_address, order.delivery_address]);

  useEffect(() => {
    if (!riderStage) { setRider(null); return; }
    let live = true;
    const pull = () => request(`/orders/${order.id}/rider-location`)
      .then(l => { if (live && l?.lat != null) setRider({ lat: Number(l.lat), lng: Number(l.lng) }); })
      .catch(() => {});
    pull();
    const t = setInterval(() => { if (document.visibilityState === 'visible') pull(); }, RIDER_LIVE_MS);
    return () => { live = false; clearInterval(t); };
  }, [riderStage, order.id]);

  // Esc closes; the page behind doesn't scroll
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [onClose]);

  const restName  = order.restaurant_name?.split(' ').slice(0, 2).join(' ') || 'Restaurant';
  const riderName = order.rider_name?.split(' ')[0] || 'Rider';

  // What the map shows at each stage, and the line between
  let points = [], line = null, distLabel = null;
  if (onWay) {
    points = [rider && { ...rider, kind: 'rider' }, home && { ...home, kind: 'home' }].filter(Boolean);
    if (rider && home) { line = [rider, home]; distLabel = `Rider is ${fmtKm(km(rider, home))} from you`; }
    else if (home) distLabel = 'Waiting for the rider’s location…';
  } else if (riderStage) {
    points = [rider && { ...rider, kind: 'rider' }, rest && { ...rest, kind: 'rest' }, home && { ...home, kind: 'home', faint: true }].filter(Boolean);
    if (rider && rest) { line = [rider, rest]; distLabel = `Rider is ${fmtKm(km(rider, rest))} from ${restName}`; }
    else distLabel = 'Rider is heading to the restaurant';
  } else if (cooking) {
    points = [rest && { ...rest, kind: 'rest' }, home && { ...home, kind: 'home' }].filter(Boolean);
    if (rest && home) { line = [rest, home]; distLabel = `${restName} is ${fmtKm(km(rest, home))} from your home`; }
  }

  const step = stepOf(status);
  const [title, desc, StageIcon] = STAGE_TEXT[status] || STAGE_TEXT.pending;
  const eta = order.estimated_delivery && !cancelled && status !== 'delivered'
    ? new Date(order.estimated_delivery).toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' })
    : null;
  const darkTiles = !document.documentElement.classList.contains('light-nav');

  const stepsBar = !cancelled && (
    <div className="flex items-center justify-center mt-1 mb-1" aria-label={`Step ${step + 1} of ${STEPS.length}`}>
      {STEPS.map((s, i) => (
        <div key={s.id} className="flex items-center">
          <div className="flex flex-col items-center gap-1 w-14">
            <span className={`trk-step ${i < step || status === 'delivered' ? 'is-done' : i === step ? 'is-now' : ''}`}>
              {i < step || status === 'delivered' ? <Check className="w-4 h-4" strokeWidth={3} /> : i + 1}
            </span>
            <span className={`text-[10px] font-semibold ${i <= step ? 'text-white' : 'text-forest-200/40'}`}>{s.label}</span>
          </div>
          {i < STEPS.length - 1 && <span className={`trk-bar ${i < step ? 'is-done' : ''}`} />}
        </div>
      ))}
    </div>
  );

  return (
    <div className="trk fixed inset-0 z-[200] overflow-y-auto" role="dialog" aria-modal="true" aria-label={`Tracking order ${order.id}`}>
      <div className="max-w-lg mx-auto min-h-full flex flex-col px-4 pb-8">
        {showMap ? (<>
          {/* Map fills the top half of the screen; back button floats on it */}
          <div className="trk-map relative -mx-4 overflow-hidden" style={{ height: '50svh', minHeight: '18rem' }}>
            <MapContainer center={[(rest || home || rider || { lat: 5.0293 }).lat, (rest || home || rider || { lng: 119.7731 }).lng]}
              zoom={14} style={{ height: '100%', width: '100%' }} zoomControl={false} attributionControl={false}>
              <AttributionControl position="topright" prefix={false} />
              <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} maxZoom={19}
                className={darkTiles ? 'trk-tiles-dark' : ''} />
              <Fit points={points} />
              {line && <Polyline positions={line.map(p => [p.lat, p.lng])}
                pathOptions={{ color: darkTiles ? '#fba94c' : '#2a211b', weight: 3, dashArray: '2 9', lineCap: 'round' }} />}
              {points.map(p => (
                <Marker key={p.kind} position={[p.lat, p.lng]} opacity={p.faint ? 0.55 : 1}
                  icon={p.kind === 'rider' ? pin('rider', '#f7931e', riderName, true)
                    : p.kind === 'rest' ? pin('rest', '#e11d48', restName)
                    : pin('home', '#0d9488', 'Home')} />
              ))}
            </MapContainer>
            <div className="absolute left-0 right-0 top-0 z-[500] px-4 pt-[max(.75rem,env(safe-area-inset-top))] flex items-center gap-2 pointer-events-none">
              <button onClick={onClose} aria-label="Back to order details" className="trk-chip !p-0 w-10 h-10 flex items-center justify-center flex-shrink-0 pointer-events-auto">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="trk-chip !py-1.5 min-w-0">
                <p className="text-xs font-bold leading-tight truncate">Order #{order.id}</p>
                <p className="text-[11px] opacity-60 leading-tight truncate">{order.restaurant_name}</p>
              </div>
            </div>
            {distLabel && (
              <div className="absolute left-4 right-4 bottom-10 z-[500] trk-chip flex items-center gap-2">
                <MapPin className="w-4 h-4 text-ember-400 flex-shrink-0" />
                <span className="text-xs font-semibold truncate">{distLabel}</span>
                {riderStage && rider && <span className="ml-auto flex items-center gap-1 text-[11px] text-rose-400 flex-shrink-0"><span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />Live</span>}
              </div>
            )}
          </div>
          {/* Details sheet slides up over the bottom of the map */}
          <div className="trk-sheet relative z-10 -mx-4 -mt-6 px-4 pt-5 rounded-t-[2rem]">
            <span className="block w-10 h-1 rounded-full mx-auto mb-4 opacity-20" style={{ background: 'rgb(var(--fg-rgb))' }} />
            {stepsBar}
          </div>
        </>) : (<>
          {/* Header */}
          <div className="sticky top-0 z-20 -mx-4 px-4 pt-[max(.75rem,env(safe-area-inset-top))] pb-3 trk-head flex items-center gap-3">
            <button onClick={onClose} aria-label="Back to order details" className="w-10 h-10 rounded-full glass flex items-center justify-center flex-shrink-0">
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div className="flex-1 text-center pr-10">
              <p className="text-white font-heading font-bold leading-tight">Order Tracking</p>
              <p className="text-forest-200/60 text-xs">#{order.id} · {order.restaurant_name}</p>
            </div>
          </div>
          {stepsBar}
          <div className="flex justify-center py-6">
            <div className={`trk-hero ${cancelled ? 'is-off' : status === 'delivered' ? 'is-done' : ''}`}>
              <StageIcon className="w-14 h-14" strokeWidth={1.6} />
            </div>
          </div>
        </>)}

        {/* Stage */}
        <div className={`text-center ${showMap ? "mt-3" : "mt-5"}`}>
          <p className="text-white font-heading font-extrabold text-xl uppercase tracking-wide">{title}</p>
          <p className="text-forest-200/60 text-sm mt-1 max-w-xs mx-auto">{desc}</p>
          {eta && <p className="text-forest-200/50 text-xs mt-3 flex items-center justify-center gap-1"><Clock className="w-3.5 h-3.5" />Estimated arrival {eta}</p>}
        </div>

        {/* Delivery partner */}
        {order.rider_id && !cancelled && status !== 'delivered' && (
          <div className="glass rounded-3xl p-4 mt-6">
            <div className="flex items-center gap-3">
              <RiderPhoto src={order.rider_avatar} name={order.rider_name} />
              <p className="flex-1 min-w-0 text-white font-heading font-bold leading-snug">
                I’m {riderName}, your delivery rider
              </p>
              {order.rider_phone && (
                <a href={`tel:${order.rider_phone}`} aria-label={`Call ${riderName}`}
                  className="w-10 h-10 rounded-full glass-green flex items-center justify-center flex-shrink-0">
                  <Phone className="w-4 h-4 text-forest-300" />
                </a>
              )}
            </div>
            <p className="trk-note mt-3">
              {onWay ? 'I have your order and I’m on my way to you.'
                : status === 'ready' ? 'Your food is ready. I’ll pick it up from the restaurant soon.'
                : 'I’m heading to the restaurant and will pick up your order soon.'}
            </p>
          </div>
        )}

        {/* Where from, where to */}
        {!cancelled && (
          <div className="glass rounded-3xl p-4 mt-4 space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <span className="w-8 h-8 rounded-full glass-orange flex items-center justify-center flex-shrink-0"><Store className="w-4 h-4 text-ember-300" /></span>
              <div className="min-w-0"><p className="text-white font-semibold">{order.restaurant_name}</p>{order.restaurant_address && <p className="text-forest-200/50 text-xs truncate">{order.restaurant_address}</p>}</div>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-8 h-8 rounded-full glass-green flex items-center justify-center flex-shrink-0"><HomeIcon className="w-4 h-4 text-forest-300" /></span>
              <div className="min-w-0"><p className="text-white font-semibold">Your home</p>{order.delivery_address && <p className="text-forest-200/50 text-xs truncate">{order.delivery_address}</p>}</div>
            </div>
          </div>
        )}

        <button onClick={onClose} className="mt-auto pt-6 w-full">
          <span className="block w-full btn-glow-orange text-white font-bold py-3.5 rounded-2xl uppercase tracking-wide text-sm">Order details</span>
        </button>
      </div>
    </div>
  );
}
