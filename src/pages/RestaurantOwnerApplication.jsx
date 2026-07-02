import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, Upload, CheckCircle, AlertCircle } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';

const CUISINE_TYPES = [
  'Filipino','Chinese','Japanese','Korean','Italian','American',
  'Mexican','Thai','Indian','Fast Food','Bakery','Cafe','Desserts',
];
const ID_TYPES = ['Passport',"Driver's License",'SSS ID','UMID',"Voter's ID",'Postal ID'];
const STEP_LABELS = ['Basic Info','Restaurant','Documents','Photos','Owner Info'];

const EMPTY = {
  restaurantName:'', businessAddress:'', contactNumber:'', email:'',
  cuisine:'', description:'',
  bir:null, businessPermit:null, foodSafetyPermit:null,
  restaurantPhotos:[], menuPhotos:[],
  ownerName:'', ownerIdType:'', ownerId:null,
};

function FileUpload({ label, hint, file, onChange, inputId, multiple }) {
  const hasFile = multiple ? (file && file.length > 0) : !!file;
  const label2  = multiple
    ? (hasFile ? `${file.length} photo(s) selected` : 'Click to upload')
    : (hasFile ? file.name : 'Click to upload');
  return (
    <div>
      <label className="block text-forest-200/60 text-xs font-medium mb-1.5">
        {label} <span className="text-red-400">*</span>
      </label>
      {hint && <p className="text-forest-200/40 text-xs mb-2">{hint}</p>}
      <div className="border-2 border-dashed border-forest-600/40 rounded-xl p-6 text-center hover:border-ember-500/60 hover:glass-orange transition-all cursor-pointer">
        <input type="file" onChange={onChange} accept={multiple ? 'image/*' : '.pdf,.jpg,.jpeg,.png'} multiple={multiple} className="hidden" id={inputId} />
        <label htmlFor={inputId} className="cursor-pointer flex flex-col items-center gap-2">
          <Upload className={`w-7 h-7 ${hasFile ? 'text-forest-400' : 'text-forest-300/30'}`} />
          <span className="text-sm text-forest-200/60 hover:text-forest-100 transition-colors">{label2}</span>
          {hasFile && <CheckCircle className="w-4 h-4 text-forest-400" />}
        </label>
      </div>
    </div>
  );
}

