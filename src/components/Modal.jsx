import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export default function Modal({ open, onClose, title, children }) {
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);
  const contentRef = useRef(null);

  useEffect(() => {
    if (open) {
      setVisible(true);
      setClosing(false);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const handleClose = () => {
    setClosing(true);
    setTimeout(() => {
      setVisible(false);
      setClosing(false);
      onClose();
    }, 250);
  };

  // Close on backdrop click only (not content)
  const handleBackdropClick = (e) => {
    if (contentRef.current && !contentRef.current.contains(e.target)) {
      handleClose();
    }
  };

  if (!visible) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[999] flex items-end sm:items-center justify-center"
      onClick={handleBackdropClick}
    >
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-250 ${
          closing ? 'opacity-0' : 'animate-fade-in'
        }`}
      />

      {/* Content */}
      <div
        ref={contentRef}
        className={`relative bg-surface-alt w-full max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl transition-transform duration-300 ease-out ${
          closing ? 'translate-y-full' : 'animate-slide-up'
        }`}
        style={{ maxHeight: 'calc(90vh - env(safe-area-inset-bottom, 0px))' }}
      >
        {/* Handle bar (mobile) */}
        <div className="flex justify-center pt-3 sm:hidden">
          <div className="w-10 h-1.5 rounded-full bg-gray-300/80" />
        </div>

        {/* Header */}
        <div className="sticky top-0 bg-surface-alt z-10 px-6 pt-4 pb-3 border-b border-gray-100/80 rounded-t-3xl">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl text-text-primary">{title}</h2>
            <button
              onClick={handleClose}
              className="p-2 -mr-2 rounded-full hover:bg-gray-100 text-text-secondary active:scale-90 transition-all"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto overscroll-contain px-6 py-5" style={{ maxHeight: 'calc(90vh - env(safe-area-inset-bottom, 0px) - 4.5rem)' }}>
          {children}
        </div>

        {/* Safe area spacer */}
        <div style={{ height: 'env(safe-area-inset-bottom, 0px)' }} />
      </div>
    </div>,
    document.body
  );
}
