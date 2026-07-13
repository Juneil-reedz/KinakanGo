import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Clock, CreditCard, Heart, MapPin, ShoppingBag, Utensils } from 'lucide-react';

export default function Welcome() {
  const navigate = useNavigate();
  const [show, setShow]       = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShow(true), 100);
    return () => clearTimeout(t);
  }, []);

  const handleStart = () => {
    setLoading(true);
    setTimeout(() => navigate('/'), 1200);
  };

  return (
    <div className="fixed inset-0 overflow-hidden flex items-center justify-center bg-[#001207] px-5 py-8">
      <div className="orb w-[28rem] h-[28rem] bg-forest-600/20 top-[-8rem] left-[-10rem]" />
      <div className="orb w-80 h-80 bg-ember-500/10 bottom-[-5rem] right-[-6rem]" />
      <div className="orb w-72 h-72 bg-forest-400/10 bottom-20 left-1/2 -translate-x-1/2" />

      <div className={`relative z-10 max-w-[21rem] w-full mx-auto transition-all duration-1000
        ${loading ? 'opacity-0 scale-95' : show ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
        <div className="flex items-center justify-center gap-5 text-ember-400 mb-5">
          <Utensils className="w-6 h-6" />
          <ShoppingBag className="w-6 h-6" />
          <Heart className="w-6 h-6" />
        </div>

        <div className="text-center mb-7">
          <h1 className="text-2xl font-heading font-black text-white text-glow-green tracking-tight">Tap it. Get it.</h1>
          <p className="text-forest-200 mt-2 text-sm">Bongao Taste</p>
        </div>

        <div className="rounded-[1.7rem] overflow-hidden shadow-2xl border border-ember-300/20 card-3d mb-7 bg-black/20">
          <video
            src={`${import.meta.env.BASE_URL}assets/sidebar-video.mp4`}
            className="w-full h-auto block"
            autoPlay
            loop
            muted
            playsInline
          />
        </div>

        <div className="glass rounded-3xl p-4 grid grid-cols-3 gap-3 text-center mb-5">
          <div className="flex flex-col items-center gap-2">
            <Clock className="w-5 h-5 text-ember-400" />
            <span className="text-forest-100 text-xs">30 min</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <MapPin className="w-5 h-5 text-ember-400" />
            <span className="text-forest-100 text-xs">Track</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <CreditCard className="w-5 h-5 text-ember-400" />
            <span className="text-forest-100 text-xs">Easy Pay</span>
          </div>
        </div>

        <button onClick={handleStart}
          className="w-full py-4 rounded-2xl btn-glow-orange text-white font-heading font-bold text-base flex items-center justify-center gap-2 relative overflow-hidden">
          <span className="relative z-10 flex items-center gap-2">
            {loading ? (
              <>
                <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Opening...
              </>
            ) : (
              <>Get Started <ChevronRight className="w-5 h-5" /></>
            )}
          </span>
        </button>

        <p className="text-center text-forest-200/35 text-xs mt-5">Serving Bongao, Tawi-Tawi</p>
      </div>
    </div>
  );
}
