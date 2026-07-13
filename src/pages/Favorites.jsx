import { useNavigate } from 'react-router-dom';
import { Heart, Star, Plus, Trash2 } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useFavorites } from '../context/FavoritesContext';

export default function Favorites() {
  const navigate      = useNavigate();
  const { addToCart } = useCart();
  const { favorites, removeFavorite } = useFavorites();

  const remove = (id) => removeFavorite(id);

  const addItem = (item) => {
    addToCart({ id:item.id, name:item.name, price:item.price, quantity:1, image:item.image },
              { id:item.restaurantId || item.restaurant, name:item.restaurant });
    navigate('/cart');
  };

  return (
    <div className="space-y-4 pb-20 lg:pb-0 animate-fade-up">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-heading font-bold text-white">My Favorites</h1>
        {favorites.length > 0 && (
          <span className="glass text-forest-200/60 text-xs px-3 py-1.5 rounded-full">{favorites.length} saved</span>
        )}
      </div>

      {favorites.length === 0 ? (
        <div className="min-h-[calc(100vh-15rem)] flex items-center">
          <div className="glass rounded-3xl py-16 px-6 flex flex-col items-center gap-3 text-center w-full">
            <Heart className="w-16 h-16 text-forest-300/20" />
            <p className="text-white font-semibold">No favorites yet</p>
            <p className="text-forest-200/50 text-sm">Tap the heart on any food item to save it here.</p>
            <button onClick={() => navigate('/restaurants')} className="btn-glow-orange text-white text-sm px-5 py-2.5 rounded-xl mt-2">
              Browse Food
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {favorites.map((item, idx) => (
            <div key={item.id}
              onClick={() => navigate(`/food/${item.id}`, { state:{ foodItem:item } })}
              className="restaurant-card card-3d glass cursor-pointer group animate-fade-up"
              style={{ animationDelay:`${idx*60}ms` }}>
              <div className="relative aspect-square overflow-hidden">
                <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <button onClick={e => { e.stopPropagation(); remove(item.id); }}
                  className="absolute top-2 right-2 w-7 h-7 glass rounded-full flex items-center justify-center hover:glass-orange transition-all">
                  <Trash2 className="w-3.5 h-3.5 text-red-400" />
                </button>
                <p className="absolute bottom-2 left-2 text-white font-bold text-sm text-glow-orange">₱{Number(item.price).toFixed(2)}</p>
              </div>
              <div className="p-3">
                <p className="text-white font-semibold text-sm truncate">{item.name}</p>
                <p className="text-forest-200/50 text-xs truncate mb-3">{item.restaurant}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`w-3 h-3 ${i < item.rating ? 'fill-ember-400 text-ember-400' : 'text-forest-700'}`} />
                    ))}
                  </div>
                  <button onClick={e => { e.stopPropagation(); addItem(item); }}
                    className="w-7 h-7 btn-glow-orange rounded-lg flex items-center justify-center">
                    <Plus className="w-3.5 h-3.5 text-white" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
