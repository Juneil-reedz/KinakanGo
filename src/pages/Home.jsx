import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFeaturedRestaurants } from '../services/api';
import { useCart } from '../context/CartContext';
import { Heart, Star, Plus } from 'lucide-react';

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [favorites, setFavorites] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const navigate = useNavigate();
  const { addToCart } = useCart();

  // Load featured restaurants
  useEffect(() => {
    const loadRestaurants = async () => {
      try {
        const data = await getFeaturedRestaurants();
        setRestaurants(data);
      } catch (error) {
        console.error('Error loading restaurants:', error);
      }
    };
    loadRestaurants();
  }, []);

  const categories = [
    { id: 1, name: 'Bakery', icon: '🥖', color: 'bg-[#8BAE66]' },
    { id: 2, name: 'Burger', icon: '🍔', color: 'bg-[#8BAE66]' },
    { id: 3, name: 'Beverage', icon: '🥤', color: 'bg-[#8BAE66]' },
    { id: 4, name: 'Chicken', icon: '🍗', color: 'bg-[#8BAE66]' },
    { id: 5, name: 'Pizza', icon: '🍕', color: 'bg-[#8BAE66]' },
    { id: 6, name: 'Seafood', icon: '🦞', color: 'bg-[#8BAE66]' },
  ];

  const popularFood = [
    {
      id: 4,
      name: 'Cheese Burger',
      restaurant: "Burger King's",
      price: 6.55,
      rating: 5,
      image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop',
      badge: 'HOT SALE',
      category: 'Burger'
    },
    {
      id: 5,
      name: 'Toasted Bread',
      restaurant: 'Bake n Shake',
      price: 5.59,
      rating: 5,
      image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=300&fit=crop',
      badge: 'HOT SALE',
      category: 'Bakery'
    },
    {
      id: 6,
      name: 'Deluxe Burger',
      restaurant: "Burger King's",
      price: 6.55,
      rating: 5,
      image: 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=400&h=300&fit=crop',
      badge: 'HOT SALE',
      category: 'Burger'
    },
  ];

  const recentOrders = [
    { id: 1, name: 'Pizza', image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=200&h=200&fit=crop' },
    { id: 2, name: 'Noodles', image: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=200&h=200&fit=crop' },
    { id: 3, name: 'Salad', image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=200&h=200&fit=crop' },
  ];

  // Promotional offers
  const promoOffers = [
    {
      id: 1,
      title: 'Get Discount Voucher',
      subtitle: 'Up To 20%',
      description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed...',
      bgColor: 'from-[#628141] to-[#8BAE66]'
    },
    {
      id: 2,
      title: 'Free Delivery',
      subtitle: 'On Orders Above ₱500',
      description: 'Get free delivery on all orders above ₱500 this week!',
      bgColor: 'from-orange-400 to-red-500'
    },
    {
      id: 3,
      title: 'Special Weekend Deal',
      subtitle: 'Buy 1 Get 1 Free',
      description: 'Buy any burger and get another one absolutely free!',
      bgColor: 'from-green-400 to-emerald-500'
    }
  ];

  const [currentPromo, setCurrentPromo] = useState(0);

  // Category filtering
  const handleCategorySelect = (categoryName) => {
    setSelectedCategory(categoryName);
    // Navigate to restaurants page with category filter
    if (categoryName !== 'All') {
      navigate(`/restaurants?category=${encodeURIComponent(categoryName)}`);
    }
  };

  // Filter popular food by selected category
  const filteredFood = selectedCategory === 'All'
    ? popularFood
    : popularFood.filter(food => food.category === selectedCategory);

  // Add to cart functionality
  const handleAddToCart = (item) => {
    // Create a simple restaurant object for items added from home page
    const restaurant = { id: item.restaurant, name: item.restaurant };
    const cartItem = { ...item, quantity: 1 };
    addToCart(cartItem, restaurant);
  };

  const toggleFavorite = (itemId) => {
    setFavorites(prev =>
      prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]
    );
  };

  return (
    <div className="space-y-4 xs:space-y-6 md:space-y-8">
      {/* Promotional Banners Carousel */}
      <div className="relative">
        <div className={`bg-gradient-to-r ${promoOffers[currentPromo].bgColor} rounded-2xl xs:rounded-3xl p-4 xs:p-6 md:p-8 transition-all duration-500`}>
          <div className="max-w-xl">
            <h3 className="text-lg xs:text-xl md:text-2xl font-bold text-white mb-1 xs:mb-2">{promoOffers[currentPromo].title}</h3>
            <h3 className="text-lg xs:text-xl md:text-2xl font-bold text-white mb-3 xs:mb-4">{promoOffers[currentPromo].subtitle}</h3>
            <p className="text-sm xs:text-base text-white/90 mb-4 xs:mb-6">{promoOffers[currentPromo].description}</p>
            <button
              onClick={() => navigate('/restaurants')}
              className="bg-[#E67E22] text-white font-bold px-4 xs:px-6 py-2 xs:py-3 text-sm xs:text-base rounded-xl hover:bg-[#d4721d] transition-colors shadow-md"
            >
              Order Now
            </button>
          </div>
        </div>

        {/* Carousel Navigation */}
        <div className="flex items-center justify-center gap-2 mt-4">
          {promoOffers.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentPromo(index)}
              className={`h-2 rounded-full transition-all ${
                currentPromo === index ? 'w-8 bg-[#E67E22]' : 'w-2 bg-gray-300'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Category Section */}
      <div>
        <div className="flex items-center justify-between mb-4 xs:mb-6">
          <h3 className="text-base xs:text-lg md:text-xl font-bold text-gray-900">Category</h3>
          <button
            onClick={() => navigate('/restaurants')}
            className="text-[#E67E22] font-medium text-xs xs:text-sm hover:text-[#d4721d]"
          >
            view all →
          </button>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 xs:gap-4 md:gap-6">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => handleCategorySelect(cat.name)}
              className={`flex flex-col items-center gap-1 xs:gap-2 p-2 xs:p-3 md:p-4 rounded-xl xs:rounded-2xl transition-all ${
                selectedCategory === cat.name
                  ? 'bg-[#E67E22] shadow-md scale-105'
                  : 'bg-[#8BAE66] hover:bg-[#7a9e5c]'
              }`}
            >
              <span className="text-2xl xs:text-3xl md:text-4xl">{cat.icon}</span>
              <span className={`text-xs xs:text-sm font-medium ${
                selectedCategory === cat.name ? 'text-white' : 'text-gray-700'
              }`}>
                {cat.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Popular Dishes */}
      <div>
        <div className="flex items-center justify-between mb-4 xs:mb-6">
          <h3 className="text-base xs:text-lg md:text-xl font-bold text-gray-900">
            Popular Dishes
            {selectedCategory !== 'All' && (
              <span className="text-xs xs:text-sm text-gray-500 ml-2">({selectedCategory})</span>
            )}
          </h3>
          <button
            onClick={() => navigate('/restaurants')}
            className="text-[#E67E22] font-medium text-xs xs:text-sm hover:text-[#d4721d]"
          >
            view all →
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 xs:gap-5 md:gap-6">
          {filteredFood.length > 0 ? (
            filteredFood.map(item => (
              <div
                key={item.id}
                onClick={() => navigate(`/food/${item.id}`, { state: { foodItem: item } })}
                className="bg-white rounded-xl xs:rounded-2xl p-3 xs:p-4 md:p-5 shadow-sm hover:shadow-lg transition-all relative cursor-pointer"
              >
                {item.badge && (
                  <div className="absolute top-2 xs:top-3 left-2 xs:left-3 bg-red-500 text-white text-xs font-bold px-2 xs:px-3 py-0.5 xs:py-1 rounded-lg">
                    {item.badge}
                  </div>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(item.id);
                  }}
                  className="absolute top-2 xs:top-3 right-2 xs:right-3 w-7 h-7 xs:w-8 xs:h-8 bg-white rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-transform"
                >
                  <Heart
                    className={`w-3.5 h-3.5 xs:w-4 xs:h-4 ${favorites.includes(item.id) ? 'fill-red-500 text-red-500' : 'text-gray-400'}`}
                  />
                </button>
                <div className="aspect-square rounded-xl overflow-hidden mb-3 xs:mb-4">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex items-center gap-1 mb-2">
                  {[...Array(item.rating)].map((_, i) => (
                    <Star key={i} className="w-3 h-3 xs:w-4 xs:h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <h4 className="text-sm xs:text-base font-bold text-gray-900 mb-1">{item.name}</h4>
                <p className="text-xs xs:text-sm text-gray-500 mb-2 xs:mb-3">{item.restaurant}</p>
                <div className="flex items-center justify-between">
                  <span className="text-lg xs:text-xl font-bold text-[#E67E22]">₱{item.price.toFixed(2)}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddToCart(item);
                    }}
                    className="w-8 h-8 xs:w-9 xs:h-9 bg-[#E67E22] rounded-xl flex items-center justify-center hover:bg-[#d4721d] transition-colors active:scale-95"
                    title="Add to cart"
                  >
                    <Plus className="w-4 h-4 xs:w-5 xs:h-5 text-white" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-3 text-center py-12">
              <p className="text-gray-500">No items found in this category</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Order */}
      <div>
        <div className="flex items-center justify-between mb-4 xs:mb-6">
          <h3 className="text-base xs:text-lg md:text-xl font-bold text-gray-900">Recent Order</h3>
          <button
            onClick={() => navigate('/orders')}
            className="text-[#E67E22] font-medium text-xs xs:text-sm hover:text-[#d4721d]"
          >
            view all →
          </button>
        </div>
        <div className="flex gap-3 xs:gap-4 md:gap-6 overflow-x-auto pb-2">
          {recentOrders.map(order => (
            <div key={order.id} className="w-20 h-20 xs:w-24 xs:h-24 md:w-32 md:h-32 flex-shrink-0 rounded-full overflow-hidden shadow-md hover:scale-105 transition-transform cursor-pointer">
              <img src={order.image} alt={order.name} className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      </div>







    </div>
  );
}
