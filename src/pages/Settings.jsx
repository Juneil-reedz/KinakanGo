import { useState } from 'react';
import { Bell, Lock, Globe, Palette, Moon, Sun, Shield, LogOut, HelpCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

export default function Settings() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [settings, setSettings] = useState({
    notifications: {
      orderUpdates: true,
      promotions: true,
      newRestaurants: false,
      newsletter: false,
    },
    privacy: {
      shareData: false,
      saveHistory: true,
    },
    appearance: {
      theme: 'light',
      language: 'en',
    }
  });

  const toggleSetting = (category, key) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: !prev[category][key]
      }
    }));
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#EBD5AB] p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
          <p className="text-gray-600">Manage your app preferences and account settings</p>
        </div>

        <div className="space-y-6">
          {/* Notifications */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gradient-to-br from-[#E67E22] to-[#d4721d] rounded-xl">
                <Bell className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Notifications</h2>
                <p className="text-sm text-gray-600">Manage your notification preferences</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Order Updates</p>
                  <p className="text-sm text-gray-600">Get notified about your order status</p>
                </div>
                <button
                  onClick={() => toggleSetting('notifications', 'orderUpdates')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.notifications.orderUpdates ? 'bg-[#E67E22]' : 'bg-gray-300'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.notifications.orderUpdates ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Promotions</p>
                  <p className="text-sm text-gray-600">Receive special offers and discounts</p>
                </div>
                <button
                  onClick={() => toggleSetting('notifications', 'promotions')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.notifications.promotions ? 'bg-[#E67E22]' : 'bg-gray-300'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.notifications.promotions ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">New Restaurants</p>
                  <p className="text-sm text-gray-600">Be notified when new restaurants join</p>
                </div>
                <button
                  onClick={() => toggleSetting('notifications', 'newRestaurants')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.notifications.newRestaurants ? 'bg-[#E67E22]' : 'bg-gray-300'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.notifications.newRestaurants ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Newsletter</p>
                  <p className="text-sm text-gray-600">Weekly newsletter with food tips</p>
                </div>
                <button
                  onClick={() => toggleSetting('notifications', 'newsletter')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.notifications.newsletter ? 'bg-[#E67E22]' : 'bg-gray-300'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.notifications.newsletter ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>
            </div>
          </div>

          {/* Privacy */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gradient-to-br from-[#8BAE66] to-[#628141] rounded-xl">
                <Shield className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Privacy & Security</h2>
                <p className="text-sm text-gray-600">Control your data and security</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Share Usage Data</p>
                  <p className="text-sm text-gray-600">Help us improve by sharing anonymous data</p>
                </div>
                <button
                  onClick={() => toggleSetting('privacy', 'shareData')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.privacy.shareData ? 'bg-[#E67E22]' : 'bg-gray-300'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.privacy.shareData ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Save Order History</p>
                  <p className="text-sm text-gray-600">Keep records of your past orders</p>
                </div>
                <button
                  onClick={() => toggleSetting('privacy', 'saveHistory')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.privacy.saveHistory ? 'bg-[#E67E22]' : 'bg-gray-300'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.privacy.saveHistory ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              <button className="w-full mt-4 flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors">
                <Lock className="w-5 h-5" />
                <span className="font-medium">Change Password</span>
              </button>
            </div>
          </div>

          {/* Support & Help */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gradient-to-br from-[#E67E22] to-[#d4721d] rounded-xl">
                <HelpCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Support & Help</h2>
                <p className="text-sm text-gray-600">Get help and find answers</p>
              </div>
            </div>

            <div className="space-y-3">
              <Link
                to="/customer-service"
                className="w-full flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 hover:border-[#E67E22] transition-colors"
              >
                <HelpCircle className="w-5 h-5" />
                <span className="font-medium">Help Center & FAQs</span>
              </Link>
            </div>
          </div>

          {/* Appearance */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gradient-to-br from-[#8BAE66] to-[#628141] rounded-xl">
                <Palette className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Appearance</h2>
                <p className="text-sm text-gray-600">Customize how the app looks</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Theme</label>
                <div className="grid grid-cols-2 gap-3">
                  <button className="flex items-center gap-3 p-3 border-2 border-[#E67E22] rounded-xl bg-[#8BAE66]">
                    <Sun className="w-5 h-5 text-white" />
                    <span className="font-medium text-gray-900">Light</span>
                  </button>
                  <button className="flex items-center gap-3 p-3 border-2 border-gray-200 rounded-xl hover:border-gray-300">
                    <Moon className="w-5 h-5 text-gray-600" />
                    <span className="font-medium text-gray-700">Dark</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
                <button className="w-full flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors">
                  <Globe className="w-5 h-5" />
                  <span className="flex-1 text-left">English (US)</span>
                  <span className="text-gray-400">▼</span>
                </button>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-white rounded-2xl p-6 border border-red-200 shadow-sm">
            <h2 className="text-xl font-bold text-red-600 mb-4">Danger Zone</h2>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors font-medium"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
