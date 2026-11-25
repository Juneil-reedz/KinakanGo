import { Lock, Moon, HelpCircle, ChevronRight, FileText, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

function Toggle({ value, onChange }) {
  return (
    <button onClick={onChange}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0
        ${value ? 'btn-glow-orange' : 'glass'}`}>
      <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform
        ${value ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  );
}

function Section({ title, desc, icon: Icon, iconColor, children }) {
  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center gap-3 mb-5">
        <div className={`w-9 h-9 ${iconColor} rounded-xl flex items-center justify-center flex-shrink-0`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-white font-semibold">{title}</p>
          <p className="text-forest-200/50 text-xs">{desc}</p>
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function ToggleRow({ label, desc, value, onChange }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-forest-100 text-sm font-medium">{label}</p>
        {desc && <p className="text-forest-200/50 text-xs mt-0.5">{desc}</p>}
      </div>
      <Toggle value={value} onChange={onChange} />
    </div>
  );
}

export default function Settings() {
  const navigate   = useNavigate();
  const { isLight, toggleTheme } = useTheme();

  return (
    <div className="space-y-4 pb-20 lg:pb-0 animate-fade-up">
      <h1 className="text-2xl font-heading font-bold text-white">Settings</h1>

      {/* Appearance */}
      <Section title="Appearance" desc="Customize how the app looks" icon={Moon} iconColor="glass">
        <ToggleRow label="Dark Mode" desc="Use the dark theme" value={!isLight} onChange={toggleTheme} />
      </Section>

      {/* Account actions */}
      <div className="glass rounded-2xl p-5 space-y-2">
        <p className="text-white font-semibold mb-3">Account</p>
        {[
          { label:'Change Password', icon:Lock,        action:() => navigate('/change-password') },
          { label:'Help & Support',  icon:HelpCircle,  action:() => navigate('/customer-service') },
          { label:'Terms of Service', icon:FileText,   action:() => navigate('/terms') },
          { label:'Privacy Policy',  icon:ShieldCheck, action:() => navigate('/privacy') },
        ].map(({ label, icon:Icon, action }) => (
          <button key={label} onClick={action}
            className="w-full flex items-center justify-between px-4 py-3 glass rounded-xl hover:glass-green transition-all group">
            <div className="flex items-center gap-3">
              <Icon className="w-4 h-4 text-forest-300/60 group-hover:text-forest-200 transition-colors" />
              <span className="text-forest-100/80 text-sm font-medium group-hover:text-white transition-colors">{label}</span>
            </div>
            <ChevronRight className="w-4 h-4 text-forest-200/30 group-hover:text-forest-200 transition-colors" />
          </button>
        ))}
      </div>

      <p className="text-center text-forest-200/30 text-xs pb-2">KinakanGo v1.0.0 · Bongao, Tawi-Tawi 🇵🇭</p>
    </div>
  );
}
