import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { Search as SearchIcon, X, Star, Plus, Clock } from 'lucide-react';
import Loader from '../components/Loader';

const ALL_FOODS = [
  { id:1,  name:'Chicken Teriyaki Drumstick',     price:250, image:'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=400&h=400&fit=crop', category:'chicken', restaurant:'Asian Kitchen', rating:4.5, deliveryTime:30 },
  { id:2,  name:'Teriyaki Chicken with Broccoli', price:350, image:'https://images.unsplash.com/photo-1588347818036-8fc4ec0d8b8d?w=400&h=400&fit=crop', category:'chicken', restaurant:'Asian Kitchen', rating:4.6, deliveryTime:30 },
  { id:3,  name:'Classic Chicken Naan',           price:200, image:'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&h=400&fit=crop', category:'chicken', restaurant:'Indian Palace', rating:4.7, deliveryTime:25 },
  { id:4,  name:'Japanese Fried Chicken',         price:180, image:'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=400&h=400&fit=crop', category:'chicken', restaurant:'Tokyo Eats',   rating:4.8, deliveryTime:35 },
  { id:5,  name:'Sweet Spicy Chicken',            price:320, image:'https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=400&h=400&fit=crop', category:'chicken', restaurant:'Spice House',   rating:4.5, deliveryTime:30 },
  { id:6,  name:'Grilled Chicken Bowl',           price:220, image:'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=400&fit=crop', category:'chicken', restaurant:'Healthy Bites',  rating:4.4, deliveryTime:20 },
  { id:7,  name:'Pepperoni Pizza',                price:350, image:'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400&h=400&fit=crop', category:'pizza',   restaurant:'Pizza Palace',   rating:4.6, deliveryTime:25 },
  { id:8,  name:'Margherita Pizza',               price:320, image:'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&h=400&fit=crop', category:'pizza',   restaurant:'Pizza Palace',   rating:4.7, deliveryTime:25 },
  { id:9,  name:'Hamburger',                      price:250, image:'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=400&fit=crop', category:'burger',  restaurant:'Burger King',    rating:4.5, deliveryTime:20 },
  { id:10, name:'Classic Burger',                 price:180, image:'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=400&h=400&fit=crop', category:'burger',  restaurant:'Burger King',    rating:4.4, deliveryTime:20 },
  { id:11, name:'Cheese Sandwich',                price:200, image:'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400&h=400&fit=crop', category:'sandwich',restaurant:'Sandwich Shop',  rating:4.3, deliveryTime:15 },
  { id:12, name:'Club Sandwich',                  price:220, image:'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=400&h=400&fit=crop', category:'sandwich',restaurant:'Sandwich Shop',  rating:4.5, deliveryTime:15 },
  { id:13, name:'Sushi Platter',                  price:450, image:'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400&h=400&fit=crop', category:'sushi',   restaurant:'Sushi Bar',      rating:4.8, deliveryTime:40 },
  { id:14, name:'Dragon Roll',                    price:380, image:'https://images.unsplash.com/photo-1563612116625-3012372fccce?w=400&h=400&fit=crop', category:'sushi',   restaurant:'Sushi Bar',      rating:4.7, deliveryTime:40 },
  { id:15, name:'Ramen Bowl',                     price:280, image:'https://images.unsplash.com/photo-1557872943-16a5ac26437e?w=400&h=400&fit=crop', category:'soup',    restaurant:'Ramen House',    rating:4.6, deliveryTime:30 },
  { id:16, name:'Pad Thai',                       price:300, image:'https://images.unsplash.com/photo-1559314809-0d155014e29e?w=400&h=400&fit=crop', category:'pasta',   restaurant:'Thai Kitchen',   rating:4.5, deliveryTime:35 },
];

