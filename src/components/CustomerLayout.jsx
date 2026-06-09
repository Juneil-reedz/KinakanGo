import { useState } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import {
  Home as HomeIcon,
  ShoppingBag,
  Heart,
  MessageCircle,
  Clock,
  FileText,
  Settings,
  Search,
  Bell,
  ShoppingCart,
  Menu,
  ChevronLeft,
  Wallet,
  CreditCard,
  MapPin,
  Plus,
  Minus,
  X,
  Crown,
  Utensils
} from 'lucide-react';

export default function CustomerLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { cartItems, updateQuantity, removeFromCart, getCartTotal } = useCart();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const balance = 12.00;

  // Determine active page based on current location
  const getActivePage = () => {
    const path = location.pathname;
    if (path === '/') return 'dashboard';
    if (path.startsWith('/restaurants') || path.startsWith('/restaurant/')) return 'food-order';
    if (path === '/favorites') return 'favorite';
    if (path === '/messages') return 'message';
    if (path === '/orders') return 'order-history';
    if (path === '/bills') return 'bills';
    if (path === '/settings') return 'setting';
    if (path === '/upgrade') return 'upgrade';
    return 'dashboard';
  };

  const activePage = getActivePage();

  // Navigation handler
  const handleNavigation = (page) => {
    if (page === 'dashboard') {
      navigate('/');
    } else if (page === 'food-order') {
      navigate('/restaurants');
    } else if (page === 'favorite') {
      navigate('/favorites');
    } else if (page === 'message') {
      navigate('/messages');
    } else if (page === 'order-history') {
      navigate('/orders');
    } else if (page === 'bills') {
      navigate('/bills');
    } else if (page === 'setting') {
      navigate('/settings');
    } else if (page === 'upgrade') {
      navigate('/upgrade');
    }
  };

  // Search handler
  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  // Handle search on Enter key
  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      navigate(`/restaurants?search=${encodeURIComponent(searchQuery)}`);
      setSearchQuery(''); // Clear search after navigation
    }
  };

  // Update quantity in cart
  const handleUpdateQuantity = (id, delta) => {
    const item = cartItems.find(i => i.id === id);
    if (item) {
      const newQuantity = item.quantity + delta;
      if (newQuantity > 0) {
        updateQuantity(id, newQuantity);
      } else {
        removeFromCart(id);
      }
    }
  };

  // Remove item from cart
  const handleRemoveFromCart = (id) => {
    removeFromCart(id);
  };

  // Checkout handler
  const handleCheckout = () => {
    if (cartItems.length === 0) {
      alert('Your cart is empty!');
      return;
    }
    navigate('/checkout');
  };

  return (
    <div className="flex h-screen bg-[#EBD5AB] overflow-hidden">
      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Left Sidebar */}
      <aside className={`bg-[#628141] flex flex-col shadow-sm transition-all duration-300 overflow-hidden
        ${sidebarCollapsed ? 'w-20' : 'w-64'}
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        fixed lg:relative lg:translate-x-0 h-full z-50`}>
        {/* Logo and Toggle */}
        <div className={`flex items-center ${sidebarCollapsed ? 'justify-center py-4' : 'justify-between -mt-4'}`}>
          {!sidebarCollapsed && (
            <div className="flex-1 flex items-center justify-center">
              <img
                src="/assets/KINAKANGO.gif"
                alt="KINAKAN GO"
                className="w-full h-auto object-contain"
              />
            </div>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-2 hover:bg-[#8BAE66] rounded-lg transition-colors flex-shrink-0"
          >
            {sidebarCollapsed ? <Menu className="w-5 h-5 text-[#EBD5AB]" /> : <ChevronLeft className="w-5 h-5 text-[#EBD5AB]" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className={`flex-1 px-4 overflow-y-auto scrollbar-hide ${sidebarCollapsed ? 'pt-2' : '-mt-6'}`}>
          <div className="space-y-0.5">
            <button
              onClick={() => handleNavigation('dashboard')}
              className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'} px-4 py-2 rounded-xl font-medium transition-all ${
                activePage === 'dashboard'
                  ? 'bg-[#E67E22] text-white shadow-md'
                  : 'text-[#EBD5AB] hover:bg-[#8BAE66]'
              }`}
              title="Dashboard"
            >
              <HomeIcon className="w-5 h-5" />
              {!sidebarCollapsed && <span>Dashboard</span>}
            </button>
            <button
              onClick={() => handleNavigation('food-order')}
              className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'} px-4 py-2 rounded-xl font-medium transition-all ${
                activePage === 'food-order'
                  ? 'bg-[#E67E22] text-white shadow-md'
                  : 'text-[#EBD5AB] hover:bg-[#8BAE66]'
              }`}
              title="Food Order"
            >
              <ShoppingBag className="w-5 h-5" />
              {!sidebarCollapsed && <span>Food Order</span>}
            </button>
            <button
              onClick={() => handleNavigation('favorite')}
              className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'} px-4 py-2 rounded-xl font-medium transition-all ${
                activePage === 'favorite'
                  ? 'bg-[#E67E22] text-white shadow-md'
                  : 'text-[#EBD5AB] hover:bg-[#8BAE66]'
              }`}
              title="Favorite"
            >
              <Heart className="w-5 h-5" />
              {!sidebarCollapsed && <span>Favorite</span>}
            </button>
            <button
              onClick={() => handleNavigation('message')}
              className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'} px-4 py-2 rounded-xl font-medium transition-all ${
                activePage === 'message'
                  ? 'bg-[#E67E22] text-white shadow-md'
                  : 'text-[#EBD5AB] hover:bg-[#8BAE66]'
              }`}
              title="Message"
            >
              <MessageCircle className="w-5 h-5" />
              {!sidebarCollapsed && <span>Message</span>}
            </button>
            <button
              onClick={() => handleNavigation('order-history')}
              className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'} px-4 py-2 rounded-xl font-medium transition-all ${
                activePage === 'order-history'
                  ? 'bg-[#E67E22] text-white shadow-md'
                  : 'text-[#EBD5AB] hover:bg-[#8BAE66]'
              }`}
              title="Order History"
            >
              <Clock className="w-5 h-5" />
              {!sidebarCollapsed && <span>Order History</span>}
            </button>
            <button
              onClick={() => handleNavigation('bills')}
              className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'} px-4 py-2 rounded-xl font-medium transition-all ${
                activePage === 'bills'
                  ? 'bg-[#E67E22] text-white shadow-md'
                  : 'text-[#EBD5AB] hover:bg-[#8BAE66]'
              }`}
              title="Bills"
            >
              <FileText className="w-5 h-5" />
              {!sidebarCollapsed && <span>Bills</span>}
            </button>
            <button
              onClick={() => handleNavigation('setting')}
              className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'} px-4 py-2 rounded-xl font-medium transition-all ${
                activePage === 'setting'
                  ? 'bg-[#E67E22] text-white shadow-md'
                  : 'text-[#EBD5AB] hover:bg-[#8BAE66]'
              }`}
              title="Settings"
            >
              <Settings className="w-5 h-5" />
              {!sidebarCollapsed && <span>Settings</span>}
            </button>
          </div>
        </nav>

        {/* Upgrade Card */}
        {!sidebarCollapsed && (
          <div className="p-4">
            <div className="bg-[#E67E22] rounded-2xl p-4 text-white">
              <h3 className="font-bold mb-2">Upgrade your Account</h3>
              <p className="text-sm mb-3 text-white/90">Enjoy all the benefits and explore more features</p>
              <button
                onClick={() => handleNavigation('upgrade')}
                className="w-full bg-white text-[#E67E22] font-bold py-2 rounded-lg text-sm hover:bg-[#EBD5AB] transition-colors"
              >
                Upgrade
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto scrollbar-hide pb-16 lg:pb-0">
        {/* Header */}
        <header className="bg-white border-b border-gray-100 px-3 xs:px-4 md:px-6 lg:px-8 py-3 md:py-4 sticky top-0 z-10">
          <div className="flex items-center justify-between gap-2 xs:gap-3 md:gap-6">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <Menu className="w-5 h-5 text-gray-700" />
            </button>

            <h2 className="text-base xs:text-lg md:text-xl font-semibold text-gray-900 truncate hidden lg:block">
              Hello, {user?.name || 'Patricia'}
            </h2>

            {/* Search bar - visible on all screens on homepage */}
            {location.pathname === '/' && (
              <div className="flex items-center gap-2 xs:gap-4 flex-1 max-w-2xl">
                <div className="relative flex-1">
                  <Search className="absolute left-2 xs:left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 xs:w-4 xs:h-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={handleSearch}
                    onKeyPress={handleSearchKeyPress}
                    placeholder="Search food..."
                    className="w-full pl-8 xs:pl-10 pr-3 xs:pr-4 py-1.5 xs:py-2 bg-[#8BAE66] border-none rounded-lg xs:rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E67E22] text-white placeholder-white/70 text-xs xs:text-sm"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 xs:gap-3">
              <button
                onClick={() => navigate('/cart')}
                className="relative p-2 hover:bg-gray-50 rounded-lg transition-colors hidden lg:flex"
              >
                <ShoppingCart className="w-5 h-5 text-gray-700" />
                {cartItems.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                    {cartItems.length}
                  </span>
                )}
              </button>
              <button className="relative p-2 hover:bg-gray-50 rounded-lg transition-colors hidden xs:flex">
                <Bell className="w-5 h-5 text-gray-700" />
              </button>
              <button
                onClick={() => navigate('/profile')}
                className="w-8 h-8 xs:w-10 xs:h-10 rounded-full overflow-hidden border-2 border-yellow-400 hover:border-yellow-500 transition-colors flex-shrink-0"
              >
                {user?.profileImage ? (
                  <img src={user.profileImage} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <img
                    src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop"
                    alt="User"
                    className="w-full h-full object-cover"
                  />
                )}
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-3 xs:p-4 sm:p-5 md:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>

      {/* Right Sidebar - Cart or Video (Hidden on mobile) */}
      <aside className="hidden xl:block w-96 shadow-sm overflow-y-auto scrollbar-hide" style={{ backgroundColor: (['favorite', 'message', 'order-history', 'bills', 'setting', 'upgrade'].includes(activePage)) ? '#E67E22' : 'white' }}>
        {/* Show video for specific pages */}
        {(['favorite', 'message', 'order-history', 'bills', 'setting', 'upgrade'].includes(activePage)) ? (
          <div className="h-full flex flex-col items-center justify-center p-6 space-y-6">
            {/* Top Section - Slogan and Icons */}
            <div className="text-center space-y-3">
              <div className="flex items-center justify-center gap-4 text-white">
                <Utensils className="w-8 h-8" />
                <ShoppingBag className="w-8 h-8" />
                <Heart className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-white">
                Tap it. Get it.
              </h3>
              <p className="text-white/90 text-lg font-medium">
                Bongao Taste
              </p>
            </div>

            {/* Video */}
            <video
              src="/assets/sidebar-video.mp4"
              poster="/assets/sidebar-video.mp4"
              className="w-full h-auto object-contain border-8 border-white rounded-2xl shadow-2xl"
              autoPlay
              loop
              muted
              playsInline
            />

            {/* Bottom Section - Delivery Info */}
            <div className="text-center space-y-3">
              <p className="text-white text-lg font-semibold">
                🚀 Fast & Fresh Delivery
              </p>
              <div className="flex items-center justify-center gap-6 text-white">
                <div className="flex flex-col items-center">
                  <Clock className="w-6 h-6 mb-1" />
                  <span className="text-sm">30 mins</span>
                </div>
                <div className="flex flex-col items-center">
                  <MapPin className="w-6 h-6 mb-1" />
                  <span className="text-sm">Track Order</span>
                </div>
                <div className="flex flex-col items-center">
                  <CreditCard className="w-6 h-6 mb-1" />
                  <span className="text-sm">Easy Pay</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6 space-y-6">
          {/* Balance Card */}
          <div className="bg-gradient-to-br from-[#628141] to-[#8BAE66] rounded-2xl p-6 text-white">
            <p className="text-sm mb-2">Your Balance</p>
            <h3 className="text-3xl font-bold mb-4">${balance.toFixed(2)}</h3>
            <div className="flex gap-2">
              <button className="flex-1 bg-white text-[#E67E22] font-semibold py-2 rounded-lg text-sm hover:bg-[#EBD5AB] flex items-center justify-center gap-1">
                <CreditCard className="w-4 h-4" />
                Deposit
              </button>
              <button className="flex-1 bg-white text-[#E67E22] font-semibold py-2 rounded-lg text-sm hover:bg-[#EBD5AB] flex items-center justify-center gap-1">
                <Wallet className="w-4 h-4" />
                Withdraw
              </button>
            </div>
          </div>

          {/* Address */}
          <div className="border border-gray-200 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-gray-900">Your Address</h4>
              <button className="text-yellow-600 text-sm font-medium">Change</button>
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
              <p className="text-sm text-gray-600">Elm Street, 23</p>
            </div>
          </div>

          {/* Order Menu */}
          <div>
            <h4 className="font-bold text-gray-900 mb-4">Order Menu</h4>
            {cartItems.length > 0 ? (
              <div className="space-y-3 mb-6">
                {cartItems.map(item => (
                  <div key={item.id} className="flex items-center gap-3 relative group">
                    <button
                      onClick={() => handleRemoveFromCart(item.id)}
                      className="absolute -top-1 -left-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 z-10"
                      title="Remove from cart"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-16 h-16 rounded-xl object-cover"
                    />
                    <div className="flex-1">
                      <h5 className="font-semibold text-sm text-gray-900">{item.name}</h5>
                      <p className="text-[#E67E22] font-bold text-sm">${item.price}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleUpdateQuantity(item.id, -1)}
                        className="w-6 h-6 bg-[#8BAE66] rounded-lg flex items-center justify-center hover:bg-[#7a9e5c]"
                      >
                        <Minus className="w-3 h-3 text-white" />
                      </button>
                      <span className="text-sm font-semibold w-4 text-center">{item.quantity}</span>
                      <button
                        onClick={() => handleUpdateQuantity(item.id, 1)}
                        className="w-6 h-6 bg-[#8BAE66] rounded-lg flex items-center justify-center hover:bg-[#7a9e5c]"
                      >
                        <Plus className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 mb-6">
                <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">Your cart is empty</p>
              </div>
            )}

            {/* Coupon */}
            <div className="mb-4">
              <button className="w-full text-left p-3 border border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-yellow-400 hover:text-yellow-600">
                Have a coupon code?
              </button>
            </div>

            {/* Total */}
            <div className="bg-[#8BAE66] rounded-xl p-4 mb-4">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white">Total</span>
                <span className="text-2xl font-bold text-white">${getCartTotal().toFixed(2)}</span>
              </div>
            </div>

            {/* Checkout Button */}
            <button
              onClick={handleCheckout}
              disabled={cartItems.length === 0}
              className={`w-full font-bold py-4 rounded-xl shadow-lg transition-all ${
                cartItems.length === 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-[#E67E22] text-white hover:bg-[#d4721d] active:scale-95'
              }`}
            >
              Checkout
            </button>
          </div>
        </div>
        )}
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 lg:hidden z-30">
        <div className="flex items-center justify-around px-2 py-2">
          <button
            onClick={() => handleNavigation('dashboard')}
            className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors flex-1 ${
              activePage === 'dashboard' ? 'text-[#E67E22]' : 'text-gray-600'
            }`}
          >
            <HomeIcon className="w-5 h-5" />
            <span className="text-xs mt-1">Home</span>
          </button>
          <button
            onClick={() => handleNavigation('food-order')}
            className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors flex-1 ${
              activePage === 'food-order' ? 'text-[#E67E22]' : 'text-gray-600'
            }`}
          >
            <ShoppingBag className="w-5 h-5" />
            <span className="text-xs mt-1">Order</span>
          </button>
          <button
            onClick={() => navigate('/cart')}
            className="flex flex-col items-center justify-center p-2 rounded-lg transition-colors flex-1 relative text-gray-600"
          >
            <ShoppingCart className="w-5 h-5" />
            {cartItems.length > 0 && (
              <span className="absolute top-1 right-1/2 translate-x-2 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
                {cartItems.length}
              </span>
            )}
            <span className="text-xs mt-1">Cart</span>
          </button>
          <button
            onClick={() => handleNavigation('favorite')}
            className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors flex-1 ${
              activePage === 'favorite' ? 'text-[#E67E22]' : 'text-gray-600'
            }`}
          >
            <Heart className="w-5 h-5" />
            <span className="text-xs mt-1">Favorites</span>
          </button>
          <button
            onClick={() => handleNavigation('order-history')}
            className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors flex-1 ${
              activePage === 'order-history' ? 'text-[#E67E22]' : 'text-gray-600'
            }`}
          >
            <Clock className="w-5 h-5" />
            <span className="text-xs mt-1">Orders</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
