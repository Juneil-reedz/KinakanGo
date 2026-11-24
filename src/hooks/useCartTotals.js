import { useEffect, useState } from 'react';
import { useCart } from '../context/CartContext';
import { restaurantsApi, promosApi, storeCreditApi } from '../services/api';

// Same math as the server's placeOrder, so the cart, checkout and the saved
// order all show one total: (food − promo) + 8% tax + the restaurant's delivery fee.
export const TAX_RATE = 0.08;

export default function useCartTotals() {
  const { cartItems, restaurantId, getCartTotal, promoCode, setPromoCode } = useCart();
  const [restaurant, setRestaurant] = useState(null);
  const [promo, setPromo] = useState({ discount: 0, error: '', checking: false });

  useEffect(() => {
    if (!restaurantId) { setRestaurant(null); return; }
    let live = true;
    restaurantsApi.getOne(restaurantId).then(r => { if (live) setRestaurant(r); }).catch(() => {});
    return () => { live = false; };
  }, [restaurantId]);

  const food = getCartTotal();

  // Store credit the customer has at this restaurant (from earlier refunds)
  const [credit, setCredit] = useState(0);
  useEffect(() => {
    if (!restaurantId) { setCredit(0); return; }
    let live = true;
    storeCreditApi.balance(restaurantId).then(r => { if (live) setCredit(Number(r.balance) || 0); }).catch(() => { if (live) setCredit(0); });
    return () => { live = false; };
  }, [restaurantId]);

  // Re-check the code whenever it or the cart total changes (min order, % discounts)
  useEffect(() => {
    if (!promoCode || !restaurantId || food <= 0) { setPromo({ discount: 0, error: '', checking: false }); return; }
    let live = true;
    setPromo(p => ({ ...p, checking: true }));
    promosApi.validate(promoCode, food, restaurantId)
      .then(r => { if (live) setPromo({ discount: Number(r.discount) || 0, error: '', checking: false }); })
      .catch(err => { if (live) setPromo({ discount: 0, error: err.message || 'Invalid promo code', checking: false }); });
    return () => { live = false; };
  }, [promoCode, food, restaurantId]);

  const discount    = Math.min(promo.discount, food);
  const deliveryFee = cartItems.length ? Number(restaurant?.delivery_fee ?? 0) : 0;
  const taxable     = food - discount;
  const tax         = taxable * TAX_RATE;
  const total       = taxable + deliveryFee + tax;

  return {
    restaurant, food, discount, deliveryFee, tax, total, credit,
    promoCode, setPromoCode,
    promoError: promo.error, promoChecking: promo.checking,
    feeLoaded: !cartItems.length || restaurant !== null,
  };
}
