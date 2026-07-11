import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bike, Upload, CheckCircle, AlertCircle } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';

const VEHICLE_TYPES = ['Motorcycle', 'Bicycle', 'Scooter', 'Car'];
const ID_TYPES      = ['Passport', "Driver's License", 'SSS ID', 'UMID', "Voter's ID", 'Postal ID'];

const STEP_LABELS = ['Personal', 'Emergency', 'Vehicle', 'Documents', 'Finalize'];

const EMPTY = {
  fullName: '', dateOfBirth: '', address: '', contactNumber: '', email: '',
  emergencyContact: '', emergencyName: '',
  vehicleType: '', vehiclePlateNumber: '', vehicleModel: '',
  driverLicense: null, vehicleRegistration: null, nbiClearance: null, validId: null, proofOfAddress: null,
  profilePhoto: null, idType: '',
};

function FileUpload({ label, hint, fieldName, file, onChange, inputId }) {
  return (
    <div>
      <label className="block text-forest-200/60 text-xs font-medium mb-1.5">
        {label} <span className="text-red-400">*</span>
      </label>
      {hint && <p className="text-forest-200/40 text-xs mb-2">{hint}</p>}
      <div className="border-2 border-dashed border-forest-600/40 rounded-xl p-6 text-center hover:border-ember-500/60 hover:glass-orange transition-all cursor-pointer">
        <input type="file" onChange={onChange} accept=".pdf,.jpg,.jpeg,.png" className="hidden" id={inputId} />
        <label htmlFor={inputId} className="cursor-pointer flex flex-col items-center gap-2">
          <Upload className={`w-7 h-7 ${file ? 'text-forest-400' : 'text-forest-300/30'}`} />
          <span className="text-sm text-forest-200/60 hover:text-forest-100 transition-colors">
            {file ? file.name : 'Click to upload'}
          </span>
          {file && <CheckCircle className="w-4 h-4 text-forest-400" />}
        </label>
      </div>
    </div>
  );
}

