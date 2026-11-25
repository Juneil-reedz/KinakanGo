import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { Eye, EyeOff, Mail, Lock, ChevronRight } from 'lucide-react';
import AuthShell from '../components/AuthShell';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { addNotification } = useNotification();
  const [form, setForm]       = useState({ email:'', password:'' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]  = useState(false);
  const [errors, setErrors]    = useState({});

  const validate = () => {
    const e = {};
    if (!form.email) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email';
    if (!form.password) e.password = 'Password is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await login(form.email, form.password);
      addNotification('Login successful! Welcome back! 🎉', 'success');
      navigate(location.state?.from && location.state.from !== '/' ? location.state.from : '/welcome', { replace: true });
    } catch (err) {
      const msg = err?.data?.error || err?.message || 'Invalid email or password';
      setErrors({ password: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell active="login" title="Welcome back" subtitle="Sign in to continue ordering">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-forest-200/80 text-sm font-medium mb-1.5">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-forest-300/50" />
            <input type="email" value={form.email}
              onChange={e => { setForm(f=>({...f,email:e.target.value})); setErrors(er=>({...er,email:undefined})); }}
              placeholder="you@example.com"
              className={`w-full input-glass pl-10 pr-4 py-3 text-sm ${errors.email ? 'border-red-500/50' : ''}`} />
          </div>
          {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
        </div>

        <div>
          <label className="block text-forest-200/80 text-sm font-medium mb-1.5">Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-forest-300/50" />
            <input type={showPass ? 'text' : 'password'} value={form.password}
              onChange={e => { setForm(f=>({...f,password:e.target.value})); setErrors(er=>({...er,password:undefined})); }}
              placeholder="••••••••"
              className={`w-full input-glass pl-10 pr-10 py-3 text-sm ${errors.password ? 'border-red-500/50' : ''}`} />
            <button type="button" onClick={() => setShowPass(s=>!s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-forest-300/50 hover:text-forest-200 transition-colors">
              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
        </div>

        <div className="flex justify-end">
          <button type="button" onClick={() => navigate('/forgot-password')}
            className="text-ember-400 text-xs hover:text-ember-300 transition-colors">
            Forgot password?
          </button>
        </div>

        <button type="submit" disabled={loading}
          className={`w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all
            ${loading ? 'glass text-forest-200/50 cursor-not-allowed' : 'btn-glow-orange text-white'}`}>
          {loading
            ? <><div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Signing in…</>
            : <>Sign In <ChevronRight className="w-4 h-4" /></>}
        </button>
      </form>
    </AuthShell>
  );
}
