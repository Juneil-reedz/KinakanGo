// Base URL: set VITE_API_URL in .env for production, falls back to /api (proxied in dev)
const BASE = import.meta.env.VITE_API_URL || '/api';

const TOKEN_KEY   = 'kkg_access';
const REFRESH_KEY = 'kkg_refresh';

export const storage = {
  getAccess:      ()      => localStorage.getItem(TOKEN_KEY),
  getRefresh:     ()      => localStorage.getItem(REFRESH_KEY),
  setTokens:      (a, r)  => { localStorage.setItem(TOKEN_KEY, a); if (r) localStorage.setItem(REFRESH_KEY, r); },
  clearTokens:    ()      => { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(REFRESH_KEY); },
};

// Silently refresh the access token using the stored refresh token
async function tryRefresh() {
  const refreshToken = storage.getRefresh();
  if (!refreshToken) return false;
  try {
    const res  = await fetch(`${BASE}/auth/refresh`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return false;
    const { accessToken } = await res.json();
    storage.setTokens(accessToken, null);
    return true;
  } catch {
    return false;
  }
}

async function request(path, options = {}, retry = true) {
  const token = storage.getAccess();
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  // On 401, attempt silent refresh once then retry
  if (res.status === 401 && retry) {
    const refreshed = await tryRefresh();
    if (refreshed) return request(path, options, false);
    storage.clearTokens();
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.error || 'Request failed'), { status: res.status, data });
  return data;
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export const authApi = {
  login:   (email, password) =>
    request('/auth/login',    { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (payload) =>
    request('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  refresh: (refreshToken) =>
    request('/auth/refresh',  { method: 'POST', body: JSON.stringify({ refreshToken }) }),
  logout:  (refreshToken) =>
    request('/auth/logout',   { method: 'POST', body: JSON.stringify({ refreshToken }) }),
  me: () => request('/auth/me'),
  forgotPassword: (email) =>
    request('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
  resetPassword: (token, password) =>
    request('/auth/reset-password',  { method: 'POST', body: JSON.stringify({ token, password }) }),
};

// ── Users ─────────────────────────────────────────────────────────────────────

export const usersApi = {
  list:   (params = {}) => request(`/users?${new URLSearchParams(params)}`),
  getOne: (id)          => request(`/users/${id}`),
  update: (id, data)    => request(`/users/${id}`,      { method: 'PATCH', body: JSON.stringify(data) }),
  ban:    (id, reason)  => request(`/users/${id}/ban`,   { method: 'POST',  body: JSON.stringify({ reason }) }),
  unban:  (id)          => request(`/users/${id}/unban`, { method: 'POST' }),
};

// ── Restaurants ───────────────────────────────────────────────────────────────

export const restaurantsApi = {
  list:      (params = {}) => request(`/restaurants?${new URLSearchParams(params)}`),
  getOne:    (id)          => request(`/restaurants/${id}`),
  myRestaurant: ()         => request('/restaurants/owner/me'),
  create:    (data)        => request('/restaurants',         { method: 'POST',   body: JSON.stringify(data) }),
  update:    (id, data)    => request(`/restaurants/${id}`,   { method: 'PATCH',  body: JSON.stringify(data) }),
  remove:    (id)          => request(`/restaurants/${id}`,   { method: 'DELETE' }),
  approve:   (id)          => request(`/restaurants/${id}/approve`, { method: 'POST' }),
};

// ── Menu ──────────────────────────────────────────────────────────────────────

export const menuApi = {
  list:   (restaurantId)         => request(`/restaurants/${restaurantId}/menu`),
  create: (restaurantId, data)   => request(`/restaurants/${restaurantId}/menu`,           { method: 'POST',   body: JSON.stringify(data) }),
  update: (restaurantId, itemId, data) => request(`/restaurants/${restaurantId}/menu/${itemId}`, { method: 'PATCH',  body: JSON.stringify(data) }),
  remove: (restaurantId, itemId) => request(`/restaurants/${restaurantId}/menu/${itemId}`, { method: 'DELETE' }),
};

// ── Orders ────────────────────────────────────────────────────────────────────

export const ordersApi = {
  place:       (data)           => request('/orders',               { method: 'POST',  body: JSON.stringify(data) }),
  list:        (params = {})    => request(`/orders?${new URLSearchParams(params)}`),
  getOne:      (id)             => request(`/orders/${id}`),
  updateStatus:(id, status, extra = {}) =>
    request(`/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status, ...extra }) }),
  assignRider: (id, riderId)    =>
    request(`/orders/${id}/assign-rider`, { method: 'PATCH', body: JSON.stringify({ riderId }) }),
};

// ── Applications ──────────────────────────────────────────────────────────────

export const applicationsApi = {
  submit:  (type, data)  => request('/applications',             { method: 'POST', body: JSON.stringify({ type, data }) }),
  list:    (params = {}) => request(`/applications?${new URLSearchParams(params)}`),
  getOne:  (id)          => request(`/applications/${id}`),
  approve: (id)          => request(`/applications/${id}/approve`, { method: 'POST' }),
  reject:  (id, reason)  => request(`/applications/${id}/reject`,  { method: 'POST', body: JSON.stringify({ reason }) }),
};

// ── Issues ────────────────────────────────────────────────────────────────────

export const issuesApi = {
  submit:  (data)         => request('/issues',              { method: 'POST', body: JSON.stringify(data) }),
  list:    (params = {})  => request(`/issues?${new URLSearchParams(params)}`),
  resolve: (id, data)     => request(`/issues/${id}/resolve`, { method: 'POST', body: JSON.stringify(data) }),
  deny:    (id, notes)    => request(`/issues/${id}/deny`,    { method: 'POST', body: JSON.stringify({ notes }) }),
};

// ── Promos ────────────────────────────────────────────────────────────────────

export const promosApi = {
  list:     (params = {}) => request(`/promos?${new URLSearchParams(params)}`),
  create:   (data)        => request('/promos',         { method: 'POST',   body: JSON.stringify(data) }),
  update:   (id, data)    => request(`/promos/${id}`,   { method: 'PATCH',  body: JSON.stringify(data) }),
  remove:   (id)          => request(`/promos/${id}`,   { method: 'DELETE' }),
  validate: (code, total) => request('/promos/validate',{ method: 'POST',   body: JSON.stringify({ code, orderTotal: total }) }),
};

// Legacy named exports kept for any pages that import them directly
export const getRestaurants        = (f = {}) => restaurantsApi.list(f);
export const getFeaturedRestaurants= (limit = 6) => restaurantsApi.list({ limit });
export const getRestaurantById     = (id)     => restaurantsApi.getOne(id);
export const getMenuByRestaurantId = (id)     => menuApi.list(id);
export const getAllMenuItems        = (f = {}) => request(`/menu?${new URLSearchParams(f)}`);
export const getUserOrders         = ()       => ordersApi.list();
export const getOrderById          = (id)     => ordersApi.getOne(id);
export const createOrder           = (data)   => ordersApi.place(data);
export const updateOrderStatus     = (id, s, extra) => ordersApi.updateStatus(id, s, extra);
export const login                 = (e, p)   => authApi.login(e, p);
export const register              = (data)   => authApi.register(data);
