import { useState, useEffect } from "react";
import { useNotification } from "../../context/NotificationContext";
import { adminApi } from "../../context/AdminContext";
import { AlertTriangle, DollarSign, Store, Bike, Package, Clock, CheckCircle, X, Check, CreditCard, UtensilsCrossed } from "lucide-react";

const PRIORITY_CLS = {
  high:"bg-red-500/20 text-red-300 border border-red-500/30",
  medium:"glass-orange text-ember-200",
  low:"glass-green text-forest-200",
};

const TYPE_ICON = {
  refund:  DollarSign,
  quality: UtensilsCrossed,
  payment: CreditCard,
  payout:  CreditCard,
  report:  Package,
  rider:   Bike,
  missing: Package,
};

const normalizeIssue = (issue) => ({
  ...issue,
  id: `issue-${issue.id}`,
  backendId: issue.id,
  source: 'issue',
  orderId: issue.orderId || issue.order_id,
  customerName: issue.customerName || issue.customer_name,
  restaurantName: issue.restaurantName || issue.restaurant_name,
  orderAmount: issue.orderAmount || issue.order_total,
  requestedRefund: issue.requestedRefund || issue.refund_requested,
  refundAmount: issue.refundAmount || issue.refund_approved,
  refundNotes: issue.refundNotes || issue.resolution_notes,
  title: issue.title || `${issue.type || 'Issue'} request`,
  createdAt: issue.createdAt || (issue.created_at ? new Date(issue.created_at).toLocaleString() : ''),
});

const normalizeRiderRequest = (request) => ({
  id: `rider-${request.id}`,
  backendId: request.id,
  source: 'riderRequest',
  type: request.request_type,
  priority: 'medium',
  status: request.status,
  title: request.request_type === 'payout' ? 'Rider payout request' : 'Rider report request',
  description: request.details || '',
  requestedRefund: request.amount,
  riderName: request.rider_name,
  riderEmail: request.rider_email,
  riderPhone: request.rider_phone,
  period: request.period,
  refundNotes: request.resolution_notes,
  createdAt: request.created_at ? new Date(request.created_at).toLocaleString() : '',
});

