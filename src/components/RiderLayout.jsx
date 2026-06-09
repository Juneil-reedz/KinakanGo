import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useRider } from '../context/RiderContext';
import { useNotification } from '../context/NotificationContext';
import Button from './Button';

export default function RiderLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { rider, logout } = useRider();
  const { showSuccess } = useNotification();

  const handleLogout = () => {
    logout();
    showSuccess('Logged out successfully');
    navigate('/rider/login');
  };

  const navLinks = [
    { path: '/rider/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/rider/earnings', label: 'Earnings', icon: '💰' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-secondary-50">
      {/* Header */}
      <header className="bg-white border-b border-secondary-200 sticky top-0 z-50">
        <div className="container-custom">
          <div className="flex items-center justify-between h-14 xs:h-16">
            {/* Logo */}
            <Link to="/rider/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 xs:w-10 xs:h-10 bg-primary-600 rounded-lg flex items-center justify-center text-lg xs:text-xl">
                🏍️
              </div>
              <div>
                <h1 className="font-heading font-bold text-base xs:text-lg leading-tight">
                  Rider Portal
                </h1>
                <p className="text-xs text-secondary-600 hidden xs:block">Delivery Dashboard</p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    isActive(link.path)
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-secondary-700 hover:bg-secondary-100'
                  }`}
                >
                  <span className="mr-2">{link.icon}</span>
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* User Menu */}
            <div className="flex items-center gap-2 xs:gap-4">
              <div className="hidden sm:block text-right">
                <p className="font-medium text-xs xs:text-sm">{rider?.name}</p>
                <div className="flex items-center gap-2 text-xs text-secondary-600">
                  <span>⭐ {rider?.rating}</span>
                  <span className="hidden md:inline">•</span>
                  <span className="hidden md:inline">{rider?.vehicle}</span>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <span className="hidden xs:inline">Logout</span>
                <span className="xs:hidden">Exit</span>
              </Button>
            </div>
          </div>

          {/* Mobile Navigation */}
          <nav className="md:hidden flex items-center gap-1 overflow-x-auto pb-2 -mx-2 px-2">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-3 py-2 rounded-lg font-medium whitespace-nowrap transition-colors text-sm ${
                  isActive(link.path)
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-secondary-700 hover:bg-secondary-100'
                }`}
              >
                <span className="mr-1">{link.icon}</span>
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="container-custom py-4 xs:py-6 md:py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-secondary-200 mt-12">
        <div className="container-custom py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-secondary-600">
              &copy; 2024 Food Delivery. All rights reserved.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-sm text-secondary-600 hover:text-primary-600 transition-colors">
                Help Center
              </a>
              <a href="#" className="text-sm text-secondary-600 hover:text-primary-600 transition-colors">
                Contact Support
              </a>
              <Link to="/" className="text-sm text-secondary-600 hover:text-primary-600 transition-colors">
                View Customer Site
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
