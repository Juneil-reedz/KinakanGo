import { useState, useEffect } from "react";
import { useNotification } from "../../context/NotificationContext";
import { usersApi } from "../../services/api";
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
  const { addNotification } = useNotification();
  const [list, setList]               = useState([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy]           = useState("name");
  const [selected, setSelected]       = useState(null);
  const [modal, setModal]             = useState(null); // "view" | "edit" | "delete"

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await usersApi.list({ role: "rider" });
        setList(res.data || res || []);
      } catch {
        addNotification("Failed to load riders", "error");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = list
    .filter(r => {
      const matchSearch = (r.name||"").toLowerCase().includes(search.toLowerCase()) || (r.email||"").toLowerCase().includes(search.toLowerCase()) || (r.vehicleNumber||"").toLowerCase().includes(search.toLowerCase());
      const matchStatus = filterStatus === "all" || r.status === filterStatus;
      return matchSearch && matchStatus;
    })
    .sort((a,b) => {
      if (sortBy === "rating")     return (b.rating||0) - (a.rating||0);
      if (sortBy === "deliveries") return (b.totalDeliveries||0) - (a.totalDeliveries||0);
      if (sortBy === "earnings")   return (b.earnings||0) - (a.earnings||0);
      return (a.name||"").localeCompare(b.name||"");
    });

  const openView   = (r) => { setSelected(r); setModal("view"); };
  const openEdit   = (r) => { setSelected(r); setModal("edit"); };
  const openDelete = (r) => { setSelected(r); setModal("delete"); };
  const close      = ()  => { setModal(null); setSelected(null); };

  const confirmDelete = async () => {
    try {
      await usersApi.update(selected.id, { deleted: true });
      setList(prev => prev.filter(r => r.id !== selected.id));
      addNotification("Rider removed", "success");
      close();
    } catch {
      addNotification("Failed to remove rider", "error");
    }
  };

  const totalDeliveries = list.reduce((a,r) => a + (r.totalDeliveries||0), 0);
  const avgRating       = list.length ? (list.reduce((a,r) => a + (r.rating||0), 0) / list.length).toFixed(1) : "0.0";

  const FILTERS = ["all","active","busy","offline"];

  return (
    <div className="space-y-5 pb-6 animate-fade-up">

      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <p className="text-forest-200/50 text-sm">Management</p>
          <h1 className="text-2xl font-heading font-bold text-white">Riders</h1>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label:"Total Riders",     value:list.length,                               icon:Bike,        color:"btn-glow-green" },
          { label:"Active Now",       value:list.filter(r=>r.status==="active").length, icon:CheckCircle, color:"glass-green" },
          { label:"Avg Rating",       value:avgRating,                                  icon:Star,        color:"glass-orange" },
          { label:"Total Deliveries", value:totalDeliveries.toLocaleString(),           icon:Package,     color:"glass" },
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

      {/* Loading */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="glass rounded-2xl h-64 animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
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
                      {(rider.name||"R").charAt(0)}
                    </div>
                  )}
                  <div>
                    <p className="text-white font-semibold text-sm">{rider.name}</p>
                    <p className="text-forest-200/50 text-xs">{rider.email}</p>
                  </div>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-semibold flex items-center gap-1 ${STATUS_CLS[rider.status] || "glass text-forest-200/60"}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[rider.status] || "bg-forest-200/40"}`} />
                  {rider.status || "offline"}
                </span>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                {[
                  { label:"Rating",     value:rider.rating || "—",                    icon:Star,      fill:true },
                  { label:"Deliveries", value:rider.totalDeliveries || 0,             icon:Package,   fill:false },
                  { label:"Today",      value:rider.completedToday || 0,              icon:TrendingUp,fill:false },
                  { label:"Earnings",   value:`₱${Number(rider.earnings||0).toLocaleString()}`, icon:DollarSign, fill:false },
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
                {rider.phone && <div className="flex items-center gap-2"><Phone className="w-3 h-3" />{rider.phone}</div>}
                {rider.zone  && <div className="flex items-center gap-2"><MapPin className="w-3 h-3" />{rider.zone}</div>}
                {rider.vehicleType && (
                  <div className="flex items-center gap-2">
                    {rider.vehicleType === "truck" ? <Truck className="w-3 h-3" /> : <Bike className="w-3 h-3" />}
                    <span className="capitalize">{rider.vehicleType}{rider.vehicleNumber ? ` - ${rider.vehicleNumber}` : ""}</span>
                  </div>
                )}
                {(rider.joinedDate || rider.createdAt) && (
                  <div className="flex items-center gap-2"><Calendar className="w-3 h-3" />Joined {new Date(rider.joinedDate || rider.createdAt).toLocaleDateString()}</div>
                )}
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
                : <div className="w-16 h-16 btn-glow-green rounded-xl flex items-center justify-center text-white font-bold text-2xl">{(selected.name||"R").charAt(0)}</div>}
              <div>
                <p className="text-white font-semibold">{selected.name}</p>
                <p className="text-forest-200/50 text-xs">{selected.email}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold mt-1 inline-block ${STATUS_CLS[selected.status] || "glass text-forest-200/60"}`}>{selected.status || "offline"}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                ["Rating",     selected.rating ? `${selected.rating} / 5.0` : "—"],
                ["Deliveries", selected.totalDeliveries || 0],
                ["Today",      selected.completedToday || 0],
                ["Earnings",   `₱${Number(selected.earnings||0).toLocaleString()}`],
                ["Phone",      selected.phone || "—"],
                ["Zone",       selected.zone || "—"],
                ["Vehicle",    selected.vehicleType || "—"],
                ["Plate",      selected.vehicleNumber || "—"],
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
            <form className="space-y-3" onSubmit={async e => {
              e.preventDefault();
              const name  = e.target.name.value;
              const email = e.target.email.value;
              const phone = e.target.phone.value;
              try {
                await usersApi.update(selected.id, { name, email, phone });
                setList(prev => prev.map(r => r.id === selected.id ? { ...r, name, email, phone } : r));
                addNotification("Rider updated", "success");
                close();
              } catch { addNotification("Failed to update rider", "error"); }
            }}>
              {[
                { label:"Name",  key:"name",  type:"text",  defaultValue:selected.name },
                { label:"Email", key:"email", type:"email", defaultValue:selected.email },
                { label:"Phone", key:"phone", type:"tel",   defaultValue:selected.phone },
              ].map(({ label, key, type, defaultValue }) => (
                <div key={key}>
                  <label className="block text-forest-200/60 text-xs font-medium mb-1">{label}</label>
                  <input name={key} type={type} defaultValue={defaultValue} className="w-full input-glass py-2.5 text-sm" />
                </div>
              ))}
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
              <p className="text-white font-semibold">Remove Rider</p>
              <button onClick={close} className="w-8 h-8 glass rounded-xl flex items-center justify-center hover:glass-orange transition-all">
                <X className="w-4 h-4 text-forest-200" />
              </button>
            </div>
            <div className="glass rounded-xl p-3 mb-4 bg-red-500/10">
              <p className="text-red-300 text-sm">Remove <strong>{selected.name}</strong>? This action cannot be undone.</p>
            </div>
            <div className="flex gap-2">
              <button onClick={close} className="flex-1 glass hover:glass-green transition-all text-forest-200 text-sm font-medium py-2.5 rounded-xl">Cancel</button>
              <button onClick={confirmDelete} className="flex-1 bg-red-500/80 hover:bg-red-500 text-white text-sm font-semibold py-2.5 rounded-xl transition-all">Remove</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
