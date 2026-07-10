import { useState, useEffect } from 'react';
import { DollarSign, Package, TrendingUp, Users, BarChart2, ShoppingBag } from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';
import { request } from '../../services/api';

function groupByPeriod(orders, range) {
  const rows = [];
  const now = new Date();

  if (range === 'week') {
    const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    const map = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now); d.setDate(d.getDate() - i);
      const key = days[d.getDay()];
      map[key] = { day: key, sales: 0, orders: 0 };
    }
    orders.forEach(o => {
      const d = new Date(o.created_at);
      const diff = Math.floor((now - d) / 86400000);
      if (diff <= 6) { const k = days[d.getDay()]; if (map[k]) { map[k].sales += +o.total; map[k].orders++; } }
    });
    return Object.values(map);
  }

  if (range === 'month') {
    const weeks = ['Week 1','Week 2','Week 3','Week 4'];
    const map = { 'Week 1':{ day:'Week 1',sales:0,orders:0 }, 'Week 2':{ day:'Week 2',sales:0,orders:0 }, 'Week 3':{ day:'Week 3',sales:0,orders:0 }, 'Week 4':{ day:'Week 4',sales:0,orders:0 } };
    orders.forEach(o => {
      const d = new Date(o.created_at);
      const diff = Math.floor((now - d) / 86400000);
      if (diff <= 30) { const w = weeks[Math.min(3, Math.floor(d.getDate() / 8))]; map[w].sales += +o.total; map[w].orders++; }
    });
    return Object.values(map);
  }

  // year
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const map = {};
  months.forEach(m => { map[m] = { day: m, sales: 0, orders: 0 }; });
  orders.forEach(o => {
    const d = new Date(o.created_at);
    if (d.getFullYear() === now.getFullYear()) {
      const m = months[d.getMonth()]; map[m].sales += +o.total; map[m].orders++;
    }
  });
  return Object.values(map);
}

function topItems(orders) {
  const map = {};
  orders.forEach(o => {
    (o.items || []).forEach(item => {
      if (!map[item.name]) map[item.name] = { name: item.name, orders: 0, revenue: 0 };
      map[item.name].orders += item.quantity || 1;
      map[item.name].revenue += (item.price || 0) * (item.quantity || 1);
    });
  });
  const sorted = Object.values(map).sort((a, b) => b.orders - a.orders).slice(0, 5);
  const maxOrders = sorted[0]?.orders || 1;
  return sorted.map(i => ({ ...i, pct: Math.round((i.orders / maxOrders) * 100) }));
}

const RANK_COLOR = ['btn-glow-orange', 'glass', 'glass-green'];

