import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { NotificationProvider } from './context/NotificationContext';
import { RestaurantProvider } from './context/RestaurantContext';
import { RiderProvider } from './context/RiderContext';
import { AdminProvider } from './context/AdminContext';
import Header from './components/Header';
import Footer from './components/Footer';
import BottomNav from './components/BottomNav';
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
import Messages from './pages/Messages';
import Settings from './pages/Settings';
import CustomerService from './pages/CustomerService';
import AccountUpgrade from './pages/AccountUpgrade';
import RestaurantOwnerApplication from './pages/RestaurantOwnerApplication';
import RiderApplication from './pages/RiderApplication';
import RestaurantLogin from './pages/restaurant/RestaurantLogin';
import RestaurantDashboard from './pages/restaurant/RestaurantDashboard';
import RestaurantOrders from './pages/restaurant/RestaurantOrders';
import RestaurantMenu from './pages/restaurant/RestaurantMenu';
import RestaurantReports from './pages/restaurant/RestaurantReports';
import RiderLogin from './pages/rider/RiderLogin';
import RiderDashboard from './pages/rider/RiderDashboard';
import RiderDelivery from './pages/rider/RiderDelivery';
import RiderEarnings from './pages/rider/RiderEarnings';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminRestaurants from './pages/admin/AdminRestaurants';
import AdminRiders from './pages/admin/AdminRiders';
import AdminIssues from './pages/admin/AdminIssues';
import AdminPromos from './pages/admin/AdminPromos';
import AdminApplications from './pages/admin/AdminApplications';

function App() {
  return (
    <NotificationProvider>
      <AuthProvider>
        <CartProvider>
          <RestaurantProvider>
            <RiderProvider>
              <AdminProvider>
                <Router basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
                  <Routes>
                  {/* Welcome Route */}
                  <Route path="/welcome" element={<Welcome />} />

                  {/* Auth Routes (No Header/Footer) */}
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password" element={<ResetPassword />} />

                  {/* Cart Route (No Header/Footer/BottomNav) */}
                  <Route path="/cart" element={<Cart />} />

                  {/* Checkout Route (No Header/Footer/BottomNav) */}
                  <Route path="/checkout" element={<Checkout />} />

                  {/* Food Detail Route (Full Screen) - MUST BE BEFORE CATCH-ALL */}
                  <Route path="/food/:id" element={<FoodDetail />} />

                  {/* Customer Routes with Layout */}
                  <Route path="/" element={<CustomerLayout />}>
                    <Route index element={<Home />} />
                    <Route path="search" element={<Search />} />
                    <Route path="restaurants" element={<Restaurants />} />
                    <Route path="restaurant/:id" element={<Restaurant />} />
                    <Route path="order-confirmation/:orderId" element={<OrderConfirmation />} />
                    <Route path="order-receipt/:orderId" element={<OrderReceipt />} />
                    <Route path="orders" element={<OrderTracking />} />
                    <Route path="profile" element={<Profile />} />
                    <Route path="favorites" element={<Favorites />} />
                    <Route path="messages" element={<Messages />} />
                    <Route path="settings" element={<Settings />} />
                    <Route path="customer-service" element={<CustomerService />} />
                    <Route path="upgrade" element={<AccountUpgrade />} />
                    <Route path="apply/restaurant-owner" element={<RestaurantOwnerApplication />} />
                    <Route path="apply/rider" element={<RiderApplication />} />
                  </Route>

                  {/* Restaurant Owner Portal Routes */}
                  <Route path="/owner/login" element={<RestaurantLogin />} />
                  <Route
                    path="/owner/*"
                    element={
                      <RestaurantLayout>
                        <Routes>
                          <Route path="dashboard" element={<RestaurantDashboard />} />
                          <Route path="orders" element={<RestaurantOrders />} />
                          <Route path="menu" element={<RestaurantMenu />} />
                          <Route path="reports" element={<RestaurantReports />} />
                        </Routes>
                      </RestaurantLayout>
                    }
                  />

                  {/* Rider Routes */}
                  <Route path="/rider/login" element={<RiderLogin />} />
                  <Route
                    path="/rider/*"
                    element={
                      <RiderLayout>
                        <Routes>
                          <Route path="dashboard" element={<RiderDashboard />} />
                          <Route path="delivery/:orderId" element={<RiderDelivery />} />
                          <Route path="earnings" element={<RiderEarnings />} />
                        </Routes>
                      </RiderLayout>
                    }
                  />

                  {/* Admin Routes */}
                  <Route path="/admin/login" element={<AdminLogin />} />
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
                        </Routes>
                      </AdminLayout>
                    }
                  />
                </Routes>
              </Router>
              </AdminProvider>
            </RiderProvider>
          </RestaurantProvider>
        </CartProvider>
      </AuthProvider>
    </NotificationProvider>
  );
}

export default App;
