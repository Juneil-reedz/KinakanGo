import { useEffect } from 'react';

export default function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'w-full h-full',
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-50"
      onClick={onClose}
    >
      {size === 'full' ? (
        <div
          className="bg-white w-full h-full overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </div>
      ) : (
        <div
          className={`bg-white rounded-2xl shadow-xl w-full mx-4 max-h-[90vh] ${sizes[size]} overflow-y-auto`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center p-6 border-b border-secondary-200">
            <h3 className="text-xl font-semibold">{title}</h3>
            <button
              onClick={onClose}
              className="text-secondary-500 hover:text-secondary-700 text-2xl font-bold"
            >
              &times;
            </button>
          </div>
          <div className="p-6">{children}</div>
        </div>
      )}
    </div>
  );
}
