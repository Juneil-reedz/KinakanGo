import { useNavigate } from 'react-router-dom';
import { Compass, Home, ArrowLeft } from 'lucide-react';
import useGoBack from '../hooks/useGoBack';

// Shown for unknown URLs. `homePath` lets the panels send people to their own dashboard.
export default function NotFound({ homePath = '/', homeLabel = 'Go Home' }) {
  const navigate = useNavigate();
  const goBack = useGoBack();
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-12">
      <div className="glass rounded-3xl p-10 max-w-sm w-full text-center card-3d animate-fade-up">
        <div className="w-16 h-16 glass rounded-3xl flex items-center justify-center mx-auto mb-5">
          <Compass className="w-8 h-8 text-forest-300/70" />
        </div>
        <p className="text-white font-heading font-bold text-xl mb-2">Page not found</p>
        <p className="text-forest-200/60 text-sm mb-6">The page you're looking for doesn't exist or has moved.</p>
        <div className="flex gap-3 justify-center">
          <button onClick={() => goBack(homePath)}
            className="glass hover:glass-green transition-all text-forest-100 text-sm px-4 py-2.5 rounded-xl flex items-center gap-1.5">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <button onClick={() => navigate(homePath, { replace: true })}
            className="btn-glow-orange text-white text-sm font-bold px-5 py-2.5 rounded-xl flex items-center gap-1.5">
            <Home className="w-4 h-4" /> {homeLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
