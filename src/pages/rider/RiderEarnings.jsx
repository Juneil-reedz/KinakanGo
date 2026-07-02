import { useState } from 'react';
import { useRider } from '../../context/RiderContext';
import { Banknote, Package, TrendingUp, Star, Clock, MapPin, Store, Download, CreditCard } from 'lucide-react';

const DATA = {
  week: {
    total:487.50, deliveries:42, avg:11.61,
    breakdown:[
      { day:'Mon', deliveries:5,  earnings:58.50,  hours:4 },
      { day:'Tue', deliveries:6,  earnings:72.00,  hours:5 },
      { day:'Wed', deliveries:8,  earnings:89.50,  hours:6 },
      { day:'Thu', deliveries:7,  earnings:78.00,  hours:5 },
      { day:'Fri', deliveries:6,  earnings:69.50,  hours:5 },
      { day:'Sat', deliveries:5,  earnings:62.00,  hours:4 },
      { day:'Sun', deliveries:5,  earnings:58.00,  hours:4 },
    ],
  },
  month: {
    total:1987.50, deliveries:168, avg:11.83,
    breakdown:[
      { day:'Week 1', deliveries:38, earnings:445.50, hours:28 },
      { day:'Week 2', deliveries:42, earnings:487.50, hours:32 },
      { day:'Week 3', deliveries:45, earnings:534.00, hours:34 },
      { day:'Week 4', deliveries:43, earnings:520.50, hours:33 },
    ],
  },
};

const TRIPS = [
  { id:'12345', date:'Jan 15', time:'2:45 PM', restaurant:'Pizza Palace',    customer:'John Doe',       distance:'2.3 km', duration:'25 min', base:5.50, tip:3.00 },
  { id:'12344', date:'Jan 15', time:'1:30 PM', restaurant:'Burger House',    customer:'Jane Smith',     distance:'1.8 km', duration:'18 min', base:4.00, tip:2.50 },
  { id:'12343', date:'Jan 15', time:'12:15 PM',restaurant:'Sushi Masters',   customer:'Mike Johnson',   distance:'3.1 km', duration:'32 min', base:6.00, tip:4.00 },
  { id:'12342', date:'Jan 14', time:'6:20 PM', restaurant:'Italian Kitchen', customer:'Sarah Williams', distance:'2.5 km', duration:'28 min', base:5.00, tip:3.50 },
  { id:'12341', date:'Jan 14', time:'5:45 PM', restaurant:'Sweet Treats',    customer:'Tom Brown',      distance:'1.2 km', duration:'15 min', base:3.50, tip:2.00 },
];

export default function RiderEarnings() {
  const { rider }          = useRider();
  const [range, setRange]  = useState('week');
  const d                  = DATA[range];
  const max                = Math.max(...d.breakdown.map(b => b.earnings));

  const metrics = [
    { label:'Rating',         value:`${rider?.rating || '4.8'}`, icon:Star,      sub:'out of 5.0' },
    { label:'All-time Trips', value: rider?.totalDeliveries || '1,247', icon:Package, sub:'completed' },
    { label:'Acceptance',     value:'95%', icon:TrendingUp, sub:'rate' },
    { label:'On-Time',        value:'98%', icon:Clock,      sub:'rate' },
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
          { label:'Total Earned', value:`₱${d.total.toFixed(2)}`, icon:Banknote,   color:'btn-glow-green' },
          { label:'Deliveries',   value:d.deliveries,             icon:Package,    color:'btn-glow-orange' },
          { label:'Avg / Trip',   value:`₱${d.avg.toFixed(2)}`,   icon:TrendingUp, color:'glass-green' },
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
      <div className="glass rounded-2xl p-5">
        <p className="text-white font-semibold mb-5">Earnings Breakdown</p>
        <div className="space-y-3">
          {d.breakdown.map((item, i) => (
            <div key={i}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-forest-200/70 text-xs font-medium w-10">{item.day}</span>
                <div className="flex-1 mx-3 h-2.5 glass rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-forest-500 to-ember-500 transition-all duration-700"
                    style={{ width:`${(item.earnings / max) * 100}%` }} />
                </div>
                <div className="text-right min-w-[90px]">
                  <span className="text-white text-xs font-bold">₱{item.earnings.toFixed(2)}</span>
                  <span className="text-forest-200/40 text-xs ml-1.5">{item.deliveries}x · {item.hours}h</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

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
        <div className="divide-y divide-white/5">
          {TRIPS.map(trip => (
            <div key={trip.id} className="p-4 hover:glass transition-all">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Store className="w-3.5 h-3.5 text-ember-400 flex-shrink-0" />
                    <p className="text-white text-sm font-semibold truncate">{trip.restaurant}</p>
                  </div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <MapPin className="w-3.5 h-3.5 text-forest-400 flex-shrink-0" />
                    <p className="text-forest-200/60 text-xs truncate">{trip.customer}</p>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-forest-200/40">
                    <span>{trip.date} · {trip.time}</span>
                    <span>{trip.distance}</span>
                    <span>{trip.duration}</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-white font-heading font-bold">₱{(trip.base + trip.tip).toFixed(2)}</p>
                  <p className="text-forest-300 text-xs">+₱{trip.tip.toFixed(2)} tip</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="p-4 glass-dark flex items-center justify-between" style={{ borderTop:'1px solid rgba(255,255,255,.07)' }}>
          <p className="text-forest-200/60 text-sm">Total ({TRIPS.length} trips)</p>
          <p className="text-white font-heading font-bold text-lg">
            ₱{TRIPS.reduce((s,t) => s + t.base + t.tip, 0).toFixed(2)}
          </p>
        </div>
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
