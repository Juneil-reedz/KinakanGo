import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Star, Plus, Trash2, ShoppingCart } from 'lucide-react';
import { useCart } from '../context/CartContext';

export default function Favorites() {
  const navigate = useNavigate();
  const { addItem } = useCart();
  const [favorites, setFavorites] = useState([
    {
      id: 1,
      name: 'Margherita Pizza',
      restaurant: "Pizza Palace",
      price: 12.99,
      rating: 5,
      image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&h=300&fit=crop',
      category: 'Pizza'
    },
    {
      id: 2,
      name: 'Classic Burger',
      restaurant: "Burger King's",
      price: 8.99,
      rating: 4,
      image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop',
      category: 'Burger'
    },
    {
      id: 3,
      name: 'Caesar Salad',
      restaurant: 'Healthy Bites',
      price: 7.99,
      rating: 5,
      image: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400&h=300&fit=crop',
      category: 'Salad'
    },
  ]);

  const removeFavorite = (id) => {
    setFavorites(favorites.filter(item => item.id !== id));
  };

  const handleAddToCart = (item) => {
    addItem(item);
  };

  return (
    <div className="min-h-screen bg-[#EBD5AB] p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Favorites</h1>
          <p className="text-gray-600">Your favorite dishes all in one place</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Favorites</p>
                <p className="text-3xl font-bold text-gray-900">{favorites.length}</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-[#8BAE66] to-[#628141] rounded-xl">
                <Heart className="w-6 h-6 text-white fill-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Avg Rating</p>
                <p className="text-3xl font-bold text-gray-900">
                  {favorites.length > 0
                    ? (favorites.reduce((sum, item) => sum + item.rating, 0) / favorites.length).toFixed(1)
                    : '0.0'}
                </p>
              </div>
              <div className="p-3 bg-gradient-to-br from-[#8BAE66] to-[#628141] rounded-xl">
                <Star className="w-6 h-6 text-green-600 fill-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Value</p>
                <p className="text-3xl font-bold text-gray-900">
                  ${favorites.reduce((sum, item) => sum + item.price, 0).toFixed(2)}
                </p>
              </div>
              <div className="p-3 bg-gradient-to-br from-[#E67E22] to-[#d4721d] rounded-xl">
                <ShoppingCart className="w-6 h-6 text-rose-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Favorites Grid */}
        {favorites.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.map(item => (
              <div
                key={item.id}
                onClick={() => navigate(`/food/${item.id}`, { state: { foodItem: item } })}
                className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-lg transition-all relative group cursor-pointer"
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFavorite(item.id);
                  }}
                  className="absolute top-3 right-3 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 z-10"
                  title="Remove from favorites"
                >
                  <Trash2 className="w-4 h-4 text-white" />
                </button>

                <div className="aspect-square rounded-xl overflow-hidden mb-4">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                </div>

                <div className="flex items-center gap-1 mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < item.rating ? 'fill-[#E67E22] text-[#E67E22]' : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>

                <h4 className="font-bold text-gray-900 mb-1">{item.name}</h4>
                <p className="text-sm text-gray-500 mb-3">{item.restaurant}</p>

                <div className="flex items-center justify-between">
                  <span className="text-xl font-bold text-gray-900">${item.price}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddToCart(item);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-[#E67E22] text-white font-semibold rounded-xl hover:bg-[#d4721d] transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-12 text-center">
            <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Favorites Yet</h3>
            <p className="text-gray-600 mb-6">Start adding your favorite dishes to see them here</p>
            <button
              onClick={() => navigate('/restaurants')}
              className="px-6 py-3 bg-gradient-to-r from-yellow-400 to-yellow-500 text-white font-bold rounded-xl hover:from-yellow-500 hover:to-yellow-600 transition-colors"
            >
              Browse Restaurants
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
