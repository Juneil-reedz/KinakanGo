import { ArrowLeft } from 'lucide-react';
import useGoBack from '../hooks/useGoBack';
import LegalDoc from '../components/LegalDoc';
import { TERMS, PRIVACY } from '../content/legal';

// Public pages at /terms and /privacy
export default function Legal({ kind }) {
  const goBack = useGoBack();
  const doc = kind === 'privacy' ? PRIVACY : TERMS;
  return (
    <div className="min-h-screen px-5 pt-6 pb-16 flex justify-center">
      <div className="w-full max-w-2xl page-rise">
        <button type="button" onClick={() => goBack('/')} aria-label="Back"
          className="w-10 h-10 rounded-full glass flex items-center justify-center text-forest-200 mb-5">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-3xl font-heading font-bold text-white mb-2">{doc.title}</h1>
        <LegalDoc doc={doc} />
      </div>
    </div>
  );
}
