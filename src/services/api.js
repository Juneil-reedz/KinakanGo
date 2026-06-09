// On GitHub Pages there is no backend — use the live server URL if provided via env, else empty (mock fallback kicks in)
const BASE = import.meta.env.VITE_API_URL || '/api';

function getToken() {
  try {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    const rider = JSON.parse(localStorage.getItem('rider') || 'null');
    const admin = JSON.parse(localStorage.getItem('admin') || 'null');
    const restaurant = JSON.parse(localStorage.getItem('restaurant') || 'null');
    return user?.token || rider?.token || admin?.token || restaurant?.token || null;
  } catch {
    return null;
  }
}

async function request(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

// Restaurant APIs
export const getRestaurants = (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.category && filters.category !== 'all') params.set('category', filters.category);
  if (filters.search) params.set('search', filters.search);
  if (filters.sortBy) params.set('sortBy', filters.sortBy);
  return request(`/restaurants?${params}`);
};

export const getRestaurantById = (id) => request(`/restaurants/${id}`);

export const getFeaturedRestaurants = (limit = 6) => request(`/restaurants/featured?limit=${limit}`);

// Menu APIs
export const getMenuByRestaurantId = (restaurantId, categoryFilter = 'all') => {
  const params = new URLSearchParams();
  if (categoryFilter !== 'all') params.set('category', categoryFilter);
  return request(`/menu/restaurants/${restaurantId}/menu?${params}`);
};

export const getMenuItem = (itemId) => request(`/menu/${itemId}`);

export const getAllMenuItems = (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.category && filters.category !== 'all') params.set('category', filters.category);
  if (filters.search) params.set('search', filters.search);
  if (filters.sortBy) params.set('sortBy', filters.sortBy);
  return request(`/menu?${params}`);
};

// Order APIs
export const getUserOrders = (userId) => request(`/orders/users/${userId}/orders`);

export const getOrderById = (orderId) => request(`/orders/${orderId}`);

export const createOrder = (orderData) =>
  request('/orders', { method: 'POST', body: JSON.stringify(orderData) });

export const updateOrderStatus = (orderId, status, extra = {}) =>
  request(`/orders/${orderId}/status`, { method: 'PUT', body: JSON.stringify({ status, ...extra }) });

// Category APIs
export const getCategories = () => request('/categories');

// User APIs
export const getUserProfile = (userId) => request(`/users/${userId}`);

export const updateUserProfile = (userId, userData) =>
  request(`/users/${userId}`, { method: 'PUT', body: JSON.stringify(userData) });

export const getUserFavorites = (userId) => request(`/users/${userId}/favorites`);

export const addToFavorites = (userId, restaurantId) =>
  request(`/users/${userId}/favorites/${restaurantId}`, { method: 'POST' });

export const removeFromFavorites = (userId, restaurantId) =>
  request(`/users/${userId}/favorites/${restaurantId}`, { method: 'DELETE' });

// Address APIs
export const addAddress = (userId, address) =>
  request(`/users/${userId}/addresses`, { method: 'POST', body: JSON.stringify(address) });

export const updateAddress = (userId, addressId, data) =>
  request(`/users/${userId}/addresses/${addressId}`, { method: 'PUT', body: JSON.stringify(data) });

export const deleteAddress = (userId, addressId) =>
  request(`/users/${userId}/addresses/${addressId}`, { method: 'DELETE' });

// Payment method APIs
export const addPaymentMethod = (userId, payment) =>
  request(`/users/${userId}/payment-methods`, { method: 'POST', body: JSON.stringify(payment) });

export const deletePaymentMethod = (userId, pmId) =>
  request(`/users/${userId}/payment-methods/${pmId}`, { method: 'DELETE' });

// Auth APIs
export const login = (email, password) =>
  request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });

export const register = (userData) =>
  request('/auth/register', { method: 'POST', body: JSON.stringify(userData) });

export const riderLogin = (email, password) =>
  request('/auth/rider/login', { method: 'POST', body: JSON.stringify({ email, password }) });

export const adminLogin = (email, password) =>
  request('/auth/admin/login', { method: 'POST', body: JSON.stringify({ email, password }) });

export const restaurantLogin = (email, password) =>
  request('/auth/restaurant/login', { method: 'POST', body: JSON.stringify({ email, password }) });

// Search API
export const searchAll = (query) => request(`/search?query=${encodeURIComponent(query)}`);

// Admin APIs
export const getAdminStats = () => request('/admin/stats');
export const getAdminUsers = () => request('/admin/users');
export const getAdminRestaurants = () => request('/admin/restaurants');
export const getAdminRiders = () => request('/admin/riders');
export const getAdminOrders = (status) => request(`/admin/orders${status ? `?status=${status}` : ''}`);
export const getAdminApplications = (filters = {}) => {
  const params = new URLSearchParams(filters);
  return request(`/admin/applications?${params}`);
};
export const updateApplication = (id, status) =>
  request(`/admin/applications/${id}`, { method: 'PUT', body: JSON.stringify({ status }) });
export const getAdminIssues = (status) => request(`/admin/issues${status ? `?status=${status}` : ''}`);
export const updateIssue = (id, status) =>
  request(`/admin/issues/${id}`, { method: 'PUT', body: JSON.stringify({ status }) });
export const getAdminPromos = () => request('/admin/promos');
export const createPromo = (data) =>
  request('/admin/promos', { method: 'POST', body: JSON.stringify(data) });
export const updatePromo = (id, data) =>
  request(`/admin/promos/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deletePromo = (id) =>
  request(`/admin/promos/${id}`, { method: 'DELETE' });

// Rider APIs
export const getRiders = (filters = {}) => {
  const params = new URLSearchParams(filters);
  return request(`/riders?${params}`);
};
export const getRiderById = (id) => request(`/riders/${id}`);
export const updateRiderStatus = (id, data) =>
  request(`/riders/${id}/status`, { method: 'PUT', body: JSON.stringify(data) });

// Restaurant owner APIs
export const getRestaurantOrders = (restaurantId, status) =>
  request(`/orders?restaurantId=${restaurantId}${status ? `&status=${status}` : ''}`);
export const updateRestaurant = (id, data) =>
  request(`/restaurants/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const addMenuItem = (restaurantId, item) =>
  request(`/menu/restaurants/${restaurantId}/menu`, { method: 'POST', body: JSON.stringify(item) });
export const updateMenuItem = (itemId, data) =>
  request(`/menu/${itemId}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteMenuItem = (itemId) =>
  request(`/menu/${itemId}`, { method: 'DELETE' });
