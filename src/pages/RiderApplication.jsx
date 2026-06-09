import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bike, Upload, CheckCircle, AlertCircle } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import { useNotification } from '../context/NotificationContext';

export default function RiderApplication() {
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    fullName: '',
    dateOfBirth: '',
    address: '',
    contactNumber: '',
    email: '',
    emergencyContact: '',
    emergencyName: '',
    vehicleType: '',
    vehiclePlateNumber: '',
    vehicleModel: '',
    driverLicense: null,
    vehicleRegistration: null,
    nbiClearance: null,
    validId: null,
    proofOfAddress: null,
    profilePhoto: null,
    idType: '',
    bankName: '',
    accountNumber: '',
    accountName: '',
  });

  const vehicleTypes = ['Motorcycle', 'Bicycle', 'Scooter', 'Car'];
  const idTypes = ['Passport', 'Driver\'s License', 'SSS ID', 'UMID', 'Voter\'s ID', 'Postal ID'];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e, fieldName) => {
    const file = e.target.files[0];
    setFormData(prev => ({ ...prev, [fieldName]: file }));
  };

  const validateStep1 = () => {
    if (!formData.fullName || !formData.dateOfBirth || !formData.address || !formData.contactNumber || !formData.email) {
      showError('Please fill in all required fields');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.emergencyContact || !formData.emergencyName) {
      showError('Please fill in emergency contact information');
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
    if (!formData.vehicleType || !formData.vehiclePlateNumber) {
      showError('Please fill in all vehicle information');
      return false;
    }
    return true;
  };

  const validateStep4 = () => {
    if (!formData.driverLicense || !formData.vehicleRegistration || !formData.nbiClearance || !formData.validId || !formData.proofOfAddress) {
      showError('Please upload all required documents');
      return false;
    }
    return true;
  };

  const validateStep5 = () => {
    if (!formData.profilePhoto || !formData.bankName || !formData.accountNumber || !formData.accountName) {
      showError('Please complete all final requirements');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    let isValid = false;
    switch(step) {
      case 1: isValid = validateStep1(); break;
      case 2: isValid = validateStep2(); break;
      case 3: isValid = validateStep3(); break;
      case 4: isValid = validateStep4(); break;
      case 5: isValid = validateStep5(); break;
      default: isValid = true;
    }

    if (isValid && step < 5) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = () => {
    if (!validateStep5()) return;

    console.log('Rider application submitted:', formData);
    showSuccess('Application submitted successfully! We\'ll review it within 2-5 business days.');

    setTimeout(() => {
      navigate('/profile');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 py-12">
      <div className="container-custom max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full mb-4">
            <Bike className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-heading font-bold mb-3">Rider Application</h1>
          <p className="text-lg text-secondary-600">
            Join our team of riders and start earning on your own schedule
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4, 5].map((s) => (
              <div key={s} className="flex items-center flex-1">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold transition-all ${
                  step >= s
                    ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white scale-110'
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {step > s ? <CheckCircle className="w-6 h-6" /> : s}
                </div>
                {s < 5 && (
                  <div className={`flex-1 h-1 mx-2 rounded transition-all ${
                    step > s ? 'bg-blue-500' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-secondary-600">
            <span>Personal</span>
            <span>Emergency</span>
            <span>Vehicle</span>
            <span>Documents</span>
            <span>Finalize</span>
          </div>
        </div>

        {/* Form Steps */}
        <Card className="p-8">
          {/* Step 1: Personal Information */}
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold mb-6">Personal Information</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  placeholder="Enter your full name"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date of Birth <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="contactNumber"
                    value={formData.contactNumber}
                    onChange={handleInputChange}
                    placeholder="+63 XXX XXX XXXX"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="your.email@example.com"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Complete Address <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Enter your complete address"
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          )}

          {/* Step 2: Emergency Contact */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold mb-6">Emergency Contact Information</h2>

              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-semibold mb-1">Important:</p>
                    <p>Provide emergency contact information of someone who can be reached in case of emergencies.</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Emergency Contact Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="emergencyName"
                  value={formData.emergencyName}
                  onChange={handleInputChange}
                  placeholder="Enter emergency contact name"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Emergency Contact Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="emergencyContact"
                  value={formData.emergencyContact}
                  onChange={handleInputChange}
                  placeholder="+63 XXX XXX XXXX"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          )}

          {/* Step 3: Vehicle Information */}
          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold mb-6">Vehicle Information</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vehicle Type <span className="text-red-500">*</span>
                </label>
                <select
                  name="vehicleType"
                  value={formData.vehicleType}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select vehicle type</option>
                  {vehicleTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Plate Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="vehiclePlateNumber"
                    value={formData.vehiclePlateNumber}
                    onChange={handleInputChange}
                    placeholder="ABC 1234"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vehicle Model/Brand
                  </label>
                  <input
                    type="text"
                    name="vehicleModel"
                    value={formData.vehicleModel}
                    onChange={handleInputChange}
                    placeholder="e.g., Honda Wave 125"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Documents */}
          {step === 4 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold mb-6">Required Documents</h2>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-semibold mb-1">Important:</p>
                    <p>All documents must be valid, clear, and readable. Accepted formats: PDF, JPG, PNG (max 5MB each)</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Driver's License <span className="text-red-500">*</span>
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-blue-400 transition-colors cursor-pointer">
                  <input
                    type="file"
                    onChange={(e) => handleFileChange(e, 'driverLicense')}
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    id="license-upload"
                  />
                  <label htmlFor="license-upload" className="cursor-pointer">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">
                      {formData.driverLicense ? formData.driverLicense.name : 'Click to upload Driver\'s License'}
                    </p>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vehicle Registration (OR/CR) <span className="text-red-500">*</span>
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-blue-400 transition-colors cursor-pointer">
                  <input
                    type="file"
                    onChange={(e) => handleFileChange(e, 'vehicleRegistration')}
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    id="registration-upload"
                  />
                  <label htmlFor="registration-upload" className="cursor-pointer">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">
                      {formData.vehicleRegistration ? formData.vehicleRegistration.name : 'Click to upload Vehicle Registration'}
                    </p>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  NBI or Police Clearance <span className="text-red-500">*</span>
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-blue-400 transition-colors cursor-pointer">
                  <input
                    type="file"
                    onChange={(e) => handleFileChange(e, 'nbiClearance')}
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    id="clearance-upload"
                  />
                  <label htmlFor="clearance-upload" className="cursor-pointer">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">
                      {formData.nbiClearance ? formData.nbiClearance.name : 'Click to upload NBI/Police Clearance'}
                    </p>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Valid ID <span className="text-red-500">*</span>
                </label>
                <select
                  name="idType"
                  value={formData.idType}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-3"
                >
                  <option value="">Select ID type</option>
                  {idTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-blue-400 transition-colors cursor-pointer">
                  <input
                    type="file"
                    onChange={(e) => handleFileChange(e, 'validId')}
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    id="valid-id-upload"
                  />
                  <label htmlFor="valid-id-upload" className="cursor-pointer">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">
                      {formData.validId ? formData.validId.name : 'Click to upload Valid ID'}
                    </p>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Proof of Address <span className="text-red-500">*</span>
                </label>
                <p className="text-xs text-gray-500 mb-2">Utility bill, bank statement, or barangay certificate</p>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-blue-400 transition-colors cursor-pointer">
                  <input
                    type="file"
                    onChange={(e) => handleFileChange(e, 'proofOfAddress')}
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    id="proof-address-upload"
                  />
                  <label htmlFor="proof-address-upload" className="cursor-pointer">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">
                      {formData.proofOfAddress ? formData.proofOfAddress.name : 'Click to upload Proof of Address'}
                    </p>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Final Requirements */}
          {step === 5 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold mb-6">Final Requirements</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Profile Photo <span className="text-red-500">*</span>
                </label>
                <p className="text-xs text-gray-500 mb-2">Upload a clear photo of yourself for your rider profile</p>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-blue-400 transition-colors cursor-pointer">
                  <input
                    type="file"
                    onChange={(e) => handleFileChange(e, 'profilePhoto')}
                    accept="image/*"
                    className="hidden"
                    id="profile-photo-upload"
                  />
                  <label htmlFor="profile-photo-upload" className="cursor-pointer">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">
                      {formData.profilePhoto ? formData.profilePhoto.name : 'Click to upload Profile Photo'}
                    </p>
                  </label>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="font-semibold mb-4">Bank Account Information (for earnings payout)</h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bank Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="bankName"
                      value={formData.bankName}
                      onChange={handleInputChange}
                      placeholder="e.g., BDO, BPI, Metrobank"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Account Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="accountNumber"
                      value={formData.accountNumber}
                      onChange={handleInputChange}
                      placeholder="Enter account number"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Account Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="accountName"
                      value={formData.accountName}
                      onChange={handleInputChange}
                      placeholder="Name as shown on bank account"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-xl p-4 mt-6">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-green-800">
                    <p className="font-semibold mb-1">Review Your Application</p>
                    <p>Please review all information before submitting. Once submitted, your application will be reviewed by our team within 2-5 business days.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={step === 1}
            >
              Back
            </Button>

            <div className="text-sm text-gray-500">
              Step {step} of 5
            </div>

            {step < 5 ? (
              <Button
                variant="primary"
                onClick={handleNext}
                className="bg-gradient-to-r from-blue-500 to-blue-600"
              >
                Next
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={handleSubmit}
                className="bg-gradient-to-r from-green-500 to-green-600"
              >
                Submit Application
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
