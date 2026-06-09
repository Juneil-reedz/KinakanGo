import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useNotification } from '../context/NotificationContext';
import { createOrder } from '../services/api';
import Card from '../components/Card';
import Button from '../components/Button';
import PaymentForm from '../components/PaymentForm';
import Modal from '../components/Modal';

export default function Checkout() {
  const navigate = useNavigate();
  const { cartItems, getCartTotal, clearCart } = useCart();
  const { showSuccess, showError, showInfo } = useNotification();

  const [formData, setFormData] = useState({
    fullName: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+1 (555) 123-4567',
    address: '123 Main St',
    city: 'New York',
    state: 'NY',
    zipCode: '10001',
    apartmentUnit: 'Apt 4B',
    deliveryInstructions: '',
    paymentMethod: 'cash',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentResult, setPaymentResult] = useState(null);

  const subtotal = getCartTotal();
  const deliveryFee = 2.99;
  const tax = subtotal * 0.08;
  const total = subtotal + deliveryFee + tax;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // If online payment is selected, show payment modal
    if (formData.paymentMethod === 'online') {
      setShowPaymentModal(true);
      return;
    }

    // For cash/card on delivery, process order directly
    await processOrder();
  };

  const processOrder = async (paymentData = null) => {
    setIsSubmitting(true);
    showInfo('Processing your order...');

    try {
      const orderData = {
        userId: 1, // Mock user ID
        restaurantId: cartItems[0].restaurantId,
        restaurant: cartItems[0].restaurant,
        items: cartItems,
        subtotal,
        deliveryFee,
        tax,
        total,
        deliveryAddress: `${formData.address}${formData.apartmentUnit ? ', ' + formData.apartmentUnit : ''}, ${formData.city}, ${formData.state} ${formData.zipCode}`,
        contactInfo: {
          name: formData.fullName,
          email: formData.email,
          phone: formData.phone,
        },
        deliveryInstructions: formData.deliveryInstructions,
        paymentMethod: formData.paymentMethod,
        paymentDetails: paymentData,
      };

      const order = await createOrder(orderData);

      // Show success notification
      showSuccess('Order placed successfully! Redirecting to confirmation page...');

      // Clear cart
      clearCart();

      // Navigate to confirmation page after a short delay
      setTimeout(() => {
        navigate(`/order-confirmation/${order.id}`, {
          state: { paymentResult: paymentData, orderData }
        });
      }, 1500);
    } catch (error) {
      console.error('Error creating order:', error);
      showError('Failed to place order. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handlePaymentSuccess = async (result) => {
    setPaymentResult(result);
    setShowPaymentModal(false);
    showSuccess(`Payment successful! Transaction ID: ${result.transactionId}`);
    await processOrder(result);
  };

  const handlePaymentCancel = () => {
    setShowPaymentModal(false);
    showInfo('Payment cancelled');
  };

  // Redirect if cart is empty
  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-secondary-50 flex items-center justify-center px-4">
        <div className="max-w-md mx-auto text-center">
          <div className="text-5xl xs:text-6xl mb-4">🛒</div>
          <h2 className="text-xl xs:text-2xl font-heading font-bold mb-3 xs:mb-4">Your cart is empty</h2>
          <p className="text-sm xs:text-base text-secondary-600 mb-6 xs:mb-8 px-2">
            Add items to your cart before checking out.
          </p>
          <Link to="/restaurants">
            <Button size="lg" className="w-full xs:w-auto">Browse Restaurants</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary-50">
      {/* Mobile Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10 px-4 py-3 xs:py-4">
        <div className="flex items-center gap-3 max-w-7xl mx-auto">
          <Link to="/cart" className="text-secondary-600 hover:text-secondary-900">
            <svg className="w-5 h-5 xs:w-6 xs:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-xl xs:text-2xl md:text-4xl font-heading font-bold">Checkout</h1>
        </div>
      </div>

      <div className="container-custom py-4 xs:py-6 md:py-8 pb-24 xs:pb-28 lg:pb-8">

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 xs:gap-6 lg:gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2 space-y-4 xs:space-y-6">
            {/* Contact Information */}
            <Card>
              <h3 className="text-lg xs:text-xl font-semibold mb-3 xs:mb-4">Contact Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs xs:text-sm font-medium text-secondary-700 mb-1.5 xs:mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    className={`w-full px-3 xs:px-4 py-2.5 xs:py-3 text-sm xs:text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      errors.fullName ? 'border-error' : 'border-secondary-300'
                    }`}
                  />
                  {errors.fullName && <p className="text-error text-xs xs:text-sm mt-1">{errors.fullName}</p>}
                </div>

                <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 xs:gap-4">
                  <div>
                    <label className="block text-xs xs:text-sm font-medium text-secondary-700 mb-1.5 xs:mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`w-full px-3 xs:px-4 py-2.5 xs:py-3 text-sm xs:text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                        errors.email ? 'border-error' : 'border-secondary-300'
                      }`}
                    />
                    {errors.email && <p className="text-error text-xs xs:text-sm mt-1">{errors.email}</p>}
                  </div>

                  <div>
                    <label className="block text-xs xs:text-sm font-medium text-secondary-700 mb-1.5 xs:mb-2">
                      Phone *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className={`w-full px-3 xs:px-4 py-2.5 xs:py-3 text-sm xs:text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                        errors.phone ? 'border-error' : 'border-secondary-300'
                      }`}
                    />
                    {errors.phone && <p className="text-error text-xs xs:text-sm mt-1">{errors.phone}</p>}
                  </div>
                </div>
              </div>
            </Card>

            {/* Delivery Address */}
            <Card>
              <h3 className="text-lg xs:text-xl font-semibold mb-3 xs:mb-4">Delivery Address</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs xs:text-sm font-medium text-secondary-700 mb-1.5 xs:mb-2">
                    Street Address *
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className={`w-full px-3 xs:px-4 py-2.5 xs:py-3 text-sm xs:text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      errors.address ? 'border-error' : 'border-secondary-300'
                    }`}
                  />
                  {errors.address && <p className="text-error text-xs xs:text-sm mt-1">{errors.address}</p>}
                </div>

                <div>
                  <label className="block text-xs xs:text-sm font-medium text-secondary-700 mb-1.5 xs:mb-2">
                    Apartment, Suite, Unit (Optional)
                  </label>
                  <input
                    type="text"
                    name="apartmentUnit"
                    value={formData.apartmentUnit}
                    onChange={handleChange}
                    className="w-full px-3 xs:px-4 py-2.5 xs:py-3 text-sm xs:text-base border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div className="grid grid-cols-1 xs:grid-cols-3 gap-3 xs:gap-4">
                  <div>
                    <label className="block text-xs xs:text-sm font-medium text-secondary-700 mb-1.5 xs:mb-2">
                      City *
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      className={`w-full px-3 xs:px-4 py-2.5 xs:py-3 text-sm xs:text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                        errors.city ? 'border-error' : 'border-secondary-300'
                      }`}
                    />
                    {errors.city && <p className="text-error text-xs xs:text-sm mt-1">{errors.city}</p>}
                  </div>

                  <div>
                    <label className="block text-xs xs:text-sm font-medium text-secondary-700 mb-1.5 xs:mb-2">
                      State *
                    </label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      className={`w-full px-3 xs:px-4 py-2.5 xs:py-3 text-sm xs:text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                        errors.state ? 'border-error' : 'border-secondary-300'
                      }`}
                    />
                    {errors.state && <p className="text-error text-xs xs:text-sm mt-1">{errors.state}</p>}
                  </div>

                  <div>
                    <label className="block text-xs xs:text-sm font-medium text-secondary-700 mb-1.5 xs:mb-2">
                      ZIP Code *
                    </label>
                    <input
                      type="text"
                      name="zipCode"
                      value={formData.zipCode}
                      onChange={handleChange}
                      className={`w-full px-3 xs:px-4 py-2.5 xs:py-3 text-sm xs:text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                        errors.zipCode ? 'border-error' : 'border-secondary-300'
                      }`}
                    />
                    {errors.zipCode && <p className="text-error text-xs xs:text-sm mt-1">{errors.zipCode}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-xs xs:text-sm font-medium text-secondary-700 mb-1.5 xs:mb-2">
                    Delivery Instructions (Optional)
                  </label>
                  <textarea
                    name="deliveryInstructions"
                    value={formData.deliveryInstructions}
                    onChange={handleChange}
                    rows={3}
                    placeholder="E.g., Ring doorbell, leave at door, etc."
                    className="w-full px-3 xs:px-4 py-2.5 xs:py-3 text-sm xs:text-base border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                  />
                </div>
              </div>
            </Card>

            {/* Payment Method */}
            <Card>
              <h3 className="text-lg xs:text-xl font-semibold mb-3 xs:mb-4">Payment Method</h3>
              <div className="space-y-2.5 xs:space-y-3">
                <label className={`flex items-start xs:items-center p-3 xs:p-4 border-2 rounded-lg cursor-pointer hover:border-primary-500 transition-colors ${
                  formData.paymentMethod === 'online' ? 'border-primary-500 bg-primary-50' : 'border-secondary-300'
                }`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="online"
                    checked={formData.paymentMethod === 'online'}
                    onChange={handleChange}
                    className="w-4 h-4 mt-0.5 xs:mt-0 text-primary-600 focus:ring-primary-500 flex-shrink-0"
                  />
                  <div className="ml-2.5 xs:ml-3 flex-1">
                    <div className="flex items-center justify-between flex-wrap gap-1">
                      <p className="font-medium text-sm xs:text-base">Pay Online Now</p>
                      <span className="text-xs bg-success text-white px-2 py-0.5 xs:py-1 rounded">Recommended</span>
                    </div>
                    <p className="text-xs xs:text-sm text-secondary-600 mt-0.5">Secure payment with credit/debit card</p>
                  </div>
                </label>

                <label className={`flex items-start xs:items-center p-3 xs:p-4 border-2 rounded-lg cursor-pointer hover:border-primary-500 transition-colors ${
                  formData.paymentMethod === 'cash' ? 'border-primary-500 bg-primary-50' : 'border-secondary-300'
                }`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cash"
                    checked={formData.paymentMethod === 'cash'}
                    onChange={handleChange}
                    className="w-4 h-4 mt-0.5 xs:mt-0 text-primary-600 focus:ring-primary-500 flex-shrink-0"
                  />
                  <div className="ml-2.5 xs:ml-3">
                    <p className="font-medium text-sm xs:text-base">Cash on Delivery</p>
                    <p className="text-xs xs:text-sm text-secondary-600 mt-0.5">Pay with cash when your order arrives</p>
                  </div>
                </label>

                <label className={`flex items-start xs:items-center p-3 xs:p-4 border-2 rounded-lg cursor-pointer hover:border-primary-500 transition-colors ${
                  formData.paymentMethod === 'card' ? 'border-primary-500 bg-primary-50' : 'border-secondary-300'
                }`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="card"
                    checked={formData.paymentMethod === 'card'}
                    onChange={handleChange}
                    className="w-4 h-4 mt-0.5 xs:mt-0 text-primary-600 focus:ring-primary-500 flex-shrink-0"
                  />
                  <div className="ml-2.5 xs:ml-3">
                    <p className="font-medium text-sm xs:text-base">Card on Delivery</p>
                    <p className="text-xs xs:text-sm text-secondary-600 mt-0.5">Pay with card when your order arrives</p>
                  </div>
                </label>
              </div>
            </Card>
          </div>

          {/* Order Summary - Desktop only */}
          <div className="lg:col-span-1 hidden lg:block">
            <Card className="sticky top-24">
              <h3 className="text-xl font-semibold mb-4">Order Summary</h3>

              {/* Items */}
              <div className="mb-4 space-y-2 max-h-48 overflow-y-auto scrollbar-hide">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-secondary-700 truncate mr-2">
                      {item.quantity}x {item.name}
                    </span>
                    <span className="font-medium whitespace-nowrap">
                      ₱{(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-secondary-200 pt-4 space-y-3 mb-4">
                <div className="flex justify-between text-secondary-700">
                  <span>Subtotal</span>
                  <span>₱{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-secondary-700">
                  <span>Delivery Fee</span>
                  <span>₱{deliveryFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-secondary-700">
                  <span>Tax</span>
                  <span>₱{tax.toFixed(2)}</span>
                </div>
                <div className="border-t border-secondary-200 pt-3">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-primary-600">₱{total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Placing Order...' : 'Place Order'}
              </Button>
            </Card>
          </div>
        </div>
      </form>

      {/* Mobile Fixed Bottom Bar - Order Summary & Place Order */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-secondary-200 shadow-lg z-20">
        <div className="px-4 py-3 xs:py-4">
          {/* Summary rows */}
          <div className="space-y-1 xs:space-y-1.5 mb-3">
            <div className="flex justify-between text-xs xs:text-sm text-secondary-700">
              <span>Subtotal</span>
              <span>₱{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs xs:text-sm text-secondary-700">
              <span>Delivery + Tax</span>
              <span>₱{(deliveryFee + tax).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm xs:text-base font-bold pt-1 xs:pt-1.5 border-t border-secondary-200">
              <span>Total</span>
              <span className="text-primary-600">₱{total.toFixed(2)}</span>
            </div>
          </div>

          {/* Place Order button */}
          <Button
            type="submit"
            size="lg"
            className="w-full text-sm xs:text-base h-11 xs:h-12"
            disabled={isSubmitting}
            onClick={handleSubmit}
          >
            {isSubmitting ? 'Placing Order...' : 'Place Order'}
          </Button>
        </div>
      </div>
      </div>

      {/* Payment Modal */}
      <Modal isOpen={showPaymentModal} onClose={handlePaymentCancel}>
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-6">Complete Payment</h2>
          <PaymentForm
            amount={total}
            onSuccess={handlePaymentSuccess}
            onCancel={handlePaymentCancel}
          />
        </div>
      </Modal>
    </div>
  );
}
