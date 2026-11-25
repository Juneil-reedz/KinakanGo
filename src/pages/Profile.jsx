import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { ordersApi } from '../services/api';
import {
  ArrowRight, X, Mail, Edit2, Package, Heart, Phone, MapPin,
  LogOut, Settings, Check, User, Camera
} from 'lucide-react';

const QUICK_ACTIONS = [
  { label:'Orders',        icon:Package,   color:'from-forest-600 to-forest-700', to:'/orders' },
  { label:'Favorites',     icon:Heart,     color:'from-forest-500 to-forest-600', to:'/favorites' },
  { label:'Addresses',     icon:MapPin,    color:'from-forest-700 to-forest-800', to:'/addresses' },
  { label:'Support',       icon:Mail,      color:'from-ember-400 to-ember-500',   to:'/customer-service' },
  { label:'Settings',      icon:Settings,  color:'from-forest-600 to-forest-700', to:'/settings' },
  { label:'Logout',        icon:LogOut,    color:'from-red-600 to-red-700',       logout:true },
];

const resizeImage = (file, maxSize = 420, quality = 0.82) => new Promise((resolve, reject) => {
  const img = new Image();
  const reader = new FileReader();
  reader.onload = ev => { img.src = ev.target.result; };
  reader.onerror = reject;
  img.onload = () => {
    const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    resolve(canvas.toDataURL('image/jpeg', quality));
  };
  img.onerror = reject;
  reader.readAsDataURL(file);
});

export default function Profile() {
  const navigate = useNavigate();
  const { user, logout, updateUser } = useAuth();
  const { addNotification }          = useNotification();

  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm]           = useState({ name: user?.name || '', email: user?.email || '', phone: user?.phone || '' });
  const [orders, setOrders]       = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [saving, setSaving]       = useState(false);
  const avatarInputRef            = useRef(null);

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      addNotification('Image must be under 2 MB', 'error');
      return;
    }
    try {
      const avatar = await resizeImage(file);
      await updateUser({ avatar });
      addNotification('Profile photo updated!', 'success');
    } catch {
      addNotification('Failed to save profile photo', 'error');
    }
  };

  useEffect(() => {
    setOrdersLoading(true);
    ordersApi.list({ limit: 20 }).then(res => {
      setOrders(res?.data ?? []);
    }).catch(() => setOrders([])).finally(() => setOrdersLoading(false));
  }, []);

  useEffect(() => {
    if (user) setForm({ name: user.name || '', email: user.email || '', phone: user.phone || '' });
  }, [user]);

  const totalSpent = orders.reduce((s, o) => s + Number(o.total ?? 0), 0);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateUser(form);
      setIsEditing(false);
      addNotification('Profile updated!', 'success');
    } catch {
      addNotification('Failed to update profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  if (!user) return null;

  return (
    <div className="space-y-5 pb-20 lg:pb-0 animate-fade-up">
      {/* PROFILE TAB */}
      {(
        <div className="space-y-4">
          {/* Hero card */}
          <div className="glass card-3d rounded-3xl p-5 sm:p-6 overflow-hidden">
            <div className="flex flex-col md:flex-row items-center gap-5 min-w-0">
              <div className="relative flex-shrink-0">
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
                <button
                  onClick={() => avatarInputRef.current?.click()}
                  className="w-24 h-24 rounded-2xl glass-dark flex items-center justify-center border-2 border-white/15 overflow-hidden group relative"
                >
                  {user.avatar
                    ? <img src={user.avatar} alt="avatar" className="w-full h-full object-cover" />
                    : <User className="w-10 h-10 text-forest-300/60" />
                  }
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-2xl">
                    <Camera className="w-6 h-6 text-white" />
                  </div>
                </button>
                <div className="absolute -bottom-1.5 -right-1.5 w-7 h-7 btn-glow-green rounded-full flex items-center justify-center pointer-events-none">
                  <Camera className="w-3.5 h-3.5 text-white" />
                </div>
              </div>
              <div className="flex-1 min-w-0 text-center md:text-left">
                <h2 className="text-xl font-heading font-bold text-white mb-0.5 truncate">{user.name}</h2>
                <p className="text-forest-200/60 text-sm mb-3 truncate max-w-full">{user.email}</p>
                <span className="inline-flex items-center gap-1.5 glass-green px-3 py-1.5 rounded-full text-forest-200 text-xs font-semibold capitalize">
                  {user.role?.replace('_', ' ') || 'Customer'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-center w-full md:w-auto md:flex md:gap-5">
                {[
                  { val: orders.length, label:'Orders' },
                  { val:`₱${totalSpent.toFixed(0)}`, label:'Spent' },
                ].map(({val,label}) => (
                  <div key={label} className="glass rounded-2xl px-4 py-3 md:bg-transparent md:border-0 md:shadow-none md:p-0">
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
            {/* 3 per row on phones, one row of 6 from tablet width (xl = 768px here) */}
            <div className="grid grid-cols-3 xl:grid-cols-6 gap-3">
              {QUICK_ACTIONS.map(({ label, icon:Icon, color, to, logout: isLogout }) => (
                <button key={label}
                  onClick={() => {
                    if (isLogout) handleLogout();
                    else navigate(to);
                  }}
                  className="glass card-3d rounded-2xl px-2 py-3 min-w-0 flex flex-col items-center gap-2 hover:glass-green transition-all group">
                  <div className={`w-10 h-10 bg-gradient-to-br ${color} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <p className={`w-full text-xs font-medium text-center leading-tight truncate ${isLogout ? 'text-red-400' : 'text-forest-100/70'}`}>{label}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Edit profile */}
          <div className="glass rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-white font-semibold">Personal Info</p>
              {!isEditing
                ? <button onClick={() => setIsEditing(true)} className="glass text-forest-200 text-xs px-3 py-1.5 rounded-lg hover:glass-green transition-all flex items-center gap-1">
                    <Edit2 className="w-3.5 h-3.5" /> Edit
                  </button>
                : <div className="flex gap-2">
                    <button onClick={() => setIsEditing(false)} className="glass text-forest-200 text-xs px-3 py-1.5 rounded-lg">Cancel</button>
                    <button onClick={handleSave} disabled={saving} className="btn-glow-green text-white text-xs px-3 py-1.5 rounded-lg flex items-center gap-1">
                      <Check className="w-3 h-3" /> {saving ? 'Saving…' : 'Save'}
                    </button>
                  </div>
              }
            </div>
            <div className="space-y-3">
              {[
                { label:'Full Name', field:'name',  type:'text' },
                { label:'Email',     field:'email', type:'email' },
                { label:'Phone',     field:'phone', type:'tel' },
              ].map(({ label, field, type }) => (
                <div key={field}>
                  <p className="text-forest-200/50 text-xs mb-1">{label}</p>
                  <input type={type} value={form[field] ?? ''}
                    onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                    disabled={!isEditing}
                    className={`w-full input-glass py-2 text-sm ${!isEditing ? 'opacity-70 cursor-not-allowed' : ''}`} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
