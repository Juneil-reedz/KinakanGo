import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useRestaurant } from '../../context/RestaurantContext';
import { useNotification } from '../../context/NotificationContext';
import { Mail, Lock, Eye, EyeOff, ChevronRight, ArrowLeft, Store } from 'lucide-react';

export default function RestaurantLogin() {
  const navigate = useNavigate();
  const { login } = useRestaurant();
  const { showSuccess, showError } = useNotification();

  const [form, setForm]         = useState({ email:'owner@pizzapalace.com', password:'demo123' });
  const [showPass, setShowPass] = useState(false);
  const [errors, setErrors]     = useState({});
  const [loading, setLoading]   = useState(false);

  const set = (f) => (e) => { setForm(p => ({...p,[f]:e.target.value})); setErrors(er => ({...er,[f]:''})); };

  const validate = () => {
    const e = {};
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) e.email = 'Valid email required';
    if (!form.password || form.password.length < 6) e.password = 'Minimum 6 characters';
    setErrors(e); return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const result = await login(form.email, form.password);
      if (result.success) { showSuccess('Welcome back!'); setTimeout(() => navigate('/owner/dashboard'), 800); }
      else { showError(result.error || 'Login failed'); setLoading(false); }
    } catch { showError('An error occurred'); setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-4 py-8">
      <div className="orb w-96 h-96 bg-forest-600/20 top-[-5rem] left-[-5rem]" />
      <div className="orb w-72 h-72 bg-ember-500/15 bottom-[-4rem] right-[-4rem]" />

      <div className="w-full max-w-md relative z-10 animate-fade-up">
        <Link to="/login" className="flex items-center gap-1.5 text-forest-200/60 hover:text-forest-100 text-sm mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>

        <div className="glass rounded-3xl p-8 card-3d" style={{ boxShadow:'0 32px 64px rgba(0,0,0,.5)' }}>
          <div className="flex flex-col items-center mb-7">
            <div className="w-16 h-16 btn-glow-orange rounded-2xl flex items-center justify-center mb-3 animate-breathe">
              <Store className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-heading font-bold text-white">Restaurant Portal</h1>
            <p className="text-forest-200/60 text-sm mt-1">Manage your restaurant</p>
          </div>

          <div className="glass-green rounded-xl px-4 py-3 mb-5">
            <p className="text-forest-200 text-xs"><span className="font-semibold text-white">Demo:</span> owner@pizzapalace.com / demo123</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-forest-200/80 text-xs font-medium mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-forest-300/50" />
                <input type="email" value={form.email} onChange={set('email')} placeholder="owner@example.com"
                  className={`w-full input-glass pl-10 pr-4 py-3 text-sm ${errors.email ? 'border-red-500/50' : ''}`} />
              </div>
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
            </div>
            <div>
              <label className="block text-forest-200/80 text-xs font-medium mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-forest-300/50" />
                <input type={showPass ? 'text' : 'password'} value={form.password} onChange={set('password')} placeholder="••••••"
                  className={`w-full input-glass pl-10 pr-10 py-3 text-sm ${errors.password ? 'border-red-500/50' : ''}`} />
                <button type="button" onClick={() => setShowPass(s=>!s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-forest-300/50 hover:text-forest-200">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
            </div>

            <button type="submit" disabled={loading}
              className={`w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all
                ${loading ? 'glass text-forest-200/50 cursor-not-allowed' : 'btn-glow-orange text-white'}`}>
              {loading
                ? <><div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Signing in…</>
                : <>Sign In <ChevronRight className="w-4 h-4" /></>}
            </button>
          </form>

          <p className="text-center text-forest-200/50 text-sm mt-5">
            Want to partner with us?{' '}
            <Link to="/restaurant-owner-application" className="text-ember-400 font-semibold hover:text-ember-300 transition-colors">Apply here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
