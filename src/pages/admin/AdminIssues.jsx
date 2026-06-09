import { useState } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { useNotification } from '../../context/NotificationContext';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Modal from '../../components/Modal';

export default function AdminIssues() {
  const { admin } = useAdmin();
  const { showSuccess } = useNotification();

  const [issues, setIssues] = useState([
    {
      id: 1,
      type: 'refund',
      orderId: '12340',
      customerName: 'John Doe',
      customerEmail: 'john@example.com',
      title: 'Food never arrived',
      description: 'Rider marked as delivered but I never received my order',
      orderAmount: 40.76,
      requestedRefund: 40.76,
      priority: 'high',
      status: 'pending',
      createdAt: '30 min ago',
      attachments: ['photo1.jpg'],
    },
    {
      id: 2,
      type: 'quality',
      orderId: '12338',
      restaurantName: 'Pizza Palace',
      restaurantId: '1',
      customerName: 'Jane Smith',
      title: 'Food quality complaint',
      description: 'Pizza arrived cold and soggy. Multiple items missing from order.',
      orderAmount: 52.30,
      requestedRefund: 25.00,
      priority: 'high',
      status: 'pending',
      createdAt: '2 hours ago',
    },
    {
      id: 3,
      type: 'payment',
      orderId: '12335',
      customerName: 'Mike Johnson',
      title: 'Double charge',
      description: 'Was charged twice for the same order',
      orderAmount: 28.99,
      requestedRefund: 28.99,
      priority: 'high',
      status: 'pending',
      createdAt: '5 hours ago',
    },
    {
      id: 4,
      type: 'rider',
      orderId: '12333',
      riderName: 'Tom Wilson',
      riderId: '23',
      customerName: 'Sarah Brown',
      title: 'Unprofessional behavior',
      description: 'Rider was rude and aggressive when delivering',
      priority: 'medium',
      status: 'pending',
      createdAt: '1 day ago',
    },
  ]);

  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('pending');
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundNotes, setRefundNotes] = useState('');

  const getFilteredIssues = () => {
    let filtered = issues;

    if (filterType !== 'all') {
      filtered = filtered.filter(issue => issue.type === filterType);
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(issue => issue.status === filterStatus);
    }

    return filtered;
  };

  const getPriorityColor = (priority) => {
    const colors = {
      high: 'bg-red-100 text-red-800 border-red-300',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      low: 'bg-green-100 text-green-800 border-green-300',
    };
    return colors[priority] || colors.medium;
  };

  const getTypeIcon = (type) => {
    const icons = {
      refund: '💰',
      quality: '🍽️',
      payment: '💳',
      rider: '🏍️',
      missing: '📦',
    };
    return icons[type] || '⚠️';
  };

  const openRefundModal = (issue) => {
    setSelectedIssue(issue);
    setRefundAmount(issue.requestedRefund?.toString() || '');
    setShowRefundModal(true);
  };

  const handleApproveRefund = (type) => {
    const amount = type === 'full' ? selectedIssue.orderAmount : parseFloat(refundAmount);

    setIssues(issues.map(issue =>
      issue.id === selectedIssue.id
        ? { ...issue, status: 'resolved', refundAmount: amount, refundNotes }
        : issue
    ));

    showSuccess(`Refund of $${amount.toFixed(2)} approved for ${selectedIssue.customerName}`);
    setShowRefundModal(false);
    setRefundAmount('');
    setRefundNotes('');
    setSelectedIssue(null);
  };

  const handleDenyRefund = () => {
    setIssues(issues.map(issue =>
      issue.id === selectedIssue.id
        ? { ...issue, status: 'denied', refundNotes }
        : issue
    ));

    showSuccess('Refund request denied');
    setShowRefundModal(false);
    setRefundAmount('');
    setRefundNotes('');
    setSelectedIssue(null);
  };

  const handleResolveIssue = (issueId) => {
    setIssues(issues.map(issue =>
      issue.id === issueId
        ? { ...issue, status: 'resolved' }
        : issue
    ));
    showSuccess('Issue marked as resolved');
  };

  return (
    <div className="py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-heading font-bold mb-2">Issues & Moderation</h1>
        <p className="text-secondary-600">Manage customer complaints and refund requests</p>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-sm font-medium text-secondary-700 mb-2">Filter by Type:</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilterType('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filterType === 'all'
                    ? 'bg-primary-500 text-white'
                    : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterType('refund')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filterType === 'refund'
                    ? 'bg-primary-500 text-white'
                    : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200'
                }`}
              >
                💰 Refunds
              </button>
              <button
                onClick={() => setFilterType('quality')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filterType === 'quality'
                    ? 'bg-primary-500 text-white'
                    : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200'
                }`}
              >
                🍽️ Quality
              </button>
              <button
                onClick={() => setFilterType('payment')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filterType === 'payment'
                    ? 'bg-primary-500 text-white'
                    : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200'
                }`}
              >
                💳 Payment
              </button>
              <button
                onClick={() => setFilterType('rider')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filterType === 'rider'
                    ? 'bg-primary-500 text-white'
                    : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200'
                }`}
              >
                🏍️ Rider
              </button>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-secondary-700 mb-2">Filter by Status:</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filterStatus === 'all'
                    ? 'bg-primary-500 text-white'
                    : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterStatus('pending')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filterStatus === 'pending'
                    ? 'bg-primary-500 text-white'
                    : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200'
                }`}
              >
                Pending ({issues.filter(i => i.status === 'pending').length})
              </button>
              <button
                onClick={() => setFilterStatus('resolved')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filterStatus === 'resolved'
                    ? 'bg-primary-500 text-white'
                    : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200'
                }`}
              >
                Resolved
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* Issues List */}
      <div className="space-y-4">
        {getFilteredIssues().length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <div className="text-6xl mb-4">✅</div>
              <p className="text-secondary-600 text-lg">No issues found</p>
            </div>
          </Card>
        ) : (
          getFilteredIssues().map((issue) => (
            <Card key={issue.id}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className="text-3xl">{getTypeIcon(issue.type)}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getPriorityColor(issue.priority)}`}>
                        {issue.priority.toUpperCase()} PRIORITY
                      </span>
                      <span className="text-xs text-secondary-500">{issue.createdAt}</span>
                    </div>
                    <h3 className="font-semibold text-xl mb-2">{issue.title}</h3>
                    <p className="text-sm text-secondary-600 mb-3">{issue.description}</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="font-medium text-secondary-700">Customer:</p>
                        <p>{issue.customerName}</p>
                        {issue.customerEmail && <p className="text-secondary-600">{issue.customerEmail}</p>}
                      </div>

                      {issue.orderId && (
                        <div>
                          <p className="font-medium text-secondary-700">Order:</p>
                          <p>#{issue.orderId}</p>
                          {issue.orderAmount && (
                            <p className="text-secondary-600">Amount: ${issue.orderAmount.toFixed(2)}</p>
                          )}
                        </div>
                      )}

                      {issue.restaurantName && (
                        <div>
                          <p className="font-medium text-secondary-700">Restaurant:</p>
                          <p>{issue.restaurantName}</p>
                        </div>
                      )}

                      {issue.riderName && (
                        <div>
                          <p className="font-medium text-secondary-700">Rider:</p>
                          <p>{issue.riderName}</p>
                        </div>
                      )}
                    </div>

                    {issue.requestedRefund && (
                      <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-sm font-semibold text-yellow-800">
                          Refund Requested: ${issue.requestedRefund.toFixed(2)}
                        </p>
                      </div>
                    )}

                    {issue.refundAmount && (
                      <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm font-semibold text-green-800">
                          Refund Approved: ${issue.refundAmount.toFixed(2)}
                        </p>
                        {issue.refundNotes && (
                          <p className="text-sm text-green-700 mt-1">Note: {issue.refundNotes}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {issue.status === 'pending' && (
                <div className="flex gap-2 flex-wrap">
                  {(issue.type === 'refund' || issue.type === 'quality' || issue.type === 'payment') && (
                    <Button
                      variant="success"
                      size="sm"
                      onClick={() => openRefundModal(issue)}
                    >
                      Process Refund
                    </Button>
                  )}
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleResolveIssue(issue.id)}
                  >
                    Mark Resolved
                  </Button>
                  <Button variant="outline" size="sm">
                    Contact Customer
                  </Button>
                  <Button variant="outline" size="sm">
                    View Order Details
                  </Button>
                </div>
              )}
            </Card>
          ))
        )}
      </div>

      {/* Refund Modal */}
      {showRefundModal && selectedIssue && (
        <Modal
          isOpen={showRefundModal}
          onClose={() => {
            setShowRefundModal(false);
            setRefundAmount('');
            setRefundNotes('');
            setSelectedIssue(null);
          }}
          title="Process Refund Request"
        >
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="font-medium text-blue-900">Customer:</p>
                  <p className="text-blue-800">{selectedIssue.customerName}</p>
                </div>
                <div>
                  <p className="font-medium text-blue-900">Order:</p>
                  <p className="text-blue-800">#{selectedIssue.orderId}</p>
                </div>
                <div>
                  <p className="font-medium text-blue-900">Order Amount:</p>
                  <p className="text-blue-800">${selectedIssue.orderAmount?.toFixed(2)}</p>
                </div>
                <div>
                  <p className="font-medium text-blue-900">Requested:</p>
                  <p className="text-blue-800">${selectedIssue.requestedRefund?.toFixed(2)}</p>
                </div>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-secondary-700 mb-2">Issue:</p>
              <p className="text-sm text-secondary-600 bg-secondary-50 p-3 rounded-lg">
                {selectedIssue.description}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Refund Amount ($) *
              </label>
              <input
                type="number"
                step="0.01"
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                className="w-full px-4 py-3 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="0.00"
              />
              <div className="flex gap-2 mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setRefundAmount(selectedIssue.requestedRefund?.toString() || '')}
                >
                  Requested Amount
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setRefundAmount(selectedIssue.orderAmount?.toString() || '')}
                >
                  Full Amount
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setRefundAmount((selectedIssue.orderAmount / 2)?.toFixed(2) || '')}
                >
                  50%
                </Button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Admin Notes
              </label>
              <textarea
                value={refundNotes}
                onChange={(e) => setRefundNotes(e.target.value)}
                className="w-full px-4 py-3 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                rows="3"
                placeholder="Add notes about this refund decision..."
              />
            </div>

            <div className="flex gap-2 justify-end pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setShowRefundModal(false);
                  setRefundAmount('');
                  setRefundNotes('');
                  setSelectedIssue(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleDenyRefund}
              >
                Deny Refund
              </Button>
              <Button
                variant="success"
                onClick={() => handleApproveRefund('partial')}
                disabled={!refundAmount || parseFloat(refundAmount) <= 0}
              >
                Approve ${refundAmount || '0.00'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
