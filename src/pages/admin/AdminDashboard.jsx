import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAdmin } from '../../context/AdminContext';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { restaurants, riders } from '../../data/mockData';
import {
  Users,
  Store,
  Bike,
  Package,
  DollarSign,
  Activity,
  AlertTriangle,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  PieChart,
  Star,
  MapPin,
  Phone,
  Mail,
  Truck
} from 'lucide-react';

export default function AdminDashboard() {
  const { admin } = useAdmin();

  const statsData = {
    today: {
      totalUsers: 1247,
      totalRestaurants: 156,
      totalRiders: 89,
      totalOrders: 5634,
      activeOrders: 42,
      todayRevenue: 12847.50,
      pendingRefunds: 8,
      flaggedIssues: 3,
    },
    week: {
      totalUsers: 1247,
      totalRestaurants: 156,
      totalRiders: 89,
      totalOrders: 42389,
      activeOrders: 42,
      todayRevenue: 95230.80,
      pendingRefunds: 15,
      flaggedIssues: 8,
    },
    month: {
      totalUsers: 1247,
      totalRestaurants: 156,
      totalRiders: 89,
      totalOrders: 178456,
      activeOrders: 42,
      todayRevenue: 387650.30,
      pendingRefunds: 32,
      flaggedIssues: 12,
    }
  };

  const [timeRange, setTimeRange] = useState('today');
  const [stats, setStats] = useState(statsData.today);

  const handleTimeRangeChange = (range) => {
    setTimeRange(range);
    setStats(statsData[range]);
  };

  const [recentActivity, setRecentActivity] = useState([
    {
      id: 1,
      type: 'order',
      message: 'New order #12345 placed',
      user: 'John Doe',
      time: '2 min ago',
      status: 'info',
    },
    {
      id: 2,
      type: 'issue',
      message: 'Customer reported missing item',
      user: 'Jane Smith',
      time: '15 min ago',
      status: 'warning',
    },
    {
      id: 3,
      type: 'restaurant',
      message: 'New restaurant registered',
      user: 'Burger Palace',
      time: '1 hour ago',
      status: 'success',
    },
    {
      id: 4,
      type: 'refund',
      message: 'Refund requested for order #12333',
      user: 'Mike Johnson',
      time: '2 hours ago',
      status: 'warning',
    },
    {
      id: 5,
      type: 'rider',
      message: 'Rider completed 50 deliveries',
      user: 'Sarah Wilson',
      time: '3 hours ago',
      status: 'success',
    },
  ]);

  const [flaggedIssues, setFlaggedIssues] = useState([
    {
      id: 1,
      type: 'payment',
      title: 'Payment dispute',
      description: 'Customer claims double charge',
      orderId: '12340',
      priority: 'high',
      time: '30 min ago',
    },
    {
      id: 2,
      type: 'quality',
      title: 'Food quality complaint',
      description: 'Multiple complaints about restaurant hygiene',
      restaurantId: '5',
      priority: 'high',
      time: '2 hours ago',
    },
    {
      id: 3,
      type: 'behavior',
      title: 'Rider misconduct',
      description: 'Customer reported unprofessional behavior',
      riderId: '23',
      priority: 'medium',
      time: '5 hours ago',
    },
  ]);

  const getStatusColor = (status) => {
    const colors = {
      info: 'bg-blue-100 text-blue-800 border-blue-200',
      success: 'bg-green-100 text-green-800 border-green-200',
      warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      error: 'bg-red-100 text-red-800 border-red-200',
    };
    return colors[status] || colors.info;
  };

  const getPriorityColor = (priority) => {
    const colors = {
      high: 'bg-red-100 text-red-800 border-red-300',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      low: 'bg-green-100 text-green-800 border-green-300',
    };
    return colors[priority] || colors.medium;
  };

  return (
    <div className="py-8 space-y-8">
      {/* Header with Analytics Overview */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-heading font-bold mb-2 text-slate-800">
            Platform Dashboard
          </h1>
          <p className="text-slate-600 flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            Welcome back, {admin?.name}!
          </p>
        </div>

        {/* Time Range Selector */}
        <div className="flex gap-2 bg-white rounded-lg p-1 shadow-sm border border-slate-200">
          <button
            onClick={() => handleTimeRangeChange('today')}
            className={`px-5 py-2.5 rounded-md font-medium transition-all duration-200 ${
              timeRange === 'today'
                ? 'bg-slate-800 text-white'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => handleTimeRangeChange('week')}
            className={`px-5 py-2.5 rounded-md font-medium transition-all duration-200 ${
              timeRange === 'week'
                ? 'bg-slate-800 text-white'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            This Week
          </button>
          <button
            onClick={() => handleTimeRangeChange('month')}
            className={`px-5 py-2.5 rounded-md font-medium transition-all duration-200 ${
              timeRange === 'month'
                ? 'bg-slate-800 text-white'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            This Month
          </button>
        </div>
      </div>

      {/* Platform Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <Link to="/admin/users" className="group">
          <Card className="bg-white border border-slate-200 hover:border-slate-300 hover:shadow-lg transition-all duration-200 cursor-pointer">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-slate-100 rounded-lg group-hover:bg-slate-800 transition-colors duration-200">
                <Users className="w-6 h-6 text-slate-600 group-hover:text-white transition-colors duration-200" />
              </div>
              <div className="flex items-center gap-1 text-green-600 text-xs font-semibold">
                <ArrowUpRight className="w-3 h-3" />
                12%
              </div>
            </div>
            <p className="text-sm font-medium text-slate-600 mb-1">Total Users</p>
            <p className="text-3xl font-bold text-slate-900">{stats.totalUsers.toLocaleString()}</p>
          </Card>
        </Link>

        <Link to="/admin/restaurants" className="group">
          <Card className="bg-white border border-slate-200 hover:border-slate-300 hover:shadow-lg transition-all duration-200 cursor-pointer">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-slate-100 rounded-lg group-hover:bg-slate-800 transition-colors duration-200">
                <Store className="w-6 h-6 text-slate-600 group-hover:text-white transition-colors duration-200" />
              </div>
              <div className="flex items-center gap-1 text-green-600 text-xs font-semibold">
                <ArrowUpRight className="w-3 h-3" />
                8%
              </div>
            </div>
            <p className="text-sm font-medium text-slate-600 mb-1">Restaurants</p>
            <p className="text-3xl font-bold text-slate-900">{stats.totalRestaurants}</p>
          </Card>
        </Link>

        <Link to="/admin/riders" className="group">
          <Card className="bg-white border border-slate-200 hover:border-slate-300 hover:shadow-lg transition-all duration-200 cursor-pointer">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-slate-100 rounded-lg group-hover:bg-slate-800 transition-colors duration-200">
                <Bike className="w-6 h-6 text-slate-600 group-hover:text-white transition-colors duration-200" />
              </div>
              <div className="flex items-center gap-1 text-green-600 text-xs font-semibold">
                <ArrowUpRight className="w-3 h-3" />
                5%
              </div>
            </div>
            <p className="text-sm font-medium text-slate-600 mb-1">Active Riders</p>
            <p className="text-3xl font-bold text-slate-900">{stats.totalRiders}</p>
          </Card>
        </Link>

        <Card className="bg-white border border-slate-200 hover:border-slate-300 hover:shadow-lg transition-all duration-200">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-slate-100 rounded-lg hover:bg-slate-800 transition-colors duration-200 group">
              <Package className="w-6 h-6 text-slate-600 group-hover:text-white transition-colors duration-200" />
            </div>
            <div className="flex items-center gap-1 text-green-600 text-xs font-semibold">
              <ArrowUpRight className="w-3 h-3" />
              18%
            </div>
          </div>
          <p className="text-sm font-medium text-slate-600 mb-1">Total Orders</p>
          <p className="text-3xl font-bold text-slate-900">{stats.totalOrders.toLocaleString()}</p>
        </Card>
      </div>

      {/* Revenue & Active Orders */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card className="bg-white border border-slate-200">
          <div className="flex items-start justify-between mb-3">
            <div className="p-2.5 bg-slate-100 rounded-lg">
              <DollarSign className="w-5 h-5 text-slate-700" />
            </div>
            <div className="flex items-center gap-1 bg-green-50 px-2 py-1 rounded-full text-xs font-semibold text-green-700">
              <TrendingUp className="w-3 h-3" />
              22%
            </div>
          </div>
          <p className="text-sm text-slate-600 mb-1">Revenue</p>
          <p className="text-3xl font-bold text-slate-900">${stats.todayRevenue.toLocaleString()}</p>
        </Card>

        <Card className="bg-white border border-slate-200">
          <div className="flex items-start justify-between mb-3">
            <div className="p-2.5 bg-slate-100 rounded-lg">
              <Activity className="w-5 h-5 text-slate-700" />
            </div>
            <div className="flex items-center gap-2 bg-green-50 px-2 py-1 rounded-full text-xs font-semibold text-green-700">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
              Live
            </div>
          </div>
          <p className="text-sm text-slate-600 mb-1">Active Orders</p>
          <p className="text-3xl font-bold text-slate-900">{stats.activeOrders}</p>
        </Card>

        <Link to="/admin/issues" className="group">
          <Card className="bg-white border border-slate-200 hover:border-red-300 hover:shadow-lg transition-all duration-200 cursor-pointer">
            <div className="flex items-start justify-between mb-3">
              <div className="p-2.5 bg-red-50 rounded-lg group-hover:bg-red-100 transition-colors">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div className="flex items-center gap-1 bg-red-50 px-2 py-1 rounded-full text-xs font-semibold text-red-700">
                Needs Action
              </div>
            </div>
            <p className="text-sm text-slate-600 mb-1">Flagged Issues</p>
            <p className="text-3xl font-bold text-slate-900">{stats.flaggedIssues}</p>
          </Card>
        </Link>
      </div>

      {/* Flagged Issues */}
      <Card className="bg-white border border-slate-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-900">Flagged Issues</h2>
          <Link to="/admin/issues">
            <Button variant="outline" size="sm" className="flex items-center gap-2 text-slate-600 hover:text-slate-900">
              View All
              <ArrowUpRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        <div className="space-y-3">
          {flaggedIssues.map((issue) => (
            <div key={issue.id} className="group border border-slate-200 rounded-lg p-4 hover:border-slate-300 hover:shadow-sm transition-all duration-200">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${getPriorityColor(issue.priority)}`}>
                      {issue.priority.toUpperCase()}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      <Clock className="w-3 h-3" />
                      {issue.time}
                    </div>
                  </div>
                  <h3 className="font-semibold text-base mb-1 text-slate-900">{issue.title}</h3>
                  <p className="text-sm text-slate-600 mb-2">{issue.description}</p>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    {issue.orderId && (
                      <div className="flex items-center gap-1">
                        <Package className="w-3 h-3" />
                        Order #{issue.orderId}
                      </div>
                    )}
                    {issue.restaurantId && (
                      <div className="flex items-center gap-1">
                        <Store className="w-3 h-3" />
                        Restaurant #{issue.restaurantId}
                      </div>
                    )}
                    {issue.riderId && (
                      <div className="flex items-center gap-1">
                        <Bike className="w-3 h-3" />
                        Rider #{issue.riderId}
                      </div>
                    )}
                  </div>
                </div>
                <Button variant="primary" size="sm" className="shrink-0 bg-slate-800 hover:bg-slate-900">
                  Review
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Recent Activity */}
      <Card className="bg-white border border-slate-200">
        <h2 className="text-xl font-bold text-slate-900 mb-6">Recent Activity</h2>

        <div className="space-y-3">
          {recentActivity.map((activity, index) => (
            <div key={activity.id} className="relative pl-8 pb-4 last:pb-0">
              {/* Timeline line */}
              {index !== recentActivity.length - 1 && (
                <div className="absolute left-3 top-6 bottom-0 w-0.5 bg-secondary-200"></div>
              )}

              {/* Timeline dot */}
              <div className={`absolute left-0 top-1.5 w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                activity.status === 'success' ? 'bg-green-100 border-green-400' :
                activity.status === 'warning' ? 'bg-yellow-100 border-yellow-400' :
                activity.status === 'error' ? 'bg-red-100 border-red-400' :
                'bg-blue-100 border-blue-400'
              }`}>
                {activity.status === 'success' ? <CheckCircle className="w-3 h-3 text-green-600" /> :
                 activity.status === 'warning' ? <AlertTriangle className="w-3 h-3 text-yellow-600" /> :
                 activity.status === 'error' ? <XCircle className="w-3 h-3 text-red-600" /> :
                 <Activity className="w-3 h-3 text-blue-600" />}
              </div>

              <div className="bg-slate-50 rounded-lg p-3.5 hover:bg-slate-100 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {activity.time}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-slate-900 mb-0.5">{activity.message}</p>
                    <p className="text-xs text-slate-600">{activity.user}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Quick Actions */}
      <Card className="bg-white border border-slate-200">
        <h2 className="text-xl font-bold text-slate-900 mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link to="/admin/users" className="group">
            <div className="p-4 border border-slate-200 rounded-lg hover:border-slate-300 hover:shadow-md transition-all duration-200 cursor-pointer">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-slate-800 transition-colors duration-200">
                  <Users className="w-5 h-5 text-slate-600 group-hover:text-white transition-colors duration-200" />
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-400" />
              </div>
              <p className="font-semibold text-slate-900">Manage Users</p>
              <p className="text-xs text-slate-500 mt-1">View and manage all users</p>
            </div>
          </Link>
          <Link to="/admin/restaurants" className="group">
            <div className="p-4 border border-slate-200 rounded-lg hover:border-slate-300 hover:shadow-md transition-all duration-200 cursor-pointer">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-slate-800 transition-colors duration-200">
                  <Store className="w-5 h-5 text-slate-600 group-hover:text-white transition-colors duration-200" />
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-400" />
              </div>
              <p className="font-semibold text-slate-900">Manage Restaurants</p>
              <p className="text-xs text-slate-500 mt-1">View restaurant partners</p>
            </div>
          </Link>
          <Link to="/admin/riders" className="group">
            <div className="p-4 border border-slate-200 rounded-lg hover:border-slate-300 hover:shadow-md transition-all duration-200 cursor-pointer">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-slate-800 transition-colors duration-200">
                  <Bike className="w-5 h-5 text-slate-600 group-hover:text-white transition-colors duration-200" />
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-400" />
              </div>
              <p className="font-semibold text-slate-900">Manage Riders</p>
              <p className="text-xs text-slate-500 mt-1">View delivery riders</p>
            </div>
          </Link>
          <Link to="/admin/promos" className="group">
            <div className="p-4 border border-slate-200 rounded-lg hover:border-slate-300 hover:shadow-md transition-all duration-200 cursor-pointer">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-slate-800 transition-colors duration-200">
                  <PieChart className="w-5 h-5 text-slate-600 group-hover:text-white transition-colors duration-200" />
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-400" />
              </div>
              <p className="font-semibold text-slate-900">Create Promo</p>
              <p className="text-xs text-slate-500 mt-1">Add new promotional offers</p>
            </div>
          </Link>
        </div>
      </Card>

      {/* Top Restaurants */}
      <Card className="bg-white border border-slate-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-900">Top Restaurants</h2>
          <Link to="/admin/restaurants">
            <Button variant="outline" size="sm" className="flex items-center gap-2 text-slate-600 hover:text-slate-900">
              View All
              <ArrowUpRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {restaurants.slice(0, 6).map((restaurant) => (
            <div
              key={restaurant.id}
              className="group border border-slate-200 rounded-lg overflow-hidden hover:border-slate-300 hover:shadow-md transition-all duration-200"
            >
              <div className="relative h-40 overflow-hidden bg-secondary-100">
                <img
                  src={restaurant.image}
                  alt={restaurant.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-semibold ${
                  restaurant.isOpen
                    ? 'bg-green-500 text-white'
                    : 'bg-red-500 text-white'
                }`}>
                  {restaurant.isOpen ? 'Open' : 'Closed'}
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-bold text-base mb-2 text-slate-900">
                  {restaurant.name}
                </h3>
                <p className="text-sm text-slate-600 mb-3 line-clamp-1">{restaurant.description}</p>

                <div className="flex items-center gap-4 mb-3">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <span className="text-sm font-semibold text-slate-900">{restaurant.rating}</span>
                    <span className="text-xs text-slate-500">({restaurant.reviews})</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-slate-600">
                    <Clock className="w-3 h-3" />
                    {restaurant.deliveryTime} min
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {restaurant.cuisines.map((cuisine, index) => (
                    <span key={index} className="px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded-full">
                      {cuisine}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Active Riders */}
      <Card className="bg-white border border-slate-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-900">Active Riders</h2>
          <Link to="/admin/riders">
            <Button variant="outline" size="sm" className="flex items-center gap-2 text-slate-600 hover:text-slate-900">
              View All
              <ArrowUpRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {riders.filter(r => r.status === 'active').slice(0, 4).map((rider) => (
            <div
              key={rider.id}
              className="group border border-slate-200 rounded-lg p-4 hover:border-slate-300 hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {rider.name.charAt(0)}
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${
                  rider.status === 'active' ? 'bg-green-100 text-green-700' :
                  rider.status === 'busy' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${
                    rider.status === 'active' ? 'bg-green-500 animate-pulse' :
                    rider.status === 'busy' ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`}></div>
                  {rider.status}
                </div>
              </div>

              <h3 className="font-bold text-base mb-1 text-slate-900">{rider.name}</h3>
              <p className="text-xs text-slate-600 mb-3 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {rider.zone}
              </p>

              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  <span className="text-sm font-semibold text-slate-900">{rider.rating}</span>
                </div>
                <span className="text-xs text-slate-400">•</span>
                <span className="text-xs text-slate-600">{rider.totalDeliveries} deliveries</span>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                <div className="text-center">
                  <p className="text-xs text-slate-500 mb-1">Today</p>
                  <p className="text-lg font-bold text-slate-900">{rider.completedToday}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-slate-500 mb-1">Vehicle</p>
                  <div className="flex items-center gap-1">
                    {rider.vehicleType === 'motorcycle' ? <Bike className="w-4 h-4 text-slate-700" /> :
                     rider.vehicleType === 'bicycle' ? <Bike className="w-4 h-4 text-slate-700" /> :
                     <Truck className="w-4 h-4 text-slate-700" />}
                    <p className="text-xs font-medium text-slate-700 capitalize">{rider.vehicleType}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
