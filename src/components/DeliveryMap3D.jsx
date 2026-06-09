import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

// ─── Marker factories ────────────────────────────────────────────────────────

function makeRiderMarker() {
  const el = document.createElement('div');
  el.style.cssText = 'width:70px;height:70px;position:relative;cursor:pointer;';
  el.innerHTML = `
    <style>
      @keyframes riderPulse{0%,100%{transform:scale(1);opacity:.7}50%{transform:scale(2.2);opacity:.15}}
      @keyframes riderBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
      @keyframes riderSpin{to{transform:rotate(360deg)}}
    </style>
    <div style="position:absolute;inset:0;border-radius:50%;
      background:radial-gradient(circle,rgba(245,158,11,.7)0%,transparent 65%);
      animation:riderPulse 1.6s ease-in-out infinite;"></div>
    <div style="position:absolute;inset:8px;border-radius:50%;
      background:radial-gradient(circle,rgba(245,158,11,.4)0%,transparent 70%);
      animation:riderPulse 1.6s ease-in-out infinite .4s;"></div>
    <div style="
      position:absolute;top:50%;left:50%;
      transform:translate(-50%,-50%);
      width:46px;height:46px;border-radius:50%;
      background:linear-gradient(145deg,#fbbf24,#d97706);
      border:3px solid #fff;
      box-shadow:0 0 24px rgba(245,158,11,.95),0 0 48px rgba(245,158,11,.4),0 6px 16px rgba(0,0,0,.6);
      display:flex;align-items:center;justify-content:center;
      font-size:22px;z-index:2;
      animation:riderBob 2s ease-in-out infinite;
    ">🏍️</div>
    <div style="
      position:absolute;bottom:-6px;left:50%;transform:translateX(-50%);
      width:30px;height:6px;border-radius:50%;
      background:rgba(0,0,0,.35);filter:blur(3px);
    "></div>`;
  return el;
}

function makeHouseMarker(focused) {
  const el = document.createElement('div');
  const size = focused ? 90 : 58;
  el.style.cssText = `width:${size}px;height:${size + 20}px;position:relative;cursor:pointer;`;
  el.innerHTML = `
    <style>
      @keyframes housePulse{0%,100%{transform:scale(1);opacity:.6}50%{transform:scale(1.5);opacity:.2}}
      @keyframes houseBounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
      @keyframes houseGlow{0%,100%{box-shadow:0 0 20px rgba(16,185,129,.8),0 0 40px rgba(16,185,129,.4),0 6px 16px rgba(0,0,0,.6)}50%{box-shadow:0 0 35px rgba(16,185,129,1),0 0 70px rgba(16,185,129,.6),0 6px 16px rgba(0,0,0,.6)}}
    </style>
    ${focused ? `
      <div style="position:absolute;inset:-14px;border-radius:50%;
        border:2px solid rgba(16,185,129,.5);
        animation:housePulse 2s ease-in-out infinite;"></div>
      <div style="position:absolute;inset:-22px;border-radius:50%;
        border:1.5px solid rgba(16,185,129,.3);
        animation:housePulse 2s ease-in-out infinite .6s;"></div>
    ` : ''}
    <div style="
      position:absolute;top:0;left:50%;transform:translateX(-50%);
      width:${Math.round(size * .76)}px;height:${Math.round(size * .76)}px;border-radius:14px;
      background:linear-gradient(145deg,#34d399,#059669);
      border:3px solid #fff;
      display:flex;align-items:center;justify-content:center;
      font-size:${Math.round(size * .38)}px;z-index:2;
      animation:${focused ? 'houseBounce 2.2s ease-in-out infinite,houseGlow 2.2s ease-in-out infinite' : 'none'};
      box-shadow:${focused
        ? '0 0 24px rgba(16,185,129,.95),0 0 50px rgba(16,185,129,.45),0 6px 16px rgba(0,0,0,.55)'
        : '0 0 12px rgba(16,185,129,.7),0 4px 10px rgba(0,0,0,.45)'};
    ">🏠</div>
    <div style="
      position:absolute;bottom:8px;left:50%;transform:translateX(-50%);
      width:3px;height:14px;background:#10b981;border-radius:2px;z-index:1;
    "></div>
    <div style="
      position:absolute;bottom:2px;left:50%;transform:translateX(-50%);
      width:${focused ? 22 : 14}px;height:${focused ? 7 : 5}px;
      border-radius:50%;background:rgba(0,0,0,.35);filter:blur(${focused ? 4 : 2}px);
    "></div>`;
  return el;
}

