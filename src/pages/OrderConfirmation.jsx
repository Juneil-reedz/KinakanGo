import { Link, useParams } from 'react-router-dom';
import Button from '../components/Button';
import Card from '../components/Card';

export default function OrderConfirmation() {
  const { orderId } = useParams();

  // In a real app, you would fetch the order details here
  // For now, we'll use mock data
  const orderDetails = {
    id: orderId,
    estimatedTime: '30-40',
    restaurant: 'Pizza Palace',
    total: 45.99,
  };

  return (
    <div className="container-custom py-8">
      <div className="max-w-2xl mx-auto">
        {/* Success Message */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-success rounded-full mb-4">
            <svg
              className="w-12 h-12 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-4xl font-heading font-bold mb-2">Order Placed!</h1>
          <p className="text-xl text-secondary-600">
            Thank you for your order. Your food will arrive soon!
          </p>
        </div>

        {/* Order Details */}
        <Card className="mb-6">
          <div className="border-b border-secondary-200 pb-4 mb-4">
            <h2 className="text-2xl font-semibold mb-2">Order Details</h2>
            <div className="flex items-center justify-between">
              <span className="text-secondary-600">Order ID</span>
              <span className="font-mono font-bold text-primary-600">#{orderDetails.id}</span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-secondary-700">Restaurant</span>
              <span className="font-semibold">{orderDetails.restaurant}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-secondary-700">Estimated Delivery Time</span>
              <span className="font-semibold text-primary-600">
                {orderDetails.estimatedTime} minutes
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-secondary-700">Total Amount</span>
              <span className="font-bold text-xl">${orderDetails.total.toFixed(2)}</span>
            </div>
          </div>
        </Card>

        {/* What's Next */}
        <Card className="mb-6">
          <h3 className="text-xl font-semibold mb-4">What's Next?</h3>
          <div className="space-y-4">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-8 h-8 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center font-bold">
                1
              </div>
              <div className="flex-1">
                <h4 className="font-semibold mb-1">Order Confirmation</h4>
                <p className="text-sm text-secondary-600">
                  The restaurant is preparing your order
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-8 h-8 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center font-bold">
                2
              </div>
              <div className="flex-1">
                <h4 className="font-semibold mb-1">Out for Delivery</h4>
                <p className="text-sm text-secondary-600">
                  A delivery driver will pick up your order
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-8 h-8 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center font-bold">
                3
              </div>
              <div className="flex-1">
                <h4 className="font-semibold mb-1">Delivered</h4>
                <p className="text-sm text-secondary-600">
                  Enjoy your delicious meal!
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link to={`/order-receipt/${orderId}`} className="flex-1">
            <Button size="lg" className="w-full">
              View Receipt
            </Button>
          </Link>
          <Link to="/orders" className="flex-1">
            <Button variant="outline" size="lg" className="w-full">
              Track Your Order
            </Button>
          </Link>
          <Link to="/restaurants" className="flex-1">
            <Button variant="outline" size="lg" className="w-full">
              Order More Food
            </Button>
          </Link>
        </div>

        {/* Email Confirmation Notice */}
        <div className="mt-8 text-center">
          <p className="text-sm text-secondary-600">
            📧 A confirmation email has been sent to your email address.
          </p>
        </div>
      </div>
    </div>
  );
}
