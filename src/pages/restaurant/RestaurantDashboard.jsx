import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useRestaurant } from '../../context/RestaurantContext';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { Package, DollarSign, Clock, ChefHat, TrendingUp, TrendingDown, ArrowRight, Calendar } from 'lucide-react';

export default function RestaurantDashboard() {
  const { restaurant } = useRestaurant();
  const [stats, setStats] = useState({
    todayOrders: 24,
    todaySales: 487.50,
    pendingOrders: 3,
    inProgressOrders: 5,
    todayProfit: 350.00,
  });

  const [recentOrders, setRecentOrders] = useState([
    {
      id: '12345',
      customerName: 'John Doe',
      items: [
        { name: 'Margherita Pizza', quantity: 2 },
        { name: 'Caesar Salad', quantity: 1 },
      ],
      total: 40.76,
      status: 'pending',
      time: '2 min ago',
      date: '04 Aug 2024',
      estimatedReady: '20 min',
    },
    {
      id: '12344',
      customerName: 'Jane Smith',
      items: [
        { name: 'Pepperoni Pizza', quantity: 1 },
        { name: 'Spaghetti Carbonara', quantity: 1 },
      ],
      total: 28.98,
      status: 'preparing',
      time: '5 min ago',
      date: '04 Aug 2024',
      estimatedReady: '15 min',
    },
    {
      id: '12343',
      customerName: 'Mike Johnson',
      items: [
        { name: 'Margherita Pizza', quantity: 3 },
      ],
      total: 38.97,
      status: 'ready',
      time: '10 min ago',
      date: '04 Aug 2024',
    },
    {
      id: '12342',
      customerName: 'Sarah Wilson',
      items: [
        { name: 'Caesar Salad', quantity: 2 },
      ],
      total: 16.70,
      status: 'completed',
      time: '15 min ago',
      date: '04 Aug 2024',
    },
  ]);

  const [filter, setFilter] = useState('all');

  const getFilteredOrders = () => {
    if (filter === 'all') return recentOrders;
    return recentOrders.filter(order => order.status === filter);
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      preparing: 'bg-blue-50 text-blue-700 border-blue-200',
      ready: 'bg-orange-50 text-orange-700 border-orange-200',
      completed: 'bg-green-50 text-green-700 border-green-200',
    };
    return badges[status] || badges.pending;
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Available Cash */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm text-gray-600 mb-2">Available Cash</p>
              <p className="text-3xl font-bold text-gray-900">₱{stats.todaySales.toFixed(2)}</p>
            </div>
            <div className="p-3 bg-gradient-to-br from-orange-100 to-rose-100 rounded-xl">
              <DollarSign className="w-6 h-6 text-rose-600" />
            </div>
          </div>
          <div className="flex items-center gap-1 text-sm">
            <TrendingUp className="w-4 h-4 text-green-600" />
            <span className="text-green-600 font-medium">+10% Growth</span>
          </div>
        </div>

        {/* Total Order */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm text-gray-600 mb-2">Total Order</p>
              <p className="text-3xl font-bold text-gray-900">{stats.todayOrders}</p>
            </div>
            <div className="p-3 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-xl">
              <Package className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="flex items-center gap-1 text-sm">
            <TrendingUp className="w-4 h-4 text-green-600" />
            <span className="text-green-600 font-medium">+8% Growth</span>
          </div>
        </div>

        {/* Total Sales */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm text-gray-600 mb-2">Total Sales</p>
              <p className="text-3xl font-bold text-gray-900">₱{(stats.todaySales * 5.5).toFixed(0)}</p>
            </div>
            <div className="p-3 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-xl">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="flex items-center gap-1 text-sm">
            <TrendingUp className="w-4 h-4 text-green-600" />
            <span className="text-green-600 font-medium">+10% Growth</span>
          </div>
        </div>

        {/* Total Profit */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm text-gray-600 mb-2">Total Profit</p>
              <p className="text-3xl font-bold text-gray-900">₱{stats.todayProfit.toFixed(2)}</p>
            </div>
            <div className="p-3 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl">
              <ChefHat className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="flex items-center gap-1 text-sm">
            <TrendingUp className="w-4 h-4 text-green-600" />
            <span className="text-green-600 font-medium">+68% Increase</span>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders - Takes 2 columns */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Recent Order</h2>
              <Link to="/owner/orders" className="flex items-center gap-2 text-rose-600 hover:text-rose-700 font-medium text-sm">
                <span>See All</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Orders List */}
            <div className="space-y-3">
              {recentOrders.slice(0, 3).map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-orange-50 transition-colors border border-transparent hover:border-orange-100"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 bg-gradient-to-br from-rose-400 to-orange-500 rounded-xl flex items-center justify-center text-white font-bold shadow-sm">
                      {order.items[0].name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{order.items[0].name}</h3>
                      <p className="text-sm text-gray-600">₱{order.total.toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="text-right mr-4">
                    <p className="text-sm text-gray-600">{order.date}</p>
                    <span className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadge(order.status)}`}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* View All Orders Button */}
            <Link to="/owner/orders" className="block mt-4">
              <Button className="w-full bg-gradient-to-r from-rose-400 to-orange-500 hover:from-rose-500 hover:to-orange-600 text-white font-medium py-3 rounded-xl shadow-sm">
                View All Orders
              </Button>
            </Link>
          </div>
        </div>

        {/* Quick Stats - Takes 1 column */}
        <div className="space-y-6">
          {/* Performance Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">Performance</h3>
              <button className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                </svg>
              </button>
            </div>
            <div className="text-center py-6">
              <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br from-orange-100 to-rose-100 mb-4">
                <div className="text-4xl font-bold text-rose-600">{stats.pendingOrders}</div>
              </div>
              <p className="text-gray-600 text-sm">Pending Orders</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-bold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Link to="/owner/menu">
                <Button className="w-full bg-gray-100 hover:bg-orange-50 text-gray-700 hover:text-rose-600 font-medium py-3 rounded-xl transition-colors border border-gray-200 hover:border-orange-200">
                  Manage Menu
                </Button>
              </Link>
              <Link to="/owner/reports">
                <Button className="w-full bg-gray-100 hover:bg-orange-50 text-gray-700 hover:text-rose-600 font-medium py-3 rounded-xl transition-colors border border-gray-200 hover:border-orange-200">
                  View Reports
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
