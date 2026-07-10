import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Check, Crown, Zap, ChevronRight, X, Upload, Smartphone, Banknote,
  Clock, CheckCircle, XCircle, Store, Bike, FileText, Phone, MapPin,
  Camera, ShieldCheck, User
} from 'lucide-react';
import { useNotification } from '../context/NotificationContext';
import { request } from '../services/api';

const GCASH_NUMBER = '0927-064-6946';
const GCASH_NAME   = 'KinakanGo Admin';

const PLANS = [
  {
    id: 'premium', name: 'Premium', price: 299, period: 'month',
    icon: Crown, iconClass: 'btn-glow-orange', color: 'from-ember-600 to-ember-700',
    popular: true,
    tagline: 'Become a Restaurant Owner OR a Rider',
    features: [
      'All Basic features', 'Priority customer support',
      'Exclusive discounts & promos', 'Free delivery on orders above ₱300',
      'Choose: Restaurant Owner OR Rider role',
      'Full dashboard for your chosen role', 'Earnings & analytics',
    ],
  },
  {
    id: 'business', name: 'Business Pro', price: 999, period: 'month',
    icon: Zap, iconClass: 'btn-glow-green', color: 'from-forest-500 to-forest-600',
    tagline: 'Restaurant Owner AND Rider — both roles',
    features: [
      'All Premium features', 'Both Restaurant Owner AND Rider roles',
      'Multiple restaurant management', '24/7 Priority support & account manager',
      'Advanced analytics & reports', 'Commission discounts', 'API access',
    ],
  },
];

const STATUS_UI = {
  pending:  { icon: Clock,       color: 'text-ember-400',  bg: 'glass-orange', label: 'Pending Review' },
  approved: { icon: CheckCircle, color: 'text-forest-300', bg: 'glass-green',  label: 'Approved' },
  rejected: { icon: XCircle,     color: 'text-red-400',    bg: 'glass',        label: 'Rejected' },
};

/* ── Image upload helper ── */
function ImageUpload({ label, value, onChange, required = false }) {
  const ref = useRef(null);
  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return;
    const reader = new FileReader();
    reader.onload = (ev) => onChange(ev.target.result);
    reader.readAsDataURL(file);
  };
  return (
    <div>
      <p className="text-forest-200/70 text-xs font-medium mb-1.5">{label}{required && <span className="text-red-400 ml-1">*</span>}</p>
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      {value ? (
        <div className="relative rounded-xl overflow-hidden">
          <img src={value} alt={label} className="w-full max-h-40 object-contain glass rounded-xl" />
          <button onClick={() => onChange(null)}
            className="absolute top-2 right-2 w-6 h-6 btn-glow-orange rounded-full flex items-center justify-center">
            <X className="w-3 h-3 text-white" />
          </button>
        </div>
      ) : (
        <button onClick={() => ref.current?.click()}
          className="w-full glass rounded-xl py-6 flex flex-col items-center gap-2 hover:glass-green transition-all border-2 border-dashed border-white/10 hover:border-forest-400/30">
          <Upload className="w-6 h-6 text-forest-300/40" />
          <p className="text-forest-200/40 text-xs">Tap to upload · JPG, PNG · max 5 MB</p>
        </button>
      )}
    </div>
  );
}

