import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ordersApi, storage, request } from '../services/api';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Clock, Package, ChevronRight,
  ClipboardList, ChefHat, PackageCheck, Bike, Navigation, CheckCircle2,
  ArrowRight, Store, RefreshCw, UtensilsCrossed, Phone, MapPin,
} from 'lucide-react';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const ROUTE_COLOR = '#e11d48';
const TRACKABLE_STATUSES = ['ready', 'picked_up'];

const mapIcon = (label, emoji, color = ROUTE_COLOR, pulse = false) => L.divIcon({
  html: `<div style="display:flex;align-items:center;gap:8px;">
    <div style="position:relative;width:36px;height:36px;flex-shrink:0;">
      ${pulse ? `<div style="position:absolute;inset:-8px;border-radius:50%;background:${color}33;animation:dp2 1.6s infinite;"></div>` : ''}
      <div style="position:relative;width:36px;height:36px;border-radius:50%;background:${color};border:3px solid #fff;box-shadow:0 2px 12px ${color}77;display:flex;align-items:center;justify-content:center;font-size:19px;z-index:1;">${emoji}</div>
      <style>@keyframes dp2{0%,100%{transform:scale(1);opacity:.6}50%{transform:scale(2.2);opacity:.1}}</style>
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
      map.setView([points[0].lat, points[0].lng], 14);
    }
  }, [points, map]);
  return null;
}

function AnimatedRiderRoute({ from, to, label = 'Rider' }) {
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

async function geocode(address) {
  try {
    const res  = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`, { headers: { 'Accept-Language': 'en' } });
    const data = await res.json();
    if (data.length) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch { /* ignore */ }
  return null;
}

const STATUSES = [
  { id:'pending',    label:'Placed',    icon:ClipboardList, desc:'Order received by restaurant' },
  { id:'accepted',   label:'Accepted',  icon:ClipboardList, desc:'Restaurant accepted your order' },
  { id:'preparing',  label:'Cooking',   icon:ChefHat,       desc:'Restaurant is preparing your food' },
  { id:'ready',      label:'Ready',     icon:PackageCheck,  desc:'Food is ready for pickup' },
  { id:'picked_up',  label:'On the Way', icon:Bike,         desc:'Rider is on the way to you' },
  { id:'delivered',  label:'Delivered', icon:CheckCircle2,  desc:'Order successfully delivered' },
];

