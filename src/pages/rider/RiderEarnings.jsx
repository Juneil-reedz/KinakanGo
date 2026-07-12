import { useState, useEffect } from 'react';
import { useRider, riderRequest } from '../../context/RiderContext';
import { Banknote, Package, TrendingUp, Star, Clock, MapPin, Store, Download, CreditCard } from 'lucide-react';

export default function RiderEarnings() {
  const { rider }          = useRider();
  const [trips, setTrips]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange]  = useState('week');

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await riderRequest('/orders?rider_orders=true&status=delivered&limit=20');
        setTrips(res.data || res || []);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Compute summary from real delivered orders
  const totalEarned   = trips.reduce((s, o) => s + Number(o.total || o.totalAmount || 0) * 0.1, 0);
  const deliveries    = trips.length;
  const avg           = deliveries > 0 ? totalEarned / deliveries : 0;

  // Group by day for breakdown chart (last 7 days)
  const dayMap = {};
  trips.forEach(o => {
    const day = o.createdAt ? new Date(o.createdAt).toLocaleDateString('en-US', { weekday:'short' }) : 'Other';
    if (!dayMap[day]) dayMap[day] = { day, earnings:0, deliveries:0, hours:0 };
    dayMap[day].earnings  += Number(o.total || o.totalAmount || 0) * 0.1;
    dayMap[day].deliveries += 1;
  });
  const breakdown = Object.values(dayMap).slice(-7);
  const max = breakdown.length ? Math.max(...breakdown.map(b => b.earnings)) : 1;

  const metrics = [
    { label:'Rating',         value:`${rider?.rating || '—'}`, icon:Star,      sub:'out of 5.0' },
    { label:'All-time Trips', value:rider?.totalDeliveries || deliveries, icon:Package, sub:'completed' },
    { label:'Acceptance',     value:'—', icon:TrendingUp, sub:'rate' },
    { label:'On-Time',        value:'—', icon:Clock,      sub:'rate' },
  ];

  return (
    <div className="space-y-5 pb-6 animate-fade-up">

      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <p className="text-forest-200/50 text-sm">Overview</p>
          <h1 className="text-2xl font-heading font-bold text-white">Earnings</h1>
        </div>
        <div className="flex glass rounded-xl overflow-hidden">
          {['week','month'].map(r => (
            <button key={r} onClick={() => setRange(r)}
              className={`px-4 py-2 text-sm font-semibold transition-all capitalize
                ${range === r ? 'btn-glow-orange text-white' : 'text-forest-200/60 hover:text-forest-100'}`}>
              {r === 'week' ? 'This Week' : 'This Month'}
            </button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label:'Total Earned', value:`₱${totalEarned.toFixed(2)}`, icon:Banknote,   color:'btn-glow-green' },
          { label:'Deliveries',   value:deliveries,                    icon:Package,    color:'btn-glow-orange' },
          { label:'Avg / Trip',   value:`₱${avg.toFixed(2)}`,          icon:TrendingUp, color:'glass-green' },
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

      {/* Bar chart */}
      {breakdown.length > 0 && (
        <div className="glass rounded-2xl p-5">
          <p className="text-white font-semibold mb-5">Earnings Breakdown</p>
          <div className="space-y-3">
            {breakdown.map((item, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-forest-200/70 text-xs font-medium w-10">{item.day}</span>
                  <div className="flex-1 mx-3 h-2.5 glass rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-forest-500 to-ember-500 transition-all duration-700"
                      style={{ width:`${max > 0 ? (item.earnings / max) * 100 : 0}%` }} />
                  </div>
                  <div className="text-right min-w-[90px]">
                    <span className="text-white text-xs font-bold">₱{item.earnings.toFixed(2)}</span>
                    <span className="text-forest-200/40 text-xs ml-1.5">{item.deliveries}x</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Performance */}
      <div className="glass rounded-2xl p-5">
        <p className="text-white font-semibold mb-4">Performance</p>
        <div className="grid grid-cols-2 gap-3">
          {metrics.map(({ label, value, icon:Icon, sub }) => (
            <div key={label} className="glass rounded-xl p-3 flex items-center gap-3">
              <div className="w-9 h-9 btn-glow-green rounded-xl flex items-center justify-center flex-shrink-0">
                <Icon className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-white font-bold text-base leading-tight">{value}</p>
                <p className="text-forest-200/50 text-xs">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Trip history */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="p-4" style={{ borderBottom:'1px solid rgba(255,255,255,.07)' }}>
          <p className="text-white font-semibold">Recent Trips</p>
        </div>
        {loading ? (
          <div className="p-4 space-y-3">
            {[1,2,3].map(i => <div key={i} className="glass rounded-xl h-20 animate-pulse" />)}
          </div>
        ) : trips.length === 0 ? (
          <div className="p-8 flex flex-col items-center gap-2">
            <Package className="w-8 h-8 text-forest-300/30" />
            <p className="text-forest-200/40 text-sm">No delivered orders yet</p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-white/5">
              {trips.map(trip => {
                const restaurantName = trip.restaurant?.name || trip.restaurantName || 'Restaurant';
                const customerName   = trip.customer?.name   || trip.customerName   || 'Customer';
                const earning        = Number(trip.total || trip.totalAmount || 0) * 0.1;
                return (
                  <div key={trip.id} className="p-4 hover:glass transition-all">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Store className="w-3.5 h-3.5 text-ember-400 flex-shrink-0" />
                          <p className="text-white text-sm font-semibold truncate">{restaurantName}</p>
                        </div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <MapPin className="w-3.5 h-3.5 text-forest-400 flex-shrink-0" />
                          <p className="text-forest-200/60 text-xs truncate">{customerName}</p>
                        </div>
                        {trip.createdAt && (
                          <div className="flex items-center gap-3 text-xs text-forest-200/40">
                            <span>{new Date(trip.createdAt).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-white font-heading font-bold">₱{earning.toFixed(2)}</p>
                        <p className="text-forest-300 text-xs">10% of order</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="p-4 glass-dark flex items-center justify-between" style={{ borderTop:'1px solid rgba(255,255,255,.07)' }}>
              <p className="text-forest-200/60 text-sm">Total ({trips.length} trips)</p>
              <p className="text-white font-heading font-bold text-lg">
                ₱{totalEarned.toFixed(2)}
              </p>
            </div>
          </>
        )}
      </div>

      {/* Payout */}
      <div className="glass rounded-2xl p-5">
        <p className="text-white font-semibold mb-1">Payment & Reports</p>
        <p className="text-forest-200/50 text-sm mb-4">Request payout or download your earnings report.</p>
        <div className="flex gap-3 flex-wrap">
          <button className="flex-1 btn-glow-orange text-white text-sm font-semibold py-3 rounded-xl flex items-center justify-center gap-2">
            <CreditCard className="w-4 h-4" /> Request Payout
          </button>
          <button className="flex-1 glass hover:glass-green transition-all text-forest-100 text-sm font-medium py-3 rounded-xl flex items-center justify-center gap-2">
            <Download className="w-4 h-4" /> Download PDF
          </button>
        </div>
      </div>
    </div>
  );
}
