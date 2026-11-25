import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { Minus, Plus, ShoppingCart, ArrowLeft, Truck, Tag, ChevronRight, Trash2, Store, Check } from 'lucide-react';
import CustomerBottomNav from '../components/CustomerBottomNav';
import useGoBack from '../hooks/useGoBack';
import useCartTotals from '../hooks/useCartTotals';

const REVEAL = 92; // px the card slides to show the delete button

const HOLD = 450; // ms of pressing that marks a food

// One cart line: round photo, name, - qty +, price.
// Long-press to mark it for checkout (once something is marked, a tap also marks).
// Drag it left to reveal delete.
function SwipeItem({ item, index, open, setOpen, onQty, onRemove, picked, picking, onPick }) {
  const start = useRef(null);
  const hold = useRef(null);
  const [dx, setDx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [pressing, setPressing] = useState(false);
  const offset = dragging ? dx : (open ? -REVEAL : 0);

  const stopHold = () => { clearTimeout(hold.current); hold.current = null; setPressing(false); };
  const down = (e) => {
    if (e.target.closest('button')) return;
    start.current = { x: e.clientX, y: e.clientY, base: open ? -REVEAL : 0, moved: false, held: false };
    setDx(open ? -REVEAL : 0);
    setPressing(true);
    hold.current = setTimeout(() => {
      if (!start.current || start.current.moved) return;
      start.current.held = true;
      setPressing(false);
      navigator.vibrate?.(15);
      onPick();
    }, HOLD);
  };
  const move = (e) => {
    const st = start.current;
    if (!st || st.held) return;
    const mx = e.clientX - st.x, my = e.clientY - st.y;
    if (!st.moved && Math.hypot(mx, my) > 8) {
      st.moved = true;
      stopHold();
      if (Math.abs(mx) > Math.abs(my)) { setDragging(true); e.currentTarget.setPointerCapture?.(e.pointerId); }
      else { start.current = null; return; } // scrolling the page
    }
    if (st.moved) setDx(Math.max(-REVEAL - 24, Math.min(0, st.base + mx)));
  };
  const up = () => {
    const st = start.current;
    stopHold();
    if (!st) return;
    start.current = null;
    if (st.moved) { setDragging(false); setOpen(dx < -REVEAL / 2 ? item.id : null); return; }
    if (st.held) return;
    if (open) { setOpen(null); return; }   // a tap closes an open delete
    if (picking) onPick();                 // already choosing: a tap marks too
  };

  return (
    <div className="relative animate-fade-up" style={{ animationDelay: `${index * 60}ms` }}>
      {/* Delete, behind the card on the right */}
      <button onClick={onRemove} aria-label={`Remove ${item.name}`} tabIndex={open ? 0 : -1}
        className="absolute inset-y-0 right-0 w-[5.25rem] rounded-[1.5rem] bg-red-600 text-white flex items-center justify-center transition-opacity"
        style={{ opacity: offset < -8 ? 1 : 0 }}>
        <Trash2 className="w-6 h-6" />
      </button>

      {/* Same rounded card as the food list, with the round photo hanging off its left edge */}
      <div onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}
        role="button" tabIndex={0} onKeyDown={e => { if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onPick(); } }}
        aria-pressed={picked} aria-label={`${item.name}${picked ? ', marked' : ''}. Press and hold to ${picked ? 'unmark' : 'mark'} for checkout`}
        onContextMenu={e => e.preventDefault()}
        className={`cart-line ${picked ? 'is-picked' : ''} ${pressing ? 'is-pressing' : ''} relative ml-11 min-h-[6.5rem] flex items-center py-3 pr-4 pl-[4.25rem] touch-pan-y select-none`}
        style={{ transform: `translateX(${offset}px)`, transition: dragging ? 'scale .25s, box-shadow .25s' : 'transform .45s cubic-bezier(.22,1,.36,1), scale .3s, box-shadow .25s' }}>
        <div className="cart-line-photo">
          <img src={item.image} alt="" draggable="false" />
        </div>
        {picked && (
          <span className="cart-line-check" aria-hidden="true"><Check className="w-3.5 h-3.5" strokeWidth={3} /></span>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-white font-heading font-bold text-[.95rem] truncate">{item.name}</p>
          <div className="flex items-center gap-3 my-1.5">
            <button onClick={() => onQty(item.quantity - 1)} aria-label={`One less ${item.name}`}
              className="w-7 h-7 rounded-full border border-white/40 flex items-center justify-center text-white hover:bg-white/10">
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="text-white font-bold text-base w-5 text-center tabular-nums">{item.quantity}</span>
            <button onClick={() => onQty(item.quantity + 1)} aria-label={`One more ${item.name}`}
              className="w-7 h-7 rounded-full border border-white/40 flex items-center justify-center text-white hover:bg-white/10">
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-white font-heading font-extrabold"><span className="text-ember-500 text-sm mr-0.5">₱</span>{(item.price * item.quantity).toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
}

export default function Cart() {
  const navigate = useNavigate();
  const goBack = useGoBack();
  const { allItems, cartItems: marked, restaurantId, togglePick, pickAll, clearPicks, isPicked, updateQuantity, removeFromCart } = useCart();
  const picking = marked.length > 0;
  // One section per restaurant, in the order they were added. Each is its own order.
  const groups = [];
  for (const item of allItems) {
    let g = groups.find(x => String(x.id) === String(item.restaurantId));
    if (!g) groups.push(g = { id: item.restaurantId, name: item.restaurant || 'Restaurant', items: [] });
    g.items.push(item);
  }
  const many = groups.length > 1;
  const { restaurant, food: subtotal, discount, deliveryFee, tax, total, credit, promoCode, setPromoCode, promoError, promoChecking } = useCartTotals();
  const minOrder = Number(restaurant?.min_order || 0);
  const belowMin = minOrder > 0 && subtotal < minOrder;
  const closed = restaurant?.is_open === false;
  const [promoOpen, setPromoOpen]   = useState(false);
  const [promoInput, setPromoInput] = useState('');
  const [openId, setOpenId]         = useState(null);

  if (allItems.length === 0) {
    return (
      <div className="min-h-screen px-4 pt-12 pb-28 lg:pb-12 relative animate-fade-up">
        <div className="orb w-72 h-72 bg-forest-600/15 top-1/4 left-1/4" />
        <div className="max-w-3xl mx-auto space-y-6">
          <h1 className="text-[2rem] sm:text-2xl leading-none font-heading font-bold text-white">My Cart</h1>
          <div className="glass rounded-3xl py-16 px-6 flex flex-col items-center gap-3 text-center card-3d">
            <ShoppingCart className="w-16 h-16 text-forest-300/20" />
            <p className="text-white font-semibold">Your cart is empty</p>
            <p className="text-forest-200/50 text-sm">Looks like you haven't added anything yet.</p>
            <button onClick={() => navigate('/restaurants')}
              className="btn-glow-orange text-white text-sm px-5 py-2.5 rounded-xl mt-2 font-bold">
              Browse Food
            </button>
          </div>
        </div>
        <CustomerBottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      <div className="orb w-72 h-72 bg-forest-600/15 top-0 right-0" />

      {/* Header */}
      <div className="glass-dark sticky top-0 z-10 px-4 py-3 flex items-center gap-3"
        style={{ borderBottom:'1px solid rgba(var(--fg-rgb),.07)' }}>
        <button onClick={() => goBack('/')}
          className="w-9 h-9 glass rounded-xl flex items-center justify-center text-forest-100 hover:glass-green transition-all">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="text-white font-heading font-bold text-lg flex-1">Your Cart</h1>
        <button onClick={() => navigate('/restaurants')}
          className="text-ember-400 text-xs font-medium hover:text-ember-300 transition-colors">
          + Add more
        </button>
      </div>

      <div className={`max-w-2xl mx-auto p-4 space-y-4 ${picking ? 'pb-72 lg:pb-60' : 'pb-32'}`}>
        <p className="text-center text-forest-200/60 text-xs px-4">
          {picking
            ? (many ? 'Each restaurant is a separate order, so you can mark food from one restaurant at a time.' : 'Tap more food to add it to this order.')
            : 'Press and hold a food to choose it for checkout.'}
        </p>

        {/* Food grouped by restaurant. Long-press to mark, swipe left to delete. */}
        {groups.map((g, gi) => {
          const active = picking && String(g.id) === String(restaurantId);
          const count = g.items.reduce((n, i) => n + i.quantity, 0);
          const sum = g.items.reduce((n, i) => n + i.price * i.quantity, 0);
          const all = active && g.items.every(i => isPicked(i.id));
          return (
            <section key={g.id} className={`cart-group ${active ? 'is-active' : ''}`}>
              <div className="flex items-center gap-3 mb-3">
                <span className="w-9 h-9 rounded-full glass-orange flex items-center justify-center flex-shrink-0">
                  <Store className="w-4 h-4 text-ember-300" />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-white font-heading font-bold truncate">{g.name}</span>
                  <span className="block text-forest-200/60 text-xs">{count} item{count === 1 ? '' : 's'} · ₱{sum.toFixed(2)}</span>
                </span>
                <button type="button" onClick={() => (all ? clearPicks() : pickAll(g.id))}
                  className={`text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1 ${all ? 'bg-ember-500 text-white' : 'glass text-forest-200/70 hover:text-white'}`}>
                  {all ? <><Check className="w-3.5 h-3.5" /> All marked</> : 'Mark all'}
                </button>
              </div>
              <div className="space-y-3">
                {g.items.map((item, idx) => (
                  <SwipeItem key={item.id} item={item} index={gi * 3 + idx}
                    open={openId === item.id} setOpen={setOpenId}
                    picked={active && isPicked(item.id)} picking={picking} onPick={() => togglePick(item)}
                    onQty={q => updateQuantity(item.id, q)} onRemove={() => removeFromCart(item.id)} />
                ))}
              </div>
            </section>
          );
        })}

        {/* Promo: only once food is marked, since it applies to that order */}
        {!picking ? null : promoCode ? (
          <div className="w-full glass rounded-2xl px-4 py-3.5 flex items-center gap-3">
            <Tag className="w-4 h-4 text-ember-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-semibold">{promoCode}</p>
              <p className={`text-xs ${promoError ? 'text-red-400' : 'text-forest-200/60'}`}>
                {promoChecking ? 'Checking…' : promoError || `You save ₱${discount.toFixed(2)}`}
              </p>
            </div>
            <button onClick={() => { setPromoCode(''); setPromoInput(''); }}
              className="text-forest-200/60 text-xs font-semibold hover:text-white">Remove</button>
          </div>
        ) : promoOpen ? (
          <form onSubmit={e => { e.preventDefault(); if (promoInput.trim()) setPromoCode(promoInput); }}
            className="w-full glass rounded-2xl px-4 py-3 flex items-center gap-3">
            <Tag className="w-4 h-4 text-ember-400 flex-shrink-0" />
            <input autoFocus value={promoInput} onChange={e => setPromoInput(e.target.value)}
              placeholder="Enter promo code" aria-label="Promo code"
              className="flex-1 min-w-0 bg-transparent text-white text-sm uppercase placeholder:normal-case placeholder:text-forest-200/40 outline-none" />
            <button type="submit" disabled={!promoInput.trim()}
              className="px-3 py-1.5 rounded-xl btn-glow-green text-white text-xs font-bold disabled:opacity-40">Apply</button>
          </form>
        ) : (
          <button onClick={() => setPromoOpen(true)}
            className="w-full glass rounded-2xl px-4 py-3.5 flex items-center gap-3 hover:glass-green transition-all text-left">
            <Tag className="w-4 h-4 text-ember-400 flex-shrink-0" />
            <span className="text-forest-200/60 text-sm flex-1">Have a promo code?</span>
            <ChevronRight className="w-4 h-4 text-forest-200/30" />
          </button>
        )}
      </div>

      {/* Fixed bottom summary */}
      <div className="fixed bottom-0 left-0 right-0 z-20">
      {/* Totals and checkout appear only once food is marked */}
      {picking && (
      <div className="glass-dark p-4 cart-summary-in"
        style={{ borderTop:'1px solid rgba(var(--fg-rgb),.08)', boxShadow:'0 -8px 32px rgba(0,0,0,.4)' }}>
        <div className="max-w-2xl mx-auto space-y-2 mb-4">
          <div className="flex items-center gap-2">
            <p className="flex-1 min-w-0 text-white text-sm font-bold flex items-center gap-1.5 truncate">
              <Store className="w-4 h-4 text-ember-400 flex-shrink-0" /> {restaurant?.name || groups.find(g => String(g.id) === String(restaurantId))?.name}
              <span className="text-forest-200/60 font-medium">· {marked.reduce((n, i) => n + i.quantity, 0)} marked</span>
            </p>
            <button onClick={clearPicks} className="text-forest-200/60 text-xs font-semibold hover:text-white">Clear</button>
          </div>
          {[
            { label:'Subtotal',    val:`₱${subtotal.toFixed(2)}` },
            ...(discount > 0 ? [{ label:`Promo (${promoCode})`, val:`−₱${discount.toFixed(2)}`, icon: Tag }] : []),
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
        {credit > 0 && (
          <p className="max-w-2xl mx-auto text-center text-forest-300 text-sm">
            You have ₱{credit.toFixed(2)} store credit at {restaurant?.name || 'this restaurant'}. You can use it at checkout.
          </p>
        )}
        {closed && (
          <p className="max-w-2xl mx-auto text-center text-red-300 text-sm">
            {restaurant?.name || 'This restaurant'} is closed right now. You can check out when it opens again.
          </p>
        )}
        {belowMin && (
          <p className="max-w-2xl mx-auto text-center text-ember-300 text-sm">
            {restaurant?.name || 'This restaurant'} has a minimum order of ₱{minOrder.toFixed(2)}. Add ₱{(minOrder - subtotal).toFixed(2)} more to check out.
          </p>
        )}
        <button onClick={() => navigate('/checkout')} disabled={belowMin || closed}
          className="w-full max-w-2xl mx-auto block py-4 btn-glass-orange font-heading font-bold rounded-2xl flex items-center justify-center gap-2 disabled:opacity-50">
          Proceed to Checkout <ChevronRight className="w-5 h-5" />
        </button>
      </div>
      )}
      <CustomerBottomNav fixed={false} />
      </div>
    </div>
  );
}
