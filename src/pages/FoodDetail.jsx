import { useState, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';

export default function FoodDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [selectedAddOns, setSelectedAddOns] = useState([]);
  const [scrollOffset, setScrollOffset] = useState(0);
  const contentRef = useRef(null);

  const handleScroll = () => {
    if (contentRef.current) {
      setScrollOffset(contentRef.current.scrollTop);
    }
  };

  // Get food item from navigation state or use fallback
  const foodItem = location.state?.foodItem || {
    id: parseInt(id),
    name: 'Delicious Food',
    description: 'Fresh ingredients prepared with care. A delicious combination of flavors that will satisfy your cravings.',
    price: 350,
    rating: 4.5,
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&h=800&fit=crop',
    restaurant: 'Restaurant',
    category: 'food',
  };

  const addOns = [
    { id: 1, name: 'Extra Cheese', price: 50, image: 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=200&h=200&fit=crop' },
    { id: 2, name: 'Pickles', price: 30, image: 'https://images.unsplash.com/photo-1623218655048-d60d0a8ee280?w=200&h=200&fit=crop' },
    { id: 3, name: 'Extra Patty', price: 100, image: 'https://images.unsplash.com/photo-1551248429-40975aa4de74?w=200&h=200&fit=crop' },
  ];

  const toggleAddOn = (addOn) => {
    setSelectedAddOns((prev) => {
      const exists = prev.find((item) => item.id === addOn.id);
      if (exists) {
        return prev.filter((item) => item.id !== addOn.id);
      } else {
        return [...prev, addOn];
      }
    });
  };

  const calculateTotal = () => {
    const addOnsTotal = selectedAddOns.reduce((sum, addOn) => sum + addOn.price, 0);
    return (foodItem.price + addOnsTotal) * quantity;
  };

  const handleAddToCart = () => {
    const cartItem = {
      id: foodItem.id,
      name: foodItem.name,
      price: calculateTotal(),
      quantity: quantity,
      addOns: selectedAddOns,
      image: foodItem.image,
    };

    // Handle restaurant info - can be either string or object
    const restaurantInfo = typeof foodItem.restaurant === 'string'
      ? { id: foodItem.restaurant, name: foodItem.restaurant }
      : { id: foodItem.restaurant?.id || foodItem.restaurant, name: foodItem.restaurant?.name || 'Restaurant' };

    addToCart(cartItem, restaurantInfo);

    const shouldGoToCart = window.confirm(
      `${foodItem.name} added to cart! Would you like to view your cart?`
    );
    if (shouldGoToCart) {
      navigate('/cart');
    } else {
      navigate(-1);
    }
  };

  console.log('FoodDetail rendering:', foodItem);

  return (
    <div className="fixed inset-0 w-full h-full bg-white overflow-hidden z-50">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="absolute top-4 xs:top-6 left-4 xs:left-6 z-50 w-8 h-8 xs:w-10 xs:h-10 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-50 transition-colors"
      >
        <svg className="w-5 h-5 xs:w-6 xs:h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Favorite Button */}
      <button className="absolute top-4 xs:top-6 right-4 xs:right-6 z-50 w-8 h-8 xs:w-10 xs:h-10 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-50 transition-colors">
        <svg className="w-5 h-5 xs:w-6 xs:h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          height: `${280 + Math.min(scrollOffset * 0.5, 100)}px`
        }}
      >
        <img
          src={foodItem.image}
          alt={foodItem.name}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Content */}
      <div
        ref={contentRef}
        className="px-4 xs:px-6 sm:px-8 py-6 xs:py-8 overflow-y-auto bg-secondary-50 rounded-t-[40px] relative z-10 -mt-8"
        style={{
          height: `calc(100vh - ${280 - Math.min(scrollOffset * 0.5, 100)}px)`
        }}
        onScroll={handleScroll}
      >
        <div className="max-w-2xl mx-auto">
          {/* Title and Price */}
          <div className="mb-4">
            <h2 className="text-xl xs:text-2xl font-heading font-bold text-gray-900 mb-1">
              {foodItem.name}
            </h2>
            <p className="text-xs xs:text-sm text-secondary-600 mb-3 capitalize">{foodItem.category || 'Food'}</p>

            <div className="flex items-center justify-between">
              <div className="text-xl xs:text-2xl font-bold text-primary-600">
                ₱ {foodItem.price.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Rating and Info */}
          <div className="flex items-center gap-3 xs:gap-4 mb-4 text-xs xs:text-sm text-secondary-600">
            <div className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5 xs:w-4 xs:h-4 text-yellow-400 fill-current" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              <span className="font-medium">{foodItem.rating || '4.5'}</span>
            </div>
            <div className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5 xs:w-4 xs:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>{typeof foodItem.restaurant === 'string' ? foodItem.restaurant : foodItem.restaurant?.name || 'Restaurant'}</span>
            </div>
            <div className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5 xs:w-4 xs:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>30 mins</span>
            </div>
          </div>

          {/* Description */}
          <div className="mb-5 xs:mb-6">
            <h3 className="text-xs xs:text-sm font-bold text-gray-900 mb-2">Description:</h3>
            <p className="text-xs xs:text-sm text-secondary-600 leading-relaxed">
              {foodItem.description}
            </p>
          </div>

          {/* Add Ons */}
          {addOns.length > 0 && (
            <div className="mb-5 xs:mb-6">
              <h3 className="text-xs xs:text-sm font-bold text-gray-900 mb-3">Add Ons</h3>
              <div className="bg-white rounded-xl p-3 xs:p-4 shadow-sm">
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {addOns.map((addOn) => (
                    <button
                      key={addOn.id}
                      onClick={() => toggleAddOn(addOn)}
                      className="relative group flex-shrink-0"
                    >
                      <div className={`w-16 h-16 xs:w-20 xs:h-20 rounded-xl overflow-hidden border-2 transition-all ${
                        selectedAddOns.find((item) => item.id === addOn.id)
                          ? 'border-primary-600 scale-95'
                          : 'border-gray-200 group-hover:border-gray-300'
                      }`}>
                        <img
                          src={addOn.image}
                          alt={addOn.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className={`absolute -bottom-1 -right-1 w-5 h-5 xs:w-6 xs:h-6 rounded-full flex items-center justify-center transition-all ${
                        selectedAddOns.find((item) => item.id === addOn.id)
                          ? 'bg-red-600'
                          : 'bg-primary-600'
                      }`}>
                        {selectedAddOns.find((item) => item.id === addOn.id) ? (
                          <svg className="w-3 h-3 xs:w-4 xs:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-3 h-3 xs:w-4 xs:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                          </svg>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 mt-2 text-center">{addOn.name}</p>
                      <p className="text-xs text-gray-900 font-semibold text-center mt-0.5">₱ {addOn.price}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Quantity and Add to Cart */}
          <div className="flex items-center gap-2 xs:gap-3">
            {/* Quantity Selector */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-9 h-9 xs:w-10 xs:h-10 bg-primary-600 rounded-lg flex items-center justify-center text-white hover:bg-primary-700 transition-colors"
              >
                <svg className="w-4 h-4 xs:w-5 xs:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 12H4" />
                </svg>
              </button>
              <span className="text-lg xs:text-xl font-bold w-6 xs:w-8 text-center">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-9 h-9 xs:w-10 xs:h-10 bg-primary-600 rounded-lg flex items-center justify-center text-white hover:bg-primary-700 transition-colors"
              >
                <svg className="w-4 h-4 xs:w-5 xs:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>

            {/* Add to Cart Button */}
            <button
              onClick={handleAddToCart}
              className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-bold py-2.5 xs:py-3 px-4 xs:px-6 rounded-xl transition-colors flex items-center justify-center text-sm xs:text-base"
            >
              <div className="relative flex items-center gap-2">
                <svg className="w-5 h-5 xs:w-6 xs:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <svg className="w-3 h-3 xs:w-3.5 xs:h-3.5 absolute -top-1 -right-1 bg-white rounded-full text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                </svg>
                <span className="hidden xs:inline">₱ {calculateTotal()}</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
