export default function StatusBadge({ status }) {
  const statusConfig = {
    active: {
      bg: "bg-green-100",
      text: "text-green-700",
      label: "Active"
    },
    inactive: {
      bg: "bg-red-100",
      text: "text-red-700",
      label: "Inactive"
    },
    pending: {
      bg: "bg-yellow-100",
      text: "text-yellow-700",
      label: "Pending"
    },
    draft: {
      bg: "bg-gray-100",
      text: "text-gray-700",
      label: "Draft"
    }
  };

  const config = statusConfig[status.toLowerCase()] || statusConfig.active;

  return (
    <span className={`${config.bg} ${config.text} px-3 py-1 rounded-full text-xs font-semibold`}>
      {config.label}
    </span>
  );
}
