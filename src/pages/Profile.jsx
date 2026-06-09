import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useNotification } from '../context/NotificationContext';
import Card from '../components/Card';
import Button from '../components/Button';
import { Crown, Store, Bike, ArrowRight, X, Star, MapPin, Phone, Mail, Edit2, Save, Package, TrendingUp, Heart } from 'lucide-react';

export default function Profile() {
  const navigate = useNavigate();
  const { addToCart, clearCart } = useCart();
  const { showSuccess, showInfo } = useNotification();

  const [activeTab, setActiveTab] = useState('profile');

  const [user, setUser] = useState({
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+1 (555) 123-4567',
    address: '123 Main St, Apt 4B, New York, NY 10001',
    subscriptionPlan: 'premium',
    roles: {
      restaurantOwner: { status: 'approved', restaurantId: 1, restaurantName: 'My Restaurant' },
      rider: { status: 'approved' },
    },
    profileImage: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=400&fit=crop',
  });

  const [isEditing, setIsEditing] = useState(false);

  const [orderHistory] = useState([
    {
      id: '12345',
      restaurant: 'Pizza Palace',
      restaurantId: 1,
      items: [
        { id: 1, name: 'Margherita Pizza', quantity: 2, price: 12.99 },
        { id: 4, name: 'Caesar Salad', quantity: 1, price: 8.99 },
      ],
      total: 34.97,
      status: 'delivered',
      date: '2024-01-15T14:30:00Z',
    },
    {
      id: '12344',
      restaurant: 'Burger House',
      restaurantId: 2,
      items: [
        { id: 5, name: 'Classic Cheeseburger', quantity: 1, price: 10.99 },
        { id: 7, name: 'French Fries', quantity: 1, price: 4.99 },
      ],
      total: 19.25,
      status: 'delivered',
      date: '2024-01-14T12:15:00Z',
    },
  ]);

  const handleSave = () => {
    setIsEditing(false);
    showSuccess('Profile updated successfully!');
  };

  const handleCancelRole = (roleType) => {
    const roleName = roleType === 'restaurantOwner' ? 'Restaurant Owner' : 'Rider';
    const confirmed = window.confirm(
      `Are you sure you want to cancel your ${roleName} role? This action cannot be undone and you'll need to reapply if you change your mind.`
    );

    if (confirmed) {
      setUser(prev => ({
        ...prev,
        roles: {
          ...prev.roles,
          [roleType]: null
        }
      }));
      showSuccess(`${roleName} role cancelled successfully`);
    }
  };

  const getPlanName = (plan) => {
    const plans = { free: 'Basic', premium: 'Premium', business: 'Business Pro' };
    return plans[plan] || 'Basic';
  };

  const getPlanColor = (plan) => {
    const colors = {
      free: 'from-gray-400 to-gray-600',
      premium: 'from-orange-400 to-orange-600',
      business: 'from-purple-400 to-purple-600'
    };
    return colors[plan] || 'from-gray-400 to-gray-600';
  };

  const handleReorder = (order) => {
    const shouldClear = window.confirm(
      `This will clear your current cart and add items from ${order.restaurant}. Continue?`
    );
    if (!shouldClear) return;

    clearCart();
    const restaurant = { id: order.restaurantId, name: order.restaurant };
    order.items.forEach((item) => {
      addToCart(item, restaurant);
    });
    showSuccess(`Added ${order.items.length} items from your previous order to cart!`);
    setTimeout(() => navigate('/cart'), 1000);
  };

  const getStatusBadge = (status) => {
    const badges = {
      delivered: 'bg-green-100 text-green-700 border border-green-300',
      cancelled: 'bg-red-100 text-red-700 border border-red-300',
      refunded: 'bg-purple-100 text-purple-700 border border-purple-300',
    };
    return badges[status] || 'bg-blue-100 text-blue-700 border border-blue-300';
  };

  return (
    <div className="container-custom py-8">
      <h1 className="text-4xl font-heading font-bold mb-8">My Profile</h1>

      {/* Tabs */}
      <div className="flex space-x-1 mb-8 border-b border-secondary-200">
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-6 py-3 font-medium transition-colors ${
            activeTab === 'profile'
              ? 'border-b-2 border-primary-600 text-primary-600'
              : 'text-secondary-600 hover:text-primary-600'
          }`}
        >
          Profile
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-6 py-3 font-medium transition-colors ${
            activeTab === 'orders'
              ? 'border-b-2 border-primary-600 text-primary-600'
              : 'text-secondary-600 hover:text-primary-600'
          }`}
        >
          Order History
        </button>
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="space-y-8">
          {/* Profile Header Card */}
          <Card>
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <img
                  src={user.profileImage}
                  alt={user.name}
                  className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
                />
                <div className="absolute bottom-0 right-0 w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center border-4 border-white shadow-lg cursor-pointer hover:scale-110 transition-transform">
                  <Edit2 className="w-5 h-5 text-white" />
                </div>
              </div>

              {/* User Info */}
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-3xl font-bold mb-2">{user.name}</h2>
                <p className="text-secondary-600 mb-4">{user.email}</p>

                {/* Subscription Badge */}
                <div className={`inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r ${getPlanColor(user.subscriptionPlan)} rounded-full text-white font-semibold shadow-lg`}>
                  <Crown className="w-5 h-5" />
                  <span>{getPlanName(user.subscriptionPlan)} Member</span>
                  <Link to="/upgrade" className="ml-2 bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full text-xs transition-colors">
                    Upgrade
                  </Link>
                </div>
              </div>

              {/* Order Statistics */}
              <div className="flex gap-6 text-center">
                <div>
                  <p className="text-3xl font-bold text-primary-600">{orderHistory.length}</p>
                  <p className="text-xs text-secondary-600">Orders</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-primary-600">
                    ${orderHistory.reduce((sum, order) => sum + order.total, 0).toFixed(0)}
                  </p>
                  <p className="text-xs text-secondary-600">Spent</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-primary-600">8</p>
                  <p className="text-xs text-secondary-600">Favorites</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Quick Actions Grid */}
          <div>
            <h3 className="text-2xl font-bold mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button
                onClick={() => setActiveTab('orders')}
                className="bg-white rounded-2xl p-6 shadow-md hover:shadow-xl transition-all hover:scale-105 group border-2 border-transparent hover:border-primary-500"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center mb-3 mx-auto group-hover:scale-110 transition-transform">
                  <Package className="w-7 h-7 text-white" />
                </div>
                <p className="font-semibold text-gray-900 text-sm">Order History</p>
              </button>

              <Link to="/orders" className="bg-white rounded-2xl p-6 shadow-md hover:shadow-xl transition-all hover:scale-105 group border-2 border-transparent hover:border-primary-500">
                <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center mb-3 mx-auto group-hover:scale-110 transition-transform">
                  <TrendingUp className="w-7 h-7 text-white" />
                </div>
                <p className="font-semibold text-gray-900 text-sm">Track Orders</p>
              </Link>

              <Link to="/customer-service" className="bg-white rounded-2xl p-6 shadow-md hover:shadow-xl transition-all hover:scale-105 group border-2 border-transparent hover:border-primary-500">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl flex items-center justify-center mb-3 mx-auto group-hover:scale-110 transition-transform">
                  <Mail className="w-7 h-7 text-white" />
                </div>
                <p className="font-semibold text-gray-900 text-sm">Customer Service</p>
              </Link>

              <Link to="/upgrade" className="bg-white rounded-2xl p-6 shadow-md hover:shadow-xl transition-all hover:scale-105 group border-2 border-transparent hover:border-primary-500">
                <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl flex items-center justify-center mb-3 mx-auto group-hover:scale-110 transition-transform">
                  <Crown className="w-7 h-7 text-white" />
                </div>
                <p className="font-semibold text-gray-900 text-sm">Upgrade Account</p>
              </Link>

              <button className="bg-white rounded-2xl p-6 shadow-md hover:shadow-xl transition-all hover:scale-105 group border-2 border-transparent hover:border-primary-500">
                <div className="w-14 h-14 bg-gradient-to-br from-pink-400 to-pink-600 rounded-2xl flex items-center justify-center mb-3 mx-auto group-hover:scale-110 transition-transform">
                  <Heart className="w-7 h-7 text-white" />
                </div>
                <p className="font-semibold text-gray-900 text-sm">Favorites</p>
              </button>

              <button className="bg-white rounded-2xl p-6 shadow-md hover:shadow-xl transition-all hover:scale-105 group border-2 border-transparent hover:border-primary-500">
                <div className="w-14 h-14 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-2xl flex items-center justify-center mb-3 mx-auto group-hover:scale-110 transition-transform">
                  <Phone className="w-7 h-7 text-white" />
                </div>
                <p className="font-semibold text-gray-900 text-sm">Payments</p>
              </button>

              <Link to="/settings" className="bg-white rounded-2xl p-6 shadow-md hover:shadow-xl transition-all hover:scale-105 group border-2 border-transparent hover:border-primary-500">
                <div className="w-14 h-14 bg-gradient-to-br from-gray-400 to-gray-600 rounded-2xl flex items-center justify-center mb-3 mx-auto group-hover:scale-110 transition-transform">
                  <Edit2 className="w-7 h-7 text-white" />
                </div>
                <p className="font-semibold text-gray-900 text-sm">Settings</p>
              </Link>

              <button className="bg-white rounded-2xl p-6 shadow-md hover:shadow-xl transition-all hover:scale-105 group border-2 border-transparent hover:border-red-500">
                <div className="w-14 h-14 bg-gradient-to-br from-red-400 to-red-600 rounded-2xl flex items-center justify-center mb-3 mx-auto group-hover:scale-110 transition-transform">
                  <MapPin className="w-7 h-7 text-white" />
                </div>
                <p className="font-semibold text-red-600 text-sm">Logout</p>
              </button>
            </div>
          </div>

          {/* Roles & Dashboards */}
          {(user.roles.restaurantOwner || user.roles.rider) && (
            <div>
              <h3 className="text-2xl font-bold mb-4">My Dashboards</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {user.roles.restaurantOwner && (
                  <div className="relative bg-gradient-to-br from-orange-500 to-orange-600 rounded-3xl p-8 text-white shadow-xl overflow-hidden group hover:shadow-2xl transition-all">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12"></div>

                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                          <Store className="w-8 h-8 text-white" />
                        </div>
                        {user.roles.restaurantOwner.status === 'approved' && (
                          <button
                            onClick={() => handleCancelRole('restaurantOwner')}
                            className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
                            title="Cancel role"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        )}
                      </div>

                      <h4 className="text-2xl font-bold mb-2">Restaurant Owner</h4>
                      {user.roles.restaurantOwner.status === 'approved' && (
                        <>
                          <p className="text-white/90 mb-6">{user.roles.restaurantOwner.restaurantName}</p>
                          <Link to="/owner/dashboard">
                            <button className="w-full bg-white text-orange-600 font-semibold py-3 rounded-xl hover:bg-orange-50 transition-colors flex items-center justify-center gap-2 group">
                              Open Dashboard
                              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </button>
                          </Link>
                        </>
                      )}
                      {user.roles.restaurantOwner.status === 'pending' && (
                        <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 mt-4">
                          <p className="text-sm">⏳ Application under review. We'll notify you within 2-5 business days.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {user.roles.rider && (
                  <div className="relative bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl p-8 text-white shadow-xl overflow-hidden group hover:shadow-2xl transition-all">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12"></div>

                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                          <Bike className="w-8 h-8 text-white" />
                        </div>
                        {user.roles.rider.status === 'approved' && (
                          <button
                            onClick={() => handleCancelRole('rider')}
                            className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
                            title="Cancel role"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        )}
                      </div>

                      <h4 className="text-2xl font-bold mb-2">Rider</h4>
                      {user.roles.rider.status === 'approved' && (
                        <>
                          <p className="text-white/90 mb-6">Delivery Partner</p>
                          <Link to="/rider/dashboard">
                            <button className="w-full bg-white text-blue-600 font-semibold py-3 rounded-xl hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 group">
                              Open Dashboard
                              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </button>
                          </Link>
                        </>
                      )}
                      {user.roles.rider.status === 'pending' && (
                        <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 mt-4">
                          <p className="text-sm">⏳ Application under review. We'll notify you within 2-5 business days.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Personal Information */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Personal Information */}
            <Card>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-semibold">Personal Information</h3>
                {!isEditing ? (
                  <Button variant="outline" onClick={() => setIsEditing(true)}>
                    Edit Profile
                  </Button>
                ) : (
                  <div className="space-x-2">
                    <Button variant="outline" onClick={() => setIsEditing(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleSave}>Save</Button>
                  </div>
                )}
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={user.name}
                    onChange={(e) => setUser({ ...user, name: e.target.value })}
                    disabled={!isEditing}
                    className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-secondary-100 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={user.email}
                    onChange={(e) => setUser({ ...user, email: e.target.value })}
                    disabled={!isEditing}
                    className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-secondary-100 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={user.phone}
                    onChange={(e) => setUser({ ...user, phone: e.target.value })}
                    disabled={!isEditing}
                    className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-secondary-100 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Delivery Address
                  </label>
                  <textarea
                    value={user.address}
                    onChange={(e) => setUser({ ...user, address: e.target.value })}
                    disabled={!isEditing}
                    rows={3}
                    className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-secondary-100 disabled:cursor-not-allowed"
                  />
                </div>
              </div>
            </Card>

            {/* Order Statistics */}
            <Card>
              <h3 className="text-xl font-semibold mb-4">Order Statistics</h3>
              <div className="grid grid-cols-3 gap-6 text-center">
                <div>
                  <p className="text-3xl font-bold text-primary-600">{orderHistory.length}</p>
                  <p className="text-secondary-600 text-sm">Total Orders</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-primary-600">
                    ${orderHistory.reduce((sum, order) => sum + order.total, 0).toFixed(2)}
                  </p>
                  <p className="text-secondary-600 text-sm">Total Spent</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-primary-600">8</p>
                  <p className="text-secondary-600 text-sm">Favorites</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Order History Tab */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          {orderHistory.length === 0 ? (
            <Card>
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📦</div>
                <h3 className="text-2xl font-semibold mb-2">No orders yet</h3>
                <p className="text-secondary-600 mb-6">Start ordering to see your history here</p>
                <Link to="/restaurants">
                  <Button size="lg">Browse Restaurants</Button>
                </Link>
              </div>
            </Card>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <p className="text-secondary-600">
                  Showing {orderHistory.length} order{orderHistory.length !== 1 ? 's' : ''}
                </p>
              </div>

              {orderHistory.map((order) => (
                <Card key={order.id}>
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-4 pb-4 border-b border-secondary-200">
                    <div className="flex-1 mb-4 md:mb-0">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-xl font-semibold">Order #{order.id}</h3>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(
                            order.status
                          )}`}
                        >
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </div>
                      <p className="text-secondary-600 mb-1">{order.restaurant}</p>
                      <p className="text-sm text-secondary-500">
                        {new Date(order.date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary-600">
                        ${order.total.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <h4 className="font-semibold mb-2">Items:</h4>
                    <ul className="space-y-1">
                      {order.items.map((item, idx) => (
                        <li key={idx} className="text-secondary-700 flex justify-between">
                          <span>
                            {item.quantity}x {item.name}
                          </span>
                          <span className="font-medium">
                            ${(item.price * item.quantity).toFixed(2)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Button variant="primary" onClick={() => handleReorder(order)}>
                      🔁 Reorder
                    </Button>
                    <Link to={`/restaurant/${order.restaurantId}`}>
                      <Button variant="outline">View Restaurant</Button>
                    </Link>
                    <Button variant="outline">⭐ Rate & Review</Button>
                    <Button variant="outline">📄 View Receipt</Button>
                  </div>
                </Card>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
