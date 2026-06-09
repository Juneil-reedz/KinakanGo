import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, Phone, Mail, HelpCircle, ChevronDown, ChevronUp, Search } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';

export default function CustomerService() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    { id: 'all', name: 'All Topics', icon: '📚' },
    { id: 'orders', name: 'Orders', icon: '📦' },
    { id: 'payment', name: 'Payment', icon: '💳' },
    { id: 'delivery', name: 'Delivery', icon: '🚚' },
    { id: 'account', name: 'Account', icon: '👤' },
    { id: 'refunds', name: 'Refunds', icon: '💰' },
  ];

  const faqs = [
    {
      id: 1,
      category: 'orders',
      question: 'How do I place an order?',
      answer: 'To place an order: 1) Browse restaurants or search for your favorite food, 2) Add items to your cart, 3) Review your cart and proceed to checkout, 4) Enter your delivery address and payment information, 5) Confirm your order. You\'ll receive a confirmation and can track your order in real-time.'
    },
    {
      id: 2,
      category: 'orders',
      question: 'Can I modify my order after placing it?',
      answer: 'You can modify your order within 2 minutes of placing it by going to Order Tracking and selecting "Modify Order". After this window, please contact customer support or the restaurant directly to request changes.'
    },
    {
      id: 3,
      category: 'orders',
      question: 'How do I track my order?',
      answer: 'You can track your order in real-time by going to "Track Orders" in your profile or clicking on the order in your Order History. You\'ll see the current status and estimated delivery time.'
    },
    {
      id: 4,
      category: 'orders',
      question: 'What if my order is taking too long?',
      answer: 'Delivery times may vary based on restaurant preparation time and distance. If your order exceeds the estimated time by more than 15 minutes, please contact our support team through the chat feature or call us.'
    },
    {
      id: 5,
      category: 'payment',
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit and debit cards (Visa, Mastercard, American Express), digital wallets (PayPal, Apple Pay, Google Pay), and cash on delivery in select areas.'
    },
    {
      id: 6,
      category: 'payment',
      question: 'Is my payment information secure?',
      answer: 'Yes, absolutely. We use industry-standard encryption and secure payment gateways. Your payment information is never stored on our servers and is processed through PCI-DSS compliant payment processors.'
    },
    {
      id: 7,
      category: 'payment',
      question: 'Why was I charged twice?',
      answer: 'If you see two charges, one might be a temporary authorization hold that will be released within 3-5 business days. If both charges remain, please contact our support team with your order number for immediate assistance.'
    },
    {
      id: 8,
      category: 'delivery',
      question: 'What are your delivery hours?',
      answer: 'Our delivery hours vary by restaurant. Most restaurants deliver from 10:00 AM to 11:00 PM. You can see specific hours on each restaurant\'s page. Some 24-hour restaurants are also available.'
    },
    {
      id: 9,
      category: 'delivery',
      question: 'How much is the delivery fee?',
      answer: 'Delivery fees vary based on distance, time of day, and demand. The exact fee is shown before you complete your order. We offer free delivery on orders above ₱500 during promotional periods.'
    },
    {
      id: 10,
      category: 'delivery',
      question: 'Can I schedule a delivery for later?',
      answer: 'Yes! During checkout, you can select "Schedule for later" and choose your preferred delivery time. This feature is available for most restaurants up to 7 days in advance.'
    },
    {
      id: 11,
      category: 'delivery',
      question: 'What if I\'m not home when the order arrives?',
      answer: 'You can add delivery instructions during checkout (e.g., "Leave at door", "Call upon arrival"). You can also contact the delivery driver through the app. For contactless delivery, we offer "Leave at door" option.'
    },
    {
      id: 12,
      category: 'account',
      question: 'How do I create an account?',
      answer: 'Click on "Register" on the login page. You\'ll need to provide your name, email, phone number, and create a password. You can also sign up using Google or Facebook for faster registration.'
    },
    {
      id: 13,
      category: 'account',
      question: 'I forgot my password. What should I do?',
      answer: 'Click on "Forgot Password" on the login page. Enter your email address and we\'ll send you a password reset link. Follow the instructions in the email to create a new password.'
    },
    {
      id: 14,
      category: 'account',
      question: 'How do I update my profile information?',
      answer: 'Go to your Profile page and click "Edit Profile". You can update your name, email, phone number, and delivery address. Don\'t forget to click "Save" after making changes.'
    },
    {
      id: 15,
      category: 'account',
      question: 'How do I delete my account?',
      answer: 'To delete your account, go to Settings > Account Settings > Delete Account. Please note this action is permanent and will remove all your order history and saved information.'
    },
    {
      id: 16,
      category: 'refunds',
      question: 'What is your refund policy?',
      answer: 'We offer full refunds for cancelled orders (before preparation), wrong orders, missing items, or quality issues. Refunds are processed within 5-7 business days to your original payment method.'
    },
    {
      id: 17,
      category: 'refunds',
      question: 'How do I request a refund?',
      answer: 'Go to your Order History, select the order, and click "Request Refund". Choose the reason and provide details. Our support team will review and process your request within 24-48 hours.'
    },
    {
      id: 18,
      category: 'refunds',
      question: 'What if my food arrived damaged or incorrect?',
      answer: 'Please report the issue immediately through the app by going to your order and selecting "Report Issue". Take photos if possible. We\'ll either send a replacement or issue a full refund.'
    },
    {
      id: 19,
      category: 'orders',
      question: 'Can I order from multiple restaurants?',
      answer: 'Currently, you can only order from one restaurant at a time. If you want to order from multiple restaurants, you\'ll need to place separate orders.'
    },
    {
      id: 20,
      category: 'account',
      question: 'How do I save my favorite restaurants?',
      answer: 'Click the heart icon on any restaurant card to add it to your favorites. You can view all your favorite restaurants in the "Favorites" section of your profile.'
    }
  ];

  const contactMethods = [
    {
      icon: <MessageCircle className="w-6 h-6" />,
      title: 'Live Chat',
      description: 'Chat with our support team',
      availability: 'Available 24/7',
      action: 'Start Chat',
      color: 'bg-blue-500'
    },
    {
      icon: <Phone className="w-6 h-6" />,
      title: 'Phone Support',
      description: 'Call us for immediate help',
      availability: '(555) 123-4567',
      action: 'Call Now',
      color: 'bg-green-500'
    },
    {
      icon: <Mail className="w-6 h-6" />,
      title: 'Email Support',
      description: 'Send us a detailed message',
      availability: 'support@kinakango.com',
      action: 'Send Email',
      color: 'bg-orange-500'
    }
  ];

  const filteredFaqs = faqs.filter(faq => {
    const matchesCategory = activeCategory === 'all' || faq.category === activeCategory;
    const matchesSearch = searchQuery === '' ||
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const toggleFaq = (id) => {
    setExpandedFaq(expandedFaq === id ? null : id);
  };

  return (
    <div className="container-custom py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
          <HelpCircle className="w-8 h-8 text-primary-600" />
        </div>
        <h1 className="text-4xl font-heading font-bold mb-3">Customer Service & Help Center</h1>
        <p className="text-lg text-secondary-600">
          We're here to help! Find answers to common questions or contact our support team.
        </p>
      </div>

      {/* Search Bar */}
      <div className="max-w-2xl mx-auto mb-12">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-secondary-400" />
          <input
            type="text"
            placeholder="Search for help..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 border-2 border-secondary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-lg"
          />
        </div>
      </div>

      {/* Contact Methods */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {contactMethods.map((method, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <div className="text-center">
              <div className={`inline-flex items-center justify-center w-12 h-12 ${method.color} rounded-full text-white mb-4`}>
                {method.icon}
              </div>
              <h3 className="text-xl font-semibold mb-2">{method.title}</h3>
              <p className="text-secondary-600 mb-2">{method.description}</p>
              <p className="text-sm text-secondary-500 mb-4">{method.availability}</p>
              <Button variant="outline" className="w-full">
                {method.action}
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Category Tabs */}
      <div className="mb-8">
        <div className="flex flex-wrap gap-3 justify-center">
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`px-6 py-3 rounded-xl font-medium transition-all ${
                activeCategory === category.id
                  ? 'bg-primary-600 text-white shadow-md'
                  : 'bg-white text-secondary-700 border border-secondary-200 hover:border-primary-300'
              }`}
            >
              <span className="mr-2">{category.icon}</span>
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* FAQs */}
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold mb-6">
          Frequently Asked Questions
          {searchQuery && ` (${filteredFaqs.length} results)`}
        </h2>

        {filteredFaqs.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold mb-2">No results found</h3>
              <p className="text-secondary-600 mb-6">
                Try adjusting your search or browse by category
              </p>
              <Button onClick={() => { setSearchQuery(''); setActiveCategory('all'); }}>
                Clear Search
              </Button>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredFaqs.map(faq => (
              <div
                key={faq.id}
                className={`bg-white rounded-2xl border-2 overflow-hidden cursor-pointer transition-all duration-300 ${
                  expandedFaq === faq.id
                    ? 'border-primary-500 shadow-lg scale-[1.02]'
                    : 'border-secondary-200 hover:border-primary-300 hover:shadow-md'
                }`}
                onClick={() => toggleFaq(faq.id)}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 flex items-start gap-4">
                      {/* Icon based on category */}
                      <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
                        expandedFaq === faq.id
                          ? 'bg-primary-500 text-white scale-110'
                          : 'bg-primary-100 text-primary-600'
                      }`}>
                        <span className="text-2xl">
                          {faq.category === 'orders' && '📦'}
                          {faq.category === 'payment' && '💳'}
                          {faq.category === 'delivery' && '🚚'}
                          {faq.category === 'account' && '👤'}
                          {faq.category === 'refunds' && '💰'}
                        </span>
                      </div>
                      <div className="flex-1">
                        <h3 className={`font-bold text-lg mb-2 transition-colors ${
                          expandedFaq === faq.id ? 'text-primary-600' : 'text-gray-900'
                        }`}>
                          {faq.question}
                        </h3>
                        <div
                          className={`overflow-hidden transition-all duration-500 ease-in-out ${
                            expandedFaq === faq.id
                              ? 'max-h-96 opacity-100 mt-4'
                              : 'max-h-0 opacity-0'
                          }`}
                        >
                          <div className="bg-gradient-to-r from-primary-50 to-white p-4 rounded-xl border-l-4 border-primary-500">
                            <p className="text-secondary-700 leading-relaxed">
                              {faq.answer}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                        expandedFaq === faq.id
                          ? 'bg-primary-500 text-white rotate-180'
                          : 'bg-secondary-100 text-secondary-600'
                      }`}>
                        <ChevronDown className="w-6 h-6" />
                      </div>
                    </div>
                  </div>
                </div>
                {expandedFaq === faq.id && (
                  <div className="px-6 pb-6 pt-0">
                    <div className="flex items-center gap-2 text-sm text-secondary-600">
                      <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full font-medium">
                        {categories.find(c => c.id === faq.category)?.name}
                      </span>
                      <span className="text-secondary-400">•</span>
                      <span>Was this helpful?</span>
                      <button className="ml-2 px-3 py-1 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors">
                        👍 Yes
                      </button>
                      <button className="px-3 py-1 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors">
                        👎 No
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Additional Help Section */}
      <div className="max-w-4xl mx-auto mt-12">
        <Card className="bg-gradient-to-r from-primary-50 to-primary-100">
          <div className="text-center py-8">
            <h3 className="text-2xl font-bold mb-3">Still need help?</h3>
            <p className="text-secondary-700 mb-6">
              Our support team is available 24/7 to assist you with any questions or concerns.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button size="lg" variant="primary">
                Contact Support
              </Button>
              <Link to="/messages">
                <Button size="lg" variant="outline">
                  View Messages
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Links */}
      <div className="max-w-4xl mx-auto mt-8">
        <h3 className="text-xl font-semibold mb-4 text-center">Quick Links</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link to="/orders" className="text-center p-4 bg-white rounded-xl border border-secondary-200 hover:border-primary-300 hover:shadow-md transition-all">
            <div className="text-3xl mb-2">📦</div>
            <p className="font-medium">My Orders</p>
          </Link>
          <Link to="/profile" className="text-center p-4 bg-white rounded-xl border border-secondary-200 hover:border-primary-300 hover:shadow-md transition-all">
            <div className="text-3xl mb-2">👤</div>
            <p className="font-medium">Profile</p>
          </Link>
          <Link to="/settings" className="text-center p-4 bg-white rounded-xl border border-secondary-200 hover:border-primary-300 hover:shadow-md transition-all">
            <div className="text-3xl mb-2">⚙️</div>
            <p className="font-medium">Settings</p>
          </Link>
          <Link to="/restaurants" className="text-center p-4 bg-white rounded-xl border border-secondary-200 hover:border-primary-300 hover:shadow-md transition-all">
            <div className="text-3xl mb-2">🍽️</div>
            <p className="font-medium">Restaurants</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
