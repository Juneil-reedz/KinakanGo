import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { Eye, EyeOff, Mail, Lock, Utensils, ChevronRight, ArrowLeft } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
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
      navigate('/welcome', { replace: true });
    } catch {
      setErrors({ password: 'Invalid email or password' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-4 py-8">
      <div className="orb w-96 h-96 bg-forest-600/20 top-[-5rem] left-[-5rem]" />
      <div className="orb w-72 h-72 bg-ember-500/15 bottom-[-4rem] right-[-4rem]" />

      <div className="w-full max-w-md relative z-10 animate-fade-up">
        <button onClick={() => navigate('/welcome')}
          className="flex items-center gap-1.5 text-forest-200/60 hover:text-forest-100 text-sm mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="glass rounded-3xl p-8 card-3d" style={{ boxShadow: '0 32px 64px rgba(0,0,0,.5)' }}>
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 btn-glow-green rounded-2xl flex items-center justify-center mb-3">
              <Utensils className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-heading font-bold text-white">Welcome back</h1>
            <p className="text-forest-200/60 text-sm mt-1">Sign in to continue ordering</p>
          </div>

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

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px" style={{background:'rgba(255,255,255,.08)'}} />
            <span className="text-forest-200/40 text-xs">or sign in as</span>
            <div className="flex-1 h-px" style={{background:'rgba(255,255,255,.08)'}} />
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { label: '🏪 Restaurant', path: '/owner/login' },
              { label: '🛵 Rider',      path: '/rider/login' },
              { label: '⚙️ Admin',      path: '/admin/login' },
            ].map(({ label, path }) => (
              <button key={path} onClick={() => navigate(path)}
                className="glass py-2.5 rounded-xl text-forest-100/70 text-xs font-medium hover:glass-green hover:text-white transition-all text-center">
                {label}
              </button>
            ))}
          </div>

          <p className="text-center text-forest-200/50 text-sm mt-5">
            No account?{' '}
            <button onClick={() => navigate('/register')} className="text-ember-400 font-semibold hover:text-ember-300 transition-colors">
              Register
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
