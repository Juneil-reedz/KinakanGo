import { useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationProvider } from './context/NotificationContext';
import { RestaurantProvider } from './context/RestaurantContext';
import { RiderProvider } from './context/RiderContext';
import { AdminProvider } from './context/AdminContext';
import { FavoritesProvider } from './context/FavoritesContext';
import { useRestaurant } from './context/RestaurantContext';
import { useRider } from './context/RiderContext';
import { useAdmin } from './context/AdminContext';
import CustomerLayout from './components/CustomerLayout';
import RestaurantLayout from './components/RestaurantLayout';
import RiderLayout from './components/RiderLayout';
import AdminLayout from './components/AdminLayout';
import Home from './pages/Home';
import Search from './pages/Search';
import FoodDetail from './pages/FoodDetail';
import Restaurants from './pages/Restaurants';
import Restaurant from './pages/Restaurant';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderConfirmation from './pages/OrderConfirmation';
import OrderReceipt from './pages/OrderReceipt';
import OrderTracking from './pages/OrderTracking';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Welcome from './pages/Welcome';
import Favorites from './pages/Favorites';
import Addresses from './pages/Addresses';
import Messages from './pages/Messages';
import Settings from './pages/Settings';
import ChangePassword from './pages/ChangePassword';
import NotFound from './pages/NotFound';
import Notifications from './pages/Notifications';
import { NotificationFeedProvider } from './context/NotificationFeed';
import { request } from './services/api';
import { restaurantRequest } from './context/RestaurantContext';
import { riderRequest } from './context/RiderContext';
import CustomerService from './pages/CustomerService';
import AccountUpgrade from './pages/AccountUpgrade';
import RestaurantOwnerApplication from './pages/RestaurantOwnerApplication';
import RiderApplication from './pages/RiderApplication';
import RestaurantLogin from './pages/restaurant/RestaurantLogin';
import RestaurantDashboard from './pages/restaurant/RestaurantDashboard';
import RestaurantOrders from './pages/restaurant/RestaurantOrders';
import RestaurantMessages from './pages/restaurant/RestaurantMessages';
import RestaurantMenu from './pages/restaurant/RestaurantMenu';
import RestaurantReports from './pages/restaurant/RestaurantReports';
import RestaurantSettings from './pages/restaurant/RestaurantSettings';
import RiderLogin from './pages/rider/RiderLogin';
import RiderDashboard from './pages/rider/RiderDashboard';
import RiderDelivery from './pages/rider/RiderDelivery';
import RiderEarnings from './pages/rider/RiderEarnings';
import RiderHistory from './pages/rider/RiderHistory';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminRestaurants from './pages/admin/AdminRestaurants';
import AdminRiders from './pages/admin/AdminRiders';
import AdminIssues from './pages/admin/AdminIssues';
import AdminPromos from './pages/admin/AdminPromos';
import AdminApplications from './pages/admin/AdminApplications';

function RequireCustomer({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="min-h-screen glass-dark" />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }

  return children;
}

// Login/register screens: someone already signed in is sent on instead of
// seeing a login form (e.g. pressing Back after logging in).
// Decided once, when the page opens — signing in on the page itself is left to
// the page's own redirect.
function GuestOnly({ children, isAuthed, loading, to }) {
  const location = useLocation();
  const authedOnOpen = useRef(null);
  if (loading) return <div className="min-h-screen" />;
  if (authedOnOpen.current === null) authedOnOpen.current = isAuthed;
  if (authedOnOpen.current) return <Navigate to={location.state?.from || to} replace />;
  return children;
}

function CustomerGuest({ children }) {
  const { isAuthenticated, loading } = useAuth();
  return <GuestOnly isAuthed={isAuthenticated} loading={loading} to="/">{children}</GuestOnly>;
}
function OwnerGuest({ children }) {
  const { restaurant, isLoading } = useRestaurant();
  return <GuestOnly isAuthed={!!restaurant} loading={isLoading} to="/owner/dashboard">{children}</GuestOnly>;
}
function RiderGuest({ children }) {
  const { rider, isLoading } = useRider();
  return <GuestOnly isAuthed={!!rider} loading={isLoading} to="/rider/dashboard">{children}</GuestOnly>;
}
function AdminGuest({ children }) {
  const { admin, isLoading } = useAdmin();
  return <GuestOnly isAuthed={!!admin} loading={isLoading} to="/admin/dashboard">{children}</GuestOnly>;
}

// Server notifications for each part of the app (enabled only while signed in there)
function CustomerFeed({ children }) {
  const { isAuthenticated } = useAuth();
  return <NotificationFeedProvider request={request} audience="customer" enabled={isAuthenticated}>{children}</NotificationFeedProvider>;
}
function OwnerFeed({ children }) {
  const { restaurant } = useRestaurant();
  return <NotificationFeedProvider request={restaurantRequest} audience="restaurant" enabled={!!restaurant}>{children}</NotificationFeedProvider>;
}
function RiderFeed({ children }) {
  const { rider } = useRider();
  return <NotificationFeedProvider request={riderRequest} audience="rider" enabled={!!rider}>{children}</NotificationFeedProvider>;
}

