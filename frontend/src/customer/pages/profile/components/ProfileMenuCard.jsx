import {
  ChevronRight,
} from "lucide-react";

function ProfileMenuCard({
  title,
  icon: Icon,
  onClick,
  danger = false,
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between p-5 border-b hover:bg-gray-50 transition ${
        danger
          ? "text-red-600"
          : ""
      }`}
    >
      <div className="flex items-center gap-3">

        {Icon && (
          <Icon
            size={20}
            className={
              danger
                ? "text-red-600"
                : "text-purple-600"
            }
          />
        )}

        <span className="font-medium">
          {title}
        </span>

      </div>

      <ChevronRight size={18} />
    </button>
  );
}

export default ProfileMenuCard;