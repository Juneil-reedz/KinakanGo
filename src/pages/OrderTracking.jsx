import { useState, useEffect } from 'react';
import { useNotification } from '../context/NotificationContext';
import Card from '../components/Card';
import Button from '../components/Button';
import DeliveryMap from '../components/DeliveryMap';
import { mockSocket, generateRoute, mockLocations } from '../services/mockSocket';

export default function OrderTracking() {
  const { showInfo, showSuccess } = useNotification();
  const [orders, setOrders] = useState([
    {
      id: '12345',
      restaurant: 'Pizza Palace',
      items: ['Margherita Pizza x2', 'Caesar Salad x1'],
      total: 34.97,
      status: 'preparing',
      statusText: 'Preparing',
      estimatedTime: '25-30 min',
      date: new Date().toISOString(),
      driver: null,
      restaurantLocation: mockLocations.restaurants[0],
      customerLocation: mockLocations.customers[0],
      riderLocation: null,
      route: null,
      deliveryProgress: 0,
    },
  ]);

  const [activeOrderId, setActiveOrderId] = useState(null);

  // Order status lifecycle
  const orderStatuses = [
    { id: 'placed', label: 'Order Placed', icon: '📝', description: 'Order received' },
    { id: 'preparing', label: 'Preparing', icon: '👨‍🍳', description: 'Restaurant is preparing your food' },
    { id: 'ready', label: 'Ready for Pickup', icon: '✅', description: 'Food is ready' },
    { id: 'picked_up', label: 'Picked Up', icon: '🏍️', description: 'Driver picked up your order' },
    { id: 'on_the_way', label: 'On the Way', icon: '🚗', description: 'Delivery in progress' },
    { id: 'delivered', label: 'Delivered', icon: '🎉', description: 'Order delivered' },
  ];

  const getStatusIndex = (status) => {
    return orderStatuses.findIndex((s) => s.id === status);
  };

  const simulateOrderProgress = (orderId) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order || order.status === 'delivered') return;

    const currentIndex = getStatusIndex(order.status);
    if (currentIndex < orderStatuses.length - 1) {
      const nextStatus = orderStatuses[currentIndex + 1];

      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? {
                ...o,
                status: nextStatus.id,
                statusText: nextStatus.label,
                driver:
                  nextStatus.id === 'picked_up'
                    ? { name: 'John Doe', phone: '+1 (555) 123-4567' }
                    : o.driver,
              }
            : o
        )
      );

      // Show notification
      showInfo(`Order #${orderId}: ${nextStatus.label} - ${nextStatus.description}`);

      // Start real-time tracking when picked up
      if (nextStatus.id === 'picked_up') {
        startRealTimeTracking(orderId);
      }

      // If delivered, show success
      if (nextStatus.id === 'delivered') {
        setTimeout(() => {
          showSuccess(`Order #${orderId} has been delivered! Enjoy your meal! 🎉`);
        }, 500);
      }
    }
  };

  const startRealTimeTracking = (orderId) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;

    // Generate route from restaurant to customer
    const route = generateRoute(
      order.restaurantLocation,
      order.customerLocation,
      20 // number of points
    );

    // Set initial rider location to restaurant
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              route,
              riderLocation: route[0],
              estimatedTime: `${mockSocket.calculateETA(0, route.length)} min`,
            }
          : o
      )
    );

    setActiveOrderId(orderId);

    // Connect mock socket
    mockSocket.connect(orderId);

    // Listen for rider location updates
    const handleRiderLocation = (data) => {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? {
                ...o,
                riderLocation: data.position,
                deliveryProgress: data.progress,
                estimatedTime: `${mockSocket.calculateETA(
                  Math.floor((data.progress / 100) * route.length),
                  route.length
                )} min`,
              }
            : o
        )
      );
    };

    // Listen for order status updates
    const handleOrderStatus = (data) => {
      if (data.status === 'picked_up') {
        showInfo(data.message);
        setOrders((prev) =>
          prev.map((o) =>
            o.id === orderId ? { ...o, status: 'on_the_way', statusText: 'On the Way' } : o
          )
        );
      } else if (data.status === 'nearby') {
        showInfo(data.message);
      } else if (data.status === 'delivered') {
        showSuccess('Order has been delivered! Enjoy your meal! 🎉');
        setOrders((prev) =>
          prev.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  status: 'delivered',
                  statusText: 'Delivered',
                  estimatedTime: null,
                }
              : o
          )
        );
        mockSocket.disconnect();
        setActiveOrderId(null);
      }
    };

    mockSocket.on('rider_location', handleRiderLocation);
    mockSocket.on('order_status', handleOrderStatus);

    // Start rider updates with 2 second interval
    mockSocket.startRiderUpdates(route, 2000);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mockSocket.disconnect();
    };
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'placed':
      case 'preparing':
        return 'bg-warning text-white';
      case 'ready':
      case 'picked_up':
      case 'on_the_way':
        return 'bg-primary-600 text-white';
      case 'delivered':
        return 'bg-success text-white';
      case 'cancelled':
        return 'bg-error text-white';
      default:
        return 'bg-secondary-500 text-white';
    }
  };

  return (
    <div className="container-custom py-8">
      <h1 className="text-4xl font-heading font-bold mb-8">Track Your Orders</h1>

      {orders.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">📦</div>
          <h2 className="text-2xl font-heading font-bold mb-4">No orders yet</h2>
          <p className="text-secondary-600 mb-8">
            When you place an order, you'll be able to track it here.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {orders.map((order) => {
            const currentStatusIndex = getStatusIndex(order.status);
            const isDelivered = order.status === 'delivered';

            return (
              <Card key={order.id}>
                {/* Order Header */}
                <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-6 pb-4 border-b border-secondary-200">
                  <div className="flex-1 mb-4 md:mb-0">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-xl font-semibold">Order #{order.id}</h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          order.status
                        )}`}
                      >
                        {order.statusText}
                      </span>
                    </div>
                    <p className="text-secondary-600 mb-1">{order.restaurant}</p>
                    <p className="text-sm text-secondary-500">
                      {new Date(order.date).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary-600">
                      ${order.total.toFixed(2)}
                    </p>
                    {!isDelivered && order.estimatedTime && (
                      <p className="text-sm text-secondary-600">ETA: {order.estimatedTime}</p>
                    )}
                  </div>
                </div>

                {/* Status Progress Bar */}
                <div className="mb-8">
                  <div className="relative">
                    {/* Progress Line */}
                    <div className="absolute top-6 left-0 right-0 h-1 bg-secondary-200 mx-8">
                      <div
                        className="h-full bg-primary-600 transition-all duration-500"
                        style={{
                          width: `${(currentStatusIndex / (orderStatuses.length - 1)) * 100}%`,
                        }}
                      />
                    </div>

                    {/* Status Steps */}
                    <div className="relative grid grid-cols-3 md:grid-cols-6 gap-2">
                      {orderStatuses.map((status, index) => {
                        const isCompleted = index <= currentStatusIndex;
                        const isCurrent = index === currentStatusIndex;

                        return (
                          <div key={status.id} className="flex flex-col items-center">
                            <div
                              className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl mb-2 transition-all duration-300 ${
                                isCompleted
                                  ? 'bg-primary-600 scale-110 shadow-lg'
                                  : 'bg-secondary-200'
                              } ${isCurrent ? 'ring-4 ring-primary-200' : ''}`}
                            >
                              {status.icon}
                            </div>
                            <p
                              className={`text-xs text-center font-medium ${
                                isCompleted ? 'text-primary-600' : 'text-secondary-500'
                              }`}
                            >
                              {status.label}
                            </p>
                            {isCurrent && (
                              <p className="text-xs text-center text-secondary-600 mt-1">
                                {status.description}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div className="mb-6 pb-6 border-b border-secondary-200">
                  <h4 className="font-semibold mb-3">Order Items:</h4>
                  <ul className="space-y-2">
                    {order.items.map((item, idx) => (
                      <li key={idx} className="text-secondary-700 flex items-center">
                        <span className="text-primary-600 mr-2">•</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Driver Info (if picked up) */}
                {order.driver && !isDelivered && (
                  <div className="mb-6 pb-6 border-b border-secondary-200">
                    <h4 className="font-semibold mb-3">Delivery Driver</h4>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-secondary-300 rounded-full flex items-center justify-center text-xl">
                          👤
                        </div>
                        <div>
                          <p className="font-medium">{order.driver.name}</p>
                          <p className="text-sm text-secondary-600">{order.driver.phone}</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        📞 Call Driver
                      </Button>
                    </div>
                  </div>
                )}

                {/* Live Delivery Map */}
                {order.riderLocation && order.route && !isDelivered && (
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold">Live Tracking</h4>
                      <div className="flex items-center space-x-2">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-success text-white">
                          <span className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></span>
                          Live
                        </span>
                        {order.deliveryProgress > 0 && (
                          <span className="text-sm text-secondary-600">
                            {Math.round(order.deliveryProgress)}% complete
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="h-96 rounded-lg overflow-hidden border-2 border-secondary-200">
                      <DeliveryMap
                        restaurantLocation={order.restaurantLocation}
                        customerLocation={order.customerLocation}
                        riderLocation={order.riderLocation}
                        route={order.route}
                      />
                    </div>
                    <div className="mt-3 bg-primary-50 border border-primary-200 rounded-lg p-3">
                      <p className="text-sm text-secondary-700">
                        Your delivery driver is on the way! Track their real-time location on the map above.
                      </p>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3">
                  {!isDelivered && (
                    <Button
                      variant="primary"
                      onClick={() => simulateOrderProgress(order.id)}
                    >
                      🔄 Simulate Next Status
                    </Button>
                  )}
                  {isDelivered && (
                    <>
                      <Button variant="outline" className="flex-1">
                        ⭐ Rate Order
                      </Button>
                      <Button variant="outline" className="flex-1">
                        🔁 Reorder
                      </Button>
                      <Button variant="outline" className="flex-1">
                        💬 Leave Review
                      </Button>
                    </>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
