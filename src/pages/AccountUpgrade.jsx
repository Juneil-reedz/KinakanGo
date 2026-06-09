import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Star, Crown, Zap, Store, Bike } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import { useNotification } from '../context/NotificationContext';

export default function AccountUpgrade() {
  const navigate = useNavigate();
  const { showSuccess } = useNotification();
  const [selectedPlan, setSelectedPlan] = useState(null);

  const plans = [
    {
      id: 'free',
      name: 'Basic',
      price: 0,
      period: 'Forever',
      icon: <Star className="w-8 h-8" />,
      color: 'from-gray-400 to-gray-600',
      features: [
        'Order food from restaurants',
        'Track your orders',
        'Save favorite restaurants',
        'Basic customer support',
        'Order history',
      ],
      limitations: [
        'Cannot become restaurant owner',
        'Cannot become rider',
      ]
    },
    {
      id: 'premium',
      name: 'Premium',
      price: 299,
      period: 'month',
      icon: <Crown className="w-8 h-8" />,
      color: 'from-orange-400 to-orange-600',
      popular: true,
      features: [
        'All Basic features',
        'Priority customer support',
        'Exclusive discounts & promos',
        'Free delivery on orders above ₱300',
        'Early access to new restaurants',
        'Apply to become Restaurant Owner',
        'Apply to become Rider',
        'Manage multiple roles in one account',
        'Advanced analytics dashboard',
      ],
      limitations: []
    },
    {
      id: 'business',
      name: 'Business Pro',
      price: 999,
      period: 'month',
      icon: <Zap className="w-8 h-8" />,
      color: 'from-purple-400 to-purple-600',
      features: [
        'All Premium features',
        '24/7 Priority support',
        'Dedicated account manager',
        'Multiple restaurant management',
        'Advanced rider tools',
        'Custom reporting & analytics',
        'API access for integrations',
        'Marketing tools & promotions',
        'Commission rate discounts',
      ],
      limitations: []
    }
  ];

  const handleSelectPlan = (planId) => {
    setSelectedPlan(planId);
  };

  const handleSubscribe = () => {
    if (!selectedPlan) {
      return;
    }

    const plan = plans.find(p => p.id === selectedPlan);

    if (plan.id === 'free') {
      showSuccess('You are already on the Basic plan!');
      return;
    }

    showSuccess(`Successfully subscribed to ${plan.name} plan!`);
    // Navigate to profile or payment page
    setTimeout(() => {
      navigate('/profile');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-orange-50 py-12">
      <div className="container-custom">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-500 to-orange-500 rounded-full mb-4">
            <Crown className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-heading font-bold mb-3">Upgrade Your Account</h1>
          <p className="text-lg text-secondary-600 max-w-2xl mx-auto">
            Choose a plan that fits your needs. Unlock premium features and grow your business with Kinakan Go.
          </p>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-white rounded-3xl shadow-lg overflow-hidden transition-all duration-300 ${
                selectedPlan === plan.id
                  ? 'ring-4 ring-primary-500 scale-105'
                  : 'hover:shadow-xl hover:scale-102'
              }`}
            >
              {plan.popular && (
                <div className="absolute top-0 right-0 bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-1 text-sm font-bold rounded-bl-lg">
                  MOST POPULAR
                </div>
              )}

              <div className={`bg-gradient-to-br ${plan.color} p-8 text-white`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                    {plan.icon}
                  </div>
                </div>
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <div className="flex items-end gap-2 mb-1">
                  <span className="text-5xl font-bold">₱{plan.price}</span>
                  {plan.price > 0 && <span className="text-xl mb-2">/{plan.period}</span>}
                </div>
                {plan.price === 0 && (
                  <p className="text-white/80 text-sm">Free {plan.period}</p>
                )}
              </div>

              <div className="p-8">
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                        <Check className="w-4 h-4 text-green-600" />
                      </div>
                      <span className="text-secondary-700">{feature}</span>
                    </li>
                  ))}
                  {plan.limitations.map((limitation, index) => (
                    <li key={index} className="flex items-start gap-3 opacity-50">
                      <div className="flex-shrink-0 w-6 h-6 bg-red-100 rounded-full flex items-center justify-center mt-0.5">
                        <span className="text-red-600 text-sm">✕</span>
                      </div>
                      <span className="text-secondary-600 line-through">{limitation}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => handleSelectPlan(plan.id)}
                  variant={selectedPlan === plan.id ? 'primary' : 'outline'}
                  className="w-full"
                  size="lg"
                >
                  {selectedPlan === plan.id ? 'Selected' : 'Select Plan'}
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Subscribe Button */}
        {selectedPlan && selectedPlan !== 'free' && (
          <div className="max-w-2xl mx-auto">
            <Card className="bg-gradient-to-r from-primary-500 to-orange-500 text-white">
              <div className="text-center py-6">
                <h3 className="text-2xl font-bold mb-3">
                  Ready to upgrade to {plans.find(p => p.id === selectedPlan)?.name}?
                </h3>
                <p className="text-white/90 mb-6">
                  You'll get instant access to all premium features and can apply to become a restaurant owner or rider.
                </p>
                <Button
                  onClick={handleSubscribe}
                  variant="outline"
                  size="lg"
                  className="bg-white text-primary-600 hover:bg-gray-100 border-white"
                >
                  Subscribe Now - ₱{plans.find(p => p.id === selectedPlan)?.price}/{plans.find(p => p.id === selectedPlan)?.period}
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Business Opportunities Section */}
        <div className="mt-16">
          <h2 className="text-3xl font-bold text-center mb-8">Business Opportunities</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Restaurant Owner */}
            <Card className="bg-gradient-to-br from-orange-50 to-white border-2 border-orange-200">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full mb-4">
                  <Store className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Become a Restaurant Owner</h3>
                <p className="text-secondary-600 mb-6">
                  List your restaurant on Kinakan Go and reach thousands of hungry customers. Manage orders, menu, and analytics from one dashboard.
                </p>
                <div className="bg-white rounded-xl p-4 mb-6 text-left">
                  <h4 className="font-semibold mb-3">Requirements:</h4>
                  <ul className="space-y-2 text-sm text-secondary-700">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-600" />
                      Premium or Business Pro subscription
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-600" />
                      Valid BIR Certificate of Registration
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-600" />
                      Business Permit
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-600" />
                      Food Safety Permit
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-600" />
                      Restaurant Photos & Menu
                    </li>
                  </ul>
                </div>
                <Button
                  onClick={() => navigate('/apply/restaurant-owner')}
                  variant="primary"
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600"
                  size="lg"
                  disabled={!selectedPlan || selectedPlan === 'free'}
                >
                  {!selectedPlan || selectedPlan === 'free' ? 'Requires Premium Plan' : 'Apply Now'}
                </Button>
              </div>
            </Card>

            {/* Rider */}
            <Card className="bg-gradient-to-br from-blue-50 to-white border-2 border-blue-200">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full mb-4">
                  <Bike className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Become a Rider</h3>
                <p className="text-secondary-600 mb-6">
                  Earn money on your own schedule. Deliver food to customers and get paid for every delivery. Flexible hours, great earnings.
                </p>
                <div className="bg-white rounded-xl p-4 mb-6 text-left">
                  <h4 className="font-semibold mb-3">Requirements:</h4>
                  <ul className="space-y-2 text-sm text-secondary-700">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-600" />
                      Premium or Business Pro subscription
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-600" />
                      Valid Driver's License
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-600" />
                      Vehicle Registration (OR/CR)
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-600" />
                      NBI or Police Clearance
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-600" />
                      Valid ID & Proof of Address
                    </li>
                  </ul>
                </div>
                <Button
                  onClick={() => navigate('/apply/rider')}
                  variant="primary"
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600"
                  size="lg"
                  disabled={!selectedPlan || selectedPlan === 'free'}
                >
                  {!selectedPlan || selectedPlan === 'free' ? 'Requires Premium Plan' : 'Apply Now'}
                </Button>
              </div>
            </Card>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-16 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <Card>
              <h3 className="font-semibold mb-2">Can I cancel my subscription anytime?</h3>
              <p className="text-secondary-600">
                Yes, you can cancel your subscription at any time. You'll continue to have access to premium features until the end of your billing period.
              </p>
            </Card>
            <Card>
              <h3 className="font-semibold mb-2">What happens if my application is rejected?</h3>
              <p className="text-secondary-600">
                If your application is rejected, you can reapply after addressing the issues mentioned in the rejection notice. Your subscription will remain active.
              </p>
            </Card>
            <Card>
              <h3 className="font-semibold mb-2">Can I be both a restaurant owner and a rider?</h3>
              <p className="text-secondary-600">
                Yes! With a Premium or Business Pro subscription, you can have multiple roles and switch between them seamlessly in your account.
              </p>
            </Card>
            <Card>
              <h3 className="font-semibold mb-2">How long does application verification take?</h3>
              <p className="text-secondary-600">
                Application verification typically takes 2-5 business days. You'll receive email notifications about your application status.
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
