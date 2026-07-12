import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRider, riderRequest } from '../../context/RiderContext';
import { useNotification } from '../../context/NotificationContext';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Store, MapPin, Phone, Navigation, ArrowLeft,
  CheckCircle2, Package, ChevronRight, AlertTriangle, Loader2,
} from 'lucide-react';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const ROUTE_COLOR = '#e11d48';

const mapIcon = (label, emoji, color = ROUTE_COLOR, pulse = false) => L.divIcon({
  html: `<div style="display:flex;align-items:center;gap:8px;">
    <div style="position:relative;width:36px;height:36px;flex-shrink:0;">
      ${pulse ? `<div style="position:absolute;inset:-8px;border-radius:50%;background:${color}33;animation:dp 1.6s infinite;"></div>` : ''}
      <div style="position:relative;width:36px;height:36px;border-radius:50%;background:${color};border:3px solid #fff;box-shadow:0 2px 12px ${color}77;display:flex;align-items:center;justify-content:center;font-size:19px;z-index:1;">${emoji}</div>
      <style>@keyframes dp{0%,100%{transform:scale(1);opacity:.6}50%{transform:scale(2.2);opacity:.1}}</style>
    </div>
    <div style="background:white;border-radius:20px;padding:5px 12px;white-space:nowrap;font-size:12px;font-weight:700;color:#111827;box-shadow:0 2px 10px rgba(0,0,0,.18);">${label}</div>
  </div>`,
  className: '', iconSize: [0, 0], iconAnchor: [18, 18],
});

function FitBounds({ points }) {
  const map = useMap();
  useEffect(() => {
    if (points.length > 1) {
      map.fitBounds(L.latLngBounds(points.map(p => [p.lat, p.lng])), { padding: [55, 55], maxZoom: 17 });
    } else if (points.length === 1) {
      map.setView([points[0].lat, points[0].lng], 15);
    }
  }, [points, map]);
  return null;
}

