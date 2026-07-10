import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Star, Crown, Zap, ChevronRight, X, Upload, Smartphone, Banknote, Clock, CheckCircle, XCircle, Image } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import { request } from '../services/api';

// ── Update these with your real GCash number ──────────────────────
const GCASH_NUMBER = '09XX-XXX-XXXX';
const GCASH_NAME   = 'KinakanGo Admin';
// ─────────────────────────────────────────────────────────────────

const PLANS = [
  {
    id: 'premium', name: 'Premium', price: 299, period: 'month',
    icon: Crown, iconClass: 'btn-glow-orange',
    color: 'from-ember-600 to-ember-700',
    popular: true,
    features: [
      'All Basic features',
      'Priority customer support',
      'Exclusive discounts & promos',
      'Free delivery on orders above ₱300',
      'Restaurant Owner Dashboard',
      'Manage your own restaurant & menu',
      'View orders & earnings',
    ],
  },
  {
    id: 'business', name: 'Business Pro', price: 999, period: 'month',
    icon: Zap, iconClass: 'btn-glow-green',
    color: 'from-forest-500 to-forest-600',
    features: [
      'All Premium features',
      '24/7 Priority support',
      'Multiple restaurant management',
      'Advanced analytics & reports',
      'Dedicated account manager',
      'Commission discounts',
      'API access',
    ],
  },
];

const STATUS_UI = {
  pending:  { icon: Clock,        color: 'text-ember-400',  bg: 'glass-orange', label: 'Pending Review' },
  approved: { icon: CheckCircle,  color: 'text-forest-300', bg: 'glass-green',  label: 'Approved' },
  rejected: { icon: XCircle,      color: 'text-red-400',    bg: 'glass',        label: 'Rejected' },
};

