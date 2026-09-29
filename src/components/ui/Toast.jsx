/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback } from "react";

const ToastContext = createContext(null);

let idCounter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, variant = "success") => {
    const id = ++idCounter;
    setToasts((prev) => [...prev, { id, message, variant }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2800);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div aria-live="polite" aria-atomic="true" className="pointer-events-none fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`pointer-events-auto min-w-[240px] rounded-lg border px-4 py-3 text-sm shadow-lg ${
              t.variant === "error"
                ? "border-red-900/40 bg-zinc-900 text-red-300"
                : t.variant === "info"
                  ? "border-zinc-700 bg-zinc-900 text-zinc-200"
                  : "border-emerald-900/40 bg-zinc-900 text-emerald-300"
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <span>{t.message}</span>
              <button
                type="button"
                aria-label="Dismiss notification"
                onClick={() => removeToast(t.id)}
                className="rounded p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