const CATS = [
  {id:'all',name:'All'},{id:'chicken',name:'Chicken'},{id:'pizza',name:'Pizza'},
  {id:'burger',name:'Burger'},{id:'sandwich',name:'Sandwich'},{id:'sushi',name:'Sushi'},
  {id:'soup',name:'Soup'},{id:'pasta',name:'Pasta'},
];

export default function Search() {
  const navigate   = useNavigate();
  const { addToCart } = useCart();
  const [query, setQuery]     = useState('');
  const [cat, setCat]         = useState('all');
  const [results, setResults] = useState(ALL_FOODS);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => {
      let r = ALL_FOODS;
      if (cat !== 'all') r = r.filter(f => f.category === cat);
      if (query.trim()) {
        const q = query.toLowerCase();
        r = r.filter(f => f.name.toLowerCase().includes(q) || f.restaurant.toLowerCase().includes(q) || f.category.includes(q));
      }
      setResults(r);
      setLoading(false);
    }, 300);
    return () => clearTimeout(t);
  }, [query, cat]);

  return (
    <div className="space-y-4 pb-20 lg:pb-0 animate-fade-up">
      {/* Search bar */}
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-forest-300/50" />
        <input value={query} onChange={e => setQuery(e.target.value)}
          placeholder="Search food, restaurantsâ€¦"
          className="w-full input-glass pl-10 pr-10 py-3" />
        {query && (
          <button onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-forest-300/50 hover:text-forest-200">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Category pills */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {CATS.map(({id, name}) => (
          <button key={id} onClick={() => setCat(id)}
            className={`category-pill flex-shrink-0 px-3 py-2 text-xs
              ${cat===id ? 'active text-white' : 'glass text-forest-100/60 hover:text-white hover:glass-green'}`}>
            {name}
          </button>
        ))}
      </div>

      {/* Result count */}
      <p className="text-forest-200/50 text-xs">
        {results.length} result{results.length !== 1 ? 's' : ''}{query ? ` for "${query}"` : ''}
      </p>

      {/* Results */}
      {loading ? (
        <Loader size="lg" />
      ) : results.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {results.map((item, idx) => (
            <div key={item.id}
              onClick={() => navigate(`/food/${item.id}`, { state:{ foodItem:item } })}
              className="restaurant-card card-3d glass cursor-pointer group animate-fade-up"
              style={{ animationDelay:`${idx*30}ms` }}>
              <div className="relative aspect-square overflow-hidden">
                <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <p className="absolute bottom-2 left-2 text-white font-bold text-sm text-glow-orange">â‚±{Number(item.price).toFixed(2)}</p>
              </div>
              <div className="p-2.5">
                <p className="text-white font-semibold text-xs truncate">{item.name}</p>
                <p className="text-forest-200/50 text-xs truncate">{item.restaurant}</p>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-1.5">
                    <Star className="w-3 h-3 fill-ember-400 text-ember-400" />
                    <span className="text-ember-300 text-xs">{item.rating}</span>
                    <span className="text-forest-200/40 text-xs">Â·</span>
                    <Clock className="w-3 h-3 text-forest-300/50" />
                    <span className="text-forest-200/50 text-xs">{item.deliveryTime}m</span>
                  </div>
                  <button onClick={e => {
                    e.stopPropagation();
                    addToCart({id:item.id,name:item.name,price:item.price,quantity:1,image:item.image}, {id:item.restaurant,name:item.restaurant});
                  }} className="w-6 h-6 btn-glow-orange rounded-lg flex items-center justify-center">
                    <Plus className="w-3 h-3 text-white" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass rounded-3xl py-16 flex flex-col items-center gap-3">
          <span className="text-5xl">ðŸ”</span>
          <p className="text-white font-semibold">No results found</p>
          <p className="text-forest-200/50 text-sm">Try different keywords</p>
          <button onClick={() => { setQuery(''); setCat('all'); }}
            className="btn-glow-orange text-white text-sm px-5 py-2.5 rounded-xl mt-2">Clear Search</button>
        </div>
      )}
    </div>
  );
}