function makeRestaurantMarker() {
  const el = document.createElement('div');
  el.style.cssText = 'width:56px;height:64px;position:relative;cursor:pointer;';
  el.innerHTML = `
    <style>@keyframes restPin{0%,100%{transform:rotate(-45deg) scale(1)}50%{transform:rotate(-45deg) scale(1.08)}}</style>
    <div style="
      width:46px;height:46px;
      background:linear-gradient(145deg,#ef4444,#b91c1c);
      border-radius:50% 50% 50% 0;
      transform:rotate(-45deg);
      border:3px solid #fff;
      box-shadow:0 0 18px rgba(220,38,38,.8),0 0 36px rgba(220,38,38,.3),0 5px 14px rgba(0,0,0,.5);
      display:flex;align-items:center;justify-content:center;
      animation:restPin 2.5s ease-in-out infinite;
    "><span style="transform:rotate(45deg);font-size:22px;">🍽️</span></div>
    <div style="
      position:absolute;bottom:-4px;left:50%;transform:translateX(-50%);
      width:14px;height:5px;border-radius:50%;
      background:rgba(0,0,0,.3);filter:blur(2px);
    "></div>`;
  return el;
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function calcBearing(from, to) {
  const [lng1, lat1] = [from.lng * Math.PI / 180, from.lat * Math.PI / 180];
  const [lng2, lat2] = [to.lng * Math.PI / 180, to.lat * Math.PI / 180];
  const dLng = lng2 - lng1;
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
}

const FREE_STYLE = 'https://tiles.openfreemap.org/styles/liberty';

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * DeliveryMap3D
 *
 * mode="customer" → camera follows the rider, bearing rotates to face direction of travel
 * mode="rider"    → camera locked on customer house, spotlight + pulsing rings
 */
export default function DeliveryMap3D({
  restaurantLocation,   // { lat, lng, name? }
  customerLocation,     // { lat, lng, address? }
  riderLocation,        // { lat, lng }
  route = [],           // [{ lat, lng }, ...]
  mode = 'customer',
  riderName = 'Your Rider',
  eta = null,
  progress = 0,
  className = '',
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef({ rider: null, restaurant: null, customer: null });
  const prevRiderRef = useRef(null);
  const pulseFrameRef = useRef(null);
  const pulseRadiusRef = useRef(0);
  const pulseDir = useRef(1);
  const [ready, setReady] = useState(false);

  const anchorCenter = customerLocation || restaurantLocation || riderLocation || { lat: 5.0293, lng: 119.7731 };

  // ── Init map ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: FREE_STYLE,
      center: [anchorCenter.lng, anchorCenter.lat],
      zoom: mode === 'rider' ? 17 : 15,
      pitch: mode === 'rider' ? 58 : 50,
      bearing: 0,
      antialias: true,
    });
    mapRef.current = map;

    map.on('load', () => {
      // ── 3D buildings ──────────────────────────────────────────────────────
      try {
        const layers = map.getStyle().layers;
        let firstSymbolId;
        for (const l of layers) { if (l.type === 'symbol') { firstSymbolId = l.id; break; } }

        if (map.getSource('openmaptiles')) {
          map.addLayer({
            id: 'buildings-3d',
            source: 'openmaptiles',
            'source-layer': 'building',
            type: 'fill-extrusion',
            minzoom: 14,
            paint: {
              'fill-extrusion-color': [
                'interpolate', ['linear'], ['get', 'render_height'],
                0, '#1e293b', 20, '#1e3a5f', 60, '#0f2744', 200, '#0a1628',
              ],
              'fill-extrusion-height': [
                'interpolate', ['linear'], ['zoom'], 14, 0, 14.5, ['get', 'render_height'],
              ],
              'fill-extrusion-base': [
                'interpolate', ['linear'], ['zoom'], 14, 0, 14.5, ['get', 'render_min_height'],
              ],
              'fill-extrusion-opacity': 0.85,
            },
          }, firstSymbolId);
        }
      } catch (_) { /* 3D buildings not available for this area — no problem */ }

      // ── Route source + layers ──────────────────────────────────────────────
      map.addSource('route', {
        type: 'geojson',
        data: { type: 'Feature', geometry: { type: 'LineString', coordinates: [] } },
      });
      // Outer glow
      map.addLayer({
        id: 'route-glow',
        type: 'line',
        source: 'route',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-color': '#f59e0b', 'line-width': 14, 'line-opacity': 0.25, 'line-blur': 6 },
      });
      // Core animated dash
      map.addLayer({
        id: 'route-core',
        type: 'line',
        source: 'route',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-color': '#fbbf24', 'line-width': 4, 'line-opacity': 0.95, 'line-dasharray': [0, 4, 3] },
      });

      // ── Rider-mode: pulsing rings on map ──────────────────────────────────
      if (mode === 'rider' && customerLocation) {
        map.addSource('house-target', {
          type: 'geojson',
          data: {
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [customerLocation.lng, customerLocation.lat] },
          },
        });
        // Static outer ring
        map.addLayer({
          id: 'house-ring-static',
          type: 'circle',
          source: 'house-target',
          paint: {
            'circle-radius': 60, 'circle-color': 'transparent',
            'circle-stroke-color': '#10b981', 'circle-stroke-width': 1.5,
            'circle-stroke-opacity': 0.35,
          },
        });
        // Animated pulsing ring
        map.addLayer({
          id: 'house-ring-pulse',
          type: 'circle',
          source: 'house-target',
          paint: {
            'circle-radius': 20, 'circle-color': 'rgba(16,185,129,0.12)',
            'circle-stroke-color': '#10b981', 'circle-stroke-width': 2,
            'circle-stroke-opacity': 0.7,
          },
        });
        // Animate radius with rAF
        const animatePulse = () => {
          if (!map.getLayer('house-ring-pulse')) return;
          pulseRadiusRef.current += pulseDir.current * 0.4;
          if (pulseRadiusRef.current > 55) pulseDir.current = -1;
          if (pulseRadiusRef.current < 12) pulseDir.current = 1;
          try {
            map.setPaintProperty('house-ring-pulse', 'circle-radius', pulseRadiusRef.current);
            map.setPaintProperty('house-ring-pulse', 'circle-stroke-opacity',
              0.9 - pulseRadiusRef.current / 70);
          } catch (_) {}
          pulseFrameRef.current = requestAnimationFrame(animatePulse);
        };
        pulseFrameRef.current = requestAnimationFrame(animatePulse);
      }

      // ── Add initial markers ─────────────────────────────────────────────────
      if (restaurantLocation) {
        markersRef.current.restaurant = new maplibregl.Marker({ element: makeRestaurantMarker(), anchor: 'bottom' })
          .setLngLat([restaurantLocation.lng, restaurantLocation.lat])
          .setPopup(new maplibregl.Popup({ offset: 25 }).setHTML(
            `<b>🍽️ ${restaurantLocation.name || 'Restaurant'}</b>`))
          .addTo(map);
      }

      if (customerLocation) {
        markersRef.current.customer = new maplibregl.Marker({
          element: makeHouseMarker(mode === 'rider'),
          anchor: 'bottom',
        })
          .setLngLat([customerLocation.lng, customerLocation.lat])
          .setPopup(new maplibregl.Popup({ offset: 25 }).setHTML(
            `<b>🏠 Delivery Address</b><br/><small>${customerLocation.address || ''}</small>`))
          .addTo(map);
      }

      if (riderLocation) {
        markersRef.current.rider = new maplibregl.Marker({ element: makeRiderMarker(), anchor: 'center' })
          .setLngLat([riderLocation.lng, riderLocation.lat])
          .addTo(map);
      }

      // ── Rider mode: focus camera on house ──────────────────────────────────
      if (mode === 'rider' && customerLocation) {
        const bearing = riderLocation
          ? calcBearing(riderLocation, customerLocation)
          : 0;
        map.flyTo({
          center: [customerLocation.lng, customerLocation.lat],
          zoom: 17.5, pitch: 58, bearing,
          duration: 2200, essential: true,
          easing: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
        });
      }

      setReady(true);
    });

    return () => {
      if (pulseFrameRef.current) cancelAnimationFrame(pulseFrameRef.current);
      map.remove();
      mapRef.current = null;
      markersRef.current = { rider: null, restaurant: null, customer: null };
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Update route ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || !route.length) return;
    const src = mapRef.current.getSource('route');
    if (!src) return;
    src.setData({
      type: 'Feature',
      geometry: { type: 'LineString', coordinates: route.map(p => [p.lng, p.lat]) },
    });
  }, [route]);

  // ── Update rider position ─────────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || !riderLocation) return;
    const map = mapRef.current;
    const coords = [riderLocation.lng, riderLocation.lat];

    if (markersRef.current.rider) {
      markersRef.current.rider.setLngLat(coords);
    } else if (ready) {
      markersRef.current.rider = new maplibregl.Marker({ element: makeRiderMarker(), anchor: 'center' })
        .setLngLat(coords).addTo(map);
    }

    if (mode === 'customer') {
      let bearing = map.getBearing();
      if (prevRiderRef.current) {
        bearing = calcBearing(prevRiderRef.current, riderLocation);
      }
      prevRiderRef.current = riderLocation;

      map.easeTo({
        center: coords, bearing, pitch: 50, zoom: 16,
        duration: 1600,
        easing: t => t * (2 - t),
      });
    }

    if (mode === 'rider' && customerLocation) {
      const bearing = calcBearing(riderLocation, customerLocation);
      map.easeTo({ bearing, pitch: 58, duration: 1200 });
    }
  }, [riderLocation, ready]);

  // ── Ride rmode: keep camera locked on house even if component re-renders ────
  useEffect(() => {
    if (!mapRef.current || mode !== 'rider' || !customerLocation || !ready) return;
    const map = mapRef.current;
    const bearing = riderLocation ? calcBearing(riderLocation, customerLocation) : 0;
    map.flyTo({
      center: [customerLocation.lng, customerLocation.lat],
      zoom: 17.5, pitch: 58, bearing,
      duration: 1800, essential: true,
    });
  }, [ready]);

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{ height: '100%', width: '100%', borderRadius: 'inherit' }}
    >
      {/* Map canvas */}
      <div ref={containerRef} style={{ height: '100%', width: '100%' }} />

      {/* Vignette overlay */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at 50% 50%, transparent 55%, rgba(0,0,0,.35) 100%)',
      }} />

      {/* Rider-mode spotlight cone */}
      {mode === 'rider' && (
        <div style={{
          position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
          pointerEvents: 'none', zIndex: 5,
          width: 0, height: 0,
          borderLeft: '160px solid transparent',
          borderRight: '160px solid transparent',
          borderTop: '280px solid rgba(16,185,129,.06)',
          filter: 'blur(24px)',
        }} />
      )}

      {/* ── Loading overlay ─────────────────────────────────────── */}
      {!ready && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 20,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          background: 'linear-gradient(135deg,#0f172a 0%,#1e293b 100%)',
          gap: 14, color: 'white',
        }}>
          <div style={{
            width: 44, height: 44,
            border: '3px solid rgba(255,255,255,.15)',
            borderTopColor: mode === 'rider' ? '#10b981' : '#f59e0b',
            borderRadius: '50%',
            animation: 'spin3d 0.9s linear infinite',
          }} />
          <span style={{ fontSize: '0.9rem', color: '#94a3b8' }}>
            {mode === 'rider' ? 'Locating customer…' : 'Loading live map…'}
          </span>
          <style>{`@keyframes spin3d{to{transform:rotate(360deg)}}`}</style>
        </div>
      )}

      {/* ── Customer mode: top info bar ─────────────────────────── */}
      {mode === 'customer' && ready && riderLocation && (
        <div style={{
          position: 'absolute', top: 14, left: 14, right: 14, zIndex: 10,
          background: 'rgba(10,18,32,.82)', backdropFilter: 'blur(14px)',
          borderRadius: 16, padding: '11px 16px',
          border: '1px solid rgba(245,158,11,.3)',
          display: 'flex', alignItems: 'center', gap: 12, color: 'white',
          boxShadow: '0 8px 32px rgba(0,0,0,.4)',
          pointerEvents: 'none',
        }}>
          <div style={{
            width: 42, height: 42, borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(145deg,#fbbf24,#d97706)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
            boxShadow: '0 0 16px rgba(245,158,11,.7)',
          }}>🏍️</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: '.88rem', letterSpacing: '.01em' }}>{riderName}</div>
            <div style={{ fontSize: '.72rem', color: '#94a3b8', marginTop: 2 }}>heading your way</div>
          </div>
          {eta && (
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontWeight: 800, color: '#fbbf24', fontSize: '1.15rem', lineHeight: 1 }}>{eta}</div>
              <div style={{ fontSize: '.68rem', color: '#94a3b8', marginTop: 2 }}>min away</div>
            </div>
          )}
        </div>
      )}

      {/* ── Customer mode: bottom progress bar ─────────────────── */}
      {mode === 'customer' && ready && progress > 0 && (
        <div style={{
          position: 'absolute', bottom: 14, left: 14, right: 14, zIndex: 10,
          background: 'rgba(10,18,32,.82)', backdropFilter: 'blur(14px)',
          borderRadius: 14, padding: '10px 14px',
          border: '1px solid rgba(255,255,255,.08)',
          color: 'white', boxShadow: '0 8px 32px rgba(0,0,0,.4)',
          pointerEvents: 'none',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
            <span style={{ fontSize: '.72rem', color: '#94a3b8' }}>🍽️ Restaurant</span>
            <span style={{ fontSize: '.72rem', color: '#94a3b8' }}>🏠 Your Home</span>
          </div>
          <div style={{ height: 7, borderRadius: 4, background: 'rgba(255,255,255,.1)', overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 4,
              width: `${progress}%`,
              background: 'linear-gradient(90deg,#f59e0b,#10b981)',
              transition: 'width 1.2s cubic-bezier(.4,0,.2,1)',
              boxShadow: '0 0 8px rgba(245,158,11,.6)',
            }} />
          </div>
          <div style={{ textAlign: 'center', marginTop: 5, fontSize: '.72rem', fontWeight: 700, color: '#fbbf24' }}>
            {Math.round(progress)}% complete
          </div>
        </div>
      )}

      {/* ── Rider mode: top info bar ────────────────────────────── */}
      {mode === 'rider' && ready && (
        <div style={{
          position: 'absolute', top: 14, left: 14, right: 14, zIndex: 10,
          background: 'rgba(10,18,32,.82)', backdropFilter: 'blur(14px)',
          borderRadius: 16, padding: '11px 16px',
          border: '1px solid rgba(16,185,129,.35)',
          display: 'flex', alignItems: 'center', gap: 12, color: 'white',
          boxShadow: '0 8px 32px rgba(0,0,0,.4)',
          pointerEvents: 'none',
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(145deg,#34d399,#059669)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
            boxShadow: '0 0 18px rgba(16,185,129,.75)',
            animation: 'houseGlowPulse 2s ease-in-out infinite',
          }}>🏠</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: '.88rem' }}>Delivery Destination</div>
            <div style={{ fontSize: '.72rem', color: '#94a3b8', marginTop: 2 }}>
              {customerLocation?.address || 'Navigate to customer'}
            </div>
          </div>
          {eta && (
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontWeight: 800, color: '#34d399', fontSize: '1.15rem', lineHeight: 1 }}>{eta}</div>
              <div style={{ fontSize: '.68rem', color: '#94a3b8', marginTop: 2 }}>min away</div>
            </div>
          )}
        </div>
      )}

      {/* ── Rider mode: bottom "You are here" pill ──────────────── */}
      {mode === 'rider' && ready && riderLocation && (
        <div style={{
          position: 'absolute', bottom: 14, left: '50%', transform: 'translateX(-50%)',
          zIndex: 10, pointerEvents: 'none',
          background: 'rgba(10,18,32,.82)', backdropFilter: 'blur(14px)',
          borderRadius: 24, padding: '7px 18px',
          border: '1px solid rgba(245,158,11,.3)',
          display: 'flex', alignItems: 'center', gap: 8, color: 'white',
          boxShadow: '0 4px 20px rgba(0,0,0,.4)',
          whiteSpace: 'nowrap',
        }}>
          <div style={{
            width: 10, height: 10, borderRadius: '50%',
            background: '#fbbf24', boxShadow: '0 0 8px #f59e0b',
            animation: 'spin3d2 1s ease-in-out infinite alternate',
          }} />
          <span style={{ fontSize: '.78rem', fontWeight: 600, color: '#fbbf24' }}>You are here</span>
        </div>
      )}

      {/* ── Legend (both modes) ─────────────────────────────────── */}
      <div style={{
        position: 'absolute',
        bottom: mode === 'customer' && progress > 0 ? 88 : 14,
        right: 14, zIndex: 10, pointerEvents: 'none',
        background: 'rgba(10,18,32,.75)', backdropFilter: 'blur(12px)',
        borderRadius: 12, padding: '8px 12px',
        border: '1px solid rgba(255,255,255,.08)',
        color: 'white', fontSize: '.68rem',
      }}>
        {restaurantLocation && <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
          <span>🍽️</span><span style={{ color: '#94a3b8' }}>Restaurant</span>
        </div>}
        {riderLocation && <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
          <span>🏍️</span><span style={{ color: '#94a3b8' }}>Rider</span>
        </div>}
        {customerLocation && <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span>🏠</span><span style={{ color: '#94a3b8' }}>Home</span>
        </div>}
      </div>

      <style>{`
        @keyframes houseGlowPulse{0%,100%{box-shadow:0 0 18px rgba(16,185,129,.75)}50%{box-shadow:0 0 32px rgba(16,185,129,1)}}
        @keyframes spin3d2{to{transform:scale(1.3)}}
      `}</style>
    </div>
  );
}
