import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getRestaurants, getAllMenuItems } from '../services/api';
import { useCart } from '../context/CartContext';
import Loader from '../components/Loader';
import { Utensils, Store, Plus, Minus, X, Heart, Star, Search, SlidersHorizontal, ChevronRight } from 'lucide-react';

const CATEGORIES = [
  { id:'all',      label:'All',      emoji:'🍽️' },
  { id:'pizza',    label:'Pizza',    emoji:'🍕' },
  { id:'burgers',  label:'Burgers',  emoji:'🍔' },
  { id:'sushi',    label:'Sushi',    emoji:'🍣' },
  { id:'pasta',    label:'Pasta',    emoji:'🍝' },
  { id:'salads',   label:'Salads',   emoji:'🥗' },
  { id:'desserts', label:'Desserts', emoji:'🍰' },
  { id:'drinks',   label:'Drinks',   emoji:'🥤' },
];

export default function Restaurants() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { addToCart } = useCart();

  const [restaurants, setRestaurants]     = useState([]);
  const [foodItems, setFoodItems]         = useState([]);
  const [loading, setLoading]             = useState(true);
  const [searchQuery, setSearchQuery]     = useState(searchParams.get('search') || '');
  const [selectedCat, setSelectedCat]     = useState(searchParams.get('category') || 'all');
  const [sortBy, setSortBy]               = useState('recommended');
  const [viewMode, setViewMode]           = useState('food');
  const [favorites, setFavorites]         = useState([]);
  const [modalItem, setModalItem]         = useState(null);
  const [modalQty, setModalQty]           = useState(1);

  useEffect(() => { fetchData(); }, [selectedCat, searchQuery, sortBy, viewMode]);

  const fetchData = async () => {
    setLoading(true);
    const start = Date.now();
    try {
      const filters = { category: selectedCat, search: searchQuery, sortBy: sortBy !== 'recommended' ? sortBy : undefined };
      if (viewMode === 'food') setFoodItems(await getAllMenuItems(filters));
      else setRestaurants(await getRestaurants(filters));
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

  const toggleFav = (id) => setFavorites(p => p.includes(id) ? p.filter(i=>i!==id) : [...p, id]);

  const addItem = (item, qty = 1) => {
    addToCart({ id:item.id, name:item.name, price:item.price, quantity:qty, image:item.image },
              item.restaurant || { id: item.restaurant_id, name: '' });
  };

  return (
    <div className="space-y-5 pb-20 lg:pb-0 animate-fade-up">
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
            <option value="recommended" style={{background:'#0d2b1a'}}>Recommended</option>
            <option value="rating" style={{background:'#0d2b1a'}}>Top Rated</option>
            {viewMode==='restaurants'
              ? <option value="deliveryTime" style={{background:'#0d2b1a'}}>Fastest</option>
              : <option value="price" style={{background:'#0d2b1a'}}>Price ↑</option>}
          </select>
          <SlidersHorizontal className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-forest-300/50 pointer-events-none" />
        </div>
      </div>

      {/* Categories */}
      <div className="flex gap-2.5 overflow-x-auto scrollbar-hide pb-1">
        {CATEGORIES.map(({id, label, emoji}) => (
          <button key={id} onClick={() => handleCat(id)}
            className={`category-pill flex-shrink-0 px-3 py-2 text-xs
              ${selectedCat===id ? 'active text-white' : 'glass text-forest-100/60 hover:text-white hover:glass-green'}`}>
            <span className="text-lg">{emoji}</span>
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && <Loader size="lg" />}

      {/* Food grid */}
      {!loading && viewMode === 'food' && (
        foodItems.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {foodItems.map((item, idx) => (
              <div key={item.id} onClick={() => navigate(`/food/${item.id}`, { state:{ foodItem:item } })}
                className="restaurant-card card-3d glass cursor-pointer group animate-fade-up"
                style={{ animationDelay:`${idx*40}ms` }}>
                <div className="relative aspect-square overflow-hidden">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <button onClick={e => { e.stopPropagation(); toggleFav(item.id); }}
                    className="absolute top-2 right-2 w-7 h-7 glass rounded-full flex items-center justify-center">
                    <Heart className={`w-3.5 h-3.5 ${favorites.includes(item.id) ? 'fill-ember-400 text-ember-400' : 'text-white/70'}`} />
                  </button>
                  <p className="absolute bottom-2 left-2 text-white font-bold text-sm text-glow-orange">₱{item.price.toFixed(2)}</p>
                </div>
                <div className="p-2.5">
                  <p className="text-white font-semibold text-xs truncate">{item.name}</p>
                  <p className="text-forest-200/50 text-xs truncate mb-2">{item.restaurant?.name}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 fill-ember-400 text-ember-400" />
                      <span className="text-ember-300 text-xs">{item.rating || '4.8'}</span>
                    </div>
                    <button onClick={e => { e.stopPropagation(); setModalItem(item); setModalQty(1); }}
                      className="w-6 h-6 btn-glow-orange rounded-lg flex items-center justify-center">
                      <Plus className="w-3 h-3 text-white" />
                    </button>
                  </div>
                </div>
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
                  <img src={r.image} alt={r.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                  {!r.isOpen && (
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

      {/* Add-to-cart modal */}
      {modalItem && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ background:'rgba(0,0,0,.7)', backdropFilter:'blur(8px)' }}
          onClick={() => setModalItem(null)}>
          <div className="glass w-full max-w-sm rounded-3xl overflow-hidden card-3d animate-fade-up"
            onClick={e => e.stopPropagation()}>
            <div className="relative h-48">
              <img src={modalItem.image} alt={modalItem.name} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              <button onClick={() => setModalItem(null)}
                className="absolute top-3 right-3 w-8 h-8 glass rounded-full flex items-center justify-center text-white">
                <X className="w-4 h-4" />
              </button>
              <p className="absolute bottom-3 left-4 text-white font-bold text-xl text-glow-orange">₱{modalItem.price.toFixed(2)}</p>
            </div>
            <div className="p-5">
              <p className="text-white font-heading font-bold text-lg mb-1">{modalItem.name}</p>
              <p className="text-forest-200/60 text-sm mb-4">{modalItem.description}</p>
              <div className="flex items-center justify-between mb-5">
                <span className="text-forest-200/60 text-sm">Quantity</span>
                <div className="flex items-center gap-3">
                  <button onClick={() => setModalQty(q => Math.max(1,q-1))}
                    className="w-8 h-8 glass rounded-xl flex items-center justify-center hover:glass-orange transition-all">
                    <Minus className="w-4 h-4 text-forest-200" />
                  </button>
                  <span className="text-white font-bold w-5 text-center">{modalQty}</span>
                  <button onClick={() => setModalQty(q => q+1)}
                    className="w-8 h-8 glass rounded-xl flex items-center justify-center hover:glass-green transition-all">
                    <Plus className="w-4 h-4 text-forest-200" />
                  </button>
                </div>
              </div>
              <button onClick={() => { addItem(modalItem, modalQty); setModalItem(null); }}
                className="w-full py-3.5 btn-glow-orange text-white font-bold rounded-xl flex items-center justify-center gap-2">
                Add to Cart — ₱{(modalItem.price * modalQty).toFixed(2)} <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