function AnimatedRiderRoute({ from, to, label = 'You' }) {
  const [pts, setPts] = useState([[from.lat, from.lng], [to.lat, to.lng]]);
  const [markerPos, setMarkerPos] = useState([from.lat, from.lng]);

  useEffect(() => {
    if (!from || !to) return;
    setMarkerPos([from.lat, from.lng]);
    fetch(`https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`)
      .then(r => r.json())
      .then(d => {
        if (d.routes?.[0]) {
          setPts(d.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]));
        } else {
          setPts([[from.lat, from.lng], [to.lat, to.lng]]);
        }
      })
      .catch(() => setPts([[from.lat, from.lng], [to.lat, to.lng]]));
  }, [from?.lat, from?.lng, to?.lat, to?.lng]);

  useEffect(() => {
    if (pts.length < 2) return;
    let frameId;
    const startedAt = performance.now();
    const duration = 22000;

    const tick = (now) => {
      const progress = Math.min((now - startedAt) / duration, 1);
      const scaled = progress * (pts.length - 1);
      const idx = Math.min(Math.floor(scaled), pts.length - 2);
      const local = scaled - idx;
      const a = pts[idx];
      const b = pts[idx + 1];
      setMarkerPos([
        a[0] + (b[0] - a[0]) * local,
        a[1] + (b[1] - a[1]) * local,
      ]);
      if (progress < 1) frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [pts]);

  return (
    <>
      <Polyline positions={pts} pathOptions={{ color: ROUTE_COLOR, weight: 4, opacity: 0.85, lineCap: 'round', lineJoin: 'round' }} />
      <Marker position={markerPos} icon={mapIcon(label, '🏍️', '#f59e0b', true)} />
    </>
  );
}

// Geocode a text address → {lat, lng} using free OpenStreetMap Nominatim
async function geocode(address) {
  try {
    const res  = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`, { headers: { 'Accept-Language': 'en' } });
    const data = await res.json();
    if (data.length) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch { /* ignore */ }
  return null;
}

const STEPS = [
  { id: 'heading_to_restaurant', label: 'Picking Up',  icon: Store       },
  { id: 'heading_to_customer',   label: 'Delivering',  icon: Navigation  },
  { id: 'delivered',             label: 'Completed',   icon: CheckCircle2 },
];

const DEFAULT_CENTER = [5.0293, 119.7731]; // Bongao, Tawi-Tawi

export default function RiderDelivery() {
  const { orderId }         = useParams();
  const navigate            = useNavigate();
  const { rider }           = useRider();
  const { addNotification } = useNotification();

  const [order,         setOrder]         = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [step,          setStep]          = useState('heading_to_restaurant');
  const [riderPos,      setRiderPos]      = useState(null);   // {lat,lng} — live from device GPS
  const [restaurantPos, setRestPos]       = useState(null);
  const [customerPos,   setCustPos]       = useState(null);
  const [delivering,    setDelivering]    = useState(false);

  const watchIdRef  = useRef(null);
  const sendRef     = useRef(null);

  // ── Fetch real order data ──────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const data = await riderRequest(`/orders/${orderId}`);
        setOrder(data);
        // Geocode addresses in background
        if (data.restaurant_address) geocode(data.restaurant_address).then(setRestPos);
        if (data.delivery_address)   geocode(data.delivery_address).then(setCustPos);
      } catch {
        addNotification('Could not load order details', 'error');
      } finally {
        setLoading(false);
      }
    })();
  }, [orderId]);

  // ── GPS watch — send to backend every 10 s ─────────────────────────────────
  useEffect(() => {
    if (!navigator.geolocation) return;
    watchIdRef.current = navigator.geolocation.watchPosition(
      ({ coords }) => setRiderPos({ lat: coords.latitude, lng: coords.longitude }),
      () => {},
      { enableHighAccuracy: true, maximumAge: 5000 }
    );
    return () => navigator.geolocation.clearWatch(watchIdRef.current);
  }, []);

  useEffect(() => {
    if (!riderPos) return;
    // Send location immediately, then every 10 s
    const push = () => riderRequest('/riders/location', {
      method: 'PATCH', body: JSON.stringify({ lat: riderPos.lat, lng: riderPos.lng }),
    }).catch(() => {});
    push();
    sendRef.current = setInterval(push, 10000);
    return () => clearInterval(sendRef.current);
  }, [riderPos]);

  // ── Deliver action ─────────────────────────────────────────────────────────
  const markDelivered = async () => {
    setDelivering(true);
    try {
      await riderRequest(`/orders/${orderId}/status`, {
        method: 'PATCH', body: JSON.stringify({ status: 'delivered' }),
      });
      setStep('delivered');
      addNotification('Delivery complete! Great job.', 'success');
      setTimeout(() => navigate('/rider/dashboard'), 2500);
    } catch {
      addNotification('Failed to mark as delivered', 'error');
    } finally {
      setDelivering(false);
    }
  };

  const markPickedUp = async () => {
    try {
      await riderRequest(`/orders/${orderId}/status`, {
        method: 'PATCH', body: JSON.stringify({ status: 'picked_up', statusText: 'On the Way' }),
      });
      setStep('heading_to_customer');
      addNotification('Pickup confirmed. Customer can now track you on the way.', 'success');
    } catch {
      addNotification('Failed to update pickup status', 'error');
    }
  };

  const openMaps = () => {
    const dest = step === 'heading_to_restaurant'
      ? (order?.restaurant_address || order?.restaurant_name)
      : order?.delivery_address;
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(dest || '')}`, '_blank');
  };

  // ── Derived values ─────────────────────────────────────────────────────────
  const curStepIdx = STEPS.findIndex(s => s.id === step);
  const isDone     = step === 'delivered';
  const atRest     = step === 'heading_to_restaurant';

  // Map markers to show
  const destinationPos = atRest ? restaurantPos : customerPos;
  const activeMarkers = [riderPos, destinationPos].filter(Boolean);
  const mapCenter     = riderPos || restaurantPos || customerPos
    ? (riderPos || restaurantPos || customerPos)
    : { lat: DEFAULT_CENTER[0], lng: DEFAULT_CENTER[1] };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-ember-400 animate-spin" />
    </div>
  );

  return (
    <div className="space-y-4 pb-6 animate-fade-up">

      {/* Back + title */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/rider/dashboard')}
          className="w-9 h-9 glass rounded-xl flex items-center justify-center text-forest-200 hover:glass-green transition-all">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl font-heading font-bold text-white">Active Delivery</h1>
          <p className="text-forest-200/50 text-xs">Order #{orderId}</p>
        </div>
      </div>

      {/* GPS indicator */}
      <div className={`glass rounded-xl px-4 py-2.5 flex items-center gap-2 ${riderPos ? 'glass-green' : ''}`}>
        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${riderPos ? 'bg-forest-400 animate-pulse' : 'bg-forest-200/30'}`} />
        <p className={`text-xs font-medium ${riderPos ? 'text-forest-300' : 'text-forest-200/50'}`}>
          {riderPos ? `GPS active — sharing your location with customer` : 'Waiting for GPS signal…'}
        </p>
      </div>

      {/* Step indicator */}
      <div className="glass rounded-2xl p-4">
        <div className="flex items-center">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const done = i <= curStepIdx;
            const cur  = i === curStepIdx;
            return (
              <div key={s.id} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all
                    ${cur ? 'btn-glow-orange scale-110' : done ? 'btn-glow-green' : 'glass'}`}>
                    <Icon className={`w-4 h-4 ${done ? 'text-white' : 'text-forest-200/30'}`} />
                  </div>
                  <p className={`text-xs mt-1.5 font-medium ${cur ? 'text-ember-300' : done ? 'text-forest-300' : 'text-forest-200/30'}`}>
                    {s.label}
                  </p>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="flex-1 h-px mx-2 mb-5 bg-white/8">
                    {done && i < curStepIdx && <div className="h-full bg-gradient-to-r from-forest-500 to-ember-500" />}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Destination card */}
      {!isDone && (
        <div className={`glass rounded-2xl p-4 ${atRest ? 'glass-orange' : 'glass-green'}`}>
          <div className="flex items-start gap-3 mb-4">
            <div className={`w-10 h-10 ${atRest ? 'btn-glow-orange' : 'btn-glow-green'} rounded-xl flex items-center justify-center flex-shrink-0`}>
              {atRest ? <Store className="w-5 h-5 text-white" /> : <MapPin className="w-5 h-5 text-white" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold">{atRest ? 'Heading to Restaurant' : 'Heading to Customer'}</p>
              <p className="text-white/70 text-sm truncate">
                {atRest ? (order?.restaurant_name || '—') : (order?.customer_name || '—')}
              </p>
              <p className="text-white/50 text-xs mt-0.5 truncate">
                {atRest ? (order?.restaurant_address || '—') : (order?.delivery_address || '—')}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={openMaps}
              className="flex-1 glass text-forest-100 text-sm font-medium py-2.5 rounded-xl flex items-center justify-center gap-1.5 hover:glass-green transition-all">
              <Navigation className="w-4 h-4" /> Open in Maps
            </button>
            {(atRest ? order?.restaurant_phone : order?.customer_phone) && (
              <a href={`tel:${atRest ? order?.restaurant_phone : order?.customer_phone}`}
                className="w-11 h-11 glass rounded-xl flex items-center justify-center hover:glass-green transition-all flex-shrink-0">
                <Phone className="w-4 h-4 text-forest-200" />
              </a>
            )}
          </div>
        </div>
      )}

      {isDone && (
        <div className="glass-green rounded-2xl p-5 text-center">
          <CheckCircle2 className="w-10 h-10 text-forest-300 mx-auto mb-2" />
          <p className="text-white font-bold text-lg">Delivery Complete!</p>
          <p className="text-forest-200/60 text-sm">Returning to dashboard…</p>
        </div>
      )}

      {/* Live map */}
      <div className="rounded-2xl overflow-hidden" style={{ boxShadow: '0 8px 32px rgba(0,0,0,.35)' }}>
        <div className="px-4 py-3 flex items-center justify-between glass"
          style={{ borderBottom: '1px solid rgba(255,255,255,.07)' }}>
          <p className="text-white font-semibold text-sm">
            {atRest ? 'Route to Restaurant' : "Route to Customer's Home"}
          </p>
          {riderPos
            ? <span className="flex items-center gap-1.5 text-xs text-forest-300"><span className="w-2 h-2 rounded-full bg-forest-400 animate-pulse" />Live GPS</span>
            : <span className="text-forest-200/40 text-xs flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Getting GPS…</span>}
        </div>
        <div style={{ height: 360 }}>
          <MapContainer
            center={[mapCenter.lat, mapCenter.lng]}
            zoom={15}
            maxZoom={20}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom
            zoomControl>
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
              maxZoom={20}
              maxNativeZoom={20}
              attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            />
            <FitBounds points={activeMarkers} />

            {/* Route line */}
            {riderPos && destinationPos && (
              <AnimatedRiderRoute from={riderPos} to={destinationPos} label="You" />
            )}

            {/* Markers */}
            {riderPos && !destinationPos && (
              <Marker position={[riderPos.lat, riderPos.lng]} icon={mapIcon('You', '🏍️', '#f59e0b', true)} />
            )}
            {atRest && restaurantPos && (
              <Marker position={[restaurantPos.lat, restaurantPos.lng]}
                icon={mapIcon(order?.restaurant_name ? order.restaurant_name.split(' ').slice(0,2).join(' ') : 'Restaurant', '🍽️', '#ef4444')} />
            )}
            {!atRest && customerPos && (
              <Marker position={[customerPos.lat, customerPos.lng]} icon={mapIcon('Customer Home', '🏠', '#10b981')} />
            )}
          </MapContainer>
        </div>
      </div>

      {/* Pickup / Delivery cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className={`glass rounded-2xl p-4 ${!atRest ? 'opacity-50' : ''}`}>
          <div className="flex items-center gap-1.5 mb-2">
            <Store className="w-3.5 h-3.5 text-ember-400" />
            <p className="text-ember-300/80 text-xs font-semibold uppercase tracking-wide">Pickup</p>
            {!atRest && (
              <span className="ml-auto glass-green text-forest-200 text-xs px-1.5 py-0.5 rounded-full">Done</span>
            )}
          </div>
          <p className="text-white text-sm font-semibold truncate">{order?.restaurant_name || '—'}</p>
          <p className="text-forest-200/50 text-xs mt-1 leading-tight">{order?.restaurant_address || '—'}</p>
        </div>
        <div className={`glass rounded-2xl p-4 ${atRest ? 'opacity-50' : ''}`}>
          <div className="flex items-center gap-1.5 mb-2">
            <MapPin className="w-3.5 h-3.5 text-forest-400" />
            <p className="text-forest-300/80 text-xs font-semibold uppercase tracking-wide">Deliver</p>
            {isDone && (
              <span className="ml-auto glass-green text-forest-200 text-xs px-1.5 py-0.5 rounded-full">Done</span>
            )}
          </div>
          <p className="text-white text-sm font-semibold truncate">{order?.customer_name || '—'}</p>
          <p className="text-forest-200/50 text-xs mt-1 leading-tight">{order?.delivery_address || '—'}</p>
          {order?.customer_phone && (
            <p className="text-forest-200/40 text-xs mt-1">{order.customer_phone}</p>
          )}
        </div>
      </div>

      {/* Order items */}
      {order?.items?.length > 0 && (
        <div className="glass rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Package className="w-4 h-4 text-forest-300/60" />
            <p className="text-white font-semibold text-sm">Order Items</p>
          </div>
          <div className="space-y-2">
            {order.items.map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                {item.image_url
                  ? <img src={item.image_url} alt={item.name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                  : <div className="w-10 h-10 glass rounded-lg flex-shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm truncate">{item.name}</p>
                  {item.notes && <p className="text-ember-300/70 text-xs truncate">Note: {item.notes}</p>}
                </div>
                <p className="text-forest-200/60 text-sm flex-shrink-0">×{item.quantity}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 flex items-center justify-between" style={{ borderTop: '1px solid rgba(255,255,255,.07)' }}>
            <p className="text-forest-300 text-sm font-semibold">Your Delivery Fee</p>
            <p className="text-forest-300 font-heading font-bold text-lg">₱{Number(order?.delivery_fee || 0).toFixed(2)}</p>
          </div>
          {order?.special_instructions && (
            <div className="mt-3 glass rounded-xl px-3 py-2 flex items-start gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-ember-400 mt-0.5 flex-shrink-0" />
              <p className="text-ember-200/80 text-xs">{order.special_instructions}</p>
            </div>
          )}
        </div>
      )}

      {/* CTA */}
      {!isDone && (
        atRest ? (
          <button onClick={markPickedUp}
            className="w-full btn-glow-green text-white font-heading font-bold py-4 rounded-2xl flex items-center justify-center gap-2 text-base">
            Picked Up — Head to Customer <ChevronRight className="w-5 h-5" />
          </button>
        ) : (
          <button onClick={markDelivered} disabled={delivering}
            className="w-full btn-glow-orange text-white font-heading font-bold py-4 rounded-2xl flex items-center justify-center gap-2 text-base disabled:opacity-60">
            {delivering
              ? <><Loader2 className="w-5 h-5 animate-spin" /> Completing…</>
              : <>Mark as Delivered <ChevronRight className="w-5 h-5" /></>}
          </button>
        )
      )}
    </div>
  );
}
