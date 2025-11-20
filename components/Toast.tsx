import React, { useEffect } from 'react';
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
    success: <CheckCircle size={22} className="text-emerald-500 animate-scale-in" />,
    error: <XCircle size={22} className="text-red-500 animate-scale-in" />,
    warning: <AlertCircle size={22} className="text-amber-500 animate-scale-in" />,
    info: <Info size={22} className="text-blue-500 animate-scale-in" />,
  };

  const styles = {
    success: {
      bg: 'bg-gradient-to-br from-emerald-50/95 to-teal-50/95',
      border: 'border-emerald-300/50',
      iconBg: 'bg-emerald-100/80',
      glow: 'shadow-[0_0_20px_rgba(16,185,129,0.2)]',
    },
    error: {
      bg: 'bg-gradient-to-br from-red-50/95 to-rose-50/95',
      border: 'border-red-300/50',
      iconBg: 'bg-red-100/80',
      glow: 'shadow-[0_0_20px_rgba(239,68,68,0.2)]',
    },
    warning: {
      bg: 'bg-gradient-to-br from-amber-50/95 to-orange-50/95',
      border: 'border-amber-300/50',
      iconBg: 'bg-amber-100/80',
      glow: 'shadow-[0_0_20px_rgba(245,158,11,0.2)]',
    },
    info: {
      bg: 'bg-gradient-to-br from-blue-50/95 to-indigo-50/95',
      border: 'border-blue-300/50',
      iconBg: 'bg-blue-100/80',
      glow: 'shadow-[0_0_20px_rgba(59,130,246,0.2)]',
    },
  };

  const style = styles[toast.type];

  return (
    <div
      className={`${style.bg} ${style.border} ${style.glow} border-2 rounded-2xl shadow-strong p-4 min-w-[320px] max-w-md animate-slide-in-right backdrop-blur-xl hover:shadow-medium transition-all duration-300 group`}
      role="alert"
    >
      <div className="flex items-start gap-3.5">
        <div className={`flex-shrink-0 mt-0.5 p-2 rounded-xl ${style.iconBg} shadow-soft group-hover:scale-110 transition-transform`}>
          {icons[toast.type]}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-extrabold text-slate-900 text-sm tracking-tight">{toast.title}</p>
          {toast.message && (
            <p className="text-slate-600 text-xs mt-1.5 leading-relaxed">
              {toast.message}
            </p>
          )}
        </div>
        <button
          onClick={() => onClose(toast.id)}
          className="flex-shrink-0 text-slate-400 hover:text-slate-700 transition-all hover:scale-110 hover:rotate-90 p-1 rounded-lg hover:bg-slate-200/50"
          aria-label="Close notification"
        >
          <X size={16} />
        </button>
      </div>

      {/* Progress bar */}
      <div className="mt-3 h-1 bg-slate-200/50 rounded-full overflow-hidden">
        <div
          className={`h-full ${style.iconBg} rounded-full transition-all`}
          style={{
            animation: `shrink ${toast.duration || 5000}ms linear forwards`,
          }}
        ></div>
      </div>

      <style>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
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
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const showToast = React.useCallback(
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

  const closeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const success = React.useCallback(
    (title: string, message?: string) => showToast('success', title, message),
    [showToast]
  );

  const error = React.useCallback(
    (title: string, message?: string) => showToast('error', title, message, 7000),
    [showToast]
  );

  const warning = React.useCallback(
    (title: string, message?: string) => showToast('warning', title, message),
    [showToast]
  );

  const info = React.useCallback(
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
