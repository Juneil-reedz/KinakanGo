import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useRider } from '../context/RiderContext';
import { useNotification } from '../context/NotificationContext';
import { LayoutDashboard, DollarSign, Bike, Star, Home, LogOut, Menu, X } from 'lucide-react';

const NAV = [
  { path:'/rider/dashboard', label:'Dashboard', icon:LayoutDashboard },
  { path:'/rider/earnings',  label:'Earnings',  icon:DollarSign },
];

export default function RiderLayout({ children }) {
  const location = useLocation();
  const navigate  = useNavigate();
  const { rider, logout } = useRider();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/rider/login'); };

  const isActive = (p) => location.pathname === p;

  const goTo = (path) => {
    setMobileOpen(false);
    navigate(path);
  };

  const SidebarContent = ({ mobile = false }) => (
    <div className="p-5 flex flex-col h-full min-h-[4rem] lg:min-h-screen">
      <div className="flex items-center justify-between mb-8">
        <Link to="/rider/dashboard" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 group">
          <div className="w-11 h-11 btn-glow-orange rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
            <Bike className="w-5 h-5 text-white" />
          </div>
          <div className={mobile ? 'block' : 'hidden lg:block'}>
            <p className="text-white font-heading font-bold text-sm">Rider Portal</p>
            <p className="text-forest-200/50 text-xs">Delivery Dashboard</p>
          </div>
        </Link>
        {mobile && (
          <button onClick={() => setMobileOpen(false)} className="w-9 h-9 glass rounded-xl flex items-center justify-center text-forest-100">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {rider && (
        <div className={`glass rounded-xl p-3 mb-6 ${mobile ? 'block' : 'hidden lg:block'}`}>
          <p className="text-white font-semibold text-sm truncate">{rider.name}</p>
          <div className="flex items-center gap-2 mt-1">
            <Star className="w-3 h-3 fill-ember-400 text-ember-400" />
            <span className="text-ember-300 text-xs">{rider.rating || 'New'}</span>
            {rider.vehicle && <span className="text-forest-200/50 text-xs">· {rider.vehicle}</span>}
          </div>
        </div>
      )}

      <nav className="flex flex-col gap-2">
        {NAV.map(({ path, label, icon:Icon }) => (
          <button key={path} onClick={() => goTo(path)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left
              ${isActive(path) ? 'btn-glow-orange text-white' : 'text-forest-100/60 hover:glass hover:text-white'}`}>
            <Icon className="w-4 h-4 flex-shrink-0" /><span>{label}</span>
          </button>
        ))}
      </nav>

      <div className={`mt-auto pt-4 space-y-1 ${mobile ? 'block' : 'hidden lg:block'}`} style={{ borderTop:'1px solid rgba(255,255,255,.07)' }}>
        {rider && (
          <div className="glass rounded-xl px-3 py-2.5 mb-2">
            <p className="text-white text-xs font-semibold truncate">{rider.name}</p>
            <p className="text-forest-200/50 text-xs truncate">{rider.email}</p>
          </div>
        )}
        <button onClick={() => goTo('/')}
          className="flex items-center gap-2 text-forest-200/50 hover:text-white hover:glass-green text-sm px-3 py-2.5 rounded-xl transition-all w-full">
          <Home className="w-4 h-4" /> Customer Home
        </button>
        <button onClick={handleLogout}
          className="flex items-center gap-2 text-forest-200/50 hover:text-white hover:glass-orange text-sm px-3 py-2.5 rounded-xl transition-all w-full">
          <LogOut className="w-4 h-4" /> Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {mobileOpen && <button aria-label="Close menu" onClick={() => setMobileOpen(false)} className="fixed inset-0 bg-black/60 z-40 lg:hidden" />}

      <aside className={`fixed inset-y-0 left-0 z-50 w-72 glass-dark transform transition-transform duration-300 lg:hidden ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ borderRight:'1px solid rgba(255,255,255,.07)' }}>
        <SidebarContent mobile />
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:block lg:w-64 glass-dark flex-shrink-0" style={{ borderRight:'1px solid rgba(255,255,255,.07)' }}>
        <SidebarContent />
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="glass-dark px-5 py-3 flex items-center justify-between" style={{ borderBottom:'1px solid rgba(255,255,255,.07)' }}>
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(true)} className="lg:hidden w-9 h-9 glass rounded-xl flex items-center justify-center text-forest-100">
              <Menu className="w-4 h-4" />
            </button>
            <p className="text-white font-semibold">{NAV.find(n => isActive(n.path))?.label || 'Rider'}</p>
          </div>
          <button onClick={() => navigate('/')} className="glass text-forest-200/70 hover:text-white hover:glass-green text-xs px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5">
            <Home className="w-3.5 h-3.5" /> Home
          </button>
        </header>
        <main className="flex-1 p-4 pb-24 md:p-6 md:pb-6">{children}</main>
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 glass-dark px-4 py-3 grid grid-cols-3 gap-2" style={{ borderTop:'1px solid rgba(255,255,255,.07)' }}>
          {[
            { path:'/rider/dashboard', label:'Dashboard', icon:LayoutDashboard },
            { path:'/rider/earnings',  label:'Earnings',  icon:DollarSign },
            { path:'/', label:'Home', icon:Home },
          ].map(({ path, label, icon:Icon }) => (
            <button key={path} onClick={() => goTo(path)}
              className={`rounded-xl py-2 flex flex-col items-center gap-1 text-[11px] font-semibold transition-all
                ${isActive(path) ? 'btn-glow-orange text-white' : 'text-forest-200/55'}`}>
              <Icon className="w-4 h-4" />{label}
            </button>
          ))}
        </nav>
        <footer className="hidden lg:block glass-dark px-5 py-3 text-center text-forest-200/40 text-xs" style={{ borderTop:'1px solid rgba(255,255,255,.07)' }}>
          © 2024 KinakanGo Rider Portal
        </footer>
      </div>
    </div>
  );
}
