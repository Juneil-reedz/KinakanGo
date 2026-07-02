import { useState } from 'react';
import { DollarSign, Package, TrendingUp, Users, Download, FileText } from 'lucide-react';

const DATA = {
  week: {
    rows:[
      { day:'Mon', sales:245.50,  orders:12 },
      { day:'Tue', sales:389.25,  orders:18 },
      { day:'Wed', sales:467.80,  orders:22 },
      { day:'Thu', sales:523.45,  orders:25 },
      { day:'Fri', sales:678.90,  orders:32 },
      { day:'Sat', sales:892.35,  orders:41 },
      { day:'Sun', sales:734.25,  orders:35 },
    ],
  },
  month: {
    rows:[
      { day:'Week 1', sales:1245.50, orders:58 },
      { day:'Week 2', sales:1589.25, orders:72 },
      { day:'Week 3', sales:1867.80, orders:85 },
      { day:'Week 4', sales:2023.45, orders:95 },
    ],
  },
  year: {
    rows:[
      { day:'Jan', sales:4523.45, orders:215 },
      { day:'Feb', sales:5234.80, orders:245 },
      { day:'Mar', sales:5678.90, orders:268 },
      { day:'Apr', sales:6123.35, orders:285 },
      { day:'May', sales:6789.25, orders:312 },
      { day:'Jun', sales:7234.50, orders:335 },
      { day:'Jul', sales:7892.35, orders:365 },
      { day:'Aug', sales:8145.80, orders:378 },
      { day:'Sep', sales:7523.45, orders:348 },
      { day:'Oct', sales:7890.25, orders:362 },
      { day:'Nov', sales:8234.50, orders:385 },
      { day:'Dec', sales:9123.35, orders:425 },
    ],
  },
};

const TOP_ITEMS = [
  { name:'Margherita Pizza',    orders:156, revenue:2026.44, pct:18 },
  { name:'Pepperoni Pizza',     orders:134, revenue:2008.66, pct:15 },
  { name:'Spaghetti Carbonara', orders:98,  revenue:1370.02, pct:11 },
  { name:'Caesar Salad',        orders:87,  revenue:782.13,  pct:10 },
  { name:'Chicken Parmigiana',  orders:76,  revenue:1293.24, pct:8  },
];

const CUSTOMER_STATS = [
  { label:'Total Customers',      value:247,      change:'+12%' },
  { label:'New Customers',        value:45,       change:'+8%'  },
  { label:'Returning Customers',  value:202,      change:'+15%' },
  { label:'Avg Order Value',      value:'₱32.45', change:'+5%'  },
];

const RANK_COLOR = ['btn-glow-orange','glass','glass-green'];

export default function RestaurantReports() {
  const [range, setRange] = useState('week');
  const d    = DATA[range];
  const max  = Math.max(...d.rows.map(r => r.sales));
  const totalSales  = d.rows.reduce((s,r) => s+r.sales,  0);
  const totalOrders = d.rows.reduce((s,r) => s+r.orders, 0);
  const avg         = totalSales / totalOrders;

  return (
    <div className="space-y-5 pb-6 animate-fade-up">

      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <p className="text-forest-200/50 text-sm">Analytics</p>
          <h1 className="text-2xl font-heading font-bold text-white">Reports</h1>
        </div>
        <div className="flex glass rounded-xl overflow-hidden">
          {['week','month','year'].map(r => (
            <button key={r} onClick={() => setRange(r)}
              className={`px-3 py-2 text-xs font-semibold transition-all capitalize
                ${range===r ? 'btn-glow-orange text-white' : 'text-forest-200/60 hover:text-forest-100'}`}>
              {r === 'week' ? 'Week' : r === 'month' ? 'Month' : 'Year'}
            </button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label:'Total Sales',  value:`₱${totalSales.toFixed(0)}`,  icon:DollarSign, color:'btn-glow-orange' },
          { label:'Total Orders', value:totalOrders,                   icon:Package,    color:'btn-glow-green'  },
          { label:'Avg Order',    value:`₱${avg.toFixed(2)}`,          icon:TrendingUp, color:'glass-orange'    },
        ].map(({ label, value, icon:Icon, color }) => (
          <div key={label} className="glass card-3d rounded-2xl p-4">
            <div className={`w-8 h-8 ${color} rounded-xl flex items-center justify-center mb-2`}>
              <Icon className="w-4 h-4 text-white" />
            </div>
            <p className="text-white font-heading font-bold text-lg leading-tight">{value}</p>
            <p className="text-forest-200/50 text-xs mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Sales chart */}
      <div className="glass rounded-2xl p-5">
        <p className="text-white font-semibold mb-5">Sales Overview</p>
        <div className="space-y-3">
          {d.rows.map((row, i) => (
            <div key={i}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-forest-200/70 text-xs font-medium w-12">{row.day}</span>
                <div className="flex-1 mx-3 h-2.5 glass rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-forest-500 to-ember-500 transition-all duration-700"
                    style={{ width:`${(row.sales/max)*100}%` }} />
                </div>
                <div className="text-right min-w-[110px]">
                  <span className="text-white text-xs font-bold">₱{row.sales.toFixed(2)}</span>
                  <span className="text-forest-200/40 text-xs ml-1.5">{row.orders} orders</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top selling items */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="p-4" style={{ borderBottom:'1px solid rgba(255,255,255,.07)' }}>
          <p className="text-white font-semibold">Top Selling Items</p>
        </div>
        <div className="divide-y divide-white/5">
          {TOP_ITEMS.map((item, i) => (
            <div key={i} className="p-4 flex items-center gap-3 hover:glass transition-all">
              <div className={`w-8 h-8 ${RANK_COLOR[i] || 'glass'} rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                {i+1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-semibold truncate">{item.name}</p>
                <p className="text-forest-200/50 text-xs">{item.orders} orders</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-ember-400 font-bold text-sm">₱{item.revenue.toFixed(2)}</p>
                <div className="flex items-center gap-1.5 justify-end mt-1">
                  <div className="w-12 h-1.5 glass rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-forest-500 to-ember-500 rounded-full"
                      style={{ width:`${item.pct*5}%` }} />
                  </div>
                  <span className="text-forest-200/40 text-xs">{item.pct}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Customer stats */}
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-4 h-4 text-forest-300/60" />
          <p className="text-white font-semibold">Customer Statistics</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {CUSTOMER_STATS.map(({ label, value, change }) => (
            <div key={label} className="glass rounded-xl p-3">
              <p className="text-forest-200/50 text-xs mb-1">{label}</p>
              <div className="flex items-baseline gap-2">
                <p className="text-white font-heading font-bold text-lg">{value}</p>
                <span className="text-forest-300 text-xs font-semibold">{change}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Export */}
      <div className="glass rounded-2xl p-5">
        <p className="text-white font-semibold mb-1">Export Reports</p>
        <p className="text-forest-200/50 text-sm mb-4">Download detailed reports for accounting and analysis.</p>
        <div className="flex gap-3 flex-wrap">
          {[
            { label:'Export PDF',   icon:FileText },
            { label:'Export Excel', icon:Download },
            { label:'Export CSV',   icon:Download },
          ].map(({ label, icon:Icon }) => (
            <button key={label}
              className="flex-1 glass hover:glass-orange transition-all text-forest-100/80 hover:text-white text-sm font-medium py-2.5 rounded-xl flex items-center justify-center gap-2">
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
