import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRider } from '../../context/RiderContext';
import { useNotification } from '../../context/NotificationContext';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in React Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export default function RiderDelivery() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { rider } = useRider();
  const { showSuccess } = useNotification();

  const [orderStatus, setOrderStatus] = useState('heading_to_restaurant');

  const [order, setOrder] = useState({
    id: orderId,
    restaurant: {
      name: 'Pizza Palace',
      address: 'Purok 3, Barangay Laminusa, Bongao, Tawi-Tawi',
      phone: '+63 917 987 6543',
      location: { lat: 5.0250, lng: 119.7700 },
    },
    customer: {
      name: 'John Doe',
      address: 'Purok 5, Barangay Poblacion, Bongao, Tawi-Tawi',
      phone: '+63 917 123 4567',
      location: { lat: 5.0320, lng: 119.7760 },
    },
    items: [
      { name: 'Margherita Pizza', quantity: 2, price: 12.99 },
      { name: 'Caesar Salad', quantity: 1, price: 8.99 },
    ],
    total: 40.76,
    deliveryFee: 5.50,
    distance: '2.3 km',
    estimatedTime: '25 min',
    specialInstructions: 'Please ring doorbell',
  });

  // Mock rider location (slightly offset from restaurant/customer)
  const [riderLocation, setRiderLocation] = useState({ lat: 5.0280, lng: 119.7730 });

  // Mock route polyline
  const routeToRestaurant = [
    [riderLocation.lat, riderLocation.lng],
    [5.0265, 119.7715],
    [order.restaurant.location.lat, order.restaurant.location.lng],
  ];

  const routeToCustomer = [
    [order.restaurant.location.lat, order.restaurant.location.lng],
    [5.0285, 119.7730],
    [order.customer.location.lat, order.customer.location.lng],
  ];

  const handleMarkPickedUp = () => {
    setOrderStatus('heading_to_customer');
    showSuccess('Order marked as picked up. Navigate to customer location.');
  };

  const handleMarkDelivered = () => {
    setOrderStatus('delivered');
    showSuccess('Order delivered successfully! +$' + order.deliveryFee.toFixed(2));

    setTimeout(() => {
      navigate('/rider/dashboard');
    }, 2000);
  };

  const handleCallRestaurant = () => {
    window.open(`tel:${order.restaurant.phone}`);
  };

  const handleCallCustomer = () => {
    window.open(`tel:${order.customer.phone}`);
  };

  const handleNavigate = () => {
    const destination = orderStatus === 'heading_to_restaurant'
      ? order.restaurant.address
      : order.customer.address;

    // Open in Google Maps
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`, '_blank');
  };

  const getStatusInfo = () => {
    if (orderStatus === 'heading_to_restaurant') {
      return {
        icon: '🏪',
        title: 'Heading to Restaurant',
        subtitle: order.restaurant.name,
        address: order.restaurant.address,
        phone: order.restaurant.phone,
        action: 'Mark as Picked Up',
        actionFn: handleMarkPickedUp,
        actionVariant: 'success',
      };
    } else if (orderStatus === 'heading_to_customer') {
      return {
        icon: '📍',
        title: 'Heading to Customer',
        subtitle: order.customer.name,
        address: order.customer.address,
        phone: order.customer.phone,
        action: 'Mark as Delivered',
        actionFn: handleMarkDelivered,
        actionVariant: 'success',
      };
    } else {
      return {
        icon: '✅',
        title: 'Delivery Complete',
        subtitle: 'Great job!',
        address: '',
        phone: '',
      };
    }
  };

  const statusInfo = getStatusInfo();
  const currentRoute = orderStatus === 'heading_to_restaurant' ? routeToRestaurant : routeToCustomer;
  const mapCenter = orderStatus === 'heading_to_restaurant'
    ? order.restaurant.location
    : order.customer.location;

  return (
    <div className="space-y-4 xs:space-y-6">
      {/* Header */}
      <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl xs:text-2xl md:text-3xl font-heading font-bold mb-1 xs:mb-2">Active Delivery</h1>
          <p className="text-sm xs:text-base text-secondary-600">Order #{order.id}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate('/rider/dashboard')}>
          <span className="hidden xs:inline">← Back to Dashboard</span>
          <span className="xs:hidden">← Back</span>
        </Button>
      </div>

      {/* Status Card */}
      <Card className="bg-gradient-to-br from-primary-50 to-primary-100 border-primary-200">
        <div className="flex flex-col xs:flex-row items-start xs:items-center gap-3 xs:gap-4">
          <div className="text-3xl xs:text-4xl md:text-5xl">{statusInfo.icon}</div>
          <div className="flex-1">
            <h2 className="text-lg xs:text-xl md:text-2xl font-bold mb-1">{statusInfo.title}</h2>
            <p className="text-base xs:text-lg font-medium text-secondary-700">{statusInfo.subtitle}</p>
            {statusInfo.address && (
              <p className="text-xs xs:text-sm text-secondary-600 mt-1">{statusInfo.address}</p>
            )}
          </div>
          {statusInfo.action && (
            <Button
              variant={statusInfo.actionVariant}
              size="sm"
              className="w-full xs:w-auto"
              onClick={statusInfo.actionFn}
            >
              {statusInfo.action}
            </Button>
          )}
        </div>
      </Card>

      {/* Map */}
      <Card>
        <h3 className="text-base xs:text-lg md:text-xl font-bold mb-3 xs:mb-4">Route Navigation</h3>
        <div className="rounded-lg overflow-hidden border border-secondary-200 mb-4">
          <MapContainer
            center={[mapCenter.lat, mapCenter.lng]}
            zoom={14}
            style={{ height: '300px', width: '100%' }}
            className="xs:!h-[350px] md:!h-[400px]"
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />

            {/* Rider Location */}
            <Marker position={[riderLocation.lat, riderLocation.lng]}>
              <Popup>
                <strong>Your Location</strong>
                <br />
                Rider: {rider?.name}
              </Popup>
            </Marker>

            {/* Restaurant Location */}
            <Marker position={[order.restaurant.location.lat, order.restaurant.location.lng]}>
              <Popup>
                <strong>{order.restaurant.name}</strong>
                <br />
                {order.restaurant.address}
              </Popup>
            </Marker>

            {/* Customer Location */}
            <Marker position={[order.customer.location.lat, order.customer.location.lng]}>
              <Popup>
                <strong>{order.customer.name}</strong>
                <br />
                {order.customer.address}
              </Popup>
            </Marker>

            {/* Route */}
            <Polyline
              positions={currentRoute}
              color="#F4991A"
              weight={4}
              opacity={0.7}
            />
          </MapContainer>
        </div>

        <div className="flex flex-col xs:flex-row gap-2">
          <Button variant="primary" size="sm" className="flex-1" onClick={handleNavigate}>
            📍 Open in Maps
          </Button>
          {orderStatus === 'heading_to_restaurant' && (
            <Button variant="outline" size="sm" onClick={handleCallRestaurant}>
              <span className="hidden xs:inline">📞 Call Restaurant</span>
              <span className="xs:hidden">📞 Restaurant</span>
            </Button>
          )}
          {orderStatus === 'heading_to_customer' && (
            <Button variant="outline" size="sm" onClick={handleCallCustomer}>
              <span className="hidden xs:inline">📞 Call Customer</span>
              <span className="xs:hidden">📞 Customer</span>
            </Button>
          )}
        </div>
      </Card>

      {/* Route Info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 xs:gap-4">
        {/* Pickup Details */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">🏪</span>
            <h3 className="text-xl font-bold">Pickup Details</h3>
            {orderStatus !== 'heading_to_restaurant' && (
              <span className="ml-auto px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                ✓ Completed
              </span>
            )}
          </div>
          <div className="space-y-2">
            <div>
              <p className="text-sm font-medium text-secondary-700">Restaurant</p>
              <p className="text-base">{order.restaurant.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-secondary-700">Address</p>
              <p className="text-base">{order.restaurant.address}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-secondary-700">Phone</p>
              <p className="text-base">{order.restaurant.phone}</p>
            </div>
          </div>
        </Card>

        {/* Delivery Details */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">📍</span>
            <h3 className="text-xl font-bold">Delivery Details</h3>
            {orderStatus === 'delivered' && (
              <span className="ml-auto px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                ✓ Delivered
              </span>
            )}
          </div>
          <div className="space-y-2">
            <div>
              <p className="text-sm font-medium text-secondary-700">Customer</p>
              <p className="text-base">{order.customer.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-secondary-700">Address</p>
              <p className="text-base">{order.customer.address}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-secondary-700">Phone</p>
              <p className="text-base">{order.customer.phone}</p>
            </div>
            {order.specialInstructions && (
              <div>
                <p className="text-sm font-medium text-secondary-700">Special Instructions</p>
                <p className="text-base text-primary-600">{order.specialInstructions}</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Order Items */}
      <Card>
        <h3 className="text-base xs:text-lg md:text-xl font-bold mb-3 xs:mb-4">Order Items</h3>
        <div className="space-y-3">
          {order.items.map((item, index) => (
            <div key={index} className="flex justify-between items-center pb-3 border-b border-secondary-200 last:border-0">
              <div>
                <p className="font-medium">{item.quantity}x {item.name}</p>
              </div>
              <p className="font-medium">${(item.price * item.quantity).toFixed(2)}</p>
            </div>
          ))}
          <div className="pt-3 border-t-2 border-secondary-300">
            <div className="flex justify-between items-center mb-1">
              <p className="text-secondary-700">Subtotal:</p>
              <p>${order.total.toFixed(2)}</p>
            </div>
            <div className="flex justify-between items-center font-bold text-lg">
              <p>Your Delivery Fee:</p>
              <p className="text-green-600">${order.deliveryFee.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Quick Actions */}
      {orderStatus !== 'delivered' && (
        <Card className="bg-yellow-50 border-yellow-200">
          <h3 className="text-lg font-bold mb-3">Having Issues?</h3>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm">
              Report Problem
            </Button>
            <Button variant="outline" size="sm">
              Contact Support
            </Button>
            <Button variant="outline" size="sm">
              Cancel Delivery
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