export default function RiderApplication() {
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  const [step, setStep]       = useState(1);
  const [formData, setFormData] = useState(EMPTY);

  const set = e => {
    const { name, value } = e.target;
    setFormData(p => ({ ...p, [name]: value }));
  };
  const setFile = (e, field) => {
    setFormData(p => ({ ...p, [field]: e.target.files[0] }));
  };

  const validate = () => {
    const errs = {
      1: () => !formData.fullName || !formData.dateOfBirth || !formData.address || !formData.contactNumber || !formData.email,
      2: () => !formData.emergencyContact || !formData.emergencyName,
      3: () => !formData.vehicleType || !formData.vehiclePlateNumber,
      4: () => !formData.driverLicense || !formData.vehicleRegistration || !formData.nbiClearance || !formData.validId || !formData.proofOfAddress,
      5: () => !formData.profilePhoto,
    };
    if (errs[step]?.()) {
      showError(step === 4 || step === 5 ? 'Please complete all required fields / uploads' : 'Please fill in all required fields');
      return false;
    }
    return true;
  };

  const handleNext = () => { if (validate() && step < 5) setStep(s => s + 1); };
  const handleBack = () => { if (step > 1) setStep(s => s - 1); };
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
          <Bike className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-heading font-bold text-white mb-2">Rider Application</h1>
        <p className="text-forest-200/60">Join our team and start earning on your own schedule</p>
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

        {/* Step 1 */}
        {step === 1 && (
          <div className="space-y-5">
            <h2 className="text-white font-heading font-bold text-xl mb-5">Personal Information</h2>
            <div>
              <label className="block text-forest-200/60 text-xs font-medium mb-1.5">Full Name <span className="text-red-400">*</span></label>
              <input type="text" name="fullName" value={formData.fullName} onChange={set} placeholder="Enter your full name" className={INPUT} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-forest-200/60 text-xs font-medium mb-1.5">Date of Birth <span className="text-red-400">*</span></label>
                <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={set} className={INPUT} />
              </div>
              <div>
                <label className="block text-forest-200/60 text-xs font-medium mb-1.5">Contact Number <span className="text-red-400">*</span></label>
                <input type="tel" name="contactNumber" value={formData.contactNumber} onChange={set} placeholder="+63 XXX XXX XXXX" className={INPUT} />
              </div>
            </div>
            <div>
              <label className="block text-forest-200/60 text-xs font-medium mb-1.5">Email Address <span className="text-red-400">*</span></label>
              <input type="email" name="email" value={formData.email} onChange={set} placeholder="your.email@example.com" className={INPUT} />
            </div>
            <div>
              <label className="block text-forest-200/60 text-xs font-medium mb-1.5">Complete Address <span className="text-red-400">*</span></label>
              <textarea name="address" value={formData.address} onChange={set} placeholder="Enter your complete address" rows={3} className={`${INPUT} resize-none`} />
            </div>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div className="space-y-5">
            <h2 className="text-white font-heading font-bold text-xl mb-5">Emergency Contact</h2>
            <div className="glass rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-ember-400 flex-shrink-0 mt-0.5" />
              <p className="text-forest-200/70 text-sm">Provide someone who can be reached in case of emergencies.</p>
            </div>
            <div>
              <label className="block text-forest-200/60 text-xs font-medium mb-1.5">Emergency Contact Name <span className="text-red-400">*</span></label>
              <input type="text" name="emergencyName" value={formData.emergencyName} onChange={set} placeholder="Enter emergency contact name" className={INPUT} />
            </div>
            <div>
              <label className="block text-forest-200/60 text-xs font-medium mb-1.5">Emergency Contact Number <span className="text-red-400">*</span></label>
              <input type="tel" name="emergencyContact" value={formData.emergencyContact} onChange={set} placeholder="+63 XXX XXX XXXX" className={INPUT} />
            </div>
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <div className="space-y-5">
            <h2 className="text-white font-heading font-bold text-xl mb-5">Vehicle Information</h2>
            <div>
              <label className="block text-forest-200/60 text-xs font-medium mb-1.5">Vehicle Type <span className="text-red-400">*</span></label>
              <select name="vehicleType" value={formData.vehicleType} onChange={set} className={INPUT}>
                <option value="" style={{ background:'#0d2b1a' }}>Select vehicle type</option>
                {VEHICLE_TYPES.map(t => <option key={t} value={t} style={{ background:'#0d2b1a' }}>{t}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-forest-200/60 text-xs font-medium mb-1.5">Plate Number <span className="text-red-400">*</span></label>
                <input type="text" name="vehiclePlateNumber" value={formData.vehiclePlateNumber} onChange={set} placeholder="ABC 1234" className={INPUT} />
              </div>
              <div>
                <label className="block text-forest-200/60 text-xs font-medium mb-1.5">Vehicle Model / Brand</label>
                <input type="text" name="vehicleModel" value={formData.vehicleModel} onChange={set} placeholder="e.g., Honda Wave 125" className={INPUT} />
              </div>
            </div>
          </div>
        )}

        {/* Step 4 */}
        {step === 4 && (
          <div className="space-y-5">
            <h2 className="text-white font-heading font-bold text-xl mb-5">Required Documents</h2>
            <div className="glass rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-ember-400 flex-shrink-0 mt-0.5" />
              <p className="text-forest-200/70 text-sm">All documents must be valid and clear. Accepted: PDF, JPG, PNG (max 5 MB each)</p>
            </div>
            <FileUpload label="Driver's License" fieldName="driverLicense" file={formData.driverLicense} onChange={e => setFile(e, 'driverLicense')} inputId="license-upload" />
            <FileUpload label="Vehicle Registration (OR/CR)" fieldName="vehicleRegistration" file={formData.vehicleRegistration} onChange={e => setFile(e, 'vehicleRegistration')} inputId="registration-upload" />
            <FileUpload label="NBI or Police Clearance" fieldName="nbiClearance" file={formData.nbiClearance} onChange={e => setFile(e, 'nbiClearance')} inputId="clearance-upload" />
            <div>
              <label className="block text-forest-200/60 text-xs font-medium mb-1.5">Valid ID — Type <span className="text-red-400">*</span></label>
              <select name="idType" value={formData.idType} onChange={set} className={`${INPUT} mb-3`}>
                <option value="" style={{ background:'#0d2b1a' }}>Select ID type</option>
                {ID_TYPES.map(t => <option key={t} value={t} style={{ background:'#0d2b1a' }}>{t}</option>)}
              </select>
              <FileUpload label="Valid ID Upload" fieldName="validId" file={formData.validId} onChange={e => setFile(e, 'validId')} inputId="valid-id-upload" />
            </div>
            <FileUpload label="Proof of Address" hint="Utility bill, bank statement, or barangay certificate" fieldName="proofOfAddress" file={formData.proofOfAddress} onChange={e => setFile(e, 'proofOfAddress')} inputId="proof-address-upload" />
          </div>
        )}

        {/* Step 5 */}
        {step === 5 && (
          <div className="space-y-5">
            <h2 className="text-white font-heading font-bold text-xl mb-5">Final Requirements</h2>
            <FileUpload label="Profile Photo" hint="Clear photo of yourself for your rider profile" fieldName="profilePhoto" file={formData.profilePhoto} onChange={e => setFormData(p => ({ ...p, profilePhoto: e.target.files[0] }))} inputId="profile-photo-upload" />
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
