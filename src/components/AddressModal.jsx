import { useState, useEffect } from 'react';
import Modal from './Modal';
import Button from './Button';

export default function AddressModal({ isOpen, onClose, onSave, address }) {
  const [formData, setFormData] = useState({
    label: '',
    street: '',
    apartment: '',
    city: '',
    state: '',
    zipCode: '',
    isDefault: false,
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (address) {
      setFormData(address);
    } else {
      setFormData({
        label: '',
        street: '',
        apartment: '',
        city: '',
        state: '',
        zipCode: '',
        isDefault: false,
      });
    }
    setErrors({});
  }, [address, isOpen]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.label.trim()) {
      newErrors.label = 'Label is required';
    }

    if (!formData.street.trim()) {
      newErrors.street = 'Street address is required';
    }

    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }

    if (!formData.state.trim()) {
      newErrors.state = 'State is required';
    }

    if (!formData.zipCode.trim()) {
      newErrors.zipCode = 'ZIP code is required';
    } else if (!/^\d{5}(-\d{4})?$/.test(formData.zipCode)) {
      newErrors.zipCode = 'ZIP code is invalid';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    onSave(formData);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={address ? 'Edit Address' : 'Add New Address'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Label */}
        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-2">
            Address Label *
          </label>
          <input
            type="text"
            name="label"
            value={formData.label}
            onChange={handleChange}
            placeholder="e.g., Home, Work, etc."
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
              errors.label ? 'border-error' : 'border-secondary-300'
            }`}
          />
          {errors.label && <p className="text-error text-sm mt-1">{errors.label}</p>}
        </div>

        {/* Street */}
        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-2">
            Street Address *
          </label>
          <input
            type="text"
            name="street"
            value={formData.street}
            onChange={handleChange}
            placeholder="123 Main St"
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
              errors.street ? 'border-error' : 'border-secondary-300'
            }`}
          />
          {errors.street && <p className="text-error text-sm mt-1">{errors.street}</p>}
        </div>

        {/* Apartment */}
        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-2">
            Apartment, Suite, Unit (Optional)
          </label>
          <input
            type="text"
            name="apartment"
            value={formData.apartment}
            onChange={handleChange}
            placeholder="Apt 4B"
            className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* City, State, ZIP */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="col-span-1">
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              City *
            </label>
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleChange}
              placeholder="New York"
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                errors.city ? 'border-error' : 'border-secondary-300'
              }`}
            />
            {errors.city && <p className="text-error text-sm mt-1">{errors.city}</p>}
          </div>

          <div className="col-span-1">
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              State *
            </label>
            <input
              type="text"
              name="state"
              value={formData.state}
              onChange={handleChange}
              placeholder="NY"
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                errors.state ? 'border-error' : 'border-secondary-300'
              }`}
            />
            {errors.state && <p className="text-error text-sm mt-1">{errors.state}</p>}
          </div>

          <div className="col-span-2 md:col-span-1">
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              ZIP Code *
            </label>
            <input
              type="text"
              name="zipCode"
              value={formData.zipCode}
              onChange={handleChange}
              placeholder="10001"
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                errors.zipCode ? 'border-error' : 'border-secondary-300'
              }`}
            />
            {errors.zipCode && <p className="text-error text-sm mt-1">{errors.zipCode}</p>}
          </div>
        </div>

        {/* Default Address */}
        <div>
          <label className="flex items-center">
            <input
              type="checkbox"
              name="isDefault"
              checked={formData.isDefault}
              onChange={handleChange}
              className="w-4 h-4 text-primary-600 border-secondary-300 rounded focus:ring-primary-500"
            />
            <span className="ml-2 text-sm text-secondary-700">
              Set as default delivery address
            </span>
          </label>
        </div>

        {/* Buttons */}
        <div className="flex space-x-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" className="flex-1">
            {address ? 'Update Address' : 'Add Address'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
