import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAdmin } from '../context/AdminContext';
import { LayoutDashboard, Users, Store, Bike, AlertTriangle, Ticket, LogOut, Shield, Bell, ChevronLeft, ChevronRight, FileText } from 'lucide-react';

const NAV = [
  { path:'/admin/dashboard',    label:'Dashboard',    icon:LayoutDashboard },
  { path:'/admin/users',        label:'Users',        icon:Users },
  { path:'/admin/restaurants',  label:'Restaurants',  icon:Store },
  { path:'/admin/riders',       label:'Riders',       icon:Bike },
  { path:'/admin/applications', label:'Applications', icon:FileText },
  { path:'/admin/issues',       label:'Issues',       icon:AlertTriangle },
  { path:'/admin/promos',       label:'Promos',       icon:Ticket },
];

export default function AdminLayout({ children }) {
  const { admin, isLoading, logout } = useAdmin();
  const location = useLocation();
  const navigate  = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (!isLoading && !admin) navigate('/admin/login', { replace: true });
  }, [admin, isLoading, navigate]);

  const isActive = (p) => location.pathname === p;
  const handleLogout = () => { logout(); navigate('/admin/login'); };

  if (isLoading || !admin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-forest-400/30 border-t-forest-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className={`glass-dark flex-shrink-0 fixed top-0 left-0 h-screen z-50 transition-all duration-300 ${collapsed ? 'w-20' : 'w-64'}`}
        style={{ borderRight:'1px solid rgba(255,255,255,.07)' }}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className={`p-4 flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}
            style={{ borderBottom:'1px solid rgba(255,255,255,.07)' }}>
            <Link to="/admin/dashboard" className="flex items-center gap-3">
              <div className="w-10 h-10 btn-glow-green rounded-xl flex items-center justify-center flex-shrink-0">
                <Shield className="w-5 h-5 text-white" />
              </div>
              {!collapsed && (
                <div>
                  <p className="text-white font-heading font-bold text-sm">Admin Panel</p>
                  <p className="text-forest-200/50 text-xs">KinakanGo</p>
                </div>
              )}
            </Link>
          </div>

          {/* Nav */}
          <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
            {NAV.map(({ path, label, icon:Icon }) => (
              <Link key={path} to={path} title={collapsed ? label : ''}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                  ${collapsed ? 'justify-center' : ''}
                  ${isActive(path) ? 'btn-glow-green text-white' : 'text-forest-100/60 hover:glass hover:text-white'}`}>
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span>{label}</span>}
              </Link>
            ))}
          </nav>

          {/* User footer */}
          <div className="px-3 pb-4 space-y-2" style={{ borderTop:'1px solid rgba(255,255,255,.07)', paddingTop:'1rem' }}>
            {!collapsed && admin && (
              <div className="glass rounded-xl px-3 py-2.5">
                <p className="text-white text-xs font-semibold truncate">{admin.name}</p>
                <p className="text-forest-200/50 text-xs capitalize truncate">{admin.role?.replace('_',' ')}</p>
              </div>
            )}
            <button onClick={handleLogout} title={collapsed ? 'Logout' : ''}
              className={`flex items-center gap-2 w-full px-3 py-2 rounded-xl text-forest-200/50 hover:text-red-400 hover:glass text-sm transition-all ${collapsed ? 'justify-center' : ''}`}>
              <LogOut className="w-4 h-4" />{!collapsed && 'Logout'}
            </button>
          </div>

          {/* Collapse toggle */}
          <button onClick={() => setCollapsed(c=>!c)}
            className="absolute -right-3 top-20 w-6 h-6 glass rounded-full flex items-center justify-center hover:glass-green transition-all z-10">
            {collapsed ? <ChevronRight className="w-3.5 h-3.5 text-forest-200" /> : <ChevronLeft className="w-3.5 h-3.5 text-forest-200" />}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${collapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
        {/* Top bar */}
        <header className="glass-dark sticky top-0 z-30 px-5 py-3 flex items-center justify-between"
          style={{ borderBottom:'1px solid rgba(255,255,255,.07)' }}>
          <h2 className="text-white font-heading font-bold">
            {NAV.find(n => isActive(n.path))?.label || 'Dashboard'}
          </h2>
          <div className="flex items-center gap-2">
            <button className="relative w-8 h-8 glass rounded-xl flex items-center justify-center text-forest-200/60 hover:text-white transition-all">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-ember-500 rounded-full animate-pulse" />
            </button>
            <div className="w-8 h-8 btn-glow-green rounded-xl flex items-center justify-center text-white text-sm font-bold">
              {admin?.name?.charAt(0).toUpperCase() || 'A'}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-6 overflow-auto">{children}</main>

        <footer className="glass-dark px-5 py-3 text-center text-forest-200/40 text-xs"
          style={{ borderTop:'1px solid rgba(255,255,255,.07)' }}>
          © {new Date().getFullYear()} KinakanGo Admin Panel
        </footer>
      </div>
    </div>
  );
}
