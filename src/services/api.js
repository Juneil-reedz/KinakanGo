import { restaurants, menuItems, orders, categories, users } from '../data/mockData';

// Simulate API delay
const delay = (ms = 500) => new Promise((resolve) => setTimeout(resolve, ms));

// Restaurant APIs
export const getRestaurants = async (filters = {}) => {
  await delay();
  let filteredRestaurants = [...restaurants];

  if (filters.category && filters.category !== 'all') {
    filteredRestaurants = filteredRestaurants.filter(
      (r) => r.category === filters.category
    );
  }

  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    filteredRestaurants = filteredRestaurants.filter((r) =>
      r.name.toLowerCase().includes(searchLower)
    );
  }

  if (filters.sortBy) {
    switch (filters.sortBy) {
      case 'rating':
        filteredRestaurants.sort((a, b) => b.rating - a.rating);
        break;
      case 'deliveryTime':
        filteredRestaurants.sort((a, b) =>
          parseInt(a.deliveryTime) - parseInt(b.deliveryTime)
        );
        break;
      default:
        break;
    }
  }

  return filteredRestaurants;
};

export const getRestaurantById = async (id) => {
  await delay();
  return restaurants.find((r) => r.id === parseInt(id));
};

export const getFeaturedRestaurants = async (limit = 6) => {
  await delay();
  return restaurants
    .filter((r) => r.rating >= 4.5)
    .slice(0, limit);
};

// Menu APIs
export const getMenuByRestaurantId = async (restaurantId, categoryFilter = 'all') => {
  await delay();
  let menu = menuItems.filter((item) => item.restaurantId === parseInt(restaurantId));

  if (categoryFilter !== 'all') {
    menu = menu.filter((item) => item.category === categoryFilter);
  }

  return menu;
};

export const getMenuItem = async (itemId) => {
  await delay();
  return menuItems.find((item) => item.id === parseInt(itemId));
};

export const getAllMenuItems = async (filters = {}) => {
  await delay();
  let items = [...menuItems];

  if (filters.category && filters.category !== 'all') {
    items = items.filter((item) => item.category === filters.category);
  }

  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    items = items.filter((item) =>
      item.name.toLowerCase().includes(searchLower) ||
      restaurants.find(r => r.id === item.restaurantId)?.name.toLowerCase().includes(searchLower)
    );
  }

  if (filters.sortBy) {
    switch (filters.sortBy) {
      case 'rating':
        items.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'price':
        items.sort((a, b) => a.price - b.price);
        break;
      default:
        break;
    }
  }

  // Add restaurant info to each item
  items = items.map(item => ({
    ...item,
    restaurant: restaurants.find(r => r.id === item.restaurantId)
  }));

  return items.filter(item => item.restaurant); // Only return items with valid restaurants
};

// Order APIs
export const getUserOrders = async (userId) => {
  await delay();
  return orders.filter((order) => order.userId === userId);
};

export const getOrderById = async (orderId) => {
  await delay();
  return orders.find((order) => order.id === orderId);
};

export const createOrder = async (orderData) => {
  await delay();
  const newOrder = {
    id: Math.random().toString(36).substr(2, 9),
    ...orderData,
    status: 'pending',
    statusText: 'Order Placed',
    date: new Date().toISOString(),
  };
  return newOrder;
};

export const updateOrderStatus = async (orderId, status) => {
  await delay();
  // In a real app, this would update the order in the backend
  return { success: true, orderId, status };
};

// Category APIs
export const getCategories = async () => {
  await delay();
  return categories;
};

// User APIs
export const getUserProfile = async (userId) => {
  await delay();
  return users.find((user) => user.id === userId);
};

export const updateUserProfile = async (userId, userData) => {
  await delay();
  // In a real app, this would update the user in the backend
  return { success: true, userId, ...userData };
};

export const getUserFavorites = async (userId) => {
  await delay();
  const user = users.find((u) => u.id === userId);
  if (!user) return [];
  return restaurants.filter((r) => user.favoriteRestaurants.includes(r.id));
};

export const addToFavorites = async (userId, restaurantId) => {
  await delay();
  return { success: true, userId, restaurantId };
};

export const removeFromFavorites = async (userId, restaurantId) => {
  await delay();
  return { success: true, userId, restaurantId };
};

// Search API
export const searchAll = async (query) => {
  await delay();
  const queryLower = query.toLowerCase();

  const matchedRestaurants = restaurants.filter((r) =>
    r.name.toLowerCase().includes(queryLower) ||
    r.cuisines.some((c) => c.toLowerCase().includes(queryLower))
  );

  const matchedMenuItems = menuItems.filter((item) =>
    item.name.toLowerCase().includes(queryLower) ||
    item.description.toLowerCase().includes(queryLower)
  );

  return {
    restaurants: matchedRestaurants,
    menuItems: matchedMenuItems,
  };
};
