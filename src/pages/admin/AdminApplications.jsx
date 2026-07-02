import { useState } from "react";
import { useNotification } from "../../context/NotificationContext";
import { FileText, Store, Bike, Check, X, Eye, Download, Filter, Clock } from "lucide-react";

const INIT_APPS = [
  {
    id:"APP001", type:"restaurant", applicantName:"Juan dela Cruz", email:"juan@restaurant.com", phone:"+63 912 345 6789",
    restaurantName:"Juan's Filipino Kitchen", businessAddress:"123 Main St, Manila", cuisine:"Filipino",
    status:"pending", submittedDate:"2025-01-20",
    documents:{ bir:"bir_certificate.pdf", businessPermit:"business_permit.pdf", foodSafety:"food_safety.pdf" }
  },
  {
    id:"APP002", type:"rider", applicantName:"Maria Santos", email:"maria@email.com", phone:"+63 923 456 7890",
    vehicleType:"Motorcycle", vehiclePlate:"ABC 1234",
    status:"pending", submittedDate:"2025-01-21",
    documents:{ driverLicense:"license.pdf", vehicleRegistration:"or_cr.pdf", nbiClearance:"nbi.pdf", validId:"id.pdf" }
  },
  {
    id:"APP003", type:"restaurant", applicantName:"Pedro Garcia", email:"pedro@burgerhouse.com", phone:"+63 934 567 8901",
    restaurantName:"Pedro's Burger House", businessAddress:"456 Food St, Quezon City", cuisine:"American",
    status:"approved", submittedDate:"2025-01-18", approvedDate:"2025-01-20",
    documents:{ bir:"bir_certificate.pdf", businessPermit:"business_permit.pdf" }
  },
  {
    id:"APP004", type:"rider", applicantName:"Jose Reyes", email:"jose@email.com", phone:"+63 945 678 9012",
    vehicleType:"Motorcycle", vehiclePlate:"XYZ 5678",
    status:"rejected", submittedDate:"2025-01-19", rejectedDate:"2025-01-21",
    rejectionReason:"Invalid driver's license - expired",
    documents:{ driverLicense:"license.pdf", vehicleRegistration:"or_cr.pdf" }
  },
];

const STATUS_CLS = {
  pending:"glass-orange text-ember-200",
  approved:"glass-green text-forest-200",
  rejected:"bg-red-500/20 text-red-300 border border-red-500/30",
};

