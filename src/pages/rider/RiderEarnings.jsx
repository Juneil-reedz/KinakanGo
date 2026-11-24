import { useState, useEffect } from 'react';
import { useRider, riderRequest } from '../../context/RiderContext';
import { useNotification } from '../../context/NotificationContext';
import { Banknote, Package, TrendingUp, Star, MapPin, Store, Download, CreditCard } from 'lucide-react';

export default function RiderEarnings() {
  const { rider }          = useRider();
  const { addNotification } = useNotification();
  const [trips, setTrips]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange]  = useState('week');
  const [requesting, setRequesting] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await riderRequest('/orders?rider_orders=true&status=delivered&limit=1000');
        setTrips(res.data || res || []);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // A rider earns the delivery fee of each delivered order (same as Dashboard and History).
  // "This Week" = the last 7 days, "This Month" = this calendar month (Philippine time).
  const tz = 'Asia/Manila';
  const dayKey = (d) => new Date(d).toLocaleDateString('en-CA', { timeZone: tz });
  const now = Date.now();
  const weekDays = [...Array(7)].map((_, i) => dayKey(now - (6 - i) * 86400000));
  const monthKey = dayKey(now).slice(0, 7);
  const when = (o) => o.delivered_at || o.created_at;
  const inRange = trips.filter(o => when(o) && (range === 'week'
    ? weekDays.includes(dayKey(when(o)))
    : dayKey(when(o)).startsWith(monthKey)));
  const earnOf        = (o) => Number(o.delivery_fee || 0);
  const totalEarned   = inRange.reduce((s, o) => s + earnOf(o), 0);
  const deliveries    = inRange.length;
  const avg           = deliveries > 0 ? totalEarned / deliveries : 0;

  // One bar per day: every day of the last week, or each day this month with trips
  const dayMap = {};
  const label = (k) => new Date(`${k}T12:00:00+08:00`).toLocaleDateString('en-US', range === 'week'
    ? { weekday: 'short', timeZone: tz } : { month: 'short', day: 'numeric', timeZone: tz });
  if (range === 'week') weekDays.forEach(k => { dayMap[k] = { day: label(k), earnings: 0, deliveries: 0 }; });
  inRange.forEach(o => {
    const k = dayKey(when(o));
    if (!dayMap[k]) dayMap[k] = { day: label(k), earnings: 0, deliveries: 0 };
    dayMap[k].earnings   += earnOf(o);
    dayMap[k].deliveries += 1;
  });
  const breakdown = Object.keys(dayMap).sort().map(k => dayMap[k]);
  const max = breakdown.length ? Math.max(...breakdown.map(b => b.earnings)) : 1;

  const metrics = [
    { label:'Rating',         value: Number(rider?.rating) > 0 ? Number(rider.rating).toFixed(1) : 'New', icon:Star, sub: Number(rider?.rating) > 0 ? 'out of 5.0' : 'no ratings yet' },
    { label:'All-time Trips', value:rider?.totalDeliveries || deliveries, icon:Package, sub:'completed' },
  ];

  const sendAdminRequest = async (requestType) => {
    if (requesting) return;
    setRequesting(requestType);
    try {
      await riderRequest('/riders/admin-requests', {
        method: 'POST',
        body: JSON.stringify({
          requestType,
          amount: requestType === 'payout' ? totalEarned.toFixed(2) : null,
          period: range,
          details: requestType === 'payout'
            ? `Payout request from ${rider?.name || 'Rider'} for ${deliveries} delivered trips.`
            : `Earnings report request for ${range}: ${deliveries} delivered trips, ₱${totalEarned.toFixed(2)} estimated earnings.`,
        }),
      });
      addNotification(
        requestType === 'payout'
          ? 'Payout request sent to admin'
          : 'Report request sent to admin',
        'success'
      );
    } catch (err) {
      addNotification(err?.data?.error || 'Failed to send request to admin', 'error');
    } finally {
      setRequesting(null);
    }
  };

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
        <div className="p-4" style={{ borderBottom:'1px solid rgba(var(--fg-rgb),.07)' }}>
          <p className="text-white font-semibold">Recent Trips</p>
        </div>
        {loading ? (
          <div className="p-4 space-y-3">
            {[1,2,3].map(i => <div key={i} className="glass rounded-xl h-20 animate-pulse" />)}
          </div>
        ) : inRange.length === 0 ? (
          <div className="p-8 flex flex-col items-center gap-2">
            <Package className="w-8 h-8 text-forest-300/30" />
            <p className="text-forest-200/40 text-sm">No delivered orders yet</p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-white/5">
              {inRange.map(trip => {
                const restaurantName = trip.restaurant_name || 'Restaurant';
                const customerName   = trip.customer_name   || 'Customer';
                const earning        = earnOf(trip);
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
                        <p className="text-forest-300 text-xs">Delivery fee</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="p-4 glass-dark flex items-center justify-between" style={{ borderTop:'1px solid rgba(var(--fg-rgb),.07)' }}>
              <p className="text-forest-200/60 text-sm">Total ({inRange.length} trips)</p>
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
          <button onClick={() => sendAdminRequest('payout')} disabled={requesting || totalEarned <= 0}
            className="flex-1 btn-glow-orange text-white text-sm font-semibold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-60">
            <CreditCard className="w-4 h-4" /> {requesting === 'payout' ? 'Sending...' : 'Request Payout'}
          </button>
          <button onClick={() => sendAdminRequest('report')} disabled={requesting}
            className="flex-1 glass hover:glass-green transition-all text-forest-100 text-sm font-medium py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-60">
            <Download className="w-4 h-4" /> {requesting === 'report' ? 'Sending...' : 'Request Report'}
          </button>
        </div>
      </div>
    </div>
  );
}