export default function OrderTracking() {
  const navigate = useNavigate();
  const [orders,     setOrders]     = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [riderLocs,  setRiderLocs]  = useState({}); // { [orderId]: {lat,lng,rider_name} }
  const [custLocs,   setCustLocs]   = useState({}); // { [orderId]: {lat,lng} }
  const [restLocs,   setRestLocs]   = useState({}); // { [orderId]: {lat,lng} }
  const pollLocRef = useRef(null);

  const fetchOrders = async (silent = false) => {
    if (!storage.getAccess()) { setLoading(false); return; }
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await ordersApi.list({ limit: 10 });
      const list = res?.data ?? [];
      const active = list.filter(o => !['delivered','cancelled','refunded'].includes(o.status));
      const base   = active.length ? active : list.slice(0, 5);

      const detailed = await Promise.allSettled(base.map(o => ordersApi.getOne(o.id)));
      const merged = base.map((o, i) => {
        const full = detailed[i].status === 'fulfilled' ? detailed[i].value : {};
        return { ...o, ...full, items: full.items ?? [] };
      });
      setOrders(merged);

      // Geocode delivery addresses for orders with rider in transit
      merged.forEach(o => {
        if (o.rider_id && o.delivery_address) {
          setCustLocs(prev => {
            if (prev[o.id]) return prev;
            geocode(o.delivery_address).then(loc => {
              if (loc) setCustLocs(p => ({ ...p, [o.id]: loc }));
            });
            return prev;
          });
        }
        if (o.rider_id && o.restaurant_address) {
          setRestLocs(prev => {
            if (prev[o.id]) return prev;
            geocode(o.restaurant_address).then(loc => {
              if (loc) setRestLocs(p => ({ ...p, [o.id]: loc }));
            });
            return prev;
          });
        }
      });
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const canTrackRider = (order) => (
    order.rider_id && TRACKABLE_STATUSES.includes(order.status)
  );

  const fetchRiderLocations = async () => {
    const trackable = orders.filter(canTrackRider);
    for (const o of trackable) {
      try {
        const loc = await request(`/orders/${o.id}/rider-location`);
        setRiderLocs(prev => ({ ...prev, [o.id]: loc }));
      } catch { /* location not available yet */ }
    }
  };

  useEffect(() => {
    fetchOrders();
    const t = setInterval(() => fetchOrders(true), 30000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    clearInterval(pollLocRef.current);
    if (orders.some(canTrackRider)) {
      fetchRiderLocations();
      pollLocRef.current = setInterval(fetchRiderLocations, 5000);
    }
    return () => clearInterval(pollLocRef.current);
  }, [orders]);

  const getStatusIdx = (s) => STATUSES.findIndex(st => st.id === s);
  const displayStatus = (status) => {
    if (status === 'picked_up') return 'On the Way';
    return status.replace('_',' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  if (loading) return (
    <div className="space-y-4">
      <div className="glass rounded-3xl h-48 animate-pulse" />
      <div className="glass rounded-3xl h-48 animate-pulse" />
    </div>
  );

  if (orders.length === 0) return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="glass rounded-3xl p-12 max-w-sm w-full text-center card-3d animate-fade-up">
        <div className="w-16 h-16 glass rounded-3xl flex items-center justify-center mx-auto mb-5">
          <Package className="w-8 h-8 text-forest-300/60" />
        </div>
        <p className="text-white font-bold text-lg mb-2">No active orders</p>
        <p className="text-forest-200/50 text-sm mb-6">Place an order to track it here.</p>
        <button onClick={() => navigate('/restaurants')} className="btn-glow-orange text-white px-8 py-3 rounded-xl font-bold">
          Order Now
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-5 pb-20 lg:pb-0 animate-fade-up">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-heading font-bold text-white">Track Orders</h1>
        <button onClick={() => fetchOrders(true)} disabled={refreshing}
          className="glass hover:glass-green transition-all px-3 py-2 rounded-xl text-forest-200 text-sm flex items-center gap-1.5">
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {orders.map((order) => {
        const curIdx = Math.max(0, getStatusIdx(order.status));
        const isDone = order.status === 'delivered';
        const isCancelled = ['cancelled','refunded'].includes(order.status);

        return (
          <div key={order.id} className="glass rounded-3xl overflow-hidden">

            {/* Order header */}
            <div className="p-5 flex flex-wrap items-start justify-between gap-4"
              style={{ borderBottom:'1px solid rgba(255,255,255,.07)' }}>
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <p className="text-white font-bold text-base">Order #{order.id}</p>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                    isDone ? 'glass-green text-forest-200' : isCancelled ? 'text-red-300 glass' : 'glass-orange text-ember-200'}`}>
                    {displayStatus(order.status)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-forest-200/60 text-xs">
                  <Store className="w-3.5 h-3.5" />
                  <span>{order.restaurant_name}</span>
                </div>
                <p className="text-forest-200/30 text-xs">{new Date(order.created_at).toLocaleString('en-PH')}</p>
              </div>
              <div className="text-right">
                <p className="text-ember-400 font-heading font-bold text-2xl">₱{Number(order.total).toFixed(2)}</p>
                {!isDone && order.estimated_delivery && (
                  <p className="text-forest-200/60 text-xs flex items-center gap-1 justify-end mt-1">
                    <Clock className="w-3 h-3" />
                    <span>ETA: {new Date(order.estimated_delivery).toLocaleTimeString('en-PH', { hour:'2-digit', minute:'2-digit' })}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Progress stepper */}
            {!isCancelled && (
              <div className="px-5 pt-5 pb-4">
                <div className="relative">
                  <div className="absolute top-5 left-5 right-5 h-px bg-white/8">
                    <div className="h-full bg-gradient-to-r from-forest-500 to-ember-500 transition-all duration-700"
                      style={{ width:`${(curIdx / (STATUSES.length - 1)) * 100}%` }} />
                  </div>
                  <div className="relative grid grid-cols-6">
                    {STATUSES.map((s, i) => {
                      const done    = i <= curIdx;
                      const current = i === curIdx;
                      const Icon    = s.icon;
                      return (
                        <div key={s.id} className="flex flex-col items-center gap-2">
                          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-500 z-10
                            ${current ? 'btn-glow-orange scale-110' : done ? 'btn-glow-green' : 'glass'}`}>
                            <Icon className={`w-4 h-4 ${done ? 'text-white' : 'text-forest-200/40'}`} />
                          </div>
                          <p className={`text-[10px] text-center font-medium leading-tight hidden sm:block
                            ${current ? 'text-ember-300' : done ? 'text-forest-300' : 'text-forest-200/30'}`}>
                            {s.label}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="mt-4 glass rounded-xl px-4 py-2.5 flex items-center gap-2">
                  {(() => { const Icon = STATUSES[curIdx]?.icon ?? Package; return <Icon className={`w-4 h-4 flex-shrink-0 ${isDone ? 'text-forest-400' : 'text-ember-400'}`} />; })()}
                  <p className="text-forest-100/70 text-sm">{STATUSES[curIdx]?.desc}</p>
                </div>
              </div>
            )}

            {/* Rider info + live map */}
            {order.rider_id && !isDone && (
              <div className="px-5 pb-4 space-y-3">
                {/* Rider chip */}
                <div className="glass rounded-xl px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 btn-glow-green rounded-xl flex items-center justify-center flex-shrink-0">
                      <Bike className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm">
                        {order.rider_name || 'Rider assigned'}
                      </p>
                      <p className="text-forest-200/50 text-xs flex items-center gap-1">
                        {order.rider_phone
                          ? <><Phone className="w-3 h-3" />{order.rider_phone}</>
                          : riderLocs[order.id] ? '📡 Live location active' : 'On the way'}
                      </p>
                    </div>
                  </div>
                  <Navigation className={`w-5 h-5 ${riderLocs[order.id] ? 'text-forest-400 animate-pulse' : 'text-ember-400'}`} />
                </div>

                {/* Live map — shown when a rider is assigned and actively handling the order */}
                {canTrackRider(order) && (() => {
                  const rLoc   = riderLocs[order.id];
                  const cLoc   = custLocs[order.id];
                  const restLoc = restLocs[order.id];
                  const isDelivering = order.status === 'picked_up';
                  const destination = isDelivering ? cLoc : restLoc;
                  const pts    = [rLoc, destination].filter(Boolean);
                  const center = rLoc || destination || { lat: 5.0293, lng: 119.7731 };
                  return (
                    <div className="rounded-2xl overflow-hidden" style={{ boxShadow: '0 8px 32px rgba(0,0,0,.35)' }}>
                      <div className="px-4 py-2.5 flex items-center gap-2 glass"
                        style={{ borderBottom: '1px solid rgba(255,255,255,.07)' }}>
                        <MapPin className="w-3.5 h-3.5 text-rose-400" />
                        <p className="text-white text-xs font-semibold">
                          {isDelivering ? 'Live Rider Location' : 'Rider Heading to Pickup'}
                        </p>
                        {rLoc
                          ? <span className="ml-auto flex items-center gap-1 text-rose-400 text-xs"><span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />Live</span>
                          : <span className="ml-auto text-forest-200/40 text-xs">Waiting for GPS…</span>}
                      </div>
                      <div style={{ height: 300 }}>
                        <MapContainer
                          key={`map-${order.id}`}
                          center={[center.lat, center.lng]}
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
                          <FitBounds points={pts} />
                          {rLoc && destination && (
                            <AnimatedRiderRoute
                              from={rLoc}
                              to={destination}
                              label={order.rider_name ? order.rider_name.split(' ')[0] : 'Rider'}
                            />
                          )}
                          {rLoc && !destination && (
                            <Marker position={[rLoc.lat, rLoc.lng]}
                              icon={mapIcon(order.rider_name ? order.rider_name.split(' ')[0] : 'Rider', '🏍️', '#f59e0b', true)} />
                          )}
                          {!isDelivering && restLoc && (
                            <Marker position={[restLoc.lat, restLoc.lng]}
                              icon={mapIcon(order.restaurant_name ? order.restaurant_name.split(' ').slice(0, 2).join(' ') : 'Restaurant', '🍽️', '#ef4444')} />
                          )}
                          {isDelivering && cLoc && (
                            <Marker position={[cLoc.lat, cLoc.lng]} icon={mapIcon('Your Home', '🏠', '#10b981')} />
                          )}
                        </MapContainer>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Order items */}
            {order.items && order.items.length > 0 && (
              <div className="px-5 pb-4">
                <div className="glass rounded-2xl overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-3"
                    style={{ borderBottom:'1px solid rgba(255,255,255,.07)' }}>
                    <UtensilsCrossed className="w-4 h-4 text-ember-400" />
                    <p className="text-white text-sm font-semibold">
                      {order.restaurant_name} · {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="divide-y divide-white/5">
                    {order.items.map((item, i) => (
                      <div key={i} className="flex items-center gap-3 px-4 py-3">
                        {/* Food image */}
                        <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 glass">
                          {item.image_url
                            ? <img src={item.image_url} alt={item.name}
                                className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center">
                                <UtensilsCrossed className="w-5 h-5 text-forest-300/30" />
                              </div>
                          }
                        </div>
                        {/* Name + notes */}
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-semibold truncate">{item.name}</p>
                          {item.notes && (
                            <p className="text-ember-300/70 text-xs mt-0.5 truncate">Note: {item.notes}</p>
                          )}
                          <p className="text-forest-200/50 text-xs mt-0.5">
                            ₱{Number(item.price).toFixed(2)} × {item.quantity}
                          </p>
                        </div>
                        {/* Line total */}
                        <p className="text-ember-400 font-heading font-bold text-sm flex-shrink-0">
                          ₱{(Number(item.price) * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>
                  {/* Totals */}
                  <div className="px-4 py-3 space-y-1.5 glass-dark"
                    style={{ borderTop:'1px solid rgba(255,255,255,.07)' }}>
                    {[
                      ['Subtotal',       order.subtotal],
                      ['Delivery fee',   order.delivery_fee],
                      ['Tax',            order.tax],
                    ].filter(([, v]) => v != null && Number(v) > 0).map(([label, val]) => (
                      <div key={label} className="flex justify-between text-xs text-forest-200/50">
                        <span>{label}</span>
                        <span>₱{Number(val).toFixed(2)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between items-center pt-1.5"
                      style={{ borderTop:'1px solid rgba(255,255,255,.07)' }}>
                      <span className="text-white font-bold text-sm">Total</span>
                      <span className="text-ember-400 font-heading font-bold text-base">
                        ₱{Number(order.total).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="px-5 pb-5">
              {isDone ? (
                <button onClick={() => navigate('/restaurants')}
                  className="w-full btn-glow-orange text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2">
                  Order Again <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button onClick={() => navigate(`/restaurant/${order.restaurant_id}`)}
                  className="w-full glass hover:glass-green transition-all text-forest-200 text-sm py-3 rounded-xl flex items-center justify-center gap-2">
                  <Store className="w-4 h-4" />
                  View Restaurant
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
