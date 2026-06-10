import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useRider } from '../context/RiderContext';
import { useNotification } from '../context/NotificationContext';
import { LayoutDashboard, DollarSign, LogOut, Bike, Star } from 'lucide-react';

const NAV = [
  { path:'/rider/dashboard', label:'Dashboard', icon:LayoutDashboard },
  { path:'/rider/earnings',  label:'Earnings',  icon:DollarSign },
];

export default function RiderLayout({ children }) {
  const location = useLocation();
  const navigate  = useNavigate();
  const { rider, logout } = useRider();
  const { showSuccess } = useNotification();

  const isActive = (p) => location.pathname === p;

  const handleLogout = () => { logout(); showSuccess('Logged out'); navigate('/rider/login'); };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Sidebar */}
      <aside className="lg:w-64 glass-dark flex-shrink-0" style={{ borderRight:'1px solid rgba(255,255,255,.07)' }}>
        <div className="p-5 flex flex-col h-full min-h-[4rem] lg:min-h-screen">
          {/* Logo */}
          <Link to="/rider/dashboard" className="flex items-center gap-3 mb-8 group">
            <div className="w-11 h-11 btn-glow-orange rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 group-hover:scale-110 transition-transform">🛵</div>
            <div className="hidden lg:block">
              <p className="text-white font-heading font-bold text-sm">Rider Portal</p>
              <p className="text-forest-200/50 text-xs">Delivery Dashboard</p>
            </div>
          </Link>

          {/* Rider chip */}
          {rider && (
            <div className="glass rounded-xl p-3 mb-6 hidden lg:block">
              <p className="text-white font-semibold text-sm truncate">{rider.name}</p>
              <div className="flex items-center gap-2 mt-1">
                <Star className="w-3 h-3 fill-ember-400 text-ember-400" />
                <span className="text-ember-300 text-xs">{rider.rating}</span>
                {rider.vehicle && <span className="text-forest-200/50 text-xs">· {rider.vehicle}</span>}
              </div>
            </div>
          )}

          {/* Nav */}
          <nav className="flex lg:flex-col gap-2">
            {NAV.map(({ path, label, icon:Icon }) => (
              <Link key={path} to={path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                  ${isActive(path) ? 'btn-glow-orange text-white' : 'text-forest-100/60 hover:glass hover:text-white'}`}>
                <Icon className="w-4 h-4 flex-shrink-0" /><span className="hidden lg:inline">{label}</span>
              </Link>
            ))}
          </nav>

          <div className="mt-auto hidden lg:block pt-4" style={{ borderTop:'1px solid rgba(255,255,255,.07)' }}>
            <button onClick={handleLogout}
              className="flex items-center gap-2 text-forest-200/50 hover:text-red-400 text-sm px-3 py-2 rounded-xl hover:glass transition-all w-full">
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="glass-dark px-5 py-3 flex items-center justify-between" style={{ borderBottom:'1px solid rgba(255,255,255,.07)' }}>
          <p className="text-white font-semibold">{NAV.find(n => isActive(n.path))?.label || 'Rider'}</p>
          <button onClick={handleLogout} className="glass text-forest-200/70 hover:text-red-400 text-xs px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5">
            <LogOut className="w-3.5 h-3.5" /> Logout
          </button>
        </header>
        <main className="flex-1 p-4 md:p-6">{children}</main>
        <footer className="glass-dark px-5 py-3 text-center text-forest-200/40 text-xs" style={{ borderTop:'1px solid rgba(255,255,255,.07)' }}>
          © 2024 KinakanGo Rider Portal
        </footer>
      </div>
    </div>
  );
}
