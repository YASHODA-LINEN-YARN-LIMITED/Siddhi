type ToastType = 'success' | 'error' | 'info';

interface ToastEventDetail {
  id: string;
  message: string;
  type: ToastType;
}

export function notify(message: string, type: ToastType = 'success') {
  if (typeof window === 'undefined') return;
  const detail: ToastEventDetail = {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    message,
    type,
  };
  window.dispatchEvent(new CustomEvent('siddhi-toast', { detail }));
}
