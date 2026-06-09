import { useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { useNotification } from '../../context/NotificationContext';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import { Package } from 'lucide-react';

export default function RestaurantOrders() {
  const { restaurant } = useRestaurant();
  const { showSuccess, showError } = useNotification();

  const [orders, setOrders] = useState([
    {
      id: '12345',
      customerName: 'John Doe',
      customerPhone: '+63 917 123 4567',
      deliveryAddress: 'Purok 5, Barangay Poblacion, Bongao, Tawi-Tawi',
      items: [
        { name: 'Margherita Pizza', quantity: 2, price: 12.99, notes: 'Extra cheese', image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&h=300&fit=crop' },
        { name: 'Caesar Salad', quantity: 1, price: 8.99, notes: '', image: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400&h=300&fit=crop' },
      ],
      subtotal: 34.97,
      deliveryFee: 2.99,
      tax: 2.80,
      total: 40.76,
      status: 'pending',
      paymentMethod: 'online',
      paymentStatus: 'paid',
      time: '2 min ago',
      estimatedReady: '20 min',
      orderDate: '2024-01-15T14:30:00Z',
      specialInstructions: 'Please ring doorbell',
    },
    {
      id: '12344',
      customerName: 'Jane Smith',
      customerPhone: '+63 917 987 6543',
      deliveryAddress: 'Purok 2, Barangay Masantong, Bongao, Tawi-Tawi',
      items: [
        { name: 'Pepperoni Pizza', quantity: 1, price: 14.99, notes: '', image: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400&h=300&fit=crop' },
        { name: 'Spaghetti Carbonara', quantity: 1, price: 13.99, notes: 'Gluten-free pasta', image: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=400&h=300&fit=crop' },
      ],
      subtotal: 28.98,
      deliveryFee: 2.99,
      tax: 2.32,
      total: 34.29,
      status: 'preparing',
      paymentMethod: 'card',
      paymentStatus: 'paid',
      time: '5 min ago',
      estimatedReady: '15 min',
      orderDate: '2024-01-15T14:27:00Z',
      specialInstructions: '',
    },
    {
      id: '12343',
      customerName: 'Mike Johnson',
      customerPhone: '+63 917 456 7890',
      deliveryAddress: 'Purok 4, Barangay Simandagit, Bongao, Tawi-Tawi',
      items: [
        { name: 'Margherita Pizza', quantity: 3, price: 12.99, notes: '', image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&h=300&fit=crop' },
      ],
      subtotal: 38.97,
      deliveryFee: 2.99,
      tax: 3.12,
      total: 45.08,
      status: 'ready',
      paymentMethod: 'cash',
      paymentStatus: 'pending',
      time: '10 min ago',
      orderDate: '2024-01-15T14:22:00Z',
      specialInstructions: '',
    },
    {
      id: '12342',
      customerName: 'Sarah Williams',
      customerPhone: '+63 917 234 5678',
      deliveryAddress: 'Purok 8, Barangay Pababag, Bongao, Tawi-Tawi',
      items: [
        { name: 'Pepperoni Pizza', quantity: 2, price: 14.99, notes: '', image: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400&h=300&fit=crop' },
        { name: 'Caesar Salad', quantity: 2, price: 8.99, notes: 'No croutons', image: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400&h=300&fit=crop' },
      ],
      subtotal: 47.96,
      deliveryFee: 2.99,
      tax: 3.84,
      total: 54.79,
      status: 'completed',
      paymentMethod: 'online',
      paymentStatus: 'paid',
      time: '1 hour ago',
      orderDate: '2024-01-15T13:32:00Z',
      specialInstructions: '',
    },
  ]);

  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const getFilteredOrders = () => {
    let filtered = orders;

    if (filter !== 'all') {
      filtered = filtered.filter(order => order.status === filter);
    }

    if (searchTerm) {
      filtered = filtered.filter(order =>
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customerName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      preparing: 'bg-blue-50 text-blue-700 border-blue-200',
      ready: 'bg-orange-50 text-orange-700 border-orange-200',
      completed: 'bg-green-50 text-green-700 border-green-200',
      rejected: 'bg-red-50 text-red-700 border-red-200',
    };
    return badges[status] || badges.pending;
  };

  const handleAcceptOrder = (orderId) => {
    setOrders(orders.map(order =>
      order.id === orderId
        ? { ...order, status: 'preparing' }
        : order
    ));
    showSuccess('Order accepted successfully!');
  };

  const handleRejectOrder = (orderId, reason) => {
    setOrders(orders.map(order =>
      order.id === orderId
        ? { ...order, status: 'rejected', rejectionReason: reason }
        : order
    ));
    showSuccess('Order rejected');
    setShowRejectModal(false);
    setRejectReason('');
  };

  const handleMarkReady = (orderId) => {
    setOrders(orders.map(order =>
      order.id === orderId
        ? { ...order, status: 'ready' }
        : order
    ));
    showSuccess('Order marked as ready for pickup!');
  };

  const handleMarkCompleted = (orderId) => {
    setOrders(orders.map(order =>
      order.id === orderId
        ? { ...order, status: 'completed' }
        : order
    ));
    showSuccess('Order completed!');
  };

  const openOrderDetails = (order) => {
    setSelectedOrder(order);
    setShowOrderModal(true);
  };

  const openRejectModal = (order) => {
    setSelectedOrder(order);
    setShowRejectModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold mb-2 text-gray-900">Order Management</h1>
        <p className="text-gray-600">Manage incoming orders and track their status</p>
      </div>

      {/* Search and Filter */}
      <Card className="border border-gray-100 rounded-2xl shadow-sm">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex-1 w-full md:max-w-md">
            <input
              type="text"
              placeholder="Search by order ID or customer name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2.5 rounded-xl font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-gradient-to-r from-rose-400 to-orange-500 text-white shadow-md'
                  : 'bg-gray-50 text-gray-700 hover:bg-orange-50 hover:text-rose-600'
              }`}
            >
              All ({orders.length})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2.5 rounded-xl font-medium transition-colors ${
                filter === 'pending'
                  ? 'bg-gradient-to-r from-rose-400 to-orange-500 text-white shadow-md'
                  : 'bg-gray-50 text-gray-700 hover:bg-orange-50 hover:text-rose-600'
              }`}
            >
              Pending ({orders.filter(o => o.status === 'pending').length})
            </button>
            <button
              onClick={() => setFilter('preparing')}
              className={`px-4 py-2.5 rounded-xl font-medium transition-colors ${
                filter === 'preparing'
                  ? 'bg-gradient-to-r from-rose-400 to-orange-500 text-white shadow-md'
                  : 'bg-gray-50 text-gray-700 hover:bg-orange-50 hover:text-rose-600'
              }`}
            >
              Preparing ({orders.filter(o => o.status === 'preparing').length})
            </button>
            <button
              onClick={() => setFilter('ready')}
              className={`px-4 py-2.5 rounded-xl font-medium transition-colors ${
                filter === 'ready'
                  ? 'bg-gradient-to-r from-rose-400 to-orange-500 text-white shadow-md'
                  : 'bg-gray-50 text-gray-700 hover:bg-orange-50 hover:text-rose-600'
              }`}
            >
              Ready ({orders.filter(o => o.status === 'ready').length})
            </button>
          </div>
        </div>
      </Card>

      {/* Orders List */}
      <div className="space-y-4">
        {getFilteredOrders().length === 0 ? (
          <Card className="border border-gray-100 rounded-2xl shadow-sm">
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">No orders found</p>
            </div>
          </Card>
        ) : (
          getFilteredOrders().map((order) => (
            <Card key={order.id} className="border border-gray-100 rounded-2xl shadow-sm hover:shadow-md hover:border-orange-200 transition-all">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-lg text-gray-900">Order #{order.id}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadge(order.status)}`}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                    {order.paymentStatus === 'paid' && (
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                        Paid
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-1">
                    <span className="font-medium">{order.customerName}</span> • {order.time}
                  </p>
                  <p className="text-sm text-gray-600">{order.customerPhone}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold bg-gradient-to-r from-rose-500 to-orange-500 bg-clip-text text-transparent">₱{order.total.toFixed(2)}</p>
                  {order.estimatedReady && (
                    <p className="text-sm text-gray-600">Ready in {order.estimatedReady}</p>
                  )}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
                  <p className="text-sm font-semibold text-gray-900 mb-3">Items:</p>
                  <div className="space-y-3">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex items-center gap-3">
                        {item.image && (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-16 h-16 object-cover rounded-lg border border-orange-200"
                          />
                        )}
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {item.quantity}x {item.name}
                          </p>
                          {item.notes && (
                            <p className="text-xs text-gray-600 mt-0.5">Note: {item.notes}</p>
                          )}
                          <p className="text-xs text-orange-600 font-semibold mt-0.5">₱{(item.price * item.quantity).toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                  <p className="text-sm font-semibold text-gray-900 mb-2">Delivery Info:</p>
                  <p className="text-sm text-gray-700 mb-1">{order.deliveryAddress}</p>
                  {order.specialInstructions && (
                    <p className="text-sm text-gray-900 font-medium">Note: {order.specialInstructions}</p>
                  )}
                </div>
              </div>

              <div className="flex gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openOrderDetails(order)}
                  className="text-gray-700 border-gray-300 hover:bg-orange-50 hover:border-orange-200 hover:text-rose-600"
                >
                  View Details
                </Button>

                {order.status === 'pending' && (
                  <>
                    <Button
                      variant="success"
                      size="sm"
                      onClick={() => handleAcceptOrder(order.id)}
                      className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
                    >
                      Accept Order
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => openRejectModal(order)}
                      className="bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white"
                    >
                      Reject
                    </Button>
                  </>
                )}

                {order.status === 'preparing' && (
                  <Button
                    variant="success"
                    size="sm"
                    onClick={() => handleMarkReady(order.id)}
                    className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
                  >
                    Mark Ready for Pickup
                  </Button>
                )}

                {order.status === 'ready' && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleMarkCompleted(order.id)}
                    className="bg-gradient-to-r from-rose-400 to-orange-500 hover:from-rose-500 hover:to-orange-600 text-white"
                  >
                    Mark as Picked Up
                  </Button>
                )}
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Order Details Modal */}
      {showOrderModal && selectedOrder && (
        <Modal isOpen={showOrderModal} onClose={() => setShowOrderModal(false)} title={`Order #${selectedOrder.id}`}>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Customer Information</h4>
              <p className="text-sm text-secondary-600">Name: {selectedOrder.customerName}</p>
              <p className="text-sm text-secondary-600">Phone: {selectedOrder.customerPhone}</p>
              <p className="text-sm text-secondary-600">Address: {selectedOrder.deliveryAddress}</p>
            </div>

            <div>
              <h4 className="font-semibold mb-3 text-gray-900">Order Items</h4>
              <div className="space-y-3">
                {selectedOrder.items.map((item, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-orange-50 rounded-xl border border-orange-100">
                    {item.image && (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-20 h-20 object-cover rounded-lg border-2 border-orange-200"
                      />
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900">
                        {item.quantity}x {item.name}
                      </p>
                      {item.notes && (
                        <p className="text-xs text-orange-600 mt-1">Note: {item.notes}</p>
                      )}
                      <p className="text-sm font-bold text-orange-600 mt-1">₱{(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-secondary-600">Subtotal:</span>
                  <span>₱{selectedOrder.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary-600">Delivery Fee:</span>
                  <span>₱{selectedOrder.deliveryFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary-600">Tax:</span>
                  <span>₱{selectedOrder.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                  <span>Total:</span>
                  <span className="text-primary-600">₱{selectedOrder.total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Payment Information</h4>
              <p className="text-sm text-secondary-600">Method: {selectedOrder.paymentMethod.toUpperCase()}</p>
              <p className="text-sm text-secondary-600">
                Status: <span className={selectedOrder.paymentStatus === 'paid' ? 'text-green-600' : 'text-yellow-600'}>
                  {selectedOrder.paymentStatus.toUpperCase()}
                </span>
              </p>
            </div>

            {selectedOrder.specialInstructions && (
              <div>
                <h4 className="font-semibold mb-2">Special Instructions</h4>
                <p className="text-sm text-secondary-600">{selectedOrder.specialInstructions}</p>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Reject Order Modal */}
      {showRejectModal && selectedOrder && (
        <Modal
          isOpen={showRejectModal}
          onClose={() => {
            setShowRejectModal(false);
            setRejectReason('');
          }}
          title="Reject Order"
        >
          <div className="space-y-4">
            <p className="text-secondary-600">
              Are you sure you want to reject order #{selectedOrder.id}?
            </p>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Reason for rejection *
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full px-4 py-3 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                rows="4"
                placeholder="e.g., Item out of stock, Too busy to fulfill..."
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason('');
                }}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={() => handleRejectOrder(selectedOrder.id, rejectReason)}
                disabled={!rejectReason.trim()}
              >
                Reject Order
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