export default function RestaurantReports() {
  const { restaurant } = useRestaurant();
  const [range, setRange]   = useState('week');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!restaurant?.id) return;
    setLoading(true);
    request(`/orders?restaurant_id=${restaurant.id}&limit=1000`)
      .then(res => setOrders(res.data || res.orders || res || []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [restaurant?.id]);

  const delivered = orders.filter(o => o.status === 'delivered');
  const rows   = groupByPeriod(delivered, range);
  const top    = topItems(delivered);
  const max    = Math.max(...rows.map(r => r.sales), 1);

  const totalSales  = rows.reduce((s, r) => s + r.sales, 0);
  const totalOrders = rows.reduce((s, r) => s + r.orders, 0);
  const avg         = totalOrders > 0 ? totalSales / totalOrders : 0;

  const uniqueCustomers = new Set(delivered.map(o => o.customer_id)).size;
  const allTime = { sales: delivered.reduce((s, o) => s + +o.total, 0), orders: delivered.length };

  if (loading) return (
    <div className="space-y-4 animate-fade-up">
      <h1 className="text-2xl font-heading font-bold text-white">Reports</h1>
      {[1,2,3].map(i => <div key={i} className="glass rounded-2xl h-32 animate-pulse" />)}
    </div>
  );

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
                ${range === r ? 'btn-glow-orange text-white' : 'text-forest-200/60 hover:text-forest-100'}`}>
              {r === 'week' ? 'This Week' : r === 'month' ? 'This Month' : 'This Year'}
            </button>
          ))}
        </div>
      </div>

      {/* All-time banner */}
      <div className="glass-green rounded-2xl px-5 py-4 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 btn-glow-green rounded-xl flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-forest-200/60 text-xs">All-time Revenue</p>
            <p className="text-white font-heading font-bold text-xl">₱{allTime.sales.toFixed(2)}</p>
          </div>
        </div>
        <div className="flex gap-6">
          <div><p className="text-forest-200/50 text-xs">Total Orders</p><p className="text-white font-bold">{allTime.orders}</p></div>
          <div><p className="text-forest-200/50 text-xs">Customers</p><p className="text-white font-bold">{uniqueCustomers}</p></div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Sales',      value: `₱${totalSales.toFixed(2)}`,  icon: DollarSign, color: 'btn-glow-orange' },
          { label: 'Orders',     value: totalOrders,                    icon: Package,    color: 'btn-glow-green'  },
          { label: 'Avg Order',  value: `₱${avg.toFixed(2)}`,          icon: BarChart2,  color: 'glass-orange'    },
        ].map(({ label, value, icon: Icon, color }) => (
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
        {totalOrders === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10">
            <BarChart2 className="w-10 h-10 text-forest-300/20" />
            <p className="text-forest-200/40 text-sm">No completed orders in this period</p>
          </div>
        ) : (
          <div className="space-y-3">
            {rows.map((row, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-forest-200/70 text-xs font-medium w-14 flex-shrink-0">{row.day}</span>
                  <div className="flex-1 mx-3 h-2.5 glass rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-forest-500 to-ember-500 transition-all duration-700"
                      style={{ width: `${(row.sales / max) * 100}%` }} />
                  </div>
                  <div className="text-right min-w-[120px] flex-shrink-0">
                    <span className="text-white text-xs font-bold">₱{row.sales.toFixed(2)}</span>
                    <span className="text-forest-200/40 text-xs ml-1.5">{row.orders} orders</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Top selling items */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="p-4" style={{ borderBottom: '1px solid rgba(255,255,255,.07)' }}>
          <p className="text-white font-semibold">Top Selling Items</p>
          <p className="text-forest-200/40 text-xs mt-0.5">Based on all completed orders</p>
        </div>
        {top.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10">
            <ShoppingBag className="w-8 h-8 text-forest-300/20" />
            <p className="text-forest-200/40 text-sm">No order data yet</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {top.map((item, i) => (
              <div key={i} className="p-4 flex items-center gap-3 hover:glass transition-all">
                <div className={`w-8 h-8 ${RANK_COLOR[i] || 'glass'} rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-semibold truncate">{item.name}</p>
                  <p className="text-forest-200/50 text-xs">{item.orders} sold</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-ember-400 font-bold text-sm">₱{item.revenue.toFixed(2)}</p>
                  <div className="flex items-center gap-1.5 justify-end mt-1">
                    <div className="w-12 h-1.5 glass rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-forest-500 to-ember-500 rounded-full"
                        style={{ width: `${item.pct}%` }} />
                    </div>
                    <span className="text-forest-200/40 text-xs">{item.pct}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Customer stats */}
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-4 h-4 text-forest-300/60" />
          <p className="text-white font-semibold">Customer Statistics</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Total Customers',     value: uniqueCustomers },
            { label: 'Completed Orders',    value: delivered.length },
            { label: 'Total Revenue',       value: `₱${allTime.sales.toFixed(2)}` },
            { label: 'Avg Order Value',     value: delivered.length > 0 ? `₱${(allTime.sales / delivered.length).toFixed(2)}` : '₱0.00' },
          ].map(({ label, value }) => (
            <div key={label} className="glass rounded-xl p-3">
              <p className="text-forest-200/50 text-xs mb-1">{label}</p>
              <p className="text-white font-heading font-bold text-lg">{value}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
