import { useState } from 'react';
import { useNotification } from '../../context/NotificationContext';
import { Package, Search, Plus, Edit2, Trash2, Clock, Leaf, X, Check } from 'lucide-react';

const INIT_ITEMS = [
  { id:1, name:'Margherita Pizza',    category:'pizza',  price:12.99, description:'Classic pizza with tomato sauce, mozzarella, and fresh basil', image:'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&h=300&fit=crop', isAvailable:true,  isVegetarian:true,  prepTime:20 },
  { id:2, name:'Pepperoni Pizza',     category:'pizza',  price:14.99, description:'Loaded with pepperoni and extra cheese',                        image:'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400&h=300&fit=crop', isAvailable:true,  isVegetarian:false, prepTime:20 },
  { id:3, name:'Spaghetti Carbonara', category:'pasta',  price:13.99, description:'Creamy pasta with bacon and parmesan cheese',                   image:'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=400&h=300&fit=crop', isAvailable:true,  isVegetarian:false, prepTime:15 },
  { id:4, name:'Caesar Salad',        category:'salads', price:8.99,  description:'Fresh romaine lettuce with caesar dressing and croutons',       image:'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400&h=300&fit=crop', isAvailable:false, isVegetarian:true,  prepTime:10 },
];

const CATEGORIES = [
  { id:'pizza',     name:'Pizza'    },
  { id:'pasta',     name:'Pasta'    },
  { id:'salads',    name:'Salads'   },
  { id:'desserts',  name:'Desserts' },
  { id:'beverages', name:'Drinks'   },
];

const EMPTY_FORM = { name:'', category:'pizza', price:'', description:'', image:'', isVegetarian:false, prepTime:'' };

