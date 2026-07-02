import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  MessageCircle, Phone, Mail, HelpCircle, ChevronDown, Search,
  Package, CreditCard, Truck, User, DollarSign, BookOpen,
  ThumbsUp, ThumbsDown,
} from 'lucide-react';

const CATEGORY_ICON = {
  all:      BookOpen,
  orders:   Package,
  payment:  CreditCard,
  delivery: Truck,
  account:  User,
  refunds:  DollarSign,
};

const CATEGORIES = [
  { id: 'all',      name: 'All Topics'  },
  { id: 'orders',   name: 'Orders'      },
  { id: 'payment',  name: 'Payment'     },
  { id: 'delivery', name: 'Delivery'    },
  { id: 'account',  name: 'Account'     },
  { id: 'refunds',  name: 'Refunds'     },
];

const FAQS = [
  { id:1,  category:'orders',   question:'How do I place an order?',                    answer:'To place an order: 1) Browse restaurants or search for your favorite food, 2) Add items to your cart, 3) Review your cart and proceed to checkout, 4) Enter your delivery address and payment information, 5) Confirm your order. You\'ll receive a confirmation and can track your order in real-time.' },
  { id:2,  category:'orders',   question:'Can I modify my order after placing it?',     answer:'You can modify your order within 2 minutes of placing it by going to Order Tracking and selecting "Modify Order". After this window, please contact customer support or the restaurant directly to request changes.' },
  { id:3,  category:'orders',   question:'How do I track my order?',                    answer:'You can track your order in real-time by going to "Track Orders" in your profile or clicking on the order in your Order History. You\'ll see the current status and estimated delivery time.' },
  { id:4,  category:'orders',   question:'What if my order is taking too long?',        answer:'Delivery times may vary based on restaurant preparation time and distance. If your order exceeds the estimated time by more than 15 minutes, please contact our support team through the chat feature or call us.' },
  { id:5,  category:'payment',  question:'What payment methods do you accept?',         answer:'We accept all major credit and debit cards (Visa, Mastercard, American Express), digital wallets (PayPal, Apple Pay, Google Pay), and cash on delivery in select areas.' },
  { id:6,  category:'payment',  question:'Is my payment information secure?',           answer:'Yes, absolutely. We use industry-standard encryption and secure payment gateways. Your payment information is never stored on our servers and is processed through PCI-DSS compliant payment processors.' },
  { id:7,  category:'payment',  question:'Why was I charged twice?',                    answer:'If you see two charges, one might be a temporary authorization hold that will be released within 3-5 business days. If both charges remain, please contact our support team with your order number for immediate assistance.' },
  { id:8,  category:'delivery', question:'What are your delivery hours?',               answer:'Our delivery hours vary by restaurant. Most restaurants deliver from 10:00 AM to 11:00 PM. You can see specific hours on each restaurant\'s page. Some 24-hour restaurants are also available.' },
  { id:9,  category:'delivery', question:'How much is the delivery fee?',               answer:'Delivery fees vary based on distance, time of day, and demand. The exact fee is shown before you complete your order. We offer free delivery on orders above ₱500 during promotional periods.' },
  { id:10, category:'delivery', question:'Can I schedule a delivery for later?',        answer:'Yes! During checkout, you can select "Schedule for later" and choose your preferred delivery time. This feature is available for most restaurants up to 7 days in advance.' },
  { id:11, category:'delivery', question:'What if I\'m not home when the order arrives?', answer:'You can add delivery instructions during checkout (e.g., "Leave at door", "Call upon arrival"). You can also contact the delivery driver through the app. For contactless delivery, we offer "Leave at door" option.' },
  { id:12, category:'account',  question:'How do I create an account?',                 answer:'Click on "Register" on the login page. You\'ll need to provide your name, email, phone number, and create a password. You can also sign up using Google or Facebook for faster registration.' },
  { id:13, category:'account',  question:'I forgot my password. What should I do?',    answer:'Click on "Forgot Password" on the login page. Enter your email address and we\'ll send you a password reset link. Follow the instructions in the email to create a new password.' },
  { id:14, category:'account',  question:'How do I update my profile information?',     answer:'Go to your Profile page and click "Edit Profile". You can update your name, email, phone number, and delivery address. Don\'t forget to click "Save" after making changes.' },
  { id:15, category:'account',  question:'How do I delete my account?',                 answer:'To delete your account, go to Settings > Account Settings > Delete Account. Please note this action is permanent and will remove all your order history and saved information.' },
  { id:16, category:'refunds',  question:'What is your refund policy?',                 answer:'We offer full refunds for cancelled orders (before preparation), wrong orders, missing items, or quality issues. Refunds are processed within 5-7 business days to your original payment method.' },
  { id:17, category:'refunds',  question:'How do I request a refund?',                  answer:'Go to your Order History, select the order, and click "Request Refund". Choose the reason and provide details. Our support team will review and process your request within 24-48 hours.' },
  { id:18, category:'refunds',  question:'What if my food arrived damaged or incorrect?', answer:'Please report the issue immediately through the app by going to your order and selecting "Report Issue". Take photos if possible. We\'ll either send a replacement or issue a full refund.' },
  { id:19, category:'orders',   question:'Can I order from multiple restaurants?',      answer:'Currently, you can only order from one restaurant at a time. If you want to order from multiple restaurants, you\'ll need to place separate orders.' },
  { id:20, category:'account',  question:'How do I save my favorite restaurants?',      answer:'Click the heart icon on any restaurant card to add it to your favorites. You can view all your favorite restaurants in the "Favorites" section of your profile.' },
];

