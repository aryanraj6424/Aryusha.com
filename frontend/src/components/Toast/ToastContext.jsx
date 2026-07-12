/**
 * ToastContext — global in-app notification system
 *
 * Usage anywhere in the app:
 *   const { showToast } = useToast();
 *   showToast({ type: "success", message: "Order placed!" });
 *   showToast({ type: "error",   message: "Login failed." });
 *   showToast({ type: "warning", message: "OTP expiring soon." });
 *   showToast({ type: "info",    message: "New order assigned." });
 */

import { createContext, useCallback, useContext, useState } from "react";

const ToastContext = createContext(null);

let _idCounter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback(({ type = "info", message, duration = 3500 }) => {
    const id = ++_idCounter;

    setToasts((prev) => [...prev, { id, type, message, duration }]);

    // Auto-dismiss
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, showToast, dismissToast }}>
      {children}
    </ToastContext.Provider>
  );
}

/** Hook — call this inside any component to show toasts */
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used inside <ToastProvider>");
  }
  return ctx;
}
