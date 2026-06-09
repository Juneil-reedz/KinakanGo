import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import Button from './Button';

export default function Header() {
  const { getCartCount } = useCart();
  const { isAuthenticated, user } = useAuth();

  return (
    <header className="bg-white sticky top-0 z-40 border-b border-secondary-100">
      <div className="container-custom">
        <div className="flex items-center justify-between py-4">
          {/* Left: Profile Picture */}
          <Link to={isAuthenticated ? "/profile" : "/login"} className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-md">
              <img
                src={user?.profileImage || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop"}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </div>
          </Link>

          {/* Center: Title */}
          <Link to="/" className="flex flex-col items-center justify-center flex-1 mx-6">
            <h1 className="text-xl font-heading font-bold text-primary-600 leading-tight">
              Kinakan
            </h1>
            <div className="bg-white text-primary-600 px-3 py-0.5 rounded-lg font-heading font-bold text-lg shadow-md border border-gray-200 transform -rotate-2">
              Go
            </div>
          </Link>

          {/* Right: Notification Bell */}
          <button className="relative w-10 h-10 rounded-full bg-white border border-secondary-200 flex items-center justify-center hover:bg-secondary-50 transition-colors">
            <svg className="w-5 h-5 text-secondary-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {getCartCount() > 0 && (
              <span className="absolute top-0 right-0 w-2 h-2 bg-primary-600 rounded-full"></span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