export default function AccountUpgrade() {
  const navigate = useNavigate();
  const { addNotification } = useNotification();
  const { user } = useAuth();

  const [step, setStep]           = useState('plans');   // plans | payment | done
  const [selectedPlan, setPlan]   = useState(null);
  const [payMethod, setPayMethod] = useState(null);       // gcash | cash
  const [refNum, setRefNum]       = useState('');
  const [proof, setProof]         = useState(null);       // base64 string
  const [proofPreview, setProofPreview] = useState(null);
  const [notes, setNotes]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [existing, setExisting]   = useState(null);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const fileRef = useRef(null);

  useEffect(() => {
    request('/upgrades/mine').then(data => {
      setExisting(data);
    }).catch(() => {}).finally(() => setCheckingStatus(false));
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { addNotification('Image must be under 5 MB', 'error'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => { setProof(ev.target.result); setProofPreview(ev.target.result); };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (payMethod === 'gcash' && !proof) { addNotification('Please upload proof of payment', 'error'); return; }
    if (payMethod === 'gcash' && !refNum.trim()) { addNotification('Please enter the GCash reference number', 'error'); return; }
    if (payMethod === 'cash' && !proof) { addNotification('Please upload proof of payment', 'error'); return; }

    setLoading(true);
    try {
      const plan = PLANS.find(p => p.id === selectedPlan);
      await request('/upgrades', {
        method: 'POST',
        body: JSON.stringify({
          plan: plan.name,
          amount: plan.price,
          payment_method: payMethod,
          reference_number: refNum || null,
          proof_image: proof,
        }),
      });
      setStep('done');
      addNotification('Upgrade request submitted! We\'ll review it shortly.', 'success');
    } catch (err) {
      addNotification(err?.data?.error || err?.message || 'Submission failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const plan = PLANS.find(p => p.id === selectedPlan);

  // ── Already has a request ─────────────────────────────────────
  if (checkingStatus) {
    return <div className="glass rounded-3xl h-48 animate-pulse" />;
  }

  if (existing && step !== 'done') {
    const ui = STATUS_UI[existing.status] || STATUS_UI.pending;
    const Icon = ui.icon;
    return (
      <div className="space-y-4 animate-fade-up">
        <h1 className="text-2xl font-heading font-bold text-white">Upgrade Account</h1>
        <div className="glass card-3d rounded-3xl p-8 flex flex-col items-center gap-4 text-center">
          <div className={`w-16 h-16 ${ui.bg} rounded-2xl flex items-center justify-center`}>
            <Icon className={`w-8 h-8 ${ui.color}`} />
          </div>
          <div>
            <p className="text-white font-heading font-bold text-xl mb-1">{ui.label}</p>
            <p className="text-forest-200/60 text-sm">
              {existing.status === 'pending' && 'Your upgrade request is being reviewed by our team. This usually takes 1–24 hours.'}
              {existing.status === 'approved' && 'Your account has been upgraded! Go to the restaurant portal to get started.'}
              {existing.status === 'rejected' && 'Your request was rejected. Please contact support or resubmit.'}
            </p>
            {existing.admin_note && (
              <p className="text-ember-300 text-sm mt-2 glass-orange rounded-xl px-4 py-2">Note: {existing.admin_note}</p>
            )}
          </div>
          <div className="glass rounded-xl px-5 py-3 text-sm text-forest-200/70">
            <span className="font-semibold text-white">{existing.plan}</span> · ₱{existing.amount} · {existing.payment_method === 'gcash' ? 'GCash' : 'Cash'} ·{' '}
            {new Date(existing.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
          {existing.status === 'approved' && (
            <button onClick={() => navigate('/owner/login')} className="btn-glow-green text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2">
              Go to Restaurant Portal <ChevronRight className="w-4 h-4" />
            </button>
          )}
          {existing.status === 'rejected' && (
            <button onClick={() => setExisting(null)} className="btn-glow-orange text-white px-6 py-3 rounded-xl font-semibold">
              Resubmit Request
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── Done screen ───────────────────────────────────────────────
  if (step === 'done') {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-5 animate-fade-up">
        <div className="w-20 h-20 btn-glow-green rounded-3xl flex items-center justify-center animate-breathe">
          <CheckCircle className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-2xl font-heading font-bold text-white">Request Submitted!</h2>
        <p className="text-forest-200/60 text-sm text-center max-w-sm">
          Our team will review your payment proof and activate your restaurant account within 1–24 hours.
        </p>
        <div className="glass rounded-2xl px-6 py-4 text-center">
          <p className="text-forest-200/50 text-xs">Plan</p>
          <p className="text-white font-semibold">{plan?.name} — ₱{plan?.price}/mo</p>
        </div>
        <button onClick={() => navigate('/')} className="btn-glow-orange text-white px-6 py-3 rounded-xl font-semibold">
          Back to Home
        </button>
      </div>
    );
  }

  // ── Payment step ──────────────────────────────────────────────
  if (step === 'payment') {
    return (
      <div className="space-y-4 max-w-lg mx-auto animate-fade-up">
        <div className="flex items-center gap-3 mb-2">
          <button onClick={() => setStep('plans')} className="w-8 h-8 glass rounded-lg flex items-center justify-center">
            <ChevronRight className="w-4 h-4 text-forest-200 rotate-180" />
          </button>
          <h1 className="text-xl font-heading font-bold text-white">Complete Payment</h1>
        </div>

        {/* Plan summary */}
        <div className="glass rounded-2xl p-4 flex items-center gap-4">
          <div className={`w-10 h-10 ${plan?.iconClass} rounded-xl flex items-center justify-center flex-shrink-0`}>
            {plan && <plan.icon className="w-5 h-5 text-white" />}
          </div>
          <div>
            <p className="text-white font-semibold">{plan?.name}</p>
            <p className="text-ember-400 font-bold">₱{plan?.price}<span className="text-forest-200/50 text-xs font-normal">/month</span></p>
          </div>
        </div>

        {/* Payment method */}
        <div>
          <p className="text-forest-200/70 text-sm font-medium mb-2">Choose payment method</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { id: 'gcash', label: 'GCash', icon: Smartphone, desc: 'Send via GCash' },
              { id: 'cash',  label: 'Cash',  icon: Banknote,   desc: 'Pay in person' },
            ].map(m => (
              <button key={m.id} onClick={() => setPayMethod(m.id)}
                className={`glass card-3d rounded-2xl p-4 flex flex-col items-center gap-2 transition-all
                  ${payMethod === m.id ? 'ring-2 ring-forest-400 glass-green' : 'hover:glass-green'}`}>
                <m.icon className={`w-6 h-6 ${payMethod === m.id ? 'text-forest-300' : 'text-forest-200/50'}`} />
                <p className={`font-semibold text-sm ${payMethod === m.id ? 'text-white' : 'text-forest-200/70'}`}>{m.label}</p>
                <p className="text-forest-200/40 text-xs">{m.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* GCash instructions */}
        {payMethod === 'gcash' && (
          <div className="glass rounded-2xl p-5 space-y-4 animate-fade-up">
            <p className="text-white font-semibold">Send payment via GCash</p>
            <div className="glass-green rounded-xl p-4">
              <p className="text-forest-200/60 text-xs mb-1">Send ₱{plan?.price} to:</p>
              <p className="text-white font-heading font-bold text-lg">{GCASH_NUMBER}</p>
              <p className="text-forest-200/70 text-sm">{GCASH_NAME}</p>
            </div>
            <ol className="text-forest-200/60 text-xs space-y-1.5 list-decimal list-inside">
              <li>Open GCash → Send Money → enter the number above</li>
              <li>Enter ₱{plan?.price} and complete the transfer</li>
              <li>Take a screenshot of the success screen</li>
              <li>Upload the screenshot below with the reference number</li>
            </ol>
            <div>
              <p className="text-forest-200/70 text-xs font-medium mb-1.5">GCash Reference Number</p>
              <input value={refNum} onChange={e => setRefNum(e.target.value)}
                placeholder="e.g. 1234567890"
                className="w-full input-glass px-3 py-2.5 text-sm" />
            </div>
          </div>
        )}

        {/* Cash instructions */}
        {payMethod === 'cash' && (
          <div className="glass rounded-2xl p-5 space-y-3 animate-fade-up">
            <p className="text-white font-semibold">Cash Payment Instructions</p>
            <div className="glass-orange rounded-xl p-4">
              <p className="text-forest-200/60 text-xs mb-1">Amount to pay:</p>
              <p className="text-white font-heading font-bold text-lg">₱{plan?.price}</p>
            </div>
            <p className="text-forest-200/60 text-xs">
              Pay in person at our office or via an authorized collector. After paying, upload a photo of your receipt or agreement slip below.
            </p>
          </div>
        )}

        {/* Proof upload */}
        {payMethod && (
          <div className="animate-fade-up">
            <p className="text-forest-200/70 text-xs font-medium mb-1.5">
              {payMethod === 'gcash' ? 'Upload GCash Screenshot' : 'Upload Payment Receipt'}
            </p>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            {proofPreview ? (
              <div className="relative rounded-2xl overflow-hidden">
                <img src={proofPreview} alt="proof" className="w-full max-h-56 object-contain glass rounded-2xl" />
                <button onClick={() => { setProof(null); setProofPreview(null); }}
                  className="absolute top-2 right-2 w-7 h-7 btn-glow-orange rounded-full flex items-center justify-center">
                  <X className="w-3.5 h-3.5 text-white" />
                </button>
              </div>
            ) : (
              <button onClick={() => fileRef.current?.click()}
                className="w-full glass rounded-2xl py-10 flex flex-col items-center gap-3 hover:glass-green transition-all border-2 border-dashed border-white/10 hover:border-forest-400/30">
                <Upload className="w-8 h-8 text-forest-300/40" />
                <p className="text-forest-200/50 text-sm">Tap to upload screenshot</p>
                <p className="text-forest-200/30 text-xs">JPG, PNG up to 5 MB</p>
              </button>
            )}
          </div>
        )}

        {/* Submit */}
        {payMethod && (
          <button onClick={handleSubmit} disabled={loading || !proof}
            className={`w-full py-4 rounded-2xl font-heading font-bold text-sm flex items-center justify-center gap-2 transition-all animate-fade-up
              ${loading || !proof ? 'glass text-forest-200/40 cursor-not-allowed' : 'btn-glow-green text-white'}`}>
            {loading
              ? <><div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Submitting…</>
              : <><Check className="w-4 h-4" /> Submit Upgrade Request</>}
          </button>
        )}
      </div>
    );
  }

  // ── Plans step ────────────────────────────────────────────────
  return (
    <div className="space-y-6 pb-20 lg:pb-0 animate-fade-up">
      <div className="text-center py-4">
        <div className="w-16 h-16 btn-glow-orange rounded-3xl flex items-center justify-center mx-auto mb-4 animate-breathe">
          <Crown className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-heading font-bold text-white mb-2">Upgrade Your Account</h1>
        <p className="text-forest-200/60 text-sm max-w-md mx-auto">
          Become a restaurant owner on KinakanGo. Pay via GCash or cash and get approved within 24 hours.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {PLANS.map(p => {
          const Icon = p.icon;
          const isSel = selectedPlan === p.id;
          return (
            <div key={p.id} onClick={() => setPlan(p.id)}
              className={`relative glass card-3d rounded-3xl overflow-hidden cursor-pointer transition-all duration-300
                ${isSel ? 'ring-2 ring-forest-400 scale-[1.02]' : 'hover:glass-green'}`}>
              {p.popular && (
                <div className="absolute top-3 right-3 btn-glow-orange text-white text-xs px-2.5 py-1 rounded-full font-bold">
                  POPULAR
                </div>
              )}
              <div className={`bg-gradient-to-br ${p.color} p-6`}>
                <div className={`w-12 h-12 ${p.iconClass} rounded-2xl flex items-center justify-center mb-3`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <p className="text-white font-heading font-bold text-xl">{p.name}</p>
                <div className="flex items-end gap-1 mt-1">
                  <span className="text-white font-heading font-bold text-4xl">₱{p.price}</span>
                  <span className="text-white/70 text-sm mb-1">/{p.period}</span>
                </div>
              </div>
              <div className="p-5">
                <ul className="space-y-2.5">
                  {p.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm">
                      <div className="w-5 h-5 btn-glow-green rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-forest-100/80">{f}</span>
                    </li>
                  ))}
                </ul>
                <div className={`mt-4 w-full py-2.5 rounded-xl text-sm font-semibold text-center transition-all
                  ${isSel ? 'btn-glow-orange text-white' : 'glass text-forest-200/70'}`}>
                  {isSel ? '✓ Selected' : 'Select Plan'}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {selectedPlan && (
        <button onClick={() => setStep('payment')}
          className="w-full py-4 btn-glow-green text-white font-heading font-bold rounded-2xl flex items-center justify-center gap-2 animate-fade-up">
          Continue to Payment <ChevronRight className="w-5 h-5" />
        </button>
      )}

      {/* How it works */}
      <div className="glass rounded-2xl p-5">
        <p className="text-white font-semibold mb-4">How it works</p>
        <div className="space-y-3">
          {[
            { n: '1', t: 'Choose a plan', d: 'Select Premium or Business Pro above' },
            { n: '2', t: 'Pay via GCash or Cash', d: 'Send payment and upload your proof of payment' },
            { n: '3', t: 'Admin reviews (1–24 hrs)', d: 'Our team verifies your payment screenshot' },
            { n: '4', t: 'Restaurant access unlocked', d: 'Login to your restaurant dashboard and start selling' },
          ].map(s => (
            <div key={s.n} className="flex items-start gap-3">
              <div className="w-7 h-7 btn-glow-green rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-white">{s.n}</div>
              <div>
                <p className="text-white text-sm font-medium">{s.t}</p>
                <p className="text-forest-200/50 text-xs">{s.d}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
