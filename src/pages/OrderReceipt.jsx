import { useEffect, useState } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { ArrowLeft, Printer, Mail, CheckCircle, Clock } from 'lucide-react';

export default function OrderReceipt() {
  const { orderId }  = useParams();
  const location     = useLocation();
  const [orderData, setOrderData] = useState(null);

  useEffect(() => {
    if (location.state?.orderData) {
      setOrderData(location.state.orderData);
    } else {
      setOrderData({
        id: orderId,
        userId: 1,
        restaurant: 'Pizza Palace',
        restaurantId: 1,
        items: [
          { id: 1, name: 'Margherita Pizza', quantity: 2, price: 12.99 },
          { id: 2, name: 'Garlic Bread',      quantity: 1, price:  5.99 },
        ],
        subtotal: 31.97,
        deliveryFee: 2.99,
        tax: 2.56,
        total: 37.52,
        deliveryAddress: '123 Main St, Apt 4B, New York, NY 10001',
        contactInfo: {
          name:  'John Doe',
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

  if (!orderData) {
    return (
      <div className="container-custom py-16 text-center animate-fade-up">
        <div className="glass rounded-2xl py-16 flex flex-col items-center gap-4">
          <Clock className="w-10 h-10 text-forest-300/40 animate-pulse" />
          <p className="text-forest-200/50 text-lg">Loading receipt...</p>
        </div>
      </div>
    );
  }

  const company = {
    name:    'Kinakan',
    address: '123 Food Street, Corner Plaza',
    city:    'Metro Manila, Philippines',
    phone:   '+63 (917) 123-4567',
    email:   'support@kinakan.com',
    website: 'www.kinakan.com',
    taxId:   'TIN-123456789',
  };

  return (
    <div className="container-custom py-8 animate-fade-up">

      {/* Controls — hidden when printing */}
      <div className="print:hidden mb-6 flex justify-between items-center gap-4 flex-wrap">
        <Link to={`/order-confirmation/${orderId}`}>
          <button className="glass hover:glass-green transition-all text-forest-100/80 hover:text-white text-sm font-medium px-4 py-2.5 rounded-xl flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Back to Order Details
          </button>
        </Link>
        <button
          onClick={() => window.print()}
          className="btn-glow-orange text-white text-sm font-semibold px-5 py-2.5 rounded-xl flex items-center gap-2"
        >
          <Printer className="w-4 h-4" /> Print Receipt
        </button>
      </div>

      {/* Receipt card — white background for print */}
      <div className="max-w-4xl mx-auto glass print:bg-white print:shadow-none rounded-2xl overflow-hidden">

        {/* Header strip */}
        <div className="p-6 md:p-8" style={{ borderBottom: '1px solid rgba(255,255,255,.1)' }}>
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div>
              <h1 className="text-3xl font-heading font-bold text-ember-400 mb-1 print:text-orange-500">
                {company.name}
              </h1>
              <p className="text-forest-200/60 text-sm print:text-gray-600">{company.address}</p>
              <p className="text-forest-200/60 text-sm print:text-gray-600">{company.city}</p>
              <p className="text-forest-200/60 text-sm print:text-gray-600">Phone: {company.phone}</p>
              <p className="text-forest-200/60 text-sm print:text-gray-600">Email: {company.email}</p>
            </div>
            <div className="text-left sm:text-right flex-shrink-0">
              <h2 className="text-2xl font-heading font-bold text-white mb-1 print:text-black">RECEIPT</h2>
              <p className="text-forest-200/50 text-sm print:text-gray-600">
                Order <span className="font-mono font-bold text-white print:text-black">#{orderData.id}</span>
              </p>
              <p className="text-forest-200/50 text-sm print:text-gray-600">
                Date: {new Date(orderData.orderDate).toLocaleDateString()}
              </p>
              <p className="text-forest-200/50 text-sm print:text-gray-600">
                Time: {new Date(orderData.orderDate).toLocaleTimeString()}
              </p>
            </div>
          </div>
        </div>

        {/* Customer + Delivery info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-6 md:p-8" style={{ borderBottom: '1px solid rgba(255,255,255,.1)' }}>
          <div>
            <p className="text-forest-200/50 text-xs font-semibold uppercase tracking-wide mb-3 print:text-gray-500">Customer Information</p>
            {[
              ['Name',  orderData.contactInfo.name],
              ['Email', orderData.contactInfo.email],
              ['Phone', orderData.contactInfo.phone],
            ].map(([l, v]) => (
              <p key={l} className="text-forest-100/70 text-sm mb-1 print:text-gray-700">
                <span className="text-white font-semibold print:text-black">{l}:</span> {v}
              </p>
            ))}
          </div>
          <div>
            <p className="text-forest-200/50 text-xs font-semibold uppercase tracking-wide mb-3 print:text-gray-500">Delivery Address</p>
            <p className="text-forest-100/70 text-sm print:text-gray-700">{orderData.deliveryAddress}</p>
            <p className="text-forest-200/50 text-xs font-semibold uppercase tracking-wide mt-4 mb-1 print:text-gray-500">Restaurant</p>
            <p className="text-white font-semibold print:text-black">{orderData.restaurant}</p>
          </div>
        </div>

        {/* Order items table */}
        <div className="p-6 md:p-8" style={{ borderBottom: '1px solid rgba(255,255,255,.1)' }}>
          <p className="text-forest-200/50 text-xs font-semibold uppercase tracking-wide mb-4 print:text-gray-500">Order Items</p>
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,.1)' }}>
                {['Item', 'Qty', 'Price', 'Total'].map((h, i) => (
                  <th key={h} className={`py-3 text-forest-200/50 text-xs font-semibold uppercase print:text-gray-500 ${i === 0 ? 'text-left' : i === 1 ? 'text-center' : 'text-right'}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orderData.items.map((item, i) => (
                <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,.06)' }}>
                  <td className="py-3 text-white text-sm print:text-black">{item.name}</td>
                  <td className="py-3 text-center text-forest-200/60 text-sm print:text-gray-700">{item.quantity}</td>
                  <td className="py-3 text-right text-forest-200/60 text-sm print:text-gray-700">₱{Number(item.price).toFixed(2)}</td>
                  <td className="py-3 text-right text-ember-400 font-semibold text-sm print:text-orange-600">
                    ₱{(item.price * item.quantity).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="ml-auto max-w-xs space-y-2 mt-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,.1)' }}>
            {[
              ['Subtotal',     orderData.subtotal.toFixed(2)],
              ['Delivery Fee', orderData.deliveryFee.toFixed(2)],
              ['Tax (8%)',     orderData.tax.toFixed(2)],
            ].map(([l, v]) => (
              <div key={l} className="flex justify-between text-forest-200/50 text-sm print:text-gray-600">
                <span>{l}</span><span>₱{v}</span>
              </div>
            ))}
            <div className="flex justify-between text-white font-heading font-bold text-lg pt-2 print:text-black" style={{ borderTop: '1px solid rgba(255,255,255,.2)' }}>
              <span>Total</span>
              <span className="text-ember-400 print:text-orange-600">₱{orderData.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Payment info */}
        <div className="p-6 md:p-8" style={{ borderBottom: '1px solid rgba(255,255,255,.1)' }}>
          <p className="text-forest-200/50 text-xs font-semibold uppercase tracking-wide mb-3 print:text-gray-500">Payment Information</p>
          <p className="text-forest-100/70 text-sm print:text-gray-700">
            <span className="text-white font-semibold print:text-black">Method:</span>{' '}
            {orderData.paymentMethod === 'online' && 'Online Payment'}
            {orderData.paymentMethod === 'cash'   && 'Cash on Delivery'}
            {orderData.paymentMethod === 'card'   && 'Card on Delivery'}
          </p>
          {orderData.paymentDetails && (
            <div className="mt-2 space-y-1">
              <p className="text-forest-100/70 text-sm print:text-gray-700">
                <span className="text-white font-semibold print:text-black">Transaction ID:</span> {orderData.paymentDetails.transactionId}
              </p>
              <p className="text-forest-100/70 text-sm print:text-gray-700">
                <span className="text-white font-semibold print:text-black">Card:</span> {orderData.paymentDetails.cardBrand} ending in {orderData.paymentDetails.last4}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <CheckCircle className="w-4 h-4 text-forest-400 print:text-green-600" />
                <span className="text-forest-300 font-semibold text-sm print:text-green-700">Payment Status: Paid</span>
              </div>
            </div>
          )}
          {orderData.paymentMethod !== 'online' && (
            <p className="text-ember-400 font-semibold text-sm mt-2 print:text-orange-600">
              Payment Status: Pending (Pay on Delivery)
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 md:p-8 text-center space-y-2">
          <p className="text-forest-200/40 text-sm print:text-gray-500">Tax ID: {company.taxId}</p>
          <p className="text-forest-200/50 text-sm print:text-gray-600">
            Thank you for your order! For support, contact us at {company.email}
          </p>
          <p className="text-forest-200/40 text-xs print:text-gray-500">Visit us at {company.website}</p>
          <p className="text-forest-200/30 text-xs mt-4 print:text-gray-400">
            This is a computer-generated receipt and does not require a signature.
          </p>
        </div>
      </div>

      {/* Email notice — hidden when printing */}
      <div className="print:hidden mt-6 max-w-4xl mx-auto">
        <div className="glass rounded-2xl p-4 flex items-start gap-3">
          <Mail className="w-5 h-5 text-ember-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-white font-semibold text-sm mb-1">Email Receipt Sent</p>
            <p className="text-forest-200/60 text-sm">
              A copy has been sent to <span className="text-ember-400 font-semibold">{orderData.contactInfo.email}</span>. Check your inbox and spam folder.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
