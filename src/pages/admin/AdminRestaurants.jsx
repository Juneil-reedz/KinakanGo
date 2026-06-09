import { useState } from 'react';
import { restaurants, menuItems } from '../../data/mockData';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import {
  Store,
  Search,
  Star,
  Clock,
  DollarSign,
  MapPin,
  Phone,
  Mail,
  Edit,
  Trash2,
  Eye,
  ChevronDown,
  ChevronUp,
  Package,
  TrendingUp,
  Users,
  CheckCircle,
  XCircle,
  X
} from 'lucide-react';

export default function AdminRestaurants() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [expandedMenus, setExpandedMenus] = useState({});
  const [filterStatus, setFilterStatus] = useState('all');
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [restaurantsList, setRestaurantsList] = useState(restaurants);

  const filteredRestaurants = restaurantsList.filter((restaurant) => {
    const matchesSearch = restaurant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      restaurant.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      restaurant.cuisines.some(c => c.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = filterStatus === 'all' ||
      (filterStatus === 'open' && restaurant.isOpen) ||
      (filterStatus === 'closed' && !restaurant.isOpen);

    return matchesSearch && matchesStatus;
  });

  const getRestaurantMenuItems = (restaurantId) => {
    return menuItems.filter(item => item.restaurantId === restaurantId);
  };

  const toggleMenu = (restaurantId) => {
    setExpandedMenus(prev => ({
      ...prev,
      [restaurantId]: !prev[restaurantId]
    }));
  };

  const handleView = (restaurant) => {
    setSelectedRestaurant(restaurant);
    setShowViewModal(true);
  };

  const handleEdit = (restaurant) => {
    setSelectedRestaurant(restaurant);
    setShowEditModal(true);
  };

  const handleDelete = (restaurant) => {
    setSelectedRestaurant(restaurant);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    setRestaurantsList(restaurantsList.filter(r => r.id !== selectedRestaurant.id));
    setShowDeleteModal(false);
    setSelectedRestaurant(null);
  };

  const toggleRestaurantStatus = (restaurantId) => {
    setRestaurantsList(restaurantsList.map(r =>
      r.id === restaurantId ? { ...r, isOpen: !r.isOpen } : r
    ));
  };

  return (
    <div className="py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold mb-2 text-slate-800">
            Restaurant Management
          </h1>
          <p className="text-slate-600">Manage all restaurant partners and their menus</p>
        </div>
        <Button variant="primary" className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900">
          <Store className="w-4 h-4" />
          Add New Restaurant
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <Card className="bg-white border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm mb-1">Total Restaurants</p>
              <p className="text-3xl font-bold text-slate-900">{restaurantsList.length}</p>
            </div>
            <div className="p-3 bg-slate-100 rounded-lg">
              <Store className="w-6 h-6 text-slate-600" />
            </div>
          </div>
        </Card>

        <Card className="bg-white border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm mb-1">Open Now</p>
              <p className="text-3xl font-bold text-slate-900">{restaurantsList.filter(r => r.isOpen).length}</p>
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
                {(restaurantsList.reduce((acc, r) => acc + r.rating, 0) / restaurantsList.length).toFixed(1)}
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
              <p className="text-slate-600 text-sm mb-1">Total Menu Items</p>
              <p className="text-3xl font-bold text-slate-900">{menuItems.length}</p>
            </div>
            <div className="p-3 bg-slate-100 rounded-lg">
              <Package className="w-6 h-6 text-slate-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-secondary-400" />
            <input
              type="text"
              placeholder="Search restaurants by name, category, or cuisine..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-secondary-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterStatus === 'all'
                  ? 'bg-slate-800 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterStatus('open')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterStatus === 'open'
                  ? 'bg-slate-800 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Open
            </button>
            <button
              onClick={() => setFilterStatus('closed')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterStatus === 'closed'
                  ? 'bg-slate-800 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Closed
            </button>
          </div>
        </div>
      </Card>

      {/* Results Count */}
      <div className="text-sm text-secondary-600">
        Showing <span className="font-semibold">{filteredRestaurants.length}</span> restaurant(s)
      </div>

      {/* Restaurants List */}
      <div className="space-y-4">
        {filteredRestaurants.map((restaurant) => {
          const restaurantMenu = getRestaurantMenuItems(restaurant.id);
          const isExpanded = expandedMenus[restaurant.id];

          return (
            <Card key={restaurant.id} className="overflow-hidden">
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Restaurant Image */}
                <div className="lg:w-64 h-48 lg:h-auto relative overflow-hidden rounded-lg">
                  <img
                    src={restaurant.image}
                    alt={restaurant.name}
                    className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                  />
                  <button
                    onClick={() => toggleRestaurantStatus(restaurant.id)}
                    className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-semibold cursor-pointer ${
                      restaurant.isOpen
                        ? 'bg-green-500 text-white hover:bg-green-600'
                        : 'bg-red-500 text-white hover:bg-red-600'
                    }`}
                  >
                    {restaurant.isOpen ? 'Open' : 'Closed'}
                  </button>
                </div>

                {/* Restaurant Details */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-2xl font-bold text-secondary-900 mb-2">{restaurant.name}</h3>
                      <p className="text-secondary-600 mb-3">{restaurant.description}</p>

                      <div className="flex flex-wrap items-center gap-4 mb-3">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                          <span className="font-semibold">{restaurant.rating}</span>
                          <span className="text-sm text-secondary-500">({restaurant.reviews} reviews)</span>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-secondary-600">
                          <Clock className="w-4 h-4" />
                          {restaurant.deliveryTime} min
                        </div>
                        <div className="flex items-center gap-1 text-sm text-secondary-600">
                          <DollarSign className="w-4 h-4" />
                          ${restaurant.deliveryFee} delivery
                        </div>
                        <div className="flex items-center gap-1 text-sm text-secondary-600">
                          <Package className="w-4 h-4" />
                          ${restaurant.minOrder} min order
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-4">
                        {restaurant.cuisines.map((cuisine, index) => (
                          <span key={index} className="px-3 py-1 bg-slate-100 text-slate-700 text-sm rounded-full font-medium">
                            {cuisine}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleView(restaurant)}
                        className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleEdit(restaurant)}
                        className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(restaurant)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Toggle Menu Button */}
                  <button
                    onClick={() => toggleMenu(restaurant.id)}
                    className="flex items-center gap-2 text-slate-700 hover:text-slate-900 font-medium text-sm"
                  >
                    {isExpanded ? (
                      <>
                        <ChevronUp className="w-4 h-4" />
                        Hide Menu ({restaurantMenu.length} items)
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4" />
                        View Menu ({restaurantMenu.length} items)
                      </>
                    )}
                  </button>

                  {/* Menu Items */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-slate-200">
                      <h4 className="font-bold text-base mb-3 text-slate-900">Menu Items</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {restaurantMenu.map((item) => (
                          <div key={item.id} className="border border-slate-200 rounded-lg p-3 hover:border-slate-300 transition-colors">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <h5 className="font-semibold text-sm mb-1 text-slate-900">{item.name}</h5>
                                <p className="text-xs text-slate-600 line-clamp-2 mb-2">{item.description}</p>
                              </div>
                              {item.image && (
                                <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded-lg ml-2" />
                              )}
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-900">${item.price}</span>
                              <div className="flex items-center gap-2">
                                {item.isVegetarian && (
                                  <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">Veg</span>
                                )}
                                <span className={`px-2 py-0.5 text-xs rounded-full ${
                                  item.isAvailable
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-red-100 text-red-700'
                                }`}>
                                  {item.isAvailable ? 'Available' : 'Out of stock'}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* No Results */}
      {filteredRestaurants.length === 0 && (
        <Card className="text-center py-12">
          <Store className="w-16 h-16 text-secondary-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-secondary-900 mb-2">No restaurants found</h3>
          <p className="text-secondary-600">Try adjusting your search or filters</p>
        </Card>
      )}

      {/* View Modal */}
      {showViewModal && selectedRestaurant && (
        <Modal onClose={() => setShowViewModal(false)}>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-secondary-900">Restaurant Details</h2>
              <button onClick={() => setShowViewModal(false)} className="p-2 hover:bg-secondary-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <img src={selectedRestaurant.image} alt={selectedRestaurant.name} className="w-full h-64 object-cover rounded-lg" />
              <h3 className="text-xl font-bold">{selectedRestaurant.name}</h3>
              <p className="text-secondary-600">{selectedRestaurant.description}</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-secondary-600">Rating</p>
                  <p className="font-semibold">{selectedRestaurant.rating} / 5.0</p>
                </div>
                <div>
                  <p className="text-sm text-secondary-600">Reviews</p>
                  <p className="font-semibold">{selectedRestaurant.reviews}</p>
                </div>
                <div>
                  <p className="text-sm text-secondary-600">Delivery Time</p>
                  <p className="font-semibold">{selectedRestaurant.deliveryTime} min</p>
                </div>
                <div>
                  <p className="text-sm text-secondary-600">Delivery Fee</p>
                  <p className="font-semibold">${selectedRestaurant.deliveryFee}</p>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedRestaurant && (
        <Modal onClose={() => setShowEditModal(false)}>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-secondary-900">Edit Restaurant</h2>
              <button onClick={() => setShowEditModal(false)} className="p-2 hover:bg-secondary-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Restaurant Name</label>
                <input
                  type="text"
                  defaultValue={selectedRestaurant.name}
                  className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">Description</label>
                <textarea
                  defaultValue={selectedRestaurant.description}
                  rows={3}
                  className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
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
      {showDeleteModal && selectedRestaurant && (
        <Modal onClose={() => setShowDeleteModal(false)}>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-red-600">Delete Restaurant</h2>
              <button onClick={() => setShowDeleteModal(false)} className="p-2 hover:bg-secondary-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-secondary-600 mb-6">
              Are you sure you want to delete <strong>{selectedRestaurant.name}</strong>? This action cannot be undone.
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
