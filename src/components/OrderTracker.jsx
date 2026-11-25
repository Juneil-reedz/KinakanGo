import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  ArrowLeft, Check, ClipboardList, ChefHat, Bike, CheckCircle2, XCircle,
  Phone, MapPin, Clock, Store, Home as HomeIcon,
} from 'lucide-react';
import { request } from '../services/api';

const RIDER_LIVE_MS = 5000;

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

const pin = (emoji, color, label, pulse = false) => L.divIcon({
  className: '', iconSize: [0, 0], iconAnchor: [20, 20],
  html: `<div class="trk-pin" style="--c:${color}">
    ${pulse ? '<span class="trk-pin-pulse"></span>' : ''}
    <span class="trk-pin-dot">${emoji}</span>
    ${label ? `<span class="trk-pin-label">${label.replace(/[<>&"]/g, '')}</span>` : ''}
  </div>`,
});

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

  return (
    <div className="trk fixed inset-0 z-[200] overflow-y-auto" role="dialog" aria-modal="true" aria-label={`Tracking order ${order.id}`}>
      <div className="max-w-lg mx-auto min-h-full flex flex-col px-4 pb-8">
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

        {/* Steps */}
        {!cancelled && (
          <div className="flex items-center justify-center gap-0 mt-2 mb-5" aria-label={`Step ${step + 1} of ${STEPS.length}`}>
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
        )}

        {/* Map, from the moment the restaurant accepts */}
        {showMap ? (
          <div className="trk-map relative rounded-[1.75rem] overflow-hidden">
            <div style={{ height: 'min(62vw, 20rem)' }}>
              <MapContainer center={[(rest || home || rider || { lat: 5.0293 }).lat, (rest || home || rider || { lng: 119.7731 }).lng]}
                zoom={14} style={{ height: '100%', width: '100%' }} zoomControl={false} attributionControl>
                <TileLayer
                  url={`https://{s}.basemaps.cartocdn.com/${darkTiles ? 'dark_all' : 'light_all'}/{z}/{x}/{y}{r}.png`}
                  attribution='&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap' />
                <Fit points={points} />
                {line && <Polyline positions={line.map(p => [p.lat, p.lng])}
                  pathOptions={{ color: darkTiles ? '#fba94c' : '#2a211b', weight: 3, dashArray: '2 9', lineCap: 'round' }} />}
                {points.map(p => (
                  <Marker key={p.kind} position={[p.lat, p.lng]} opacity={p.faint ? 0.55 : 1}
                    icon={p.kind === 'rider' ? pin('🛵', '#f7931e', riderName, true)
                      : p.kind === 'rest' ? pin('🍽️', '#e11d48', restName)
                      : pin('🏠', '#0d9488', 'Home')} />
                ))}
              </MapContainer>
            </div>
            {distLabel && (
              <div className="absolute left-3 right-3 top-3 z-[500] trk-chip flex items-center gap-2">
                <MapPin className="w-4 h-4 text-ember-400 flex-shrink-0" />
                <span className="text-xs font-semibold truncate">{distLabel}</span>
                {riderStage && rider && <span className="ml-auto flex items-center gap-1 text-[11px] text-rose-400 flex-shrink-0"><span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />Live</span>}
              </div>
            )}
          </div>
        ) : (
          <div className="flex justify-center py-6">
            <div className={`trk-hero ${cancelled ? 'is-off' : status === 'delivered' ? 'is-done' : ''}`}>
              <StageIcon className="w-14 h-14" strokeWidth={1.6} />
            </div>
          </div>
        )}

        {/* Stage */}
        <div className="text-center mt-5">
          <p className="text-white font-heading font-extrabold text-xl uppercase tracking-wide">{title}</p>
          <p className="text-forest-200/60 text-sm mt-1 max-w-xs mx-auto">{desc}</p>
          {eta && <p className="text-forest-200/50 text-xs mt-3 flex items-center justify-center gap-1"><Clock className="w-3.5 h-3.5" />Estimated arrival {eta}</p>}
        </div>

        {/* Delivery partner */}
        {order.rider_id && !cancelled && status !== 'delivered' && (
          <div className="glass rounded-3xl p-4 mt-6">
            <div className="flex items-center gap-3">
              <span className="w-12 h-12 rounded-full btn-glow-orange flex items-center justify-center flex-shrink-0">
                <Bike className="w-6 h-6 text-white" />
              </span>
              <p className="flex-1 min-w-0 text-white font-heading font-bold leading-snug">
                I’m {riderName}, your delivery partner
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
