import { Trash2, X } from "lucide-react";

export default function DeleteModal({
  isOpen,
  title = "Delete Item",
  message = "Are you sure you want to delete this item? This action cannot be undone.",
  deleteText = "Delete",
  cancelText = "Cancel",
  loading = false,
  onDelete,
  onCancel,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">

      <div className="w-full max-w-md rounded-xl bg-white shadow-xl">

        {/* Header */}
        <div className="flex items-center justify-between border-b p-5">

          <div className="flex items-center gap-3">

            <div className="rounded-full bg-red-100 p-2">
              <Trash2
                size={22}
                className="text-red-600"
              />
            </div>

            <h2 className="text-lg font-semibold text-gray-800">
              {title}
            </h2>

          </div>

          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-700"
          >
            <X size={20} />
          </button>

        </div>

        {/* Body */}

        <div className="p-5">

          <p className="text-sm text-gray-600 leading-6">
            {message}
          </p>

        </div>

        {/* Footer */}

        <div className="flex justify-end gap-3 border-t p-5">

          <button
            onClick={onCancel}
            disabled={loading}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-100 transition"
          >
            {cancelText}
          </button>

          <button
            onClick={onDelete}
            disabled={loading}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Deleting..." : deleteText}
          </button>

        </div>

      </div>

    </div>
  );
}