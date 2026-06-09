import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import { useNotification } from '../context/NotificationContext';

export default function RestaurantOwnerApplication() {
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    restaurantName: '',
    businessAddress: '',
    contactNumber: '',
    email: '',
    cuisine: '',
    description: '',
    bir: null,
    businessPermit: null,
    foodSafetyPermit: null,
    restaurantPhotos: [],
    menuPhotos: [],
    ownerName: '',
    ownerIdType: '',
    ownerId: null,
  });

  const cuisineTypes = [
    'Filipino', 'Chinese', 'Japanese', 'Korean', 'Italian', 'American',
    'Mexican', 'Thai', 'Indian', 'Fast Food', 'Bakery', 'Cafe', 'Desserts'
  ];

  const idTypes = ['Passport', 'Driver\'s License', 'SSS ID', 'UMID', 'Voter\'s ID', 'Postal ID'];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e, fieldName) => {
    const files = e.target.files;
    if (fieldName === 'restaurantPhotos' || fieldName === 'menuPhotos') {
      setFormData(prev => ({ ...prev, [fieldName]: Array.from(files) }));
    } else {
      setFormData(prev => ({ ...prev, [fieldName]: files[0] }));
    }
  };

  const validateStep1 = () => {
    if (!formData.restaurantName || !formData.businessAddress || !formData.contactNumber || !formData.email) {
      showError('Please fill in all required fields');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.cuisine || !formData.description) {
      showError('Please fill in all required fields');
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
    if (!formData.bir || !formData.businessPermit || !formData.foodSafetyPermit) {
      showError('Please upload all required documents');
      return false;
    }
    return true;
  };

  const validateStep4 = () => {
    if (formData.restaurantPhotos.length === 0 || formData.menuPhotos.length === 0) {
      showError('Please upload at least one restaurant photo and menu photo');
      return false;
    }
    return true;
  };

  const validateStep5 = () => {
    if (!formData.ownerName || !formData.ownerIdType || !formData.ownerId) {
      showError('Please fill in all owner information fields');
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

    // Here you would send the application to the backend
    console.log('Application submitted:', formData);
    showSuccess('Application submitted successfully! We\'ll review it within 2-5 business days.');

    setTimeout(() => {
      navigate('/profile');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 py-12">
      <div className="container-custom max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full mb-4">
            <Store className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-heading font-bold mb-3">Restaurant Owner Application</h1>
          <p className="text-lg text-secondary-600">
            Complete the application form to list your restaurant on Kinakan Go
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4, 5].map((s) => (
              <div key={s} className="flex items-center flex-1">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold transition-all ${
                  step >= s
                    ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white scale-110'
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {step > s ? <CheckCircle className="w-6 h-6" /> : s}
                </div>
                {s < 5 && (
                  <div className={`flex-1 h-1 mx-2 rounded transition-all ${
                    step > s ? 'bg-orange-500' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-secondary-600">
            <span>Basic Info</span>
            <span>Restaurant</span>
            <span>Documents</span>
            <span>Photos</span>
            <span>Owner Info</span>
          </div>
        </div>

        {/* Form Steps */}
        <Card className="p-8">
          {/* Step 1: Basic Information */}
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold mb-6">Basic Information</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Restaurant Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="restaurantName"
                  value={formData.restaurantName}
                  onChange={handleInputChange}
                  placeholder="Enter restaurant name"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Address <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="businessAddress"
                  value={formData.businessAddress}
                  onChange={handleInputChange}
                  placeholder="Enter complete business address"
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
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
                    placeholder="restaurant@example.com"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Restaurant Details */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold mb-6">Restaurant Details</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cuisine Type <span className="text-red-500">*</span>
                </label>
                <select
                  name="cuisine"
                  value={formData.cuisine}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="">Select cuisine type</option>
                  {cuisineTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Restaurant Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe your restaurant, specialties, and what makes it unique..."
                  rows={6}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
                <p className="text-sm text-gray-500 mt-2">
                  {formData.description.length} / 500 characters
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Legal Documents */}
          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold mb-6">Legal Documents</h2>
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
                  BIR Certificate of Registration <span className="text-red-500">*</span>
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-orange-400 transition-colors cursor-pointer">
                  <input
                    type="file"
                    onChange={(e) => handleFileChange(e, 'bir')}
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    id="bir-upload"
                  />
                  <label htmlFor="bir-upload" className="cursor-pointer">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">
                      {formData.bir ? formData.bir.name : 'Click to upload BIR Certificate'}
                    </p>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Permit <span className="text-red-500">*</span>
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-orange-400 transition-colors cursor-pointer">
                  <input
                    type="file"
                    onChange={(e) => handleFileChange(e, 'businessPermit')}
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    id="permit-upload"
                  />
                  <label htmlFor="permit-upload" className="cursor-pointer">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">
                      {formData.businessPermit ? formData.businessPermit.name : 'Click to upload Business Permit'}
                    </p>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Food Safety Permit / Sanitary Permit <span className="text-red-500">*</span>
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-orange-400 transition-colors cursor-pointer">
                  <input
                    type="file"
                    onChange={(e) => handleFileChange(e, 'foodSafetyPermit')}
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    id="food-permit-upload"
                  />
                  <label htmlFor="food-permit-upload" className="cursor-pointer">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">
                      {formData.foodSafetyPermit ? formData.foodSafetyPermit.name : 'Click to upload Food Safety Permit'}
                    </p>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Photos */}
          {step === 4 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold mb-6">Restaurant & Menu Photos</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Restaurant Photos <span className="text-red-500">*</span>
                </label>
                <p className="text-sm text-gray-500 mb-3">Upload photos of your restaurant exterior, interior, and ambiance (minimum 1, maximum 10)</p>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-orange-400 transition-colors cursor-pointer">
                  <input
                    type="file"
                    onChange={(e) => handleFileChange(e, 'restaurantPhotos')}
                    accept="image/*"
                    multiple
                    className="hidden"
                    id="restaurant-photos-upload"
                  />
                  <label htmlFor="restaurant-photos-upload" className="cursor-pointer">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">
                      {formData.restaurantPhotos.length > 0
                        ? `${formData.restaurantPhotos.length} photo(s) selected`
                        : 'Click to upload restaurant photos'}
                    </p>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Menu Photos <span className="text-red-500">*</span>
                </label>
                <p className="text-sm text-gray-500 mb-3">Upload clear photos of your menu or individual dishes (minimum 1, maximum 20)</p>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-orange-400 transition-colors cursor-pointer">
                  <input
                    type="file"
                    onChange={(e) => handleFileChange(e, 'menuPhotos')}
                    accept="image/*"
                    multiple
                    className="hidden"
                    id="menu-photos-upload"
                  />
                  <label htmlFor="menu-photos-upload" className="cursor-pointer">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">
                      {formData.menuPhotos.length > 0
                        ? `${formData.menuPhotos.length} photo(s) selected`
                        : 'Click to upload menu photos'}
                    </p>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Owner Information */}
          {step === 5 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold mb-6">Owner Information</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name (as shown on ID) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="ownerName"
                  value={formData.ownerName}
                  onChange={handleInputChange}
                  placeholder="Enter full name"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ID Type <span className="text-red-500">*</span>
                </label>
                <select
                  name="ownerIdType"
                  value={formData.ownerIdType}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="">Select ID type</option>
                  {idTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Valid ID <span className="text-red-500">*</span>
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-orange-400 transition-colors cursor-pointer">
                  <input
                    type="file"
                    onChange={(e) => handleFileChange(e, 'ownerId')}
                    accept="image/*,.pdf"
                    className="hidden"
                    id="owner-id-upload"
                  />
                  <label htmlFor="owner-id-upload" className="cursor-pointer">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">
                      {formData.ownerId ? formData.ownerId.name : 'Click to upload valid ID'}
                    </p>
                  </label>
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
                className="bg-gradient-to-r from-orange-500 to-orange-600"
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
