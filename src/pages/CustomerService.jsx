import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  MessageCircle, HelpCircle, ChevronDown, Search,
  Package, CreditCard, Truck, User, DollarSign, BookOpen,
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
  { id:1,  category:'orders',   question:'How do I place an order?',                    answer:'Open Food Order, add food from one restaurant to your cart, then check out. Enter your delivery address, choose Cash on Delivery or GCash, and confirm with the 6-digit code we email you.' },
  { id:2,  category:'orders',   question:'Can I cancel my order?',                      answer:'Yes, while the restaurant hasn\'t accepted it yet. Go to Profile → Order History, open the order and tap "Cancel order". Once the restaurant accepts it, the order can\'t be cancelled from the app; use "Report a problem" on the order instead.' },
  { id:3,  category:'orders',   question:'How do I track my order?',                    answer:'Tap Orders (the clock icon) to see your active order\'s status and, once a rider picks it up, where the rider is.' },
  { id:4,  category:'orders',   question:'Can I order from more than one restaurant?',  answer:'One restaurant per order. To order from another restaurant, place a separate order.' },
  { id:5,  category:'payment',  question:'How can I pay?',                              answer:'Cash on Delivery (pay the rider) or GCash. For GCash, send the payment to the restaurant\'s GCash number shown at checkout and upload a screenshot of the payment.' },
  { id:6,  category:'payment',  question:'How do promo codes work?',                    answer:'Enter the code in your cart. The discount comes off the food total (not the delivery fee). Some codes are only for certain restaurants, for first orders, or have a maximum discount.' },
  { id:7,  category:'delivery', question:'How much is the delivery fee?',               answer:'Each restaurant sets its own delivery fee. It is shown in your cart and at checkout before you confirm.' },
  { id:8,  category:'delivery', question:'What if I\'m not home when the order arrives?', answer:'Add instructions in the delivery address notes at checkout. The rider can see your phone number to contact you.' },
  { id:9,  category:'account',  question:'I forgot my password. What should I do?',    answer:'Tap "Forgot password" on the login page and enter your email. We\'ll email you a 6-digit code to set a new password.' },
  { id:10, category:'account',  question:'How do I update my profile?',                 answer:'Go to Profile, edit your name, phone or photo, and save. Manage delivery addresses under Addresses.' },
  { id:11, category:'account',  question:'How do I become a rider or restaurant owner?', answer:'Open the Upgrade page from the menu and apply. An admin reviews your application and you\'ll get a notification when it\'s approved.' },
  { id:12, category:'refunds',  question:'How do I report a problem or ask for a refund?', answer:'Go to Profile → Order History, open the order and tap "Report a problem". Choose what went wrong, describe it, and tick "Ask for a refund" if you want your money back. The restaurant reviews it and, if it approves a refund, sends the money back to you (GCash or cash) and tells you how. Tap "I got it" on the order page once it arrives. Delivery problems go to KinakanGo instead.' },
  { id:16, category:'refunds',  question:'What is store credit?', answer:'When you ask for a refund you can choose store credit instead of GCash or cash. Once the refund is approved, the amount is added to your credit at that restaurant right away. Your cart shows your credit, and at checkout you can use it to pay part or all of your next order there. If that order is cancelled, the credit comes back.' },
  { id:15, category:'refunds',  question:'What if the restaurant declines or doesn\'t answer?', answer:'Open the order and tap "Ask KinakanGo to review". You can do this if the restaurant declines your report, doesn\'t answer within a day, or the refund never arrives. KinakanGo then decides, and if a refund is approved the restaurant is told to send it.' },
  { id:13, category:'refunds',  question:'What if my food arrived wrong or damaged?',   answer:'Report it from the order page ("Report a problem") as soon as you can and explain what was wrong. The restaurant reviews it first, and you can ask KinakanGo to review if you disagree.' },
  { id:14, category:'account',  question:'How do I save my favorite food?',             answer:'Tap the heart on any food. You\'ll find it again under Favorites.' },
];

const CONTACT = [
  { Icon: Package,       title: 'Problem with an order', description: 'Report it or ask for a refund from the order page', to: '/profile', state: { tab: 'orders' }, action: 'Open Order History', color: 'btn-glow-orange' },
  { Icon: MessageCircle, title: 'Message a restaurant',  description: 'Ask the restaurant directly about your food',     to: '/messages', action: 'Open Messages', color: 'btn-glow-green' },
  { Icon: Truck,         title: 'Where is my order?',    description: 'See your order status and rider location',        to: '/orders',   action: 'Track Order',   color: 'glass-orange' },
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
        <p className="text-forest-200/60 text-lg">Find answers to common questions, or report a problem with an order.</p>
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
        {CONTACT.map(({ Icon, title, description, to, state, action, color }) => (
          <div key={title} className="glass card-3d rounded-2xl p-6 text-center">
            <div className={`inline-flex items-center justify-center w-12 h-12 ${color} rounded-2xl mb-4`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-white font-semibold text-lg mb-1">{title}</h3>
            <p className="text-forest-200/50 text-sm mb-4">{description}</p>
            <Link to={to} state={state} className="block w-full btn-glow-orange text-white text-sm font-semibold py-2.5 rounded-xl">
              {action}
            </Link>
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
          <p className="text-forest-200/60 mb-6">Open the order in your Order History and tap "Report a problem". The restaurant reviews it and you'll get a notification with the answer. If you disagree, you can ask KinakanGo to review.</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link to="/profile" state={{ tab: 'orders' }} className="btn-glow-orange text-white font-semibold px-6 py-3 rounded-xl text-sm">
              Report a problem
            </Link>
            <Link to="/messages" className="glass text-forest-100/80 hover:text-white font-semibold px-6 py-3 rounded-xl text-sm transition-all hover:glass-green">
              View Messages
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
