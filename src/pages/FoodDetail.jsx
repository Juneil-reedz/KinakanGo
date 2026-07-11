import { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { ArrowLeft, Heart, Star, Clock, MapPin, Plus, Minus, ShoppingCart, Check } from 'lucide-react';

const ADD_ONS = [
  { id:1, name:'Extra Cheese', price:50,  image:'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=200&h=200&fit=crop' },
  { id:2, name:'Pickles',      price:30,  image:'https://images.unsplash.com/photo-1623218655048-d60d0a8ee280?w=200&h=200&fit=crop' },
  { id:3, name:'Extra Patty',  price:100, image:'https://images.unsplash.com/photo-1551248429-40975aa4de74?w=200&h=200&fit=crop' },
];

export default function FoodDetail() {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const location   = useLocation();
  const { addToCart } = useCart();

  const [quantity, setQuantity]         = useState(1);
  const [selectedAddOns, setSelectedAddOns] = useState([]);
  const [fav, setFav]                   = useState(false);

  const foodItem = location.state?.foodItem || {
    id: parseInt(id), name:'Delicious Food',
    description:'Fresh ingredients prepared with care. A delicious combination of flavors that will satisfy your cravings.',
    price:350, rating:4.5,
    image:'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&h=800&fit=crop',
    restaurant:'Restaurant', category:'food',
  };

  const toggleAddOn = (a) => setSelectedAddOns(p => p.find(i=>i.id===a.id) ? p.filter(i=>i.id!==a.id) : [...p,a]);
  const total = (foodItem.price + selectedAddOns.reduce((s,a)=>s+a.price,0)) * quantity;

  const handleAdd = () => {
    const restaurantInfo = typeof foodItem.restaurant === 'string'
      ? { id: foodItem.restaurant, name: foodItem.restaurant }
      : { id: foodItem.restaurant?.id || 0, name: foodItem.restaurant?.name || 'Restaurant' };
    addToCart({ id:foodItem.id, name:foodItem.name, price:total/quantity, quantity, addOns:selectedAddOns, image:foodItem.image }, restaurantInfo);
    navigate('/cart');
  };

  return (
    <div className="min-h-screen relative pb-32 animate-fade-up">
      <div className="orb w-72 h-72 bg-forest-600/15 top-0 right-0" />

      {/* Hero image */}
      <div className="relative h-72 sm:h-80 overflow-hidden">
        <img src={foodItem.image} alt={foodItem.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        {/* Nav buttons */}
        <button onClick={() => navigate(-1)}
          className="absolute top-4 left-4 w-10 h-10 glass rounded-xl flex items-center justify-center text-white hover:glass-green transition-all">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <button onClick={() => setFav(f=>!f)}
          className="absolute top-4 right-4 w-10 h-10 glass rounded-xl flex items-center justify-center hover:glass-orange transition-all">
          <Heart className={`w-5 h-5 ${fav ? 'fill-ember-400 text-ember-400' : 'text-white/70'}`} />
        </button>
      </div>

      {/* Content panel */}
      <div className="relative z-10 -mt-8 glass rounded-t-3xl p-6 min-h-screen">
        <div className="max-w-2xl mx-auto space-y-5">
          {/* Title */}
          <div>
            <div className="flex items-start justify-between gap-3">
              <h1 className="text-xl font-heading font-bold text-white">{foodItem.name}</h1>
              <p className="text-ember-400 font-heading font-bold text-xl flex-shrink-0">â‚±{Number(foodItem.price).toFixed(2)}</p>
            </div>
            <p className="text-forest-200/60 text-sm capitalize mt-0.5">{foodItem.category || 'Food'}</p>
          </div>

          {/* Stats */}
          <div className="flex gap-3">
            <div className="flex items-center gap-1.5 glass-green rounded-xl px-3 py-2 text-xs">
              <Star className="w-3.5 h-3.5 fill-ember-400 text-ember-400" />
              <span className="text-forest-100">{foodItem.rating || '4.5'}</span>
            </div>
            <div className="flex items-center gap-1.5 glass rounded-xl px-3 py-2 text-xs text-forest-200/70">
              <MapPin className="w-3.5 h-3.5 text-ember-400" />
              {typeof foodItem.restaurant === 'string' ? foodItem.restaurant : foodItem.restaurant?.name}
            </div>
            <div className="flex items-center gap-1.5 glass rounded-xl px-3 py-2 text-xs text-forest-200/70">
              <Clock className="w-3.5 h-3.5" />30 min
            </div>
          </div>

          {/* Description */}
          <div>
            <p className="text-white font-semibold text-sm mb-2">Description</p>
            <p className="text-forest-200/60 text-sm leading-relaxed">{foodItem.description}</p>
          </div>

          {/* Add-ons */}
          <div>
            <p className="text-white font-semibold text-sm mb-3">Add Ons</p>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {ADD_ONS.map(a => {
                const selected = !!selectedAddOns.find(i=>i.id===a.id);
                return (
                  <button key={a.id} onClick={() => toggleAddOn(a)}
                    className={`flex-shrink-0 relative rounded-2xl overflow-hidden border-2 transition-all card-3d
                      ${selected ? 'border-ember-500 scale-95 shadow-[0_0_12px_rgba(230,126,34,.4)]' : 'border-transparent glass'}`}
                    style={{ width:80 }}>
                    <img src={a.image} alt={a.name} className="w-20 h-20 object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                    {selected && (
                      <div className="absolute top-1 right-1 w-5 h-5 btn-glow-orange rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                    <div className="absolute bottom-1 left-0 right-0 text-center">
                      <p className="text-white text-xs font-medium leading-tight">{a.name}</p>
                      <p className="text-ember-300 text-xs">+â‚±{a.price}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quantity */}
          <div className="flex items-center justify-between">
            <p className="text-white font-semibold text-sm">Quantity</p>
            <div className="flex items-center gap-3">
              <button onClick={() => setQuantity(q=>Math.max(1,q-1))}
                className="w-9 h-9 glass rounded-xl flex items-center justify-center hover:glass-orange transition-all">
                <Minus className="w-4 h-4 text-forest-200" />
              </button>
              <span className="text-white font-bold text-lg w-6 text-center">{quantity}</span>
              <button onClick={() => setQuantity(q=>q+1)}
                className="w-9 h-9 glass rounded-xl flex items-center justify-center hover:glass-green transition-all">
                <Plus className="w-4 h-4 text-forest-200" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 glass-dark p-4 z-20"
        style={{ borderTop:'1px solid rgba(255,255,255,.08)' }}>
        <div className="max-w-2xl mx-auto">
          <button onClick={handleAdd}
            className="w-full py-4 btn-glow-orange text-white font-heading font-bold rounded-2xl flex items-center justify-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Add to Cart â€” â‚±{total.toFixed(2)}
          </button>
        </div>
      </div>
    </div>
  );
}
