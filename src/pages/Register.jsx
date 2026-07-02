import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { Eye, EyeOff, User, Mail, Phone, Lock, Utensils, ChevronRight, ArrowLeft, Check } from 'lucide-react';

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { addNotification } = useNotification();

  const [form, setForm] = useState({ name:'', email:'', phone:'', password:'', confirmPassword:'', agreeToTerms:false });
  const [showPass, setShowPass]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors]         = useState({});
  const [loading, setLoading]       = useState(false);

  const set = (field) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm(f => ({ ...f, [field]: val }));
    setErrors(er => ({ ...er, [field]: undefined }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim() || form.name.trim().length < 2) e.name = 'Name must be at least 2 characters';
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email address';
    if (form.phone && !/^[\d\s\-()+]+$/.test(form.phone)) e.phone = 'Invalid phone number';
    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 8) e.password = 'Minimum 8 characters';
    else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(form.password)) e.password = 'Needs uppercase, lowercase & number';
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    if (!form.agreeToTerms) e.agreeToTerms = 'You must agree to continue';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await register({ name: form.name, email: form.email, phone: form.phone, password: form.password });
      addNotification('Account created! Welcome aboard', 'success');
      navigate('/');
    } catch (err) {
      const msg = err?.data?.error || err?.message || 'Registration failed';
      if (msg.toLowerCase().includes('email')) {
        setErrors({ email: msg });
      } else {
        setErrors({ password: msg });
      }
    } finally {
      setLoading(false);
    }
  };

  const pwStrength = () => {
    if (!form.password) return 0;
    let s = 0;
    if (form.password.length >= 8) s++;
    if (/[A-Z]/.test(form.password)) s++;
    if (/[a-z]/.test(form.password)) s++;
    if (/\d/.test(form.password)) s++;
    if (/[^a-zA-Z0-9]/.test(form.password)) s++;
    return s;
  };
  const strength = pwStrength();
  const strengthColor = ['bg-red-500','bg-red-400','bg-ember-500','bg-forest-400','bg-forest-500'][Math.max(0,strength-1)] || 'bg-forest-800';
  const strengthLabel = ['','Weak','Fair','Good','Strong','Very Strong'][strength] || '';

  const fields = [
    { id:'name',            label:'Full Name',        type:'text',     icon:User,  placeholder:'Juan dela Cruz' },
    { id:'email',           label:'Email Address',    type:'email',    icon:Mail,  placeholder:'you@example.com' },
    { id:'phone',           label:'Phone (optional)', type:'tel',      icon:Phone, placeholder:'+63 912 345 6789' },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-4 py-10">
      <div className="orb w-96 h-96 bg-forest-600/20 top-[-5rem] left-[-5rem]" />
      <div className="orb w-72 h-72 bg-ember-500/15 bottom-[-4rem] right-[-4rem]" />

      <div className="w-full max-w-md relative z-10 animate-fade-up">
        <button onClick={() => navigate('/welcome')}
          className="flex items-center gap-1.5 text-forest-200/60 hover:text-forest-100 text-sm mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="glass rounded-3xl p-8 card-3d" style={{ boxShadow:'0 32px 64px rgba(0,0,0,.5)' }}>
          <div className="flex flex-col items-center mb-7">
            <div className="w-16 h-16 btn-glow-green rounded-2xl flex items-center justify-center mb-3">
              <Utensils className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-heading font-bold text-white">Create Account</h1>
            <p className="text-forest-200/60 text-sm mt-1">Join KinakanGo today</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {fields.map(({ id, label, type, icon: Icon, placeholder }) => (
              <div key={id}>
                <label className="block text-forest-200/80 text-xs font-medium mb-1.5">{label}</label>
                <div className="relative">
                  <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-forest-300/50" />
                  <input type={type} value={form[id]} onChange={set(id)} placeholder={placeholder}
                    className={`w-full input-glass pl-10 pr-4 py-3 text-sm ${errors[id] ? 'border-red-500/50' : ''}`} />
                </div>
                {errors[id] && <p className="text-red-400 text-xs mt-1">{errors[id]}</p>}
              </div>
            ))}

            {/* Password */}
            <div>
              <label className="block text-forest-200/80 text-xs font-medium mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-forest-300/50" />
                <input type={showPass ? 'text' : 'password'} value={form.password} onChange={set('password')}
                  placeholder="••••••••"
                  className={`w-full input-glass pl-10 pr-10 py-3 text-sm ${errors.password ? 'border-red-500/50' : ''}`} />
                <button type="button" onClick={() => setShowPass(s=>!s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-forest-300/50 hover:text-forest-200 transition-colors">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {form.password && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1,2,3,4,5].map(i => (
                      <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= strength ? strengthColor : 'bg-forest-800'}`} />
                    ))}
                  </div>
                  <p className="text-xs text-forest-200/50">{strengthLabel}</p>
                </div>
              )}
              {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-forest-200/80 text-xs font-medium mb-1.5">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-forest-300/50" />
                <input type={showConfirm ? 'text' : 'password'} value={form.confirmPassword} onChange={set('confirmPassword')}
                  placeholder="••••••••"
                  className={`w-full input-glass pl-10 pr-10 py-3 text-sm ${errors.confirmPassword ? 'border-red-500/50' : ''}`} />
                <button type="button" onClick={() => setShowConfirm(s=>!s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-forest-300/50 hover:text-forest-200 transition-colors">
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-red-400 text-xs mt-1">{errors.confirmPassword}</p>}
            </div>

            {/* Terms */}
            <label className="flex items-start gap-3 cursor-pointer">
              <div onClick={() => setForm(f => ({ ...f, agreeToTerms: !f.agreeToTerms }))}
                className={`w-5 h-5 rounded-md border-2 flex-shrink-0 flex items-center justify-center mt-0.5 transition-all cursor-pointer
                  ${form.agreeToTerms ? 'btn-glow-green border-transparent' : 'border-forest-600 glass'}`}>
                {form.agreeToTerms && <Check className="w-3 h-3 text-white" />}
              </div>
              <span className="text-forest-200/60 text-xs leading-relaxed">
                I agree to the <span className="text-ember-400 hover:text-ember-300 cursor-pointer">Terms of Service</span>{' '}
                and <span className="text-ember-400 hover:text-ember-300 cursor-pointer">Privacy Policy</span>
              </span>
            </label>
            {errors.agreeToTerms && <p className="text-red-400 text-xs">{errors.agreeToTerms}</p>}

            <button type="submit" disabled={loading}
              className={`w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all mt-2
                ${loading ? 'glass text-forest-200/50 cursor-not-allowed' : 'btn-glow-orange text-white'}`}>
              {loading
                ? <><div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Creating account…</>
                : <>Create Account <ChevronRight className="w-4 h-4" /></>}
            </button>
          </form>

          <p className="text-center text-forest-200/50 text-sm mt-5">
            Already have an account?{' '}
            <button onClick={() => navigate('/login')} className="text-ember-400 font-semibold hover:text-ember-300 transition-colors">
              Sign In
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
