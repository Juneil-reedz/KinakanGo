import { useState } from "react";
import { riders } from "../../data/mockData";
import { Bike, Search, Star, MapPin, Phone, Edit, Trash2, Eye, DollarSign, TrendingUp, Package, CheckCircle, Clock, Calendar, Truck, X, Check, ToggleLeft, ToggleRight } from "lucide-react";

const STATUS_CLS = {
  active:"glass-green text-forest-200",
  busy:"glass-orange text-ember-200",
  offline:"bg-red-500/20 text-red-300 border border-red-500/30",
};

const STATUS_DOT = {
  active:"bg-forest-400 animate-pulse",
  busy:"bg-ember-500",
  offline:"bg-red-500",
};

export default function AdminRiders() {
  const [search, setSearch]           = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterZone, setFilterZone]   = useState("all");
  const [sortBy, setSortBy]           = useState("name");
  const [selected, setSelected]       = useState(null);
  const [modal, setModal]             = useState(null); // "view" | "edit" | "delete"
  const [list, setList]               = useState(riders);

  const zones = ["all", ...new Set(list.map(r => r.zone))];

  const filtered = list
    .filter(r => {
      const matchSearch = r.name.toLowerCase().includes(search.toLowerCase()) || r.email.toLowerCase().includes(search.toLowerCase()) || r.vehicleNumber?.toLowerCase().includes(search.toLowerCase());
      const matchStatus = filterStatus === "all" || r.status === filterStatus;
      const matchZone   = filterZone   === "all" || r.zone   === filterZone;
      return matchSearch && matchStatus && matchZone;
    })
    .sort((a,b) => {
      if (sortBy === "rating")     return b.rating - a.rating;
      if (sortBy === "deliveries") return b.totalDeliveries - a.totalDeliveries;
      if (sortBy === "earnings")   return b.earnings - a.earnings;
      return a.name.localeCompare(b.name);
    });

  const openView   = (r) => { setSelected(r); setModal("view"); };
  const openEdit   = (r) => { setSelected(r); setModal("edit"); };
  const openDelete = (r) => { setSelected(r); setModal("delete"); };
  const close      = ()  => { setModal(null); setSelected(null); };

  const confirmDelete      = () => { setList(prev => prev.filter(r => r.id !== selected.id)); close(); };
  const toggleAvailability = (id) => setList(prev => prev.map(r => r.id === id ? { ...r, availability:!r.availability } : r));

  const totalDeliveries = list.reduce((a,r) => a + r.totalDeliveries, 0);
  const avgRating       = (list.reduce((a,r) => a + r.rating, 0) / list.length).toFixed(1);

  const FILTERS = ["all","active","busy","offline"];

  return (
    <div className="space-y-5 pb-6 animate-fade-up">

      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <p className="text-forest-200/50 text-sm">Management</p>
          <h1 className="text-2xl font-heading font-bold text-white">Riders</h1>
        </div>
        <button className="btn-glow-green text-white text-sm font-semibold px-4 py-2.5 rounded-xl flex items-center gap-1.5">
          <Bike className="w-4 h-4" /> Add Rider
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label:"Total Riders",     value:list.length,                              icon:Bike,        color:"btn-glow-green" },
          { label:"Active Now",       value:list.filter(r=>r.status==="active").length,icon:CheckCircle, color:"glass-green" },
          { label:"Avg Rating",       value:avgRating,                                icon:Star,        color:"glass-orange" },
          { label:"Total Deliveries", value:totalDeliveries.toLocaleString(),          icon:Package,     color:"glass" },
          { label:"Today",            value:list.reduce((a,r)=>a+r.completedToday,0), icon:TrendingUp,  color:"glass" },
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
            placeholder="Search by name, email or vehicle number..." className="w-full input-glass pl-9 py-2.5 text-sm" />
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="flex gap-2 flex-wrap">
            {FILTERS.map(s => (
              <button key={s} onClick={() => setFilterStatus(s)}
                className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all capitalize
                  ${filterStatus===s ? "btn-glow-green text-white" : "glass text-forest-200/60 hover:text-forest-100"}`}>
                {s === "all" ? "All" : s}
              </button>
            ))}
          </div>
          <select value={filterZone} onChange={e => setFilterZone(e.target.value)}
            className="input-glass py-1.5 text-xs rounded-xl flex-shrink-0">
            {zones.map(z => <option key={z} value={z} style={{ background:"#0d2b1a" }}>{z === "all" ? "All Zones" : z}</option>)}
          </select>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}
            className="input-glass py-1.5 text-xs rounded-xl flex-shrink-0">
            <option value="name" style={{ background:"#0d2b1a" }}>Sort: Name</option>
            <option value="rating" style={{ background:"#0d2b1a" }}>Sort: Rating</option>
            <option value="deliveries" style={{ background:"#0d2b1a" }}>Sort: Deliveries</option>
            <option value="earnings" style={{ background:"#0d2b1a" }}>Sort: Earnings</option>
          </select>
        </div>
      </div>

      <p className="text-forest-200/40 text-xs">Showing {filtered.length} rider(s)</p>

      {/* Riders grid */}
      {filtered.length === 0 ? (
        <div className="glass rounded-2xl py-14 flex flex-col items-center gap-3">
          <Bike className="w-10 h-10 text-forest-300/30" />
          <p className="text-forest-200/50 text-sm">No riders found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(rider => (
            <div key={rider.id} className="glass card-3d rounded-2xl p-4 hover:glass-green transition-all">
              {/* Avatar + Status */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  {rider.image ? (
                    <img src={rider.image} alt={rider.name} className="w-14 h-14 rounded-xl object-cover" />
                  ) : (
                    <div className="w-14 h-14 btn-glow-green rounded-xl flex items-center justify-center text-white font-bold text-xl">
                      {rider.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <p className="text-white font-semibold text-sm">{rider.name}</p>
                    <p className="text-forest-200/50 text-xs">{rider.email}</p>
                  </div>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-semibold flex items-center gap-1 ${STATUS_CLS[rider.status]}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[rider.status]}`} />
                  {rider.status}
                </span>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                {[
                  { label:"Rating",     value:rider.rating,                        icon:Star,      fill:true },
                  { label:"Deliveries", value:rider.totalDeliveries,               icon:Package,   fill:false },
                  { label:"Today",      value:rider.completedToday,                icon:TrendingUp,fill:false },
                  { label:"Earnings",   value:`$${rider.earnings.toLocaleString()}`,icon:DollarSign,fill:false },
                ].map(({ label, value, icon:Icon, fill }) => (
                  <div key={label} className="glass rounded-xl p-2.5">
                    <div className="flex items-center gap-1.5 text-forest-200/50 mb-1">
                      <Icon className={`w-3 h-3 ${fill ? "fill-ember-400 text-ember-400" : ""}`} />
                      <span className="text-xs">{label}</span>
                    </div>
                    <p className="text-white font-bold text-base">{value}</p>
                  </div>
                ))}
              </div>

              {/* Details */}
              <div className="space-y-1.5 text-xs text-forest-200/60 mb-3">
                <div className="flex items-center gap-2"><Phone className="w-3 h-3" />{rider.phone}</div>
                <div className="flex items-center gap-2"><MapPin className="w-3 h-3" />{rider.zone}</div>
                <div className="flex items-center gap-2">
                  {rider.vehicleType === "truck" ? <Truck className="w-3 h-3" /> : <Bike className="w-3 h-3" />}
                  <span className="capitalize">{rider.vehicleType} - {rider.vehicleNumber}</span>
                </div>
                <div className="flex items-center gap-2"><Calendar className="w-3 h-3" />Joined {new Date(rider.joinedDate).toLocaleDateString()}</div>
              </div>

              {/* Availability toggle */}
              <div className="flex items-center justify-between py-2.5 mb-3" style={{ borderTop:"1px solid rgba(255,255,255,.07)", borderBottom:"1px solid rgba(255,255,255,.07)" }}>
                <span className="text-forest-200/50 text-xs">Availability</span>
                <button onClick={() => toggleAvailability(rider.id)} className="flex items-center gap-1.5">
                  {rider.availability
                    ? <ToggleRight className="w-7 h-7 text-forest-400" />
                    : <ToggleLeft  className="w-7 h-7 text-forest-200/30" />}
                  <span className="text-xs text-forest-200/50">{rider.availability ? "On" : "Off"}</span>
                </button>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button onClick={() => openView(rider)} className="flex-1 glass hover:glass-green transition-all text-forest-200/80 text-xs font-medium py-2 rounded-xl flex items-center justify-center gap-1">
                  <Eye className="w-3.5 h-3.5" /> View
                </button>
                <button onClick={() => openEdit(rider)} className="flex-1 glass hover:glass-green transition-all text-forest-200/80 text-xs font-medium py-2 rounded-xl flex items-center justify-center gap-1">
                  <Edit className="w-3.5 h-3.5" /> Edit
                </button>
                <button onClick={() => openDelete(rider)} className="w-9 glass hover:bg-red-500/30 transition-all rounded-xl flex items-center justify-center">
                  <Trash2 className="w-3.5 h-3.5 text-red-400" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View Modal */}
      {modal === "view" && selected && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="glass rounded-3xl p-6 w-full max-w-sm my-4">
            <div className="flex items-center justify-between mb-5">
              <p className="text-white font-semibold">Rider Details</p>
              <button onClick={close} className="w-8 h-8 glass rounded-xl flex items-center justify-center hover:glass-orange transition-all">
                <X className="w-4 h-4 text-forest-200" />
              </button>
            </div>
            <div className="flex items-center gap-3 mb-5">
              {selected.image
                ? <img src={selected.image} alt={selected.name} className="w-16 h-16 rounded-xl object-cover" />
                : <div className="w-16 h-16 btn-glow-green rounded-xl flex items-center justify-center text-white font-bold text-2xl">{selected.name.charAt(0)}</div>}
              <div>
                <p className="text-white font-semibold">{selected.name}</p>
                <p className="text-forest-200/50 text-xs">{selected.email}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold mt-1 inline-block ${STATUS_CLS[selected.status]}`}>{selected.status}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                ["Rating",     `${selected.rating} / 5.0`],
                ["Deliveries", selected.totalDeliveries],
                ["Today",      selected.completedToday],
                ["Earnings",   `$${selected.earnings?.toLocaleString()}`],
                ["Phone",      selected.phone],
                ["Zone",       selected.zone],
                ["Vehicle",    selected.vehicleType],
                ["Plate",      selected.vehicleNumber],
              ].map(([label, value]) => (
                <div key={label} className="glass rounded-xl px-3 py-2">
                  <p className="text-forest-200/50 text-xs">{label}</p>
                  <p className="text-white text-sm font-semibold capitalize">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {modal === "edit" && selected && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="glass rounded-3xl p-6 w-full max-w-sm my-4">
            <div className="flex items-center justify-between mb-5">
              <p className="text-white font-semibold">Edit Rider</p>
              <button onClick={close} className="w-8 h-8 glass rounded-xl flex items-center justify-center hover:glass-orange transition-all">
                <X className="w-4 h-4 text-forest-200" />
              </button>
            </div>
            <form className="space-y-3" onSubmit={e => { e.preventDefault(); close(); }}>
              {[
                { label:"Name",  key:"name",  type:"text" },
                { label:"Email", key:"email", type:"email" },
                { label:"Phone", key:"phone", type:"tel" },
              ].map(({ label, key, type }) => (
                <div key={key}>
                  <label className="block text-forest-200/60 text-xs font-medium mb-1">{label}</label>
                  <input type={type} defaultValue={selected[key]} className="w-full input-glass py-2.5 text-sm" />
                </div>
              ))}
              <div>
                <label className="block text-forest-200/60 text-xs font-medium mb-1">Zone</label>
                <select defaultValue={selected.zone} className="w-full input-glass py-2.5 text-sm">
                  {zones.filter(z => z !== "all").map(z => <option key={z} value={z} style={{ background:"#0d2b1a" }}>{z}</option>)}
                </select>
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
      {modal === "delete" && selected && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass rounded-3xl p-6 w-full max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <p className="text-white font-semibold">Delete Rider</p>
              <button onClick={close} className="w-8 h-8 glass rounded-xl flex items-center justify-center hover:glass-orange transition-all">
                <X className="w-4 h-4 text-forest-200" />
              </button>
            </div>
            <div className="glass rounded-xl p-3 mb-4 bg-red-500/10">
              <p className="text-red-300 text-sm">Delete <strong>{selected.name}</strong>? This action cannot be undone.</p>
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
