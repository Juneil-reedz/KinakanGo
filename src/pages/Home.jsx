import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFeaturedRestaurants } from '../services/api';
import { useCart } from '../context/CartContext';
import { Heart, Star, Plus, Clock, Truck, Tag, ChevronRight, Flame, Zap } from 'lucide-react';

const CATEGORIES = [
  { name: 'All',      emoji: '🍽️' },
  { name: 'Burger',   emoji: '🍔' },
  { name: 'Pizza',    emoji: '🍕' },
  { name: 'Sushi',    emoji: '🍣' },
  { name: 'Chicken',  emoji: '🍗' },
  { name: 'Beverage', emoji: '🥤' },
  { name: 'Bakery',   emoji: '🥖' },
  { name: 'Seafood',  emoji: '🦞' },
];

const PROMOS = [
  {
    id: 1,
    tag: '🔥 Hot Deal',
    title: 'Get 20% Off',
    sub: 'Your first order today',
    bg: 'from-ember-700/80 to-ember-900/80',
    accent: '#f97316',
    emoji: '🍕',
  },
  {
    id: 2,
    tag: '🚚 Free Delivery',
    title: 'Orders Above ₱500',
    sub: 'Limited time offer',
    bg: 'from-forest-700/80 to-forest-900/80',
    accent: '#2d8a57',
    emoji: '🛵',
  },
  {
    id: 3,
    tag: '⚡ Flash Sale',
    title: 'Buy 1 Get 1 Free',
    sub: 'On all burgers this weekend',
    bg: 'from-forest-600/80 to-ember-800/80',
    accent: '#3db870',
    emoji: '🍔',
  },
];

const POPULAR = [
  { id: 4, name: 'Cheese Burger',  restaurant: "Burger King's", price: 6.55, rating: 5, badge: 'HOT', category:'Burger',  image:'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop' },
  { id: 5, name: 'Toasted Bread',  restaurant: 'Bake n Shake',  price: 5.59, rating: 5, badge: 'NEW', category:'Bakery',  image:'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=300&fit=crop' },
  { id: 6, name: 'Deluxe Burger',  restaurant: "Burger King's", price: 6.55, rating: 5, badge: 'HOT', category:'Burger',  image:'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=400&h=300&fit=crop' },
  { id: 7, name: 'Salmon Sushi',   restaurant: 'Sushi Masters', price: 12.99,rating: 5, badge: 'TOP', category:'Sushi',   image:'https://images.unsplash.com/photo-1583623025817-d180a2221d0a?w=400&h=300&fit=crop' },
  { id: 8, name: 'Spicy Chicken',  restaurant: 'Grill House',   price: 8.99, rating: 4, badge: '🌶️',  category:'Chicken', image:'https://images.unsplash.com/photo-1562967914-608f82629710?w=400&h=300&fit=crop' },
];

const RECENT = [
  { id:1, name:'Pizza',   image:'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=200&h=200&fit=crop' },
  { id:2, name:'Noodles', image:'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=200&h=200&fit=crop' },
  { id:3, name:'Salad',   image:'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=200&h=200&fit=crop' },
];

