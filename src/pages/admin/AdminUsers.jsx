import { useState, useEffect } from "react";
import { useNotification } from "../../context/NotificationContext";
import { adminApi } from "../../context/AdminContext";
import { Users, Search, Shield, ShieldOff, Eye, Clock, Package, DollarSign, AlertTriangle, X, Check } from "lucide-react";

const STATUS_CLS = {
  active:"glass-green text-forest-200",
  banned:"bg-red-500/20 text-red-300 border border-red-500/30",
  suspended:"glass-orange text-ember-200",
};

export default function AdminUsers() {
  const { addNotification } = useNotification();
  const [users, setUsers]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [filter, setFilter]         = useState("all");
  const [selectedUser, setSelectedUser] = useState(null);
  const [modal, setModal]           = useState(null); // "ban" | "unban" | "view"
  const [banReason, setBanReason]   = useState("");

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await adminApi.users.list({ role: "customer" });
        setUsers(res.data || res || []);
      } catch {
        addNotification("Failed to load users", "error");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = users.filter(u => {
    const matchFilter = filter === "all" || u.status === filter;
    const matchSearch = !search || (u.name || "").toLowerCase().includes(search.toLowerCase()) || (u.email || "").toLowerCase().includes(search.toLowerCase()) || (u.phone || "").includes(search);
    return matchFilter && matchSearch;
  });

  const openBan   = (u) => { setSelectedUser(u); setModal("ban"); };
  const openUnban = (u) => { setSelectedUser(u); setModal("unban"); };
  const openView  = (u) => { setSelectedUser(u); setModal("view"); };
  const close     = ()  => { setModal(null); setSelectedUser(null); setBanReason(""); };

  const handleBan = async () => {
    if (!banReason.trim()) { addNotification("Please provide a reason", "error"); return; }
    try {
      await adminApi.users.ban(selectedUser.id, banReason);
      setUsers(prev => prev.map(u => u.id === selectedUser.id ? { ...u, status:"banned", banReason } : u));
      addNotification(`${selectedUser.name} has been banned`, "success");
      close();
    } catch {
      addNotification("Failed to ban user", "error");
    }
  };

  const handleUnban = async () => {
    try {
      await adminApi.users.unban(selectedUser.id);
      setUsers(prev => prev.map(u => u.id === selectedUser.id ? { ...u, status:"active", banReason:null } : u));
      addNotification(`${selectedUser.name} has been unbanned`, "success");
      close();
    } catch {
      addNotification("Failed to unban user", "error");
    }
  };

  const FILTERS = [
    { key:"all",    label:`All (${users.length})` },
    { key:"active", label:`Active (${users.filter(u=>u.status==="active").length})` },
    { key:"banned", label:`Banned (${users.filter(u=>u.status==="banned").length})` },
  ];

  return (
    <div className="space-y-5 pb-6 animate-fade-up">

      {/* Header */}
      <div>
        <p className="text-forest-200/50 text-sm">Management</p>
        <h1 className="text-2xl font-heading font-bold text-white">User Management</h1>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label:"Total Users",   value:users.length,                              icon:Users,         color:"btn-glow-green" },
          { label:"Active",        value:users.filter(u=>u.status==="active").length,icon:Shield,        color:"glass-green" },
          { label:"Banned",        value:users.filter(u=>u.status==="banned").length,icon:ShieldOff,     color:"bg-red-500/30" },
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
            placeholder="Search by name, email or phone..." className="w-full input-glass pl-9 py-2.5 text-sm" />
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

      {/* Loading */}
      {loading ? (
        <div className="space-y-2">
          {[1,2,3].map(i => <div key={i} className="glass rounded-2xl h-20 animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass rounded-2xl py-14 flex flex-col items-center gap-3">
          <div className="w-14 h-14 glass rounded-2xl flex items-center justify-center">
            <Users className="w-7 h-7 text-forest-300/40" />
          </div>
          <p className="text-forest-200/50 text-sm">No users found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(user => (
            <div key={user.id} className="glass rounded-2xl p-4 hover:glass-green transition-all">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 btn-glow-green rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                  {(user.name || "U").charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-white font-semibold text-sm">{user.name}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${STATUS_CLS[user.status] || "glass text-forest-200/60"}`}>
                          {(user.status || "active").toUpperCase()}
                        </span>
                        {user.issues > 0 && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 flex items-center gap-0.5">
                            <AlertTriangle className="w-2.5 h-2.5" /> {user.issues} issues
                          </span>
                        )}
                      </div>
                      <p className="text-forest-200/50 text-xs mt-0.5">{user.email} {user.phone ? `· ${user.phone}` : ""}</p>
                      {user.banReason && (
                        <p className="text-red-400/70 text-xs mt-1 flex items-center gap-1">
                          <ShieldOff className="w-3 h-3" /> {user.banReason}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button onClick={() => openView(user)}
                        className="w-8 h-8 glass hover:glass-green rounded-xl flex items-center justify-center transition-all">
                        <Eye className="w-3.5 h-3.5 text-forest-200" />
                      </button>
                      {user.status === "active" ? (
                        <button onClick={() => openBan(user)}
                          className="glass hover:bg-red-500/30 transition-all text-red-400 text-xs font-medium px-3 py-1.5 rounded-xl">
                          Ban
                        </button>
                      ) : (
                        <button onClick={() => openUnban(user)}
                          className="btn-glow-green text-white text-xs font-medium px-3 py-1.5 rounded-xl">
                          Unban
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-xs text-forest-200/50">
                    <span className="flex items-center gap-1"><Package className="w-3 h-3" />{user.totalOrders || 0} orders</span>
                    <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />₱{Number(user.totalSpent || 0).toFixed(2)} spent</span>
                    {user.lastOrder && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{user.lastOrder}</span>}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View modal */}
      {modal === "view" && selectedUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass rounded-3xl p-6 w-full max-w-sm">
            <div className="flex items-center justify-between mb-5">
              <p className="text-white font-semibold">User Details</p>
              <button onClick={close} className="w-8 h-8 glass rounded-xl flex items-center justify-center hover:glass-orange transition-all">
                <X className="w-4 h-4 text-forest-200" />
              </button>
            </div>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-14 h-14 btn-glow-green rounded-xl flex items-center justify-center text-white font-bold text-2xl">
                {(selectedUser.name || "U").charAt(0)}
              </div>
              <div>
                <p className="text-white font-semibold">{selectedUser.name}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${STATUS_CLS[selectedUser.status] || "glass text-forest-200/60"}`}>
                  {(selectedUser.status || "active").toUpperCase()}
                </span>
              </div>
            </div>
            <div className="space-y-3">
              {[
                { label:"Email",        value:selectedUser.email },
                { label:"Phone",        value:selectedUser.phone || "—" },
                { label:"Joined",       value:selectedUser.joinDate || selectedUser.createdAt ? new Date(selectedUser.joinDate || selectedUser.createdAt).toLocaleDateString() : "—" },
                { label:"Total Orders", value:selectedUser.totalOrders || 0 },
                { label:"Total Spent",  value:`₱${Number(selectedUser.totalSpent || 0).toFixed(2)}` },
                { label:"Issues",       value:selectedUser.issues || 0 },
              ].map(({ label, value }) => (
                <div key={label} className="glass rounded-xl px-3 py-2 flex justify-between">
                  <span className="text-forest-200/50 text-xs">{label}</span>
                  <span className="text-white text-xs font-medium">{value}</span>
                </div>
              ))}
              {selectedUser.banReason && (
                <div className="glass rounded-xl p-3 bg-red-500/10">
                  <p className="text-forest-200/50 text-xs mb-1">Ban Reason</p>
                  <p className="text-red-300 text-sm">{selectedUser.banReason}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Ban modal */}
      {modal === "ban" && selectedUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass rounded-3xl p-6 w-full max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <p className="text-white font-semibold">Ban User</p>
              <button onClick={close} className="w-8 h-8 glass rounded-xl flex items-center justify-center hover:glass-orange transition-all">
                <X className="w-4 h-4 text-forest-200" />
              </button>
            </div>
            <div className="glass rounded-xl p-3 mb-4 bg-red-500/10">
              <p className="text-red-300 text-sm">
                <strong>{selectedUser.name}</strong> will be banned and lose access to their account.
              </p>
            </div>
            <div className="mb-4">
              <label className="block text-forest-200/60 text-xs font-medium mb-1">Reason for Ban *</label>
              <textarea value={banReason} onChange={e => setBanReason(e.target.value)} rows={3}
                className="w-full input-glass py-2.5 text-sm resize-none"
                placeholder="e.g., Multiple fraudulent payment attempts..." />
            </div>
            <div className="flex gap-2">
              <button onClick={close} className="flex-1 glass hover:glass-green transition-all text-forest-200 text-sm font-medium py-2.5 rounded-xl">
                Cancel
              </button>
              <button onClick={handleBan} disabled={!banReason.trim()}
                className="flex-1 bg-red-500/80 hover:bg-red-500 disabled:opacity-40 text-white text-sm font-semibold py-2.5 rounded-xl transition-all">
                Confirm Ban
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unban modal */}
      {modal === "unban" && selectedUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass rounded-3xl p-6 w-full max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <p className="text-white font-semibold">Unban User</p>
              <button onClick={close} className="w-8 h-8 glass rounded-xl flex items-center justify-center hover:glass-orange transition-all">
                <X className="w-4 h-4 text-forest-200" />
              </button>
            </div>
            <div className="glass rounded-xl p-3 mb-4 glass-green">
              <p className="text-forest-100 text-sm">
                <strong>{selectedUser.name}</strong> will have their account restored.
              </p>
              {selectedUser.banReason && <p className="text-forest-200/50 text-xs mt-1">Ban reason: {selectedUser.banReason}</p>}
            </div>
            <div className="flex gap-2">
              <button onClick={close} className="flex-1 glass hover:glass-orange transition-all text-forest-200 text-sm font-medium py-2.5 rounded-xl">
                Cancel
              </button>
              <button onClick={handleUnban}
                className="flex-1 btn-glow-green text-white text-sm font-semibold py-2.5 rounded-xl flex items-center justify-center gap-1.5">
                <Check className="w-4 h-4" /> Confirm Unban
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
