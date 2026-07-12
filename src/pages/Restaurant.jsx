import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { restaurantsApi, menuApi } from '../services/api';
import { useCart } from '../context/CartContext';
import { Heart, Star, Plus, Minus, X, ArrowLeft, Clock, Truck, ChevronRight, ShoppingCart, UtensilsCrossed } from 'lucide-react';

export default function Restaurant() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [restaurant, setRestaurant] = useState(null);
  const [menuItems, setMenuItems]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedCat, setSelectedCat]   = useState('All');
  const [quantity, setQuantity]         = useState(1);
  const [favorites, setFavorites]       = useState([]);

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

  const toggleFav = (itemId) => setFavorites(p => p.includes(itemId) ? p.filter(i => i !== itemId) : [...p, itemId]);

  const handleAddToCart = () => {
    if (!selectedItem) return;
    addToCart(
      { id: selectedItem.id, name: selectedItem.name, price: selectedItem.price, image: selectedItem.image_url, quantity },
      { id: restaurant.id, name: restaurant.name }
    );
    setSelectedItem(null);
    setQuantity(1);
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
  const filtered   = selectedCat === 'All' ? menuItems : menuItems.filter(i => i.category_name === selectedCat);

  return (
    <div className="space-y-4 pb-20 lg:pb-0 animate-fade-up">
      {/* Back */}
      <button onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-forest-200/60 hover:text-forest-100 text-sm transition-colors">
        <ArrowLeft className="w-4 h-4" /> Restaurants
      </button>

      {/* Restaurant hero */}
      <div className="glass card-3d rounded-3xl overflow-hidden">
        <div className="relative h-40">
          {restaurant.image_url
            ? <img src={restaurant.image_url} alt={restaurant.name} className="w-full h-full object-cover" />
            : <div className="w-full h-full glass-dark flex items-center justify-center"><UtensilsCrossed className="w-12 h-12 text-forest-300/30" /></div>
          }
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          {!restaurant.is_open && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="glass text-white px-4 py-1.5 rounded-full font-semibold">Currently Closed</span>
            </div>
          )}
          <div className="absolute bottom-4 left-5 right-5">
            <h1 className="text-2xl font-heading font-bold text-white text-glow-green mb-1">{restaurant.name}</h1>
            {restaurant.description && <p className="text-forest-200/80 text-xs line-clamp-1">{restaurant.description}</p>}
          </div>
        </div>
        <div className="px-5 py-3 flex items-center gap-4 flex-wrap">
          <span className="flex items-center gap-1.5 text-ember-300 text-sm font-semibold">
            <Star className="w-4 h-4 fill-current" />{Number(restaurant.rating ?? 0).toFixed(1)}
            <span className="text-forest-200/50 font-normal text-xs">({restaurant.review_count ?? 0} reviews)</span>
          </span>
          <span className="flex items-center gap-1.5 text-forest-200/70 text-sm">
            <Truck className="w-3.5 h-3.5" />₱{restaurant.delivery_fee} delivery
          </span>
          {restaurant.cuisine && (
            <span className="glass-green text-forest-200 text-xs px-2 py-0.5 rounded-full capitalize">{restaurant.cuisine}</span>
          )}
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

      {/* Menu grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {filtered.map((item, idx) => (
            <div key={item.id} onClick={() => { setSelectedItem(item); setQuantity(1); }}
              className="restaurant-card card-3d glass cursor-pointer group animate-fade-up"
              style={{ animationDelay:`${idx * 30}ms` }}>
              <div className="relative aspect-square overflow-hidden">
                {item.image_url
                  ? <img src={item.image_url} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  : <div className="w-full h-full glass-dark flex items-center justify-center"><UtensilsCrossed className="w-8 h-8 text-forest-300/30" /></div>
                }
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <button onClick={e => { e.stopPropagation(); toggleFav(item.id); }}
                  className="absolute top-2 right-2 w-7 h-7 glass rounded-full flex items-center justify-center">
                  <Heart className={`w-3.5 h-3.5 ${favorites.includes(item.id) ? 'fill-ember-400 text-ember-400' : 'text-white/70'}`} />
                </button>
                <p className="absolute bottom-2 left-2 text-white font-bold text-sm text-glow-orange">₱{Number(item.price).toFixed(2)}</p>
              </div>
              <div className="p-2.5">
                <p className="text-white font-semibold text-xs truncate">{item.name}</p>
                <p className="text-forest-200/50 text-xs truncate mb-2">{item.category_name || 'Food'}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 fill-ember-400 text-ember-400" />
                    <span className="text-ember-300 text-xs">{Number(restaurant.rating ?? 0).toFixed(1)}</span>
                  </div>
                  <button onClick={e => { e.stopPropagation(); setSelectedItem(item); setQuantity(1); }}
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
          <UtensilsCrossed className="w-12 h-12 text-forest-300/40" />
          <p className="text-white font-semibold">No items in this category</p>
          {selectedCat !== 'All' && (
            <button onClick={() => setSelectedCat('All')} className="btn-glow-orange text-white text-sm px-5 py-2.5 rounded-xl mt-2">
              Show All
            </button>
          )}
        </div>
      )}

      {/* Item modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ background:'rgba(0,0,0,.7)', backdropFilter:'blur(8px)' }}
          onClick={() => setSelectedItem(null)}>
          <div className="glass w-full max-w-sm rounded-3xl overflow-hidden card-3d animate-fade-up"
            onClick={e => e.stopPropagation()}>
            <div className="relative h-52">
              {selectedItem.image_url
                ? <img src={selectedItem.image_url} alt={selectedItem.name} className="w-full h-full object-cover" />
                : <div className="w-full h-full glass-dark flex items-center justify-center"><UtensilsCrossed className="w-14 h-14 text-forest-300/30" /></div>
              }
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              <button onClick={() => setSelectedItem(null)}
                className="absolute top-3 right-3 w-8 h-8 glass rounded-full flex items-center justify-center text-white">
                <X className="w-4 h-4" />
              </button>
              <p className="absolute bottom-3 left-4 text-white font-bold text-xl text-glow-orange">₱{Number(selectedItem.price).toFixed(2)}</p>
            </div>
            <div className="p-5">
              <p className="text-white font-heading font-bold text-lg mb-1">{selectedItem.name}</p>
              {selectedItem.description && <p className="text-forest-200/60 text-sm mb-4">{selectedItem.description}</p>}
              <div className="flex items-center justify-between mb-5">
                <span className="text-forest-200/60 text-sm">Quantity</span>
                <div className="flex items-center gap-3">
                  <button onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    className="w-8 h-8 glass rounded-xl flex items-center justify-center hover:glass-orange transition-all">
                    <Minus className="w-4 h-4 text-forest-200" />
                  </button>
                  <span className="text-white font-bold w-5 text-center">{quantity}</span>
                  <button onClick={() => setQuantity(q => q + 1)}
                    className="w-8 h-8 glass rounded-xl flex items-center justify-center hover:glass-green transition-all">
                    <Plus className="w-4 h-4 text-forest-200" />
                  </button>
                </div>
              </div>
              <button onClick={handleAddToCart}
                className="w-full py-3.5 btn-glow-orange text-white font-bold rounded-xl flex items-center justify-center gap-2">
                <ShoppingCart className="w-4 h-4" />
                Add to Cart — ₱{(Number(selectedItem.price) * quantity).toFixed(2)}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
