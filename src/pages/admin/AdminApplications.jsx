import { useState, useEffect } from "react";
import { useNotification } from "../../context/NotificationContext";
import { adminRequest as request } from "../../context/AdminContext";
import { FileText, Store, Bike, Check, X, Eye, Filter, Clock, ZoomIn, ChevronLeft, ChevronRight } from "lucide-react";

const STATUS_CLS = {
  pending:  "glass-orange text-ember-200",
  approved: "glass-green text-forest-200",
  rejected: "bg-red-500/20 text-red-300 border border-red-500/30",
};

function parseNotes(notes) {
  if (!notes) return null;
  try { return JSON.parse(notes); } catch { return null; }
}

function Field({ label, value }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-forest-200/40 text-xs">{label}</p>
      <p className="text-white text-xs font-medium break-words">{value}</p>
    </div>
  );
}

export default function AdminApplications() {
  const { addNotification } = useNotification();
  const [apps, setApps]           = useState([]);
  const [loading, setLoading]     = useState(true);
  const [tab, setTab]             = useState("all");
  const [selected, setSelected]   = useState(null);
  const [rejectReason, setReason] = useState("");
  const [rejecting, setRejecting] = useState(false);
  const [adminNote, setAdminNote] = useState("");
  const [imgViewer, setImgViewer] = useState(null); // { images: [], index: 0, label: '' }

  const load = async () => {
    try {
      setLoading(true);
      const data = await request('/upgrades');
      setApps(Array.isArray(data) ? data : []);
    } catch {
      addNotification("Failed to load upgrade requests", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const stats = {
    total:    apps.length,
    pending:  apps.filter(a => a.status === "pending").length,
    approved: apps.filter(a => a.status === "approved").length,
    rejected: apps.filter(a => a.status === "rejected").length,
  };

  const filtered = apps.filter(a => {
    if (tab === "all")        return true;
    if (tab === "restaurant") return a.plan?.toLowerCase().includes("restaurant");
    if (tab === "rider")      return a.plan?.toLowerCase().includes("rider");
    return a.status === tab;
  });

  const openDetail = (app) => {
    setSelected(app);
    setRejecting(false);
    setReason("");
    setAdminNote("");
  };

  const approve = async (id) => {
    try {
      await request(`/upgrades/${id}/approve`, {
        method: 'PATCH',
        body: JSON.stringify({ admin_note: adminNote || null }),
      });
      addNotification("Application approved — user role upgraded", "success");
      setSelected(null);
      load();
    } catch (err) {
      addNotification(err?.data?.error || "Failed to approve", "error");
    }
  };

  const reject = async (id) => {
    if (!rejectReason.trim()) { addNotification("Enter a rejection reason", "error"); return; }
    try {
      await request(`/upgrades/${id}/reject`, {
        method: 'PATCH',
        body: JSON.stringify({ admin_note: rejectReason }),
      });
      addNotification("Application rejected", "success");
      setSelected(null);
      load();
    } catch (err) {
      addNotification(err?.data?.error || "Failed to reject", "error");
    }
  };

  const TABS = [
    { key: "all",        label: `All (${stats.total})` },
    { key: "pending",    label: `Pending (${stats.pending})` },
    { key: "approved",   label: `Approved (${stats.approved})` },
    { key: "rejected",   label: `Rejected (${stats.rejected})` },
    { key: "restaurant", label: "Restaurants" },
    { key: "rider",      label: "Riders" },
  ];

  return (
    <div className="space-y-5 pb-6 animate-fade-up">
      <div>
        <p className="text-forest-200/50 text-sm">Management</p>
        <h1 className="text-2xl font-heading font-bold text-white">Upgrade Applications</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total",    value: stats.total,    icon: FileText, color: "btn-glow-green" },
          { label: "Pending",  value: stats.pending,  icon: Clock,    color: "glass-orange" },
          { label: "Approved", value: stats.approved, icon: Check,    color: "glass-green" },
          { label: "Rejected", value: stats.rejected, icon: X,        color: "bg-red-500/30" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="glass card-3d rounded-2xl p-4">
            <div className={`w-9 h-9 ${color} rounded-xl flex items-center justify-center mb-2`}>
              <Icon className="w-4 h-4 text-white" />
            </div>
            <p className="text-white font-heading font-bold text-xl">{value}</p>
            <p className="text-forest-200/50 text-xs mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="glass rounded-2xl p-2 flex flex-wrap gap-1.5 items-center">
        <Filter className="w-4 h-4 text-forest-200/40 ml-1.5 flex-shrink-0" />
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all
              ${tab === t.key ? "btn-glow-green text-white" : "text-forest-200/60 hover:text-forest-100 hover:glass"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="glass rounded-2xl h-24 animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass rounded-2xl py-14 flex flex-col items-center gap-3">
          <FileText className="w-10 h-10 text-forest-300/30" />
          <p className="text-forest-200/50 text-sm">No applications found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(app => {
            const notes = parseNotes(app.notes);
            const isRestaurant = notes?.role === 'restaurant_owner' || app.plan?.toLowerCase().includes('restaurant');
            return (
              <div key={app.id} className="glass rounded-2xl p-4 hover:glass-green transition-all">
                <div className="flex items-start gap-3">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${isRestaurant ? "btn-glow-orange" : "btn-glow-teal"}`}>
                    {isRestaurant ? <Store className="w-5 h-5 text-white" /> : <Bike className="w-5 h-5 text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${STATUS_CLS[app.status] || STATUS_CLS.pending}`}>
                            {app.status?.charAt(0).toUpperCase() + app.status?.slice(1)}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${isRestaurant ? "glass-orange text-ember-200" : "glass text-forest-200/70"}`}>
                            {isRestaurant ? "Restaurant Owner" : "Rider"}
                          </span>
                        </div>
                        <p className="text-white font-semibold text-sm">{app.user_name}</p>
                        <p className="text-forest-200/50 text-xs">{app.user_email}</p>
                        <p className="text-forest-200/60 text-xs mt-0.5">{app.plan}</p>
                        {notes?.restaurantName && <p className="text-ember-300/70 text-xs mt-0.5">{notes.restaurantName}</p>}
                        {notes?.fullName && <p className="text-forest-200/60 text-xs mt-0.5">{notes.fullName} · {notes.vehicleType}</p>}
                        {app.admin_note && app.status === 'rejected' && <p className="text-red-400/70 text-xs mt-1">Reason: {app.admin_note}</p>}
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button onClick={() => openDetail(app)}
                          className="w-8 h-8 glass hover:glass-green rounded-xl flex items-center justify-center transition-all">
                          <Eye className="w-3.5 h-3.5 text-forest-200" />
                        </button>
                        {app.status === "pending" && (
                          <>
                            <button onClick={() => { openDetail(app); }}
                              className="px-3 h-8 btn-glow-green rounded-xl text-white text-xs font-semibold flex items-center gap-1">
                              <Check className="w-3 h-3" /> Review
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                    <p className="text-forest-200/40 text-xs mt-1.5 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {new Date(app.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail / Review Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="glass rounded-3xl p-6 w-full max-w-lg my-4 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-semibold">Upgrade Request</p>
                <p className="text-forest-200/50 text-xs">#{selected.id}</p>
              </div>
              <button onClick={() => setSelected(null)} className="w-8 h-8 glass rounded-xl flex items-center justify-center hover:glass-orange transition-all">
                <X className="w-4 h-4 text-forest-200" />
              </button>
            </div>

            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${STATUS_CLS[selected.status] || STATUS_CLS.pending}`}>
              {selected.status === "approved" ? <Check className="w-3 h-3" /> : selected.status === "rejected" ? <X className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
              {selected.status?.charAt(0).toUpperCase() + selected.status?.slice(1)}
            </span>

            {/* Applicant */}
            <div className="glass rounded-2xl p-4">
              <p className="text-forest-200/50 text-[10px] font-semibold uppercase tracking-wide mb-2">Applicant</p>
              <div className="grid grid-cols-2 gap-2">
                <Field label="Name"     value={selected.user_name} />
                <Field label="Email"    value={selected.user_email} />
                <Field label="Plan"      value={selected.plan} />
                <Field label="Submitted" value={new Date(selected.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })} />
              </div>
            </div>

            {/* Requirements from notes */}
            {(() => {
              const notes = parseNotes(selected.notes);
              if (!notes) return null;
              const isResto = notes.role === 'restaurant_owner';
              return (
                <div className="glass rounded-2xl p-4">
                  <p className="text-forest-200/50 text-[10px] font-semibold uppercase tracking-wide mb-2">
                    {isResto ? 'Restaurant Details' : 'Rider Details'}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {isResto ? (
                      <>
                        <Field label="Restaurant Name"   value={notes.restaurantName} />
                        <Field label="Category"          value={notes.category} />
                        <Field label="Address"           value={notes.address} />
                        <Field label="City"              value={notes.city} />
                        <Field label="Contact"           value={notes.phone} />
                      </>
                    ) : (
                      <>
                        <Field label="Full Name"    value={notes.fullName} />
                        <Field label="Address"      value={notes.address} />
                        <Field label="ID Type"      value={notes.idType} />
                        <Field label="Vehicle Type" value={notes.vehicleType} />
                        <Field label="Plate Number" value={notes.plateNumber} />
                      </>
                    )}
                  </div>

                  {/* Uploaded photos */}
                  {(() => {
                    const imgs = isResto
                      ? [notes.logo && { src: notes.logo, label: 'Restaurant Photo' }, notes.permit && { src: notes.permit, label: 'Business Permit' }].filter(Boolean)
                      : [notes.idPhoto && { src: notes.idPhoto, label: 'ID Photo' }, notes.selfie && { src: notes.selfie, label: 'Selfie with ID' }].filter(Boolean);
                    if (!imgs.length) return null;
                    return (
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        {imgs.map((img, i) => (
                          <div key={img.label}>
                            <p className="text-forest-200/40 text-xs mb-1">{img.label}</p>
                            <button onClick={() => setImgViewer({ images: imgs, index: i })}
                              className="relative w-full group rounded-xl overflow-hidden">
                              <img src={img.src} alt={img.label} className="w-full h-24 object-cover rounded-xl" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl">
                                <ZoomIn className="w-6 h-6 text-white" />
                              </div>
                            </button>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              );
            })()}

            {/* Proof of payment */}
            {selected.proof_image && (
              <div className="glass rounded-2xl p-4">
                <p className="text-forest-200/50 text-[10px] font-semibold uppercase tracking-wide mb-2">Proof of Payment</p>
                <img src={selected.proof_image} alt="proof" className="w-full max-h-48 object-contain rounded-xl" />
              </div>
            )}

            {/* Existing admin note */}
            {selected.admin_note && (
              <div className={`rounded-xl px-4 py-3 ${selected.status === 'rejected' ? 'bg-red-500/10' : 'glass-green'}`}>
                <p className="text-forest-200/60 text-xs font-semibold mb-1">Admin Note</p>
                <p className="text-white text-sm">{selected.admin_note}</p>
              </div>
            )}

            {/* Actions for pending */}
            {selected.status === "pending" && (
              <div className="space-y-3">
                {!rejecting ? (
                  <>
                    <div>
                      <label className="block text-forest-200/60 text-xs font-medium mb-1">Admin note (optional)</label>
                      <input value={adminNote} onChange={e => setAdminNote(e.target.value)}
                        placeholder="e.g. Verified, documents look good"
                        className="w-full input-glass px-3 py-2 text-sm" />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setRejecting(true)}
                        className="flex-1 glass hover:bg-red-500/30 transition-all text-red-400 text-sm font-semibold py-2.5 rounded-xl">
                        Reject
                      </button>
                      <button onClick={() => approve(selected.id)}
                        className="flex-1 btn-glow-green text-white text-sm font-semibold py-2.5 rounded-xl flex items-center justify-center gap-1.5">
                        <Check className="w-4 h-4" /> Approve
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-forest-200/60 text-xs font-medium mb-1">Reason for rejection <span className="text-red-400">*</span></label>
                      <textarea value={rejectReason} onChange={e => setReason(e.target.value)} rows={3}
                        className="w-full input-glass py-2.5 text-sm resize-none"
                        placeholder="e.g. Documents are unclear, please resubmit with better photos" />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setRejecting(false)}
                        className="flex-1 glass hover:glass-green transition-all text-forest-200 text-sm font-medium py-2.5 rounded-xl">
                        Cancel
                      </button>
                      <button onClick={() => reject(selected.id)} disabled={!rejectReason.trim()}
                        className="flex-1 bg-red-500/80 hover:bg-red-500 disabled:opacity-40 text-white text-sm font-semibold py-2.5 rounded-xl transition-all">
                        Confirm Reject
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Image lightbox */}
      {imgViewer && (
        <div className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4"
          onClick={() => setImgViewer(null)}>
          <button onClick={() => setImgViewer(null)}
            className="absolute top-4 right-4 w-10 h-10 glass rounded-xl flex items-center justify-center hover:glass-orange transition-all z-10">
            <X className="w-5 h-5 text-white" />
          </button>

          {imgViewer.images.length > 1 && (
            <>
              <button onClick={e => { e.stopPropagation(); setImgViewer(v => ({ ...v, index: (v.index - 1 + v.images.length) % v.images.length })); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 glass rounded-xl flex items-center justify-center hover:glass-green transition-all z-10">
                <ChevronLeft className="w-5 h-5 text-white" />
              </button>
              <button onClick={e => { e.stopPropagation(); setImgViewer(v => ({ ...v, index: (v.index + 1) % v.images.length })); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 glass rounded-xl flex items-center justify-center hover:glass-green transition-all z-10">
                <ChevronRight className="w-5 h-5 text-white" />
              </button>
            </>
          )}

          <div className="flex flex-col items-center gap-3 max-w-2xl w-full" onClick={e => e.stopPropagation()}>
            <img src={imgViewer.images[imgViewer.index].src} alt={imgViewer.images[imgViewer.index].label}
              className="max-h-[75vh] max-w-full object-contain rounded-2xl shadow-2xl" />
            <div className="flex items-center gap-3">
              <p className="text-white/80 text-sm font-medium">{imgViewer.images[imgViewer.index].label}</p>
              {imgViewer.images.length > 1 && (
                <p className="text-white/40 text-xs">{imgViewer.index + 1} / {imgViewer.images.length}</p>
              )}
            </div>
            {imgViewer.images.length > 1 && (
              <div className="flex gap-2">
                {imgViewer.images.map((img, i) => (
                  <button key={i} onClick={() => setImgViewer(v => ({ ...v, index: i }))}
                    className={`w-2 h-2 rounded-full transition-all ${i === imgViewer.index ? 'bg-white' : 'bg-white/30'}`} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
