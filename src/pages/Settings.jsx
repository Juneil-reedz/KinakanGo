import { useState } from 'react';
import { Bell, Lock, Moon, Shield, HelpCircle, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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

  const [s, setS] = useState({
    notifications: { orderUpdates:true, promotions:true, newRestaurants:false, newsletter:false },
    privacy:       { shareData:false, saveHistory:true },
    appearance:    { darkMode:true, language:'en' },
  });

  const toggle = (cat, key) => setS(prev => ({ ...prev, [cat]: { ...prev[cat], [key]: !prev[cat][key] } }));

  return (
    <div className="space-y-4 pb-20 lg:pb-0 animate-fade-up">
      <h1 className="text-2xl font-heading font-bold text-white">Settings</h1>

      {/* Notifications */}
      <Section title="Notifications" desc="Manage your notification preferences" icon={Bell} iconColor="btn-glow-orange">
        <ToggleRow label="Order Updates"    desc="Get notified about your order status"        value={s.notifications.orderUpdates}   onChange={() => toggle('notifications','orderUpdates')} />
        <ToggleRow label="Promotions"       desc="Receive special offers and discounts"         value={s.notifications.promotions}     onChange={() => toggle('notifications','promotions')} />
        <ToggleRow label="New Restaurants"  desc="Be notified when new restaurants join"        value={s.notifications.newRestaurants} onChange={() => toggle('notifications','newRestaurants')} />
        <ToggleRow label="Newsletter"       desc="Weekly newsletter with food tips"             value={s.notifications.newsletter}     onChange={() => toggle('notifications','newsletter')} />
      </Section>

      {/* Privacy */}
      <Section title="Privacy & Security" desc="Control your data and security" icon={Shield} iconColor="btn-glow-green">
        <ToggleRow label="Share Usage Data"   desc="Help us improve by sharing anonymous data" value={s.privacy.shareData}   onChange={() => toggle('privacy','shareData')} />
        <ToggleRow label="Save Order History" desc="Keep records of your past orders"          value={s.privacy.saveHistory} onChange={() => toggle('privacy','saveHistory')} />
      </Section>

      {/* Appearance */}
      <Section title="Appearance" desc="Customize how the app looks" icon={Moon} iconColor="glass">
        <ToggleRow label="Dark Mode" desc="Use the dark theme" value={s.appearance.darkMode} onChange={() => toggle('appearance','darkMode')} />
        <div className="flex items-center justify-between">
          <div>
            <p className="text-forest-100 text-sm font-medium">Language</p>
            <p className="text-forest-200/50 text-xs mt-0.5">Select your preferred language</p>
          </div>
          <select value={s.appearance.language} onChange={e => setS(prev => ({ ...prev, appearance:{ ...prev.appearance, language:e.target.value } }))}
            className="input-glass py-1.5 px-3 text-sm">
            <option value="en" style={{background:'#0d2b1a'}}>English</option>
            <option value="fil" style={{background:'#0d2b1a'}}>Filipino</option>
          </select>
        </div>
      </Section>

      {/* Account actions */}
      <div className="glass rounded-2xl p-5 space-y-2">
        <p className="text-white font-semibold mb-3">Account</p>
        {[
          { label:'Change Password', icon:Lock,        action:() => navigate('/forgot-password') },
          { label:'Help & Support',  icon:HelpCircle,  action:() => navigate('/customer-service') },
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
