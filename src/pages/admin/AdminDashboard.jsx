import { useState } from "react";
import { Link } from "react-router-dom";
import { useAdmin } from "../../context/AdminContext";
import { restaurants, riders } from "../../data/mockData";
import {
  Users, Store, Bike, Package, DollarSign, Activity, AlertTriangle,
  TrendingUp, Clock, ArrowUpRight, Star, MapPin, Truck
} from "lucide-react";

const STATS_DATA = {
  today: { totalUsers:1247, totalRestaurants:156, totalRiders:89, totalOrders:5634,   activeOrders:42, revenue:12847.50,  flaggedIssues:3  },
  week:  { totalUsers:1247, totalRestaurants:156, totalRiders:89, totalOrders:42389,  activeOrders:42, revenue:95230.80,  flaggedIssues:8  },
  month: { totalUsers:1247, totalRestaurants:156, totalRiders:89, totalOrders:178456, activeOrders:42, revenue:387650.30, flaggedIssues:12 },
};

const ACTIVITY = [
  { id:1, message:"New order #12345 placed",          user:"John Doe",     time:"2 min ago",   status:"info"    },
  { id:2, message:"Customer reported missing item",    user:"Jane Smith",   time:"15 min ago",  status:"warning" },
  { id:3, message:"New restaurant registered",         user:"Burger Palace",time:"1 hour ago",  status:"success" },
  { id:4, message:"Refund requested for order #12333", user:"Mike Johnson", time:"2 hours ago", status:"warning" },
  { id:5, message:"Rider completed 50 deliveries",     user:"Sarah Wilson", time:"3 hours ago", status:"success" },
];

const FLAGGED = [
  { id:1, title:"Payment dispute",       description:"Customer claims double charge",              orderId:"12340", priority:"high",   time:"30 min ago"  },
  { id:2, title:"Food quality complaint",description:"Multiple complaints about restaurant hygiene",restaurantId:"5",priority:"high",  time:"2 hours ago" },
  { id:3, title:"Rider misconduct",      description:"Customer reported unprofessional behavior",   riderId:"23",   priority:"medium", time:"5 hours ago"  },
];

const PRIORITY_CLS = { high:"bg-red-500/20 text-red-300 border border-red-500/30", medium:"glass-orange text-ember-200", low:"glass-green text-forest-200" };
const STATUS_DOT   = { success:"bg-forest-500", warning:"bg-ember-500", info:"bg-forest-400", error:"bg-red-500" };

