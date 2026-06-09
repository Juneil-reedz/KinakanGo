import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getRestaurantById, getMenuByRestaurantId } from '../services/api';
import { useCart } from '../context/CartContext';
import Card from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Loader from '../components/Loader';
import { Heart, Star } from 'lucide-react';

export default function Restaurant() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [restaurant, setRestaurant] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [quantity, setQuantity] = useState(1);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [favorites, setFavorites] = useState([]);
  const contentRef = useRef(null);

  const toggleFavorite = (itemId) => {
    setFavorites(prev =>
      prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]
    );
  };

  const handleScroll = () => {
    if (contentRef.current) {
      setScrollOffset(contentRef.current.scrollTop);
    }
  };

  const menuCategories = [
    { id: 'all', name: 'All' },
    { id: 'pizza', name: 'Pizza' },
    { id: 'pasta', name: 'Pasta' },
    { id: 'burgers', name: 'Burgers' },
    { id: 'sushi', name: 'Sushi' },
    { id: 'salads', name: 'Salads' },
    { id: 'sides', name: 'Sides' },
    { id: 'drinks', name: 'Drinks' },
    { id: 'soup', name: 'Soups' },
  ];

  useEffect(() => {
    fetchData();
  }, [id, selectedCategory]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [restaurantData, menuData] = await Promise.all([
        getRestaurantById(id),
        getMenuByRestaurantId(id, selectedCategory),
      ]);
      setRestaurant(restaurantData);
      setMenuItems(menuData);
    } catch (error) {
      console.error('Error fetching restaurant data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (!selectedItem) return;

    const cartItem = {
      id: selectedItem.id,
      name: selectedItem.name,
      price: selectedItem.price,
      quantity: quantity,
      image: selectedItem.image,
    };

    const success = addToCart(cartItem, restaurant);

    if (success) {
      setSelectedItem(null);
      setQuantity(1);

      // Show success message
      const shouldGoToCart = window.confirm(
        `${selectedItem.name} added to cart! Would you like to view your cart?`
      );
      if (shouldGoToCart) {
        navigate('/cart');
      }
    }
  };

  const openItemModal = (item) => {
    setSelectedItem(item);
    setQuantity(1);
  };

  if (loading) {
    return <Loader fullScreen />;
  }

  if (!restaurant) {
    return (
      <div className="container-custom py-16 text-center">
        <h2 className="text-2xl font-bold mb-4">Restaurant not found</h2>
        <Button onClick={() => navigate('/restaurants')}>
          Back to Restaurants
        </Button>
      </div>
    );
  }

  const filteredItems = menuItems;
  const availableCategories = menuCategories.filter((cat) =>
    cat.id === 'all' || menuItems.some((item) => item.category === cat.id)
  );

  return (
    <div>
      {/* Restaurant Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white py-12">
        <div className="container-custom">
          <h1 className="text-4xl font-heading font-bold mb-2">{restaurant.name}</h1>
          <p className="text-primary-100 mb-4">{restaurant.description}</p>
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <span>⭐ {restaurant.rating} ({restaurant.reviews}+ reviews)</span>
            <span>🚚 {restaurant.deliveryTime} min</span>
            <span>💰 ${restaurant.deliveryFee} delivery</span>
            <span>📦 ${restaurant.minOrder} minimum</span>
            {!restaurant.isOpen && (
              <span className="bg-error px-3 py-1 rounded-full font-medium">CLOSED</span>
            )}
          </div>
        </div>
      </div>

      {/* Menu */}
      <div className="container-custom py-8">
        {/* Category Filter */}
        <div className="flex space-x-4 mb-8 overflow-x-auto pb-2">
          {availableCategories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? 'primary' : 'secondary'}
              onClick={() => setSelectedCategory(category.id)}
            >
              {category.name}
            </Button>
          ))}
        </div>

        {/* Menu Items */}
        {filteredItems.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 xs:gap-4 md:gap-5">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                onClick={() => openItemModal(item)}
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

                  {/* Category */}
                  <p className="text-xs xs:text-sm text-gray-500 mb-1 line-clamp-1 capitalize">
                    {item.category || 'Food'}
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
            <p className="text-secondary-600 text-lg">No menu items in this category</p>
          </div>
        )}
      </div>

      {/* Item Modal */}
      {selectedItem && (
        <Modal
          isOpen={!!selectedItem}
          onClose={() => {
            setSelectedItem(null);
            setQuantity(1);
            setScrollOffset(0);
          }}
          title=""
          size="full"
        >
          <div className="w-full h-full bg-white relative">
            {/* Back Button */}
            <button
              onClick={() => {
                setSelectedItem(null);
                setQuantity(1);
              }}
              className="absolute top-6 left-6 z-30 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-50 transition-colors"
            >
              <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Favorite Button */}
            <button
              className="absolute top-6 right-6 z-30 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-50 transition-colors"
            >
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            </button>

            {/* Food Image - Variable height based on scroll */}
            <div
              className="relative overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 transition-all duration-100"
              style={{
                height: `${320 + Math.min(scrollOffset * 0.5, 100)}px`
              }}
            >
              <img
                src={selectedItem.image}
                alt={selectedItem.name}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Content */}
            <div
              ref={contentRef}
              className="px-8 py-8 overflow-y-auto scrollbar-hide bg-secondary-50 rounded-t-[40px] relative z-10 -mt-8"
              style={{
                height: `calc(100vh - ${320 - Math.min(scrollOffset * 0.5, 100)}px)`
              }}
              onScroll={handleScroll}
            >
              {/* Title and Price */}
              <div className="mb-4">
                <h2 className="text-2xl font-heading font-bold text-gray-900 mb-1">
                  {selectedItem.name}
                </h2>
                <p className="text-sm text-secondary-600 mb-3 capitalize">{selectedItem.category}</p>

                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold text-primary-600">
                    ₱ {selectedItem.price.toFixed(1)}
                  </div>
                </div>
              </div>

              {/* Rating and Info */}
              <div className="flex items-center gap-4 mb-4 text-sm text-secondary-600">
                <div className="flex items-center gap-1">
                  <svg className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                  <span className="font-medium">4.5</span>
                </div>
                <div className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>1.2 km</span>
                </div>
                <div className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>30 mins</span>
                </div>
              </div>

              {/* Ingredients/Description */}
              <div className="mb-6">
                <h3 className="text-sm font-bold text-gray-900 mb-2">Description:</h3>
                <p className="text-sm text-secondary-600 leading-relaxed">
                  {selectedItem.description}
                  {selectedItem.isVegetarian && ' 🌱 Vegetarian'}
                </p>
              </div>

              {/* Additional Info - Adding more content to ensure scrolling */}
              <div className="mb-6 space-y-4">
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                    <span>🔥</span> Nutritional Information
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-sm text-secondary-600">
                    <div>Calories: 350 kcal</div>
                    <div>Protein: 25g</div>
                    <div>Carbs: 40g</div>
                    <div>Fat: 12g</div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                    <span>✨</span> Special Features
                  </h4>
                  <ul className="text-sm text-secondary-600 space-y-1">
                    <li>• Freshly prepared</li>
                    <li>• High quality ingredients</li>
                    <li>• Chef's special recipe</li>
                  </ul>
                </div>
              </div>

              {/* Quantity and Add to Cart */}
              <div className="flex items-center gap-3">
                {/* Quantity Selector */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center text-white hover:bg-primary-700 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 12H4" />
                    </svg>
                  </button>
                  <span className="text-xl font-bold w-8 text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center text-white hover:bg-primary-700 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>

                {/* Add to Cart Button */}
                <button
                  onClick={handleAddToCart}
                  disabled={!selectedItem.isAvailable}
                  className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-6 rounded-xl transition-colors flex items-center justify-center disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  <div className="relative">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <svg className="w-3.5 h-3.5 absolute -top-1 -right-1 bg-white rounded-full text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
