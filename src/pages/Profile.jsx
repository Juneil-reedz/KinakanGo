import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useNotification } from '../context/NotificationContext';
import { Crown, Store, Bike, ArrowRight, X, Mail, Edit2, Package, TrendingUp, Heart, Phone, MapPin, LogOut, Settings, RotateCcw, Receipt, Star } from 'lucide-react';

const DEMO_ORDERS = [
  {
    id:'12345', restaurant:'Pizza Palace', restaurantId:1,
    items:[{id:1,name:'Margherita Pizza',quantity:2,price:12.99},{id:4,name:'Caesar Salad',quantity:1,price:8.99}],
    total:34.97, status:'delivered', date:'2024-01-15T14:30:00Z',
  },
  {
    id:'12344', restaurant:'Burger House', restaurantId:2,
    items:[{id:5,name:'Classic Cheeseburger',quantity:1,price:10.99},{id:7,name:'French Fries',quantity:1,price:4.99}],
    total:19.25, status:'delivered', date:'2024-01-14T12:15:00Z',
  },
];

const QUICK_ACTIONS = [
  { label:'Order History', icon:Package,     color:'from-forest-600 to-forest-700', tab:'orders' },
  { label:'Track Orders',  icon:TrendingUp,  color:'from-ember-500 to-ember-600',   to:'/orders' },
  { label:'Favorites',     icon:Heart,       color:'from-forest-500 to-forest-600', to:'/favorites' },
  { label:'Payments',      icon:Phone,       color:'from-ember-600 to-ember-700',   to:'/payments' },
  { label:'Addresses',     icon:MapPin,      color:'from-forest-700 to-forest-800', to:'/addresses' },
  { label:'Support',       icon:Mail,        color:'from-ember-400 to-ember-500',   to:'/customer-service' },
  { label:'Settings',      icon:Settings,    color:'from-forest-600 to-forest-700', to:'/settings' },
  { label:'Logout',        icon:LogOut,      color:'from-red-600 to-red-700',       logout:true },
];