export default function RestaurantMenu() {
  const { showSuccess } = useNotification();
  const [items, setItems]       = useState(INIT_ITEMS);
  const [cat, setCat]           = useState('all');
  const [search, setSearch]     = useState('');
  const [modal, setModal]       = useState(null); // null | 'add' | 'edit'
  const [editItem, setEditItem] = useState(null);
  const [form, setForm]         = useState(EMPTY_FORM);

  const f = (k, v) => setForm(p => ({ ...p, [k]:v }));

  const filtered = items.filter(i => {
    const matchCat = cat === 'all' || i.category === cat;
    const matchQ   = !search || i.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchQ;
  });

  const openAdd  = () => { setForm(EMPTY_FORM); setEditItem(null); setModal('add'); };
  const openEdit = (item) => {
    setEditItem(item);
    setForm({ name:item.name, category:item.category, price:String(item.price), description:item.description, image:item.image||'', isVegetarian:item.isVegetarian, prepTime:String(item.prepTime) });
    setModal('edit');
  };
  const closeModal = () => { setModal(null); setEditItem(null); setForm(EMPTY_FORM); };

  const submit = (e) => {
    e.preventDefault();
    if (modal === 'add') {
      setItems(prev => [...prev, { id:Date.now(), ...form, price:parseFloat(form.price), prepTime:parseInt(form.prepTime), isAvailable:true }]);
      showSuccess(`${form.name} added!`);
    } else {
      setItems(prev => prev.map(i => i.id === editItem.id ? { ...i, ...form, price:parseFloat(form.price), prepTime:parseInt(form.prepTime) } : i));
      showSuccess('Item updated!');
    }
    closeModal();
  };

  const toggle = (id) => {
    const item = items.find(i => i.id === id);
    setItems(prev => prev.map(i => i.id === id ? { ...i, isAvailable:!i.isAvailable } : i));
    showSuccess(`${item.name} ${item.isAvailable ? 'disabled' : 'enabled'}`);
  };

  const del = (id) => {
    const item = items.find(i => i.id === id);
    if (!confirm(`Delete ${item.name}?`)) return;
    setItems(prev => prev.filter(i => i.id !== id));
    showSuccess('Item deleted.');
  };

  return (
    <div className="space-y-4 pb-6 animate-fade-up">

      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <p className="text-forest-200/50 text-sm">Manage</p>
          <h1 className="text-2xl font-heading font-bold text-white">Menu</h1>
        </div>
        <button onClick={openAdd}
          className="btn-glow-orange text-white text-sm font-semibold px-4 py-2.5 rounded-xl flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> Add Item
        </button>
      </div>

      {/* Search + category filter */}
      <div className="glass rounded-2xl p-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-forest-300/50" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search menu items…" className="w-full input-glass pl-9 py-2.5 text-sm" />
        </div>
        <div className="flex flex-wrap gap-2">
          {[{ id:'all', name:'All' }, ...CATEGORIES].map(c => (
            <button key={c.id} onClick={() => setCat(c.id)}
              className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all
                ${cat === c.id ? 'btn-glow-orange text-white' : 'glass text-forest-200/60 hover:text-forest-100'}`}>
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="glass rounded-2xl py-14 flex flex-col items-center gap-3">
          <div className="w-14 h-14 glass rounded-2xl flex items-center justify-center">
            <Package className="w-7 h-7 text-forest-300/40" />
          </div>
          <p className="text-forest-200/50 text-sm">No items found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(item => (
            <div key={item.id} className="glass card-3d rounded-2xl overflow-hidden group">
              {/* Image */}
              <div className="relative h-44 overflow-hidden">
                <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                {/* Availability toggle */}
                <button onClick={() => toggle(item.id)}
                  className={`absolute top-3 right-3 relative inline-flex h-6 w-11 items-center rounded-full transition-colors shadow-lg
                    ${item.isAvailable ? 'btn-glow-green' : 'glass'}`}>
                  <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${item.isAvailable ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
                {/* Price overlay */}
                <div className="absolute bottom-3 left-3">
                  <p className="text-white font-heading font-bold text-xl">₱{item.price.toFixed(2)}</p>
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="text-white font-semibold text-sm leading-tight">{item.name}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${item.isAvailable ? 'glass-green text-forest-200' : 'bg-red-500/20 text-red-300'}`}>
                    {item.isAvailable ? 'Available' : 'Unavailable'}
                  </span>
                </div>

                <p className="text-forest-200/50 text-xs line-clamp-2 mb-3">{item.description}</p>

                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <span className="glass text-forest-200/70 text-xs px-2 py-1 rounded-lg capitalize">{item.category}</span>
                  {item.isVegetarian && (
                    <span className="glass-green text-forest-200 text-xs px-2 py-1 rounded-lg flex items-center gap-1">
                      <Leaf className="w-2.5 h-2.5" /> Veg
                    </span>
                  )}
                  <span className="glass text-forest-200/70 text-xs px-2 py-1 rounded-lg flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" /> {item.prepTime}m
                  </span>
                </div>

                <div className="flex gap-2 pt-3" style={{ borderTop:'1px solid rgba(255,255,255,.07)' }}>
                  <button onClick={() => openEdit(item)}
                    className="flex-1 glass hover:glass-orange transition-all text-forest-100/80 hover:text-white text-xs font-medium py-2 rounded-xl flex items-center justify-center gap-1.5">
                    <Edit2 className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button onClick={() => del(item.id)}
                    className="w-9 h-9 glass hover:bg-red-500/30 transition-all rounded-xl flex items-center justify-center flex-shrink-0">
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="glass rounded-3xl p-6 w-full max-w-md my-4">
            <div className="flex items-center justify-between mb-5">
              <p className="text-white font-semibold">{modal === 'add' ? 'Add New Item' : 'Edit Item'}</p>
              <button onClick={closeModal} className="w-8 h-8 glass rounded-xl flex items-center justify-center text-forest-200 hover:glass-orange transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={submit} className="space-y-3">
              {[
                { label:'Item Name', key:'name', type:'text', placeholder:'e.g., Margherita Pizza' },
                { label:'Price (₱)',  key:'price', type:'number', placeholder:'0.00' },
                { label:'Prep Time (min)', key:'prepTime', type:'number', placeholder:'20' },
                { label:'Image URL', key:'image', type:'url', placeholder:'https://…' },
              ].map(({ label, key, type, placeholder }) => (
                <div key={key}>
                  <label className="block text-forest-200/60 text-xs font-medium mb-1">{label}</label>
                  <input type={type} value={form[key]} onChange={e => f(key, e.target.value)}
                    placeholder={placeholder} required={key !== 'image'}
                    className="w-full input-glass py-2.5 text-sm" />
                </div>
              ))}
              <div>
                <label className="block text-forest-200/60 text-xs font-medium mb-1">Category</label>
                <select value={form.category} onChange={e => f('category', e.target.value)}
                  className="w-full input-glass py-2.5 text-sm">
                  {CATEGORIES.map(c => <option key={c.id} value={c.id} style={{ background:'#0d2b1a' }}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-forest-200/60 text-xs font-medium mb-1">Description</label>
                <textarea value={form.description} onChange={e => f('description', e.target.value)}
                  className="w-full input-glass py-2.5 text-sm h-20 resize-none" rows={3} required />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <div onClick={() => f('isVegetarian', !form.isVegetarian)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${form.isVegetarian ? 'btn-glow-green' : 'glass'}`}>
                  <span className={`inline-block h-3 w-3 rounded-full bg-white transition-transform ${form.isVegetarian ? 'translate-x-5' : 'translate-x-1'}`} />
                </div>
                <span className="text-forest-100/70 text-sm">Vegetarian</span>
              </label>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={closeModal}
                  className="flex-1 glass hover:glass-green transition-all text-forest-200 text-sm font-medium py-2.5 rounded-xl">
                  Cancel
                </button>
                <button type="submit"
                  className="flex-1 btn-glow-orange text-white text-sm font-semibold py-2.5 rounded-xl flex items-center justify-center gap-1.5">
                  <Check className="w-4 h-4" /> {modal === 'add' ? 'Add Item' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
