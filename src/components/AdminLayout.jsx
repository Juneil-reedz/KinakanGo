import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAdmin } from '../context/AdminContext';
import Button from './Button';
import {
  LayoutDashboard,
  Users,
  Store,
  Bike,
  AlertTriangle,
  Ticket,
  LogOut,
  Shield,
  Bell,
  Settings,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  FileText
} from 'lucide-react';

export default function AdminLayout({ children }) {
  const { admin, logout } = useAdmin();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const navItems = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/admin/users', label: 'Users', icon: Users },
    { path: '/admin/restaurants', label: 'Restaurants', icon: Store },
    { path: '/admin/riders', label: 'Riders', icon: Bike },
    { path: '/admin/applications', label: 'Applications', icon: FileText },
    { path: '/admin/issues', label: 'Issues', icon: AlertTriangle },
    { path: '/admin/promos', label: 'Promos', icon: Ticket },
  ];

  const isActive = (path) => {
    return location.pathname === path;
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary-50 via-white to-secondary-50">
      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-screen bg-white border-r border-secondary-200 shadow-xl transition-all duration-300 ${
          isSidebarOpen ? 'w-64' : 'w-20'
        }`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-4 border-b border-secondary-200">
          <Link
            to="/admin/dashboard"
            className={`flex items-center gap-3 group ${!isSidebarOpen && 'justify-center'}`}
          >
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-200 group-hover:scale-105 transition-transform duration-200 shrink-0">
              <Shield className="w-6 h-6 text-white" />
            </div>
            {isSidebarOpen && (
              <div>
                <h1 className="font-heading font-bold text-lg bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">
                  Admin Panel
                </h1>
              </div>
            )}
          </Link>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-2">
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-3 rounded-xl font-medium transition-all duration-200 group ${
                    active
                      ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-200'
                      : 'text-secondary-700 hover:bg-secondary-100 hover:text-primary-600'
                  } ${!isSidebarOpen && 'justify-center'}`}
                  title={!isSidebarOpen ? item.label : ''}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  {isSidebarOpen && <span className="text-sm font-semibold">{item.label}</span>}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Sidebar Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-secondary-200 bg-white">
          {isSidebarOpen ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 px-2">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold shadow-md shrink-0">
                  {admin?.name?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-secondary-900 truncate">{admin?.name}</p>
                  <p className="text-xs text-secondary-600 capitalize truncate">
                    {admin?.role?.replace('_', ' ')}
                  </p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 hover:border-red-300 transition-colors font-medium"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm">Logout</span>
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Toggle Button */}
        <button
          onClick={toggleSidebar}
          className="absolute -right-3 top-20 w-6 h-6 bg-white border border-secondary-200 rounded-full flex items-center justify-center shadow-md hover:bg-primary-50 hover:border-primary-300 transition-colors"
        >
          {isSidebarOpen ? (
            <ChevronLeft className="w-4 h-4 text-secondary-600" />
          ) : (
            <ChevronRight className="w-4 h-4 text-secondary-600" />
          )}
        </button>
      </aside>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={toggleMobileMenu}
        ></div>
      )}

      {/* Main Content Area */}
      <div
        className={`transition-all duration-300 ${
          isSidebarOpen ? 'lg:ml-64' : 'lg:ml-20'
        }`}
      >
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-secondary-200 shadow-sm">
          <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
            {/* Mobile Menu Button */}
            <button
              onClick={toggleMobileMenu}
              className="lg:hidden p-2 text-secondary-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Page Title - Hidden on mobile, shown on desktop */}
            <div className="hidden lg:block">
              <h2 className="text-xl font-heading font-bold text-secondary-900">
                {navItems.find(item => isActive(item.path))?.label || 'Dashboard'}
              </h2>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-3 ml-auto">
              {/* Notifications */}
              <button className="relative p-2 text-secondary-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              </button>

              {/* Settings */}
              <button className="p-2 text-secondary-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="px-4 sm:px-6 lg:px-8">
          {children}
        </main>

        {/* Footer */}
        <footer className="mt-12 py-8 border-t border-secondary-200 bg-white/50 backdrop-blur-sm">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary-500" />
                <p className="text-sm text-secondary-600 font-medium">
                  Admin Panel - Food Delivery Platform Management
                </p>
              </div>
              <div className="flex items-center gap-6 text-sm">
                <button className="text-secondary-600 hover:text-primary-600 transition-colors font-medium">
                  Help
                </button>
                <button className="text-secondary-600 hover:text-primary-600 transition-colors font-medium">
                  Documentation
                </button>
                <button className="text-secondary-600 hover:text-primary-600 transition-colors font-medium">
                  Support
                </button>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-secondary-100 text-center">
              <p className="text-xs text-secondary-500">
                &copy; {new Date().getFullYear()} Food Delivery Platform. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