export default function AdminIssues() {
  const { addNotification } = useNotification();
  const [issues, setIssues]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [filterType, setType]     = useState("all");
  const [filterStatus, setStatus] = useState("pending");
  const [selected, setSelected]   = useState(null);
  const [showRefundModal, setRefundModal] = useState(false);
  const [refundAmount, setAmount] = useState("");
  const [refundNotes, setNotes]   = useState("");

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [issuesRes, riderRequestsRes] = await Promise.allSettled([
          adminApi.issues.list({}),
          adminApi.riderRequests.list(),
        ]);
        const issueRows = issuesRes.status === 'fulfilled' ? (issuesRes.value.data || issuesRes.value || []) : [];
        const riderRows = riderRequestsRes.status === 'fulfilled' ? (riderRequestsRes.value.data || riderRequestsRes.value || []) : [];
        setIssues([
          ...riderRows.map(normalizeRiderRequest),
          ...issueRows.map(normalizeIssue),
        ]);
      } catch {
        addNotification("Failed to load issues", "error");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = issues.filter(i => {
    const matchType   = filterType   === "all" || i.type   === filterType;
    const matchStatus = filterStatus === "all" || i.status === filterStatus;
    return matchType && matchStatus;
  });

  const openRefund = (issue) => { setSelected(issue); setAmount(issue.requestedRefund?.toString() || ""); setRefundModal(true); };
  const close      = ()      => { setRefundModal(false); setSelected(null); setAmount(""); setNotes(""); };

  const approveRefund = async () => {
    const amt = parseFloat(refundAmount);
    try {
      await adminApi.issues.resolve(selected.backendId, { refundApproved: true, notes: refundNotes });
      setIssues(prev => prev.map(i => i.id === selected.id ? { ...i, status:"resolved", refundAmount:amt, refundNotes } : i));
      addNotification(`Refund of ₱${amt.toFixed(2)} approved for ${selected.customerName}`, "success");
      close();
    } catch {
      addNotification("Failed to approve refund", "error");
    }
  };

  const denyRefund = async () => {
    try {
      await adminApi.issues.deny(selected.backendId, refundNotes);
      setIssues(prev => prev.map(i => i.id === selected.id ? { ...i, status:"denied", refundNotes } : i));
      addNotification("Refund request denied", "success");
      close();
    } catch {
      addNotification("Failed to deny refund", "error");
    }
  };

  const resolve = async (id) => {
    const item = issues.find(i => i.id === id);
    try {
      if (item?.source === 'riderRequest') {
        await adminApi.riderRequests.resolve(item.backendId, { notes: "" });
      } else {
        await adminApi.issues.resolve(item.backendId, { notes: "" });
      }
      setIssues(prev => prev.map(i => i.id === id ? { ...i, status:"resolved" } : i));
      addNotification(item?.source === 'riderRequest' ? "Rider request marked as resolved" : "Issue marked as resolved", "success");
    } catch {
      addNotification("Failed to resolve request", "error");
    }
  };

  const deny = async (id) => {
    const item = issues.find(i => i.id === id);
    try {
      if (item?.source === 'riderRequest') {
        await adminApi.riderRequests.deny(item.backendId, "");
      } else {
        await adminApi.issues.deny(item.backendId, "");
      }
      setIssues(prev => prev.map(i => i.id === id ? { ...i, status:"denied" } : i));
      addNotification("Request denied", "success");
    } catch {
      addNotification("Failed to deny request", "error");
    }
  };

  const TYPES    = ["all","refund","quality","payment","payout","report","rider"];
  const STATUSES = ["all","pending","resolved","denied"];

  return (
    <div className="space-y-5 pb-6 animate-fade-up">

      {/* Header */}
      <div>
        <p className="text-forest-200/50 text-sm">Moderation</p>
        <h1 className="text-2xl font-heading font-bold text-white">Issues</h1>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label:"Total Issues", value:issues.length,                                icon:AlertTriangle, color:"btn-glow-green" },
          { label:"Pending",      value:issues.filter(i=>i.status==="pending").length, icon:Clock,        color:"glass-orange" },
          { label:"Resolved",     value:issues.filter(i=>i.status==="resolved").length,icon:CheckCircle,  color:"glass-green" },
          { label:"Denied",       value:issues.filter(i=>i.status==="denied").length,  icon:X,            color:"bg-red-500/30" },
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
      <div className="glass rounded-2xl p-4 space-y-3">
        <div>
          <p className="text-forest-200/50 text-xs font-semibold uppercase tracking-wide mb-2">Type</p>
          <div className="flex flex-wrap gap-2">
            {TYPES.map(t => (
              <button key={t} onClick={() => setType(t)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all capitalize
                  ${filterType===t ? "btn-glow-green text-white" : "glass text-forest-200/60 hover:text-forest-100"}`}>
                {t === "all" ? "All Types" : t}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-forest-200/50 text-xs font-semibold uppercase tracking-wide mb-2">Status</p>
          <div className="flex flex-wrap gap-2">
            {STATUSES.map(s => (
              <button key={s} onClick={() => setStatus(s)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all capitalize
                  ${filterStatus===s ? "btn-glow-green text-white" : "glass text-forest-200/60 hover:text-forest-100"}`}>
                {s === "all" ? `All Statuses` : `${s} (${issues.filter(i=>i.status===s).length})`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="glass rounded-2xl h-32 animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass rounded-2xl py-14 flex flex-col items-center gap-3">
          <div className="w-14 h-14 glass-green rounded-2xl flex items-center justify-center">
            <CheckCircle className="w-7 h-7 text-forest-300" />
          </div>
          <p className="text-forest-200/50 text-sm">No issues found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(issue => {
            const Icon = TYPE_ICON[issue.type] || AlertTriangle;
            return (
              <div key={issue.id} className="glass rounded-2xl p-4 hover:glass-green transition-all">
                <div className="flex items-start gap-3">
                  {/* Type icon */}
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${issue.priority === "high" ? "bg-red-500/30" : "glass-orange"}`}>
                    <Icon className={`w-5 h-5 ${issue.priority === "high" ? "text-red-300" : "text-ember-300"}`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${PRIORITY_CLS[issue.priority] || "glass text-forest-200/60"}`}>
                        {(issue.priority || "low").toUpperCase()}
                      </span>
                      {issue.status !== "pending" && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${issue.status === "resolved" ? "glass-green text-forest-200" : "bg-red-500/20 text-red-300"}`}>
                          {issue.status.toUpperCase()}
                        </span>
                      )}
                      <span className="text-forest-200/40 text-xs flex items-center gap-1"><Clock className="w-3 h-3" />{issue.createdAt}</span>
                    </div>

                    <p className="text-white font-semibold text-sm">{issue.title}</p>
                    <p className="text-forest-200/50 text-xs mt-0.5">{issue.description}</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2 text-xs">
                      <div>
                        <p className="text-forest-200/40">{issue.source === 'riderRequest' ? 'Requested By' : 'Customer'}</p>
                        <p className="text-forest-100/70">{issue.source === 'riderRequest' ? issue.riderName : issue.customerName}</p>
                        {issue.customerEmail && <p className="text-forest-200/40">{issue.customerEmail}</p>}
                        {issue.riderEmail && <p className="text-forest-200/40">{issue.riderEmail}</p>}
                        {issue.riderPhone && <p className="text-forest-200/40">{issue.riderPhone}</p>}
                      </div>
                      {issue.orderId && (
                        <div>
                          <p className="text-forest-200/40">Order</p>
                          <p className="text-forest-100/70">#{issue.orderId}</p>
                          {issue.orderAmount && <p className="text-forest-200/40">₱{Number(issue.orderAmount).toFixed(2)}</p>}
                        </div>
                      )}
                      {issue.restaurantName && (
                        <div>
                          <p className="text-forest-200/40">Restaurant</p>
                          <p className="text-forest-100/70">{issue.restaurantName}</p>
                        </div>
                      )}
                      {issue.riderName && (
                        <div>
                          <p className="text-forest-200/40">Rider</p>
                          <p className="text-forest-100/70">{issue.riderName}</p>
                        </div>
                      )}
                      {issue.period && (
                        <div>
                          <p className="text-forest-200/40">Period</p>
                          <p className="text-forest-100/70 capitalize">{issue.period}</p>
                        </div>
                      )}
                    </div>

                    {issue.requestedRefund && issue.status === "pending" && (
                      <div className="glass-orange rounded-xl px-3 py-2 mt-2">
                        <p className="text-ember-200 text-xs font-semibold">
                          {issue.source === 'riderRequest' ? 'Amount Requested' : 'Refund Requested'}: ₱{Number(issue.requestedRefund).toFixed(2)}
                        </p>
                      </div>
                    )}
                    {issue.refundAmount && (
                      <div className="glass-green rounded-xl px-3 py-2 mt-2">
                        <p className="text-forest-200 text-xs font-semibold">Refund Approved: ₱{Number(issue.refundAmount).toFixed(2)}</p>
                        {issue.refundNotes && <p className="text-forest-200/50 text-xs mt-0.5">Note: {issue.refundNotes}</p>}
                      </div>
                    )}

                    {issue.status === "pending" && (
                      <div className="flex gap-2 flex-wrap mt-3">
                        {["refund","quality","payment"].includes(issue.type) && (
                          <button onClick={() => openRefund(issue)}
                            className="btn-glow-green text-white text-xs font-semibold px-3 py-1.5 rounded-xl">
                            Process Refund
                          </button>
                        )}
                        <button onClick={() => resolve(issue.id)}
                          className="glass hover:glass-green transition-all text-forest-200 text-xs font-medium px-3 py-1.5 rounded-xl">
                          Mark Resolved
                        </button>
                        {issue.source === 'riderRequest' && (
                          <button onClick={() => deny(issue.id)}
                            className="glass text-red-300 text-xs font-medium px-3 py-1.5 rounded-xl hover:glass transition-all">
                            Deny
                          </button>
                        )}
                        <button className="glass text-forest-200/60 text-xs font-medium px-3 py-1.5 rounded-xl hover:glass transition-all">
                          Contact {issue.source === 'riderRequest' ? 'Rider' : 'Customer'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Refund Modal */}
      {showRefundModal && selected && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="glass rounded-3xl p-6 w-full max-w-sm my-4">
            <div className="flex items-center justify-between mb-4">
              <p className="text-white font-semibold">Process Refund</p>
              <button onClick={close} className="w-8 h-8 glass rounded-xl flex items-center justify-center hover:glass-orange transition-all">
                <X className="w-4 h-4 text-forest-200" />
              </button>
            </div>

            <div className="glass rounded-xl p-3 mb-4">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><p className="text-forest-200/40">Customer</p><p className="text-white font-medium">{selected.customerName}</p></div>
                <div><p className="text-forest-200/40">Order</p><p className="text-white font-medium">#{selected.orderId}</p></div>
                <div><p className="text-forest-200/40">Order Amount</p><p className="text-white font-medium">₱{Number(selected.orderAmount || 0).toFixed(2)}</p></div>
                <div><p className="text-forest-200/40">Requested</p><p className="text-ember-400 font-medium">₱{Number(selected.requestedRefund || 0).toFixed(2)}</p></div>
              </div>
            </div>

            <div className="glass rounded-xl p-3 mb-4">
              <p className="text-forest-200/40 text-xs mb-1">Issue</p>
              <p className="text-forest-100/70 text-xs">{selected.description}</p>
            </div>

            <div className="mb-3">
              <label className="block text-forest-200/60 text-xs font-medium mb-1">Refund Amount (₱) *</label>
              <input type="number" step="0.01" value={refundAmount} onChange={e => setAmount(e.target.value)}
                className="w-full input-glass py-2.5 text-sm" placeholder="0.00" />
              <div className="flex gap-1.5 mt-2 flex-wrap">
                {[
                  { label:"Requested", val:selected.requestedRefund?.toString() },
                  { label:"Full",      val:selected.orderAmount?.toString() },
                  { label:"50%",       val:(selected.orderAmount/2)?.toFixed(2) },
                ].map(({ label, val }) => (
                  <button key={label} onClick={() => setAmount(val || "")}
                    className="glass text-forest-200/70 text-xs px-2.5 py-1 rounded-lg hover:glass-green transition-all">{label}</button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-forest-200/60 text-xs font-medium mb-1">Admin Notes</label>
              <textarea value={refundNotes} onChange={e => setNotes(e.target.value)} rows={2}
                className="w-full input-glass py-2.5 text-sm resize-none"
                placeholder="Notes about this decision..." />
            </div>

            <div className="flex gap-2">
              <button onClick={close} className="flex-1 glass hover:glass-green transition-all text-forest-200 text-xs font-medium py-2.5 rounded-xl">Cancel</button>
              <button onClick={denyRefund}
                className="flex-1 bg-red-500/80 hover:bg-red-500 text-white text-xs font-semibold py-2.5 rounded-xl transition-all">
                Deny
              </button>
              <button onClick={approveRefund} disabled={!refundAmount || parseFloat(refundAmount) <= 0}
                className="flex-1 btn-glow-green text-white text-xs font-semibold py-2.5 rounded-xl disabled:opacity-40 flex items-center justify-center gap-1">
                <Check className="w-3.5 h-3.5" /> Approve
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