export default function Profile() {
  const navigate = useNavigate();
  const { addToCart, clearCart } = useCart();
  const { addNotification } = useNotification();

  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [user, setUser] = useState({
    name:'Juan dela Cruz', email:'juan@example.com', phone:'+63 912 345 6789',
    address:'123 Main St, Bongao, Tawi-Tawi', subscriptionPlan:'premium',
    roles:{
      restaurantOwner:{ status:'approved', restaurantId:1, restaurantName:'My Restaurant' },
      rider:{ status:'approved' },
    },
    profileImage:'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=400&fit=crop',
  });
  const [orders] = useState(DEMO_ORDERS);

  const totalSpent = orders.reduce((s,o) => s + o.total, 0);

  const handleSave = () => { setIsEditing(false); addNotification('Profile updated!', 'success'); };

  const handleReorder = (order) => {
    if (!window.confirm(`Clear cart and reorder from ${order.restaurant}?`)) return;
    clearCart();
    order.items.forEach(item => addToCart(item, { id:order.restaurantId, name:order.restaurant }));
    addNotification(`Added ${order.items.length} items to cart!`, 'success');
    setTimeout(() => navigate('/cart'), 1000);
  };

  const handleCancelRole = (role) => {
    if (!window.confirm(`Cancel your ${role === 'restaurantOwner' ? 'Restaurant Owner' : 'Rider'} role?`)) return;
    setUser(u => ({ ...u, roles:{ ...u.roles, [role]:null } }));
    addNotification('Role cancelled', 'info');
  };

  const statusBadge = (s) => ({
    delivered:'glass-green text-forest-200', cancelled:'glass-orange text-ember-200', refunded:'text-purple-300'
  }[s] || 'glass text-forest-200');

  return (
    <div className="space-y-5 pb-20 lg:pb-0 animate-fade-up">
      {/* Tabs */}
      <div className="glass rounded-2xl p-1 flex gap-1">
        {[{id:'profile',label:'Profile'},{id:'orders',label:'Order History'}].map(({id,label}) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className={`flex-1 py-2.5 rounded-xl font-medium text-sm transition-all
              ${activeTab===id ? 'btn-glow-orange text-white' : 'text-forest-100/60 hover:text-white'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* PROFILE TAB */}
      {activeTab === 'profile' && (
        <div className="space-y-4">
          {/* Hero card */}
          <div className="glass card-3d rounded-3xl p-6">
            <div className="flex flex-col sm:flex-row items-center gap-5">
              <div className="relative flex-shrink-0">
                <img src={user.profileImage} alt={user.name}
                  className="w-24 h-24 rounded-2xl object-cover border-2 border-white/15" />
                <div className="absolute -bottom-2 -right-2 w-8 h-8 btn-glow-green rounded-lg flex items-center justify-center cursor-pointer">
                  <Edit2 className="w-4 h-4 text-white" />
                </div>
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h2 className="text-xl font-heading font-bold text-white mb-0.5">{user.name}</h2>
                <p className="text-forest-200/60 text-sm mb-3">{user.email}</p>
                <div className="inline-flex items-center gap-1.5 btn-glow-orange px-3 py-1.5 rounded-full text-white text-xs font-semibold">
                  <Crown className="w-3.5 h-3.5" />
                  {user.subscriptionPlan === 'premium' ? 'Premium' : 'Basic'} Member
                </div>
              </div>
              <div className="flex gap-5 text-center">
                {[
                  { val: orders.length, label:'Orders' },
                  { val:`₱${totalSpent.toFixed(0)}`, label:'Spent' },
                  { val:'8', label:'Favs' },
                ].map(({val,label}) => (
                  <div key={label}>
                    <p className="text-xl font-heading font-bold text-ember-400">{val}</p>
                    <p className="text-forest-200/50 text-xs">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick actions */}
          <div>
            <p className="text-white font-semibold mb-3">Quick Actions</p>
            <div className="grid grid-cols-4 gap-3">
              {QUICK_ACTIONS.map(({ label, icon:Icon, color, tab, to, logout }) => (
                <button key={label}
                  onClick={() => {
                    if (logout) { addNotification('Signed out', 'info'); navigate('/welcome'); }
                    else if (tab) setActiveTab(tab);
                    else navigate(to);
                  }}
                  className="glass card-3d rounded-2xl p-3 flex flex-col items-center gap-2 hover:glass-green transition-all group">
                  <div className={`w-10 h-10 bg-gradient-to-br ${color} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <p className={`text-xs font-medium text-center leading-tight ${logout ? 'text-red-400' : 'text-forest-100/70'}`}>{label}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Role dashboards */}
          {(user.roles.restaurantOwner || user.roles.rider) && (
            <div>
              <p className="text-white font-semibold mb-3">My Dashboards</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {user.roles.restaurantOwner && (
                  <div className="glass-orange card-3d rounded-2xl p-5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-ember-500/20 rounded-full -translate-y-10 translate-x-10" />
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-12 h-12 glass rounded-xl flex items-center justify-center">
                        <Store className="w-6 h-6 text-ember-400" />
                      </div>
                      {user.roles.restaurantOwner.status === 'approved' && (
                        <button onClick={() => handleCancelRole('restaurantOwner')}
                          className="w-7 h-7 glass rounded-full flex items-center justify-center text-white/60 hover:text-white">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <p className="text-white font-bold">Restaurant Owner</p>
                    {user.roles.restaurantOwner.status === 'approved' ? (
                      <>
                        <p className="text-forest-200/60 text-xs mb-3">{user.roles.restaurantOwner.restaurantName}</p>
                        <Link to="/owner/dashboard"
                          className="w-full glass text-white text-sm font-semibold py-2 rounded-xl flex items-center justify-center gap-1.5 hover:glass-green transition-all">
                          Open Dashboard <ArrowRight className="w-4 h-4" />
                        </Link>
                      </>
                    ) : (
                      <p className="text-forest-200/60 text-xs mt-2">⏳ Application under review</p>
                    )}
                  </div>
                )}
                {user.roles.rider && (
                  <div className="glass card-3d rounded-2xl p-5 relative overflow-hidden"
                    style={{ borderColor:'rgba(45,138,87,.3)' }}>
                    <div className="absolute top-0 right-0 w-20 h-20 bg-forest-500/20 rounded-full -translate-y-10 translate-x-10" />
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-12 h-12 glass-green rounded-xl flex items-center justify-center">
                        <Bike className="w-6 h-6 text-forest-300" />
                      </div>
                      {user.roles.rider.status === 'approved' && (
                        <button onClick={() => handleCancelRole('rider')}
                          className="w-7 h-7 glass rounded-full flex items-center justify-center text-white/60 hover:text-white">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <p className="text-white font-bold">Rider</p>
                    {user.roles.rider.status === 'approved' ? (
                      <>
                        <p className="text-forest-200/60 text-xs mb-3">Delivery Partner</p>
                        <Link to="/rider/dashboard"
                          className="w-full glass text-white text-sm font-semibold py-2 rounded-xl flex items-center justify-center gap-1.5 hover:glass-green transition-all">
                          Open Dashboard <ArrowRight className="w-4 h-4" />
                        </Link>
                      </>
                    ) : (
                      <p className="text-forest-200/60 text-xs mt-2">⏳ Application under review</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Edit profile */}
          <div className="glass rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-white font-semibold">Personal Info</p>
              {!isEditing
                ? <button onClick={() => setIsEditing(true)} className="glass text-forest-200 text-xs px-3 py-1.5 rounded-lg hover:glass-green transition-all">Edit</button>
                : <div className="flex gap-2">
                    <button onClick={() => setIsEditing(false)} className="glass text-forest-200 text-xs px-3 py-1.5 rounded-lg">Cancel</button>
                    <button onClick={handleSave} className="btn-glow-green text-white text-xs px-3 py-1.5 rounded-lg">Save</button>
                  </div>
              }
            </div>
            <div className="space-y-3">
              {[
                { label:'Full Name', field:'name', type:'text' },
                { label:'Email',     field:'email', type:'email' },
                { label:'Phone',     field:'phone', type:'tel' },
                { label:'Address',   field:'address', type:'text' },
              ].map(({ label, field, type }) => (
                <div key={field}>
                  <p className="text-forest-200/50 text-xs mb-1">{label}</p>
                  <input type={type} value={user[field]}
                    onChange={e => setUser(u => ({ ...u, [field]:e.target.value }))}
                    disabled={!isEditing}
                    className={`w-full input-glass py-2 text-sm ${isEditing ? '' : 'opacity-70 cursor-not-allowed'}`} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ORDERS TAB */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {orders.length === 0 ? (
            <div className="glass rounded-3xl py-16 flex flex-col items-center gap-3">
              <span className="text-5xl">📦</span>
              <p className="text-white font-semibold">No orders yet</p>
              <button onClick={() => navigate('/restaurants')} className="btn-glow-orange text-white text-sm px-5 py-2.5 rounded-xl mt-2">Browse Food</button>
            </div>
          ) : (
            orders.map((order, idx) => (
              <div key={order.id} className="glass card-3d rounded-2xl p-5 animate-fade-up" style={{ animationDelay:`${idx*60}ms` }}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-white font-semibold">Order #{order.id}</p>
                    <p className="text-forest-200/60 text-xs mt-0.5">{order.restaurant}</p>
                    <p className="text-forest-200/40 text-xs">{new Date(order.date).toLocaleDateString('en-PH', { year:'numeric', month:'short', day:'numeric' })}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-ember-400 font-heading font-bold text-lg">₱{order.total.toFixed(2)}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${statusBadge(order.status)}`}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                  </div>
                </div>

                <div className="glass-dark rounded-xl p-3 mb-3">
                  {order.items.map((item, i) => (
                    <div key={i} className="flex justify-between text-xs py-0.5">
                      <span className="text-forest-200/70">{item.quantity}× {item.name}</span>
                      <span className="text-forest-100 font-medium">₱{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <button onClick={() => handleReorder(order)}
                    className="flex items-center gap-1.5 glass hover:glass-orange text-forest-200 text-xs px-3 py-2 rounded-xl transition-all">
                    <RotateCcw className="w-3.5 h-3.5" /> Reorder
                  </button>
                  <Link to={`/restaurant/${order.restaurantId}`}
                    className="flex items-center gap-1.5 glass hover:glass-green text-forest-200 text-xs px-3 py-2 rounded-xl transition-all">
                    <Store className="w-3.5 h-3.5" /> Restaurant
                  </Link>
                  <button className="flex items-center gap-1.5 glass hover:glass-green text-forest-200 text-xs px-3 py-2 rounded-xl transition-all">
                    <Star className="w-3.5 h-3.5" /> Rate
                  </button>
                  <button className="flex items-center gap-1.5 glass hover:glass-green text-forest-200 text-xs px-3 py-2 rounded-xl transition-all">
                    <Receipt className="w-3.5 h-3.5" /> Receipt
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