const CONTACT = [
  { Icon: MessageCircle, title: 'Live Chat',      description: 'Chat with our support team',    detail: 'Available 24/7',           action: 'Start Chat',  color: 'btn-glow-orange' },
  { Icon: Phone,         title: 'Phone Support',  description: 'Call us for immediate help',    detail: '(555) 123-4567',           action: 'Call Now',    color: 'btn-glow-green'  },
  { Icon: Mail,          title: 'Email Support',  description: 'Send us a detailed message',    detail: 'support@kinakango.com',    action: 'Send Email',  color: 'glass-orange'    },
];

const QUICK_LINKS = [
  { to: '/orders',      Icon: Package,  label: 'My Orders'   },
  { to: '/profile',     Icon: User,     label: 'Profile'     },
  { to: '/settings',    Icon: HelpCircle, label: 'Settings'  },
  { to: '/restaurants', Icon: Truck,    label: 'Restaurants' },
];

export default function CustomerService() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [expandedFaq, setExpandedFaq]       = useState(null);
  const [searchQuery, setSearchQuery]       = useState('');

  const filteredFaqs = FAQS.filter(faq => {
    const matchesCategory = activeCategory === 'all' || faq.category === activeCategory;
    const matchesSearch   = !searchQuery ||
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="container-custom py-8 animate-fade-up">

      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-16 h-16 btn-glow-orange rounded-2xl mb-4">
          <HelpCircle className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-4xl font-heading font-bold text-white mb-3">Help Center</h1>
        <p className="text-forest-200/60 text-lg">Find answers to common questions or contact our support team.</p>
      </div>

      {/* Search */}
      <div className="max-w-2xl mx-auto mb-10">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-forest-300/50" />
          <input
            type="text"
            placeholder="Search for help..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full input-glass pl-12 py-4 text-lg"
          />
        </div>
      </div>

      {/* Contact cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        {CONTACT.map(({ Icon, title, description, detail, action, color }) => (
          <div key={title} className="glass card-3d rounded-2xl p-6 text-center">
            <div className={`inline-flex items-center justify-center w-12 h-12 ${color} rounded-2xl mb-4`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-white font-semibold text-lg mb-1">{title}</h3>
            <p className="text-forest-200/50 text-sm mb-1">{description}</p>
            <p className="text-forest-200/40 text-xs mb-4">{detail}</p>
            <button className="w-full btn-glow-orange text-white text-sm font-semibold py-2.5 rounded-xl">
              {action}
            </button>
          </div>
        ))}
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2 justify-center mb-8">
        {CATEGORIES.map(({ id, name }) => {
          const Icon = CATEGORY_ICON[id];
          return (
            <button
              key={id}
              onClick={() => setActiveCategory(id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all
                ${activeCategory === id ? 'btn-glow-orange text-white' : 'glass text-forest-200/60 hover:text-forest-100'}`}
            >
              <Icon className="w-4 h-4" /> {name}
            </button>
          );
        })}
      </div>

      {/* FAQ list */}
      <div className="max-w-4xl mx-auto">
        <h2 className="text-white font-heading font-bold text-2xl mb-5">
          Frequently Asked Questions
          {searchQuery && <span className="text-ember-400 text-lg ml-2">({filteredFaqs.length} results)</span>}
        </h2>

        {filteredFaqs.length === 0 ? (
          <div className="glass rounded-2xl py-16 flex flex-col items-center gap-4">
            <div className="w-14 h-14 glass rounded-2xl flex items-center justify-center">
              <Search className="w-7 h-7 text-forest-300/40" />
            </div>
            <p className="text-white font-semibold">No results found</p>
            <p className="text-forest-200/50 text-sm">Try adjusting your search or browse by category</p>
            <button
              onClick={() => { setSearchQuery(''); setActiveCategory('all'); }}
              className="btn-glow-orange text-white text-sm font-semibold px-5 py-2.5 rounded-xl"
            >
              Clear Search
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredFaqs.map(faq => {
              const CatIcon = CATEGORY_ICON[faq.category];
              const isOpen  = expandedFaq === faq.id;
              return (
                <div
                  key={faq.id}
                  onClick={() => setExpandedFaq(isOpen ? null : faq.id)}
                  className={`glass rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 ${isOpen ? 'ring-1 ring-ember-500/40' : 'hover:ring-1 hover:ring-forest-400/20'}`}
                >
                  <div className="p-5 flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${isOpen ? 'btn-glow-orange' : 'glass'}`}>
                      <CatIcon className={`w-5 h-5 ${isOpen ? 'text-white' : 'text-forest-300/60'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-semibold text-base transition-colors ${isOpen ? 'text-ember-300' : 'text-white'}`}>
                        {faq.question}
                      </h3>
                      <div className={`overflow-hidden transition-all duration-500 ${isOpen ? 'max-h-96 opacity-100 mt-3' : 'max-h-0 opacity-0'}`}>
                        <div className="glass-green rounded-xl p-4" style={{ borderLeft: '3px solid rgba(34,197,94,.4)' }}>
                          <p className="text-forest-100/80 text-sm leading-relaxed">{faq.answer}</p>
                        </div>
                        <div className="flex items-center gap-3 mt-3 flex-wrap">
                          <span className="glass text-forest-200/60 text-xs px-3 py-1 rounded-full capitalize">
                            {CATEGORIES.find(c => c.id === faq.category)?.name}
                          </span>
                          <span className="text-forest-200/30 text-xs">Was this helpful?</span>
                          <button className="flex items-center gap-1 glass hover:glass-green transition-all text-forest-200/60 hover:text-forest-100 text-xs px-2.5 py-1 rounded-lg">
                            <ThumbsUp className="w-3.5 h-3.5" /> Yes
                          </button>
                          <button className="flex items-center gap-1 glass hover:bg-red-500/20 transition-all text-forest-200/60 hover:text-red-300 text-xs px-2.5 py-1 rounded-lg">
                            <ThumbsDown className="w-3.5 h-3.5" /> No
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${isOpen ? 'btn-glow-orange' : 'glass'}`}>
                      <ChevronDown className={`w-4 h-4 text-white transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Still need help */}
      <div className="max-w-4xl mx-auto mt-10">
        <div className="glass-green rounded-2xl p-8 text-center">
          <h3 className="text-white font-heading font-bold text-2xl mb-2">Still need help?</h3>
          <p className="text-forest-200/60 mb-6">Our support team is available 24/7 to assist you with any questions or concerns.</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <button className="btn-glow-orange text-white font-semibold px-6 py-3 rounded-xl text-sm">
              Contact Support
            </button>
            <Link to="/messages">
              <button className="glass text-forest-100/80 hover:text-white font-semibold px-6 py-3 rounded-xl text-sm transition-all hover:glass-green">
                View Messages
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div className="max-w-4xl mx-auto mt-8">
        <h3 className="text-white font-semibold text-lg mb-4 text-center">Quick Links</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {QUICK_LINKS.map(({ to, Icon, label }) => (
            <Link key={to} to={to}
              className="glass card-3d rounded-2xl p-4 text-center hover:glass-orange transition-all group">
              <div className="w-10 h-10 btn-glow-orange rounded-xl flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                <Icon className="w-5 h-5 text-white" />
              </div>
              <p className="text-forest-100/80 text-sm font-medium group-hover:text-white transition-colors">{label}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