export default function AccountUpgrade() {
  const navigate = useNavigate();
  const { addNotification } = useNotification();

  // steps: plans → role → requirements → payment → done
  const [step, setStep]           = useState('plans');
  const [selectedPlan, setPlan]   = useState(null);
  const [selectedRole, setRole]   = useState(null);

  // Restaurant Owner requirements
  const [resto, setResto] = useState({
    name: '', category: 'Filipino', address: '', city: '', phone: '',
    logo: null, permit: null,
  });

  // Rider requirements
  const [rider, setRider] = useState({
    fullName: '', idType: "Driver's License", idPhoto: null,
    selfie: null, vehicleType: 'Motorcycle', plateNumber: '',
  });

  // Payment
  const [payMethod, setPayMethod] = useState(null);
  const [refNum, setRefNum]       = useState('');
  const [proof, setProof]         = useState(null);
  const [proofPreview, setProofPreview] = useState(null);
  const proofRef = useRef(null);

  const [loading, setLoading]     = useState(false);
  const [existing, setExisting]   = useState(undefined);

  useEffect(() => {
    request('/upgrades/mine').then(setExisting).catch(() => setExisting(null));
  }, []);

  const plan = PLANS.find(p => p.id === selectedPlan);

  /* ── Validation for requirements ── */
  const validateRequirements = () => {
    if (selectedRole === 'restaurant_owner') {
      if (!resto.name.trim()) { addNotification('Restaurant name is required', 'error'); return false; }
      if (!resto.address.trim()) { addNotification('Restaurant address is required', 'error'); return false; }
      if (!resto.phone.trim()) { addNotification('Contact number is required', 'error'); return false; }
      if (!resto.logo) { addNotification('Restaurant photo/logo is required', 'error'); return false; }
    } else {
      if (!rider.fullName.trim()) { addNotification('Full name is required', 'error'); return false; }
      if (!rider.idPhoto) { addNotification('Government ID photo is required', 'error'); return false; }
      if (!rider.selfie) { addNotification('Selfie with ID is required', 'error'); return false; }
    }
    return true;
  };

  /* ── Submit ── */
  const handleSubmit = async () => {
    if (payMethod === 'gcash' && !refNum.trim()) { addNotification('Enter the GCash reference number', 'error'); return; }
    if (!proof) { addNotification('Upload proof of payment', 'error'); return; }
    setLoading(true);
    try {
      const requirements = selectedRole === 'restaurant_owner'
        ? { role: 'restaurant_owner', restaurantName: resto.name, category: resto.category, address: resto.address, city: resto.city, phone: resto.phone, logo: resto.logo, permit: resto.permit }
        : { role: 'rider', fullName: rider.fullName, idType: rider.idType, idPhoto: rider.idPhoto, selfie: rider.selfie, vehicleType: rider.vehicleType, plateNumber: rider.plateNumber };

      await request('/upgrades', {
        method: 'POST',
        body: JSON.stringify({
          plan: `${plan.name} — ${selectedRole === 'restaurant_owner' ? 'Restaurant Owner' : 'Rider'}`,
          amount: plan.price,
          payment_method: payMethod,
          reference_number: refNum || null,
          proof_image: proof,
          notes: JSON.stringify(requirements),
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
              {existing.status === 'pending'  && 'Your request is under review. This usually takes 1–24 hours.'}
              {existing.status === 'approved' && 'Your account is upgraded! Access your dashboard below.'}
              {existing.status === 'rejected' && 'Your request was rejected. Check the note below or resubmit.'}
            </p>
            {existing.admin_note && (
              <p className="text-ember-300 text-sm mt-3 glass-orange rounded-xl px-4 py-2">Admin note: {existing.admin_note}</p>
            )}
          </div>
          <div className="glass rounded-xl px-5 py-3 text-sm text-forest-200/70">
            <span className="font-semibold text-white">{existing.plan}</span> · ₱{existing.amount} · {existing.payment_method === 'gcash' ? 'GCash' : 'Cash'} ·{' '}
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
            <button onClick={() => setExisting(null)} className="btn-glow-orange text-white px-6 py-3 rounded-xl font-semibold">Resubmit</button>
          )}
        </div>
      </div>
    );
  }

  /* ── Done ── */
  if (step === 'done') {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-5 animate-fade-up">
        <div className="w-20 h-20 btn-glow-green rounded-3xl flex items-center justify-center animate-breathe">
          <CheckCircle className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-2xl font-heading font-bold text-white text-center">Request Submitted!</h2>
        <p className="text-forest-200/60 text-sm text-center max-w-sm">
          Our team will verify your documents and payment. Your {selectedRole === 'restaurant_owner' ? 'Restaurant' : 'Rider'} account will be activated within 1–24 hours.
        </p>
        <div className="glass rounded-2xl px-6 py-4 text-center">
          <p className="text-white font-semibold">{plan?.name} — {selectedRole === 'restaurant_owner' ? 'Restaurant Owner' : 'Rider'}</p>
          <p className="text-ember-400 font-bold">₱{plan?.price}/mo</p>
        </div>
        <button onClick={() => navigate('/')} className="btn-glow-orange text-white px-6 py-3 rounded-xl font-semibold">Back to Home</button>
      </div>
    );
  }

  /* ── Requirements step ── */
  if (step === 'requirements') {
    return (
      <div className="space-y-4 max-w-lg mx-auto animate-fade-up">
        <div className="flex items-center gap-3 mb-2">
          <button onClick={() => setStep('role')} className="w-8 h-8 glass rounded-lg flex items-center justify-center">
            <ChevronRight className="w-4 h-4 text-forest-200 rotate-180" />
          </button>
          <div>
            <h1 className="text-xl font-heading font-bold text-white">
              {selectedRole === 'restaurant_owner' ? 'Restaurant Details' : 'Rider Details'}
            </h1>
            <p className="text-forest-200/50 text-xs">Fill in your details — admin will review before approving</p>
          </div>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 text-xs text-forest-200/50 mb-2">
          {['Plan','Role','Details','Payment'].map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold
                ${i < 2 ? 'btn-glow-green text-white' : i === 2 ? 'btn-glow-orange text-white' : 'glass text-forest-200/40'}`}>
                {i < 2 ? <Check className="w-3 h-3" /> : i + 1}
              </span>
              <span className={i === 2 ? 'text-white' : ''}>{s}</span>
              {i < 3 && <ChevronRight className="w-3 h-3" />}
            </div>
          ))}
        </div>

        {/* ── Restaurant Owner form ── */}
        {selectedRole === 'restaurant_owner' && (
          <div className="glass rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <Store className="w-4 h-4 text-ember-400" />
              <p className="text-white font-semibold text-sm">Restaurant Information</p>
            </div>

            <div>
              <p className="text-forest-200/70 text-xs font-medium mb-1.5">Restaurant Name <span className="text-red-400">*</span></p>
              <input value={resto.name} onChange={e => setResto(r => ({...r, name: e.target.value}))}
                placeholder="e.g. Bongao Eats" className="w-full input-glass px-3 py-2.5 text-sm" />
            </div>

            <div>
              <p className="text-forest-200/70 text-xs font-medium mb-1.5">Food Category <span className="text-red-400">*</span></p>
              <select value={resto.category} onChange={e => setResto(r => ({...r, category: e.target.value}))}
                className="w-full input-glass px-3 py-2.5 text-sm">
                {['Filipino','Chinese','Fast Food','BBQ & Grill','Seafood','Halal','Desserts & Snacks','Beverages','Other'].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <p className="text-forest-200/70 text-xs font-medium mb-1.5">Restaurant Address <span className="text-red-400">*</span></p>
              <input value={resto.address} onChange={e => setResto(r => ({...r, address: e.target.value}))}
                placeholder="Street, Barangay" className="w-full input-glass px-3 py-2.5 text-sm" />
            </div>

            <div>
              <p className="text-forest-200/70 text-xs font-medium mb-1.5">City / Municipality</p>
              <input value={resto.city} onChange={e => setResto(r => ({...r, city: e.target.value}))}
                placeholder="e.g. Bongao" className="w-full input-glass px-3 py-2.5 text-sm" />
            </div>

            <div>
              <p className="text-forest-200/70 text-xs font-medium mb-1.5">Contact Number <span className="text-red-400">*</span></p>
              <input value={resto.phone} onChange={e => setResto(r => ({...r, phone: e.target.value}))}
                placeholder="09XXXXXXXXX" className="w-full input-glass px-3 py-2.5 text-sm" />
            </div>

            <ImageUpload label="Restaurant Photo / Logo" required value={resto.logo}
              onChange={v => setResto(r => ({...r, logo: v}))} />

            <ImageUpload label="Business Permit or DTI (optional)" value={resto.permit}
              onChange={v => setResto(r => ({...r, permit: v}))} />
          </div>
        )}

        {/* ── Rider form ── */}
        {selectedRole === 'rider' && (
          <div className="glass rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <Bike className="w-4 h-4 text-forest-300" />
              <p className="text-white font-semibold text-sm">Rider Information</p>
            </div>

            <div>
              <p className="text-forest-200/70 text-xs font-medium mb-1.5">Full Name (as on ID) <span className="text-red-400">*</span></p>
              <input value={rider.fullName} onChange={e => setRider(r => ({...r, fullName: e.target.value}))}
                placeholder="Juan dela Cruz" className="w-full input-glass px-3 py-2.5 text-sm" />
            </div>

            <div>
              <p className="text-forest-200/70 text-xs font-medium mb-1.5">Government ID Type <span className="text-red-400">*</span></p>
              <select value={rider.idType} onChange={e => setRider(r => ({...r, idType: e.target.value}))}
                className="w-full input-glass px-3 py-2.5 text-sm">
                {["Driver's License","PhilSys / National ID","SSS / GSIS ID","Passport","Voter's ID","PRC ID","Postal ID"].map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <ImageUpload label="Government ID Photo (front)" required value={rider.idPhoto}
              onChange={v => setRider(r => ({...r, idPhoto: v}))} />

            <ImageUpload label="Selfie holding your ID" required value={rider.selfie}
              onChange={v => setRider(r => ({...r, selfie: v}))} />

            <div>
              <p className="text-forest-200/70 text-xs font-medium mb-1.5">Vehicle Type <span className="text-red-400">*</span></p>
              <select value={rider.vehicleType} onChange={e => setRider(r => ({...r, vehicleType: e.target.value}))}
                className="w-full input-glass px-3 py-2.5 text-sm">
                {['Motorcycle','Bicycle','Electric Bike','Scooter'].map(v => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>

            {rider.vehicleType !== 'Bicycle' && (
              <div>
                <p className="text-forest-200/70 text-xs font-medium mb-1.5">Plate Number (optional)</p>
                <input value={rider.plateNumber} onChange={e => setRider(r => ({...r, plateNumber: e.target.value}))}
                  placeholder="e.g. ABC 1234" className="w-full input-glass px-3 py-2.5 text-sm" />
              </div>
            )}

            <div className="glass-green rounded-xl px-4 py-3">
              <div className="flex items-center gap-2 mb-1">
                <ShieldCheck className="w-4 h-4 text-forest-300" />
                <p className="text-white text-xs font-semibold">Self-declaration</p>
              </div>
              <p className="text-forest-200/60 text-xs">By submitting, I declare that I have no criminal record and all information provided is accurate.</p>
            </div>
          </div>
        )}

        <button onClick={() => { if (validateRequirements()) setStep('payment'); }}
          className="w-full py-4 btn-glow-green text-white font-heading font-bold rounded-2xl flex items-center justify-center gap-2">
          Continue to Payment <ChevronRight className="w-5 h-5" />
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
            <p className="text-forest-200/50 text-xs">{plan?.name} — ₱{plan?.price}/mo</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            {
              key: 'restaurant_owner', label: 'Restaurant Owner', icon: Store,
              color: 'from-ember-600 to-ember-700', glow: 'btn-glow-orange',
              desc: 'Open and manage your restaurant on KinakanGo.',
              privileges: ['Restaurant dashboard','Manage menu & orders','Set delivery fees','View earnings & reviews'],
              requirements: ['Restaurant name & address','Contact number','Restaurant photo','Business permit (optional)'],
            },
            {
              key: 'rider', label: 'Delivery Rider', icon: Bike,
              color: 'from-forest-600 to-forest-700', glow: 'btn-glow-teal',
              desc: 'Earn money delivering orders across your area.',
              privileges: ['Rider dashboard','Accept delivery orders','Daily earnings tracker','Performance rating'],
              requirements: ['Valid government ID','Selfie with ID','Motorcycle / bicycle','Self-declaration form'],
            },
          ].map(role => {
            const Icon = role.icon;
            const isSel = selectedRole === role.key;
            return (
              <div key={role.key} onClick={() => setRole(role.key)}
                className={`glass card-3d rounded-2xl overflow-hidden cursor-pointer transition-all duration-300
                  ${isSel ? 'ring-2 ring-forest-400' : 'hover:glass-green'}`}>
                <div className={`bg-gradient-to-br ${role.color} p-5 flex items-center gap-3`}>
                  <div className={`w-10 h-10 ${role.glow} rounded-xl flex items-center justify-center flex-shrink-0`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-heading font-bold">{role.label}</p>
                    <p className="text-white/70 text-xs">{role.desc}</p>
                  </div>
                  {isSel && <CheckCircle className="w-5 h-5 text-white flex-shrink-0" />}
                </div>
                <div className="p-4 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-forest-200/60 text-[10px] font-semibold uppercase tracking-wide mb-2">What you get</p>
                    <ul className="space-y-1.5">
                      {role.privileges.map((p, i) => (
                        <li key={i} className="flex items-center gap-1.5 text-xs text-forest-100/80">
                          <Check className="w-3 h-3 text-forest-400 flex-shrink-0" /> {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-forest-200/60 text-[10px] font-semibold uppercase tracking-wide mb-2">Requirements</p>
                    <ul className="space-y-1.5">
                      {role.requirements.map((r, i) => (
                        <li key={i} className="flex items-center gap-1.5 text-xs text-forest-100/60">
                          <FileText className="w-3 h-3 text-ember-400 flex-shrink-0" /> {r}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <button onClick={() => setStep('requirements')} disabled={!selectedRole}
          className={`w-full py-4 rounded-2xl font-heading font-bold text-sm flex items-center justify-center gap-2 transition-all
            ${selectedRole ? 'btn-glow-green text-white' : 'glass text-forest-200/30 cursor-not-allowed'}`}>
          Fill in Requirements <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    );
  }

  /* ── Payment step ── */
  if (step === 'payment') {
    const handleProofFile = (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (file.size > 5 * 1024 * 1024) { addNotification('Image must be under 5 MB', 'error'); return; }
      const reader = new FileReader();
      reader.onload = (ev) => { setProof(ev.target.result); setProofPreview(ev.target.result); };
      reader.readAsDataURL(file);
    };
    return (
      <div className="space-y-4 max-w-lg mx-auto animate-fade-up">
        <div className="flex items-center gap-3 mb-2">
          <button onClick={() => setStep('requirements')} className="w-8 h-8 glass rounded-lg flex items-center justify-center">
            <ChevronRight className="w-4 h-4 text-forest-200 rotate-180" />
          </button>
          <h1 className="text-xl font-heading font-bold text-white">Complete Payment</h1>
        </div>

        <div className="glass rounded-2xl p-4 flex items-center gap-4">
          <div className={`w-10 h-10 ${plan?.iconClass} rounded-xl flex items-center justify-center flex-shrink-0`}>
            {plan && <plan.icon className="w-5 h-5 text-white" />}
          </div>
          <div className="flex-1">
            <p className="text-white font-semibold text-sm">{plan?.name}</p>
            <p className="text-forest-200/50 text-xs">{selectedRole === 'restaurant_owner' ? 'Restaurant Owner' : 'Delivery Rider'}</p>
          </div>
          <p className="text-ember-400 font-heading font-bold">₱{plan?.price}<span className="text-forest-200/40 text-xs font-normal">/mo</span></p>
        </div>

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
              <li>Upload the screenshot + reference number below</li>
            </ol>
            <div>
              <p className="text-forest-200/70 text-xs font-medium mb-1.5">GCash Reference Number <span className="text-red-400">*</span></p>
              <input value={refNum} onChange={e => setRefNum(e.target.value)} placeholder="e.g. 1234567890"
                className="w-full input-glass px-3 py-2.5 text-sm" />
            </div>
          </div>
        )}

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

        {payMethod && (
          <div className="animate-fade-up">
            <p className="text-forest-200/70 text-xs font-medium mb-1.5">
              {payMethod === 'gcash' ? 'GCash Payment Screenshot' : 'Cash Receipt Photo'} <span className="text-red-400">*</span>
            </p>
            <input ref={proofRef} type="file" accept="image/*" className="hidden" onChange={handleProofFile} />
            {proofPreview ? (
              <div className="relative rounded-2xl overflow-hidden">
                <img src={proofPreview} alt="proof" className="w-full max-h-56 object-contain glass rounded-2xl" />
                <button onClick={() => { setProof(null); setProofPreview(null); }}
                  className="absolute top-2 right-2 w-7 h-7 btn-glow-orange rounded-full flex items-center justify-center">
                  <X className="w-3.5 h-3.5 text-white" />
                </button>
              </div>
            ) : (
              <button onClick={() => proofRef.current?.click()}
                className="w-full glass rounded-2xl py-10 flex flex-col items-center gap-3 hover:glass-green transition-all border-2 border-dashed border-white/10 hover:border-forest-400/30">
                <Upload className="w-8 h-8 text-forest-300/40" />
                <p className="text-forest-200/50 text-sm">Tap to upload screenshot</p>
                <p className="text-forest-200/30 text-xs">JPG, PNG · max 5 MB</p>
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
          Become a Restaurant Owner or Rider. Pay via GCash or cash, submit your documents, and get approved within 24 hours.
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

      <div className="glass rounded-2xl p-5">
        <p className="text-white font-semibold mb-4">How it works</p>
        <div className="space-y-3">
          {[
            { n:'1', t:'Choose a plan',           d:'Premium (₱299/mo) or Business Pro (₱999/mo)' },
            { n:'2', t:'Pick your role',           d:'Restaurant Owner or Delivery Rider' },
            { n:'3', t:'Submit requirements',      d:'Fill in details and upload required documents' },
            { n:'4', t:'Pay via GCash or Cash',   d:'Upload screenshot or receipt as proof' },
            { n:'5', t:'Admin reviews (1–24 hrs)', d:'We verify documents and payment' },
            { n:'6', t:'Access unlocked',          d:'Login to your Restaurant or Rider dashboard' },
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
