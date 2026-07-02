import { useState } from "react";
import { restaurants, menuItems } from "../../data/mockData";
import { Store, Search, Star, Clock, DollarSign, Package, Edit, Trash2, Eye, ChevronDown, ChevronUp, CheckCircle, XCircle, X, Check } from "lucide-react";

export default function AdminRestaurants() {
  const [search, setSearch]                 = useState("");
  const [filter, setFilter]                 = useState("all");
  const [expanded, setExpanded]             = useState({});
  const [selectedRestaurant, setSelected]   = useState(null);
  const [modal, setModal]                   = useState(null); // "view" | "edit" | "delete"
  const [list, setList]                     = useState(restaurants);
  const [editForm, setEditForm]             = useState({});

  const avgRating = (list.reduce((a,r) => a+r.rating, 0) / list.length).toFixed(1);

  const filtered = list.filter(r => {
    const matchSearch = r.name.toLowerCase().includes(search.toLowerCase()) || r.category?.toLowerCase().includes(search.toLowerCase()) || r.cuisines?.some(c => c.toLowerCase().includes(search.toLowerCase()));
    const matchFilter = filter === "all" || (filter === "open" && r.isOpen) || (filter === "closed" && !r.isOpen);
    return matchSearch && matchFilter;
  });

  const getMenu = (id) => menuItems.filter(m => m.restaurantId === id);
  const toggle  = (id) => setExpanded(p => ({ ...p, [id]: !p[id] }));

  const openView   = (r) => { setSelected(r); setModal("view"); };
  const openEdit   = (r) => { setSelected(r); setEditForm({ name:r.name, description:r.description }); setModal("edit"); };
  const openDelete = (r) => { setSelected(r); setModal("delete"); };
  const close      = ()  => { setModal(null); setSelected(null); };

  const confirmDelete = () => { setList(prev => prev.filter(r => r.id !== selectedRestaurant.id)); close(); };
  const toggleStatus  = (id) => setList(prev => prev.map(r => r.id === id ? { ...r, isOpen:!r.isOpen } : r));

  const FILTERS = [
    { key:"all",    label:`All (${list.length})` },
    { key:"open",   label:`Open (${list.filter(r=>r.isOpen).length})` },
    { key:"closed", label:`Closed (${list.filter(r=>!r.isOpen).length})` },
  ];

  return (
    <div className="space-y-5 pb-6 animate-fade-up">

      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <p className="text-forest-200/50 text-sm">Management</p>
          <h1 className="text-2xl font-heading font-bold text-white">Restaurants</h1>
        </div>
        <button className="btn-glow-green text-white text-sm font-semibold px-4 py-2.5 rounded-xl flex items-center gap-1.5">
          <Store className="w-4 h-4" /> Add Restaurant
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label:"Total",        value:list.length,                          icon:Store,       color:"btn-glow-green" },
          { label:"Open Now",     value:list.filter(r=>r.isOpen).length,     icon:CheckCircle, color:"glass-green" },
          { label:"Avg Rating",   value:avgRating,                           icon:Star,        color:"glass-orange" },
          { label:"Menu Items",   value:menuItems.length,                    icon:Package,     color:"glass" },
        ].map(({ label, value, icon:Icon, color }) => (
          <div key={label} className="glass card-3d rounded-2xl p-4">
            <div className={`w-9 h-9 ${color} rounded-xl flex items-center justify-center mb-2`}>
              <Icon className="w-4 h-4 text-white" />
            </div>
            <p className="text-white font-heading font-bold text-xl">{value}</p>
            <p className="text-forest-200/50 text-xs mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Search + Filters */}
      <div className="glass rounded-2xl p-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-forest-300/50" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, category or cuisine..." className="w-full input-glass pl-9 py-2.5 text-sm" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {FILTERS.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all
                ${filter===f.key ? "btn-glow-green text-white" : "glass text-forest-200/60 hover:text-forest-100"}`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <p className="text-forest-200/40 text-xs">Showing {filtered.length} restaurant(s)</p>

      {/* Restaurant list */}
      {filtered.length === 0 ? (
        <div className="glass rounded-2xl py-14 flex flex-col items-center gap-3">
          <Store className="w-10 h-10 text-forest-300/30" />
          <p className="text-forest-200/50 text-sm">No restaurants found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(r => {
            const menu = getMenu(r.id);
            const isOpen = expanded[r.id];
            return (
              <div key={r.id} className="glass rounded-2xl overflow-hidden">
                <div className="p-4 flex flex-col lg:flex-row gap-4">
                  {/* Image */}
                  <div className="lg:w-52 h-36 lg:h-auto relative rounded-xl overflow-hidden flex-shrink-0">
                    <img src={r.image} alt={r.name} className="w-full h-full object-cover" />
                    <button onClick={() => toggleStatus(r.id)}
                      className={`absolute top-2 right-2 text-xs font-semibold px-2 py-0.5 rounded-full cursor-pointer transition-all
                        ${r.isOpen ? "btn-glow-green text-white" : "bg-red-500/80 text-white hover:bg-red-500"}`}>
                      {r.isOpen ? "Open" : "Closed"}
                    </button>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <h3 className="text-white font-semibold">{r.name}</h3>
                        <p className="text-forest-200/50 text-xs mt-0.5 line-clamp-2">{r.description}</p>
                      </div>
                      <div className="flex gap-1.5 flex-shrink-0">
                        <button onClick={() => openView(r)} className="w-8 h-8 glass hover:glass-green rounded-xl flex items-center justify-center transition-all">
                          <Eye className="w-3.5 h-3.5 text-forest-200" />
                        </button>
                        <button onClick={() => openEdit(r)} className="w-8 h-8 glass hover:glass-green rounded-xl flex items-center justify-center transition-all">
                          <Edit className="w-3.5 h-3.5 text-forest-200" />
                        </button>
                        <button onClick={() => openDelete(r)} className="w-8 h-8 glass hover:bg-red-500/30 rounded-xl flex items-center justify-center transition-all">
                          <Trash2 className="w-3.5 h-3.5 text-red-400" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mb-3 text-xs text-forest-200/60">
                      <span className="flex items-center gap-1"><Star className="w-3 h-3 fill-ember-400 text-ember-400" />{r.rating} ({r.reviews})</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{r.deliveryTime}m</span>
                      <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />${r.deliveryFee} delivery</span>
                    </div>

                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {r.cuisines?.map((c,i) => (
                        <span key={i} className="glass text-forest-200/70 text-xs px-2 py-0.5 rounded-lg">{c}</span>
                      ))}
                    </div>

                    <button onClick={() => toggle(r.id)}
                      className="flex items-center gap-1 text-forest-200/50 hover:text-forest-200 text-xs font-medium transition-colors">
                      {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      {isOpen ? "Hide" : "View"} Menu ({menu.length} items)
                    </button>
                  </div>
                </div>

                {/* Menu items */}
                {isOpen && (
                  <div className="px-4 pb-4" style={{ borderTop:"1px solid rgba(255,255,255,.07)" }}>
                    <p className="text-white font-semibold text-sm pt-3 mb-2">Menu Items</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                      {menu.map(item => (
                        <div key={item.id} className="glass rounded-xl p-3 flex items-center gap-3">
                          {item.image && <img src={item.image} alt={item.name} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />}
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-xs font-semibold truncate">{item.name}</p>
                            <p className="text-forest-200/50 text-xs line-clamp-1 mt-0.5">{item.description}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-ember-400 font-bold text-xs">${item.price}</span>
                              {item.isVegetarian && <span className="glass-green text-forest-200 text-xs px-1.5 rounded">Veg</span>}
                              <span className={`text-xs px-1.5 rounded ${item.isAvailable ? "glass-green text-forest-200" : "bg-red-500/20 text-red-300"}`}>
                                {item.isAvailable ? "Available" : "Out"}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* View Modal */}
      {modal === "view" && selectedRestaurant && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="glass rounded-3xl p-6 w-full max-w-md my-4">
            <div className="flex items-center justify-between mb-4">
              <p className="text-white font-semibold">Restaurant Details</p>
              <button onClick={close} className="w-8 h-8 glass rounded-xl flex items-center justify-center hover:glass-orange transition-all">
                <X className="w-4 h-4 text-forest-200" />
              </button>
            </div>
            <img src={selectedRestaurant.image} alt={selectedRestaurant.name} className="w-full h-44 object-cover rounded-2xl mb-4" />
            <p className="text-white font-heading font-bold text-lg mb-1">{selectedRestaurant.name}</p>
            <p className="text-forest-200/50 text-sm mb-4">{selectedRestaurant.description}</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                ["Rating",       `${selectedRestaurant.rating} / 5.0`],
                ["Reviews",      selectedRestaurant.reviews],
                ["Delivery Time",`${selectedRestaurant.deliveryTime} min`],
                ["Delivery Fee", `$${selectedRestaurant.deliveryFee}`],
                ["Min Order",    `$${selectedRestaurant.minOrder}`],
                ["Status",       selectedRestaurant.isOpen ? "Open" : "Closed"],
              ].map(([label, value]) => (
                <div key={label} className="glass rounded-xl px-3 py-2">
                  <p className="text-forest-200/50 text-xs">{label}</p>
                  <p className="text-white text-sm font-semibold">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {modal === "edit" && selectedRestaurant && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="glass rounded-3xl p-6 w-full max-w-md my-4">
            <div className="flex items-center justify-between mb-5">
              <p className="text-white font-semibold">Edit Restaurant</p>
              <button onClick={close} className="w-8 h-8 glass rounded-xl flex items-center justify-center hover:glass-orange transition-all">
                <X className="w-4 h-4 text-forest-200" />
              </button>
            </div>
            <form className="space-y-3" onSubmit={e => { e.preventDefault(); close(); }}>
              <div>
                <label className="block text-forest-200/60 text-xs font-medium mb-1">Restaurant Name</label>
                <input type="text" defaultValue={selectedRestaurant.name} className="w-full input-glass py-2.5 text-sm" />
              </div>
              <div>
                <label className="block text-forest-200/60 text-xs font-medium mb-1">Description</label>
                <textarea rows={3} defaultValue={selectedRestaurant.description} className="w-full input-glass py-2.5 text-sm resize-none" />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={close} className="flex-1 glass hover:glass-green transition-all text-forest-200 text-sm font-medium py-2.5 rounded-xl">Cancel</button>
                <button type="submit" className="flex-1 btn-glow-green text-white text-sm font-semibold py-2.5 rounded-xl flex items-center justify-center gap-1.5">
                  <Check className="w-4 h-4" /> Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {modal === "delete" && selectedRestaurant && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass rounded-3xl p-6 w-full max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <p className="text-white font-semibold">Delete Restaurant</p>
              <button onClick={close} className="w-8 h-8 glass rounded-xl flex items-center justify-center hover:glass-orange transition-all">
                <X className="w-4 h-4 text-forest-200" />
              </button>
            </div>
            <div className="glass rounded-xl p-3 mb-4 bg-red-500/10">
              <p className="text-red-300 text-sm">Delete <strong>{selectedRestaurant.name}</strong>? This action cannot be undone.</p>
            </div>
            <div className="flex gap-2">
              <button onClick={close} className="flex-1 glass hover:glass-green transition-all text-forest-200 text-sm font-medium py-2.5 rounded-xl">Cancel</button>
              <button onClick={confirmDelete} className="flex-1 bg-red-500/80 hover:bg-red-500 text-white text-sm font-semibold py-2.5 rounded-xl transition-all">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
