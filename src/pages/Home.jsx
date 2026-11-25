import StoreCard from '../components/StoreCard';
import AdCarousel from '../components/AdCarousel';
import { useState, useEffect } from 'react';
import { flushSync } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { getFeaturedRestaurants, getAllMenuItems, promosApi } from '../services/api';
import { useCart } from '../context/CartContext';
import { useFavorites } from '../context/FavoritesContext';
import { Heart, Star, Plus, ChevronRight, Flame, Zap, UtensilsCrossed, Utensils, Hamburger, Pizza, Fish, Drumstick, CupSoda, Croissant, Shrimp, Search, SlidersHorizontal } from 'lucide-react';
import { foodRating } from '../utils/foodRating';

const CATEGORIES = [
  { name: 'All',      Icon: Utensils },
  { name: 'Burger',   Icon: Hamburger },
  { name: 'Pizza',    Icon: Pizza },
  { name: 'Sushi',    Icon: Fish },
  { name: 'Chicken',  Icon: Drumstick },
  { name: 'Beverage', Icon: CupSoda },
  { name: 'Bakery',   Icon: Croissant },
  { name: 'Seafood',  Icon: Shrimp },
];

const PROMO_STYLES = [
  { bg: 'from-ember-700/80 to-ember-900/80', accent: '#f97316' },
  { bg: 'from-forest-700/80 to-forest-900/80', accent: '#2d8a57' },
  { bg: 'from-forest-600/80 to-ember-800/80', accent: '#3db870' },
];

const POSTER_URL = (f) => `${import.meta.env.BASE_URL}promos/${f}.jpg`;

// Always-on posters (made in Canva). They follow any live promo codes.
const POSTERS = [
  { id: 'poster-good-food', poster: POSTER_URL('good-food-good-mood'),
    alt: "Good Food, Good Mood! Fresh meals from Bongao's favorite restaurants, delivered to your door. Order now." },
  { id: 'poster-pizza', poster: POSTER_URL('craving-pizza'),
    alt: "Craving Pizza? Hot, cheesy slices from Bongao's pizza spots, delivered fast. Order now." },
  { id: 'poster-pay', poster: POSTER_URL('pay-your-way'),
    alt: 'Pay your way: GCash or Cash on Delivery. Track your rider live to your door. Order now.' },
];

// A live promo code with its own Canva poster shows the poster instead of the plain card
const CODE_POSTERS = {
  POWER12: { poster: POSTER_URL('code-power12'), alt: '2% off your order with code POWER12.' },
};

const promoTitle = (promo) => {
  const value = Number(promo.discountValue ?? promo.discount_value ?? promo.value ?? 0);
  const type = promo.discountType || promo.discount_type || promo.type;
  return type === 'fixed' ? `₱${value} Off` : `Get ${value}% Off`;
};

