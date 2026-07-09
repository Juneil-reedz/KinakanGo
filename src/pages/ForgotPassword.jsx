import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../context/NotificationContext';
import { Mail, ArrowLeft, Utensils, ChevronRight, Check } from 'lucide-react';
import { authApi } from '../services/api';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const { addNotification } = useNotification();
  const [email, setEmail]     = useState('');
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) { setError('Email is required'); return; }
    if (!/\S+@\S+\.\S+/.test(email)) { setError('Invalid email address'); return; }
    setLoading(true);
    try {
      await authApi.forgotPassword(email);
      setSent(true);
      addNotification('Reset link sent!', 'success');
    } catch (err) {
      setError(err?.data?.error || err?.message || 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-4 py-8">
      <div className="orb w-96 h-96 bg-forest-600/20 top-[-5rem] left-[-5rem]" />
      <div className="orb w-72 h-72 bg-ember-500/15 bottom-[-4rem] right-[-4rem]" />

      <div className="w-full max-w-md relative z-10 animate-fade-up">
        <button onClick={() => navigate('/login')}
          className="flex items-center gap-1.5 text-forest-200/60 hover:text-forest-100 text-sm mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Login
        </button>

        <div className="glass rounded-3xl p-8 card-3d" style={{ boxShadow:'0 32px 64px rgba(0,0,0,.5)' }}>
          {sent ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 btn-glow-green rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-xl font-heading font-bold text-white mb-2">Check Your Email</h2>
              <p className="text-forest-200/60 text-sm mb-2">We sent a reset link to:</p>
              <p className="text-ember-400 font-semibold mb-5">{email}</p>
              <p className="text-forest-200/50 text-xs mb-8">The link expires in 1 hour.</p>
              <div className="space-y-3">
                <button onClick={() => navigate('/login')} className="w-full btn-glow-orange text-white font-bold py-3.5 rounded-xl">
                  Back to Login
                </button>
                <button onClick={() => { setSent(false); setEmail(''); }}
                  className="w-full glass text-forest-200 py-3 rounded-xl text-sm hover:glass-green transition-all">
                  Resend Email
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-col items-center mb-7">
                <div className="w-16 h-16 btn-glow-green rounded-2xl flex items-center justify-center mb-3">
                  <Utensils className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-2xl font-heading font-bold text-white">Forgot Password?</h1>
                <p className="text-forest-200/60 text-sm mt-1 text-center">Enter your email to receive reset instructions</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-forest-200/80 text-xs font-medium mb-1.5">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-forest-300/50" />
                    <input type="email" value={email}
                      onChange={e => { setEmail(e.target.value); setError(''); }}
                      placeholder="you@example.com"
                      className={`w-full input-glass pl-10 pr-4 py-3 text-sm ${error ? 'border-red-500/50' : ''}`} />
                  </div>
                  {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
                </div>

                <button type="submit" disabled={loading}
                  className={`w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all
                    ${loading ? 'glass text-forest-200/50 cursor-not-allowed' : 'btn-glow-orange text-white'}`}>
                  {loading
                    ? <><div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Sending…</>
                    : <>Send Reset Link <ChevronRight className="w-4 h-4" /></>}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
