import { useState } from 'react';
import { riders } from '../../data/mockData';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import {
  Bike,
  Search,
  Star,
  MapPin,
  Phone,
  Mail,
  Edit,
  Trash2,
  Eye,
  DollarSign,
  TrendingUp,
  Package,
  CheckCircle,
  XCircle,
  Clock,
  Award,
  Calendar,
  Truck,
  Filter,
  X,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';

export default function AdminRiders() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRider, setSelectedRider] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterZone, setFilterZone] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [ridersList, setRidersList] = useState(riders);

  const zones = ['all', ...new Set(ridersList.map(r => r.zone))];

  const filteredRiders = ridersList
    .filter((rider) => {
      const matchesSearch = rider.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rider.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rider.vehicleNumber.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = filterStatus === 'all' || rider.status === filterStatus;
      const matchesZone = filterZone === 'all' || rider.zone === filterZone;

      return matchesSearch && matchesStatus && matchesZone;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return b.rating - a.rating;
        case 'deliveries':
          return b.totalDeliveries - a.totalDeliveries;
        case 'earnings':
          return b.earnings - a.earnings;
        default:
          return a.name.localeCompare(b.name);
      }
    });

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'busy':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'offline':
        return 'bg-red-100 text-red-700 border-red-300';
      default:
        return 'bg-secondary-100 text-secondary-700 border-secondary-300';
    }
  };

  const getVehicleIcon = (vehicleType) => {
    switch (vehicleType) {
      case 'motorcycle':
      case 'bicycle':
      case 'scooter':
        return <Bike className="w-4 h-4" />;
      default:
        return <Truck className="w-4 h-4" />;
    }
  };

  const handleView = (rider) => {
    setSelectedRider(rider);
    setShowViewModal(true);
  };

  const handleEdit = (rider) => {
    setSelectedRider(rider);
    setShowEditModal(true);
  };

  const handleDelete = (rider) => {
    setSelectedRider(rider);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    setRidersList(ridersList.filter(r => r.id !== selectedRider.id));
    setShowDeleteModal(false);
    setSelectedRider(null);
  };

  const toggleRiderAvailability = (riderId) => {
    setRidersList(ridersList.map(r =>
      r.id === riderId ? { ...r, availability: !r.availability } : r
    ));
  };

  return (
    <div className="py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold mb-2 text-slate-800">
            Rider Management
          </h1>
          <p className="text-slate-600">Manage delivery riders and their performance</p>
        </div>
        <Button variant="primary" className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900">
          <Bike className="w-4 h-4" />
          Add New Rider
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
        <Card className="bg-white border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm mb-1">Total Riders</p>
              <p className="text-3xl font-bold text-slate-900">{ridersList.length}</p>
            </div>
            <div className="p-3 bg-slate-100 rounded-lg">
              <Bike className="w-6 h-6 text-slate-600" />
            </div>
          </div>
        </Card>

        <Card className="bg-white border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm mb-1">Active Now</p>
              <p className="text-3xl font-bold text-slate-900">{ridersList.filter(r => r.status === 'active').length}</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="bg-white border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm mb-1">Avg Rating</p>
              <p className="text-3xl font-bold text-slate-900">
                {(ridersList.reduce((acc, r) => acc + r.rating, 0) / ridersList.length).toFixed(1)}
              </p>
            </div>
            <div className="p-3 bg-slate-100 rounded-lg">
              <Star className="w-6 h-6 text-yellow-500" />
            </div>
          </div>
        </Card>

        <Card className="bg-white border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm mb-1">Total Deliveries</p>
              <p className="text-3xl font-bold text-slate-900">
                {ridersList.reduce((acc, r) => acc + r.totalDeliveries, 0).toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-slate-100 rounded-lg">
              <Package className="w-6 h-6 text-slate-600" />
            </div>
          </div>
        </Card>

        <Card className="bg-white border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm mb-1">Today's Deliveries</p>
              <p className="text-3xl font-bold text-slate-900">
                {ridersList.reduce((acc, r) => acc + r.completedToday, 0)}
              </p>
            </div>
            <div className="p-3 bg-slate-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-slate-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-secondary-400" />
            <input
              type="text"
              placeholder="Search riders by name, email, or vehicle number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-secondary-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-secondary-700 mb-2">Status</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setFilterStatus('all')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
                    filterStatus === 'all'
                      ? 'bg-slate-800 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilterStatus('active')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
                    filterStatus === 'active'
                      ? 'bg-slate-800 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Active
                </button>
                <button
                  onClick={() => setFilterStatus('busy')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
                    filterStatus === 'busy'
                      ? 'bg-slate-800 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Busy
                </button>
                <button
                  onClick={() => setFilterStatus('offline')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
                    filterStatus === 'offline'
                      ? 'bg-slate-800 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Offline
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">Zone</label>
              <select
                value={filterZone}
                onChange={(e) => setFilterZone(e.target.value)}
                className="px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                {zones.map(zone => (
                  <option key={zone} value={zone}>{zone === 'all' ? 'All Zones' : zone}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="name">Name</option>
                <option value="rating">Rating</option>
                <option value="deliveries">Total Deliveries</option>
                <option value="earnings">Earnings</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Results Count */}
      <div className="text-sm text-secondary-600">
        Showing <span className="font-semibold">{filteredRiders.length}</span> rider(s)
      </div>

      {/* Riders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredRiders.map((rider) => (
          <Card key={rider.id} className="border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all duration-200">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {rider.image ? (
                    <img
                      src={rider.image}
                      alt={rider.name}
                      className="w-14 h-14 rounded-full object-cover border-2 border-slate-200"
                    />
                  ) : (
                    <div className="w-14 h-14 bg-slate-800 rounded-full flex items-center justify-center text-white font-bold text-xl">
                      {rider.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <h3 className="font-bold text-base text-slate-900">{rider.name}</h3>
                    <p className="text-xs text-slate-600">{rider.email}</p>
                  </div>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${getStatusColor(rider.status)}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${
                    rider.status === 'active' ? 'bg-green-500 animate-pulse' :
                    rider.status === 'busy' ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`}></div>
                  {rider.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-slate-600 mb-1">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span className="text-xs">Rating</span>
                  </div>
                  <p className="text-xl font-bold text-slate-900">{rider.rating}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-slate-600 mb-1">
                    <Package className="w-4 h-4 text-slate-600" />
                    <span className="text-xs">Deliveries</span>
                  </div>
                  <p className="text-xl font-bold text-slate-900">{rider.totalDeliveries}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-slate-600 mb-1">
                    <TrendingUp className="w-4 h-4 text-slate-600" />
                    <span className="text-xs">Today</span>
                  </div>
                  <p className="text-xl font-bold text-slate-900">{rider.completedToday}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-slate-600 mb-1">
                    <DollarSign className="w-4 h-4 text-slate-600" />
                    <span className="text-xs">Earnings</span>
                  </div>
                  <p className="text-xl font-bold text-slate-900">${rider.earnings.toLocaleString()}</p>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-secondary-600">
                  <Phone className="w-4 h-4" />
                  <span>{rider.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-secondary-600">
                  <MapPin className="w-4 h-4" />
                  <span>{rider.zone}</span>
                </div>
                <div className="flex items-center gap-2 text-secondary-600">
                  {getVehicleIcon(rider.vehicleType)}
                  <span className="capitalize">{rider.vehicleType} - {rider.vehicleNumber}</span>
                </div>
                <div className="flex items-center gap-2 text-secondary-600">
                  <Calendar className="w-4 h-4" />
                  <span>Joined {new Date(rider.joinedDate).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-secondary-200">
                  <span className="text-xs text-secondary-600">Availability</span>
                  <button
                    onClick={() => toggleRiderAvailability(rider.id)}
                    className="flex items-center gap-2"
                  >
                    {rider.availability ? (
                      <ToggleRight className="w-8 h-8 text-green-500" />
                    ) : (
                      <ToggleLeft className="w-8 h-8 text-secondary-400" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-200">
                <button
                  onClick={() => handleView(rider)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  <span className="text-sm font-medium">View</span>
                </button>
                <button
                  onClick={() => handleEdit(rider)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  <span className="text-sm font-medium">Edit</span>
                </button>
                <button
                  onClick={() => handleDelete(rider)}
                  className="px-4 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* No Results */}
      {filteredRiders.length === 0 && (
        <Card className="text-center py-12">
          <Bike className="w-16 h-16 text-secondary-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-secondary-900 mb-2">No riders found</h3>
          <p className="text-secondary-600">Try adjusting your search or filters</p>
        </Card>
      )}

      {/* View Modal */}
      {showViewModal && selectedRider && (
        <Modal onClose={() => setShowViewModal(false)}>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-secondary-900">Rider Details</h2>
              <button onClick={() => setShowViewModal(false)} className="p-2 hover:bg-secondary-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                {selectedRider.image ? (
                  <img src={selectedRider.image} alt={selectedRider.name} className="w-24 h-24 rounded-full object-cover shadow-lg" />
                ) : (
                  <div className="w-24 h-24 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center text-white font-bold text-3xl shadow-lg">
                    {selectedRider.name.charAt(0)}
                  </div>
                )}
                <div>
                  <h3 className="text-xl font-bold">{selectedRider.name}</h3>
                  <p className="text-secondary-600">{selectedRider.email}</p>
                  <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(selectedRider.status)}`}>
                    {selectedRider.status}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-secondary-600">Rating</p>
                  <p className="font-semibold">{selectedRider.rating} / 5.0</p>
                </div>
                <div>
                  <p className="text-sm text-secondary-600">Total Deliveries</p>
                  <p className="font-semibold">{selectedRider.totalDeliveries}</p>
                </div>
                <div>
                  <p className="text-sm text-secondary-600">Today's Deliveries</p>
                  <p className="font-semibold">{selectedRider.completedToday}</p>
                </div>
                <div>
                  <p className="text-sm text-secondary-600">Total Earnings</p>
                  <p className="font-semibold">${selectedRider.earnings.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-secondary-600">Phone</p>
                  <p className="font-semibold">{selectedRider.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-secondary-600">Zone</p>
                  <p className="font-semibold">{selectedRider.zone}</p>
                </div>
                <div>
                  <p className="text-sm text-secondary-600">Vehicle</p>
                  <p className="font-semibold capitalize">{selectedRider.vehicleType}</p>
                </div>
                <div>
                  <p className="text-sm text-secondary-600">Vehicle Number</p>
                  <p className="font-semibold">{selectedRider.vehicleNumber}</p>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedRider && (
        <Modal onClose={() => setShowEditModal(false)}>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-secondary-900">Edit Rider</h2>
              <button onClick={() => setShowEditModal(false)} className="p-2 hover:bg-secondary-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Rider Name</label>
                <input
                  type="text"
                  defaultValue={selectedRider.name}
                  className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Email</label>
                <input
                  type="email"
                  defaultValue={selectedRider.email}
                  className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Phone</label>
                <input
                  type="tel"
                  defaultValue={selectedRider.phone}
                  className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Zone</label>
                <select
                  defaultValue={selectedRider.zone}
                  className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  {zones.filter(z => z !== 'all').map(zone => (
                    <option key={zone} value={zone}>{zone}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-4">
                <Button type="button" variant="outline" onClick={() => setShowEditModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary">
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </Modal>
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedRider && (
        <Modal onClose={() => setShowDeleteModal(false)}>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-red-600">Delete Rider</h2>
              <button onClick={() => setShowDeleteModal(false)} className="p-2 hover:bg-secondary-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-secondary-600 mb-6">
              Are you sure you want to delete <strong>{selectedRider.name}</strong>? This action cannot be undone.
            </p>
            <div className="flex gap-4">
              <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
                Delete
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