function App() {
  return (
    <ThemeProvider>
    <NotificationProvider>
      <AuthProvider>
        <CartProvider>
          <FavoritesProvider>
          <RestaurantProvider>
            <RiderProvider>
              <AdminProvider>
                <Router basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
                  <Routes>
                  {/* Welcome Route */}
                  <Route path="/welcome" element={<Welcome />} />

                  {/* Auth Routes (No Header/Footer) */}
                  <Route path="/login" element={<CustomerGuest><Login /></CustomerGuest>} />
                  <Route path="/register" element={<CustomerGuest><Register /></CustomerGuest>} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password" element={<ResetPassword />} />

                  {/* Cart Route (No Header/Footer/BottomNav) */}
                  <Route path="/cart" element={<RequireCustomer><Cart /></RequireCustomer>} />

                  {/* Checkout Route (No Header/Footer/BottomNav) */}
                  <Route path="/checkout" element={<RequireCustomer><Checkout /></RequireCustomer>} />

                  {/* Food Detail Route (Full Screen) - MUST BE BEFORE CATCH-ALL */}
                  <Route path="/food/:id" element={<RequireCustomer><FoodDetail /></RequireCustomer>} />

                  {/* Customer Routes with Layout */}
                  <Route path="/" element={<RequireCustomer><CustomerFeed><CustomerLayout /></CustomerFeed></RequireCustomer>}>
                    <Route index element={<Home />} />
                    <Route path="search" element={<Search />} />
                    <Route path="restaurants" element={<Restaurants />} />
                    <Route path="restaurant/:id" element={<Restaurant />} />
                    <Route path="order-confirmation/:orderId" element={<OrderConfirmation />} />
                    <Route path="order-receipt/:orderId" element={<OrderReceipt />} />
                    <Route path="orders" element={<OrderTracking />} />
                    <Route path="profile" element={<Profile />} />
                    <Route path="favorites" element={<Favorites />} />
                    <Route path="addresses" element={<Addresses />} />
                    <Route path="messages" element={<Messages />} />
                    <Route path="settings" element={<Settings />} />
                    <Route path="change-password" element={<ChangePassword />} />
                    <Route path="notifications" element={<Notifications />} />
                    <Route path="customer-service" element={<CustomerService />} />
                    <Route path="upgrade" element={<AccountUpgrade />} />
                    <Route path="apply/restaurant-owner" element={<RestaurantOwnerApplication />} />
                    <Route path="apply/rider" element={<RiderApplication />} />
                    <Route path="*" element={<NotFound />} />
                  </Route>

                  {/* Restaurant Owner Portal Routes */}
                  <Route path="/owner/login" element={<OwnerGuest><RestaurantLogin /></OwnerGuest>} />
                  <Route
                    path="/owner/*"
                    element={
                      <OwnerFeed>
                      <RestaurantLayout>
                        <Routes>
                          <Route path="notifications" element={<Notifications />} />
                          <Route path="dashboard" element={<RestaurantDashboard />} />
                          <Route path="orders" element={<RestaurantOrders />} />
                          <Route path="messages" element={<RestaurantMessages />} />
                          <Route path="menu" element={<RestaurantMenu />} />
                          <Route path="reports" element={<RestaurantReports />} />
                          <Route path="settings" element={<RestaurantSettings />} />
                          <Route index element={<Navigate to="dashboard" replace />} />
                          <Route path="*" element={<NotFound homePath="/owner/dashboard" homeLabel="Dashboard" />} />
                        </Routes>
                      </RestaurantLayout>
                      </OwnerFeed>
                    }
                  />

                  {/* Rider Routes */}
                  <Route path="/rider/login" element={<RiderGuest><RiderLogin /></RiderGuest>} />
                  <Route
                    path="/rider/*"
                    element={
                      <RiderFeed>
                      <RiderLayout>
                        <Routes>
                          <Route path="notifications" element={<Notifications />} />
                          <Route path="dashboard" element={<RiderDashboard />} />
                          <Route path="delivery/:orderId" element={<RiderDelivery />} />
                          <Route path="earnings" element={<RiderEarnings />} />
                          <Route path="history" element={<RiderHistory />} />
                          <Route index element={<Navigate to="dashboard" replace />} />
                          <Route path="*" element={<NotFound homePath="/rider/dashboard" homeLabel="Dashboard" />} />
                        </Routes>
                      </RiderLayout>
                      </RiderFeed>
                    }
                  />

                  {/* Admin Routes */}
                  <Route path="/admin/login" element={<AdminGuest><AdminLogin /></AdminGuest>} />
                  <Route
                    path="/admin/*"
                    element={
                      <AdminLayout>
                        <Routes>
                          <Route path="dashboard" element={<AdminDashboard />} />
                          <Route path="users" element={<AdminUsers />} />
                          <Route path="restaurants" element={<AdminRestaurants />} />
                          <Route path="riders" element={<AdminRiders />} />
                          <Route path="issues" element={<AdminIssues />} />
                          <Route path="promos" element={<AdminPromos />} />
                          <Route path="applications" element={<AdminApplications />} />
                          <Route index element={<Navigate to="dashboard" replace />} />
                          <Route path="*" element={<NotFound homePath="/admin/dashboard" homeLabel="Dashboard" />} />
                        </Routes>
                      </AdminLayout>
                    }
                  />
                </Routes>
              </Router>
              </AdminProvider>
            </RiderProvider>
          </RestaurantProvider>
          </FavoritesProvider>
        </CartProvider>
      </AuthProvider>
    </NotificationProvider>
    </ThemeProvider>
  );
}

export default App;
