import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { Minus, Plus, X, ShoppingCart, ArrowLeft, Truck, Tag, ChevronRight } from 'lucide-react';

export default function Cart() {
  const navigate = useNavigate();
  const { cartItems, updateQuantity, removeFromCart, getCartTotal } = useCart();

  const subtotal    = getCartTotal();
  const deliveryFee = cartItems.length > 0 ? 2.99 : 0;
  const tax         = subtotal * 0.08;
  const total       = subtotal + deliveryFee + tax;

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 relative">
        <div className="orb w-72 h-72 bg-forest-600/15 top-1/4 left-1/4" />
        <div className="glass rounded-3xl p-10 max-w-sm w-full text-center card-3d animate-fade-up">
          <div className="w-20 h-20 glass rounded-3xl flex items-center justify-center mx-auto mb-4">
            <ShoppingCart className="w-10 h-10 text-forest-300/40" />
          </div>
          <h2 className="text-xl font-heading font-bold text-white mb-2">Your cart is empty</h2>
          <p className="text-forest-200/50 text-sm mb-6">Looks like you haven't added anything yet.</p>
          <button onClick={() => navigate('/restaurants')}
            className="btn-glow-orange text-white font-bold px-8 py-3 rounded-xl">
            Browse Food
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      <div className="orb w-72 h-72 bg-forest-600/15 top-0 right-0" />

      {/* Header */}
      <div className="glass-dark sticky top-0 z-10 px-4 py-3 flex items-center gap-3"
        style={{ borderBottom:'1px solid rgba(255,255,255,.07)' }}>
        <button onClick={() => navigate(-1)}
          className="w-9 h-9 glass rounded-xl flex items-center justify-center text-forest-100 hover:glass-green transition-all">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="text-white font-heading font-bold text-lg flex-1">Your Cart</h1>
        <button onClick={() => navigate('/restaurants')}
          className="text-ember-400 text-xs font-medium hover:text-ember-300 transition-colors">
          + Add more
        </button>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-4 pb-40">
        {/* Restaurant label */}
        <div className="glass-green rounded-2xl px-4 py-3 flex items-center gap-2">
          <span className="text-lg">🏪</span>
          <div>
            <p className="text-forest-200/60 text-xs">Ordering from</p>
            <p className="text-white font-semibold text-sm">{cartItems[0]?.restaurant}</p>
          </div>
        </div>

        {/* Cart items */}
        <div className="space-y-3">
          {cartItems.map((item, idx) => (
            <div key={item.id} className="glass card-3d rounded-2xl p-4 flex items-center gap-4 animate-fade-up group"
              style={{ animationDelay:`${idx*60}ms` }}>
              <img src={item.image} alt={item.name}
                className="w-16 h-16 rounded-xl object-cover border border-white/10 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm truncate">{item.name}</p>
                <p className="text-forest-200/50 text-xs truncate mb-2">{item.restaurant}</p>
                <div className="flex items-center gap-2">
                  <button onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="w-7 h-7 glass rounded-lg flex items-center justify-center hover:glass-orange transition-all">
                    <Minus className="w-3 h-3 text-forest-200" />
                  </button>
                  <span className="text-white font-bold text-sm w-5 text-center">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="w-7 h-7 glass rounded-lg flex items-center justify-center hover:glass-green transition-all">
                    <Plus className="w-3 h-3 text-forest-200" />
                  </button>
                </div>
              </div>
              <div className="flex flex-col items-end gap-3">
                <button onClick={() => removeFromCart(item.id)}
                  className="w-7 h-7 glass rounded-full flex items-center justify-center text-forest-200/50 hover:glass-orange hover:text-white transition-all opacity-0 group-hover:opacity-100">
                  <X className="w-3.5 h-3.5" />
                </button>
                <p className="text-ember-400 font-bold text-sm">₱{(item.price * item.quantity).toFixed(2)}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Promo */}
        <button className="w-full glass rounded-2xl px-4 py-3.5 flex items-center gap-3 hover:glass-green transition-all text-left">
          <Tag className="w-4 h-4 text-ember-400 flex-shrink-0" />
          <span className="text-forest-200/60 text-sm flex-1">Have a promo code?</span>
          <ChevronRight className="w-4 h-4 text-forest-200/30" />
        </button>
      </div>

      {/* Fixed bottom summary */}
      <div className="fixed bottom-0 left-0 right-0 glass-dark p-4 z-20"
        style={{ borderTop:'1px solid rgba(255,255,255,.08)', boxShadow:'0 -8px 32px rgba(0,0,0,.4)' }}>
        <div className="max-w-2xl mx-auto space-y-2 mb-4">
          {[
            { label:'Subtotal',    val:`₱${subtotal.toFixed(2)}` },
            { label:'Delivery',    val:`₱${deliveryFee.toFixed(2)}`, icon: Truck },
            { label:'Tax (8%)',    val:`₱${tax.toFixed(2)}` },
          ].map(({ label, val, icon: Icon }) => (
            <div key={label} className="flex justify-between items-center">
              <span className="text-forest-200/60 text-sm flex items-center gap-1.5">
                {Icon && <Icon className="w-3.5 h-3.5 text-forest-300/50" />}{label}
              </span>
              <span className="text-forest-100 text-sm font-medium">{val}</span>
            </div>
          ))}
          <div className="flex justify-between items-center pt-2 border-t border-white/8">
            <span className="text-white font-bold">Total</span>
            <span className="text-ember-400 font-heading font-bold text-xl">₱{total.toFixed(2)}</span>
          </div>
        </div>
        <button onClick={() => navigate('/checkout')}
          className="w-full max-w-2xl mx-auto block py-4 btn-glow-orange text-white font-heading font-bold rounded-2xl flex items-center justify-center gap-2">
          Proceed to Checkout <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
