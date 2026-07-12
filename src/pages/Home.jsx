import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFeaturedRestaurants, getAllMenuItems } from '../services/api';
import { ordersApi } from '../services/api';
import { useCart } from '../context/CartContext';
import { useFavorites } from '../context/FavoritesContext';
import { Heart, Star, Plus, Clock, Truck, Tag, ChevronRight, Flame, Zap, UtensilsCrossed } from 'lucide-react';

const CATEGORIES = [
  { name: 'All' },
  { name: 'Burger' },
  { name: 'Pizza' },
  { name: 'Sushi' },
  { name: 'Chicken' },
  { name: 'Beverage' },
  { name: 'Bakery' },
  { name: 'Seafood' },
];

const PROMOS = [
  {
    id: 1,
    tag: 'Hot Deal',
    title: 'Get 20% Off',
    sub: 'Your first order today',
    bg: 'from-ember-700/80 to-ember-900/80',
    accent: '#f97316',
  },
  {
    id: 2,
    tag: 'Free Delivery',
    title: 'Orders Above ₱500',
    sub: 'Limited time offer',
    bg: 'from-forest-700/80 to-forest-900/80',
    accent: '#2d8a57',
  },
  {
    id: 3,
    tag: 'Flash Sale',
    title: 'Buy 1 Get 1 Free',
    sub: 'On all burgers this weekend',
    bg: 'from-forest-600/80 to-ember-800/80',
    accent: '#3db870',
  },
];