export default function Home() {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [cat, setCat]           = useState('All');
  const [promo, setPromo]       = useState(0);
  const [favorites, setFavorites] = useState([]);
  const [restaurants, setRestaurants] = useState([]);

  useEffect(() => {
    getFeaturedRestaurants().then(setRestaurants).catch(() => {});
    const t = setInterval(() => setPromo(p => (p + 1) % PROMOS.length), 4000);
    return () => clearInterval(t);
  }, []);

  const filteredFood = cat === 'All' ? POPULAR : POPULAR.filter(f => f.category === cat);

  const toggleFav = id => setFavorites(p => p.includes(id) ? p.filter(i=>i!==id) : [...p, id]);

  const handleAddToCart = item => {
    addToCart({ ...item, quantity:1 }, { id: item.restaurant, name: item.restaurant });
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-0 animate-fade-up">

      {/* ── Promo carousel ─────────────────────────── */}
      <section>
        <div className={`relative bg-gradient-to-br ${PROMOS[promo].bg} rounded-3xl p-5 md:p-7 overflow-hidden transition-all duration-700 card-3d`}
          style={{ border: `1px solid ${PROMOS[promo].accent}30`, boxShadow: `0 8px 32px ${PROMOS[promo].accent}20` }}>

          {/* bg blob */}
          <div className="orb w-48 h-48 opacity-30 -top-10 -right-10"
            style={{ background: PROMOS[promo].accent }} />

          <div className="relative z-10 flex items-center justify-between">
            <div className="space-y-1.5">
              <span className="inline-block glass px-3 py-1 rounded-full text-xs text-white font-medium">
                {PROMOS[promo].tag}
              </span>
              <h2 className="text-2xl md:text-3xl font-heading font-bold text-white text-glow-orange">
                {PROMOS[promo].title}
              </h2>
              <p className="text-white/70 text-sm">{PROMOS[promo].sub}</p>
              <button
                onClick={() => navigate('/restaurants')}
                className="mt-2 btn-glow-orange text-white text-sm font-semibold px-5 py-2.5 rounded-xl inline-flex items-center gap-2">
                Order Now <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="text-6xl md:text-7xl animate-float select-none">{PROMOS[promo].emoji}</div>
          </div>

          {/* Dots */}
          <div className="absolute bottom-4 left-5 flex gap-1.5">
            {PROMOS.map((_, i) => (
              <button key={i} onClick={() => setPromo(i)}
                className={`h-1.5 rounded-full transition-all ${i===promo ? 'w-6 bg-white' : 'w-1.5 bg-white/30'}`} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats strip ─────────────────────────────── */}
      <section className="grid grid-cols-3 gap-3">
        {[
          { icon: Truck,  label: 'Free Delivery', val: '₱500+', color: 'text-ember-400' },
          { icon: Clock,  label: 'Avg. Delivery',  val: '30 min', color: 'text-forest-300' },
          { icon: Tag,    label: 'Active Promos',  val: '12+',   color: 'text-ember-300' },
        ].map(({ icon: Icon, label, val, color }) => (
          <div key={label} className="glass card-3d rounded-2xl p-3 flex flex-col items-center gap-1 text-center">
            <Icon className={`w-5 h-5 ${color}`} />
            <p className="text-white font-bold text-sm">{val}</p>
            <p className="text-forest-200/60 text-xs">{label}</p>
          </div>
        ))}
      </section>

      {/* ── Categories ───────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-heading font-bold text-lg">Categories</h3>
          <button onClick={() => navigate('/restaurants')} className="text-ember-400 text-xs font-medium hover:text-ember-300 flex items-center gap-1">
            See all <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
          {CATEGORIES.map(({ name, emoji }) => (
            <button key={name} onClick={() => setCat(name)}
              className={`category-pill flex-shrink-0 ${
                cat === name
                  ? 'active text-white'
                  : 'glass text-forest-100/70 hover:text-white hover:glass-green'
              }`}>
              <span className="text-2xl">{emoji}</span>
              <span className="text-xs font-medium whitespace-nowrap">{name}</span>
            </button>
          ))}
        </div>
      </section>

      {/* ── Recent orders ────────────────────────────── */}
      {RECENT.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-heading font-bold text-lg">Recent Orders</h3>
            <button onClick={() => navigate('/orders')} className="text-ember-400 text-xs font-medium hover:text-ember-300 flex items-center gap-1">
              View all <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
            {RECENT.map(item => (
              <button key={item.id} onClick={() => navigate('/restaurants')}
                className="flex-shrink-0 flex flex-col items-center gap-2 group">
                <div className="relative w-16 h-16 rounded-2xl overflow-hidden border-2 border-white/10 group-hover:border-ember-400/50 transition-all card-3d">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                </div>
                <span className="text-forest-200/70 text-xs group-hover:text-forest-100">{item.name}</span>
              </button>
            ))}
            <button onClick={() => navigate('/restaurants')}
              className="flex-shrink-0 flex flex-col items-center gap-2">
              <div className="w-16 h-16 glass rounded-2xl flex items-center justify-center hover:glass-green transition-all">
                <ChevronRight className="w-5 h-5 text-forest-300" />
              </div>
              <span className="text-forest-200/50 text-xs">More</span>
            </button>
          </div>
        </section>
      )}

      {/* ── Popular food ─────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-heading font-bold text-lg flex items-center gap-2">
            <Flame className="w-5 h-5 text-ember-400" /> Popular Food
          </h3>
          <button onClick={() => navigate('/restaurants')} className="text-ember-400 text-xs font-medium hover:text-ember-300 flex items-center gap-1">
            See all <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-4">
          {filteredFood.map((item, idx) => (
            <div key={item.id} className="restaurant-card card-3d glass group animate-fade-up"
              style={{ animationDelay: `${idx * 80}ms` }}>
              {/* Image */}
              <div className="relative h-40 overflow-hidden">
                <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                {/* Badge */}
                <span className={`absolute top-3 left-3 text-white text-[10px] font-bold px-2 py-0.5 rounded-full
                  ${item.badge === 'HOT' ? 'btn-glow-orange' : item.badge === 'TOP' ? 'btn-glow-green' : 'glass'}`}>
                  {item.badge}
                </span>

                {/* Fav */}
                <button onClick={() => toggleFav(item.id)}
                  className="absolute top-3 right-3 w-7 h-7 glass rounded-full flex items-center justify-center hover:glass-orange transition-all">
                  <Heart className={`w-3.5 h-3.5 ${favorites.includes(item.id) ? 'fill-ember-400 text-ember-400' : 'text-white/70'}`} />
                </button>

                {/* Price on image */}
                <div className="absolute bottom-3 left-3">
                  <p className="text-white font-heading font-bold text-lg text-glow-orange">${item.price}</p>
                </div>
              </div>

              {/* Info */}
              <div className="p-3">
                <p className="text-white font-semibold text-sm truncate">{item.name}</p>
                <p className="text-forest-200/60 text-xs truncate mb-2">{item.restaurant}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-ember-400 text-ember-400" />
                    <span className="text-ember-300 text-xs font-medium">{item.rating}.0</span>
                  </div>
                  <button onClick={() => handleAddToCart(item)}
                    className="w-7 h-7 btn-glow-orange rounded-lg flex items-center justify-center">
                    <Plus className="w-3.5 h-3.5 text-white" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Featured restaurants ─────────────────────── */}
      {restaurants.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-heading font-bold text-lg flex items-center gap-2">
              <Zap className="w-5 h-5 text-forest-300" /> Featured Restaurants
            </h3>
            <button onClick={() => navigate('/restaurants')} className="text-ember-400 text-xs font-medium hover:text-ember-300 flex items-center gap-1">
              See all <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-1 xs:grid-cols-2 gap-4">
            {restaurants.slice(0,4).map((r, idx) => (
              <button key={r.id} onClick={() => navigate(`/restaurant/${r.id}`)}
                className="restaurant-card card-3d glass text-left group animate-fade-up"
                style={{ animationDelay: `${idx * 80}ms` }}>
                <div className="relative h-32 overflow-hidden">
                  <img src={r.image} alt={r.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3">
                    <p className="text-white font-semibold text-sm truncate">{r.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="flex items-center gap-1 text-ember-300 text-xs">
                        <Star className="w-3 h-3 fill-current" />{r.rating}
                      </span>
                      <span className="text-white/50 text-xs">•</span>
                      <span className="text-forest-200 text-xs">{r.delivery_time} min</span>
                    </div>
                  </div>
                  {r.is_open === 0 && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="glass text-white/70 text-xs px-3 py-1 rounded-full">Closed</span>
                    </div>
                  )}
                </div>
                <div className="p-3 flex items-center justify-between">
                  <span className="glass-green text-forest-200 text-xs px-2 py-0.5 rounded-full">{r.category}</span>
                  <span className="text-forest-200/60 text-xs">₱{r.delivery_fee} delivery</span>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
