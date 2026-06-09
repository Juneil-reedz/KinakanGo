import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import Card from '../components/Card';
import Button from '../components/Button';

export default function Cart() {
  const { cartItems, updateQuantity, removeFromCart, getCartTotal } = useCart();

  const subtotal = getCartTotal();
  const deliveryFee = cartItems.length > 0 ? 2.99 : 0;
  const tax = subtotal * 0.08;
  const total = subtotal + deliveryFee + tax;

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-secondary-50 flex items-center justify-center px-4">
        <div className="max-w-md mx-auto text-center">
          <div className="text-5xl xs:text-6xl mb-4">🛒</div>
          <h2 className="text-xl xs:text-2xl font-heading font-bold mb-3 xs:mb-4">Your cart is empty</h2>
          <p className="text-sm xs:text-base text-secondary-600 mb-6 xs:mb-8 px-2">
            Looks like you haven't added anything to your cart yet.
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
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <h1 className="text-2xl xs:text-3xl md:text-4xl font-heading font-bold">Your Cart</h1>
          <Link to="/restaurants" className="text-primary-600 text-sm xs:text-base font-medium">
            Continue Shopping
          </Link>
        </div>
      </div>

      <div className="container-custom py-4 xs:py-6 md:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 xs:gap-6 lg:gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-3 xs:space-y-4">
            {/* Restaurant Name Header */}
            <div className="px-2 xs:px-0">
              <h2 className="text-base xs:text-lg md:text-xl font-semibold">
                Order from: <span className="text-primary-600">{cartItems[0].restaurant}</span>
              </h2>
            </div>

            {cartItems.map((item) => (
              <Card key={item.id}>
                <div className="flex items-start xs:items-center gap-3 xs:gap-4">
                  {/* Item Image */}
                  <div className="w-16 h-16 xs:w-20 xs:h-20 md:w-24 md:h-24 bg-secondary-300 rounded-lg overflow-hidden flex-shrink-0">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Item Details */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm xs:text-base md:text-lg mb-0.5 xs:mb-1 truncate">{item.name}</h3>
                    <p className="text-secondary-600 text-xs xs:text-sm mb-2 xs:mb-3 truncate">{item.restaurant}</p>

                    {/* Quantity Controls & Price */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 xs:gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="min-w-[2rem] xs:min-w-[2.5rem] h-8 xs:h-9 p-0"
                        >
                          -
                        </Button>
                        <span className="font-semibold w-6 xs:w-8 text-center text-sm xs:text-base">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="min-w-[2rem] xs:min-w-[2.5rem] h-8 xs:h-9 p-0"
                        >
                          +
                        </Button>
                      </div>
                      <span className="font-bold text-primary-600 text-sm xs:text-base md:text-lg whitespace-nowrap">
                        ₱{(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="text-secondary-500 hover:text-error transition-colors p-1 -mt-1 flex-shrink-0"
                    title="Remove item"
                    aria-label="Remove item"
                  >
                    <svg className="w-5 h-5 xs:w-6 xs:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </Card>
            ))}
          </div>

          {/* Order Summary - Sticky on mobile bottom, sidebar on desktop */}
          <div className="lg:col-span-1">
            {/* Desktop: Sticky sidebar */}
            <div className="hidden lg:block">
              <Card className="sticky top-24">
                <h3 className="text-xl font-semibold mb-4">Order Summary</h3>
                <div className="space-y-3 mb-4">
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
                <Link to="/checkout">
                  <Button size="lg" className="w-full">
                    Proceed to Checkout
                  </Button>
                </Link>
              </Card>
            </div>

            {/* Mobile: Fixed bottom bar */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-secondary-200 shadow-lg z-20">
              <div className="px-4 py-3 xs:py-4">
                {/* Summary rows */}
                <div className="space-y-1.5 xs:space-y-2 mb-3">
                  <div className="flex justify-between text-xs xs:text-sm text-secondary-700">
                    <span>Subtotal</span>
                    <span>₱{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs xs:text-sm text-secondary-700">
                    <span>Delivery + Tax</span>
                    <span>₱{(deliveryFee + tax).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-base xs:text-lg font-bold pt-1.5 xs:pt-2 border-t border-secondary-200">
                    <span>Total</span>
                    <span className="text-primary-600">₱{total.toFixed(2)}</span>
                  </div>
                </div>

                {/* Checkout button */}
                <Link to="/checkout" className="block">
                  <Button size="lg" className="w-full text-sm xs:text-base h-11 xs:h-12">
                    Proceed to Checkout
                  </Button>
                </Link>
              </div>
            </div>

            {/* Spacer for mobile fixed bottom bar */}
            <div className="lg:hidden h-32 xs:h-36"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
