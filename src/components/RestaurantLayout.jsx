import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useRestaurant } from '../context/RestaurantContext';
import { useNotification } from '../context/NotificationContext';
import { LayoutDashboard, ShoppingBag, UtensilsCrossed, BarChart3, LogOut, ChevronLeft, ChevronRight, Store } from 'lucide-react';
import Button from './Button';

export default function RestaurantLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { restaurant, logout } = useRestaurant();
  const { showSuccess } = useNotification();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const handleLogout = () => {
    logout();
    showSuccess('Logged out successfully');
    navigate('/owner/login');
  };

  const navLinks = [
    { path: '/owner/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/owner/orders', label: 'Orders', icon: ShoppingBag },
    { path: '/owner/menu', label: 'Menu', icon: UtensilsCrossed },
    { path: '/owner/reports', label: 'Reports', icon: BarChart3 },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-[#F5F5F0] flex">
      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 h-full bg-white shadow-sm transition-all duration-300 z-50 ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-20 flex items-center justify-between px-5 border-b border-gray-100">
            {isSidebarOpen ? (
              <Link to="/owner/dashboard" className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-rose-400 to-orange-500 rounded-xl flex items-center justify-center shadow-md">
                  <Store className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="font-bold text-lg leading-tight text-gray-900">
                    {restaurant?.name || 'Restaurant'}
                  </h1>
                  <p className="text-xs text-gray-500">Dashboard Portal</p>
                </div>
              </Link>
            ) : (
              <div className="w-12 h-12 bg-gradient-to-br from-rose-400 to-orange-500 rounded-xl flex items-center justify-center mx-auto shadow-md">
                <Store className="w-7 h-7 text-white" />
              </div>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const active = isActive(link.path);
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    active
                      ? 'bg-gradient-to-r from-rose-400 to-orange-500 text-white shadow-md'
                      : 'text-gray-700 hover:bg-orange-50 hover:text-rose-500'
                  }`}
                  title={!isSidebarOpen ? link.label : ''}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {isSidebarOpen && (
                    <span className="font-medium text-sm">{link.label}</span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User Section */}
          <div className="p-4 border-t border-gray-100">
            {isSidebarOpen ? (
              <div className="mb-3 px-4 py-3 bg-gradient-to-br from-orange-50 to-rose-50 rounded-xl border border-orange-100">
                <p className="font-semibold text-sm text-gray-900 truncate">{restaurant?.name}</p>
                <p className="text-xs text-gray-600 truncate mt-0.5">{restaurant?.email}</p>
              </div>
            ) : null}
            <button
              onClick={handleLogout}
              className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors ${!isSidebarOpen ? 'justify-center' : ''}`}
              title={!isSidebarOpen ? 'Logout' : ''}
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              {isSidebarOpen && <span className="font-medium text-sm">Logout</span>}
            </button>
          </div>

          {/* Toggle Button */}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="absolute -right-3 top-24 w-6 h-6 bg-white border-2 border-orange-200 rounded-full flex items-center justify-center hover:bg-orange-50 transition-colors shadow-sm"
          >
            {isSidebarOpen ? (
              <ChevronLeft className="w-4 h-4 text-orange-600" />
            ) : (
              <ChevronRight className="w-4 h-4 text-orange-600" />
            )}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-20'}`}>
        {/* Top Bar */}
        <header className="h-20 bg-white shadow-sm flex items-center justify-between px-8 border-b border-gray-100">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {navLinks.find(link => isActive(link.path))?.label || 'Dashboard'}
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">Your recent transaction activity and all</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-xl">
              <div className="w-10 h-10 bg-gradient-to-br from-rose-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm">
                {restaurant?.name?.charAt(0) || 'R'}
              </div>
              <div className="text-sm">
                <p className="font-semibold text-gray-900">{restaurant?.name || 'Restaurant'}</p>
                <p className="text-xs text-gray-500">{restaurant?.email}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
