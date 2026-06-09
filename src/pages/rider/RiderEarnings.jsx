import { useState } from 'react';
import { useRider } from '../../context/RiderContext';
import Card from '../../components/Card';
import Button from '../../components/Button';

export default function RiderEarnings() {
  const { rider } = useRider();

  const [timeRange, setTimeRange] = useState('week');

  // Mock earnings data
  const earningsData = {
    week: {
      total: 487.50,
      deliveries: 42,
      avgPerDelivery: 11.61,
      breakdown: [
        { day: 'Mon', deliveries: 5, earnings: 58.50, hours: 4 },
        { day: 'Tue', deliveries: 6, earnings: 72.00, hours: 5 },
        { day: 'Wed', deliveries: 8, earnings: 89.50, hours: 6 },
        { day: 'Thu', deliveries: 7, earnings: 78.00, hours: 5 },
        { day: 'Fri', deliveries: 6, earnings: 69.50, hours: 5 },
        { day: 'Sat', deliveries: 5, earnings: 62.00, hours: 4 },
        { day: 'Sun', deliveries: 5, earnings: 58.00, hours: 4 },
      ],
    },
    month: {
      total: 1987.50,
      deliveries: 168,
      avgPerDelivery: 11.83,
      breakdown: [
        { day: 'Week 1', deliveries: 38, earnings: 445.50, hours: 28 },
        { day: 'Week 2', deliveries: 42, earnings: 487.50, hours: 32 },
        { day: 'Week 3', deliveries: 45, earnings: 534.00, hours: 34 },
        { day: 'Week 4', deliveries: 43, earnings: 520.50, hours: 33 },
      ],
    },
  };

  // Mock trip history
  const tripHistory = [
    {
      id: '12345',
      date: '2024-01-15',
      time: '2:45 PM',
      restaurant: 'Pizza Palace',
      customer: 'John Doe',
      distance: '2.3 mi',
      duration: '25 min',
      earnings: 5.50,
      tip: 3.00,
      total: 8.50,
      status: 'completed',
    },
    {
      id: '12344',
      date: '2024-01-15',
      time: '1:30 PM',
      restaurant: 'Burger House',
      customer: 'Jane Smith',
      distance: '1.8 mi',
      duration: '18 min',
      earnings: 4.00,
      tip: 2.50,
      total: 6.50,
      status: 'completed',
    },
    {
      id: '12343',
      date: '2024-01-15',
      time: '12:15 PM',
      restaurant: 'Sushi Masters',
      customer: 'Mike Johnson',
      distance: '3.1 mi',
      duration: '32 min',
      earnings: 6.00,
      tip: 4.00,
      total: 10.00,
      status: 'completed',
    },
    {
      id: '12342',
      date: '2024-01-14',
      time: '6:20 PM',
      restaurant: 'Italian Kitchen',
      customer: 'Sarah Williams',
      distance: '2.5 mi',
      duration: '28 min',
      earnings: 5.00,
      tip: 3.50,
      total: 8.50,
      status: 'completed',
    },
    {
      id: '12341',
      date: '2024-01-14',
      time: '5:45 PM',
      restaurant: 'Sweet Treats',
      customer: 'Tom Brown',
      distance: '1.2 mi',
      duration: '15 min',
      earnings: 3.50,
      tip: 2.00,
      total: 5.50,
      status: 'completed',
    },
  ];

  const currentData = earningsData[timeRange];
  const maxEarnings = Math.max(...currentData.breakdown.map(d => d.earnings));

  return (
    <div className="py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold mb-2">Earnings & History</h1>
          <p className="text-secondary-600">Track your delivery earnings and completed trips</p>
        </div>

        {/* Time Range Selector */}
        <div className="flex gap-2">
          <button
            onClick={() => setTimeRange('week')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              timeRange === 'week'
                ? 'bg-primary-500 text-white'
                : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200'
            }`}
          >
            This Week
          </button>
          <button
            onClick={() => setTimeRange('month')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              timeRange === 'month'
                ? 'bg-primary-500 text-white'
                : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200'
            }`}
          >
            This Month
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary-600 mb-1">Total Earnings</p>
              <p className="text-3xl font-bold text-green-700">${currentData.total.toFixed(2)}</p>
            </div>
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-2xl">
              💰
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary-600 mb-1">Total Deliveries</p>
              <p className="text-3xl font-bold text-blue-700">{currentData.deliveries}</p>
            </div>
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-2xl">
              📦
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-primary-50 to-primary-100 border-primary-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary-600 mb-1">Avg Per Delivery</p>
              <p className="text-3xl font-bold text-primary-700">${currentData.avgPerDelivery.toFixed(2)}</p>
            </div>
            <div className="w-12 h-12 bg-primary-500 rounded-full flex items-center justify-center text-2xl">
              📊
            </div>
          </div>
        </Card>
      </div>

      {/* Earnings Chart */}
      <Card>
        <h2 className="text-2xl font-heading font-bold mb-6">Earnings Breakdown</h2>

        <div className="space-y-3">
          {currentData.breakdown.map((item, index) => (
            <div key={index}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-secondary-700">{item.day}</span>
                <div className="text-right">
                  <span className="text-sm font-bold text-green-600">${item.earnings.toFixed(2)}</span>
                  <span className="text-xs text-secondary-500 ml-2">
                    ({item.deliveries} deliveries • {item.hours}h)
                  </span>
                </div>
              </div>
              <div className="w-full bg-secondary-200 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${(item.earnings / maxEarnings) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Performance Metrics */}
      <Card>
        <h2 className="text-2xl font-heading font-bold mb-6">Performance Metrics</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-secondary-50 rounded-lg">
            <p className="text-sm text-secondary-600 mb-1">Rating</p>
            <p className="text-2xl font-bold text-secondary-900">
              ⭐ {rider?.rating || '4.8'}
            </p>
          </div>

          <div className="p-4 bg-secondary-50 rounded-lg">
            <p className="text-sm text-secondary-600 mb-1">Total Deliveries</p>
            <p className="text-2xl font-bold text-secondary-900">
              {rider?.totalDeliveries || '1,247'}
            </p>
          </div>

          <div className="p-4 bg-secondary-50 rounded-lg">
            <p className="text-sm text-secondary-600 mb-1">Acceptance Rate</p>
            <p className="text-2xl font-bold text-secondary-900">
              95%
            </p>
          </div>

          <div className="p-4 bg-secondary-50 rounded-lg">
            <p className="text-sm text-secondary-600 mb-1">On-Time Rate</p>
            <p className="text-2xl font-bold text-secondary-900">
              98%
            </p>
          </div>
        </div>
      </Card>

      {/* Trip History */}
      <Card>
        <h2 className="text-2xl font-heading font-bold mb-6">Recent Trips</h2>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-secondary-200">
                <th className="text-left py-3 px-4 font-semibold text-secondary-700">Date & Time</th>
                <th className="text-left py-3 px-4 font-semibold text-secondary-700">Restaurant</th>
                <th className="text-left py-3 px-4 font-semibold text-secondary-700">Customer</th>
                <th className="text-right py-3 px-4 font-semibold text-secondary-700">Distance</th>
                <th className="text-right py-3 px-4 font-semibold text-secondary-700">Duration</th>
                <th className="text-right py-3 px-4 font-semibold text-secondary-700">Base</th>
                <th className="text-right py-3 px-4 font-semibold text-secondary-700">Tip</th>
                <th className="text-right py-3 px-4 font-semibold text-secondary-700">Total</th>
              </tr>
            </thead>
            <tbody>
              {tripHistory.map((trip) => (
                <tr key={trip.id} className="border-b border-secondary-100 hover:bg-secondary-50 transition-colors">
                  <td className="py-4 px-4">
                    <div className="text-sm">
                      <p className="font-medium">{trip.date}</p>
                      <p className="text-secondary-600">{trip.time}</p>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-sm">{trip.restaurant}</td>
                  <td className="py-4 px-4 text-sm">{trip.customer}</td>
                  <td className="py-4 px-4 text-right text-sm text-secondary-700">{trip.distance}</td>
                  <td className="py-4 px-4 text-right text-sm text-secondary-700">{trip.duration}</td>
                  <td className="py-4 px-4 text-right font-medium">${trip.earnings.toFixed(2)}</td>
                  <td className="py-4 px-4 text-right font-medium text-green-600">
                    +${trip.tip.toFixed(2)}
                  </td>
                  <td className="py-4 px-4 text-right font-bold text-green-600">
                    ${trip.total.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-secondary-300 font-bold">
                <td colSpan="7" className="py-4 px-4 text-right">Total:</td>
                <td className="py-4 px-4 text-right text-green-600 text-lg">
                  ${tripHistory.reduce((sum, trip) => sum + trip.total, 0).toFixed(2)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      {/* Export & Payment */}
      <Card>
        <h2 className="text-2xl font-heading font-bold mb-4">Payment & Reports</h2>
        <p className="text-secondary-600 mb-4">
          Download your earnings reports or request payment
        </p>
        <div className="flex flex-wrap gap-2">
          <Button variant="primary">
            💳 Request Payout
          </Button>
          <Button variant="outline">
            📄 Download Report (PDF)
          </Button>
          <Button variant="outline">
            📊 Download Report (Excel)
          </Button>
        </div>
      </Card>
    </div>
  );
}
