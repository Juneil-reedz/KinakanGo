import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getRestaurantById, getMenuByRestaurantId } from '../services/api';
import { useCart } from '../context/CartContext';
import Loader from '../components/Loader';
import { Heart, Star, Plus, Minus, X, ArrowLeft, Clock, Truck, ChevronRight, ShoppingCart } from 'lucide-react';

const MENU_CATS = [
  { id:'all', name:'All' }, { id:'pizza', name:'Pizza' }, { id:'pasta', name:'Pasta' },
  { id:'burgers', name:'Burgers' }, { id:'sushi', name:'Sushi' }, { id:'salads', name:'Salads' },
  { id:'sides', name:'Sides' }, { id:'drinks', name:'Drinks' }, { id:'soup', name:'Soups' },
];

export default function Restaurant() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [restaurant, setRestaurant] = useState(null);
  const [menuItems, setMenuItems]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedCat, setSelectedCat]   = useState('all');
  const [quantity, setQuantity]         = useState(1);
  const [favorites, setFavorites]       = useState([]);

  useEffect(() => { fetchData(); }, [id, selectedCat]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rData, mData] = await Promise.all([
        getRestaurantById(id),
        getMenuByRestaurantId(id, selectedCat),
      ]);
      setRestaurant(rData);
      setMenuItems(mData);
    } catch { /* handle gracefully */ } finally {
      setLoading(false);
    }
  };

  const toggleFav = (itemId) => setFavorites(p => p.includes(itemId) ? p.filter(i=>i!==itemId) : [...p,itemId]);

  const handleAddToCart = () => {
    if (!selectedItem) return;
    addToCart({ id:selectedItem.id, name:selectedItem.name, price:selectedItem.price, quantity, image:selectedItem.image }, restaurant);
    setSelectedItem(null);
    setQuantity(1);
  };

  if (loading) return <Loader fullScreen />;

  if (!restaurant) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="glass rounded-3xl p-10 text-center card-3d">
        <p className="text-white text-lg font-bold mb-4">Restaurant not found</p>
        <button onClick={() => navigate('/restaurants')} className="btn-glow-orange text-white px-6 py-3 rounded-xl">Back</button>
      </div>
    </div>
  );

  const availableCats = MENU_CATS.filter(c => c.id==='all' || menuItems.some(i => i.category===c.id));

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
          <img src={restaurant.image} alt={restaurant.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          {!restaurant.isOpen && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="glass text-white px-4 py-1.5 rounded-full font-semibold">Currently Closed</span>
            </div>
          )}
          <div className="absolute bottom-4 left-5 right-5">
            <h1 className="text-2xl font-heading font-bold text-white text-glow-green mb-1">{restaurant.name}</h1>
            <p className="text-forest-200/80 text-xs line-clamp-1">{restaurant.description}</p>
          </div>
        </div>
        <div className="px-5 py-3 flex items-center gap-4 flex-wrap">
          <span className="flex items-center gap-1.5 text-ember-300 text-sm font-semibold">
            <Star className="w-4 h-4 fill-current" />{restaurant.rating}
            <span className="text-forest-200/50 font-normal text-xs">({restaurant.reviews || 0}+ reviews)</span>
          </span>
          <span className="flex items-center gap-1.5 text-forest-200/70 text-sm">
            <Clock className="w-3.5 h-3.5" />{restaurant.deliveryTime || restaurant.delivery_time} min
          </span>
          <span className="flex items-center gap-1.5 text-forest-200/70 text-sm">
            <Truck className="w-3.5 h-3.5" />₱{restaurant.deliveryFee || restaurant.delivery_fee} delivery
          </span>
          {restaurant.cuisines?.map(c => (
            <span key={c} className="glass-green text-forest-200 text-xs px-2 py-0.5 rounded-full capitalize">{c}</span>
          ))}
        </div>
      </div>

      {/* Category pills */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {availableCats.map(({ id:cid, name }) => (
          <button key={cid} onClick={() => setSelectedCat(cid)}
            className={`category-pill flex-shrink-0 px-3 py-2 text-xs
              ${selectedCat===cid ? 'active text-white' : 'glass text-forest-100/60 hover:text-white hover:glass-green'}`}>
            {name}
          </button>
        ))}
      </div>

      {/* Menu grid */}
      {menuItems.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {menuItems.map((item, idx) => (
            <div key={item.id} onClick={() => { setSelectedItem(item); setQuantity(1); }}
              className="restaurant-card card-3d glass cursor-pointer group animate-fade-up"
              style={{ animationDelay:`${idx*30}ms` }}>
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
                <p className="text-forest-200/50 text-xs truncate mb-2 capitalize">{item.category || 'Food'}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 fill-ember-400 text-ember-400" />
                    <span className="text-ember-300 text-xs">{item.rating || '4.8'}</span>
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
          <span className="text-5xl">🍽️</span>
          <p className="text-white font-semibold">No items in this category</p>
          <button onClick={() => setSelectedCat('all')} className="btn-glow-orange text-white text-sm px-5 py-2.5 rounded-xl mt-2">
            Show All
          </button>
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
              <img src={selectedItem.image} alt={selectedItem.name} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              <button onClick={() => setSelectedItem(null)}
                className="absolute top-3 right-3 w-8 h-8 glass rounded-full flex items-center justify-center text-white">
                <X className="w-4 h-4" />
              </button>
              <p className="absolute bottom-3 left-4 text-white font-bold text-xl text-glow-orange">₱{selectedItem.price.toFixed(2)}</p>
            </div>
            <div className="p-5">
              <p className="text-white font-heading font-bold text-lg mb-1">{selectedItem.name}</p>
              <p className="text-forest-200/60 text-sm mb-4">{selectedItem.description}</p>
              <div className="flex items-center justify-between mb-5">
                <span className="text-forest-200/60 text-sm">Quantity</span>
                <div className="flex items-center gap-3">
                  <button onClick={() => setQuantity(q => Math.max(1,q-1))}
                    className="w-8 h-8 glass rounded-xl flex items-center justify-center hover:glass-orange transition-all">
                    <Minus className="w-4 h-4 text-forest-200" />
                  </button>
                  <span className="text-white font-bold w-5 text-center">{quantity}</span>
                  <button onClick={() => setQuantity(q => q+1)}
                    className="w-8 h-8 glass rounded-xl flex items-center justify-center hover:glass-green transition-all">
                    <Plus className="w-4 h-4 text-forest-200" />
                  </button>
                </div>
              </div>
              <button onClick={handleAddToCart}
                className="w-full py-3.5 btn-glow-orange text-white font-bold rounded-xl flex items-center justify-center gap-2">
                <ShoppingCart className="w-4 h-4" />
                Add to Cart — ₱{(selectedItem.price * quantity).toFixed(2)}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