export default function RestaurantOwnerApplication() {
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  const [step, setStep]         = useState(1);
  const [formData, setFormData] = useState(EMPTY);

  const set = e => {
    const { name, value } = e.target;
    setFormData(p => ({ ...p, [name]: value }));
  };
  const setFile = (e, field) => {
    const files = e.target.files;
    if (field === 'restaurantPhotos' || field === 'menuPhotos') {
      setFormData(p => ({ ...p, [field]: Array.from(files) }));
    } else {
      setFormData(p => ({ ...p, [field]: files[0] }));
    }
  };

  const validate = () => {
    const errs = {
      1: () => !formData.restaurantName || !formData.businessAddress || !formData.contactNumber || !formData.email,
      2: () => !formData.cuisine || !formData.description,
      3: () => !formData.bir || !formData.businessPermit || !formData.foodSafetyPermit,
      4: () => formData.restaurantPhotos.length === 0 || formData.menuPhotos.length === 0,
      5: () => !formData.ownerName || !formData.ownerIdType || !formData.ownerId,
    };
    if (errs[step]?.()) {
      showError(step === 3 || step === 4 ? 'Please upload all required files' : 'Please fill in all required fields');
      return false;
    }
    return true;
  };

  const handleNext   = () => { if (validate() && step < 5) setStep(s => s + 1); };
  const handleBack   = () => { if (step > 1) setStep(s => s - 1); };
  const handleSubmit = () => {
    if (!validate()) return;
    showSuccess("Application submitted! We'll review it within 2–5 business days.");
    setTimeout(() => navigate('/profile'), 2000);
  };

  const INPUT = 'w-full input-glass py-3 text-sm';

  return (
    <div className="container-custom max-w-3xl py-10 animate-fade-up">

      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 btn-glow-orange rounded-2xl mb-4">
          <Store className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-heading font-bold text-white mb-2">Restaurant Owner Application</h1>
        <p className="text-forest-200/60">Complete the form to list your restaurant on Kinakan Go</p>
      </div>

      {/* Progress stepper */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {[1, 2, 3, 4, 5].map(s => (
            <div key={s} className="flex items-center flex-1">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold text-sm transition-all
                ${step > s ? 'btn-glow-green text-white scale-110' : step === s ? 'btn-glow-orange text-white scale-110' : 'glass text-forest-200/40'}`}>
                {step > s ? <CheckCircle className="w-5 h-5" /> : s}
              </div>
              {s < 5 && (
                <div className={`flex-1 h-1 mx-2 rounded-full transition-all ${step > s ? 'bg-gradient-to-r from-forest-500 to-ember-500' : 'glass'}`} />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2 text-xs text-forest-200/40">
          {STEP_LABELS.map(l => <span key={l}>{l}</span>)}
        </div>
      </div>

      {/* Form card */}
      <div className="glass rounded-3xl p-6 md:p-8">

        {/* Step 1 — Basic Info */}
        {step === 1 && (
          <div className="space-y-5">
            <h2 className="text-white font-heading font-bold text-xl mb-5">Basic Information</h2>
            <div>
              <label className="block text-forest-200/60 text-xs font-medium mb-1.5">Restaurant Name <span className="text-red-400">*</span></label>
              <input type="text" name="restaurantName" value={formData.restaurantName} onChange={set} placeholder="Enter restaurant name" className={INPUT} />
            </div>
            <div>
              <label className="block text-forest-200/60 text-xs font-medium mb-1.5">Business Address <span className="text-red-400">*</span></label>
              <textarea name="businessAddress" value={formData.businessAddress} onChange={set} placeholder="Enter complete business address" rows={3} className={`${INPUT} resize-none`} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-forest-200/60 text-xs font-medium mb-1.5">Contact Number <span className="text-red-400">*</span></label>
                <input type="tel" name="contactNumber" value={formData.contactNumber} onChange={set} placeholder="+63 XXX XXX XXXX" className={INPUT} />
              </div>
              <div>
                <label className="block text-forest-200/60 text-xs font-medium mb-1.5">Email Address <span className="text-red-400">*</span></label>
                <input type="email" name="email" value={formData.email} onChange={set} placeholder="restaurant@example.com" className={INPUT} />
              </div>
            </div>
          </div>
        )}

        {/* Step 2 — Restaurant Details */}
        {step === 2 && (
          <div className="space-y-5">
            <h2 className="text-white font-heading font-bold text-xl mb-5">Restaurant Details</h2>
            <div>
              <label className="block text-forest-200/60 text-xs font-medium mb-1.5">Cuisine Type <span className="text-red-400">*</span></label>
              <select name="cuisine" value={formData.cuisine} onChange={set} className={INPUT}>
                <option value="" style={{ background:'#0d2b1a' }}>Select cuisine type</option>
                {CUISINE_TYPES.map(t => <option key={t} value={t} style={{ background:'#0d2b1a' }}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-forest-200/60 text-xs font-medium mb-1.5">Restaurant Description <span className="text-red-400">*</span></label>
              <textarea name="description" value={formData.description} onChange={set}
                placeholder="Describe your restaurant, specialties, and what makes it unique..."
                rows={6} className={`${INPUT} resize-none`} />
              <p className="text-forest-200/30 text-xs mt-1">{formData.description.length} / 500 characters</p>
            </div>
          </div>
        )}

        {/* Step 3 — Legal Documents */}
        {step === 3 && (
          <div className="space-y-5">
            <h2 className="text-white font-heading font-bold text-xl mb-5">Legal Documents</h2>
            <div className="glass rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-ember-400 flex-shrink-0 mt-0.5" />
              <p className="text-forest-200/70 text-sm">All documents must be valid and clear. Accepted: PDF, JPG, PNG (max 5 MB each)</p>
            </div>
            <FileUpload label="BIR Certificate of Registration" file={formData.bir} onChange={e => setFile(e, 'bir')} inputId="bir-upload" />
            <FileUpload label="Business Permit" file={formData.businessPermit} onChange={e => setFile(e, 'businessPermit')} inputId="permit-upload" />
            <FileUpload label="Food Safety / Sanitary Permit" file={formData.foodSafetyPermit} onChange={e => setFile(e, 'foodSafetyPermit')} inputId="food-permit-upload" />
          </div>
        )}

        {/* Step 4 — Photos */}
        {step === 4 && (
          <div className="space-y-5">
            <h2 className="text-white font-heading font-bold text-xl mb-5">Restaurant & Menu Photos</h2>
            <FileUpload
              label="Restaurant Photos"
              hint="Exterior, interior, and ambiance photos (min 1, max 10)"
              file={formData.restaurantPhotos}
              onChange={e => setFile(e, 'restaurantPhotos')}
              inputId="restaurant-photos-upload"
              multiple
            />
            <FileUpload
              label="Menu Photos"
              hint="Clear photos of your menu or individual dishes (min 1, max 20)"
              file={formData.menuPhotos}
              onChange={e => setFile(e, 'menuPhotos')}
              inputId="menu-photos-upload"
              multiple
            />
          </div>
        )}

        {/* Step 5 — Owner Info */}
        {step === 5 && (
          <div className="space-y-5">
            <h2 className="text-white font-heading font-bold text-xl mb-5">Owner Information</h2>
            <div>
              <label className="block text-forest-200/60 text-xs font-medium mb-1.5">Full Name (as shown on ID) <span className="text-red-400">*</span></label>
              <input type="text" name="ownerName" value={formData.ownerName} onChange={set} placeholder="Enter full name" className={INPUT} />
            </div>
            <div>
              <label className="block text-forest-200/60 text-xs font-medium mb-1.5">ID Type <span className="text-red-400">*</span></label>
              <select name="ownerIdType" value={formData.ownerIdType} onChange={set} className={INPUT}>
                <option value="" style={{ background:'#0d2b1a' }}>Select ID type</option>
                {ID_TYPES.map(t => <option key={t} value={t} style={{ background:'#0d2b1a' }}>{t}</option>)}
              </select>
            </div>
            <FileUpload
              label="Upload Valid ID"
              file={formData.ownerId}
              onChange={e => setFile(e, 'ownerId')}
              inputId="owner-id-upload"
            />
            <div className="glass-green rounded-xl p-4 flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-forest-400 flex-shrink-0 mt-0.5" />
              <p className="text-forest-100/80 text-sm">Please review all information before submitting. Our team will review your application within 2–5 business days.</p>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pt-6" style={{ borderTop: '1px solid rgba(255,255,255,.08)' }}>
          <button onClick={handleBack} disabled={step === 1}
            className="glass hover:glass-green transition-all text-forest-200/70 hover:text-white disabled:opacity-30 text-sm font-medium px-5 py-2.5 rounded-xl">
            Back
          </button>
          <span className="text-forest-200/40 text-xs">Step {step} of 5</span>
          {step < 5 ? (
            <button onClick={handleNext} className="btn-glow-orange text-white text-sm font-semibold px-6 py-2.5 rounded-xl">
              Next
            </button>
          ) : (
            <button onClick={handleSubmit} className="btn-glow-green text-white text-sm font-semibold px-6 py-2.5 rounded-xl flex items-center gap-2">
              <CheckCircle className="w-4 h-4" /> Submit Application
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
