import { useEffect, useState } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import Button from '../components/Button';

export default function OrderReceipt() {
  const { orderId } = useParams();
  const location = useLocation();
  const [orderData, setOrderData] = useState(null);

  useEffect(() => {
    // In a real app, fetch order data from API
    // For now, use data from navigation state or mock data
    if (location.state?.orderData) {
      setOrderData(location.state.orderData);
    } else {
      // Mock data for direct access
      setOrderData({
        id: orderId,
        userId: 1,
        restaurant: 'Pizza Palace',
        restaurantId: 1,
        items: [
          { id: 1, name: 'Margherita Pizza', quantity: 2, price: 12.99 },
          { id: 2, name: 'Garlic Bread', quantity: 1, price: 5.99 },
        ],
        subtotal: 31.97,
        deliveryFee: 2.99,
        tax: 2.56,
        total: 37.52,
        deliveryAddress: '123 Main St, Apt 4B, New York, NY 10001',
        contactInfo: {
          name: 'John Doe',
          email: 'john.doe@example.com',
          phone: '+1 (555) 123-4567',
        },
        paymentMethod: 'online',
        paymentDetails: {
          transactionId: 'TXN1234567890',
          cardBrand: 'Visa',
          last4: '4242',
        },
        orderDate: new Date().toISOString(),
        status: 'confirmed',
      });
    }
  }, [orderId, location.state]);

  const handlePrint = () => {
    window.print();
  };

  if (!orderData) {
    return (
      <div className="container-custom py-16 text-center">
        <div className="text-4xl mb-4">Loading...</div>
      </div>
    );
  }

  const companyInfo = {
    name: 'Kinakan',
    address: '123 Food Street, Corner Plaza',
    city: 'Metro Manila, Philippines',
    phone: '+63 (917) 123-4567',
    email: 'support@kinakan.com',
    website: 'www.kinakan.com',
    taxId: 'TIN-123456789',
  };

  return (
    <div className="container-custom py-8">
      {/* Print Button - Hidden when printing */}
      <div className="print:hidden mb-6 flex justify-between items-center">
        <Link to={`/order-confirmation/${orderId}`}>
          <Button variant="outline">Back to Order Details</Button>
        </Link>
        <Button onClick={handlePrint}>Print Receipt</Button>
      </div>

      {/* Receipt Container */}
      <div className="max-w-4xl mx-auto bg-white shadow-lg print:shadow-none">
        {/* Header */}
        <div className="border-b-2 border-secondary-900 pb-6 mb-6 p-4 xs:p-6 md:p-8">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div className="flex-1">
              <h1 className="text-2xl xs:text-3xl md:text-4xl font-bold text-[#E67E22] mb-2">
                {companyInfo.name}
              </h1>
              <p className="text-sm xs:text-base text-secondary-700">{companyInfo.address}</p>
              <p className="text-sm xs:text-base text-secondary-700">{companyInfo.city}</p>
              <p className="text-sm xs:text-base text-secondary-700">Phone: {companyInfo.phone}</p>
              <p className="text-sm xs:text-base text-secondary-700">Email: {companyInfo.email}</p>
            </div>
            <div className="text-left sm:text-right flex-shrink-0">
              <h2 className="text-2xl xs:text-3xl font-bold mb-2">RECEIPT</h2>
              <p className="text-sm xs:text-base text-secondary-700">
                Order #<span className="font-mono font-bold">{orderData.id}</span>
              </p>
              <p className="text-sm xs:text-base text-secondary-700">
                Date: {new Date(orderData.orderDate).toLocaleDateString()}
              </p>
              <p className="text-sm xs:text-base text-secondary-700">
                Time: {new Date(orderData.orderDate).toLocaleTimeString()}
              </p>
            </div>
          </div>
        </div>

        {/* Customer Information */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 xs:gap-6 md:gap-8 mb-6 px-4 xs:px-6 md:px-8">
          <div>
            <h3 className="font-bold text-base xs:text-lg mb-2 xs:mb-3 text-secondary-900">Customer Information</h3>
            <p className="text-sm xs:text-base text-secondary-700">
              <strong>Name:</strong> {orderData.contactInfo.name}
            </p>
            <p className="text-sm xs:text-base text-secondary-700">
              <strong>Email:</strong> {orderData.contactInfo.email}
            </p>
            <p className="text-sm xs:text-base text-secondary-700">
              <strong>Phone:</strong> {orderData.contactInfo.phone}
            </p>
          </div>
          <div>
            <h3 className="font-bold text-base xs:text-lg mb-2 xs:mb-3 text-secondary-900">Delivery Address</h3>
            <p className="text-sm xs:text-base text-secondary-700">{orderData.deliveryAddress}</p>
          </div>
        </div>

        {/* Restaurant Information */}
        <div className="mb-6 px-4 xs:px-6 md:px-8">
          <h3 className="font-bold text-base xs:text-lg mb-2 xs:mb-3 text-secondary-900">Restaurant</h3>
          <p className="text-base xs:text-lg md:text-xl text-secondary-700">{orderData.restaurant}</p>
        </div>

        {/* Order Items */}
        <div className="mb-6 px-4 xs:px-6 md:px-8 overflow-x-auto">
          <h3 className="font-bold text-base xs:text-lg mb-3 xs:mb-4 text-secondary-900">Order Items</h3>
          <table className="w-full min-w-full">
            <thead>
              <tr className="border-b-2 border-secondary-300">
                <th className="text-left py-2 xs:py-3 text-xs xs:text-sm md:text-base text-secondary-900">Item</th>
                <th className="text-center py-2 xs:py-3 text-xs xs:text-sm md:text-base text-secondary-900">Qty</th>
                <th className="text-right py-2 xs:py-3 text-xs xs:text-sm md:text-base text-secondary-900">Price</th>
                <th className="text-right py-2 xs:py-3 text-xs xs:text-sm md:text-base text-secondary-900">Total</th>
              </tr>
            </thead>
            <tbody>
              {orderData.items.map((item, index) => (
                <tr key={index} className="border-b border-secondary-200">
                  <td className="py-2 xs:py-3 text-xs xs:text-sm md:text-base text-secondary-700">{item.name}</td>
                  <td className="text-center py-2 xs:py-3 text-xs xs:text-sm md:text-base text-secondary-700">{item.quantity}</td>
                  <td className="text-right py-2 xs:py-3 text-xs xs:text-sm md:text-base text-secondary-700">
                    ₱{item.price.toFixed(2)}
                  </td>
                  <td className="text-right py-2 xs:py-3 text-xs xs:text-sm md:text-base text-secondary-700">
                    ₱{(item.price * item.quantity).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Order Summary */}
        <div className="mb-6 px-4 xs:px-6 md:px-8">
          <div className="ml-auto max-w-xs space-y-2">
            <div className="flex justify-between text-xs xs:text-sm md:text-base text-secondary-700">
              <span>Subtotal:</span>
              <span>₱{orderData.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs xs:text-sm md:text-base text-secondary-700">
              <span>Delivery Fee:</span>
              <span>₱{orderData.deliveryFee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs xs:text-sm md:text-base text-secondary-700">
              <span>Tax (8%):</span>
              <span>₱{orderData.tax.toFixed(2)}</span>
            </div>
            <div className="border-t-2 border-secondary-900 pt-2 mt-2">
              <div className="flex justify-between text-base xs:text-lg md:text-xl font-bold text-secondary-900">
                <span>Total:</span>
                <span>₱{orderData.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Information */}
        <div className="mb-6 px-4 xs:px-6 md:px-8">
          <h3 className="font-bold text-base xs:text-lg mb-2 xs:mb-3 text-secondary-900">Payment Information</h3>
          <div className="space-y-1">
            <p className="text-xs xs:text-sm md:text-base text-secondary-700">
              <strong>Payment Method:</strong>{' '}
              {orderData.paymentMethod === 'online' && 'Online Payment'}
              {orderData.paymentMethod === 'cash' && 'Cash on Delivery'}
              {orderData.paymentMethod === 'card' && 'Card on Delivery'}
            </p>
            {orderData.paymentDetails && (
              <>
                <p className="text-xs xs:text-sm md:text-base text-secondary-700">
                  <strong>Transaction ID:</strong> {orderData.paymentDetails.transactionId}
                </p>
                <p className="text-xs xs:text-sm md:text-base text-secondary-700">
                  <strong>Card:</strong> {orderData.paymentDetails.cardBrand} ending in{' '}
                  {orderData.paymentDetails.last4}
                </p>
                <p className="text-xs xs:text-sm md:text-base text-success font-semibold mt-2">
                  Payment Status: Paid
                </p>
              </>
            )}
            {orderData.paymentMethod !== 'online' && (
              <p className="text-xs xs:text-sm md:text-base text-warning font-semibold mt-2">
                Payment Status: Pending (Pay on Delivery)
              </p>
            )}
          </div>
        </div>

        {/* Company Footer */}
        <div className="border-t-2 border-secondary-900 pt-4 xs:pt-6 px-4 xs:px-6 md:px-8 pb-6 xs:pb-8">
          <div className="text-center space-y-2">
            <p className="text-xs xs:text-sm md:text-base text-secondary-700">Tax ID: {companyInfo.taxId}</p>
            <p className="text-xs xs:text-sm md:text-base text-secondary-700">
              Thank you for your order! For support, contact us at {companyInfo.email}
            </p>
            <p className="text-xs xs:text-sm text-secondary-600">
              Visit us at {companyInfo.website}
            </p>
            <div className="mt-4 pt-4 border-t border-secondary-300">
              <p className="text-xs text-secondary-500">
                This is a computer-generated receipt and does not require a signature.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Email Preview Notice - Hidden when printing */}
      <div className="print:hidden mt-8 max-w-4xl mx-auto">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">Email Receipt</h3>
          <p className="text-sm text-blue-800">
            A copy of this receipt has been sent to <strong>{orderData.contactInfo.email}</strong>.
            Please check your inbox and spam folder.
          </p>
        </div>
      </div>
    </div>
  );
}
