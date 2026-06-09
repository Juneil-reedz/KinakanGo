import { useState } from 'react';
import { FileText, Store, Bike, Check, X, Eye, Download, Filter } from 'lucide-react';

export default function AdminApplications() {
  const [activeTab, setActiveTab] = useState('all');
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Mock applications data
  const [applications, setApplications] = useState([
    {
      id: 'APP001',
      type: 'restaurant',
      applicantName: 'Juan dela Cruz',
      email: 'juan@restaurant.com',
      phone: '+63 912 345 6789',
      restaurantName: 'Juan\'s Filipino Kitchen',
      businessAddress: '123 Main St, Manila',
      cuisine: 'Filipino',
      status: 'pending',
      submittedDate: '2025-01-20',
      documents: {
        bir: 'bir_certificate.pdf',
        businessPermit: 'business_permit.pdf',
        foodSafety: 'food_safety.pdf',
        restaurantPhotos: ['photo1.jpg', 'photo2.jpg'],
        menuPhotos: ['menu1.jpg', 'menu2.jpg']
      }
    },
    {
      id: 'APP002',
      type: 'rider',
      applicantName: 'Maria Santos',
      email: 'maria@email.com',
      phone: '+63 923 456 7890',
      vehicleType: 'Motorcycle',
      vehiclePlate: 'ABC 1234',
      status: 'pending',
      submittedDate: '2025-01-21',
      documents: {
        driverLicense: 'license.pdf',
        vehicleRegistration: 'or_cr.pdf',
        nbiClearance: 'nbi.pdf',
        validId: 'id.pdf',
        proofOfAddress: 'proof.pdf'
      }
    },
    {
      id: 'APP003',
      type: 'restaurant',
      applicantName: 'Pedro Garcia',
      email: 'pedro@burgerhouse.com',
      phone: '+63 934 567 8901',
      restaurantName: 'Pedro\'s Burger House',
      businessAddress: '456 Food St, Quezon City',
      cuisine: 'American',
      status: 'approved',
      submittedDate: '2025-01-18',
      approvedDate: '2025-01-20',
      documents: {
        bir: 'bir_certificate.pdf',
        businessPermit: 'business_permit.pdf',
        foodSafety: 'food_safety.pdf'
      }
    },
    {
      id: 'APP004',
      type: 'rider',
      applicantName: 'Jose Reyes',
      email: 'jose@email.com',
      phone: '+63 945 678 9012',
      vehicleType: 'Motorcycle',
      vehiclePlate: 'XYZ 5678',
      status: 'rejected',
      submittedDate: '2025-01-19',
      rejectedDate: '2025-01-21',
      rejectionReason: 'Invalid driver\'s license - expired',
      documents: {
        driverLicense: 'license.pdf',
        vehicleRegistration: 'or_cr.pdf'
      }
    },
  ]);

  const getFilteredApplications = () => {
    if (activeTab === 'all') return applications;
    if (activeTab === 'restaurant') return applications.filter(app => app.type === 'restaurant');
    if (activeTab === 'rider') return applications.filter(app => app.type === 'rider');
    return applications.filter(app => app.status === activeTab);
  };

  const handleApprove = (appId) => {
    const confirmed = window.confirm('Are you sure you want to approve this application?');
    if (confirmed) {
      setApplications(prev => prev.map(app =>
        app.id === appId
          ? { ...app, status: 'approved', approvedDate: new Date().toISOString().split('T')[0] }
          : app
      ));
      setShowDetailsModal(false);
    }
  };

  const handleReject = (appId) => {
    const reason = window.prompt('Please provide a reason for rejection:');
    if (reason) {
      setApplications(prev => prev.map(app =>
        app.id === appId
          ? {
              ...app,
              status: 'rejected',
              rejectedDate: new Date().toISOString().split('T')[0],
              rejectionReason: reason
            }
          : app
      ));
      setShowDetailsModal(false);
    }
  };

  const viewDetails = (app) => {
    setSelectedApplication(app);
    setShowDetailsModal(true);
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800 border border-yellow-300',
      approved: 'bg-green-100 text-green-800 border border-green-300',
      rejected: 'bg-red-100 text-red-800 border border-red-300',
    };
    return badges[status] || badges.pending;
  };

  const getStatusIcon = (status) => {
    if (status === 'approved') return <Check className="w-4 h-4" />;
    if (status === 'rejected') return <X className="w-4 h-4" />;
    return <FileText className="w-4 h-4" />;
  };

  const stats = {
    total: applications.length,
    pending: applications.filter(a => a.status === 'pending').length,
    approved: applications.filter(a => a.status === 'approved').length,
    rejected: applications.filter(a => a.status === 'rejected').length,
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Applications Management</h1>
        <p className="text-gray-600">Review and manage restaurant owner and rider applications</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 text-sm font-medium">Total Applications</span>
            <FileText className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-yellow-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 text-sm font-medium">Pending Review</span>
            <FileText className="w-5 h-5 text-yellow-600" />
          </div>
          <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-green-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 text-sm font-medium">Approved</span>
            <Check className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-green-600">{stats.approved}</p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-red-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 text-sm font-medium">Rejected</span>
            <X className="w-5 h-5 text-red-600" />
          </div>
          <p className="text-3xl font-bold text-red-600">{stats.rejected}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm mb-6">
        <div className="flex items-center gap-2 p-2">
          <Filter className="w-5 h-5 text-gray-500 ml-2" />
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'all'
                ? 'bg-blue-500 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            All Applications
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'pending'
                ? 'bg-yellow-500 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setActiveTab('approved')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'approved'
                ? 'bg-green-500 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Approved
          </button>
          <button
            onClick={() => setActiveTab('rejected')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'rejected'
                ? 'bg-red-500 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Rejected
          </button>
          <div className="w-px h-8 bg-gray-300 mx-2" />
          <button
            onClick={() => setActiveTab('restaurant')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'restaurant'
                ? 'bg-orange-500 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Store className="w-4 h-4" />
            Restaurant
          </button>
          <button
            onClick={() => setActiveTab('rider')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'rider'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Bike className="w-4 h-4" />
            Rider
          </button>
        </div>
      </div>

      {/* Applications List */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Application ID
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Applicant
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Details
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Submitted
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {getFilteredApplications().length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                    No applications found
                  </td>
                </tr>
              ) : (
                getFilteredApplications().map((app) => (
                  <tr key={app.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-mono text-sm font-semibold text-blue-600">
                        {app.id}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {app.type === 'restaurant' ? (
                          <>
                            <Store className="w-5 h-5 text-orange-600" />
                            <span className="text-sm font-medium text-orange-600">Restaurant</span>
                          </>
                        ) : (
                          <>
                            <Bike className="w-5 h-5 text-blue-600" />
                            <span className="text-sm font-medium text-blue-600">Rider</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{app.applicantName}</p>
                        <p className="text-xs text-gray-500">{app.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-700">
                        {app.type === 'restaurant' ? (
                          <>
                            <p className="font-medium">{app.restaurantName}</p>
                            <p className="text-xs text-gray-500">{app.cuisine}</p>
                          </>
                        ) : (
                          <>
                            <p className="font-medium">{app.vehicleType}</p>
                            <p className="text-xs text-gray-500">{app.vehiclePlate}</p>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(app.submittedDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(app.status)}`}>
                        {getStatusIcon(app.status)}
                        {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => viewDetails(app)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        {app.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(app.id)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Approve"
                            >
                              <Check className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleReject(app.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Reject"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedApplication && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Application Details</h2>
                <p className="text-sm text-gray-500">ID: {selectedApplication.id}</p>
              </div>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Status */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                <span className={`inline-flex items-center gap-1 px-4 py-2 rounded-full text-sm font-semibold ${getStatusBadge(selectedApplication.status)}`}>
                  {getStatusIcon(selectedApplication.status)}
                  {selectedApplication.status.charAt(0).toUpperCase() + selectedApplication.status.slice(1)}
                </span>
              </div>

              {/* Applicant Information */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Applicant Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Name</p>
                    <p className="font-semibold text-gray-900">{selectedApplication.applicantName}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Email</p>
                    <p className="font-semibold text-gray-900">{selectedApplication.email}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Phone</p>
                    <p className="font-semibold text-gray-900">{selectedApplication.phone}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Submitted</p>
                    <p className="font-semibold text-gray-900">
                      {new Date(selectedApplication.submittedDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Type-specific Details */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-semibold text-gray-900 mb-3">
                  {selectedApplication.type === 'restaurant' ? 'Restaurant Details' : 'Rider Details'}
                </h3>
                {selectedApplication.type === 'restaurant' ? (
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Restaurant Name</p>
                      <p className="font-semibold text-gray-900">{selectedApplication.restaurantName}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Cuisine Type</p>
                      <p className="font-semibold text-gray-900">{selectedApplication.cuisine}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-gray-600">Business Address</p>
                      <p className="font-semibold text-gray-900">{selectedApplication.businessAddress}</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Vehicle Type</p>
                      <p className="font-semibold text-gray-900">{selectedApplication.vehicleType}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Plate Number</p>
                      <p className="font-semibold text-gray-900">{selectedApplication.vehiclePlate}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Documents */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Submitted Documents</h3>
                <div className="space-y-2">
                  {Object.entries(selectedApplication.documents).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-blue-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                          </p>
                          {Array.isArray(value) ? (
                            <p className="text-xs text-gray-500">{value.length} file(s)</p>
                          ) : (
                            <p className="text-xs text-gray-500">{value}</p>
                          )}
                        </div>
                      </div>
                      <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        <Download className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Rejection Reason */}
              {selectedApplication.status === 'rejected' && selectedApplication.rejectionReason && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <h3 className="font-semibold text-red-900 mb-2">Rejection Reason</h3>
                  <p className="text-sm text-red-800">{selectedApplication.rejectionReason}</p>
                </div>
              )}

              {/* Actions */}
              {selectedApplication.status === 'pending' && (
                <div className="flex items-center gap-3 pt-4 border-t">
                  <button
                    onClick={() => handleApprove(selectedApplication.id)}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
                  >
                    <Check className="w-5 h-5" />
                    Approve Application
                  </button>
                  <button
                    onClick={() => handleReject(selectedApplication.id)}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
                  >
                    <X className="w-5 h-5" />
                    Reject Application
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
