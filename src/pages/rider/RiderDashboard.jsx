import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useRider } from '../../context/RiderContext';
import { useNotification } from '../../context/NotificationContext';
import Card from '../../components/Card';
import Button from '../../components/Button';

export default function RiderDashboard() {
  const { rider } = useRider();
  const { showSuccess, showError } = useNotification();
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    todayDeliveries: 8,
    todayEarnings: 124.50,
    activeDeliveries: 1,
    pendingOffers: 2,
  });

  const [orders, setOrders] = useState([
    {
      id: '12345',
      status: 'assigned',
      restaurant: {
        name: 'Pizza Palace',
        address: 'Purok 3, Barangay Laminusa, Bongao, Tawi-Tawi',
        phone: '+63 917 987 6543',
      },
      customer: {
        name: 'John Doe',
        address: 'Purok 5, Barangay Poblacion, Bongao, Tawi-Tawi',
        phone: '+63 917 123 4567',
      },
      items: [
        { name: 'Margherita Pizza', quantity: 2 },
        { name: 'Caesar Salad', quantity: 1 },
      ],
      total: 40.76,
      deliveryFee: 5.50,
      distance: '2.3 km',
      estimatedTime: '25 min',
      pickupTime: '2:30 PM',
      assignedTime: '5 min ago',
    },
    {
      id: '12346',
      status: 'assigned',
      restaurant: {
        name: 'Burger House',
        address: 'Purok 7, Barangay Sanga-Sanga, Bongao, Tawi-Tawi',
        phone: '+63 917 456 7890',
      },
      customer: {
        name: 'Jane Smith',
        address: 'Purok 2, Barangay Masantong, Bongao, Tawi-Tawi',
        phone: '+63 917 987 6543',
      },
      items: [
        { name: 'Classic Cheeseburger', quantity: 1 },
        { name: 'French Fries', quantity: 1 },
      ],
      total: 19.25,
      deliveryFee: 4.00,
      distance: '1.8 km',
      estimatedTime: '20 min',
      pickupTime: '2:45 PM',
      assignedTime: '2 min ago',
    },
    {
      id: '12344',
      status: 'in_progress',
      restaurant: {
        name: 'Sushi Masters',
        address: 'Purok 1, Barangay Ipil, Bongao, Tawi-Tawi',
        phone: '+63 917 234 5678',
      },
      customer: {
        name: 'Mike Johnson',
        address: 'Purok 4, Barangay Simandagit, Bongao, Tawi-Tawi',
        phone: '+63 917 456 7890',
      },
      items: [
        { name: 'California Roll', quantity: 2 },
        { name: 'Salmon Nigiri', quantity: 1 },
      ],
      total: 32.97,
      deliveryFee: 6.00,
      distance: '3.1 km',
      estimatedTime: '30 min',
      pickupTime: 'Picked up',
      pickedUpAt: '2:15 PM',
    },
  ]);

  const [filter, setFilter] = useState('all');

  const getFilteredOrders = () => {
    if (filter === 'all') return orders;
    return orders.filter(order => order.status === filter);
  };

  const getStatusBadge = (status) => {
    const badges = {
      assigned: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      in_progress: 'bg-blue-100 text-blue-800 border-blue-200',
      completed: 'bg-green-100 text-green-800 border-green-200',
    };
    return badges[status] || badges.assigned;
  };

  const getStatusText = (status) => {
    const texts = {
      assigned: 'New Assignment',
      in_progress: 'In Progress',
      completed: 'Completed',
    };
    return texts[status] || status;
  };

  const handleAcceptOrder = (orderId) => {
    setOrders(orders.map(order =>
      order.id === orderId
        ? { ...order, status: 'in_progress' }
        : order
    ));
    showSuccess('Order accepted! Navigate to restaurant to pick up.');

    // Navigate to delivery page
    setTimeout(() => {
      navigate(`/rider/delivery/${orderId}`);
    }, 1000);
  };

  const handleDeclineOrder = (orderId) => {
    setOrders(orders.filter(order => order.id !== orderId));
    setStats(prev => ({ ...prev, pendingOffers: prev.pendingOffers - 1 }));
    showSuccess('Order declined');
  };

  const handleNavigateToDelivery = (orderId) => {
    navigate(`/rider/delivery/${orderId}`);
  };

  return (
    <div className="space-y-4 xs:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl xs:text-2xl md:text-3xl font-heading font-bold mb-1 xs:mb-2">Rider Dashboard</h1>
        <p className="text-sm xs:text-base text-secondary-600">Welcome back, {rider?.name}!</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 xs:gap-4">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs xs:text-sm text-secondary-600 mb-1">Today's Earnings</p>
              <p className="text-xl xs:text-2xl md:text-3xl font-bold text-green-700">${stats.todayEarnings.toFixed(2)}</p>
            </div>
            <div className="w-10 h-10 xs:w-12 xs:h-12 bg-green-500 rounded-full flex items-center justify-center text-xl xs:text-2xl">
              💰
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs xs:text-sm text-secondary-600 mb-1">Deliveries Today</p>
              <p className="text-xl xs:text-2xl md:text-3xl font-bold text-blue-700">{stats.todayDeliveries}</p>
            </div>
            <div className="w-10 h-10 xs:w-12 xs:h-12 bg-blue-500 rounded-full flex items-center justify-center text-xl xs:text-2xl">
              📦
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-primary-50 to-primary-100 border-primary-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs xs:text-sm text-secondary-600 mb-1">Active Deliveries</p>
              <p className="text-xl xs:text-2xl md:text-3xl font-bold text-primary-700">{stats.activeDeliveries}</p>
            </div>
            <div className="w-10 h-10 xs:w-12 xs:h-12 bg-primary-500 rounded-full flex items-center justify-center text-xl xs:text-2xl">
              🏍️
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs xs:text-sm text-secondary-600 mb-1">Pending Offers</p>
              <p className="text-xl xs:text-2xl md:text-3xl font-bold text-yellow-700">{stats.pendingOffers}</p>
            </div>
            <div className="w-10 h-10 xs:w-12 xs:h-12 bg-yellow-500 rounded-full flex items-center justify-center text-xl xs:text-2xl">
              ⏳
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Link to="/rider/earnings">
          <Button variant="outline">
            View Earnings History
          </Button>
        </Link>
        <Button variant="outline">
          Toggle Availability
        </Button>
      </div>

      {/* Orders List */}
      <Card>
        <div className="mb-4 xs:mb-6">
          <h2 className="text-lg xs:text-xl md:text-2xl font-heading font-bold mb-3 xs:mb-4">Delivery Orders</h2>

          {/* Filter Buttons */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 xs:px-4 py-1.5 xs:py-2 rounded-lg text-sm xs:text-base font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-primary-500 text-white'
                  : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('assigned')}
              className={`px-3 xs:px-4 py-1.5 xs:py-2 rounded-lg text-sm xs:text-base font-medium transition-colors ${
                filter === 'assigned'
                  ? 'bg-primary-500 text-white'
                  : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200'
              }`}
            >
              <span className="hidden xs:inline">New Assignments</span>
              <span className="xs:hidden">New</span>
            </button>
            <button
              onClick={() => setFilter('in_progress')}
              className={`px-3 xs:px-4 py-1.5 xs:py-2 rounded-lg text-sm xs:text-base font-medium transition-colors ${
                filter === 'in_progress'
                  ? 'bg-primary-500 text-white'
                  : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200'
              }`}
            >
              In Progress
            </button>
          </div>
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          {getFilteredOrders().length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📭</div>
              <p className="text-secondary-600">No orders available</p>
            </div>
          ) : (
            getFilteredOrders().map((order) => (
              <div
                key={order.id}
                className="border border-secondary-200 rounded-lg p-4 hover:border-primary-300 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold text-lg">Order #{order.id}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadge(order.status)}`}>
                        {getStatusText(order.status)}
                      </span>
                    </div>
                    <p className="text-sm text-secondary-600">{order.assignedTime}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-green-600">${order.deliveryFee.toFixed(2)}</p>
                    <p className="text-xs text-secondary-600">Delivery Fee</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  {/* Pickup Info */}
                  <div className="bg-secondary-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-secondary-700 mb-2 flex items-center gap-1">
                      <span>🏪</span> PICKUP FROM
                    </p>
                    <p className="font-medium text-sm mb-1">{order.restaurant.name}</p>
                    <p className="text-xs text-secondary-600 mb-1">{order.restaurant.address}</p>
                    <p className="text-xs text-secondary-600">{order.restaurant.phone}</p>
                    <p className="text-sm font-medium text-primary-600 mt-2">
                      {order.status === 'in_progress' ? `Picked up at ${order.pickedUpAt}` : `Ready at ${order.pickupTime}`}
                    </p>
                  </div>

                  {/* Delivery Info */}
                  <div className="bg-secondary-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-secondary-700 mb-2 flex items-center gap-1">
                      <span>📍</span> DELIVER TO
                    </p>
                    <p className="font-medium text-sm mb-1">{order.customer.name}</p>
                    <p className="text-xs text-secondary-600 mb-1">{order.customer.address}</p>
                    <p className="text-xs text-secondary-600">{order.customer.phone}</p>
                    <p className="text-sm font-medium text-blue-600 mt-2">
                      {order.distance} • {order.estimatedTime}
                    </p>
                  </div>
                </div>

                {/* Items */}
                <div className="mb-4 pb-3 border-b border-secondary-200">
                  <p className="text-xs font-semibold text-secondary-700 mb-2">Order Items:</p>
                  <ul className="space-y-1">
                    {order.items.map((item, index) => (
                      <li key={index} className="text-sm text-secondary-600">
                        {item.quantity}x {item.name}
                      </li>
                    ))}
                  </ul>
                  <p className="text-sm font-medium mt-2">Order Total: ${order.total.toFixed(2)}</p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 flex-wrap">
                  {order.status === 'assigned' && (
                    <>
                      <Button
                        variant="success"
                        size="sm"
                        onClick={() => handleAcceptOrder(order.id)}
                        className="flex-1"
                      >
                        Accept Delivery
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDeclineOrder(order.id)}
                      >
                        Decline
                      </Button>
                    </>
                  )}

                  {order.status === 'in_progress' && (
                    <Button
                      variant="primary"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleNavigateToDelivery(order.id)}
                    >
                      Continue Delivery →
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
