import { createContext, useContext, useState, useCallback, useMemo } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, options = {}) => {
    const id = Date.now() + Math.random();
    const toast = {
      id,
      message,
      type: options.type || 'info',
      duration: options.duration ?? 4000,
      action: options.action,
    };
    setToasts((prev) => [...prev, toast]);
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useMemo(
    () => ({
      success: (msg, opts) => addToast(msg, { ...opts, type: 'success' }),
      error: (msg, opts) => addToast(msg, { ...opts, type: 'error' }),
      warning: (msg, opts) => addToast(msg, { ...opts, type: 'warning' }),
      info: (msg, opts) => addToast(msg, { ...opts, type: 'info' }),
      dismiss: removeToast,
    }),
    [addToast, removeToast]
  );

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="toast-container" role="region" aria-live="polite" aria-label="Notifications">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.type}`} role="alert">
            <div className="toast-content">
              <span className="toast-icon" aria-hidden="true">
                {t.type === 'success' && '✓'}
                {t.type === 'error' && '✕'}
                {t.type === 'warning' && '⚠'}
                {t.type === 'info' && 'ℹ'}
              </span>
              <span className="toast-message">{t.message}</span>
            </div>
            {t.action && (
              <button type="button" className="toast-action" onClick={t.action.onClick}>
                {t.action.label}
              </button>
            )}
            <button type="button" className="toast-close" onClick={() => removeToast(t.id)} aria-label="Dismiss">
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
}