import { useState, useEffect } from 'react';
import { flushSync } from 'react-dom';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getRestaurants, getAllMenuItems } from '../services/api';
import { useCart } from '../context/CartContext';
import { useFavorites } from '../context/FavoritesContext';
import Loader from '../components/Loader';
import { Utensils, Hamburger, Pizza, Fish, Soup, Salad, CakeSlice, CupSoda, Store, Plus, Check, Heart, Star, Search, SlidersHorizontal, ChevronRight } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';
import { foodRating } from '../utils/foodRating';

const CATEGORIES = [
  { id:'all',      label:'All',      Icon: Utensils },
  { id:'pizza',    label:'Pizza',    Icon: Pizza },
  { id:'burgers',  label:'Burgers',  Icon: Hamburger },
  { id:'sushi',    label:'Sushi',    Icon: Fish },
  { id:'pasta',    label:'Pasta',    Icon: Soup },
  { id:'salads',   label:'Salads',   Icon: Salad },
  { id:'desserts', label:'Desserts', Icon: CakeSlice },
  { id:'drinks',   label:'Drinks',   Icon: CupSoda },
];

// 2 columns on phones, more on wider screens
const COLUMN_QUERIES = [['(min-width: 64rem)', 4], ['(min-width: 37.5rem)', 3]];
const pickColumns = () => {
  if (typeof window === 'undefined') return 2;
  const hit = COLUMN_QUERIES.find(([q]) => window.matchMedia(q).matches);
  return hit ? hit[1] : 2;
};

