import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Star, Crown, Zap, ChevronRight, X } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';

const PLANS = [
  {
    id:'free', name:'Basic', price:0, period:'Forever',
    icon:Star, iconClass:'glass',
    color:'from-forest-700 to-forest-800',
    features:['Order food from restaurants','Track your orders','Save favorite restaurants','Basic customer support','Order history'],
    limitations:['Cannot become restaurant owner','Cannot become rider'],
  },
  {
    id:'premium', name:'Premium', price:299, period:'month',
    icon:Crown, iconClass:'btn-glow-orange',
    color:'from-ember-600 to-ember-700',
    popular:true,
    features:['All Basic features','Priority customer support','Exclusive discounts & promos','Free delivery on orders above ₱300','Early access to new restaurants','Apply to become Restaurant Owner','Apply to become Rider','Manage multiple roles','Advanced analytics'],
    limitations:[],
  },
  {
    id:'business', name:'Business Pro', price:999, period:'month',
    icon:Zap, iconClass:'btn-glow-green',
    color:'from-forest-500 to-forest-600',
    features:['All Premium features','24/7 Priority support','Dedicated account manager','Multiple restaurant management','Advanced rider tools','Custom reporting & analytics','API access','Marketing tools','Commission discounts'],
    limitations:[],
  },
];

const FAQS = [
  { q:'Can I cancel anytime?', a:'Yes, cancel anytime. You keep access until the end of your billing period.' },
  { q:'Can I switch plans?', a:'Yes, upgrade or downgrade anytime. Changes take effect on your next billing cycle.' },
  { q:'Is my payment secure?', a:'Yes, all payments are processed through secure encrypted channels.' },
  { q:'Do I need a plan to order food?', a:'No! The Basic (free) plan lets you order food normally. Premium unlocks extra perks.' },
];

export default function AccountUpgrade() {
  const navigate = useNavigate();
  const { showSuccess } = useNotification();
  const [selected, setSelected] = useState(null);
  const [openFaq, setOpenFaq]   = useState(null);

  const handleSubscribe = () => {
    if (!selected) return;
    const plan = PLANS.find(p => p.id === selected);
    if (plan.id === 'free') { showSuccess('You are on the Basic plan!'); return; }
    showSuccess(`Subscribed to ${plan.name}! 🎉`);
    setTimeout(() => navigate('/profile'), 1200);
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-0 animate-fade-up">
      {/* Header */}
      <div className="text-center py-4">
        <div className="w-16 h-16 btn-glow-orange rounded-3xl flex items-center justify-center mx-auto mb-4 animate-breathe">
          <Crown className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-heading font-bold text-white mb-2">Upgrade Your Account</h1>
        <p className="text-forest-200/60 text-sm max-w-md mx-auto">
          Choose a plan that fits your needs. Unlock premium features and grow with KinakanGo.
        </p>
      </div>

      {/* Plans grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {PLANS.map(plan => {
          const Icon = plan.icon;
          const isSel = selected === plan.id;
          return (
            <div key={plan.id} onClick={() => setSelected(plan.id)}
              className={`relative glass card-3d rounded-3xl overflow-hidden cursor-pointer transition-all duration-300
                ${isSel ? 'ring-2 ring-ember-500 scale-[1.02] shadow-[0_0_30px_rgba(230,126,34,.3)]' : 'hover:glass-green'}`}>
              {plan.popular && (
                <div className="absolute top-3 right-3 btn-glow-orange text-white text-xs px-2.5 py-1 rounded-full font-bold">
                  POPULAR
                </div>
              )}

              {/* Plan header */}
              <div className={`bg-gradient-to-br ${plan.color} p-6`}>
                <div className={`w-12 h-12 ${plan.iconClass} rounded-2xl flex items-center justify-center mb-3`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <p className="text-white font-heading font-bold text-xl">{plan.name}</p>
                <div className="flex items-end gap-1 mt-1">
                  <span className="text-white font-heading font-bold text-4xl">₱{plan.price}</span>
                  {plan.price > 0 && <span className="text-white/70 text-sm mb-1">/{plan.period}</span>}
                </div>
                {plan.price === 0 && <p className="text-white/70 text-xs mt-0.5">Free {plan.period}</p>}
              </div>

              {/* Features */}
              <div className="p-5">
                <ul className="space-y-2.5 mb-4">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm">
                      <div className="w-5 h-5 btn-glow-green rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-forest-100/80">{f}</span>
                    </li>
                  ))}
                  {plan.limitations.map((f, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm opacity-40">
                      <div className="w-5 h-5 glass rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <X className="w-3 h-3 text-forest-200" />
                      </div>
                      <span className="text-forest-200/60">{f}</span>
                    </li>
                  ))}
                </ul>

                <div className={`w-full py-2.5 rounded-xl text-sm font-semibold text-center transition-all
                  ${isSel ? 'btn-glow-orange text-white' : 'glass text-forest-200/70'}`}>
                  {isSel ? '✓ Selected' : 'Select Plan'}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* CTA */}
      {selected && (
        <button onClick={handleSubscribe}
          className="w-full py-4 btn-glow-orange text-white font-heading font-bold rounded-2xl flex items-center justify-center gap-2 animate-fade-up">
          {selected === 'free' ? 'Continue with Basic' : `Subscribe to ${PLANS.find(p=>p.id===selected)?.name}`}
          <ChevronRight className="w-5 h-5" />
        </button>
      )}

      {/* FAQ */}
      <div className="glass rounded-2xl p-5">
        <p className="text-white font-semibold mb-4">Frequently Asked Questions</p>
        <div className="space-y-2">
          {FAQS.map((faq, i) => (
            <div key={i} className="glass rounded-xl overflow-hidden">
              <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full px-4 py-3 flex items-center justify-between text-left">
                <span className="text-forest-100 text-sm font-medium">{faq.q}</span>
                <ChevronRight className={`w-4 h-4 text-forest-200/50 flex-shrink-0 transition-transform ${openFaq===i ? 'rotate-90' : ''}`} />
              </button>
              {openFaq === i && (
                <div className="px-4 pb-3">
                  <p className="text-forest-200/60 text-sm">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
