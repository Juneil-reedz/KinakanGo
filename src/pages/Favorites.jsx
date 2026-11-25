import { useState, useEffect } from 'react';
import { flushSync } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Heart, Star, Plus, Check } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useFavorites } from '../context/FavoritesContext';
import { useNotification } from '../context/NotificationContext';
import { foodRating } from '../utils/foodRating';

// Same staggered columns as the Food page: 2 on phones, more on wider screens
const COLUMN_QUERIES = [['(min-width: 64rem)', 4], ['(min-width: 37.5rem)', 3]];
const pickColumns = () => {
  if (typeof window === 'undefined') return 2;
  const hit = COLUMN_QUERIES.find(([q]) => window.matchMedia(q).matches);
  return hit ? hit[1] : 2;
};

export default function Favorites() {
  const navigate      = useNavigate();
  const { addToCart } = useCart();
  const { addNotification } = useNotification();
  const { favorites, removeFavorite } = useFavorites();
  const [justAdded, setJustAdded] = useState(null);
  const [columns, setColumns] = useState(pickColumns);
  useEffect(() => {
    const onResize = () => setColumns(pickColumns());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // "+" adds one to the cart and stays here, like the Food page
  const addItem = (item) => {
    const added = addToCart({ id:item.id, name:item.name, price:Number(item.price), quantity:1, image:item.image },
              { id:item.restaurantId || item.restaurant, name:item.restaurant });
    if (!added) return;
    addNotification(`${item.name} added to cart`, 'success');
    setJustAdded(item.id);
    setTimeout(() => setJustAdded(id => (id === item.id ? null : id)), 1200);
  };

  // Open the food page; the round photo flies into place where supported
  const asFood = (f) => ({ ...f, image_url: f.image, restaurant_id: f.restaurantId, restaurant_name: f.restaurant, category_name: f.category });
  const openFood = (item) => {
    const morph = !!document.startViewTransition && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const go = () => navigate(`/food/${item.id}`, { state: { foodItem: asFood(item), morph, options: favorites.map(asFood) } });
    if (morph) document.startViewTransition(() => flushSync(go));
    else go();
  };

  return (
    <div className="space-y-4 pb-24 lg:pb-0 animate-fade-up">
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
        /* Floating cards with a round photo, in staggered columns like the Food page */
        <div className="flex gap-3 items-start">
          {Array.from({ length: columns }, (_, col) => (
            <div key={col} className={`flex-1 min-w-0 flex flex-col gap-3 ${col % 2 === 1 ? 'pt-14' : ''}`}>
              {favorites.filter((_, i) => i % columns === col).map((item, idx) => (
                <div key={item.id} role="button" tabIndex={0}
                  onClick={() => openFood(item)}
                  onKeyDown={e => { if (e.key === 'Enter') openFood(item); }}
                  className="food-card relative cursor-pointer animate-fade-up text-center px-3 pb-4 pt-[4.6rem] mt-12"
                  style={{ animationDelay: `${(idx * columns + col) * 50}ms` }}>
                  <div className="food-card-photo" style={{ viewTransitionName: `food-${item.id}` }}>
                    <img src={item.image} alt="" loading="lazy" />
                  </div>
                  <button onClick={e => { e.stopPropagation(); removeFavorite(item.id); }}
                    aria-label={`Remove ${item.name} from favorites`}
                    className="absolute top-10 right-1.5 w-7 h-7 rounded-full flex items-center justify-center bg-white/5">
                    <Heart className="w-3.5 h-3.5 fill-ember-400 text-ember-400" />
                  </button>
                  <p className="text-white font-heading font-bold text-[.95rem] leading-snug line-clamp-2">{item.name}</p>
                  <p className="text-forest-200/50 text-xs truncate mt-0.5">{item.restaurant}</p>
                  <p className="flex items-center justify-center gap-1 text-ember-400 text-[11px] font-semibold mt-1.5">
                    <Star className="w-3 h-3 fill-current" /> {foodRating(item)}
                  </p>
                  <div className="flex items-center justify-center gap-2 mt-2">
                    <p className="text-white font-heading font-extrabold text-xl"><span className="text-ember-500 text-sm mr-0.5">₱</span>{Number(item.price).toFixed(2)}</p>
                    <button onClick={e => { e.stopPropagation(); addItem(item); }}
                      aria-label={`Add ${item.name} to cart`}
                      className="w-7 h-7 btn-glow-orange rounded-full flex items-center justify-center flex-shrink-0">
                      {justAdded === item.id ? <Check className="w-3.5 h-3.5 text-white" /> : <Plus className="w-3.5 h-3.5 text-white" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