export default function AdminApplications() {
  const { showSuccess } = useNotification();
  const [apps, setApps]         = useState(INIT_APPS);
  const [tab, setTab]           = useState("all");
  const [selected, setSelected] = useState(null);
  const [showModal, setModal]   = useState(false);
  const [rejectReason, setReason] = useState("");
  const [rejectId, setRejectId]   = useState(null);

  const stats = {
    total:    apps.length,
    pending:  apps.filter(a => a.status === "pending").length,
    approved: apps.filter(a => a.status === "approved").length,
    rejected: apps.filter(a => a.status === "rejected").length,
  };

  const filtered = apps.filter(a => {
    if (tab === "all")        return true;
    if (tab === "restaurant") return a.type === "restaurant";
    if (tab === "rider")      return a.type === "rider";
    return a.status === tab;
  });

  const viewDetails = (app) => { setSelected(app); setModal(true); };
  const closeModal  = ()    => { setModal(false); setSelected(null); setRejectId(null); setReason(""); };

  const approve = (id) => {
    setApps(prev => prev.map(a => a.id === id ? { ...a, status:"approved", approvedDate:new Date().toISOString().split("T")[0] } : a));
    showSuccess("Application approved");
    closeModal();
  };

  const reject = (id) => {
    if (!rejectId) { setRejectId(id); return; }
    if (!rejectReason.trim()) return;
    setApps(prev => prev.map(a => a.id === id ? { ...a, status:"rejected", rejectedDate:new Date().toISOString().split("T")[0], rejectionReason:rejectReason } : a));
    showSuccess("Application rejected");
    closeModal();
  };

  const TABS = [
    { key:"all",        label:`All (${stats.total})` },
    { key:"pending",    label:`Pending (${stats.pending})` },
    { key:"approved",   label:`Approved (${stats.approved})` },
    { key:"rejected",   label:`Rejected (${stats.rejected})` },
    { key:"restaurant", label:"Restaurants" },
    { key:"rider",      label:"Riders" },
  ];

  return (
    <div className="space-y-5 pb-6 animate-fade-up">

      {/* Header */}
      <div>
        <p className="text-forest-200/50 text-sm">Management</p>
        <h1 className="text-2xl font-heading font-bold text-white">Applications</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label:"Total",    value:stats.total,    icon:FileText, color:"btn-glow-green" },
          { label:"Pending",  value:stats.pending,  icon:Clock,    color:"glass-orange" },
          { label:"Approved", value:stats.approved, icon:Check,    color:"glass-green" },
          { label:"Rejected", value:stats.rejected, icon:X,        color:"bg-red-500/30" },
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

      {/* Tabs */}
      <div className="glass rounded-2xl p-2 flex flex-wrap gap-1.5 items-center">
        <Filter className="w-4 h-4 text-forest-200/40 ml-1.5 flex-shrink-0" />
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all
              ${tab===t.key ? "btn-glow-green text-white" : "text-forest-200/60 hover:text-forest-100 hover:glass"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Applications list */}
      {filtered.length === 0 ? (
        <div className="glass rounded-2xl py-14 flex flex-col items-center gap-3">
          <FileText className="w-10 h-10 text-forest-300/30" />
          <p className="text-forest-200/50 text-sm">No applications found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(app => (
            <div key={app.id} className="glass rounded-2xl p-4 hover:glass-green transition-all">
              <div className="flex items-start gap-3">
                {/* Type icon */}
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${app.type === "restaurant" ? "btn-glow-orange" : "btn-glow-green"}`}>
                  {app.type === "restaurant" ? <Store className="w-5 h-5 text-white" /> : <Bike className="w-5 h-5 text-white" />}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <span className="text-white font-mono text-xs font-semibold">{app.id}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${STATUS_CLS[app.status]}`}>
                          {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${app.type === "restaurant" ? "glass-orange text-ember-200" : "glass text-forest-200/70"}`}>
                          {app.type === "restaurant" ? "Restaurant" : "Rider"}
                        </span>
                      </div>
                      <p className="text-white font-semibold text-sm">{app.applicantName}</p>
                      <p className="text-forest-200/50 text-xs">{app.email}</p>
                      {app.type === "restaurant" && <p className="text-forest-200/60 text-xs mt-0.5">{app.restaurantName} · {app.cuisine}</p>}
                      {app.type === "rider"      && <p className="text-forest-200/60 text-xs mt-0.5">{app.vehicleType} · {app.vehiclePlate}</p>}
                      {app.rejectionReason && <p className="text-red-400/70 text-xs mt-1">Rejected: {app.rejectionReason}</p>}
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button onClick={() => viewDetails(app)}
                        className="w-8 h-8 glass hover:glass-green rounded-xl flex items-center justify-center transition-all">
                        <Eye className="w-3.5 h-3.5 text-forest-200" />
                      </button>
                      {app.status === "pending" && (
                        <>
                          <button onClick={() => approve(app.id)}
                            className="w-8 h-8 glass hover:btn-glow-green rounded-xl flex items-center justify-center transition-all">
                            <Check className="w-3.5 h-3.5 text-forest-400 hover:text-white" />
                          </button>
                          <button onClick={() => { setSelected(app); setRejectId(app.id); setModal(true); }}
                            className="w-8 h-8 glass hover:bg-red-500/30 rounded-xl flex items-center justify-center transition-all">
                            <X className="w-3.5 h-3.5 text-red-400" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  <p className="text-forest-200/40 text-xs mt-1.5 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Submitted {new Date(app.submittedDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Details Modal */}
      {showModal && selected && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="glass rounded-3xl p-6 w-full max-w-lg my-4">
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-white font-semibold">Application Details</p>
                <p className="text-forest-200/50 text-xs font-mono">{selected.id}</p>
              </div>
              <button onClick={closeModal} className="w-8 h-8 glass rounded-xl flex items-center justify-center hover:glass-orange transition-all">
                <X className="w-4 h-4 text-forest-200" />
              </button>
            </div>

            {/* Status */}
            <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold mb-4 ${STATUS_CLS[selected.status]}`}>
              {selected.status === "approved" ? <Check className="w-3 h-3" /> : selected.status === "rejected" ? <X className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
              {selected.status.charAt(0).toUpperCase() + selected.status.slice(1)}
            </span>

            {/* Applicant info */}
            <div className="glass rounded-2xl p-4 mb-3">
              <p className="text-forest-200/50 text-xs font-semibold uppercase tracking-wide mb-2">Applicant</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {[
                  ["Name",      selected.applicantName],
                  ["Email",     selected.email],
                  ["Phone",     selected.phone],
                  ["Submitted", new Date(selected.submittedDate).toLocaleDateString()],
                ].map(([label, value]) => (
                  <div key={label}>
                    <p className="text-forest-200/40 text-xs">{label}</p>
                    <p className="text-white text-xs font-medium">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Type-specific details */}
            <div className="glass rounded-2xl p-4 mb-3">
              <p className="text-forest-200/50 text-xs font-semibold uppercase tracking-wide mb-2">
                {selected.type === "restaurant" ? "Restaurant Details" : "Rider Details"}
              </p>
              {selected.type === "restaurant" ? (
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><p className="text-forest-200/40 text-xs">Restaurant</p><p className="text-white text-xs font-medium">{selected.restaurantName}</p></div>
                  <div><p className="text-forest-200/40 text-xs">Cuisine</p><p className="text-white text-xs font-medium">{selected.cuisine}</p></div>
                  <div className="col-span-2"><p className="text-forest-200/40 text-xs">Address</p><p className="text-white text-xs font-medium">{selected.businessAddress}</p></div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><p className="text-forest-200/40 text-xs">Vehicle</p><p className="text-white text-xs font-medium">{selected.vehicleType}</p></div>
                  <div><p className="text-forest-200/40 text-xs">Plate</p><p className="text-white text-xs font-medium">{selected.vehiclePlate}</p></div>
                </div>
              )}
            </div>

            {/* Documents */}
            <div className="mb-4">
              <p className="text-forest-200/50 text-xs font-semibold uppercase tracking-wide mb-2">Documents</p>
              <div className="space-y-1.5">
                {Object.entries(selected.documents).map(([key, value]) => (
                  <div key={key} className="glass rounded-xl p-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-forest-300/50 flex-shrink-0" />
                      <div>
                        <p className="text-white text-xs font-medium">{key.replace(/([A-Z])/g, " $1").replace(/^./, s => s.toUpperCase())}</p>
                        <p className="text-forest-200/40 text-xs">{Array.isArray(value) ? `${value.length} file(s)` : value}</p>
                      </div>
                    </div>
                    <button className="w-7 h-7 glass hover:glass-green rounded-lg flex items-center justify-center transition-all">
                      <Download className="w-3.5 h-3.5 text-forest-200" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Rejection reason */}
            {selected.status === "rejected" && selected.rejectionReason && (
              <div className="glass rounded-xl p-3 mb-4 bg-red-500/10">
                <p className="text-red-300/70 text-xs font-semibold mb-1">Rejection Reason</p>
                <p className="text-red-300 text-sm">{selected.rejectionReason}</p>
              </div>
            )}

            {/* Reject reason input */}
            {rejectId === selected.id && (
              <div className="mb-4">
                <label className="block text-forest-200/60 text-xs font-medium mb-1">Reason for Rejection *</label>
                <textarea value={rejectReason} onChange={e => setReason(e.target.value)} rows={2}
                  className="w-full input-glass py-2.5 text-sm resize-none"
                  placeholder="Please state the reason for rejection..." />
              </div>
            )}

            {/* Actions */}
            {selected.status === "pending" && (
              <div className="flex gap-2">
                {rejectId === selected.id ? (
                  <>
                    <button onClick={() => { setRejectId(null); setReason(""); }}
                      className="flex-1 glass hover:glass-green transition-all text-forest-200 text-sm font-medium py-2.5 rounded-xl">
                      Cancel
                    </button>
                    <button onClick={() => reject(selected.id)} disabled={!rejectReason.trim()}
                      className="flex-1 bg-red-500/80 hover:bg-red-500 disabled:opacity-40 text-white text-sm font-semibold py-2.5 rounded-xl transition-all">
                      Confirm Reject
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={() => { setRejectId(selected.id); }}
                      className="flex-1 glass hover:bg-red-500/30 transition-all text-red-400 text-sm font-semibold py-2.5 rounded-xl">
                      Reject
                    </button>
                    <button onClick={() => approve(selected.id)}
                      className="flex-1 btn-glow-green text-white text-sm font-semibold py-2.5 rounded-xl flex items-center justify-center gap-1.5">
                      <Check className="w-4 h-4" /> Approve
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
