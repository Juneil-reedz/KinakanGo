import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Check, Crown, Zap, ChevronRight, X, Upload, Smartphone, Banknote,
  Clock, CheckCircle, XCircle, Store, Bike, FileText, Phone, MapPin,
  Camera, ShieldCheck, AlertCircle
} from 'lucide-react';
import { useNotification } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import { request } from '../services/api';

const GCASH_NUMBER = '0927-064-6946';
const GCASH_NAME   = 'KinakanGo Admin';

/* ── Roles available after upgrade ─────────────────────────────── */
const ROLES = {
  restaurant_owner: {
    label: 'Restaurant Owner',
    icon: Store,
    color: 'from-ember-600 to-ember-700',
    glow: 'btn-glow-orange',
    description: 'Open your own restaurant on KinakanGo and start receiving orders.',
    privileges: [
      'Restaurant dashboard & analytics',
      'Create and manage your menu',
      'Receive and manage orders',
      'Set opening hours & delivery fee',
      'View customer reviews',
      'Earnings report',
    ],
    requirements: [
      { icon: Store,    text: 'Restaurant name & address' },
      { icon: Phone,    text: 'Business contact number' },
      { icon: FileText, text: 'DTI or business permit (optional for starters)' },
      { icon: Camera,   text: 'Restaurant photo / logo' },
      { icon: MapPin,   text: 'Delivery coverage area' },
    ],
  },
  rider: {
    label: 'Delivery Rider',
    icon: Bike,
    color: 'from-tawi-blue to-forest-700',
    glow: 'btn-glow-teal',
    description: 'Earn money by delivering orders from restaurants to customers.',
    privileges: [
      'Rider dashboard & earnings tracker',
      'Accept nearby delivery orders',
      'Real-time order navigation',
      'Daily & weekly payout summary',
      'Rider performance rating',
      'Bonus incentives on high volume',
    ],
    requirements: [
      { icon: FileText,   text: 'Valid government-issued ID' },
      { icon: Bike,       text: 'Motorcycle or bicycle (any)' },
      { icon: Phone,      text: 'Active mobile number' },
      { icon: Camera,     text: 'Profile photo with face visible' },
      { icon: ShieldCheck, text: 'No criminal record (self-declaration)' },
    ],
  },
};

const PLANS = [
  {
    id: 'premium', name: 'Premium', price: 299, period: 'month',
    icon: Crown, iconClass: 'btn-glow-orange',
    color: 'from-ember-600 to-ember-700',
    popular: true,
    tagline: 'Become a Restaurant Owner OR a Rider',
    features: [
      'All Basic (free) features',
      'Priority customer support',
      'Exclusive discounts & promos',
      'Free delivery on orders above ₱300',
      'Choose: Restaurant Owner OR Rider role',
      'Full dashboard access for your chosen role',
      'Earnings & analytics',
    ],
    roles: ['restaurant_owner', 'rider'],
  },
  {
    id: 'business', name: 'Business Pro', price: 999, period: 'month',
    icon: Zap, iconClass: 'btn-glow-green',
    color: 'from-forest-500 to-forest-600',
    tagline: 'Restaurant Owner AND Rider — both roles',
    features: [
      'All Premium features',
      'Both Restaurant Owner AND Rider roles',
      'Multiple restaurant management',
      '24/7 Priority support & account manager',
      'Advanced analytics & reports',
      'Commission discounts',
      'API access & marketing tools',
    ],
    roles: ['restaurant_owner', 'rider'],
  },
];

const STATUS_UI = {
  pending:  { icon: Clock,       color: 'text-ember-400',  bg: 'glass-orange', label: 'Pending Review' },
  approved: { icon: CheckCircle, color: 'text-forest-300', bg: 'glass-green',  label: 'Approved' },
  rejected: { icon: XCircle,     color: 'text-red-400',    bg: 'glass',        label: 'Rejected' },
};

