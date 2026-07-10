import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNotification } from '../../context/NotificationContext';
import { useRestaurant } from '../../context/RestaurantContext';
import { menuApi } from '../../services/api';
import { Package, Search, Plus, Edit2, Trash2, Clock, Leaf, X, Check, ImagePlus, Tag } from 'lucide-react';

function pickImage(onPick) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => onPick(ev.target.result);
    reader.readAsDataURL(file);
  };
  input.click();
}

const DEFAULT_CATEGORIES = [
  { id:'pizza',     name:'Pizza'    },
  { id:'pasta',     name:'Pasta'    },
  { id:'salads',    name:'Salads'   },
  { id:'desserts',  name:'Desserts' },
  { id:'beverages', name:'Drinks'   },
];

const EMPTY_FORM = { name:'', category:'pizza', price:'', description:'', image:'', isVegetarian:false, prepTime:'' };

export default function RestaurantMenu() {
  const { addNotification }         = useNotification();
  const { restaurant }              = useRestaurant();
  const [items, setItems]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [cat, setCat]               = useState('all');
  const [search, setSearch]         = useState('');
  const [modal, setModal]           = useState(null); // null | 'add' | 'edit'
  const [editItem, setEditItem]     = useState(null);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [catModal, setCatModal]     = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [customCats, setCustomCats] = useState([]);

  const restaurantId = restaurant?.id;

  // Load custom categories from localStorage
  useEffect(() => {
    if (!restaurantId) return;
    const saved = localStorage.getItem(`kkg_cats_${restaurantId}`);
    if (saved) setCustomCats(JSON.parse(saved));
  }, [restaurantId]);

  const allCategories = [
    ...DEFAULT_CATEGORIES,
    ...customCats,
  ];

  const addCategory = () => {
    const trimmed = newCatName.trim();
    if (!trimmed) return;
    const id = trimmed.toLowerCase().replace(/\s+/g, '_');
    if (allCategories.find(c => c.id === id)) {
      addNotification('Category already exists', 'error');
      return;
    }
    const next = [...customCats, { id, name: trimmed }];
    setCustomCats(next);
    localStorage.setItem(`kkg_cats_${restaurantId}`, JSON.stringify(next));
    setForm(p => ({ ...p, category: id }));
    setNewCatName('');
    setCatModal(false);
    addNotification(`"${trimmed}" category added`, 'success');
  };

  useEffect(() => {
    if (!restaurantId) return;
    (async () => {
      try {
        setLoading(true);
        const res = await menuApi.list(restaurantId);
        setItems(res.data || res || []);
      } catch {
        addNotification('Failed to load menu', 'error');
      } finally {
        setLoading(false);
      }
    })();
  }, [restaurantId]);

  const f = (k, v) => setForm(p => ({ ...p, [k]:v }));

  const filtered = items.filter(i => {
    const matchCat = cat === 'all' || i.category === cat;
    const matchQ   = !search || (i.name||'').toLowerCase().includes(search.toLowerCase());
    return matchCat && matchQ;
  });

  const openAdd  = () => { setForm(EMPTY_FORM); setEditItem(null); setModal('add'); };
  const openEdit = (item) => {
    setEditItem(item);
    setForm({
      name:         item.name,
      category:     item.category_name || item.category || 'pizza',
      price:        String(item.price),
      description:  item.description || '',
      image:        item.image_url || item.image || '',
      isVegetarian: item.is_vegetarian || item.isVegetarian || false,
      prepTime:     String(item.prep_time_mins || item.prepTimeMins || ''),
    });
    setModal('edit');
  };
  const closeModal = () => { setModal(null); setEditItem(null); setForm(EMPTY_FORM); };

  const submit = async (e) => {
    e.preventDefault();
    const payload = { name:form.name, category:form.category, price:parseFloat(form.price), description:form.description||null, image:form.image||null, isVegetarian:form.isVegetarian, prepTimeMins:parseInt(form.prepTime)||15 };
    try {
      if (modal === 'add') {
        const created = await menuApi.create(restaurantId, payload);
        setItems(prev => [...prev, created]);
        addNotification(`${form.name} added!`, 'success');
      } else {
        const updated = await menuApi.update(restaurantId, editItem.id, payload);
        setItems(prev => prev.map(i => i.id === editItem.id ? { ...i, ...payload, ...(updated||{}) } : i));
        addNotification('Item updated!', 'success');
      }
      closeModal();
    } catch {
      addNotification('Failed to save menu item', 'error');
    }
  };

  const toggle = async (id) => {
    const item = items.find(i => i.id === id);
    const current = item.is_available ?? item.isAvailable ?? true;
    try {
      await menuApi.update(restaurantId, id, { isAvailable: !current });
      setItems(prev => prev.map(i => i.id === id ? { ...i, is_available: !current, isAvailable: !current } : i));
      addNotification(`${item.name} ${current ? 'disabled' : 'enabled'}`, 'success');
    } catch {
      addNotification('Failed to update availability', 'error');
    }
  };

  const del = async (id) => {
    const item = items.find(i => i.id === id);
    if (!confirm(`Delete ${item.name}?`)) return;
    try {
      await menuApi.remove(restaurantId, id);
      setItems(prev => prev.filter(i => i.id !== id));
      addNotification('Item deleted.', 'success');
    } catch {
      addNotification('Failed to delete item', 'error');
    }
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
        <div className="flex flex-wrap gap-2 items-center">
          {[{ id:'all', name:'All' }, ...allCategories].map(c => (
            <button key={c.id} onClick={() => setCat(c.id)}
              className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all
                ${cat === c.id ? 'btn-glow-orange text-white' : 'glass text-forest-200/60 hover:text-forest-100'}`}>
              {c.name}
            </button>
          ))}
          <button onClick={() => { setNewCatName(''); setCatModal(true); }}
            className="px-3 py-1.5 rounded-xl text-sm font-medium glass-teal text-teal-200 hover:opacity-80 transition-all flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5" /> Add Category
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="glass rounded-2xl h-64 animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
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
                {(item.image_url || item.image) ? (
                  <img src={item.image_url || item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div className="w-full h-full glass flex items-center justify-center">
                    <Package className="w-12 h-12 text-forest-300/30" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                {/* Availability toggle */}
                <button onClick={() => toggle(item.id)}
                  className={`absolute top-3 right-3 relative inline-flex h-6 w-11 items-center rounded-full transition-colors shadow-lg
                    ${(item.is_available ?? item.isAvailable) ? 'btn-glow-green' : 'glass'}`}>
                  <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${(item.is_available ?? item.isAvailable) ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
                {/* Price overlay */}
                <div className="absolute bottom-3 left-3">
                  <p className="text-white font-heading font-bold text-xl">₱{Number(item.price).toFixed(2)}</p>
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="text-white font-semibold text-sm leading-tight">{item.name}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${(item.is_available ?? item.isAvailable) ? 'glass-green text-forest-200' : 'bg-red-500/20 text-red-300'}`}>
                    {(item.is_available ?? item.isAvailable) ? 'Available' : 'Unavailable'}
                  </span>
                </div>

                <p className="text-forest-200/50 text-xs line-clamp-2 mb-3">{item.description}</p>

                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <span className="glass text-forest-200/70 text-xs px-2 py-1 rounded-lg capitalize">{item.category_name || item.category}</span>
                  {(item.is_vegetarian || item.isVegetarian) && (
                    <span className="glass-green text-forest-200 text-xs px-2 py-1 rounded-lg flex items-center gap-1">
                      <Leaf className="w-2.5 h-2.5" /> Veg
                    </span>
                  )}
                  <span className="glass text-forest-200/70 text-xs px-2 py-1 rounded-lg flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" /> {item.prep_time_mins || item.prepTimeMins || "—"}m
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

      {/* Add Category Modal */}
      {catModal && createPortal(
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', backdropFilter:'blur(6px)', zIndex:9999, overflowY:'auto' }}>
          <div style={{ minHeight:'100%', display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}>
            <div className="glass rounded-3xl p-6 w-full" style={{ background:'rgba(8,22,12,0.98)', border:'1px solid rgba(255,255,255,.12)', maxWidth:'22rem' }}>
              <div className="flex items-center justify-between mb-4">
                <p className="text-white font-semibold text-lg">New Category</p>
                <button onClick={() => setCatModal(false)} className="w-8 h-8 glass rounded-xl flex items-center justify-center text-forest-200 hover:glass-orange transition-all">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-forest-200/60 text-xs font-medium mb-1">Category Name</label>
                  <input
                    autoFocus
                    value={newCatName}
                    onChange={e => setNewCatName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCategory())}
                    placeholder="e.g., Seafood"
                    className="w-full input-glass py-2.5 text-sm"
                  />
                </div>
                <div className="flex gap-2 pt-1">
                  <button type="button" onClick={() => setCatModal(false)}
                    className="flex-1 glass hover:glass-green transition-all text-forest-200 text-sm font-medium py-2.5 rounded-xl">
                    Cancel
                  </button>
                  <button type="button" onClick={addCategory}
                    className="flex-1 btn-glow-teal text-white text-sm font-semibold py-2.5 rounded-xl flex items-center justify-center gap-1.5">
                    <Check className="w-4 h-4" /> Add
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Add / Edit Modal — portalled to body to escape CSS transform context */}
      {modal && createPortal(
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', backdropFilter:'blur(6px)', zIndex:9999, overflowY:'auto' }}>
          <div style={{ minHeight:'100%', display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}>
          <div className="glass rounded-3xl p-6 w-full max-w-md" style={{ background:'rgba(8,22,12,0.98)', border:'1px solid rgba(255,255,255,.12)', maxWidth:'28rem', width:'100%' }}>
            <div className="flex items-center justify-between mb-5">
              <p className="text-white font-semibold text-lg">{modal === 'add' ? 'Add New Item' : 'Edit Item'}</p>
              <button onClick={closeModal} className="w-8 h-8 glass rounded-xl flex items-center justify-center text-forest-200 hover:glass-orange transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={submit} className="space-y-3">
              {[
                { label:'Item Name',       key:'name',     type:'text',   placeholder:'e.g., Margherita Pizza' },
                { label:'Price (₱)',       key:'price',    type:'number', placeholder:'0.00' },
                { label:'Prep Time (min)', key:'prepTime', type:'number', placeholder:'20' },
              ].map(({ label, key, type, placeholder }) => (
                <div key={key}>
                  <label className="block text-forest-200/60 text-xs font-medium mb-1">{label}</label>
                  <input type={type} value={form[key]} onChange={e => f(key, e.target.value)}
                    placeholder={placeholder} required
                    className="w-full input-glass py-2.5 text-sm" />
                </div>
              ))}

              {/* Food photo upload */}
              <div>
                <label className="block text-forest-200/60 text-xs font-medium mb-1">Food Photo</label>
                <button type="button" onClick={() => pickImage(b64 => f('image', b64))}
                  className="w-full glass rounded-xl overflow-hidden transition-all hover:glass-orange"
                  style={{ height: form.image ? '9rem' : '5rem' }}>
                  {form.image ? (
                    <img src={form.image} alt="preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full gap-1.5 text-forest-300/50">
                      <ImagePlus className="w-6 h-6" />
                      <span className="text-xs">Tap to upload photo</span>
                    </div>
                  )}
                </button>
                {form.image && (
                  <button type="button" onClick={() => f('image', '')}
                    className="mt-1 text-xs text-red-400/70 hover:text-red-400 transition-colors">
                    Remove photo
                  </button>
                )}
              </div>
              <div>
                <label className="block text-forest-200/60 text-xs font-medium mb-1">Category</label>
                <select value={form.category} onChange={e => f('category', e.target.value)}
                  className="w-full input-glass py-2.5 text-sm">
                  {allCategories.map(c => <option key={c.id} value={c.id} style={{ background:'#0d1a10' }}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-forest-200/60 text-xs font-medium mb-1">Description <span className="text-forest-200/30">(optional)</span></label>
                <textarea value={form.description} onChange={e => f('description', e.target.value)}
                  className="w-full input-glass py-2.5 text-sm h-20 resize-none" rows={3} />
              </div>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <div onClick={() => f('isVegetarian', !form.isVegetarian)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer ${form.isVegetarian ? 'btn-glow-green' : 'glass'}`}>
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
        </div>,
        document.body
      )}
    </div>
  );
}
