import { useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { DollarSign, Package, TrendingUp, FileText, Download } from 'lucide-react';

export default function RestaurantReports() {
  const { restaurant } = useRestaurant();

  const [timeRange, setTimeRange] = useState('week');

  // Mock sales data
  const salesData = {
    week: [
      { day: 'Mon', sales: 245.50, orders: 12 },
      { day: 'Tue', sales: 389.25, orders: 18 },
      { day: 'Wed', sales: 467.80, orders: 22 },
      { day: 'Thu', sales: 523.45, orders: 25 },
      { day: 'Fri', sales: 678.90, orders: 32 },
      { day: 'Sat', sales: 892.35, orders: 41 },
      { day: 'Sun', sales: 734.25, orders: 35 },
    ],
    month: [
      { day: 'Week 1', sales: 1245.50, orders: 58 },
      { day: 'Week 2', sales: 1589.25, orders: 72 },
      { day: 'Week 3', sales: 1867.80, orders: 85 },
      { day: 'Week 4', sales: 2023.45, orders: 95 },
    ],
    year: [
      { day: 'Jan', sales: 4523.45, orders: 215 },
      { day: 'Feb', sales: 5234.80, orders: 245 },
      { day: 'Mar', sales: 5678.90, orders: 268 },
      { day: 'Apr', sales: 6123.35, orders: 285 },
      { day: 'May', sales: 6789.25, orders: 312 },
      { day: 'Jun', sales: 7234.50, orders: 335 },
      { day: 'Jul', sales: 7892.35, orders: 365 },
      { day: 'Aug', sales: 8145.80, orders: 378 },
      { day: 'Sep', sales: 7523.45, orders: 348 },
      { day: 'Oct', sales: 7890.25, orders: 362 },
      { day: 'Nov', sales: 8234.50, orders: 385 },
      { day: 'Dec', sales: 9123.35, orders: 425 },
    ],
  };

  // Mock top items data
  const topItems = [
    { name: 'Margherita Pizza', orders: 156, revenue: 2026.44, percentage: 18 },
    { name: 'Pepperoni Pizza', orders: 134, revenue: 2008.66, percentage: 15 },
    { name: 'Spaghetti Carbonara', orders: 98, revenue: 1370.02, percentage: 11 },
    { name: 'Caesar Salad', orders: 87, revenue: 782.13, percentage: 10 },
    { name: 'Chicken Parmigiana', orders: 76, revenue: 1293.24, percentage: 8 },
  ];

  // Mock customer stats
  const customerStats = [
    { metric: 'Total Customers', value: 247, change: '+12%' },
    { metric: 'New Customers', value: 45, change: '+8%' },
    { metric: 'Returning Customers', value: 202, change: '+15%' },
    { metric: 'Average Order Value', value: '₱32.45', change: '+5%' },
  ];

  const currentData = salesData[timeRange];
  const maxSales = Math.max(...currentData.map(d => d.sales));

  const totalSales = currentData.reduce((sum, d) => sum + d.sales, 0);
  const totalOrders = currentData.reduce((sum, d) => sum + d.orders, 0);
  const avgOrderValue = totalSales / totalOrders;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-2 text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600">Track your restaurant's performance</p>
        </div>

        {/* Time Range Selector */}
        <div className="flex gap-2">
          <button
            onClick={() => setTimeRange('week')}
            className={`px-4 py-2.5 rounded-xl font-medium transition-colors ${
              timeRange === 'week'
                ? 'bg-gradient-to-r from-rose-400 to-orange-500 text-white shadow-md'
                : 'bg-gray-50 text-gray-700 hover:bg-orange-50 hover:text-rose-600'
            }`}
          >
            This Week
          </button>
          <button
            onClick={() => setTimeRange('month')}
            className={`px-4 py-2.5 rounded-xl font-medium transition-colors ${
              timeRange === 'month'
                ? 'bg-gradient-to-r from-rose-400 to-orange-500 text-white shadow-md'
                : 'bg-gray-50 text-gray-700 hover:bg-orange-50 hover:text-rose-600'
            }`}
          >
            This Month
          </button>
          <button
            onClick={() => setTimeRange('year')}
            className={`px-4 py-2.5 rounded-xl font-medium transition-colors ${
              timeRange === 'year'
                ? 'bg-gradient-to-r from-rose-400 to-orange-500 text-white shadow-md'
                : 'bg-gray-50 text-gray-700 hover:bg-orange-50 hover:text-rose-600'
            }`}
          >
            This Year
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card className="bg-white border border-gray-100 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-2">Total Sales</p>
              <p className="text-3xl font-bold text-gray-900">₱{totalSales.toFixed(2)}</p>
            </div>
            <div className="p-3 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="bg-white border border-gray-100 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-2">Total Orders</p>
              <p className="text-3xl font-bold text-gray-900">{totalOrders}</p>
            </div>
            <div className="p-3 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="bg-white border border-gray-100 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-2">Avg Order Value</p>
              <p className="text-3xl font-bold text-gray-900">₱{avgOrderValue.toFixed(2)}</p>
            </div>
            <div className="p-3 bg-gradient-to-br from-orange-100 to-rose-100 rounded-xl">
              <TrendingUp className="w-6 h-6 text-rose-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Sales Chart */}
      <Card className="border border-gray-100 rounded-2xl shadow-sm">
        <h2 className="text-xl font-bold mb-6 text-gray-900">Sales Overview</h2>

        <div className="space-y-4">
          {currentData.map((item, index) => (
            <div key={index}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-gray-900">{item.day}</span>
                <div className="text-right">
                  <span className="text-sm font-bold bg-gradient-to-r from-rose-500 to-orange-500 bg-clip-text text-transparent">₱{item.sales.toFixed(2)}</span>
                  <span className="text-xs text-gray-500 ml-2">({item.orders} orders)</span>
                </div>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-rose-400 to-orange-500 h-3 rounded-full transition-all duration-500 shadow-sm"
                  style={{ width: `${(item.sales / maxSales) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Top Items */}
      <Card className="border border-gray-100 rounded-2xl shadow-sm">
        <h2 className="text-xl font-bold mb-6 text-gray-900">Top Selling Items</h2>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Rank</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Item Name</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">Orders</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">Revenue</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">Share</th>
              </tr>
            </thead>
            <tbody>
              {topItems.map((item, index) => (
                <tr key={index} className="border-b border-gray-100 hover:bg-orange-50 transition-colors">
                  <td className="py-4 px-4">
                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${
                      index === 0 ? 'bg-gradient-to-br from-yellow-100 to-amber-100 text-yellow-700 border border-yellow-200' :
                      index === 1 ? 'bg-gradient-to-br from-gray-100 to-gray-200 text-gray-700 border border-gray-300' :
                      index === 2 ? 'bg-gradient-to-br from-orange-100 to-rose-100 text-orange-700 border border-orange-200' :
                      'bg-gray-50 text-gray-600 border border-gray-200'
                    }`}>
                      {index + 1}
                    </span>
                  </td>
                  <td className="py-4 px-4 font-medium text-gray-900">{item.name}</td>
                  <td className="py-4 px-4 text-right text-gray-700">{item.orders}</td>
                  <td className="py-4 px-4 text-right font-bold bg-gradient-to-r from-rose-500 to-orange-500 bg-clip-text text-transparent">
                    ₱{item.revenue.toFixed(2)}
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-16 bg-gray-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-rose-400 to-orange-500 h-2 rounded-full"
                          style={{ width: `${item.percentage * 5}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600 w-10">{item.percentage}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Customer Statistics */}
      <Card className="border border-gray-100 rounded-2xl shadow-sm">
        <h2 className="text-xl font-bold mb-6 text-gray-900">Customer Statistics</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {customerStats.map((stat, index) => (
            <div key={index} className="p-5 bg-gradient-to-br from-orange-50 to-rose-50 rounded-xl border border-orange-100">
              <p className="text-sm text-gray-600 mb-2">{stat.metric}</p>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <span className={`text-sm font-semibold ${
                  stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stat.change}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Export Options */}
      <Card className="border border-gray-100 rounded-2xl shadow-sm">
        <h2 className="text-xl font-bold mb-4 text-gray-900">Export Reports</h2>
        <p className="text-gray-600 mb-4">
          Download detailed reports for accounting and analysis
        </p>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" className="text-gray-700 border-gray-300 hover:bg-orange-50 hover:border-orange-200 hover:text-rose-600">
            <FileText className="w-4 h-4 mr-2" />
            Export as PDF
          </Button>
          <Button variant="outline" className="text-gray-700 border-gray-300 hover:bg-orange-50 hover:border-orange-200 hover:text-rose-600">
            <Download className="w-4 h-4 mr-2" />
            Export as Excel
          </Button>
          <Button variant="outline" className="text-gray-700 border-gray-300 hover:bg-orange-50 hover:border-orange-200 hover:text-rose-600">
            <Download className="w-4 h-4 mr-2" />
            Export as CSV
          </Button>
        </div>
      </Card>
    </div>
  );
}
