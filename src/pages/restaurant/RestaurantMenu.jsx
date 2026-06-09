import { useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { useNotification } from '../../context/NotificationContext';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import { Package, Clock, Leaf, Search, Plus, Edit2, Trash2 } from 'lucide-react';

export default function RestaurantMenu() {
  const { restaurant } = useRestaurant();
  const { showSuccess, showError } = useNotification();

  const [menuItems, setMenuItems] = useState([
    {
      id: 1,
      name: 'Margherita Pizza',
      category: 'pizza',
      price: 12.99,
      description: 'Classic pizza with tomato sauce, mozzarella, and fresh basil',
      image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&h=300&fit=crop',
      isAvailable: true,
      isVegetarian: true,
      prepTime: 20,
    },
    {
      id: 2,
      name: 'Pepperoni Pizza',
      category: 'pizza',
      price: 14.99,
      description: 'Loaded with pepperoni and extra cheese',
      image: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400&h=300&fit=crop',
      isAvailable: true,
      isVegetarian: false,
      prepTime: 20,
    },
    {
      id: 3,
      name: 'Spaghetti Carbonara',
      category: 'pasta',
      price: 13.99,
      description: 'Creamy pasta with bacon and parmesan cheese',
      image: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=400&h=300&fit=crop',
      isAvailable: true,
      isVegetarian: false,
      prepTime: 15,
    },
    {
      id: 4,
      name: 'Caesar Salad',
      category: 'salads',
      price: 8.99,
      description: 'Fresh romaine lettuce with caesar dressing and croutons',
      image: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400&h=300&fit=crop',
      isAvailable: false,
      isVegetarian: true,
      prepTime: 10,
    },
  ]);

  const [categories, setCategories] = useState([
    { id: 'pizza', name: 'Pizza', icon: '🍕' },
    { id: 'pasta', name: 'Pasta', icon: '🍝' },
    { id: 'salads', name: 'Salads', icon: '🥗' },
    { id: 'desserts', name: 'Desserts', icon: '🍰' },
    { id: 'beverages', name: 'Beverages', icon: '🥤' },
  ]);

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [showEditItemModal, setShowEditItemModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const [itemFormData, setItemFormData] = useState({
    name: '',
    category: 'pizza',
    price: '',
    description: '',
    image: '',
    isVegetarian: false,
    prepTime: '',
  });

  const [categoryFormData, setCategoryFormData] = useState({
    id: '',
    name: '',
    icon: '',
  });

  const getFilteredItems = () => {
    let filtered = menuItems;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }

    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  };

  const handleToggleAvailability = (itemId) => {
    setMenuItems(menuItems.map(item =>
      item.id === itemId
        ? { ...item, isAvailable: !item.isAvailable }
        : item
    ));
    const item = menuItems.find(i => i.id === itemId);
    showSuccess(`${item.name} ${!item.isAvailable ? 'enabled' : 'disabled'}`);
  };

  const handleAddItem = (e) => {
    e.preventDefault();

    const newItem = {
      id: menuItems.length + 1,
      name: itemFormData.name,
      category: itemFormData.category,
      price: parseFloat(itemFormData.price),
      description: itemFormData.description,
      image: itemFormData.image,
      isAvailable: true,
      isVegetarian: itemFormData.isVegetarian,
      prepTime: parseInt(itemFormData.prepTime),
    };

    setMenuItems([...menuItems, newItem]);
    showSuccess(`${newItem.name} added successfully!`);
    setShowAddItemModal(false);
    resetItemForm();
  };

  const handleEditItem = (e) => {
    e.preventDefault();

    setMenuItems(menuItems.map(item =>
      item.id === selectedItem.id
        ? {
            ...item,
            name: itemFormData.name,
            category: itemFormData.category,
            price: parseFloat(itemFormData.price),
            description: itemFormData.description,
            image: itemFormData.image,
            isVegetarian: itemFormData.isVegetarian,
            prepTime: parseInt(itemFormData.prepTime),
          }
        : item
    ));

    showSuccess('Item updated successfully!');
    setShowEditItemModal(false);
    resetItemForm();
  };

  const handleDeleteItem = (itemId) => {
    if (confirm('Are you sure you want to delete this item?')) {
      setMenuItems(menuItems.filter(item => item.id !== itemId));
      showSuccess('Item deleted successfully!');
    }
  };

  const openEditModal = (item) => {
    setSelectedItem(item);
    setItemFormData({
      name: item.name,
      category: item.category,
      price: item.price.toString(),
      description: item.description,
      image: item.image || '',
      isVegetarian: item.isVegetarian,
      prepTime: item.prepTime.toString(),
    });
    setShowEditItemModal(true);
  };

  const resetItemForm = () => {
    setItemFormData({
      name: '',
      category: 'pizza',
      price: '',
      description: '',
      image: '',
      isVegetarian: false,
      prepTime: '',
    });
    setSelectedItem(null);
  };

  const handleAddCategory = (e) => {
    e.preventDefault();

    const newCategory = {
      id: categoryFormData.id,
      name: categoryFormData.name,
      icon: categoryFormData.icon,
    };

    setCategories([...categories, newCategory]);
    showSuccess(`Category "${newCategory.name}" added successfully!`);
    setShowCategoryModal(false);
    setCategoryFormData({ id: '', name: '', icon: '' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Menu Management</h1>
          <p className="text-gray-600 text-sm mt-1">Manage your menu items and categories</p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => setShowCategoryModal(true)}
            className="text-gray-700 border-gray-300 hover:bg-orange-50 hover:border-orange-200 hover:text-rose-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            Category
          </Button>
          <Button
            variant="primary"
            onClick={() => setShowAddItemModal(true)}
            className="bg-gradient-to-r from-rose-400 to-orange-500 hover:from-rose-500 hover:to-orange-600 text-white shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Item
          </Button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search menu items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent"
            />
          </div>

          {/* Category Filters */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${
                selectedCategory === 'all'
                  ? 'bg-gradient-to-r from-rose-400 to-orange-500 text-white shadow-md'
                  : 'bg-gray-50 text-gray-700 hover:bg-orange-50 hover:text-rose-600'
              }`}
            >
              All Items
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-gradient-to-r from-rose-400 to-orange-500 text-white shadow-md'
                    : 'bg-gray-50 text-gray-700 hover:bg-orange-50 hover:text-rose-600'
                }`}
              >
                <span className="mr-1.5">{cat.icon}</span>
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Menu Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {getFilteredItems().length === 0 ? (
          <div className="col-span-full bg-white rounded-2xl border border-gray-100 p-12 shadow-sm">
            <div className="text-center">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">No items found</p>
            </div>
          </div>
        ) : (
          getFilteredItems().map((item) => (
            <div
              key={item.id}
              className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg hover:border-orange-200 transition-all duration-200"
            >
              {/* Food Image */}
              {item.image && (
                <div className="relative h-48 overflow-hidden bg-gray-100">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  {/* Toggle Switch Overlay on Image */}
                  <div className="absolute top-3 right-3">
                    <button
                      onClick={() => handleToggleAvailability(item.id)}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors shadow-md ${
                        item.isAvailable ? 'bg-gradient-to-r from-green-400 to-green-500' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                          item.isAvailable ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              )}

              {/* Card Content */}
              <div className="p-5">
                {/* Header with Name and Price */}
                <div className="mb-3">
                  <h3 className="font-bold text-lg text-gray-900 leading-tight mb-1">
                    {item.name}
                  </h3>
                  <div className="text-2xl font-bold bg-gradient-to-r from-rose-500 to-orange-500 bg-clip-text text-transparent">
                    ₱{item.price.toFixed(2)}
                  </div>
                </div>

                {/* Meta Information */}
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-orange-50 text-orange-700 rounded-lg text-xs font-medium border border-orange-100">
                    <span>{categories.find(c => c.id === item.category)?.icon}</span>
                    <span>{categories.find(c => c.id === item.category)?.name}</span>
                  </span>
                  {item.isVegetarian && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-50 text-green-700 rounded-lg text-xs font-medium border border-green-100">
                      <Leaf className="w-3 h-3" />
                      <span>Vegetarian</span>
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium border border-blue-100">
                    <Clock className="w-3 h-3" />
                    <span>{item.prepTime} min</span>
                  </span>
                </div>

                {/* Description */}
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {item.description}
                </p>

                {/* Status Badge */}
                <div className="mb-4">
                  <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold ${
                    item.isAvailable
                      ? 'bg-green-50 text-green-700 border border-green-200'
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full mr-2 ${
                      item.isAvailable ? 'bg-green-500' : 'bg-red-500'
                    }`} />
                    {item.isAvailable ? 'Available' : 'Unavailable'}
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => openEditModal(item)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-xl font-medium text-sm transition-colors border border-orange-100"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-medium text-sm transition-colors border border-red-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Item Modal */}
      <Modal
        isOpen={showAddItemModal}
        onClose={() => {
          setShowAddItemModal(false);
          resetItemForm();
        }}
        title="Add New Menu Item"
      >
        <form onSubmit={handleAddItem} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Item Name *
            </label>
            <input
              type="text"
              value={itemFormData.name}
              onChange={(e) => setItemFormData({ ...itemFormData, name: e.target.value })}
              className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="e.g., Margherita Pizza"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Category *
            </label>
            <select
              value={itemFormData.category}
              onChange={(e) => setItemFormData({ ...itemFormData, category: e.target.value })}
              className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            >
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon} {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Price (₱) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={itemFormData.price}
              onChange={(e) => setItemFormData({ ...itemFormData, price: e.target.value })}
              className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="0.00"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Preparation Time (minutes) *
            </label>
            <input
              type="number"
              min="1"
              value={itemFormData.prepTime}
              onChange={(e) => setItemFormData({ ...itemFormData, prepTime: e.target.value })}
              className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="20"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Description *
            </label>
            <textarea
              value={itemFormData.description}
              onChange={(e) => setItemFormData({ ...itemFormData, description: e.target.value })}
              className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              rows="3"
              placeholder="Describe your item..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Image URL
            </label>
            <input
              type="url"
              value={itemFormData.image}
              onChange={(e) => setItemFormData({ ...itemFormData, image: e.target.value })}
              className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="https://example.com/image.jpg"
            />
            <p className="text-xs text-secondary-500 mt-1">Enter a URL to an image of your menu item</p>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isVegetarian"
              checked={itemFormData.isVegetarian}
              onChange={(e) => setItemFormData({ ...itemFormData, isVegetarian: e.target.checked })}
              className="w-4 h-4 text-primary-600 border-secondary-300 rounded focus:ring-primary-500"
            />
            <label htmlFor="isVegetarian" className="ml-2 text-sm text-secondary-700">
              Vegetarian
            </label>
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowAddItemModal(false);
                resetItemForm();
              }}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Add Item
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Item Modal */}
      <Modal
        isOpen={showEditItemModal}
        onClose={() => {
          setShowEditItemModal(false);
          resetItemForm();
        }}
        title="Edit Menu Item"
      >
        <form onSubmit={handleEditItem} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Item Name *
            </label>
            <input
              type="text"
              value={itemFormData.name}
              onChange={(e) => setItemFormData({ ...itemFormData, name: e.target.value })}
              className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Category *
            </label>
            <select
              value={itemFormData.category}
              onChange={(e) => setItemFormData({ ...itemFormData, category: e.target.value })}
              className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            >
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon} {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Price (₱) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={itemFormData.price}
              onChange={(e) => setItemFormData({ ...itemFormData, price: e.target.value })}
              className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Preparation Time (minutes) *
            </label>
            <input
              type="number"
              min="1"
              value={itemFormData.prepTime}
              onChange={(e) => setItemFormData({ ...itemFormData, prepTime: e.target.value })}
              className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Description *
            </label>
            <textarea
              value={itemFormData.description}
              onChange={(e) => setItemFormData({ ...itemFormData, description: e.target.value })}
              className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              rows="3"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Image URL
            </label>
            <input
              type="url"
              value={itemFormData.image}
              onChange={(e) => setItemFormData({ ...itemFormData, image: e.target.value })}
              className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="https://example.com/image.jpg"
            />
            <p className="text-xs text-secondary-500 mt-1">Enter a URL to an image of your menu item</p>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="editIsVegetarian"
              checked={itemFormData.isVegetarian}
              onChange={(e) => setItemFormData({ ...itemFormData, isVegetarian: e.target.checked })}
              className="w-4 h-4 text-primary-600 border-secondary-300 rounded focus:ring-primary-500"
            />
            <label htmlFor="editIsVegetarian" className="ml-2 text-sm text-secondary-700">
              Vegetarian
            </label>
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowEditItemModal(false);
                resetItemForm();
              }}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Category Modal */}
      <Modal
        isOpen={showCategoryModal}
        onClose={() => {
          setShowCategoryModal(false);
          setCategoryFormData({ id: '', name: '', icon: '' });
        }}
        title="Add New Category"
      >
        <form onSubmit={handleAddCategory} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Category ID *
            </label>
            <input
              type="text"
              value={categoryFormData.id}
              onChange={(e) => setCategoryFormData({ ...categoryFormData, id: e.target.value })}
              className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="e.g., appetizers"
              required
            />
            <p className="text-xs text-secondary-500 mt-1">Lowercase, no spaces</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Category Name *
            </label>
            <input
              type="text"
              value={categoryFormData.name}
              onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
              className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="e.g., Appetizers"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Icon (Emoji) *
            </label>
            <input
              type="text"
              value={categoryFormData.icon}
              onChange={(e) => setCategoryFormData({ ...categoryFormData, icon: e.target.value })}
              className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="e.g., 🥟"
              maxLength="2"
              required
            />
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowCategoryModal(false);
                setCategoryFormData({ id: '', name: '', icon: '' });
              }}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Add Category
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
