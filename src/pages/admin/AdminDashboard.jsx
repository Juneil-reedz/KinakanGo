import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAdmin } from "../../context/AdminContext";
import { ordersApi, restaurantsApi, applicationsApi, issuesApi } from "../../services/api";
import {
  Users, Store, Bike, Package, DollarSign, Activity, AlertTriangle,
  TrendingUp, Clock, ArrowUpRight
} from "lucide-react";

const PRIORITY_CLS = { high:"bg-red-500/20 text-red-300 border border-red-500/30", medium:"glass-orange text-ember-200", low:"glass-green text-forest-200" };

export default function AdminDashboard() {
  const { admin } = useAdmin();
  const [stats, setStats]     = useState({ totalRestaurants:0, totalOrders:0, pendingApps:0, pendingIssues:0 });
  const [loading, setLoading] = useState(true);
  const [issues, setIssues]   = useState([]);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [ordersRes, restaurantsRes, appsRes, issuesRes] = await Promise.allSettled([
          ordersApi.list({ limit: 1 }),
          restaurantsApi.list({ limit: 1 }),
          applicationsApi.list({ status: "pending", limit: 1 }),
          issuesApi.list({ status: "pending", limit: 5 }),
        ]);

        setStats({
          totalOrders:      ordersRes.status      === "fulfilled" ? (ordersRes.value.total      || 0) : 0,
          totalRestaurants: restaurantsRes.status === "fulfilled" ? (restaurantsRes.value.total  || 0) : 0,
          pendingApps:      appsRes.status        === "fulfilled" ? (appsRes.value.total         || 0) : 0,
          pendingIssues:    issuesRes.status      === "fulfilled" ? (issuesRes.value.total        || 0) : 0,
        });
        if (issuesRes.status === "fulfilled") {
          setIssues(issuesRes.value.data || []);
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    })();
  }, []);

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
      </div>

      {/* Stat cards */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1,2,3,4].map(i => <div key={i} className="glass rounded-2xl h-28 animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label:"Restaurants",        value:stats.totalRestaurants, icon:Store,   link:"/admin/restaurants" },
            { label:"Total Orders",       value:stats.totalOrders,      icon:Package, link:null },
            { label:"Pending Applications",value:stats.pendingApps,     icon:Users,   link:"/admin/applications" },
            { label:"Pending Issues",     value:stats.pendingIssues,    icon:AlertTriangle, link:"/admin/issues" },
          ].map(({ label, value, icon:Icon, link }) => {
            const card = (
              <div className="glass card-3d rounded-2xl p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-9 h-9 btn-glow-green rounded-xl flex items-center justify-center">
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  {link && <ArrowUpRight className="w-3.5 h-3.5 text-forest-200/30" />}
                </div>
                <p className="text-white font-heading font-bold text-xl leading-tight">{value}</p>
                <p className="text-forest-200/50 text-xs mt-0.5">{label}</p>
              </div>
            );
            return link ? <Link key={label} to={link}>{card}</Link> : <div key={label}>{card}</div>;
          })}
        </div>
      )}

      {/* Revenue / Active Orders / Flagged */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="glass rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-4 h-4 text-forest-300/60" />
            <p className="text-forest-200/50 text-xs">Pending Applications</p>
          </div>
          <p className="text-white font-heading font-bold text-2xl">{stats.pendingApps}</p>
          <p className="text-forest-300 text-xs mt-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-forest-400 rounded-full animate-pulse inline-block" /> Awaiting review
          </p>
        </div>
        <div className="glass rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Package className="w-4 h-4 text-forest-300/60" />
            <p className="text-forest-200/50 text-xs">Total Orders</p>
          </div>
          <p className="text-white font-heading font-bold text-2xl">{stats.totalOrders}</p>
          <p className="text-forest-300 text-xs mt-1 flex items-center gap-0.5"><TrendingUp className="w-3 h-3" /> All time</p>
        </div>
        <Link to="/admin/issues">
          <div className="glass rounded-2xl p-4 hover:glass-orange transition-all cursor-pointer">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-4 h-4 text-ember-400" />
              <p className="text-forest-200/50 text-xs">Flagged Issues</p>
            </div>
            <p className="text-white font-heading font-bold text-2xl">{stats.pendingIssues}</p>
            <p className="text-ember-400 text-xs mt-1 flex items-center gap-0.5"><ArrowUpRight className="w-3 h-3" /> Needs action</p>
          </div>
        </Link>
      </div>

      {/* Flagged Issues */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="p-4 flex items-center justify-between" style={{ borderBottom:"1px solid rgba(255,255,255,.07)" }}>
          <p className="text-white font-semibold">Recent Issues</p>
          <Link to="/admin/issues" className="text-ember-400 hover:text-ember-300 text-xs flex items-center gap-1 transition-colors">
            View All <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        {issues.length === 0 ? (
          <div className="p-8 flex flex-col items-center gap-2">
            <AlertTriangle className="w-8 h-8 text-forest-300/30" />
            <p className="text-forest-200/40 text-sm">No pending issues</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {issues.map(issue => (
              <div key={issue.id} className="p-4 hover:glass transition-all">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${PRIORITY_CLS[issue.priority] || "glass text-forest-200/60"}`}>
                        {(issue.priority || "low").toUpperCase()}
                      </span>
                      <span className="text-forest-200/40 text-xs flex items-center gap-1"><Clock className="w-3 h-3" />{issue.createdAt}</span>
                    </div>
                    <p className="text-white font-semibold text-sm">{issue.title}</p>
                    <p className="text-forest-200/50 text-xs mt-0.5">{issue.description}</p>
                  </div>
                  <Link to="/admin/issues">
                    <button className="btn-glow-green text-white text-xs font-semibold px-3 py-1.5 rounded-xl flex-shrink-0">Review</button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
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
    </div>
  );
}