export default function Home() {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [cat, setCat]               = useState('All');
  const [promo, setPromo]           = useState(0);
  const [activePromos, setActivePromos] = useState([]);
  const [search, setSearch]           = useState('');
  const [restaurants, setRestaurants] = useState([]);
  const [popularItems, setPopularItems] = useState([]);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    Promise.all([
      getFeaturedRestaurants(4).catch(() => []),
      getAllMenuItems({ limit: 10 }).catch(() => []),
      promosApi.publicList().catch(() => null),
    ]).then(([rests, items, promos]) => {
      setRestaurants(Array.isArray(rests?.data) ? rests.data : Array.isArray(rests) ? rests : []);
      setPopularItems(Array.isArray(items) ? items : []);
      setActivePromos(promos?.data || promos || []);
    }).finally(() => setLoading(false));
  }, []);

  // The KinakanGo poster always leads the carousel; live promo codes follow it
  const codeCards = activePromos.map((item, index) => {
    const poster = CODE_POSTERS[String(item.code || '').toUpperCase()];
    if (poster) return { id: `code-${item.id}`, ...poster };
    const style = PROMO_STYLES[index % PROMO_STYLES.length];
    return {
      id: item.id,
      tag: item.code || 'Promo',
      title: promoTitle(item),
      sub: item.description || `Use code ${item.code}`,
      ...style,
    };
  });
  const promoCards = [...codeCards, ...POSTERS];

  useEffect(() => {
    if (promoCards.length < 2) return undefined;
    const t = setInterval(() => setPromo(p => (p + 1) % promoCards.length), 4000);
    return () => clearInterval(t);
  }, [promoCards.length]);

  const currentPromoIndex = promoCards.length ? promo % promoCards.length : 0;
  const currentPromo = promoCards[currentPromoIndex];

  const filteredFood = cat === 'All'
    ? popularItems
    : popularItems.filter(f => f.category_name?.toLowerCase() === cat.toLowerCase());

  // Tap a popular food: open its food page, the photo flying into place where supported
  const openFood = (item) => {
    const morph = !!document.startViewTransition && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const go = () => navigate(`/food/${item.id}`, { state: { foodItem: item, morph } });
    if (morph) document.startViewTransition(() => flushSync(go));
    else go();
  };

  const handleAddToCart = item => {
    addToCart(
      { id: item.id, name: item.name, price: item.price, image: item.image_url, quantity: 1 },
      { id: item.restaurant_id, name: item.restaurant_name }
    );
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-0 animate-fade-up">

      {/* ── Promo carousel (only real, active promo codes) ── */}
      {currentPromo && <section>
        {currentPromo.poster ? (
        <button type="button" onClick={() => navigate('/restaurants')}
          className="relative block w-full rounded-3xl overflow-hidden card-3d text-left"
          style={{ aspectRatio: '1200 / 630' }}>
          <img src={currentPromo.poster} alt={currentPromo.alt} className="w-full h-full object-cover" />
          {promoCards.length > 1 && (
            <span className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {promoCards.map((item, i) => (
                <span key={item.id || i} role="presentation"
                  onClick={e => { e.stopPropagation(); setPromo(i); }}
                  className={`h-1.5 rounded-full transition-all ${i === currentPromoIndex ? 'w-6 bg-white' : 'w-1.5 bg-white/40'}`} />
              ))}
            </span>
          )}
        </button>
        ) : (
        <div className={`relative bg-gradient-to-br ${currentPromo.bg} rounded-3xl p-5 md:p-7 overflow-hidden transition-all duration-700 card-3d`}
          style={{ border: `1px solid ${currentPromo.accent}30`, boxShadow: `0 8px 32px ${currentPromo.accent}20` }}>
          <div className="orb w-48 h-48 opacity-30 -top-10 -right-10"
            style={{ background: currentPromo.accent }} />
          <div className="relative z-10 flex items-center justify-between">
            <div className="space-y-1.5">
              <span className="inline-block glass px-3 py-1 rounded-full text-xs text-white font-medium">
                {currentPromo.tag}
              </span>
              <h2 className="text-2xl md:text-3xl font-heading font-bold text-white text-glow-orange">
                {currentPromo.title}
              </h2>
              <p className="text-white/70 text-sm">{currentPromo.sub}</p>
            </div>
          </div>
          <div className="absolute bottom-4 left-5 flex gap-1.5">
            {promoCards.map((item, i) => (
              <button key={item.id || i} onClick={() => setPromo(i)}
                className={`h-1.5 rounded-full transition-all ${i === currentPromoIndex ? 'w-6 bg-white' : 'w-1.5 bg-white/30'}`} />
            ))}
          </div>
        </div>
        )}
      </section>}

      {/* ── Search (under the promo) ─────────────────── */}
      <form role="search" className="flex items-center gap-2.5"
        onSubmit={e => { e.preventDefault(); const q = search.trim(); navigate(q ? `/restaurants?search=${encodeURIComponent(q)}` : '/restaurants'); }}>
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-forest-300" aria-hidden="true" />
          <input value={search} onChange={e => setSearch(e.target.value)} type="search"
            placeholder="Search food or restaurants…" aria-label="Search food or restaurants"
            className="w-full input-glass pl-11 pr-4 py-3 text-sm rounded-2xl" />
        </div>
        <button type="button" onClick={() => navigate('/restaurants')} aria-label="Filters"
          className="w-12 h-12 glass rounded-2xl flex items-center justify-center text-forest-100 flex-shrink-0">
          <SlidersHorizontal className="w-5 h-5" />
        </button>
      </form>

      {/* ── Categories ───────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-heading font-bold text-lg">Categories</h3>
          <button onClick={() => navigate('/restaurants')} className="text-ember-400 text-xs font-medium hover:text-ember-300 flex items-center gap-1">
            See all <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
          {CATEGORIES.map(({ name, Icon }) => (
            <button key={name} onClick={() => setCat(name)} aria-pressed={cat === name}
              className={`category-pill category-tile flex-shrink-0 ${cat === name ? 'active' : 'glass'}`}>
              <Icon aria-hidden="true" />
              <span>{name}</span>
            </button>
          ))}
        </div>
      </section>

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
          <div className="flex gap-3 overflow-hidden pt-12">
            {[1,2,3].map(i => (
              <div key={i} className="food-card flex-shrink-0 w-[10.5rem] h-52 animate-pulse" />
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
          /* One row you swipe sideways, with the same round-photo cards as Food Order */
          <div className="flex gap-3 overflow-x-auto scrollbar-hide snap-x snap-mandatory scroll-px-4 -mx-4 px-4 pt-12 pb-3">
            {filteredFood.map((item, idx) => (
              <div key={item.id} role="button" tabIndex={0}
                onClick={() => openFood(item)}
                onKeyDown={e => { if (e.key === 'Enter') openFood(item); }}
                className="food-card relative flex-shrink-0 w-[10.5rem] snap-start cursor-pointer animate-fade-up text-center px-3 pb-4 pt-[4.6rem]"
                style={{ animationDelay: `${idx * 60}ms` }}>
                <div className="food-card-photo" style={{ viewTransitionName: `food-${item.id}` }}>
                  {item.image_url
                    ? <img src={item.image_url} alt="" loading="lazy" />
                    : <div className="w-full h-full flex items-center justify-center"><UtensilsCrossed className="w-8 h-8 text-forest-300/40" /></div>}
                </div>
                <button onClick={e => { e.stopPropagation(); toggleFavorite(item); }}
                  aria-label={isFavorite(item.id) ? `Remove ${item.name} from favorites` : `Add ${item.name} to favorites`}
                  className="absolute top-10 right-1.5 w-7 h-7 rounded-full flex items-center justify-center bg-white/5">
                  <Heart className={`w-3.5 h-3.5 ${isFavorite(item.id) ? 'fill-ember-400 text-ember-400' : 'text-white/60'}`} />
                </button>
                <p className="text-white font-heading font-bold text-[.95rem] leading-snug truncate">{item.name}</p>
                <p className="text-forest-200/50 text-xs truncate mt-0.5">{item.restaurant_name}</p>
                <p className="flex items-center justify-center gap-1 text-ember-400 text-[11px] font-semibold mt-1.5">
                  <Star className="w-3 h-3 fill-current" /> {foodRating(item)}
                </p>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <p className="text-white font-heading font-extrabold text-xl"><span className="text-ember-500 text-sm mr-0.5">₱</span>{Number(item.price).toFixed(2)}</p>
                  <button onClick={e => { e.stopPropagation(); handleAddToCart(item); }}
                    aria-label={`Add ${item.name} to cart`}
                    className="w-7 h-7 btn-glow-orange rounded-full flex items-center justify-center flex-shrink-0">
                    <Plus className="w-3.5 h-3.5 text-white" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Ad video (silent, loops) ─────────────────── */}
      <section aria-label="What KinakanGo offers">
        <AdCarousel />
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
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-6">
            {restaurants.slice(0, 4).map((r, idx) => (
              <StoreCard key={r.id} r={r} onClick={() => navigate(`/restaurant/${r.id}`)}
                style={{ animationDelay: `${idx * 80}ms` }} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
