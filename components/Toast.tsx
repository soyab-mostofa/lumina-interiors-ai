import React, { useEffect, useState, useCallback } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastProps {
  toast: Toast;
  onClose: (id: string) => void;
}

const ToastItem: React.FC<ToastProps> = ({ toast, onClose }) => {
  useEffect(() => {
    const duration = toast.duration || 5000;
    const timer = setTimeout(() => {
      onClose(toast.id);
    }, duration);

    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onClose]);

  const icons = {
    success: <CheckCircle size={18} className="text-slate-600" />,
    error: <XCircle size={18} className="text-slate-600" />,
    warning: <AlertCircle size={18} className="text-slate-600" />,
    info: <Info size={18} className="text-slate-600" />,
  };

  return (
    <div
      className="bg-white border border-slate-200 rounded-lg shadow-sm p-4 min-w-[320px] max-w-md"
      role="alert"
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 bg-slate-100 p-1.5 rounded-md">
          {icons[toast.type]}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-900 text-sm">{toast.title}</p>
          {toast.message && (
            <p className="text-slate-600 text-xs mt-1 leading-relaxed">
              {toast.message}
            </p>
          )}
        </div>
        <button
          onClick={() => onClose(toast.id)}
          className="flex-shrink-0 text-slate-400 hover:text-slate-600 transition-colors p-1"
          aria-label="Close notification"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
};

interface ToastContainerProps {
  toasts: Toast[];
  onClose: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  onClose,
}) => {
  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none"
      aria-live="polite"
      aria-atomic="true"
    >
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem toast={toast} onClose={onClose} />
        </div>
      ))}
    </div>
  );
};

// Hook for managing toasts
export const useToast = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback(
    (
      type: ToastType,
      title: string,
      message?: string,
      duration?: number
    ) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const newToast: Toast = { id, type, title, message, duration };
      setToasts((prev) => [...prev, newToast]);
    },
    []
  );

  const closeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const success = useCallback(
    (title: string, message?: string) => showToast('success', title, message),
    [showToast]
  );

  const error = useCallback(
    (title: string, message?: string) => showToast('error', title, message, 7000),
    [showToast]
  );

  const warning = useCallback(
    (title: string, message?: string) => showToast('warning', title, message),
    [showToast]
  );

  const info = useCallback(
    (title: string, message?: string) => showToast('info', title, message),
    [showToast]
  );

  return {
    toasts,
    closeToast,
    success,
    error,
    warning,
    info,
  };
};
