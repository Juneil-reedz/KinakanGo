import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet with webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom marker icons
const createCustomIcon = (emoji, color = '#dc2626') => {
  return L.divIcon({
    html: `
      <div style="
        background-color: ${color};
        width: 40px;
        height: 40px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
        border: 3px solid white;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
      ">
        <span style="
          font-size: 20px;
          transform: rotate(45deg);
        ">${emoji}</span>
      </div>
    `,
    className: 'custom-marker',
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
  });
};

// Special rider icon with animated pulse effect
const createRiderIcon = () => {
  return L.divIcon({
    html: `
      <div style="
        position: relative;
        width: 50px;
        height: 50px;
      ">
        <div style="
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 50px;
          height: 50px;
          background-color: #F4991A;
          border-radius: 50%;
          animation: pulse 2s infinite;
          opacity: 0.6;
        "></div>
        <div style="
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background-color: #F4991A;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 4px solid white;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
          z-index: 1;
        ">
          <span style="
            font-size: 24px;
          ">🏍️</span>
        </div>
      </div>
      <style>
        @keyframes pulse {
          0% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 0.6;
          }
          50% {
            transform: translate(-50%, -50%) scale(1.3);
            opacity: 0.3;
          }
          100% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 0.6;
          }
        }
      </style>
    `,
    className: 'custom-rider-marker',
    iconSize: [50, 50],
    iconAnchor: [25, 25],
    popupAnchor: [0, -25],
  });
};

const restaurantIcon = createCustomIcon('🍽️', '#dc2626');
const customerIcon = createCustomIcon('🏠', '#10b981');
const riderIcon = createRiderIcon();

// Component to auto-fit map bounds
function AutoFitBounds({ locations }) {
  const map = useMap();

  useEffect(() => {
    if (locations && locations.length > 0) {
      const bounds = L.latLngBounds(locations.map(loc => [loc.lat, loc.lng]));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [locations, map]);

  return null;
}

// Animated marker component
function AnimatedMarker({ position, icon, popup }) {
  const markerRef = useRef(null);

  useEffect(() => {
    if (markerRef.current) {
      const marker = markerRef.current;
      marker.setLatLng(position);
    }
  }, [position]);

  return (
    <Marker ref={markerRef} position={position} icon={icon}>
      {popup && <Popup>{popup}</Popup>}
    </Marker>
  );
}

export default function DeliveryMap({
  restaurantLocation,
  customerLocation,
  riderLocation,
  route = [],
  className = '',
}) {
  // Calculate all locations for bounds
  const allLocations = [
    restaurantLocation,
    customerLocation,
    riderLocation,
  ].filter(Boolean);

  // Default center (Bongao, Tawi-Tawi)
  const defaultCenter = [5.0293, 119.7731];
  const center = allLocations.length > 0
    ? [allLocations[0].lat, allLocations[0].lng]
    : defaultCenter;

  return (
    <div className={`relative ${className}`}>
      <MapContainer
        center={center}
        zoom={13}
        style={{ height: '100%', width: '100%', borderRadius: '0.5rem' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Auto-fit bounds */}
        <AutoFitBounds locations={allLocations} />

        {/* Restaurant Marker */}
        {restaurantLocation && (
          <Marker
            position={[restaurantLocation.lat, restaurantLocation.lng]}
            icon={restaurantIcon}
          >
            <Popup>
              <div className="text-center">
                <p className="font-bold text-primary-600">Restaurant</p>
                <p className="text-sm">{restaurantLocation.name}</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Customer Marker */}
        {customerLocation && (
          <Marker
            position={[customerLocation.lat, customerLocation.lng]}
            icon={customerIcon}
          >
            <Popup>
              <div className="text-center">
                <p className="font-bold text-success">Delivery Address</p>
                <p className="text-sm">{customerLocation.address}</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Rider Marker (Animated) */}
        {riderLocation && (
          <AnimatedMarker
            position={[riderLocation.lat, riderLocation.lng]}
            icon={riderIcon}
            popup={
              <div className="text-center">
                <p className="font-bold text-warning">Delivery Driver</p>
                <p className="text-sm">On the way to you!</p>
              </div>
            }
          />
        )}

        {/* Route Polyline */}
        {route && route.length > 1 && (
          <Polyline
            positions={route.map(point => [point.lat, point.lng])}
            color="#f59e0b"
            weight={4}
            opacity={0.7}
            dashArray="10, 10"
          />
        )}
      </MapContainer>

      {/* Map Legend */}
      <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-lg p-3 z-[1000]">
        <h4 className="font-semibold text-sm mb-2">Map Legend</h4>
        <div className="space-y-1 text-xs">
          <div className="flex items-center space-x-2">
            <span className="text-lg">🍽️</span>
            <span>Restaurant</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-lg">🏍️</span>
            <span>Delivery Driver</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-lg">🏠</span>
            <span>Your Location</span>
          </div>
        </div>
      </div>
    </div>
  );
}