export default function AdminDashboard() {
  const { admin } = useAdmin();
  const [range, setRange] = useState("today");
  const stats = STATS_DATA[range];

  return (
    <div className="space-y-5 pb-6 animate-fade-up">

      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <p className="text-forest-200/50 text-sm">Overview</p>
          <h1 className="text-2xl font-heading font-bold text-white">
            Welcome back, {admin?.name}
            <span className="ml-2 inline-flex items-center gap-1 text-xs font-normal text-forest-300">
              <span className="w-1.5 h-1.5 bg-forest-400 rounded-full animate-pulse inline-block" /> Live
            </span>
          </h1>
        </div>
        <div className="flex glass rounded-xl overflow-hidden">
          {["today","week","month"].map(r => (
            <button key={r} onClick={() => setRange(r)}
              className={`px-3 py-2 text-xs font-semibold transition-all capitalize
                ${range===r ? "btn-glow-green text-white" : "text-forest-200/60 hover:text-forest-100"}`}>
              {r === "today" ? "Today" : r === "week" ? "Week" : "Month"}
            </button>
          ))}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label:"Total Users",   value:stats.totalUsers.toLocaleString(),  icon:Users,   trend:"+12%", link:"/admin/users" },
          { label:"Restaurants",   value:stats.totalRestaurants,             icon:Store,   trend:"+8%",  link:"/admin/restaurants" },
          { label:"Active Riders", value:stats.totalRiders,                  icon:Bike,    trend:"+5%",  link:"/admin/riders" },
          { label:"Total Orders",  value:stats.totalOrders.toLocaleString(), icon:Package, trend:"+18%", link:null },
        ].map(({ label, value, icon:Icon, trend, link }) => {
          const card = (
            <div className="glass card-3d rounded-2xl p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="w-9 h-9 btn-glow-green rounded-xl flex items-center justify-center">
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <span className="text-forest-300 text-xs font-semibold flex items-center gap-0.5">
                  <TrendingUp className="w-3 h-3" />{trend}
                </span>
              </div>
              <p className="text-white font-heading font-bold text-xl leading-tight">{value}</p>
              <p className="text-forest-200/50 text-xs mt-0.5">{label}</p>
            </div>
          );
          return link ? <Link key={label} to={link}>{card}</Link> : <div key={label}>{card}</div>;
        })}
      </div>

      {/* Revenue / Active Orders / Flagged */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="glass rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="w-4 h-4 text-forest-300/60" />
            <p className="text-forest-200/50 text-xs">Revenue</p>
          </div>
          <p className="text-white font-heading font-bold text-2xl">${stats.revenue.toLocaleString()}</p>
          <p className="text-forest-300 text-xs mt-1 flex items-center gap-0.5"><TrendingUp className="w-3 h-3" /> +22%</p>
        </div>
        <div className="glass rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-4 h-4 text-forest-300/60" />
            <p className="text-forest-200/50 text-xs">Active Orders</p>
          </div>
          <p className="text-white font-heading font-bold text-2xl">{stats.activeOrders}</p>
          <p className="text-forest-300 text-xs mt-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-forest-400 rounded-full animate-pulse inline-block" /> Real-time
          </p>
        </div>
        <Link to="/admin/issues">
          <div className="glass rounded-2xl p-4 hover:glass-orange transition-all cursor-pointer">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-4 h-4 text-ember-400" />
              <p className="text-forest-200/50 text-xs">Flagged Issues</p>
            </div>
            <p className="text-white font-heading font-bold text-2xl">{stats.flaggedIssues}</p>
            <p className="text-ember-400 text-xs mt-1 flex items-center gap-0.5"><ArrowUpRight className="w-3 h-3" /> Needs action</p>
          </div>
        </Link>
      </div>

      {/* Flagged Issues + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 glass rounded-2xl overflow-hidden">
          <div className="p-4 flex items-center justify-between" style={{ borderBottom:"1px solid rgba(255,255,255,.07)" }}>
            <p className="text-white font-semibold">Flagged Issues</p>
            <Link to="/admin/issues" className="text-ember-400 hover:text-ember-300 text-xs flex items-center gap-1 transition-colors">
              View All <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-white/5">
            {FLAGGED.map(issue => (
              <div key={issue.id} className="p-4 hover:glass transition-all">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${PRIORITY_CLS[issue.priority]}`}>
                        {issue.priority.toUpperCase()}
                      </span>
                      <span className="text-forest-200/40 text-xs flex items-center gap-1"><Clock className="w-3 h-3" />{issue.time}</span>
                    </div>
                    <p className="text-white font-semibold text-sm">{issue.title}</p>
                    <p className="text-forest-200/50 text-xs mt-0.5">{issue.description}</p>
                    <div className="flex items-center gap-3 mt-1.5">
                      {issue.orderId      && <span className="text-forest-200/40 text-xs flex items-center gap-1"><Package className="w-3 h-3" />Order #{issue.orderId}</span>}
                      {issue.restaurantId && <span className="text-forest-200/40 text-xs flex items-center gap-1"><Store className="w-3 h-3" />Rest. #{issue.restaurantId}</span>}
                      {issue.riderId      && <span className="text-forest-200/40 text-xs flex items-center gap-1"><Bike className="w-3 h-3" />Rider #{issue.riderId}</span>}
                    </div>
                  </div>
                  <Link to="/admin/issues">
                    <button className="btn-glow-green text-white text-xs font-semibold px-3 py-1.5 rounded-xl flex-shrink-0">Review</button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass rounded-2xl overflow-hidden">
          <div className="p-4" style={{ borderBottom:"1px solid rgba(255,255,255,.07)" }}>
            <p className="text-white font-semibold">Recent Activity</p>
          </div>
          <div className="divide-y divide-white/5">
            {ACTIVITY.map(a => (
              <div key={a.id} className="p-3 flex items-start gap-2.5 hover:glass transition-all">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${STATUS_DOT[a.status]}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-white text-xs font-medium leading-snug">{a.message}</p>
                  <p className="text-forest-200/40 text-xs mt-0.5">{a.user} · {a.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="glass rounded-2xl p-5">
        <p className="text-white font-semibold mb-4">Quick Actions</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label:"Manage Users",       desc:"View all customers",  icon:Users,   link:"/admin/users" },
            { label:"Manage Restaurants", desc:"Restaurant partners",  icon:Store,   link:"/admin/restaurants" },
            { label:"Manage Riders",      desc:"Delivery riders",      icon:Bike,    link:"/admin/riders" },
            { label:"Create Promo",       desc:"Add promo codes",      icon:Package, link:"/admin/promos" },
          ].map(({ label, desc, icon:Icon, link }) => (
            <Link key={link} to={link}>
              <div className="glass hover:glass-green transition-all rounded-2xl p-4 cursor-pointer group">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 glass group-hover:btn-glow-green rounded-xl flex items-center justify-center transition-all">
                    <Icon className="w-4 h-4 text-forest-200 group-hover:text-white" />
                  </div>
                  <ArrowUpRight className="w-3.5 h-3.5 text-forest-200/30 group-hover:text-forest-200/80 transition-colors" />
                </div>
                <p className="text-white text-sm font-semibold">{label}</p>
                <p className="text-forest-200/40 text-xs mt-0.5">{desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Top Restaurants */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="p-4 flex items-center justify-between" style={{ borderBottom:"1px solid rgba(255,255,255,.07)" }}>
          <p className="text-white font-semibold">Top Restaurants</p>
          <Link to="/admin/restaurants" className="text-ember-400 hover:text-ember-300 text-xs flex items-center gap-1 transition-colors">
            View All <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 p-4">
          {restaurants.slice(0,6).map(r => (
            <div key={r.id} className="glass rounded-2xl overflow-hidden group hover:glass-green transition-all">
              <div className="relative h-28 overflow-hidden">
                <img src={r.image} alt={r.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <span className={`absolute top-2 right-2 text-xs font-semibold px-2 py-0.5 rounded-full ${r.isOpen ? "btn-glow-green text-white" : "bg-red-500/80 text-white"}`}>
                  {r.isOpen ? "Open" : "Closed"}
                </span>
                <p className="absolute bottom-2 left-3 text-white font-semibold text-sm">{r.name}</p>
              </div>
              <div className="px-3 py-2 flex items-center gap-3 text-xs text-forest-200/60">
                <span className="flex items-center gap-1"><Star className="w-3 h-3 fill-ember-400 text-ember-400" />{r.rating}</span>
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{r.deliveryTime}m</span>
                <span className="ml-auto">{r.cuisines[0]}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Active Riders */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="p-4 flex items-center justify-between" style={{ borderBottom:"1px solid rgba(255,255,255,.07)" }}>
          <p className="text-white font-semibold">Active Riders</p>
          <Link to="/admin/riders" className="text-ember-400 hover:text-ember-300 text-xs flex items-center gap-1 transition-colors">
            View All <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 p-4">
          {riders.filter(r => r.status === "active").slice(0,4).map(rider => (
            <div key={rider.id} className="glass rounded-2xl p-4 hover:glass-green transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="w-12 h-12 btn-glow-green rounded-xl flex items-center justify-center text-white font-bold text-lg">
                  {rider.name.charAt(0)}
                </div>
                <span className="text-xs glass-green text-forest-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-forest-400 rounded-full animate-pulse inline-block" /> active
                </span>
              </div>
              <p className="text-white font-semibold text-sm">{rider.name}</p>
              <p className="text-forest-200/50 text-xs flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3" />{rider.zone}</p>
              <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop:"1px solid rgba(255,255,255,.07)" }}>
                <div className="text-center">
                  <p className="text-white font-bold text-lg">{rider.completedToday}</p>
                  <p className="text-forest-200/40 text-xs">Today</p>
                </div>
                <span className="flex items-center gap-1 text-xs text-forest-200/50">
                  <Star className="w-3 h-3 fill-ember-400 text-ember-400" />{rider.rating}
                </span>
                <span className="flex items-center gap-1 text-xs text-forest-200/50">
                  {rider.vehicleType === "truck" ? <Truck className="w-3.5 h-3.5" /> : <Bike className="w-3.5 h-3.5" />}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
