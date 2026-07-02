import { useState } from "react";
import { useNotification } from "../../context/NotificationContext";
import { AlertTriangle, DollarSign, Store, Bike, Package, Clock, CheckCircle, X, Check, CreditCard, UtensilsCrossed } from "lucide-react";

const INIT_ISSUES = [
  {
    id:1, type:"refund",   orderId:"12340", customerName:"John Doe",    customerEmail:"john@example.com",
    title:"Food never arrived",   description:"Rider marked as delivered but I never received my order",
    orderAmount:40.76, requestedRefund:40.76, priority:"high", status:"pending", createdAt:"30 min ago",
  },
  {
    id:2, type:"quality",  orderId:"12338", restaurantName:"Pizza Palace", restaurantId:"1", customerName:"Jane Smith",
    title:"Food quality complaint", description:"Pizza arrived cold and soggy. Multiple items missing from order.",
    orderAmount:52.30, requestedRefund:25.00, priority:"high", status:"pending", createdAt:"2 hours ago",
  },
  {
    id:3, type:"payment",  orderId:"12335", customerName:"Mike Johnson",
    title:"Double charge",  description:"Was charged twice for the same order",
    orderAmount:28.99, requestedRefund:28.99, priority:"high", status:"pending", createdAt:"5 hours ago",
  },
  {
    id:4, type:"rider",    orderId:"12333", riderName:"Tom Wilson", riderId:"23", customerName:"Sarah Brown",
    title:"Unprofessional behavior", description:"Rider was rude and aggressive when delivering",
    priority:"medium", status:"pending", createdAt:"1 day ago",
  },
];

const PRIORITY_CLS = {
  high:"bg-red-500/20 text-red-300 border border-red-500/30",
  medium:"glass-orange text-ember-200",
  low:"glass-green text-forest-200",
};

const TYPE_ICON = {
  refund:  DollarSign,
  quality: UtensilsCrossed,
  payment: CreditCard,
  rider:   Bike,
  missing: Package,
};

export default function AdminIssues() {
  const { showSuccess } = useNotification();
  const [issues, setIssues]       = useState(INIT_ISSUES);
  const [filterType, setType]     = useState("all");
  const [filterStatus, setStatus] = useState("pending");
  const [selected, setSelected]   = useState(null);
  const [showRefundModal, setRefundModal] = useState(false);
  const [refundAmount, setAmount] = useState("");
  const [refundNotes, setNotes]   = useState("");

  const filtered = issues.filter(i => {
    const matchType   = filterType   === "all" || i.type   === filterType;
    const matchStatus = filterStatus === "all" || i.status === filterStatus;
    return matchType && matchStatus;
  });

  const openRefund = (issue) => { setSelected(issue); setAmount(issue.requestedRefund?.toString() || ""); setRefundModal(true); };
  const close      = ()      => { setRefundModal(false); setSelected(null); setAmount(""); setNotes(""); };

  const approveRefund = () => {
    const amt = parseFloat(refundAmount);
    setIssues(prev => prev.map(i => i.id === selected.id ? { ...i, status:"resolved", refundAmount:amt, refundNotes:refundNotes } : i));
    showSuccess(`Refund of $${amt.toFixed(2)} approved for ${selected.customerName}`);
    close();
  };

  const denyRefund = () => {
    setIssues(prev => prev.map(i => i.id === selected.id ? { ...i, status:"denied", refundNotes } : i));
    showSuccess("Refund request denied");
    close();
  };

  const resolve = (id) => {
    setIssues(prev => prev.map(i => i.id === id ? { ...i, status:"resolved" } : i));
    showSuccess("Issue marked as resolved");
  };

  const TYPES    = ["all","refund","quality","payment","rider"];
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

      {/* Issues list */}
      {filtered.length === 0 ? (
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
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${PRIORITY_CLS[issue.priority]}`}>
                        {issue.priority.toUpperCase()}
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
                        <p className="text-forest-200/40">Customer</p>
                        <p className="text-forest-100/70">{issue.customerName}</p>
                        {issue.customerEmail && <p className="text-forest-200/40">{issue.customerEmail}</p>}
                      </div>
                      {issue.orderId && (
                        <div>
                          <p className="text-forest-200/40">Order</p>
                          <p className="text-forest-100/70">#{issue.orderId}</p>
                          {issue.orderAmount && <p className="text-forest-200/40">${issue.orderAmount.toFixed(2)}</p>}
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
                    </div>

                    {issue.requestedRefund && issue.status === "pending" && (
                      <div className="glass-orange rounded-xl px-3 py-2 mt-2">
                        <p className="text-ember-200 text-xs font-semibold">Refund Requested: ${issue.requestedRefund.toFixed(2)}</p>
                      </div>
                    )}
                    {issue.refundAmount && (
                      <div className="glass-green rounded-xl px-3 py-2 mt-2">
                        <p className="text-forest-200 text-xs font-semibold">Refund Approved: ${issue.refundAmount.toFixed(2)}</p>
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
                        <button className="glass text-forest-200/60 text-xs font-medium px-3 py-1.5 rounded-xl hover:glass transition-all">
                          Contact Customer
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
                <div><p className="text-forest-200/40">Order Amount</p><p className="text-white font-medium">${selected.orderAmount?.toFixed(2)}</p></div>
                <div><p className="text-forest-200/40">Requested</p><p className="text-ember-400 font-medium">${selected.requestedRefund?.toFixed(2)}</p></div>
              </div>
            </div>

            <div className="glass rounded-xl p-3 mb-4">
              <p className="text-forest-200/40 text-xs mb-1">Issue</p>
              <p className="text-forest-100/70 text-xs">{selected.description}</p>
            </div>

            <div className="mb-3">
              <label className="block text-forest-200/60 text-xs font-medium mb-1">Refund Amount ($) *</label>
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
