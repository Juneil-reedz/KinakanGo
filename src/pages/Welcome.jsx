import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Welcome() {
  const navigate = useNavigate();
  const [show, setShow] = useState(false);
  const [textIndex, setTextIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const phrases = ['Tap it.', 'Get it.', 'Bongao Taste.'];

  useEffect(() => {
    // Trigger animation
    setShow(true);
  }, []);

  useEffect(() => {
    // Rotate through phrases
    const interval = setInterval(() => {
      setTextIndex((prev) => (prev + 1) % phrases.length);
    }, 2000); // Change every 2 seconds

    return () => clearInterval(interval);
  }, []);

  const handleGetStarted = () => {
    setLoading(true);
    setTimeout(() => {
      navigate('/');
    }, 1500); // Show loading for 1.5 seconds before navigating
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 flex items-center justify-center overflow-hidden">
      {/* Phone Mockup Container */}
      <div className={`relative z-10 transition-all duration-1000 ${
        loading
          ? 'opacity-0 -translate-x-full'
          : show
            ? 'opacity-100 scale-100 translate-x-0'
            : 'opacity-0 scale-75'
      }`}>
        {/* Phone Frame */}
        <div className="relative w-80 h-[600px] bg-gray-900 rounded-[3rem] shadow-2xl border-8 border-gray-800 overflow-hidden">
          {/* Phone Notch */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-7 bg-gray-900 rounded-b-3xl z-20"></div>

          {/* Phone Screen */}
          <div className="absolute inset-2 bg-gradient-to-br from-primary-500 to-primary-700 rounded-[2.5rem] overflow-hidden">
            <div className="w-full h-full flex flex-col items-center justify-center relative">
              {/* Animated Background Bubbles - Inside Phone */}
              <div className="absolute top-10 left-6 w-20 h-20 bg-white/10 rounded-full animate-bubble"></div>
              <div className="absolute top-32 right-8 w-16 h-16 bg-white/10 rounded-full animate-bubble-delayed"></div>
              <div className="absolute bottom-32 left-8 w-24 h-24 bg-white/10 rounded-full animate-bubble" style={{ animationDelay: '1.5s' }}></div>
              <div className="absolute bottom-16 right-6 w-12 h-12 bg-white/10 rounded-full animate-bubble-delayed" style={{ animationDelay: '2s' }}></div>

              {/* Floating Food Emojis - Inside Phone */}
              <div className={`absolute top-20 left-8 text-5xl transition-all duration-1000 delay-200 animate-float ${show ? 'opacity-100' : 'opacity-0'}`}>
                🍕
              </div>
              <div className={`absolute top-24 right-8 text-4xl transition-all duration-1000 delay-400 animate-float-delayed ${show ? 'opacity-100' : 'opacity-0'}`}>
                🍔
              </div>
              <div className={`absolute bottom-6 left-12 text-4xl transition-all duration-1000 delay-600 animate-float ${show ? 'opacity-100' : 'opacity-0'}`}>
                🍜
              </div>
              <div className={`absolute bottom-8 right-12 text-5xl transition-all duration-1000 delay-800 animate-float-delayed ${show ? 'opacity-100' : 'opacity-0'}`}>
                🍱
              </div>

              {/* Animated Logo */}
              <div className={`transition-all duration-1000 delay-300 ${show ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10'}`}>
                {/* App Logo - No white background, larger size */}
                <div className="flex items-center justify-center">
                  <img
                    src="/assets/KINAKANGO.gif"
                    alt="KINAKAN Logo"
                    className="w-72 h-72 object-contain drop-shadow-2xl"
                  />
                </div>

                {/* Rotating Text */}
                <div className="mb-3 h-12 flex items-center justify-center -mt-6">
                  <h2 className="text-white text-2xl font-bold transition-all duration-500 animate-pulse">
                    {phrases[textIndex]}
                  </h2>
                </div>

                {/* Get Started Button - Closer to logo */}
                <div className="flex justify-center">
                  <button
                    onClick={handleGetStarted}
                    disabled={loading}
                    className="bg-gradient-to-r from-primary-600 to-primary-700 text-white px-8 py-3 rounded-full font-bold text-lg shadow-xl hover:shadow-2xl hover:scale-105 hover:from-primary-700 hover:to-primary-800 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Get Started
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <img
            src="/assets/KINAKAN-loading.gif"
            alt="Loading..."
            className="w-64 h-64 object-contain"
          />
        </div>
      )}

      {/* Add floating and bubble animation styles */}
      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-20px) rotate(5deg);
          }
        }

        @keyframes float-delayed {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-15px) rotate(-5deg);
          }
        }

        @keyframes bubble {
          0%, 100% {
            transform: translateY(0px) scale(1);
            opacity: 0.3;
          }
          50% {
            transform: translateY(-30px) scale(1.1);
            opacity: 0.6;
          }
        }

        @keyframes bubble-delayed {
          0%, 100% {
            transform: translateY(0px) scale(1);
            opacity: 0.2;
          }
          50% {
            transform: translateY(-25px) scale(1.15);
            opacity: 0.5;
          }
        }

        .animate-float {
          animation: float 3s ease-in-out infinite;
        }

        .animate-float-delayed {
          animation: float-delayed 3.5s ease-in-out infinite;
        }

        .animate-bubble {
          animation: bubble 4s ease-in-out infinite;
        }

        .animate-bubble-delayed {
          animation: bubble-delayed 5s ease-in-out infinite;
        }
      `}</style>

    </div>
  );
}
