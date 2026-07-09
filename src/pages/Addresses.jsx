import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { MapPin, Plus, Trash2, Check, Edit2, Home, Briefcase, X } from 'lucide-react';

const LABEL_ICONS = { Home, Work: Briefcase, Other: MapPin };

const EMPTY_FORM = { label: 'Home', address: '', city: '', province: '', zip: '', notes: '', isDefault: false };

export default function Addresses() {
  const { user, addAddress, updateAddress, deleteAddress } = useAuth();
  const { addNotification } = useNotification();
  const addresses = user?.addresses || [];

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing]   = useState(null); // address id being edited
  const [form, setForm]         = useState(EMPTY_FORM);

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const openAdd = () => { setForm(EMPTY_FORM); setEditing(null); setShowForm(true); };
  const openEdit = (addr) => { setForm({ label: addr.label || 'Home', address: addr.address || '', city: addr.city || '', province: addr.province || '', zip: addr.zip || '', notes: addr.notes || '', isDefault: addr.isDefault || false }); setEditing(addr.id); setShowForm(true); };
  const closeForm = () => { setShowForm(false); setEditing(null); };

  const handleSave = () => {
    if (!form.address.trim()) { addNotification('Street address is required', 'error'); return; }
    if (editing !== null) {
      updateAddress(editing, form);
      addNotification('Address updated!', 'success');
    } else {
      addAddress(form);
      addNotification('Address added!', 'success');
    }
    closeForm();
  };

  const handleDelete = (id) => {
    if (!window.confirm('Delete this address?')) return;
    deleteAddress(id);
    addNotification('Address removed', 'success');
  };

  const handleSetDefault = (id) => {
    updateAddress(id, { isDefault: true });
    addNotification('Default address updated!', 'success');
  };

  const LabelIcon = ({ label }) => {
    const Icon = LABEL_ICONS[label] || MapPin;
    return <Icon className="w-4 h-4" />;
  };

  return (
    <div className="space-y-4 pb-20 lg:pb-0 animate-fade-up">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-heading font-bold text-white">My Addresses</h1>
        <button onClick={openAdd}
          className="btn-glow-green text-white text-sm px-4 py-2.5 rounded-xl flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Address
        </button>
      </div>

      {/* Address list */}
      {addresses.length === 0 && !showForm ? (
        <div className="glass rounded-3xl py-16 flex flex-col items-center gap-3">
          <MapPin className="w-14 h-14 text-forest-300/20" />
          <p className="text-white font-semibold">No addresses yet</p>
          <p className="text-forest-200/50 text-sm">Add a delivery address to get started.</p>
          <button onClick={openAdd} className="btn-glow-orange text-white text-sm px-5 py-2.5 rounded-xl mt-2">
            Add Address
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {addresses.map((addr) => {
            const Icon = LABEL_ICONS[addr.label] || MapPin;
            return (
              <div key={addr.id} className={`glass card-3d rounded-2xl p-4 flex items-start gap-4 ${addr.isDefault ? 'border border-forest-400/30' : ''}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${addr.isDefault ? 'btn-glow-green' : 'glass-dark'}`}>
                  <Icon className={`w-5 h-5 ${addr.isDefault ? 'text-white' : 'text-forest-300'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-white font-semibold text-sm">{addr.label || 'Address'}</p>
                    {addr.isDefault && (
                      <span className="glass-green text-forest-200 text-[10px] px-2 py-0.5 rounded-full font-medium">Default</span>
                    )}
                  </div>
                  <p className="text-forest-100/70 text-xs">{addr.address}</p>
                  {(addr.city || addr.province) && (
                    <p className="text-forest-100/50 text-xs">{[addr.city, addr.province, addr.zip].filter(Boolean).join(', ')}</p>
                  )}
                  {addr.notes && <p className="text-forest-100/40 text-xs italic mt-0.5">{addr.notes}</p>}
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {!addr.isDefault && (
                    <button onClick={() => handleSetDefault(addr.id)} title="Set as default"
                      className="w-8 h-8 glass rounded-lg flex items-center justify-center hover:glass-green transition-all">
                      <Check className="w-3.5 h-3.5 text-forest-300" />
                    </button>
                  )}
                  <button onClick={() => openEdit(addr)} title="Edit"
                    className="w-8 h-8 glass rounded-lg flex items-center justify-center hover:glass-green transition-all">
                    <Edit2 className="w-3.5 h-3.5 text-forest-300" />
                  </button>
                  <button onClick={() => handleDelete(addr.id)} title="Delete"
                    className="w-8 h-8 glass rounded-lg flex items-center justify-center hover:text-red-400 transition-all">
                    <Trash2 className="w-3.5 h-3.5 text-forest-300" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit form */}
      {showForm && (
        <div className="glass card-3d rounded-2xl p-5 animate-fade-up">
          <div className="flex items-center justify-between mb-4">
            <p className="text-white font-semibold">{editing !== null ? 'Edit Address' : 'New Address'}</p>
            <button onClick={closeForm} className="w-7 h-7 glass rounded-lg flex items-center justify-center hover:glass-orange transition-all">
              <X className="w-3.5 h-3.5 text-forest-300" />
            </button>
          </div>

          <div className="space-y-3">
            {/* Label */}
            <div>
              <p className="text-forest-200/70 text-xs font-medium mb-1.5">Label</p>
              <div className="flex gap-2">
                {['Home', 'Work', 'Other'].map(l => (
                  <button key={l} onClick={() => setForm(f => ({ ...f, label: l }))}
                    className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all flex items-center justify-center gap-1.5
                      ${form.label === l ? 'btn-glow-green text-white' : 'glass text-forest-200/70 hover:glass-green'}`}>
                    <LabelIcon label={l} /> {l}
                  </button>
                ))}
              </div>
            </div>

            {/* Street */}
            <div>
              <p className="text-forest-200/70 text-xs font-medium mb-1.5">Street Address</p>
              <input value={form.address} onChange={set('address')} placeholder="House no., Street, Barangay"
                className="w-full input-glass px-3 py-2.5 text-sm" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-forest-200/70 text-xs font-medium mb-1.5">City / Municipality</p>
                <input value={form.city} onChange={set('city')} placeholder="Bongao"
                  className="w-full input-glass px-3 py-2.5 text-sm" />
              </div>
              <div>
                <p className="text-forest-200/70 text-xs font-medium mb-1.5">Province</p>
                <input value={form.province} onChange={set('province')} placeholder="Tawi-Tawi"
                  className="w-full input-glass px-3 py-2.5 text-sm" />
              </div>
            </div>

            <div>
              <p className="text-forest-200/70 text-xs font-medium mb-1.5">ZIP Code</p>
              <input value={form.zip} onChange={set('zip')} placeholder="7500"
                className="w-full input-glass px-3 py-2.5 text-sm" />
            </div>

            <div>
              <p className="text-forest-200/70 text-xs font-medium mb-1.5">Delivery Notes (optional)</p>
              <input value={form.notes} onChange={set('notes')} placeholder="e.g. Ring the gate bell"
                className="w-full input-glass px-3 py-2.5 text-sm" />
            </div>

            {/* Default toggle */}
            <label className="flex items-center gap-3 cursor-pointer">
              <div onClick={() => setForm(f => ({ ...f, isDefault: !f.isDefault }))}
                className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all cursor-pointer
                  ${form.isDefault ? 'btn-glow-green border-transparent' : 'border-forest-600 glass'}`}>
                {form.isDefault && <Check className="w-3 h-3 text-white" />}
              </div>
              <span className="text-forest-200/70 text-xs">Set as default delivery address</span>
            </label>

            <div className="flex gap-3 pt-1">
              <button onClick={closeForm} className="flex-1 glass text-forest-200 py-2.5 rounded-xl text-sm hover:glass-green transition-all">
                Cancel
              </button>
              <button onClick={handleSave} className="flex-1 btn-glow-green text-white py-2.5 rounded-xl text-sm font-semibold">
                {editing !== null ? 'Save Changes' : 'Add Address'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
