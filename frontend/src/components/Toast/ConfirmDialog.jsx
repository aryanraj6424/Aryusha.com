/**
 * ConfirmDialog — in-UI replacement for window.confirm()
 *
 * Usage:
 *   const [confirmState, setConfirmState] = useState(null);
 *
 *   // To trigger:
 *   setConfirmState({
 *     message: "Are you sure you want to delete this item?",
 *     onConfirm: () => handleDelete(id),
 *   });
 *
 *   // In JSX:
 *   {confirmState && (
 *     <ConfirmDialog
 *       message={confirmState.message}
 *       onConfirm={() => { confirmState.onConfirm(); setConfirmState(null); }}
 *       onCancel={() => setConfirmState(null)}
 *     />
 *   )}
 */

import { useEffect, useRef } from "react";
import { AlertTriangle, X } from "lucide-react";

export default function ConfirmDialog({
  message,
  onConfirm,
  onCancel,
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = "warning", // "warning" | "danger"
}) {
  const confirmBtnRef = useRef(null);

  // Auto-focus confirm button for keyboard accessibility
  useEffect(() => {
    confirmBtnRef.current?.focus();
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onCancel]);

  const isDanger = type === "danger";

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
      role="dialog"
      aria-modal="true"
      aria-label="Confirmation dialog"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      {/* Card */}
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 space-y-5 animate-fade-in">
        {/* Icon + close */}
        <div className="flex justify-between items-start">
          <div
            className={`p-3 rounded-2xl ${
              isDanger ? "bg-rose-100" : "bg-amber-100"
            }`}
          >
            <AlertTriangle
              size={22}
              className={isDanger ? "text-rose-600" : "text-amber-600"}
            />
          </div>
          <button
            onClick={onCancel}
            className="text-slate-400 hover:text-slate-700 transition p-1 cursor-pointer"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Message */}
        <p className="text-slate-800 font-semibold text-sm leading-relaxed">
          {message}
        </p>

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            ref={confirmBtnRef}
            onClick={onConfirm}
            className={`flex-1 py-2.5 rounded-xl text-white text-sm font-bold transition cursor-pointer ${
              isDanger
                ? "bg-rose-600 hover:bg-rose-700"
                : "bg-violet-600 hover:bg-violet-700"
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
