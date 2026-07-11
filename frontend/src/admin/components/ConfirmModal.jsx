import { CircleAlert } from "lucide-react";

export default function ConfirmModal({
  isOpen,
  title = "Are you sure?",
  message = "Do you want to continue?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmColor = "bg-green-600 hover:bg-green-700",
  onConfirm,
  onCancel,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl">

        {/* Header */}
        <div className="flex items-center gap-3 border-b p-5">
          <div className="rounded-full bg-yellow-100 p-2">
            <CircleAlert className="text-yellow-600" size={24} />
          </div>

          <h2 className="text-lg font-semibold text-gray-800">
            {title}
          </h2>
        </div>

        {/* Body */}
        <div className="p-5">
          <p className="text-sm text-gray-600">
            {message}
          </p>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t p-5">

          <button
            onClick={onCancel}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium transition hover:bg-gray-100"
          >
            {cancelText}
          </button>

          <button
            onClick={onConfirm}
            className={`rounded-lg px-4 py-2 text-sm font-medium text-white transition ${confirmColor}`}
          >
            {confirmText}
          </button>

        </div>
      </div>
    </div>
  );
}