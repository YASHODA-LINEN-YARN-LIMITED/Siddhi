import React, { useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

interface ToastItem {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const handleToast = (e: Event) => {
      const customEvent = e as CustomEvent<ToastItem>;
      if (!customEvent.detail) return;
      const newToast = customEvent.detail;
      setToasts((prev) => [...prev, newToast]);

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
      }, 3500);
    };

    window.addEventListener('siddhi-toast', handleToast);
    return () => window.removeEventListener('siddhi-toast', handleToast);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-center justify-between gap-3 px-4 py-2.5 rounded-lg shadow-lg border text-xs font-medium transition-all transform animate-in slide-in-from-top-2 ${
            toast.type === 'error'
              ? 'bg-rose-900/95 text-rose-50 border-rose-800'
              : toast.type === 'info'
              ? 'bg-slate-900/95 text-slate-100 border-slate-800'
              : 'bg-emerald-900/95 text-emerald-50 border-emerald-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {toast.type === 'error' ? (
              <AlertCircle className="h-4 w-4 text-rose-300 shrink-0" />
            ) : toast.type === 'info' ? (
              <Info className="h-4 w-4 text-slate-300 shrink-0" />
            ) : (
              <CheckCircle2 className="h-4 w-4 text-emerald-300 shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
          <button
            onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
            className="text-white/60 hover:text-white shrink-0 ml-2"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};