export default function AccountUpgrade() {
  const navigate = useNavigate();
  const { addNotification } = useNotification();
  const { user } = useAuth();

  const [step, setStep]           = useState('plans');   // plans | role | payment | done
  const [selectedPlan, setPlan]   = useState(null);
  const [selectedRole, setRole]   = useState(null);      // restaurant_owner | rider
  const [expandedRole, setExpandedRole] = useState(null);
  const [payMethod, setPayMethod] = useState(null);
  const [refNum, setRefNum]       = useState('');
  const [proof, setProof]         = useState(null);
  const [proofPreview, setProofPreview] = useState(null);
  const [loading, setLoading]     = useState(false);
  const [existing, setExisting]   = useState(undefined); // undefined = loading
  const fileRef = useRef(null);

  useEffect(() => {
    request('/upgrades/mine').then(setExisting).catch(() => setExisting(null));
  }, []);

  const plan = PLANS.find(p => p.id === selectedPlan);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { addNotification('Image must be under 5 MB', 'error'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => { setProof(ev.target.result); setProofPreview(ev.target.result); };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (payMethod === 'gcash' && !refNum.trim()) { addNotification('Enter the GCash reference number', 'error'); return; }
    if (!proof) { addNotification('Please upload proof of payment', 'error'); return; }
    setLoading(true);
    try {
      await request('/upgrades', {
        method: 'POST',
        body: JSON.stringify({
          plan: `${plan.name} — ${ROLES[selectedRole]?.label || selectedRole}`,
          amount: plan.price,
          payment_method: payMethod,
          reference_number: refNum || null,
          proof_image: proof,
        }),
      });
      setStep('done');
      addNotification('Request submitted! We\'ll review within 24 hours.', 'success');
    } catch (err) {
      addNotification(err?.data?.error || err?.message || 'Submission failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  /* ── Loading ── */
  if (existing === undefined) return <div className="glass rounded-3xl h-48 animate-pulse" />;

  /* ── Existing request ── */
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
              {existing.status === 'pending'  && 'Your upgrade request is being reviewed. This usually takes 1–24 hours.'}
              {existing.status === 'approved' && 'Your account has been upgraded! Access your new dashboard below.'}
              {existing.status === 'rejected' && 'Your request was rejected. Please contact support or resubmit.'}
            </p>
            {existing.admin_note && (
              <p className="text-ember-300 text-sm mt-3 glass-orange rounded-xl px-4 py-2">Note: {existing.admin_note}</p>
            )}
          </div>
          <div className="glass rounded-xl px-5 py-3 text-sm text-forest-200/70">
            <span className="font-semibold text-white">{existing.plan}</span> · ₱{existing.amount} ·{' '}
            {existing.payment_method === 'gcash' ? 'GCash' : 'Cash'} ·{' '}
            {new Date(existing.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
          {existing.status === 'approved' && (
            <div className="flex gap-3 flex-wrap justify-center">
              <button onClick={() => navigate('/owner/login')} className="btn-glow-orange text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 text-sm">
                <Store className="w-4 h-4" /> Restaurant Portal
              </button>
              <button onClick={() => navigate('/rider/login')} className="btn-glow-teal text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 text-sm">
                <Bike className="w-4 h-4" /> Rider Portal
              </button>
            </div>
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

  /* ── Done ── */
  if (step === 'done') {
    const role = ROLES[selectedRole];
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-5 animate-fade-up">
        <div className="w-20 h-20 btn-glow-green rounded-3xl flex items-center justify-center animate-breathe">
          <CheckCircle className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-2xl font-heading font-bold text-white text-center">Request Submitted!</h2>
        <p className="text-forest-200/60 text-sm text-center max-w-sm">
          Our team will verify your payment and activate your <strong className="text-white">{role?.label}</strong> account within 1–24 hours.
        </p>
        <div className="glass rounded-2xl px-6 py-4 text-center space-y-1">
          <p className="text-forest-200/50 text-xs">Plan · Role</p>
          <p className="text-white font-semibold">{plan?.name} — {role?.label}</p>
          <p className="text-ember-400 font-bold">₱{plan?.price}/mo</p>
        </div>
        <button onClick={() => navigate('/')} className="btn-glow-orange text-white px-6 py-3 rounded-xl font-semibold">
          Back to Home
        </button>
      </div>
    );
  }

  /* ── Role selection step ── */
  if (step === 'role') {
    return (
      <div className="space-y-4 max-w-2xl mx-auto animate-fade-up">
        <div className="flex items-center gap-3 mb-2">
          <button onClick={() => setStep('plans')} className="w-8 h-8 glass rounded-lg flex items-center justify-center">
            <ChevronRight className="w-4 h-4 text-forest-200 rotate-180" />
          </button>
          <div>
            <h1 className="text-xl font-heading font-bold text-white">Choose Your Role</h1>
            <p className="text-forest-200/50 text-xs">Select the role you want to activate with your {plan?.name} plan</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(ROLES).map(([key, role]) => {
            const Icon = role.icon;
            const isSelected = selectedRole === key;
            const isExpanded = expandedRole === key;
            return (
              <div key={key}
                className={`glass card-3d rounded-2xl overflow-hidden cursor-pointer transition-all duration-300
                  ${isSelected ? 'ring-2 ring-forest-400' : 'hover:glass-green'}`}
                onClick={() => setRole(key)}>
                <div className={`bg-gradient-to-br ${role.color} p-5`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 ${role.glow} rounded-xl flex items-center justify-center flex-shrink-0`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-white font-heading font-bold">{role.label}</p>
                      <p className="text-white/70 text-xs">{role.description}</p>
                    </div>
                    {isSelected && <CheckCircle className="w-5 h-5 text-white ml-auto" />}
                  </div>
                </div>

                <div className="p-4">
                  {/* Privileges */}
                  <p className="text-forest-200/70 text-xs font-semibold uppercase tracking-wide mb-2">What you get</p>
                  <ul className="space-y-1.5 mb-3">
                    {role.privileges.map((p, i) => (
                      <li key={i} className="flex items-center gap-2 text-xs text-forest-100/80">
                        <Check className="w-3 h-3 text-forest-400 flex-shrink-0" /> {p}
                      </li>
                    ))}
                  </ul>

                  {/* Requirements toggle */}
                  <button onClick={e => { e.stopPropagation(); setExpandedRole(isExpanded ? null : key); }}
                    className="text-ember-400 text-xs flex items-center gap-1 hover:text-ember-300 transition-colors">
                    <AlertCircle className="w-3 h-3" />
                    {isExpanded ? 'Hide requirements' : 'View requirements'}
                    <ChevronRight className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                  </button>

                  {isExpanded && (
                    <div className="mt-3 glass rounded-xl p-3 animate-fade-up">
                      <p className="text-forest-200/60 text-xs font-semibold mb-2">Requirements</p>
                      <ul className="space-y-1.5">
                        {role.requirements.map((r, i) => {
                          const Ri = r.icon;
                          return (
                            <li key={i} className="flex items-center gap-2 text-xs text-forest-100/70">
                              <Ri className="w-3 h-3 text-ember-400 flex-shrink-0" /> {r.text}
                            </li>
                          );
                        })}
                      </ul>
                      <p className="text-forest-200/40 text-[10px] mt-2">* Admin may ask for these during review</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <button onClick={() => setStep('payment')} disabled={!selectedRole}
          className={`w-full py-4 rounded-2xl font-heading font-bold text-sm flex items-center justify-center gap-2 transition-all
            ${selectedRole ? 'btn-glow-green text-white' : 'glass text-forest-200/30 cursor-not-allowed'}`}>
          Continue to Payment <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    );
  }

  /* ── Payment step ── */
  if (step === 'payment') {
    const role = ROLES[selectedRole];
    return (
      <div className="space-y-4 max-w-lg mx-auto animate-fade-up">
        <div className="flex items-center gap-3 mb-2">
          <button onClick={() => setStep('role')} className="w-8 h-8 glass rounded-lg flex items-center justify-center">
            <ChevronRight className="w-4 h-4 text-forest-200 rotate-180" />
          </button>
          <h1 className="text-xl font-heading font-bold text-white">Complete Payment</h1>
        </div>

        {/* Summary */}
        <div className="glass rounded-2xl p-4 flex items-center gap-4">
          <div className={`w-10 h-10 ${plan?.iconClass} rounded-xl flex items-center justify-center flex-shrink-0`}>
            {plan && <plan.icon className="w-5 h-5 text-white" />}
          </div>
          <div className="flex-1">
            <p className="text-white font-semibold text-sm">{plan?.name}</p>
            <p className="text-forest-200/50 text-xs">{role?.label}</p>
          </div>
          <p className="text-ember-400 font-heading font-bold">₱{plan?.price}<span className="text-forest-200/40 text-xs font-normal">/mo</span></p>
        </div>

        {/* Payment method */}
        <div>
          <p className="text-forest-200/70 text-sm font-medium mb-2">Payment method</p>
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

        {/* GCash */}
        {payMethod === 'gcash' && (
          <div className="glass rounded-2xl p-5 space-y-4 animate-fade-up">
            <p className="text-white font-semibold">Send via GCash</p>
            <div className="glass-green rounded-xl p-4">
              <p className="text-forest-200/60 text-xs mb-1">Send ₱{plan?.price} to:</p>
              <p className="text-white font-heading font-bold text-lg">{GCASH_NUMBER}</p>
              <p className="text-forest-200/70 text-sm">{GCASH_NAME}</p>
            </div>
            <ol className="text-forest-200/60 text-xs space-y-1.5 list-decimal list-inside">
              <li>Open GCash → Send Money → enter the number above</li>
              <li>Enter ₱{plan?.price} and complete the transfer</li>
              <li>Screenshot the success screen</li>
              <li>Upload screenshot + reference number below</li>
            </ol>
            <div>
              <p className="text-forest-200/70 text-xs font-medium mb-1.5">GCash Reference Number</p>
              <input value={refNum} onChange={e => setRefNum(e.target.value)} placeholder="e.g. 1234567890"
                className="w-full input-glass px-3 py-2.5 text-sm" />
            </div>
          </div>
        )}

        {/* Cash */}
        {payMethod === 'cash' && (
          <div className="glass rounded-2xl p-5 space-y-3 animate-fade-up">
            <p className="text-white font-semibold">Cash Payment</p>
            <div className="glass-orange rounded-xl p-4">
              <p className="text-forest-200/60 text-xs mb-1">Amount:</p>
              <p className="text-white font-heading font-bold text-lg">₱{plan?.price}</p>
            </div>
            <p className="text-forest-200/60 text-xs">Pay at our office or to an authorized collector. Upload a photo of your receipt below.</p>
          </div>
        )}

        {/* Upload proof */}
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

        {payMethod && (
          <button onClick={handleSubmit} disabled={loading || !proof}
            className={`w-full py-4 rounded-2xl font-heading font-bold text-sm flex items-center justify-center gap-2 transition-all
              ${loading || !proof ? 'glass text-forest-200/40 cursor-not-allowed' : 'btn-glow-green text-white'}`}>
            {loading
              ? <><div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Submitting…</>
              : <><Check className="w-4 h-4" /> Submit Upgrade Request</>}
          </button>
        )}
      </div>
    );
  }

  /* ── Plans step ── */
  return (
    <div className="space-y-6 pb-20 lg:pb-0 animate-fade-up">
      <div className="text-center py-4">
        <div className="w-16 h-16 btn-glow-orange rounded-3xl flex items-center justify-center mx-auto mb-4 animate-breathe">
          <Crown className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-heading font-bold text-white mb-2">Upgrade Your Account</h1>
        <p className="text-forest-200/60 text-sm max-w-md mx-auto">
          Unlock Restaurant Owner or Rider privileges. Pay via GCash or cash and get approved within 24 hours.
        </p>
      </div>

      {/* Role preview cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {Object.entries(ROLES).map(([key, role]) => {
          const Icon = role.icon;
          return (
            <div key={key} className={`bg-gradient-to-br ${role.color} rounded-2xl p-4 flex items-center gap-3`}>
              <div className={`w-10 h-10 ${role.glow} rounded-xl flex items-center justify-center flex-shrink-0`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">{role.label}</p>
                <p className="text-white/70 text-xs">{role.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Plans */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {PLANS.map(p => {
          const Icon = p.icon;
          const isSel = selectedPlan === p.id;
          return (
            <div key={p.id} onClick={() => setPlan(p.id)}
              className={`relative glass card-3d rounded-3xl overflow-hidden cursor-pointer transition-all duration-300
                ${isSel ? 'ring-2 ring-forest-400 scale-[1.02]' : 'hover:glass-green'}`}>
              {p.popular && (
                <div className="absolute top-3 right-3 btn-glow-orange text-white text-xs px-2.5 py-1 rounded-full font-bold">POPULAR</div>
              )}
              <div className={`bg-gradient-to-br ${p.color} p-6`}>
                <div className={`w-12 h-12 ${p.iconClass} rounded-2xl flex items-center justify-center mb-3`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <p className="text-white font-heading font-bold text-xl">{p.name}</p>
                <p className="text-white/60 text-xs mt-0.5">{p.tagline}</p>
                <div className="flex items-end gap-1 mt-2">
                  <span className="text-white font-heading font-bold text-4xl">₱{p.price}</span>
                  <span className="text-white/70 text-sm mb-1">/{p.period}</span>
                </div>
              </div>
              <div className="p-5">
                <ul className="space-y-2.5 mb-4">
                  {p.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm">
                      <div className="w-5 h-5 btn-glow-green rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-forest-100/80">{f}</span>
                    </li>
                  ))}
                </ul>
                <div className={`w-full py-2.5 rounded-xl text-sm font-semibold text-center transition-all
                  ${isSel ? 'btn-glow-orange text-white' : 'glass text-forest-200/70'}`}>
                  {isSel ? '✓ Selected' : 'Select Plan'}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {selectedPlan && (
        <button onClick={() => setStep('role')}
          className="w-full py-4 btn-glow-green text-white font-heading font-bold rounded-2xl flex items-center justify-center gap-2 animate-fade-up">
          Choose Your Role <ChevronRight className="w-5 h-5" />
        </button>
      )}

      {/* How it works */}
      <div className="glass rounded-2xl p-5">
        <p className="text-white font-semibold mb-4">How it works</p>
        <div className="space-y-3">
          {[
            { n: '1', t: 'Choose a plan',             d: 'Premium (₱299/mo) or Business Pro (₱999/mo)' },
            { n: '2', t: 'Pick your role',             d: 'Restaurant Owner or Delivery Rider' },
            { n: '3', t: 'Pay via GCash or Cash',      d: 'Upload screenshot or receipt as proof' },
            { n: '4', t: 'Admin reviews (1–24 hrs)',    d: 'We verify your payment' },
            { n: '5', t: 'Access unlocked',             d: 'Login to your Restaurant or Rider dashboard' },
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
