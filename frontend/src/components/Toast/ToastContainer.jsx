/**
 * ToastContainer — renders the stacked toast notifications
 * Mounted once at the app root (via App.jsx), renders into a fixed portal overlay.
 */

import { useEffect, useState } from "react";
import { CheckCircle, XCircle, AlertTriangle, Info, X } from "lucide-react";
import { useToast } from "./ToastContext";

// Per-type visual config — colours match the purple/violet project theme
const CONFIG = {
  success: {
    borderColor: "border-emerald-500",
    bg: "bg-emerald-50",
    iconColor: "text-emerald-600",
    textColor: "text-emerald-900",
    Icon: CheckCircle,
  },
  error: {
    borderColor: "border-rose-500",
    bg: "bg-rose-50",
    iconColor: "text-rose-600",
    textColor: "text-rose-900",
    Icon: XCircle,
  },
  warning: {
    borderColor: "border-amber-400",
    bg: "bg-amber-50",
    iconColor: "text-amber-600",
    textColor: "text-amber-900",
    Icon: AlertTriangle,
  },
  info: {
    borderColor: "border-violet-500",
    bg: "bg-violet-50",
    iconColor: "text-violet-600",
    textColor: "text-violet-900",
    Icon: Info,
  },
};

function ToastItem({ toast, onDismiss }) {
  const [visible, setVisible] = useState(false);

  // Trigger CSS slide-in on mount
  useEffect(() => {
    const t = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(t);
  }, []);

  const { borderColor, bg, iconColor, textColor, Icon } =
    CONFIG[toast.type] ?? CONFIG.info;

  const handleDismiss = () => {
    setVisible(false);
    // Allow the CSS transition to finish before removing from DOM
    setTimeout(() => onDismiss(toast.id), 300);
  };

  return (
    <div
      className={`
        flex items-start gap-3 w-full max-w-sm px-4 py-3 rounded-2xl shadow-lg
        border-l-4 ${borderColor} ${bg}
        transition-all duration-300 ease-out
        ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
      `}
      role="alert"
      aria-live="polite"
    >
      <Icon size={18} className={`${iconColor} mt-0.5 flex-shrink-0`} />

      <p className={`text-sm font-semibold leading-snug flex-1 ${textColor}`}>
        {toast.message}
      </p>

      <button
        onClick={handleDismiss}
        className="text-slate-400 hover:text-slate-700 transition flex-shrink-0 mt-0.5 cursor-pointer"
        aria-label="Dismiss notification"
      >
        <X size={15} />
      </button>
    </div>
  );
}

/** Drop this into your root layout — renders nothing when no toasts are active */
export default function ToastContainer() {
  const { toasts, dismissToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 items-end pointer-events-none"
      aria-label="Notifications"
    >
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem toast={toast} onDismiss={dismissToast} />
        </div>
      ))}
    </div>
  );
}
