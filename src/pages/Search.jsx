import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';

export default function Search() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const navigate = useNavigate();
  const { addToCart } = useCart();

  // Mock data - you can replace with API calls
  const allFoods = [
    { id: 1, name: 'Chicken Teriyaki Drumstick', price: 250.0, image: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=400&h=400&fit=crop', category: 'chicken', restaurant: 'Asian Kitchen', rating: 4.5, deliveryTime: 30 },
    { id: 2, name: 'Teriyaki Chicken with Broccoli', price: 350.0, image: 'https://images.unsplash.com/photo-1588347818036-8fc4ec0d8b8d?w=400&h=400&fit=crop', category: 'chicken', restaurant: 'Asian Kitchen', rating: 4.6, deliveryTime: 30 },
    { id: 3, name: 'Classic Chicken Naan', price: 200.0, image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&h=400&fit=crop', category: 'chicken', restaurant: 'Indian Palace', rating: 4.7, deliveryTime: 25 },
    { id: 4, name: 'Japanese Fried Chicken', price: 180.0, image: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=400&h=400&fit=crop', category: 'chicken', restaurant: 'Tokyo Eats', rating: 4.8, deliveryTime: 35 },
    { id: 5, name: 'Sweet Spicy Chicken', price: 320.0, image: 'https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=400&h=400&fit=crop', category: 'chicken', restaurant: 'Spice House', rating: 4.5, deliveryTime: 30 },
    { id: 6, name: 'Grilled Chicken Bowl', price: 220.0, image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=400&fit=crop', category: 'chicken', restaurant: 'Healthy Bites', rating: 4.4, deliveryTime: 20 },
    { id: 7, name: 'Pepperoni Pizza', price: 350.0, image: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400&h=400&fit=crop', category: 'pizza', restaurant: 'Pizza Palace', rating: 4.6, deliveryTime: 25 },
    { id: 8, name: 'Margherita Pizza', price: 320.0, image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&h=400&fit=crop', category: 'pizza', restaurant: 'Pizza Palace', rating: 4.7, deliveryTime: 25 },
    { id: 9, name: 'Hamburger', price: 250.0, image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=400&fit=crop', category: 'burger', restaurant: 'Burger King', rating: 4.5, deliveryTime: 20 },
    { id: 10, name: 'Classic Burger', price: 180.0, image: 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=400&h=400&fit=crop', category: 'burger', restaurant: 'Burger King', rating: 4.4, deliveryTime: 20 },
    { id: 11, name: 'Cheese Sandwich', price: 200.0, image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400&h=400&fit=crop', category: 'sandwich', restaurant: 'Sandwich Shop', rating: 4.3, deliveryTime: 15 },
    { id: 12, name: 'Club Sandwich', price: 220.0, image: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=400&h=400&fit=crop', category: 'sandwich', restaurant: 'Sandwich Shop', rating: 4.5, deliveryTime: 15 },
    { id: 13, name: 'Sushi Platter', price: 450.0, image: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400&h=400&fit=crop', category: 'sushi', restaurant: 'Sushi Bar', rating: 4.8, deliveryTime: 40 },
    { id: 14, name: 'Dragon Roll', price: 380.0, image: 'https://images.unsplash.com/photo-1563612116625-3012372fccce?w=400&h=400&fit=crop', category: 'sushi', restaurant: 'Sushi Bar', rating: 4.7, deliveryTime: 40 },
    { id: 15, name: 'Ramen Bowl', price: 280.0, image: 'https://images.unsplash.com/photo-1557872943-16a5ac26437e?w=400&h=400&fit=crop', category: 'soup', restaurant: 'Ramen House', rating: 4.6, deliveryTime: 30 },
    { id: 16, name: 'Pad Thai', price: 300.0, image: 'https://images.unsplash.com/photo-1559314809-0d155014e29e?w=400&h=400&fit=crop', category: 'pasta', restaurant: 'Thai Kitchen', rating: 4.5, deliveryTime: 35 },
  ];

  const categories = [
    { id: 'all', name: 'All' },
    { id: 'chicken', name: 'Chicken' },
    { id: 'pizza', name: 'Pizza' },
    { id: 'burger', name: 'Burger' },
    { id: 'sandwich', name: 'Sandwich' },
    { id: 'sushi', name: 'Sushi' },
    { id: 'soup', name: 'Soup' },
    { id: 'pasta', name: 'Pasta' },
  ];

  useEffect(() => {
    performSearch();
  }, [searchQuery, selectedCategory]);

  const performSearch = () => {
    setLoading(true);

    let results = allFoods;

    // Filter by category
    if (selectedCategory !== 'all') {
      results = results.filter(food => food.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      results = results.filter(food =>
        food.name.toLowerCase().includes(query) ||
        food.restaurant.toLowerCase().includes(query) ||
        food.category.toLowerCase().includes(query)
      );
    }

    setSearchResults(results);
    setLoading(false);
  };

  const handleAddToCart = (item) => {
    const cartItem = {
      id: item.id,
      name: item.name,
      price: item.price,
      quantity: 1,
      image: item.image,
    };
    addToCart(cartItem, { id: item.restaurant, name: item.restaurant });
  };

  // Group foods into rows of 2
  const groupedFoods = [];
  for (let i = 0; i < searchResults.length; i += 2) {
    groupedFoods.push(searchResults.slice(i, i + 2));
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header with Search */}
      <div className="bg-white sticky top-0 z-40 shadow-sm">
        <div className="container-custom py-4">
          <h1 className="text-2xl font-heading font-bold text-gray-900 mb-4">Search</h1>

          {/* Search Bar */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search for food, restaurants..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-12 py-3 bg-gray-100 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-600 placeholder:text-secondary-400"
            />
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2"
              >
                <svg className="w-5 h-5 text-secondary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Category Filter */}
          <div className="flex gap-2 overflow-x-auto mt-4 pb-2 scrollbar-hide">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-all ${
                  selectedCategory === category.id
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-secondary-600'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="container-custom py-4">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : searchResults.length > 0 ? (
          <div className="space-y-4">
            {groupedFoods.map((row, rowIndex) => (
              <div key={rowIndex} className="grid grid-cols-2 gap-3">
                {row.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => navigate(`/food/${item.id}`, { state: { foodItem: item } })}
                    className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer"
                  >
                    {/* Food Image */}
                    <div className="relative aspect-square bg-gray-100">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddToCart(item);
                        }}
                        className="absolute bottom-2 right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                      >
                        <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                    </div>

                    {/* Food Info */}
                    <div className="p-3">
                      <h3 className="font-bold text-sm text-gray-900 mb-1 line-clamp-1">
                        {item.name}
                      </h3>
                      <p className="text-xs text-secondary-600 mb-2 line-clamp-1">
                        {item.restaurant}
                      </p>

                      {/* Rating and Delivery Time */}
                      <div className="flex items-center gap-2 mb-2 text-xs text-secondary-600">
                        <div className="flex items-center gap-1">
                          <svg className="w-3 h-3 text-yellow-400 fill-current" viewBox="0 0 24 24">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                          </svg>
                          <span>{item.rating}</span>
                        </div>
                        <span>•</span>
                        <div className="flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>{item.deliveryTime} mins</span>
                        </div>
                      </div>

                      {/* Price */}
                      <div className="text-primary-600 font-bold text-sm">
                        ₱ {item.price.toFixed(1)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <svg className="w-16 h-16 mx-auto text-secondary-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No results found</h3>
            <p className="text-secondary-600">Try searching for something else</p>
          </div>
        )}
      </div>
    </div>
  );
}
