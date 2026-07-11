import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { createOrder, restaurantsApi } from '../services/api';
import { User, Mail, Phone, MapPin, Banknote, ArrowLeft, ShoppingCart, ChevronRight, Truck, ImagePlus, Smartphone } from 'lucide-react';

function pickImage(onPick) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => onPick(ev.target.result);
    reader.readAsDataURL(file);
  };
  input.click();
}

export default function Checkout() {
  const navigate = useNavigate();
  const { cartItems, restaurantId, getCartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const { addNotification } = useNotification();
  const [restaurantInfo, setRestaurantInfo] = useState(null);

  useEffect(() => {
    if (!restaurantId) return;
    restaurantsApi.getOne(restaurantId)
      .then(r => setRestaurantInfo(r))
      .catch(() => {});
  }, [restaurantId]);

  const gcashNumber = restaurantInfo?.gcash_number || '—';
  const gcashName   = restaurantInfo?.gcash_name   || '—';

  const [form, setForm] = useState({
    fullName: user?.name || '',
    email: user?.email || '',
    phone: '',
    address: '',
    city: 'Bongao',
    zipCode: '7500',
    apartmentUnit: '',
    deliveryInstructions: '',
    paymentMethod: 'cash',
    proofImage: '',
  });
  const [errors, setErrors]     = useState({});
  const [submitting, setSubmitting] = useState(false);

  const subtotal    = getCartTotal();
  const deliveryFee = 49;
  const tax         = subtotal * 0.12;
  const total       = subtotal + deliveryFee + tax;

  const set = (field) => (e) => {
    setForm(f => ({ ...f, [field]: e.target.value }));
    setErrors(er => ({ ...er, [field]: undefined }));
  };

  const validate = () => {
    const e = {};
    if (!form.fullName.trim())  e.fullName = 'Required';
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) e.email = 'Valid email required';
    if (!form.phone.trim())     e.phone = 'Required';
    if (!form.address.trim())   e.address = 'Required';
    if (!form.city.trim())      e.city = 'Required';
    if (form.paymentMethod === 'gcash' && !form.proofImage) e.proofImage = 'Please upload your GCash payment proof';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const processOrder = async () => {
    setSubmitting(true);
    addNotification('Processing your order…', 'info');
    try {
      const orderData = {
        restaurantId,
        items: cartItems.map(i => ({ menuItemId: i.id, quantity: i.quantity })),
        deliveryAddress: `${form.address}${form.apartmentUnit ? ', ' + form.apartmentUnit : ''}, ${form.city} ${form.zipCode}`,
        specialInstructions: form.deliveryInstructions || null,
        paymentMethod: form.paymentMethod,
        proofImage: form.proofImage || null,
        contactInfo: { name: form.fullName, email: form.email, phone: form.phone },
      };
      const order = await createOrder(orderData);
      addNotification('Order placed successfully!', 'success');
      clearCart();
      setTimeout(() => navigate(`/order-confirmation/${order.id}`, { state: { orderData } }), 1200);
    } catch {
      addNotification('Failed to place order. Please try again.', 'error');
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    await processOrder();
  };

  if (cartItems.length === 0) return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="glass rounded-3xl p-10 max-w-sm text-center card-3d animate-fade-up">
        <ShoppingCart className="w-12 h-12 text-forest-300/40 mx-auto mb-4" />
        <p className="text-white font-bold text-lg mb-2">Cart is empty</p>
        <Link to="/restaurants" className="btn-glow-orange text-white font-bold px-8 py-3 rounded-xl inline-block mt-2">Browse Food</Link>
      </div>
    </div>
  );

  const fieldCls = (f) => `w-full input-glass py-3 text-sm ${errors[f] ? 'border-red-500/50' : ''}`;

  return (
    <div className="min-h-screen pb-8 animate-fade-up">
      <div className="orb w-72 h-72 bg-forest-600/15 top-0 right-0" />

      {/* Header */}
      <div className="glass-dark sticky top-0 z-10 px-4 py-3 flex items-center gap-3 mb-4"
        style={{ borderBottom: '1px solid rgba(255,255,255,.07)' }}>
        <Link to="/cart" className="w-9 h-9 glass rounded-xl flex items-center justify-center text-forest-100 hover:glass-green transition-all">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <h1 className="text-white font-heading font-bold text-lg flex-1">Checkout</h1>
        <span className="text-forest-200/50 text-xs">{cartItems.length} item{cartItems.length > 1 ? 's' : ''}</span>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="max-w-4xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left: form */}
          <div className="lg:col-span-2 space-y-4">

            {/* Contact */}
            <div className="glass rounded-2xl p-5">
              <p className="text-white font-semibold mb-4">Contact Info</p>
              <div className="space-y-3">
                <div>
                  <label className="block text-forest-200/60 text-xs mb-1">Full Name *</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-forest-300/50" />
                    <input type="text" value={form.fullName} onChange={set('fullName')} className={`${fieldCls('fullName')} pl-10`} />
                  </div>
                  {errors.fullName && <p className="text-red-400 text-xs mt-1">{errors.fullName}</p>}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-forest-200/60 text-xs mb-1">Email *</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-forest-300/50" />
                      <input type="email" value={form.email} onChange={set('email')} className={`${fieldCls('email')} pl-10`} />
                    </div>
                    {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
                  </div>
                  <div>
                    <label className="block text-forest-200/60 text-xs mb-1">Phone *</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-forest-300/50" />
                      <input type="tel" value={form.phone} onChange={set('phone')} className={`${fieldCls('phone')} pl-10`} />
                    </div>
                    {errors.phone && <p className="text-red-400 text-xs mt-1">{errors.phone}</p>}
                  </div>
                </div>
              </div>
            </div>

            {/* Delivery address */}
            <div className="glass rounded-2xl p-5">
              <p className="text-white font-semibold mb-4">Delivery Address</p>
              <div className="space-y-3">
                <div>
                  <label className="block text-forest-200/60 text-xs mb-1">Street Address *</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-forest-300/50" />
                    <input type="text" value={form.address} onChange={set('address')} className={`${fieldCls('address')} pl-10`} />
                  </div>
                  {errors.address && <p className="text-red-400 text-xs mt-1">{errors.address}</p>}
                </div>
                <div>
                  <label className="block text-forest-200/60 text-xs mb-1">Apt / Unit (optional)</label>
                  <input type="text" value={form.apartmentUnit} onChange={set('apartmentUnit')} className={fieldCls('apartmentUnit')} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-forest-200/60 text-xs mb-1">City *</label>
                    <input type="text" value={form.city} onChange={set('city')} className={fieldCls('city')} />
                    {errors.city && <p className="text-red-400 text-xs mt-1">{errors.city}</p>}
                  </div>
                  <div>
                    <label className="block text-forest-200/60 text-xs mb-1">ZIP Code</label>
                    <input type="text" value={form.zipCode} onChange={set('zipCode')} className={fieldCls('zipCode')} />
                  </div>
                </div>
                <div>
                  <label className="block text-forest-200/60 text-xs mb-1">Delivery Instructions</label>
                  <textarea value={form.deliveryInstructions} onChange={set('deliveryInstructions')} rows={2}
                    placeholder="Leave at door, ring bell, etc."
                    className="w-full input-glass py-2.5 text-sm resize-none" />
                </div>
              </div>
            </div>

            {/* Payment */}
            <div className="glass rounded-2xl p-5">
              <p className="text-white font-semibold mb-4">Payment Method</p>
              <div className="space-y-2">
                {[
                  { id: 'cash',  label: 'Cash on Delivery', icon: Banknote,    desc: 'Pay cash when your order arrives' },
                  { id: 'gcash', label: 'GCash',            icon: Smartphone,  desc: 'Pay via GCash and upload proof' },
                ].map(({ id, label, icon: Icon, desc }) => (
                  <label key={id}
                    className={`flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-all border
                      ${form.paymentMethod === id ? 'glass-green border-forest-500/40' : 'glass border-transparent hover:glass-green'}`}>
                    <input type="radio" name="paymentMethod" value={id} checked={form.paymentMethod === id}
                      onChange={set('paymentMethod')} className="hidden" />
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
                      ${form.paymentMethod === id ? 'btn-glow-green' : 'glass'}`}>
                      <Icon className={`w-5 h-5 ${form.paymentMethod === id ? 'text-white' : 'text-forest-300'}`} />
                    </div>
                    <div>
                      <p className="text-white font-medium text-sm">{label}</p>
                      <p className="text-forest-200/50 text-xs">{desc}</p>
                    </div>
                    {form.paymentMethod === id && (
                      <div className="ml-auto w-5 h-5 btn-glow-green rounded-full flex items-center justify-center flex-shrink-0">
                        <div className="w-2 h-2 bg-white rounded-full" />
                      </div>
                    )}
                  </label>
                ))}
              </div>

              {/* GCash proof upload */}
              {form.paymentMethod === 'gcash' && (
                <div className="mt-4 space-y-3">
                  <div className="glass-green rounded-xl p-4">
                    <p className="text-white font-semibold text-sm mb-1">Send payment to:</p>
                    <p className="text-forest-200/70 text-xs">GCash number: <span className="text-white font-bold">{gcashNumber}</span></p>
                    <p className="text-forest-200/70 text-xs">Account name: <span className="text-white font-bold">{gcashName}</span></p>
                    <p className="text-ember-300 text-xs mt-2 font-medium">Amount: ₱{total.toFixed(2)}</p>
                  </div>
                  <div>
                    <label className="block text-forest-200/60 text-xs font-medium mb-1">
                      Upload Payment Screenshot *
                    </label>
                    <button type="button" onClick={() => pickImage(b64 => setForm(f => ({ ...f, proofImage: b64 })))}
                      className="w-full glass rounded-xl overflow-hidden transition-all hover:glass-orange"
                      style={{ height: form.proofImage ? '10rem' : '5rem' }}>
                      {form.proofImage ? (
                        <img src={form.proofImage} alt="proof" className="w-full h-full object-contain" />
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full gap-1.5 text-forest-300/50">
                          <ImagePlus className="w-6 h-6" />
                          <span className="text-xs">Tap to upload screenshot</span>
                        </div>
                      )}
                    </button>
                    {form.proofImage && (
                      <button type="button" onClick={() => setForm(f => ({ ...f, proofImage: '' }))}
                        className="mt-1 text-xs text-red-400/70 hover:text-red-400 transition-colors">
                        Remove
                      </button>
                    )}
                    {errors.proofImage && <p className="text-red-400 text-xs mt-1">{errors.proofImage}</p>}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right: summary */}
          <div className="lg:sticky lg:top-24 space-y-4 self-start">
            <div className="glass rounded-2xl p-5">
              <p className="text-white font-semibold mb-3">Order Summary</p>
              <div className="space-y-2 mb-4">
                {cartItems.map(item => (
                  <div key={item.id} className="flex justify-between text-xs">
                    <span className="text-forest-200/70 truncate flex-1">{item.quantity}× {item.name}</span>
                    <span className="text-forest-100 ml-2">₱{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-white/8 pt-3 space-y-2">
                {[
                  { label: 'Subtotal',  val: `₱${subtotal.toFixed(2)}` },
                  { label: 'Delivery',  val: `₱${deliveryFee.toFixed(2)}`, icon: Truck },
                  { label: 'Tax (12%)', val: `₱${tax.toFixed(2)}` },
                ].map(({ label, val, icon: Icon }) => (
                  <div key={label} className="flex justify-between text-sm">
                    <span className="text-forest-200/60 flex items-center gap-1.5">{Icon && <Icon className="w-3.5 h-3.5" />}{label}</span>
                    <span className="text-forest-100">{val}</span>
                  </div>
                ))}
                <div className="flex justify-between items-center pt-2 border-t border-white/8">
                  <span className="text-white font-bold">Total</span>
                  <span className="text-ember-400 font-heading font-bold text-xl">₱{total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <button type="submit" disabled={submitting}
              className={`w-full py-4 rounded-2xl font-heading font-bold text-base flex items-center justify-center gap-2 transition-all
                ${submitting ? 'glass text-forest-200/50 cursor-not-allowed' : 'btn-glow-orange text-white'}`}>
              {submitting
                ? <><div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Placing Order…</>
                : <>Place Order <ChevronRight className="w-5 h-5" /></>}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
