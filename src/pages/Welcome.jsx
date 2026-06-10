import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Utensils, Truck, Star, Zap } from 'lucide-react';

const PHRASES = ['Tap it.', 'Get it.', 'Love it.'];

export default function Welcome() {
  const navigate = useNavigate();
  const [show, setShow]       = useState(false);
  const [phrase, setPhrase]   = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShow(true), 100);
    const i = setInterval(() => setPhrase(p => (p+1) % PHRASES.length), 2200);
    return () => { clearTimeout(t); clearInterval(i); };
  }, []);

  const handleStart = () => {
    setLoading(true);
    setTimeout(() => navigate('/'), 1200);
  };

  return (
    <div className="fixed inset-0 overflow-hidden flex items-center justify-center">
      {/* Ambient orbs */}
      <div className="orb w-[500px] h-[500px] bg-forest-600/25 top-[-15%] left-[-10%]" />
      <div className="orb w-96 h-96 bg-ember-500/15 bottom-[-10%] right-[-5%]" />
      <div className="orb w-64 h-64 bg-forest-400/10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />

      {/* Rotating ring */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10">
        <div className="w-[600px] h-[600px] rounded-full border-2 border-forest-300 animate-spin-slow" />
        <div className="absolute w-[450px] h-[450px] rounded-full border border-ember-400" style={{animationDirection:'reverse',animation:'spin-slow 8s linear infinite'}} />
      </div>

      <div className={`relative z-10 max-w-sm w-full mx-auto px-6 transition-all duration-1000
        ${loading ? 'opacity-0 scale-95' : show ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative mb-4">
            <div className="w-24 h-24 btn-glow-green rounded-3xl flex items-center justify-center shadow-2xl animate-breathe">
              <Utensils className="w-12 h-12 text-white" />
            </div>
            {/* Pulse rings */}
            <div className="absolute inset-0 rounded-3xl animate-pulse-ring" style={{background:'rgba(45,138,87,.4)'}} />
            <div className="absolute inset-0 rounded-3xl animate-pulse-ring" style={{background:'rgba(45,138,87,.2)',animationDelay:'.6s'}} />
          </div>

          <h1 className="text-4xl font-heading font-bold text-white text-glow-green tracking-tight">
            KinakanGo
          </h1>
          <p className="text-forest-200 mt-1 text-sm tracking-widest uppercase">Bongao Taste</p>
        </div>

        {/* Animated phrase */}
        <div className="glass rounded-2xl px-6 py-5 mb-6 text-center card-3d">
          <p className="text-3xl font-heading font-bold text-white text-glow-orange mb-1 transition-all duration-500">
            {PHRASES[phrase]}
          </p>
          <p className="text-forest-200/70 text-sm">Food delivery for Bongao, Tawi-Tawi</p>
        </div>

        {/* Feature pills */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { icon: Truck, label: 'Fast Delivery', color: 'text-ember-400' },
            { icon: Star,  label: 'Top Rated',     color: 'text-forest-300' },
            { icon: Zap,   label: 'Easy Order',    color: 'text-ember-300' },
          ].map(({ icon: Icon, label, color }) => (
            <div key={label} className="glass rounded-xl p-3 flex flex-col items-center gap-1.5 card-3d">
              <Icon className={`w-5 h-5 ${color}`} />
              <span className="text-forest-100/70 text-xs text-center leading-tight">{label}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <button onClick={handleStart}
          className="w-full py-4 rounded-2xl btn-glow-orange text-white font-heading font-bold text-lg flex items-center justify-center gap-2 relative overflow-hidden">
          <span className="relative z-10 flex items-center gap-2">
            {loading ? (
              <>
                <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Loading…
              </>
            ) : (
              <>Get Started <ChevronRight className="w-5 h-5" /></>
            )}
          </span>
        </button>

        <div className="flex items-center gap-3 mt-4">
          <button onClick={() => navigate('/login')}
            className="flex-1 py-3 rounded-2xl glass text-forest-100 font-semibold text-sm hover:glass-green transition-all text-center">
            Sign In
          </button>
          <button onClick={() => navigate('/register')}
            className="flex-1 py-3 rounded-2xl glass text-forest-100 font-semibold text-sm hover:glass-green transition-all text-center">
            Register
          </button>
        </div>

        <p className="text-center text-forest-200/40 text-xs mt-6">
          Serving Bongao, Tawi-Tawi 🇵🇭
        </p>
      </div>
    </div>
  );
}
