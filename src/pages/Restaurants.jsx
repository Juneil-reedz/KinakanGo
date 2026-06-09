import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { getRestaurants, getAllMenuItems } from '../services/api';
import { useCart } from '../context/CartContext';
import Card from '../components/Card';
import Button from '../components/Button';
import Loader from '../components/Loader';
import Modal from '../components/Modal';
import { Utensils, Store, Plus, Minus, X, Heart, Star } from 'lucide-react';

export default function Restaurants() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { addToCart } = useCart();
  const [restaurants, setRestaurants] = useState([]);
  const [foodItems, setFoodItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  const [sortBy, setSortBy] = useState('recommended');
  // Default to food view, especially if there's a search query
  const [viewMode, setViewMode] = useState('food');
  const [selectedItem, setSelectedItem] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [favorites, setFavorites] = useState([]);

  const toggleFavorite = (itemId) => {
    setFavorites(prev =>
      prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]
    );
  };

  const categories = [
    { id: 'all', name: 'All' },
    { id: 'pizza', name: 'Pizza' },
    { id: 'burgers', name: 'Burgers' },
    { id: 'sushi', name: 'Sushi' },
    { id: 'pasta', name: 'Pasta' },
    { id: 'salads', name: 'Salads' },
    { id: 'desserts', name: 'Desserts' },
  ];

  useEffect(() => {
    fetchData();
  }, [selectedCategory, searchQuery, sortBy, viewMode]);

  const fetchData = async () => {
    setLoading(true);
    const startTime = Date.now();
    try {
      const filters = {
        category: selectedCategory,
        search: searchQuery,
        sortBy: sortBy !== 'recommended' ? sortBy : undefined,
      };

      if (viewMode === 'food') {
        const items = await getAllMenuItems(filters);
        setFoodItems(items);
      } else {
        const data = await getRestaurants(filters);
        setRestaurants(data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      // Ensure loading shows for at least 5 seconds
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, 5000 - elapsedTime);
      setTimeout(() => {
        setLoading(false);
      }, remainingTime);
    }
  };

  const handleCategoryChange = (categoryId) => {
    setSelectedCategory(categoryId);
    if (categoryId === 'all') {
      searchParams.delete('category');
    } else {
      searchParams.set('category', categoryId);
    }
    setSearchParams(searchParams);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      searchParams.set('search', searchQuery);
    } else {
      searchParams.delete('search');
    }
    setSearchParams(searchParams);
  };

  const handleSortChange = (e) => {
    setSortBy(e.target.value);
  };

  const handleAddToCart = (item, qty = 1) => {
    const cartItem = {
      id: item.id,
      name: item.name,
      price: item.price,
      quantity: qty,
      image: item.image,
    };
    addToCart(cartItem, item.restaurant);
  };

  const openItemModal = (item) => {
    setSelectedItem(item);
    setQuantity(1);
  };

  const closeItemModal = () => {
    setSelectedItem(null);
    setQuantity(1);
  };

  const handleAddToCartFromModal = () => {
    if (!selectedItem) return;
    handleAddToCart(selectedItem, quantity);
    closeItemModal();
  };

  return (
    <div className="space-y-4 xs:space-y-6">
      <h1 className="text-2xl xs:text-3xl md:text-4xl font-heading font-bold">Food Order</h1>

      {/* View Mode Toggle */}
      <div className="flex items-center gap-2 xs:gap-4 bg-white rounded-lg xs:rounded-xl p-1.5 xs:p-2 w-fit shadow-sm">
        <button
          onClick={() => setViewMode('food')}
          className={`flex items-center gap-1 xs:gap-2 px-3 xs:px-4 md:px-6 py-2 xs:py-2.5 md:py-3 rounded-lg text-sm xs:text-base font-medium transition-all ${
            viewMode === 'food'
              ? 'bg-[#E67E22] text-white shadow-md'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          <Utensils className="w-4 h-4 xs:w-5 xs:h-5" />
          <span className="hidden xs:inline">Food Items</span>
          <span className="xs:hidden">Food</span>
        </button>
        <button
          onClick={() => setViewMode('restaurants')}
          className={`flex items-center gap-1 xs:gap-2 px-3 xs:px-4 md:px-6 py-2 xs:py-2.5 md:py-3 rounded-lg text-sm xs:text-base font-medium transition-all ${
            viewMode === 'restaurants'
              ? 'bg-[#E67E22] text-white shadow-md'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          <Store className="w-4 h-4 xs:w-5 xs:h-5" />
          <span className="hidden xs:inline">Restaurants</span>
          <span className="xs:hidden">Stores</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex space-x-4 overflow-x-auto pb-2">
        {categories.map((category) => (
          <Button
            key={category.id}
            variant={selectedCategory === category.id ? 'primary' : 'secondary'}
            onClick={() => handleCategoryChange(category.id)}
          >
            {category.name}
          </Button>
        ))}
      </div>

      {/* Search and Sort */}
      <Card className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
          <form onSubmit={handleSearchSubmit} className="flex-1 md:max-w-md flex space-x-2">
            <input
              type="text"
              placeholder={`Search ${viewMode === 'food' ? 'food items' : 'restaurants'}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <Button type="submit">Search</Button>
          </form>
          <select
            value={sortBy}
            onChange={handleSortChange}
            className="px-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="recommended">Sort by: Recommended</option>
            {viewMode === 'restaurants' ? (
              <>
                <option value="rating">Sort by: Rating</option>
                <option value="deliveryTime">Sort by: Delivery Time</option>
              </>
            ) : (
              <>
                <option value="rating">Sort by: Rating</option>
                <option value="price">Sort by: Price</option>
              </>
            )}
          </select>
        </div>
      </Card>

      {/* Loading State */}
      {loading && <Loader size="lg" fullScreen />}

      {/* Food Items Grid */}
      {!loading && viewMode === 'food' && (
        <>
          {foodItems.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 xs:gap-4 md:gap-5">
              {foodItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => navigate(`/food/${item.id}`, { state: { foodItem: item } })}
                  className="bg-white rounded-2xl xs:rounded-3xl p-3 xs:p-4 shadow-sm hover:shadow-md transition-all cursor-pointer relative"
                >
                  {/* Image */}
                  <div className="aspect-square bg-gray-50 rounded-2xl xs:rounded-3xl mb-2 xs:mb-3 overflow-hidden flex items-center justify-center">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Content */}
                  <div>
                    {/* Name */}
                    <h3 className="font-bold text-sm xs:text-base text-gray-900 mb-1 line-clamp-1">
                      {item.name}
                    </h3>

                    {/* Category/Restaurant */}
                    <p className="text-xs xs:text-sm text-gray-500 mb-1 line-clamp-1">
                      {item.restaurant.name}
                    </p>

                    {/* Price */}
                    <p className="text-sm xs:text-base font-bold text-[#E67E22] mb-2 xs:mb-3">
                      ₱{item.price.toFixed(2)}
                    </p>

                    {/* Rating and Favorite */}
                    <div className="flex items-center justify-between">
                      {/* Rating */}
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 xs:w-4 xs:h-4 fill-[#E67E22] text-[#E67E22]" />
                        <span className="text-xs xs:text-sm font-semibold text-gray-900">
                          {item.rating || '4.8'}
                        </span>
                      </div>

                      {/* Heart Icon */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(item.id);
                        }}
                        className="p-1.5 xs:p-2 hover:bg-gray-50 rounded-full transition-colors"
                      >
                        <Heart
                          className={`w-4 h-4 xs:w-5 xs:h-5 transition-colors ${
                            favorites.includes(item.id)
                              ? 'fill-red-500 text-red-500'
                              : 'text-gray-400'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🍽️</div>
              <h3 className="text-2xl font-semibold mb-2">No food items found</h3>
              <p className="text-secondary-600 mb-6">
                Try adjusting your filters or search terms
              </p>
              <Button onClick={() => { setSelectedCategory('all'); setSearchQuery(''); }}>
                Clear Filters
              </Button>
            </div>
          )}
        </>
      )}

      {/* Restaurants Grid */}
      {!loading && viewMode === 'restaurants' && (
        <>
          {restaurants.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 xs:gap-4 md:gap-6">
              {restaurants.map((restaurant) => (
                <Link key={restaurant.id} to={`/restaurant/${restaurant.id}`}>
                  <Card hover className="p-2 xs:p-3 md:p-4">
                    <div className="aspect-square bg-secondary-300 rounded-lg mb-2 xs:mb-3 overflow-hidden">
                      <img
                        src={restaurant.image}
                        alt={restaurant.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <h3 className="font-semibold text-xs xs:text-sm md:text-base mb-1 xs:mb-2 line-clamp-1">{restaurant.name}</h3>
                    <div className="flex items-center justify-between text-xs text-secondary-600 mb-2 xs:mb-3">
                      <span>⭐ {restaurant.rating}</span>
                      <span>{restaurant.deliveryTime} min</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-secondary-500 capitalize truncate">{restaurant.category}</span>
                      <span className="text-primary-600 font-medium text-xs xs:text-sm whitespace-nowrap ml-1">
                        ${restaurant.deliveryFee}
                      </span>
                    </div>
                    {!restaurant.isOpen && (
                      <div className="mt-1 xs:mt-2 text-xs text-error font-medium">Closed</div>
                    )}
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🏪</div>
              <h3 className="text-2xl font-semibold mb-2">No restaurants found</h3>
              <p className="text-secondary-600 mb-6">
                Try adjusting your filters or search terms
              </p>
              <Button onClick={() => { setSelectedCategory('all'); setSearchQuery(''); }}>
                Clear Filters
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
