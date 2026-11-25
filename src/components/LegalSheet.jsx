import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import LegalDoc from './LegalDoc';

// Terms / Privacy in a bottom sheet, so reading them doesn't lose a half-filled form
export default function LegalSheet({ doc, onClose }) {
  useEffect(() => {
    if (!doc) return;
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [doc, onClose]);
  if (!doc) return null;
  return createPortal(
    <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center" role="dialog" aria-modal="true" aria-label={doc.title}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="legal-sheet relative w-full sm:max-w-lg max-h-[85vh] flex flex-col rounded-t-[2rem] sm:rounded-[2rem]">
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <h2 className="text-xl font-heading font-bold text-white">{doc.title}</h2>
          <button type="button" onClick={onClose} aria-label="Close"
            className="w-9 h-9 rounded-full glass flex items-center justify-center text-forest-200/80 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="overflow-y-auto px-6 pb-8">
          <LegalDoc doc={doc} />
        </div>
      </div>
    </div>,
    document.body
  );
}
