import { useState } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { useNotification } from '../../context/NotificationContext';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Modal from '../../components/Modal';

export default function AdminPromos() {
  const { admin } = useAdmin();
  const { showSuccess } = useNotification();

  const [promos, setPromos] = useState([
    {
      id: 1,
      code: 'WELCOME20',
      type: 'percentage',
      value: 20,
      minOrder: 15.00,
      maxDiscount: 10.00,
      usageLimit: 100,
      usedCount: 47,
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      status: 'active',
      targetUsers: 'new',
      description: '20% off for new customers',
    },
    {
      id: 2,
      code: 'SAVE5',
      type: 'fixed',
      value: 5.00,
      minOrder: 20.00,
      maxDiscount: null,
      usageLimit: 500,
      usedCount: 234,
      startDate: '2024-01-01',
      endDate: '2024-06-30',
      status: 'active',
      targetUsers: 'all',
      description: '$5 off orders over $20',
    },
    {
      id: 3,
      code: 'FLASH50',
      type: 'percentage',
      value: 50,
      minOrder: 30.00,
      maxDiscount: 15.00,
      usageLimit: 50,
      usedCount: 50,
      startDate: '2024-01-15',
      endDate: '2024-01-15',
      status: 'expired',
      targetUsers: 'all',
      description: 'Flash sale - 50% off',
    },
  ]);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPromo, setSelectedPromo] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');

  const [formData, setFormData] = useState({
    code: '',
    type: 'percentage',
    value: '',
    minOrder: '',
    maxDiscount: '',
    usageLimit: '',
    startDate: '',
    endDate: '',
    targetUsers: 'all',
    description: '',
  });

  const getFilteredPromos = () => {
    if (filterStatus === 'all') return promos;
    return promos.filter(promo => promo.status === filterStatus);
  };

  const getStatusBadge = (status) => {
    const badges = {
      active: 'bg-green-100 text-green-800 border-green-200',
      inactive: 'bg-secondary-100 text-secondary-800 border-secondary-200',
      expired: 'bg-red-100 text-red-800 border-red-200',
    };
    return badges[status] || badges.inactive;
  };

  const handleCreatePromo = (e) => {
    e.preventDefault();

    const newPromo = {
      id: promos.length + 1,
      code: formData.code.toUpperCase(),
      type: formData.type,
      value: parseFloat(formData.value),
      minOrder: parseFloat(formData.minOrder) || 0,
      maxDiscount: formData.maxDiscount ? parseFloat(formData.maxDiscount) : null,
      usageLimit: parseInt(formData.usageLimit) || null,
      usedCount: 0,
      startDate: formData.startDate,
      endDate: formData.endDate,
      status: 'active',
      targetUsers: formData.targetUsers,
      description: formData.description,
    };

    setPromos([newPromo, ...promos]);
    showSuccess(`Promo code "${newPromo.code}" created successfully!`);
    setShowCreateModal(false);
    resetForm();
  };

  const handleUpdatePromo = (e) => {
    e.preventDefault();

    setPromos(promos.map(promo =>
      promo.id === selectedPromo.id
        ? {
            ...promo,
            code: formData.code.toUpperCase(),
            type: formData.type,
            value: parseFloat(formData.value),
            minOrder: parseFloat(formData.minOrder) || 0,
            maxDiscount: formData.maxDiscount ? parseFloat(formData.maxDiscount) : null,
            usageLimit: parseInt(formData.usageLimit) || null,
            startDate: formData.startDate,
            endDate: formData.endDate,
            targetUsers: formData.targetUsers,
            description: formData.description,
          }
        : promo
    ));

    showSuccess('Promo code updated successfully!');
    setShowEditModal(false);
    resetForm();
  };

  const handleToggleStatus = (promoId) => {
    setPromos(promos.map(promo =>
      promo.id === promoId
        ? { ...promo, status: promo.status === 'active' ? 'inactive' : 'active' }
        : promo
    ));
    showSuccess('Promo status updated');
  };

  const handleDeletePromo = (promoId) => {
    if (confirm('Are you sure you want to delete this promo code?')) {
      setPromos(promos.filter(promo => promo.id !== promoId));
      showSuccess('Promo code deleted');
    }
  };

  const openEditModal = (promo) => {
    setSelectedPromo(promo);
    setFormData({
      code: promo.code,
      type: promo.type,
      value: promo.value.toString(),
      minOrder: promo.minOrder.toString(),
      maxDiscount: promo.maxDiscount?.toString() || '',
      usageLimit: promo.usageLimit?.toString() || '',
      startDate: promo.startDate,
      endDate: promo.endDate,
      targetUsers: promo.targetUsers,
      description: promo.description,
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      code: '',
      type: 'percentage',
      value: '',
      minOrder: '',
      maxDiscount: '',
      usageLimit: '',
      startDate: '',
      endDate: '',
      targetUsers: 'all',
      description: '',
    });
    setSelectedPromo(null);
  };

  return (
    <div className="py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold mb-2">Promo & Campaign Manager</h1>
          <p className="text-secondary-600">Create and manage promotional codes</p>
        </div>
        <Button variant="primary" onClick={() => setShowCreateModal(true)}>
          Create New Promo
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filterStatus === 'all'
                ? 'bg-primary-500 text-white'
                : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200'
            }`}
          >
            All ({promos.length})
          </button>
          <button
            onClick={() => setFilterStatus('active')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filterStatus === 'active'
                ? 'bg-primary-500 text-white'
                : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200'
            }`}
          >
            Active ({promos.filter(p => p.status === 'active').length})
          </button>
          <button
            onClick={() => setFilterStatus('inactive')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filterStatus === 'inactive'
                ? 'bg-primary-500 text-white'
                : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200'
            }`}
          >
            Inactive ({promos.filter(p => p.status === 'inactive').length})
          </button>
          <button
            onClick={() => setFilterStatus('expired')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filterStatus === 'expired'
                ? 'bg-primary-500 text-white'
                : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200'
            }`}
          >
            Expired ({promos.filter(p => p.status === 'expired').length})
          </button>
        </div>
      </Card>

      {/* Promos Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {getFilteredPromos().map((promo) => (
          <Card key={promo.id}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadge(promo.status)}`}>
                    {promo.status.toUpperCase()}
                  </span>
                  {promo.targetUsers === 'new' && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                      New Users Only
                    </span>
                  )}
                </div>
                <h3 className="text-2xl font-bold font-mono mb-1">{promo.code}</h3>
                <p className="text-sm text-secondary-600 mb-3">{promo.description}</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-primary-600">
                  {promo.type === 'percentage' ? `${promo.value}%` : `$${promo.value}`}
                </div>
                <p className="text-xs text-secondary-500">
                  {promo.type === 'percentage' ? 'OFF' : 'OFF'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
              <div>
                <p className="font-medium text-secondary-700">Min Order:</p>
                <p>${promo.minOrder.toFixed(2)}</p>
              </div>
              {promo.maxDiscount && (
                <div>
                  <p className="font-medium text-secondary-700">Max Discount:</p>
                  <p>${promo.maxDiscount.toFixed(2)}</p>
                </div>
              )}
              <div>
                <p className="font-medium text-secondary-700">Usage:</p>
                <p>
                  {promo.usedCount} / {promo.usageLimit || '∞'}
                  {promo.usageLimit && (
                    <span className="text-secondary-500">
                      {' '}({Math.round((promo.usedCount / promo.usageLimit) * 100)}%)
                    </span>
                  )}
                </p>
              </div>
              <div>
                <p className="font-medium text-secondary-700">Valid Until:</p>
                <p>{promo.endDate}</p>
              </div>
            </div>

            {promo.usageLimit && (
              <div className="mb-4">
                <div className="w-full bg-secondary-200 rounded-full h-2">
                  <div
                    className="bg-primary-500 h-2 rounded-full transition-all"
                    style={{ width: `${Math.min((promo.usedCount / promo.usageLimit) * 100, 100)}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => openEditModal(promo)}
              >
                Edit
              </Button>
              <Button
                variant={promo.status === 'active' ? 'secondary' : 'success'}
                size="sm"
                onClick={() => handleToggleStatus(promo.id)}
              >
                {promo.status === 'active' ? 'Deactivate' : 'Activate'}
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => handleDeletePromo(promo.id)}
              >
                Delete
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {getFilteredPromos().length === 0 && (
        <Card>
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎟️</div>
            <p className="text-secondary-600 text-lg">No promo codes found</p>
          </div>
        </Card>
      )}

      {/* Create Promo Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          resetForm();
        }}
        title="Create New Promo Code"
      >
        <form onSubmit={handleCreatePromo} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Promo Code *
            </label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono"
              placeholder="e.g., WELCOME20"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Discount Type *
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount ($)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Value *
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder={formData.type === 'percentage' ? '20' : '5.00'}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Min Order Amount ($)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.minOrder}
                onChange={(e) => setFormData({ ...formData, minOrder: e.target.value })}
                className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Max Discount ($)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.maxDiscount}
                onChange={(e) => setFormData({ ...formData, maxDiscount: e.target.value })}
                className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Optional"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Usage Limit
            </label>
            <input
              type="number"
              value={formData.usageLimit}
              onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
              className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Leave empty for unlimited"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Start Date *
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                End Date *
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Target Users *
            </label>
            <select
              value={formData.targetUsers}
              onChange={(e) => setFormData({ ...formData, targetUsers: e.target.value })}
              className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            >
              <option value="all">All Users</option>
              <option value="new">New Users Only</option>
              <option value="returning">Returning Users Only</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              rows="2"
              placeholder="e.g., 20% off for new customers"
              required
            />
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowCreateModal(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Create Promo Code
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Promo Modal - Similar to Create */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          resetForm();
        }}
        title="Edit Promo Code"
      >
        <form onSubmit={handleUpdatePromo} className="space-y-4">
          {/* Same fields as create modal */}
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Promo Code *
            </label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Discount Type *
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount ($)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Value *
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Min Order Amount ($)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.minOrder}
                onChange={(e) => setFormData({ ...formData, minOrder: e.target.value })}
                className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Max Discount ($)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.maxDiscount}
                onChange={(e) => setFormData({ ...formData, maxDiscount: e.target.value })}
                className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Usage Limit
            </label>
            <input
              type="number"
              value={formData.usageLimit}
              onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
              className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Start Date *
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                End Date *
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Target Users *
            </label>
            <select
              value={formData.targetUsers}
              onChange={(e) => setFormData({ ...formData, targetUsers: e.target.value })}
              className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            >
              <option value="all">All Users</option>
              <option value="new">New Users Only</option>
              <option value="returning">Returning Users Only</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              rows="2"
              required
            />
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowEditModal(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Update Promo Code
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
