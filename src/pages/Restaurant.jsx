import { useState, useEffect } from 'react';
import { flushSync } from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import { restaurantsApi, menuApi } from '../services/api';
import { useCart } from '../context/CartContext';
import { useFavorites } from '../context/FavoritesContext';
import { Star, Plus, Check, Heart, ArrowLeft, Truck, UtensilsCrossed } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';
import useGoBack from '../hooks/useGoBack';
import { foodRating } from '../utils/foodRating';

export default function Restaurant() {
  const { id } = useParams();
  const navigate = useNavigate();
  const goBack = useGoBack();
  const { addToCart } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();

  const [restaurant, setRestaurant] = useState(null);
  const [menuItems, setMenuItems]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [selectedCat, setSelectedCat]   = useState('All');
  const [justAdded, setJustAdded]       = useState(null);
  const { addNotification } = useNotification();

  useEffect(() => {
    if (!id || id === 'undefined') { setLoading(false); return; }
    setLoading(true);
    Promise.all([
      restaurantsApi.getOne(id),
      menuApi.list(id),
    ]).then(([rData, mData]) => {
      setRestaurant(rData);
      setMenuItems(Array.isArray(mData) ? mData : []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  // "+" adds one to the cart and stays here
  const addItem = (item) => {
    const added = addToCart(
      { id: item.id, name: item.name, price: Number(item.price), image: item.image_url, quantity: 1 },
      { id: restaurant.id, name: restaurant.name }
    );
    if (!added) return;
    addNotification(`${item.name} added to cart`, 'success');
    setJustAdded(item.id);
    setTimeout(() => setJustAdded(v => (v === item.id ? null : v)), 1200);
  };

  // Open the food page (photo flies into place where supported); swiping
  // there moves through the same category
  const openFood = (item, options) => {
    const foodItem = { ...item, restaurant_id: restaurant.id, restaurant_name: restaurant.name };
    const morph = !!document.startViewTransition && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const go = () => navigate(`/food/${item.id}`, { state: { foodItem, morph, options: options.map(o => ({ ...o, restaurant_id: restaurant.id, restaurant_name: restaurant.name })) } });
    if (morph) document.startViewTransition(() => flushSync(go));
    else go();
  };

  if (loading) return (
    <div className="space-y-4 animate-fade-up">
      <div className="glass rounded-3xl h-48 animate-pulse" />
      <div className="glass rounded-2xl h-10 animate-pulse" />
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[1,2,3,4,5,6].map(i => <div key={i} className="glass rounded-2xl h-44 animate-pulse" />)}
      </div>
    </div>
  );

  if (!restaurant) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="glass rounded-3xl p-10 text-center card-3d">
        <UtensilsCrossed className="w-12 h-12 text-forest-300/50 mx-auto mb-4" />
        <p className="text-white text-lg font-bold mb-4">Restaurant not found</p>
        <button onClick={() => navigate('/restaurants')} className="btn-glow-orange text-white px-6 py-3 rounded-xl">Back</button>
      </div>
    </div>
  );

  const categories = ['All', ...new Set(menuItems.map(i => i.category_name).filter(Boolean))];
  // Food grouped by category, in menu order; a picked pill shows only that one
  const byCat = new Map();
  for (const it of menuItems) {
    const c = it.category_name || 'Other';
    if (!byCat.has(c)) byCat.set(c, []);
    byCat.get(c).push(it);
  }
  const sections = [...byCat].filter(([c]) => selectedCat === 'All' || c === selectedCat);

  return (
    <div className="space-y-4 pb-20 lg:pb-0 animate-fade-up">
      {/* Back */}
      <button onClick={() => goBack('/restaurants')}
        className="flex items-center gap-1.5 text-forest-200/60 hover:text-forest-100 text-sm transition-colors">
        <ArrowLeft className="w-4 h-4" /> Restaurants
      </button>

      {/* Cover photo as the card's background, the round logo on its bottom edge,
          then the name and details under the logo */}
      <div className="store-hero relative mx-auto max-w-xl">
        <div className="store-cover">
          {restaurant.cover_url
            ? <img src={restaurant.cover_url} alt="" />
            : restaurant.image_url && <img src={restaurant.image_url} alt="" className="is-blur" />}
        </div>
        <div className="store-hero-photo">
          {restaurant.image_url
            ? <img src={restaurant.image_url} alt={restaurant.name} />
            : <span className="w-full h-full flex items-center justify-center"><UtensilsCrossed className="w-12 h-12 text-forest-300/40" /></span>}
          {!restaurant.is_open && (
            <span className="absolute inset-0 bg-black/55 flex items-center justify-center text-white text-xs font-bold">Closed</span>
          )}
        </div>
      </div>
      <div className="text-center px-4 pt-[5.25rem]">
        <h1 className="text-2xl font-heading font-bold text-white">{restaurant.name}</h1>
        {restaurant.description && <p className="text-forest-200/70 text-sm mt-1 max-w-md mx-auto">{restaurant.description}</p>}
        <div className="flex items-center justify-center gap-2 flex-wrap text-xs mt-2.5">
          <span className="flex items-center gap-1 text-ember-400 font-semibold">
            <Star className="w-3.5 h-3.5 fill-current" />{Number(restaurant.rating ?? 0).toFixed(1)}
            <span className="text-forest-200/50 font-normal">({restaurant.review_count ?? 0})</span>
          </span>
          <span className="text-white/20">•</span>
          <span className="flex items-center gap-1 text-forest-200/70">
            <Truck className="w-3.5 h-3.5" />₱{restaurant.delivery_fee} delivery
          </span>
          {restaurant.cuisine && (<>
            <span className="text-white/20">•</span>
            <span className="text-forest-200/70 capitalize">{restaurant.cuisine}</span>
          </>)}
        </div>
      </div>

      {/* Category pills */}
      {categories.length > 1 && (
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {categories.map(cat => (
            <button key={cat} onClick={() => setSelectedCat(cat)}
              className={`category-pill flex-shrink-0 px-3 py-2 text-xs
                ${selectedCat === cat ? 'active text-white' : 'glass text-forest-100/60 hover:text-white hover:glass-green'}`}>
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Menu: one row per category, swipe right through its food */}
      {sections.length > 0 ? sections.map(([cat, items], si) => (
        <section key={cat} className="animate-fade-up" style={{ animationDelay: `${si * 80}ms` }}>
          <div className="flex items-end justify-between px-1">
            <h2 className="text-white font-heading font-bold text-lg">{cat}</h2>
            <span className="text-forest-200/50 text-xs">{items.length} item{items.length === 1 ? '' : 's'}</span>
          </div>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide snap-x snap-mandatory scroll-px-4 -mx-4 px-4 pt-12 pb-3">
            {items.map((item, idx) => (
              <div key={item.id} role="button" tabIndex={0}
                onClick={() => openFood(item, items)}
                onKeyDown={e => { if (e.key === 'Enter') openFood(item, items); }}
                className="food-card relative flex-shrink-0 w-[10.5rem] snap-start cursor-pointer animate-fade-up text-center px-3 pb-4 pt-[4.6rem]"
                style={{ animationDelay: `${idx * 50}ms` }}>
                <div className="food-card-photo" style={{ viewTransitionName: `food-${item.id}` }}>
                  {item.image_url
                    ? <img src={item.image_url} alt="" loading="lazy" />
                    : <span className="w-full h-full flex items-center justify-center"><UtensilsCrossed className="w-8 h-8 text-forest-300/40" /></span>}
                </div>
                <button onClick={e => { e.stopPropagation(); toggleFavorite(item, restaurant); }}
                  aria-label={isFavorite(item.id) ? `Remove ${item.name} from favorites` : `Add ${item.name} to favorites`}
                  className="absolute top-10 right-1.5 w-7 h-7 rounded-full flex items-center justify-center bg-white/5">
                  <Heart className={`w-3.5 h-3.5 ${isFavorite(item.id) ? 'fill-ember-400 text-ember-400' : 'text-white/60'}`} />
                </button>
                <p className="text-white font-heading font-bold text-[.95rem] leading-snug line-clamp-2">{item.name}</p>
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
        </section>
      )) : (
        <div className="glass rounded-3xl py-16 flex flex-col items-center gap-3">
          <UtensilsCrossed className="w-12 h-12 text-forest-300/40" />
          <p className="text-white font-semibold">No items in this category</p>
          {selectedCat !== 'All' && (
            <button onClick={() => setSelectedCat('All')} className="btn-glow-orange text-white text-sm px-5 py-2.5 rounded-xl mt-2">
              Show All
            </button>
          )}
        </div>
      )}
    </div>
  );
}
