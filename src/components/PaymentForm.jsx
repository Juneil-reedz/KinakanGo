import { useState } from 'react';
import Button from './Button';
import Modal from './Modal';

export default function PaymentForm({ amount, onSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: '',
  });

  const [errors, setErrors] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [require3DS, setRequire3DS] = useState(false);
  const [threeDSCode, setThreeDSCode] = useState('');
  const [threeDSError, setThreeDSError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;

    // Format card number with spaces
    if (name === 'cardNumber') {
      formattedValue = value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim();
      formattedValue = formattedValue.slice(0, 19); // Max 16 digits + 3 spaces
    }

    // Format expiry date as MM/YY
    if (name === 'expiryDate') {
      formattedValue = value
        .replace(/\s/g, '')
        .replace(/(\d{2})(\d)/, '$1/$2')
        .slice(0, 5);
    }

    // Limit CVV to 4 digits
    if (name === 'cvv') {
      formattedValue = value.replace(/\D/g, '').slice(0, 4);
    }

    setFormData((prev) => ({ ...prev, [name]: formattedValue }));

    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Card number validation (basic)
    const cardNumberDigits = formData.cardNumber.replace(/\s/g, '');
    if (!cardNumberDigits) {
      newErrors.cardNumber = 'Card number is required';
    } else if (cardNumberDigits.length < 13 || cardNumberDigits.length > 16) {
      newErrors.cardNumber = 'Invalid card number';
    }

    // Cardholder name validation
    if (!formData.cardName.trim()) {
      newErrors.cardName = 'Cardholder name is required';
    }

    // Expiry date validation
    if (!formData.expiryDate) {
      newErrors.expiryDate = 'Expiry date is required';
    } else if (!/^\d{2}\/\d{2}$/.test(formData.expiryDate)) {
      newErrors.expiryDate = 'Invalid format (MM/YY)';
    } else {
      const [month, year] = formData.expiryDate.split('/');
      const currentYear = new Date().getFullYear() % 100;
      const currentMonth = new Date().getMonth() + 1;
      const expMonth = parseInt(month);
      const expYear = parseInt(year);

      if (expMonth < 1 || expMonth > 12) {
        newErrors.expiryDate = 'Invalid month';
      } else if (expYear < currentYear || (expYear === currentYear && expMonth < currentMonth)) {
        newErrors.expiryDate = 'Card has expired';
      }
    }

    // CVV validation
    if (!formData.cvv) {
      newErrors.cvv = 'CVV is required';
    } else if (formData.cvv.length < 3) {
      newErrors.cvv = 'Invalid CVV';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsProcessing(true);

    try {
      // Simulate payment gateway API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Simulate 3DS requirement for certain cards (e.g., cards starting with 5)
      const cardNumberDigits = formData.cardNumber.replace(/\s/g, '');
      if (cardNumberDigits.startsWith('5')) {
        setRequire3DS(true);
        setIsProcessing(false);
        return;
      }

      // Simulate successful payment
      const paymentResult = {
        success: true,
        transactionId: `TXN${Date.now()}`,
        last4: cardNumberDigits.slice(-4),
        cardBrand: getCardBrand(cardNumberDigits),
      };

      onSuccess(paymentResult);
    } catch (error) {
      console.error('Payment error:', error);
      setErrors({ submit: 'Payment failed. Please try again.' });
      setIsProcessing(false);
    }
  };

  const handle3DSSubmit = async (e) => {
    e.preventDefault();
    setThreeDSError('');

    // Simulate 3DS verification (correct code is '123456' for demo)
    if (threeDSCode !== '123456') {
      setThreeDSError('Invalid verification code. Try 123456 for demo.');
      return;
    }

    setIsProcessing(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const cardNumberDigits = formData.cardNumber.replace(/\s/g, '');
      const paymentResult = {
        success: true,
        transactionId: `TXN${Date.now()}`,
        last4: cardNumberDigits.slice(-4),
        cardBrand: getCardBrand(cardNumberDigits),
        threeDSCompleted: true,
      };

      onSuccess(paymentResult);
    } catch (error) {
      console.error('3DS verification error:', error);
      setThreeDSError('Verification failed. Please try again.');
      setIsProcessing(false);
    }
  };

  const getCardBrand = (cardNumber) => {
    if (cardNumber.startsWith('4')) return 'Visa';
    if (cardNumber.startsWith('5')) return 'Mastercard';
    if (cardNumber.startsWith('3')) return 'American Express';
    return 'Unknown';
  };

  const getCardIcon = () => {
    const cardNumber = formData.cardNumber.replace(/\s/g, '');
    if (cardNumber.startsWith('4')) return '💳 Visa';
    if (cardNumber.startsWith('5')) return '💳 Mastercard';
    if (cardNumber.startsWith('3')) return '💳 Amex';
    return '💳';
  };

  // 3DS Modal
  if (require3DS) {
    return (
      <Modal isOpen={true} onClose={() => setRequire3DS(false)}>
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 text-primary-600 rounded-full mb-4 text-3xl">
              🔒
            </div>
            <h3 className="text-2xl font-bold mb-2">3D Secure Authentication</h3>
            <p className="text-secondary-600">
              Please enter the verification code sent to your phone
            </p>
          </div>

          <form onSubmit={handle3DSSubmit}>
            <div className="mb-6">
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Verification Code
              </label>
              <input
                type="text"
                value={threeDSCode}
                onChange={(e) => setThreeDSCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="Enter 6-digit code"
                className="w-full px-4 py-3 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-center text-2xl tracking-widest"
                maxLength={6}
              />
              {threeDSError && (
                <p className="text-error text-sm mt-2">{threeDSError}</p>
              )}
              <p className="text-xs text-secondary-500 mt-2 text-center">
                For demo purposes, use: <span className="font-mono font-bold">123456</span>
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setRequire3DS(false);
                  setIsProcessing(false);
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={threeDSCode.length !== 6 || isProcessing}
                className="flex-1"
              >
                {isProcessing ? 'Verifying...' : 'Verify'}
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-secondary-700">Amount to pay:</span>
          <span className="text-2xl font-bold text-primary-600">₱{amount.toFixed(2)}</span>
        </div>
      </div>

      {/* Card Number */}
      <div>
        <label className="block text-sm font-medium text-secondary-700 mb-2">
          Card Number *
        </label>
        <div className="relative">
          <input
            type="text"
            name="cardNumber"
            value={formData.cardNumber}
            onChange={handleChange}
            placeholder="1234 5678 9012 3456"
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
              errors.cardNumber ? 'border-error' : 'border-secondary-300'
            }`}
          />
          <div className="absolute right-3 top-3 text-sm">
            {getCardIcon()}
          </div>
        </div>
        {errors.cardNumber && (
          <p className="text-error text-sm mt-1">{errors.cardNumber}</p>
        )}
      </div>

      {/* Cardholder Name */}
      <div>
        <label className="block text-sm font-medium text-secondary-700 mb-2">
          Cardholder Name *
        </label>
        <input
          type="text"
          name="cardName"
          value={formData.cardName}
          onChange={handleChange}
          placeholder="John Doe"
          className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
            errors.cardName ? 'border-error' : 'border-secondary-300'
          }`}
        />
        {errors.cardName && (
          <p className="text-error text-sm mt-1">{errors.cardName}</p>
        )}
      </div>

      {/* Expiry Date & CVV */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-2">
            Expiry Date *
          </label>
          <input
            type="text"
            name="expiryDate"
            value={formData.expiryDate}
            onChange={handleChange}
            placeholder="MM/YY"
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
              errors.expiryDate ? 'border-error' : 'border-secondary-300'
            }`}
          />
          {errors.expiryDate && (
            <p className="text-error text-sm mt-1">{errors.expiryDate}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-2">
            CVV *
          </label>
          <input
            type="text"
            name="cvv"
            value={formData.cvv}
            onChange={handleChange}
            placeholder="123"
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
              errors.cvv ? 'border-error' : 'border-secondary-300'
            }`}
          />
          {errors.cvv && (
            <p className="text-error text-sm mt-1">{errors.cvv}</p>
          )}
        </div>
      </div>

      {/* Security Notice */}
      <div className="bg-secondary-50 border border-secondary-200 rounded-lg p-3">
        <div className="flex items-start space-x-2">
          <span className="text-lg">🔒</span>
          <div className="flex-1">
            <p className="text-xs text-secondary-600">
              Your payment information is encrypted and secure. We never store your card details.
            </p>
          </div>
        </div>
      </div>

      {/* Demo Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-xs text-blue-800">
          <strong>Demo Mode:</strong> Use any card number starting with 4 for Visa, 5 for Mastercard (triggers 3DS), or 3 for Amex. Any future date and 3-4 digit CVV.
        </p>
      </div>

      {errors.submit && (
        <div className="bg-error/10 border border-error text-error rounded-lg p-3">
          <p className="text-sm">{errors.submit}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isProcessing}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isProcessing}
          className="flex-1"
        >
          {isProcessing ? 'Processing...' : `Pay ₱${amount.toFixed(2)}`}
        </Button>
      </div>
    </form>
  );
}
