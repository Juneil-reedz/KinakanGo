import { useState } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { useNotification } from '../../context/NotificationContext';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Modal from '../../components/Modal';

export default function AdminUsers() {
  const { admin } = useAdmin();
  const { showSuccess, showError } = useNotification();

  const [users, setUsers] = useState([
    {
      id: 1,
      name: 'John Doe',
      email: 'john.doe@example.com',
      phone: '+63 917 123 4567',
      status: 'active',
      joinDate: '2024-01-15',
      totalOrders: 24,
      totalSpent: 487.50,
      lastOrder: '2 days ago',
      issues: 0,
      banReason: null,
    },
    {
      id: 2,
      name: 'Jane Smith',
      email: 'jane.smith@example.com',
      phone: '+63 917 987 6543',
      status: 'active',
      joinDate: '2024-02-10',
      totalOrders: 15,
      totalSpent: 324.80,
      lastOrder: '1 week ago',
      issues: 1,
      banReason: null,
    },
    {
      id: 3,
      name: 'Mike Johnson',
      email: 'mike.j@example.com',
      phone: '+63 917 456 7890',
      status: 'banned',
      joinDate: '2023-12-05',
      totalOrders: 8,
      totalSpent: 156.30,
      lastOrder: '3 weeks ago',
      issues: 5,
      banReason: 'Multiple fraudulent payment attempts',
    },
    {
      id: 4,
      name: 'Sarah Williams',
      email: 'sarah.w@example.com',
      phone: '+63 917 234 5678',
      status: 'active',
      joinDate: '2024-03-01',
      totalOrders: 42,
      totalSpent: 1247.90,
      lastOrder: 'Today',
      issues: 0,
      banReason: null,
    },
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showBanModal, setShowBanModal] = useState(false);
  const [showUnbanModal, setShowUnbanModal] = useState(false);
  const [banReason, setBanReason] = useState('');

  const getFilteredUsers = () => {
    let filtered = users;

    if (filterStatus !== 'all') {
      filtered = filtered.filter(user => user.status === filterStatus);
    }

    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.phone.includes(searchTerm)
      );
    }

    return filtered;
  };

  const getStatusBadge = (status) => {
    const badges = {
      active: 'bg-green-100 text-green-800 border-green-200',
      banned: 'bg-red-100 text-red-800 border-red-200',
      suspended: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    };
    return badges[status] || badges.active;
  };

  const handleBanUser = () => {
    if (!banReason.trim()) {
      showError('Please provide a reason for banning');
      return;
    }

    setUsers(users.map(user =>
      user.id === selectedUser.id
        ? { ...user, status: 'banned', banReason: banReason }
        : user
    ));

    showSuccess(`${selectedUser.name} has been banned`);
    setShowBanModal(false);
    setBanReason('');
    setSelectedUser(null);
  };

  const handleUnbanUser = () => {
    setUsers(users.map(user =>
      user.id === selectedUser.id
        ? { ...user, status: 'active', banReason: null }
        : user
    ));

    showSuccess(`${selectedUser.name} has been unbanned`);
    setShowUnbanModal(false);
    setSelectedUser(null);
  };

  const openBanModal = (user) => {
    setSelectedUser(user);
    setShowBanModal(true);
  };

  const openUnbanModal = (user) => {
    setSelectedUser(user);
    setShowUnbanModal(true);
  };

  return (
    <div className="py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-heading font-bold mb-2">User Management</h1>
        <p className="text-secondary-600">Manage customer accounts and moderation</p>
      </div>

      {/* Search and Filters */}
      <Card>
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex-1 w-full md:max-w-md">
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterStatus === 'all'
                  ? 'bg-primary-500 text-white'
                  : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200'
              }`}
            >
              All ({users.length})
            </button>
            <button
              onClick={() => setFilterStatus('active')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterStatus === 'active'
                  ? 'bg-primary-500 text-white'
                  : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200'
              }`}
            >
              Active ({users.filter(u => u.status === 'active').length})
            </button>
            <button
              onClick={() => setFilterStatus('banned')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterStatus === 'banned'
                  ? 'bg-primary-500 text-white'
                  : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200'
              }`}
            >
              Banned ({users.filter(u => u.status === 'banned').length})
            </button>
          </div>
        </div>
      </Card>

      {/* Users Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-secondary-200">
                <th className="text-left py-3 px-4 font-semibold text-secondary-700">User</th>
                <th className="text-left py-3 px-4 font-semibold text-secondary-700">Contact</th>
                <th className="text-left py-3 px-4 font-semibold text-secondary-700">Status</th>
                <th className="text-right py-3 px-4 font-semibold text-secondary-700">Orders</th>
                <th className="text-right py-3 px-4 font-semibold text-secondary-700">Total Spent</th>
                <th className="text-left py-3 px-4 font-semibold text-secondary-700">Last Order</th>
                <th className="text-center py-3 px-4 font-semibold text-secondary-700">Issues</th>
                <th className="text-center py-3 px-4 font-semibold text-secondary-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {getFilteredUsers().map((user) => (
                <tr key={user.id} className="border-b border-secondary-100 hover:bg-secondary-50 transition-colors">
                  <td className="py-4 px-4">
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-xs text-secondary-500">Joined {user.joinDate}</p>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="text-sm">
                      <p>{user.email}</p>
                      <p className="text-secondary-600">{user.phone}</p>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadge(user.status)}`}>
                      {user.status.toUpperCase()}
                    </span>
                    {user.banReason && (
                      <p className="text-xs text-red-600 mt-1">{user.banReason}</p>
                    )}
                  </td>
                  <td className="py-4 px-4 text-right">{user.totalOrders}</td>
                  <td className="py-4 px-4 text-right font-semibold text-green-600">
                    ${user.totalSpent.toFixed(2)}
                  </td>
                  <td className="py-4 px-4 text-sm">{user.lastOrder}</td>
                  <td className="py-4 px-4 text-center">
                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                      user.issues > 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                    }`}>
                      {user.issues}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex justify-center gap-2">
                      {user.status === 'active' ? (
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => openBanModal(user)}
                        >
                          Ban User
                        </Button>
                      ) : (
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() => openUnbanModal(user)}
                        >
                          Unban
                        </Button>
                      )}
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {getFilteredUsers().length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <p className="text-secondary-600">No users found</p>
            </div>
          )}
        </div>
      </Card>

      {/* Ban User Modal */}
      {showBanModal && selectedUser && (
        <Modal
          isOpen={showBanModal}
          onClose={() => {
            setShowBanModal(false);
            setBanReason('');
            setSelectedUser(null);
          }}
          title="Ban User Account"
        >
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">
                <strong>Warning:</strong> This will ban {selectedUser.name} from using the platform. They will not be able to place orders or access their account.
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-secondary-700 mb-2">User Details:</p>
              <div className="text-sm space-y-1">
                <p><strong>Name:</strong> {selectedUser.name}</p>
                <p><strong>Email:</strong> {selectedUser.email}</p>
                <p><strong>Total Orders:</strong> {selectedUser.totalOrders}</p>
                <p><strong>Issues Reported:</strong> {selectedUser.issues}</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Reason for Ban *
              </label>
              <textarea
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                className="w-full px-4 py-3 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                rows="4"
                placeholder="e.g., Multiple fraudulent payment attempts, Abusive behavior towards riders..."
              />
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowBanModal(false);
                  setBanReason('');
                  setSelectedUser(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleBanUser}
                disabled={!banReason.trim()}
              >
                Confirm Ban
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Unban User Modal */}
      {showUnbanModal && selectedUser && (
        <Modal
          isOpen={showUnbanModal}
          onClose={() => {
            setShowUnbanModal(false);
            setSelectedUser(null);
          }}
          title="Unban User Account"
        >
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-800">
                This will restore {selectedUser.name}'s account access. They will be able to place orders and use the platform again.
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-secondary-700 mb-2">User Details:</p>
              <div className="text-sm space-y-1">
                <p><strong>Name:</strong> {selectedUser.name}</p>
                <p><strong>Email:</strong> {selectedUser.email}</p>
                <p><strong>Ban Reason:</strong> {selectedUser.banReason}</p>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowUnbanModal(false);
                  setSelectedUser(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="success"
                onClick={handleUnbanUser}
              >
                Confirm Unban
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