export default function Restaurants() {
  const [columns, setColumns] = useState(pickColumns);
  useEffect(() => {
    const onResize = () => setColumns(pickColumns());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { addToCart } = useCart();
  const { addNotification } = useNotification();
  const { isFavorite, toggleFavorite } = useFavorites();

  const [restaurants, setRestaurants]     = useState([]);
  const [foodItems, setFoodItems]         = useState([]);
  const [loading, setLoading]             = useState(true);
  const [searchQuery, setSearchQuery]     = useState(searchParams.get('search') || '');
  const [selectedCat, setSelectedCat]     = useState(searchParams.get('category') || 'all');
  const [sortBy, setSortBy]               = useState('recommended');
  const [viewMode, setViewMode]           = useState('food');
  const [justAdded, setJustAdded]         = useState(null); // id of the item showing a ✓

  // Searching from the top bar while already here changes ?search= : follow it
  const urlSearch = searchParams.get('search') || '';
  useEffect(() => { setSearchQuery(urlSearch); }, [urlSearch]);
  // A sort that only exists for the other view falls back to Recommended
  useEffect(() => {
    if ((viewMode === 'food' && sortBy === 'deliveryFee') || (viewMode === 'restaurants' && sortBy === 'price')) setSortBy('recommended');
  }, [viewMode, sortBy]);

  // Wait a moment after typing before searching, instead of one request per key
  useEffect(() => {
    const t = setTimeout(fetchData, 300);
    return () => clearTimeout(t);
  }, [selectedCat, searchQuery, sortBy, viewMode]);

  const fetchData = async () => {
    setLoading(true);
    const start = Date.now();
    try {
      const filters = {
        ...(selectedCat && selectedCat !== 'all' ? { category: selectedCat } : {}),
        ...(searchQuery ? { search: searchQuery } : {}),
        ...(sortBy !== 'recommended' ? { sortBy } : {}),
        limit: 100,
      };
      if (viewMode === 'food') {
        const res = await getAllMenuItems(filters);
        setFoodItems(Array.isArray(res) ? res : res?.data || []);
      } else {
        const res = await getRestaurants(filters);
        setRestaurants(Array.isArray(res) ? res : res?.data || []);
      }
    } catch { /* use empty state */ } finally {
      const wait = Math.max(0, 800 - (Date.now() - start));
      setTimeout(() => setLoading(false), wait);
    }
  };

  const handleCat = (id) => {
    setSelectedCat(id);
    const sp = new URLSearchParams(searchParams);
    id === 'all' ? sp.delete('category') : sp.set('category', id);
    setSearchParams(sp);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const sp = new URLSearchParams(searchParams);
    searchQuery.trim() ? sp.set('search', searchQuery) : sp.delete('search');
    setSearchParams(sp);
  };

  // "+" adds one straight to the cart (addToCart asks first if the cart is from another restaurant)
  const addItem = (item, qty = 1) => {
    const added = addToCart({ id:item.id, name:item.name, price:Number(item.price), quantity:qty, image:item.image_url || item.image },
              item.restaurant || { id: item.restaurant_id, name: item.restaurant_name || '' });
    if (!added) return;
    addNotification(`${item.name} added to cart`, 'success');
    setJustAdded(item.id);
    setTimeout(() => setJustAdded(id => (id === item.id ? null : id)), 1200);
  };

  // Open the food page; where the browser supports it, the round photo
  // flies from the card into place (a shared-element view transition)
  const openFood = (item) => {
    const morph = !!document.startViewTransition && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const go = () => navigate(`/food/${item.id}`, { state: { foodItem: item, morph, options: foodItems } });
    if (morph) document.startViewTransition(() => flushSync(go));
    else go();
  };

  return (
    <div className="space-y-5 pb-24 lg:pb-0 animate-fade-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-heading font-bold text-white">Food Order</h1>
        <div className="glass rounded-xl p-1 flex">
          {[{mode:'food',icon:Utensils,label:'Food'},{mode:'restaurants',icon:Store,label:'Stores'}].map(({mode,icon:Icon,label}) => (
            <button key={mode} onClick={() => setViewMode(mode)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all
                ${viewMode===mode ? 'btn-glow-orange text-white' : 'text-forest-100/60 hover:text-white'}`}>
              <Icon className="w-4 h-4" />{label}
            </button>
          ))}
        </div>
      </div>

      {/* Search + Sort */}
      <div className="flex gap-3">
        <form onSubmit={handleSearch} className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-forest-300/50" />
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            placeholder={`Search ${viewMode === 'food' ? 'food' : 'restaurants'}…`}
            className="w-full input-glass pl-10 pr-4 py-2.5 text-sm" />
        </form>
        <div className="relative">
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}
            className="input-glass pl-9 pr-3 py-2.5 text-sm appearance-none cursor-pointer">
            <option value="recommended" style={{background:'#1a1511'}}>Recommended</option>
            <option value="rating" style={{background:'#1a1511'}}>Top Rated</option>
            {viewMode==='restaurants'
              ? <option value="deliveryFee" style={{background:'#1a1511'}}>Lowest delivery fee</option>
              : <option value="price" style={{background:'#1a1511'}}>Price ↑</option>}
          </select>
          <SlidersHorizontal className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-forest-300/50 pointer-events-none" />
        </div>
      </div>

      {/* Categories */}
      <div className="flex gap-2.5 overflow-x-auto scrollbar-hide pb-1">
        {CATEGORIES.map(({id, label, Icon}) => (
          <button key={id} onClick={() => handleCat(id)} aria-pressed={selectedCat===id}
            className={`category-pill category-tile flex-shrink-0 ${selectedCat===id ? 'active' : 'glass'}`}>
            <Icon aria-hidden="true" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && <Loader size="lg" />}

      {/* Food: staggered columns of floating cards with a round photo */}
      {!loading && viewMode === 'food' && (
        foodItems.length > 0 ? (
          <div className="flex gap-3 items-start">
            {Array.from({ length: columns }, (_, col) => (
              <div key={col} className={`flex-1 min-w-0 flex flex-col gap-3 ${columns > 2 && col % 2 === 1 ? 'pt-14' : ''}`}>
                {col === 0 && (
                  <p className="font-heading font-bold text-white text-[1.6rem] leading-tight px-1 pt-1 pb-8">
                    Found<br />{foodItems.length} result{foodItems.length === 1 ? '' : 's'}
                  </p>
                )}
                {foodItems.filter((_, i) => i % columns === col).map((item, idx) => (
                  <div key={item.id} role="button" tabIndex={0}
                    onClick={() => openFood(item)}
                    onKeyDown={e => { if (e.key === 'Enter') openFood(item); }}
                    className="food-card relative cursor-pointer animate-fade-up text-center px-3 pb-4 pt-[4.6rem] mt-12"
                    style={{ animationDelay: `${(idx * columns + col) * 50}ms` }}>
                    <div className="food-card-photo" style={{ viewTransitionName: `food-${item.id}` }}>
                      <img src={item.image_url || item.image} alt="" loading="lazy" />
                    </div>
                    <button onClick={e => { e.stopPropagation(); toggleFavorite(item); }}
                      aria-label={isFavorite(item.id) ? `Remove ${item.name} from favorites` : `Add ${item.name} to favorites`}
                      className="absolute top-10 right-1.5 w-7 h-7 rounded-full flex items-center justify-center bg-white/5">
                      <Heart className={`w-3.5 h-3.5 ${isFavorite(item.id) ? 'fill-ember-400 text-ember-400' : 'text-white/60'}`} />
                    </button>
                    <p className="text-white font-heading font-bold text-[.95rem] leading-snug line-clamp-2">{item.name}</p>
                    <p className="text-forest-200/50 text-xs truncate mt-0.5">{item.restaurant_name || item.restaurant?.name}</p>
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
        ) : (
          <div className="glass rounded-3xl py-16 flex flex-col items-center gap-3">
            <span className="text-5xl">🍽️</span>
            <p className="text-white font-semibold">No food items found</p>
            <p className="text-forest-200/50 text-sm">Try adjusting your filters</p>
            <button onClick={() => { setSelectedCat('all'); setSearchQuery(''); }}
              className="btn-glow-orange text-white text-sm px-5 py-2.5 rounded-xl mt-2">Clear Filters</button>
          </div>
        )
      )}

      {/* Restaurants grid */}
      {!loading && viewMode === 'restaurants' && (
        restaurants.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {restaurants.map((r, idx) => (
              <button key={r.id} onClick={() => navigate(`/restaurant/${r.id}`)}
                className="restaurant-card card-3d glass text-left group animate-fade-up"
                style={{ animationDelay:`${idx*40}ms` }}>
                <div className="relative h-36 overflow-hidden">
                  <img src={r.image_url || r.image} alt={r.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                  {!(r.is_open ?? r.isOpen) && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="glass text-white/70 text-xs px-3 py-1 rounded-full">Closed</span>
                    </div>
                  )}
                  <div className="absolute bottom-2 left-3 right-3">
                    <p className="text-white font-semibold text-sm truncate">{r.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="flex items-center gap-0.5 text-ember-300 text-xs"><Star className="w-3 h-3 fill-current" />{r.rating}</span>
                      <span className="text-white/40 text-xs">•</span>
                      <span className="text-forest-200 text-xs">{r.delivery_time || r.deliveryTime} min</span>
                    </div>
                  </div>
                </div>
                <div className="p-3 flex items-center justify-between">
                  <span className="glass-green text-forest-200 text-xs px-2 py-0.5 rounded-full capitalize">{r.category}</span>
                  <span className="text-forest-200/50 text-xs">₱{r.delivery_fee ?? r.deliveryFee} del.</span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="glass rounded-3xl py-16 flex flex-col items-center gap-3">
            <span className="text-5xl">🏪</span>
            <p className="text-white font-semibold">No restaurants found</p>
            <button onClick={() => { setSelectedCat('all'); setSearchQuery(''); }}
              className="btn-glow-orange text-white text-sm px-5 py-2.5 rounded-xl mt-2">Clear Filters</button>
          </div>
        )
      )}

    </div>
  );
}