export default function Home() {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [cat, setCat]               = useState('All');
  const [promo, setPromo]           = useState(0);
  const [restaurants, setRestaurants] = useState([]);
  const [popularItems, setPopularItems] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    const t = setInterval(() => setPromo(p => (p + 1) % PROMOS.length), 4000);

    Promise.all([
      getFeaturedRestaurants(4).catch(() => []),
      getAllMenuItems({ limit: 10 }).catch(() => []),
      ordersApi.list({ limit: 5 }).catch(() => null),
    ]).then(([rests, items, orders]) => {
      setRestaurants(Array.isArray(rests?.data) ? rests.data : Array.isArray(rests) ? rests : []);
      setPopularItems(Array.isArray(items) ? items : []);
      const orderList = orders?.data ?? [];
      const unique = [];
      const seen = new Set();
      for (const o of orderList) {
        if (!seen.has(o.restaurant_name)) {
          seen.add(o.restaurant_name);
          unique.push(o);
        }
      }
      setRecentOrders(unique.slice(0, 4));
    }).finally(() => setLoading(false));

    return () => clearInterval(t);
  }, []);

  const filteredFood = cat === 'All'
    ? popularItems
    : popularItems.filter(f => f.category_name?.toLowerCase() === cat.toLowerCase());

  const handleAddToCart = item => {
    addToCart(
      { id: item.id, name: item.name, price: item.price, image: item.image_url, quantity: 1 },
      { id: item.restaurant_id, name: item.restaurant_name }
    );
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-0 animate-fade-up">

      {/* ── Promo carousel ─────────────────────────── */}
      <section>
        <div className={`relative bg-gradient-to-br ${PROMOS[promo].bg} rounded-3xl p-5 md:p-7 overflow-hidden transition-all duration-700 card-3d`}
          style={{ border: `1px solid ${PROMOS[promo].accent}30`, boxShadow: `0 8px 32px ${PROMOS[promo].accent}20` }}>
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
          </div>
          <div className="absolute bottom-4 left-5 flex gap-1.5">
            {PROMOS.map((_, i) => (
              <button key={i} onClick={() => setPromo(i)}
                className={`h-1.5 rounded-full transition-all ${i === promo ? 'w-6 bg-white' : 'w-1.5 bg-white/30'}`} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats strip ─────────────────────────────── */}
      <section className="grid grid-cols-3 gap-3">
        {[
          { icon: Truck,  label: 'Free Delivery', val: '₱500+',  color: 'text-ember-400' },
          { icon: Clock,  label: 'Avg. Delivery',  val: '30 min', color: 'text-forest-300' },
          { icon: Tag,    label: 'Active Promos',  val: '12+',    color: 'text-ember-300' },
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
          {CATEGORIES.map(({ name }) => (
            <button key={name} onClick={() => setCat(name)}
              className={`category-pill flex-shrink-0 ${
                cat === name
                  ? 'active text-white'
                  : 'glass text-forest-100/70 hover:text-white hover:glass-green'
              }`}>
              <span className="text-xs font-medium whitespace-nowrap">{name}</span>
            </button>
          ))}
        </div>
      </section>

      {/* ── Recent orders ────────────────────────────── */}
      {recentOrders.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-heading font-bold text-lg">Recent Orders</h3>
            <button onClick={() => navigate('/orders')} className="text-ember-400 text-xs font-medium hover:text-ember-300 flex items-center gap-1">
              View all <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
            {recentOrders.map(order => (
              <button key={order.id} onClick={() => navigate('/restaurants')}
                className="flex-shrink-0 flex flex-col items-center gap-2 group">
                <div className="relative w-16 h-16 rounded-2xl overflow-hidden border-2 border-white/10 group-hover:border-ember-400/50 transition-all card-3d glass flex items-center justify-center">
                  {order.restaurant_image
                    ? <img src={order.restaurant_image} alt={order.restaurant_name} className="w-full h-full object-cover" />
                    : <UtensilsCrossed className="w-6 h-6 text-forest-300" />
                  }
                </div>
                <span className="text-forest-200/70 text-xs group-hover:text-forest-100 max-w-[64px] truncate">{order.restaurant_name}</span>
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

        {loading ? (
          <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-4">
            {[1,2,3].map(i => (
              <div key={i} className="glass rounded-2xl h-48 animate-pulse" />
            ))}
          </div>
        ) : filteredFood.length === 0 ? (
          <div className="glass rounded-2xl p-10 flex flex-col items-center gap-3 text-center">
            <UtensilsCrossed className="w-10 h-10 text-forest-300/50" />
            <p className="text-forest-200/60 text-sm">No items yet — check back soon!</p>
            <button onClick={() => navigate('/restaurants')} className="btn-glow-orange text-white text-xs px-4 py-2 rounded-xl">
              Browse Restaurants
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-4">
            {filteredFood.map((item, idx) => (
              <div key={item.id} className="restaurant-card card-3d glass group animate-fade-up"
                style={{ animationDelay: `${idx * 80}ms` }}>
                <div className="relative h-40 overflow-hidden">
                  {item.image_url
                    ? <img src={item.image_url} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    : <div className="w-full h-full glass flex items-center justify-center"><UtensilsCrossed className="w-10 h-10 text-forest-300/40" /></div>
                  }
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                  <button onClick={() => toggleFavorite(item)}
                    className="absolute top-3 right-3 w-7 h-7 glass rounded-full flex items-center justify-center hover:glass-orange transition-all">
                    <Heart className={`w-3.5 h-3.5 ${isFavorite(item.id) ? 'fill-ember-400 text-ember-400' : 'text-white/70'}`} />
                  </button>

                  <div className="absolute bottom-3 left-3">
                    <p className="text-white font-heading font-bold text-lg text-glow-orange">₱{Number(item.price).toFixed(2)}</p>
                  </div>
                </div>

                <div className="p-3">
                  <p className="text-white font-semibold text-sm truncate">{item.name}</p>
                  <p className="text-forest-200/60 text-xs truncate mb-2">{item.restaurant_name}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-ember-400 text-ember-400" />
                      <span className="text-ember-300 text-xs font-medium">{Number(item.rating ?? 0).toFixed(1)}</span>
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
        )}
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
            {restaurants.slice(0, 4).map((r, idx) => (
              <button key={r.id} onClick={() => navigate(`/restaurant/${r.id}`)}
                className="restaurant-card card-3d glass text-left group animate-fade-up"
                style={{ animationDelay: `${idx * 80}ms` }}>
                <div className="relative h-32 overflow-hidden">
                  {r.image_url
                    ? <img src={r.image_url} alt={r.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    : <div className="w-full h-full glass flex items-center justify-center"><UtensilsCrossed className="w-8 h-8 text-forest-300/40" /></div>
                  }
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3">
                    <p className="text-white font-semibold text-sm truncate">{r.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="flex items-center gap-1 text-ember-300 text-xs">
                        <Star className="w-3 h-3 fill-current" />{Number(r.rating ?? 0).toFixed(1)}
                      </span>
                    </div>
                  </div>
                  {!r.is_open && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="glass text-white/70 text-xs px-3 py-1 rounded-full">Closed</span>
                    </div>
                  )}
                </div>
                <div className="p-3 flex items-center justify-between">
                  <span className="glass-green text-forest-200 text-xs px-2 py-0.5 rounded-full">{r.cuisine ?? 'Restaurant'}</span>
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
