import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock, Eye, EyeOff } from 'lucide-react';
import { authApi } from '../services/api';
import { useNotification } from '../context/NotificationContext';
import useGoBack from '../hooks/useGoBack';

function PasswordField({ label, value, onChange, error, autoComplete }) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label className="block text-forest-200/80 text-xs font-medium mb-1.5">{label}</label>
      <div className="relative">
        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-forest-300/60" />
        <input type={show ? 'text' : 'password'} value={value} onChange={onChange} autoComplete={autoComplete}
          className={`w-full input-glass pl-10 pr-10 py-3 text-sm ${error ? 'border-red-500/50' : ''}`} />
        <button type="button" onClick={() => setShow(s => !s)} aria-label={show ? 'Hide password' : 'Show password'}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-forest-300/60 hover:text-forest-100">
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
  );
}

export default function ChangePassword() {
  const navigate = useNavigate();
  const goBack = useGoBack();
  const { addNotification } = useNotification();
  const [form, setForm]       = useState({ current: '', next: '', confirm: '' });
  const [errors, setErrors]   = useState({});
  const [loading, setLoading] = useState(false);

  const set = (key) => (e) => { setForm(f => ({ ...f, [key]: e.target.value })); setErrors(er => ({ ...er, [key]: '' })); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const er = {};
    if (!form.current) er.current = 'Enter your current password';
    if (form.next.length < 8) er.next = 'Password must be at least 8 characters';
    else if (form.next === form.current) er.next = 'New password must be different';
    if (form.confirm !== form.next) er.confirm = 'Passwords do not match';
    setErrors(er);
    if (Object.keys(er).length) return;

    setLoading(true);
    try {
      await authApi.changePassword(form.current, form.next);
      addNotification('Password changed', 'success');
      goBack('/settings');
    } catch (err) {
      const msg = err?.data?.error || err?.message || 'Could not change password';
      setErrors(/current/i.test(msg) ? { current: msg } : { next: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md space-y-4 pb-20 lg:pb-0 animate-fade-up">
      <button onClick={() => goBack('/settings')}
        className="flex items-center gap-1.5 text-forest-200/60 hover:text-forest-100 text-sm transition-colors">
        <ArrowLeft className="w-4 h-4" /> Settings
      </button>
      <h1 className="text-2xl font-heading font-bold text-white">Change Password</h1>

      <form onSubmit={handleSubmit} className="glass rounded-2xl p-5 space-y-4">
        <PasswordField label="Current password" value={form.current} onChange={set('current')} error={errors.current} autoComplete="current-password" />
        <PasswordField label="New password" value={form.next} onChange={set('next')} error={errors.next} autoComplete="new-password" />
        <PasswordField label="Confirm new password" value={form.confirm} onChange={set('confirm')} error={errors.confirm} autoComplete="new-password" />
        <p className="text-forest-200/50 text-xs">Other devices signed in to your account will be signed out.</p>

        <button type="submit" disabled={loading}
          className={`w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all
            ${loading ? 'glass text-forest-200/50 cursor-not-allowed' : 'btn-glow-orange text-white'}`}>
          {loading
            ? <><div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Saving…</>
            : 'Update Password'}
        </button>

        <button type="button" onClick={() => navigate('/forgot-password')}
          className="w-full text-ember-400 hover:text-ember-300 text-xs font-medium transition-colors">
          Forgot your current password?
        </button>
      </form>
    </div>
  );
}
