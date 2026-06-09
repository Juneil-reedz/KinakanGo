import { useState } from 'react';
import { FileText, Download, Eye, Calendar, DollarSign, Filter } from 'lucide-react';

export default function Bills() {
  const [filterPeriod, setFilterPeriod] = useState('all');

  const bills = [
    {
      id: 'INV-2024-001',
      date: '2024-11-20',
      restaurant: 'Pizza Palace',
      items: 2,
      amount: 45.98,
      status: 'paid',
      paymentMethod: 'Credit Card'
    },
    {
      id: 'INV-2024-002',
      date: '2024-11-19',
      restaurant: "Burger King's",
      items: 3,
      amount: 32.50,
      status: 'paid',
      paymentMethod: 'PayPal'
    },
    {
      id: 'INV-2024-003',
      date: '2024-11-18',
      restaurant: 'Healthy Bites',
      items: 1,
      amount: 15.99,
      status: 'paid',
      paymentMethod: 'Credit Card'
    },
    {
      id: 'INV-2024-004',
      date: '2024-11-15',
      restaurant: 'Sushi Bar',
      items: 4,
      amount: 78.25,
      status: 'paid',
      paymentMethod: 'Debit Card'
    },
    {
      id: 'INV-2024-005',
      date: '2024-11-10',
      restaurant: 'Taco Town',
      items: 2,
      amount: 24.50,
      status: 'paid',
      paymentMethod: 'Cash'
    },
  ];

  const totalSpent = bills.reduce((sum, bill) => sum + bill.amount, 0);
  const avgOrderValue = totalSpent / bills.length;

  return (
    <div className="min-h-screen bg-[#EBD5AB] p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Bills & Invoices</h1>
          <p className="text-gray-600">View and download your payment history</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Spent</p>
                <p className="text-3xl font-bold text-gray-900">${totalSpent.toFixed(2)}</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-[#8BAE66] to-[#628141] rounded-xl">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Orders</p>
                <p className="text-3xl font-bold text-gray-900">{bills.length}</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-[#8BAE66] to-[#628141] rounded-xl">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Avg Order Value</p>
                <p className="text-3xl font-bold text-gray-900">${avgOrderValue.toFixed(2)}</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-[#E67E22] to-[#d4721d] rounded-xl">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm mb-6">
          <div className="flex items-center gap-4">
            <Filter className="w-5 h-5 text-gray-600" />
            <div className="flex gap-2">
              <button
                onClick={() => setFilterPeriod('all')}
                className={`px-4 py-2 rounded-xl font-medium transition-colors ${
                  filterPeriod === 'all'
                    ? 'bg-[#E67E22] text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All Time
              </button>
              <button
                onClick={() => setFilterPeriod('month')}
                className={`px-4 py-2 rounded-xl font-medium transition-colors ${
                  filterPeriod === 'month'
                    ? 'bg-[#E67E22] text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                This Month
              </button>
              <button
                onClick={() => setFilterPeriod('year')}
                className={`px-4 py-2 rounded-xl font-medium transition-colors ${
                  filterPeriod === 'year'
                    ? 'bg-[#E67E22] text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                This Year
              </button>
            </div>
          </div>
        </div>

        {/* Bills Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">Invoice ID</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">Date</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">Restaurant</th>
                  <th className="text-center py-4 px-6 font-semibold text-gray-700">Items</th>
                  <th className="text-right py-4 px-6 font-semibold text-gray-700">Amount</th>
                  <th className="text-center py-4 px-6 font-semibold text-gray-700">Payment</th>
                  <th className="text-center py-4 px-6 font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {bills.map(bill => (
                  <tr key={bill.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-6">
                      <span className="font-mono text-sm font-semibold text-gray-900">{bill.id}</span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2 text-gray-700">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">{new Date(bill.date).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-medium text-gray-900">{bill.restaurant}</span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className="text-gray-700">{bill.items}</span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <span className="font-bold text-gray-900">${bill.amount.toFixed(2)}</span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                        {bill.paymentMethod}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          className="p-2 hover:bg-blue-50 rounded-lg transition-colors group"
                          title="View Invoice"
                        >
                          <Eye className="w-5 h-5 text-gray-600 group-hover:text-blue-600" />
                        </button>
                        <button
                          className="p-2 hover:bg-[#8BAE66] rounded-lg transition-colors group"
                          title="Download PDF"
                        >
                          <Download className="w-5 h-5 text-gray-600 group-hover:text-white" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
