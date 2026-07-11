import { useState, useEffect } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { useNotification } from '../../context/NotificationContext';
import { Store, MapPin, Smartphone, Save, ImagePlus, ToggleLeft, ToggleRight } from 'lucide-react';

function pickImage(onPick) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => onPick(ev.target.result);
    reader.readAsDataURL(file);
  };
  input.click();
}

export default function RestaurantSettings() {
  const { restaurant, updateRestaurant } = useRestaurant();
  const { addNotification } = useNotification();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name:         '',
    description:  '',
    address:      '',
    cuisine:      '',
    gcash_number: '',
    gcash_name:   '',
    is_open:      true,
    image_url:    '',
  });

  useEffect(() => {
    if (!restaurant) return;
    setForm({
      name:         restaurant.name         || '',
      description:  restaurant.description  || '',
      address:      restaurant.address      || '',
      cuisine:      restaurant.cuisine      || '',
      gcash_number: restaurant.gcash_number || '',
      gcash_name:   restaurant.gcash_name   || '',
      is_open:      restaurant.is_open      ?? true,
      image_url:    restaurant.image_url    || '',
    });
  }, [restaurant]);

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const save = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { addNotification('Restaurant name is required', 'error'); return; }
    setSaving(true);
    try {
      await updateRestaurant({
        name:        form.name,
        description: form.description || null,
        address:     form.address     || null,
        cuisine:     form.cuisine     || null,
        gcashNumber: form.gcash_number || null,
        gcashName:   form.gcash_name   || null,
        isOpen:      form.is_open,
        imageUrl:    form.image_url   || null,
      });
      addNotification('Settings saved!', 'success');
    } catch {
      addNotification('Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5 pb-6 animate-fade-up max-w-2xl mx-auto">
      <div>
        <p className="text-forest-200/50 text-sm">Manage</p>
        <h1 className="text-2xl font-heading font-bold text-white">Restaurant Settings</h1>
      </div>

      <form onSubmit={save} className="space-y-4">

        {/* Logo */}
        <div className="glass rounded-2xl p-5">
          <p className="text-white font-semibold mb-4">Restaurant Logo</p>
          <button type="button" onClick={() => pickImage(b64 => f('image_url', b64))}
            className="w-full glass rounded-xl overflow-hidden hover:glass-orange transition-all"
            style={{ height: form.image_url ? '10rem' : '6rem' }}>
            {form.image_url ? (
              <img src={form.image_url} alt="logo" className="w-full h-full object-cover" />
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-2 text-forest-300/50">
                <ImagePlus className="w-7 h-7" />
                <span className="text-xs">Tap to upload logo</span>
              </div>
            )}
          </button>
          {form.image_url && (
            <button type="button" onClick={() => f('image_url', '')}
              className="mt-1 text-xs text-red-400/70 hover:text-red-400 transition-colors">
              Remove logo
            </button>
          )}
        </div>

        {/* Basic info */}
        <div className="glass rounded-2xl p-5 space-y-3">
          <p className="text-white font-semibold mb-1">Basic Info</p>
          {[
            { label:'Restaurant Name *', key:'name',    icon:Store,  placeholder:'e.g., Pizza Palace'      },
            { label:'Cuisine Type',      key:'cuisine', icon:Store,  placeholder:'e.g., Filipino, Pizza'   },
            { label:'Address',           key:'address', icon:MapPin, placeholder:'Street, Barangay, City'  },
          ].map(({ label, key, icon:Icon, placeholder }) => (
            <div key={key}>
              <label className="block text-forest-200/60 text-xs font-medium mb-1">{label}</label>
              <div className="relative">
                <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-forest-300/40" />
                <input value={form[key]} onChange={e => f(key, e.target.value)}
                  placeholder={placeholder}
                  className="w-full input-glass py-2.5 pl-9 text-sm" />
              </div>
            </div>
          ))}
          <div>
            <label className="block text-forest-200/60 text-xs font-medium mb-1">Description</label>
            <textarea value={form.description} onChange={e => f('description', e.target.value)}
              placeholder="Tell customers about your restaurant…"
              className="w-full input-glass py-2.5 text-sm h-20 resize-none" rows={3} />
          </div>
          {/* Open/Closed toggle */}
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-white text-sm font-medium">Restaurant Open</p>
              <p className="text-forest-200/50 text-xs">Customers can place orders when open</p>
            </div>
            <button type="button" onClick={() => f('is_open', !form.is_open)}
              className="transition-colors">
              {form.is_open
                ? <ToggleRight className="w-10 h-10 text-forest-400" />
                : <ToggleLeft  className="w-10 h-10 text-forest-200/30" />}
            </button>
          </div>
        </div>

        {/* GCash */}
        <div className="glass rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Smartphone className="w-4 h-4 text-forest-300/60" />
            <p className="text-white font-semibold">GCash Payment Info</p>
          </div>
          <p className="text-forest-200/50 text-xs -mt-1">Customers will send payment to this GCash account</p>
          {[
            { label:'GCash Number', key:'gcash_number', placeholder:'09XX XXX XXXX' },
            { label:'GCash Name',   key:'gcash_name',   placeholder:'Full name on GCash account' },
          ].map(({ label, key, placeholder }) => (
            <div key={key}>
              <label className="block text-forest-200/60 text-xs font-medium mb-1">{label}</label>
              <div className="relative">
                <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-forest-300/40" />
                <input value={form[key]} onChange={e => f(key, e.target.value)}
                  placeholder={placeholder}
                  className="w-full input-glass py-2.5 pl-9 text-sm" />
              </div>
            </div>
          ))}
        </div>

        <button type="submit" disabled={saving}
          className={`w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all
            ${saving ? 'glass text-forest-200/50 cursor-not-allowed' : 'btn-glow-green text-white'}`}>
          {saving
            ? <><div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Saving…</>
            : <><Save className="w-4 h-4" /> Save Settings</>}
        </button>
      </form>
    </div>
  );
}
