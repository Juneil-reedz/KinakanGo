import { useState, useEffect } from "react";
import { useNotification } from "../../context/NotificationContext";
import { adminApi } from "../../context/AdminContext";
import { Ticket, Plus, Edit, Trash2, Check, X, Calendar, Users, TrendingUp } from "lucide-react";

const EMPTY_FORM = { code:"", type:"percentage", value:"", minOrder:"", maxDiscount:"", usageLimit:"", startDate:"", endDate:"", targetUsers:"all", description:"" };

const STATUS_CLS = {
  active:"glass-green text-forest-200",
  inactive:"glass text-forest-200/60",
  expired:"bg-red-500/20 text-red-300 border border-red-500/30",
};

export default function AdminPromos() {
  const { addNotification } = useNotification();
  const [promos, setPromos]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState("all");
  const [modal, setModal]         = useState(null); // "create" | "edit"
  const [selectedPromo, setSelected] = useState(null);
  const [form, setForm]           = useState(EMPTY_FORM);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await adminApi.promos.list({});
        setPromos(res.data || res || []);
      } catch {
        addNotification("Failed to load promos", "error");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const f = (k, v) => setForm(p => ({ ...p, [k]:v }));

  const filtered = filter === "all" ? promos : promos.filter(p => p.status === filter);

  const openCreate = () => { setForm(EMPTY_FORM); setSelected(null); setModal("create"); };
  const openEdit   = (p) => {
    setSelected(p);
    setForm({ code:p.code, type:p.type, value:String(p.value), minOrder:String(p.minOrder), maxDiscount:p.maxDiscount?.toString()||"", usageLimit:p.usageLimit?.toString()||"", startDate:p.startDate, endDate:p.endDate, targetUsers:p.targetUsers, description:p.description });
    setModal("edit");
  };
  const close = () => { setModal(null); setSelected(null); setForm(EMPTY_FORM); };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const payload = { code:form.code.toUpperCase(), type:form.type, value:parseFloat(form.value), minOrder:parseFloat(form.minOrder)||0, maxDiscount:form.maxDiscount?parseFloat(form.maxDiscount):null, usageLimit:parseInt(form.usageLimit)||null, startDate:form.startDate, endDate:form.endDate, status:"active", targetUsers:form.targetUsers, description:form.description };
      const created = await adminApi.promos.create(payload);
      setPromos(p => [created, ...p]);
      addNotification(`Promo "${payload.code}" created!`, "success");
      close();
    } catch {
      addNotification("Failed to create promo", "error");
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const payload = { code:form.code.toUpperCase(), type:form.type, value:parseFloat(form.value), minOrder:parseFloat(form.minOrder)||0, maxDiscount:form.maxDiscount?parseFloat(form.maxDiscount):null, usageLimit:parseInt(form.usageLimit)||null, startDate:form.startDate, endDate:form.endDate, targetUsers:form.targetUsers, description:form.description };
      const updated = await adminApi.promos.update(selectedPromo.id, payload);
      setPromos(prev => prev.map(p => p.id === selectedPromo.id ? { ...p, ...payload, ...(updated || {}) } : p));
      addNotification("Promo updated!", "success");
      close();
    } catch {
      addNotification("Failed to update promo", "error");
    }
  };

  const toggleStatus = async (id) => {
    const promo = promos.find(p => p.id === id);
    const newStatus = promo.status === "active" ? "inactive" : "active";
    try {
      await adminApi.promos.update(id, { status: newStatus });
      setPromos(prev => prev.map(p => p.id === id ? { ...p, status:newStatus } : p));
      addNotification("Promo status updated", "success");
    } catch {
      addNotification("Failed to update promo status", "error");
    }
  };

  const deletePromo = async (id) => {
    try {
      await adminApi.promos.remove(id);
      setPromos(prev => prev.filter(p => p.id !== id));
      addNotification("Promo deleted", "success");
    } catch {
      addNotification("Failed to delete promo", "error");
    }
  };

  const FILTER_OPTS = ["all","active","inactive","expired"];

  const PromoForm = ({ onSubmit, submitLabel }) => (
    <form onSubmit={onSubmit} className="space-y-3">
      <div>
        <label className="block text-forest-200/60 text-xs font-medium mb-1">Promo Code *</label>
        <input type="text" value={form.code} onChange={e => f("code", e.target.value.toUpperCase())}
          className="w-full input-glass py-2.5 text-sm font-mono" placeholder="e.g., WELCOME20" required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-forest-200/60 text-xs font-medium mb-1">Discount Type *</label>
          <select value={form.type} onChange={e => f("type", e.target.value)} className="w-full input-glass py-2.5 text-sm" required>
            <option value="percentage" style={{ background:"#0d2b1a" }}>Percentage (%)</option>
            <option value="fixed"      style={{ background:"#0d2b1a" }}>Fixed Amount (₱)</option>
          </select>
        </div>
        <div>
          <label className="block text-forest-200/60 text-xs font-medium mb-1">Value *</label>
          <input type="number" step="0.01" value={form.value} onChange={e => f("value", e.target.value)}
            className="w-full input-glass py-2.5 text-sm" placeholder={form.type === "percentage" ? "20" : "5.00"} required />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-forest-200/60 text-xs font-medium mb-1">Min Order (₱)</label>
          <input type="number" step="0.01" value={form.minOrder} onChange={e => f("minOrder", e.target.value)}
            className="w-full input-glass py-2.5 text-sm" placeholder="0.00" />
        </div>
        <div>
          <label className="block text-forest-200/60 text-xs font-medium mb-1">Max Discount (₱)</label>
          <input type="number" step="0.01" value={form.maxDiscount} onChange={e => f("maxDiscount", e.target.value)}
            className="w-full input-glass py-2.5 text-sm" placeholder="Optional" />
        </div>
      </div>
      <div>
        <label className="block text-forest-200/60 text-xs font-medium mb-1">Usage Limit</label>
        <input type="number" value={form.usageLimit} onChange={e => f("usageLimit", e.target.value)}
          className="w-full input-glass py-2.5 text-sm" placeholder="Leave empty for unlimited" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-forest-200/60 text-xs font-medium mb-1">Start Date *</label>
          <input type="date" value={form.startDate} onChange={e => f("startDate", e.target.value)}
            className="w-full input-glass py-2.5 text-sm" required />
        </div>
        <div>
          <label className="block text-forest-200/60 text-xs font-medium mb-1">End Date *</label>
          <input type="date" value={form.endDate} onChange={e => f("endDate", e.target.value)}
            className="w-full input-glass py-2.5 text-sm" required />
        </div>
      </div>
      <div>
        <label className="block text-forest-200/60 text-xs font-medium mb-1">Target Users *</label>
        <select value={form.targetUsers} onChange={e => f("targetUsers", e.target.value)} className="w-full input-glass py-2.5 text-sm" required>
          <option value="all"       style={{ background:"#0d2b1a" }}>All Users</option>
          <option value="new"       style={{ background:"#0d2b1a" }}>New Users Only</option>
          <option value="returning" style={{ background:"#0d2b1a" }}>Returning Users Only</option>
        </select>
      </div>
      <div>
        <label className="block text-forest-200/60 text-xs font-medium mb-1">Description *</label>
        <textarea value={form.description} onChange={e => f("description", e.target.value)} rows={2}
          className="w-full input-glass py-2.5 text-sm resize-none" required />
      </div>
      <div className="flex gap-2 pt-2">
        <button type="button" onClick={close} className="flex-1 glass hover:glass-green transition-all text-forest-200 text-sm font-medium py-2.5 rounded-xl">Cancel</button>
        <button type="submit" className="flex-1 btn-glow-green text-white text-sm font-semibold py-2.5 rounded-xl flex items-center justify-center gap-1.5">
          <Check className="w-4 h-4" /> {submitLabel}
        </button>
      </div>
    </form>
  );

  return (
    <div className="space-y-5 pb-6 animate-fade-up">

      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <p className="text-forest-200/50 text-sm">Management</p>
          <h1 className="text-2xl font-heading font-bold text-white">Promos</h1>
        </div>
        <button onClick={openCreate} className="btn-glow-green text-white text-sm font-semibold px-4 py-2.5 rounded-xl flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> Create Promo
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label:"Total Promos",  value:promos.length,                              icon:Ticket,     color:"btn-glow-green" },
          { label:"Active",        value:promos.filter(p=>p.status==="active").length,icon:TrendingUp, color:"glass-green" },
          { label:"Total Uses",    value:promos.reduce((a,p)=>a+(p.usedCount||0),0), icon:Users,      color:"glass-orange" },
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

      {/* Filters */}
      <div className="flex glass rounded-xl overflow-hidden w-fit">
        {FILTER_OPTS.map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-2 text-xs font-semibold transition-all capitalize
              ${filter===s ? "btn-glow-green text-white" : "text-forest-200/60 hover:text-forest-100"}`}>
            {s === "all" ? `All (${promos.length})` : `${s.charAt(0).toUpperCase()+s.slice(1)} (${promos.filter(p=>p.status===s).length})`}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1,2].map(i => <div key={i} className="glass rounded-2xl h-48 animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass rounded-2xl py-14 flex flex-col items-center gap-3">
          <Ticket className="w-10 h-10 text-forest-300/30" />
          <p className="text-forest-200/50 text-sm">No promo codes found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map(promo => (
            <div key={promo.id} className="glass card-3d rounded-2xl p-5 hover:glass-green transition-all">
              {/* Header row */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${STATUS_CLS[promo.status] || "glass text-forest-200/60"}`}>
                      {(promo.status || "active").toUpperCase()}
                    </span>
                    {promo.targetUsers === "new" && (
                      <span className="text-xs px-2 py-0.5 rounded-full glass text-forest-200/60">New Users</span>
                    )}
                  </div>
                  <p className="text-white font-mono font-bold text-xl">{promo.code}</p>
                  <p className="text-forest-200/50 text-xs mt-0.5">{promo.description}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-ember-400 font-heading font-bold text-3xl">
                    {promo.type === "percentage" ? `${promo.value}%` : `₱${promo.value}`}
                  </p>
                  <p className="text-forest-200/40 text-xs">OFF</p>
                </div>
              </div>

              {/* Details grid */}
              <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                <div className="glass rounded-xl px-2.5 py-2">
                  <p className="text-forest-200/40">Min Order</p>
                  <p className="text-white font-medium">₱{Number(promo.minOrder || 0).toFixed(2)}</p>
                </div>
                {promo.maxDiscount && (
                  <div className="glass rounded-xl px-2.5 py-2">
                    <p className="text-forest-200/40">Max Discount</p>
                    <p className="text-white font-medium">₱{Number(promo.maxDiscount).toFixed(2)}</p>
                  </div>
                )}
                <div className="glass rounded-xl px-2.5 py-2">
                  <p className="text-forest-200/40">Usage</p>
                  <p className="text-white font-medium">{promo.usedCount || 0} / {promo.usageLimit || "∞"}</p>
                </div>
                <div className="glass rounded-xl px-2.5 py-2 flex items-start gap-1.5">
                  <Calendar className="w-3 h-3 text-forest-300/50 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-forest-200/40">Valid Until</p>
                    <p className="text-white font-medium">{promo.endDate}</p>
                  </div>
                </div>
              </div>

              {/* Usage bar */}
              {promo.usageLimit && (
                <div className="mb-4">
                  <div className="w-full glass h-1.5 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-forest-500 to-ember-500 rounded-full transition-all"
                      style={{ width:`${Math.min(((promo.usedCount||0)/promo.usageLimit)*100,100)}%` }} />
                  </div>
                  <p className="text-forest-200/30 text-xs mt-1 text-right">{Math.round(((promo.usedCount||0)/promo.usageLimit)*100)}% used</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-3" style={{ borderTop:"1px solid rgba(255,255,255,.07)" }}>
                <button onClick={() => openEdit(promo)} className="flex-1 glass hover:glass-green transition-all text-forest-200/80 text-xs font-medium py-2 rounded-xl flex items-center justify-center gap-1.5">
                  <Edit className="w-3.5 h-3.5" /> Edit
                </button>
                <button onClick={() => toggleStatus(promo.id)}
                  className={`flex-1 transition-all text-xs font-medium py-2 rounded-xl flex items-center justify-center gap-1.5
                    ${promo.status === "active" ? "glass hover:glass-orange text-forest-200/80" : "btn-glow-green text-white"}`}>
                  {promo.status === "active" ? "Deactivate" : "Activate"}
                </button>
                <button onClick={() => deletePromo(promo.id)} className="w-9 glass hover:bg-red-500/30 rounded-xl flex items-center justify-center transition-all flex-shrink-0">
                  <Trash2 className="w-3.5 h-3.5 text-red-400" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="glass rounded-3xl p-6 w-full max-w-md my-4">
            <div className="flex items-center justify-between mb-5">
              <p className="text-white font-semibold">{modal === "create" ? "Create Promo Code" : "Edit Promo Code"}</p>
              <button onClick={close} className="w-8 h-8 glass rounded-xl flex items-center justify-center hover:glass-orange transition-all">
                <X className="w-4 h-4 text-forest-200" />
              </button>
            </div>
            <PromoForm
              onSubmit={modal === "create" ? handleCreate : handleUpdate}
              submitLabel={modal === "create" ? "Create Promo" : "Save Changes"}
            />
          </div>
        </div>
      )}
    </div>
  );
}
