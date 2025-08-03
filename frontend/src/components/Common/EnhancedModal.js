// Enhanced Modal System - نظام النوافذ المنبثقة المحسن
import React, { useEffect, useRef } from 'react';

const EnhancedModal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'medium',
  type = 'default',
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  customClass = '',
  language = 'ar'
}) => {
  const modalRef = useRef(null);
  const previousActiveElement = useRef(null);

  // Size configurations
  const sizeClasses = {
    small: 'max-w-sm',
    medium: 'max-w-2xl',
    large: 'max-w-4xl',
    xlarge: 'max-w-6xl',
    fullscreen: 'max-w-[95vw] max-h-[95vh]'
  };

  // Type configurations for styling
  const typeClasses = {
    default: 'bg-white/10 backdrop-blur-lg border-white/20',
    success: 'bg-green-500/10 backdrop-blur-lg border-green-500/30',
    warning: 'bg-yellow-500/10 backdrop-blur-lg border-yellow-500/30',
    error: 'bg-red-500/10 backdrop-blur-lg border-red-500/30',
    info: 'bg-blue-500/10 backdrop-blur-lg border-blue-500/30'
  };

  const typeIcons = {
    default: '📋',
    success: '✅',
    warning: '⚠️',
    error: '❌',
    info: 'ℹ️'
  };

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (closeOnEscape && e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, closeOnEscape, onClose]);

  // Handle focus management
  useEffect(() => {
    if (isOpen) {
      // Store previously focused element
      previousActiveElement.current = document.activeElement;
      
      // Focus modal
      if (modalRef.current) {
        modalRef.current.focus();
      }
      
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
    } else {
      // Restore body scroll
      document.body.style.overflow = 'unset';
      
      // Restore focus
      if (previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Handle overlay click
  const handleOverlayClick = (e) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{
        background: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)'
      }}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "modal-title" : undefined}
    >
      {/* Modal Container */}
      <div
        ref={modalRef}
        className={`
          relative w-full ${sizeClasses[size]} 
          ${typeClasses[type]} 
          rounded-2xl border shadow-2xl
          transform transition-all duration-300 ease-out
          animate-modalSlideIn
          ${customClass}
        `}
        tabIndex={-1}
        style={{
          maxHeight: size === 'fullscreen' ? '95vh' : '90vh',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.1)'
        }}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="sticky top-0 flex items-center justify-between p-6 border-b border-white/10 bg-inherit rounded-t-2xl">
            {title && (
              <h2 
                id="modal-title"
                className="text-xl font-bold text-white flex items-center gap-3"
              >
                <span className="text-2xl">{typeIcons[type]}</span>
                {title}
              </h2>
            )}
            
            {showCloseButton && (
              <button
                onClick={onClose}
                className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-all duration-200 flex items-center justify-center w-10 h-10"
                aria-label={language === 'ar' ? 'إغلاق' : 'Close'}
              >
                <span className="text-xl font-bold">✕</span>
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div 
          className="p-6 overflow-y-auto"
          style={{ 
            maxHeight: size === 'fullscreen' ? 'calc(95vh - 80px)' : 'calc(90vh - 80px)' 
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

// Enhanced Confirmation Modal
export const ConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  type = 'warning',
  confirmText,
  cancelText,
  language = 'ar' 
}) => {
  const defaultTexts = {
    ar: {
      confirm: 'تأكيد',
      cancel: 'إلغاء',
      title: 'تأكيد العملية'
    },
    en: {
      confirm: 'Confirm',
      cancel: 'Cancel',
      title: 'Confirm Action'
    }
  };

  const texts = defaultTexts[language];

  return (
    <EnhancedModal
      isOpen={isOpen}
      onClose={onClose}
      title={title || texts.title}
      size="small"
      type={type}
      language={language}
    >
      <div className="text-center">
        <div className="mb-6">
          <p className="text-white text-lg">{message}</p>
        </div>
        
        <div className="flex gap-4 justify-center">
          <button
            onClick={onConfirm}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              type === 'error' 
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {confirmText || texts.confirm}
          </button>
          
          <button
            onClick={onClose}
            className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
          >
            {cancelText || texts.cancel}
          </button>
        </div>
      </div>
    </EnhancedModal>
  );
};

// Loading Modal
export const LoadingModal = ({ isOpen, message, language = 'ar' }) => {
  const loadingTexts = {
    ar: 'جاري التحميل...',
    en: 'Loading...'
  };

  return (
    <EnhancedModal
      isOpen={isOpen}
      onClose={() => {}} // Cannot be closed
      showCloseButton={false}
      closeOnOverlayClick={false}
      closeOnEscape={false}
      size="small"
      language={language}
    >
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-6"></div>
        <p className="text-white text-lg">
          {message || loadingTexts[language]}
        </p>
      </div>
    </EnhancedModal>
  );
};

// Success Modal
export const SuccessModal = ({ 
  isOpen, 
  onClose, 
  title, 
  message, 
  buttonText,
  language = 'ar' 
}) => {
  const successTexts = {
    ar: {
      title: 'تم بنجاح!',
      button: 'حسناً'
    },
    en: {
      title: 'Success!',
      button: 'OK'
    }
  };

  const texts = successTexts[language];

  return (
    <EnhancedModal
      isOpen={isOpen}
      onClose={onClose}
      title={title || texts.title}
      size="small"
      type="success"
      language={language}
    >
      <div className="text-center">
        <div className="mb-6">
          <div className="text-6xl mb-4">🎉</div>
          <p className="text-white text-lg">{message}</p>
        </div>
        
        <button
          onClick={onClose}
          className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
        >
          {buttonText || texts.button}
        </button>
      </div>
    </EnhancedModal>
  );
};

export default EnhancedModal;