export function AlertCard({ alert, onAlertClick }) {
  // Determine colors based on severity
  let dotColor = "bg-gray-400";
  let badgeClasses = "bg-gray-100 text-gray-700";
  
  if (alert.severity === "Critical") {
    dotColor = "bg-red-500";
    badgeClasses = "bg-red-100 text-red-600";
  } else if (alert.severity === "High" || alert.severity === "Major") {
    dotColor = "bg-orange-500";
    badgeClasses = "bg-orange-100 text-orange-600";
  } else if (alert.severity === "Medium" || alert.severity === "Minor") {
    dotColor = "bg-yellow-400";
    badgeClasses = "bg-yellow-100 text-yellow-700";
  }

  // Use a fallback time if alert doesn't have one
  const time = alert.meta || "10:00Z";

  return (
    <div
      onClick={() => onAlertClick?.(alert.id)}
      className="cursor-pointer p-6 hover:bg-gray-50 transition-colors"
    >
      <div className="flex items-start gap-3">
        {/* Dot indicator */}
        <div className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${dotColor}`} />

        <div className="flex-1 min-w-0">
          {/* Header Row */}
          <div className="flex items-start justify-between">
            <h4 className="text-sm font-bold text-gray-900 truncate pr-4">
              {alert.title}
            </h4>
            <span className="text-xs font-medium text-gray-400 shrink-0">
              {time}
            </span>
          </div>

          {/* Description */}
          <p className="mt-1.5 text-sm text-gray-600 line-clamp-2">
            {alert.description || "Routine perimeter check completed. Minor weather disturbance noted."}
          </p>

          {/* Badge */}
          <div className="mt-3">
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${badgeClasses}`}>
              {alert.severity === "High" ? "MAJOR" : (alert.severity === "Medium" ? "MINOR" : alert.severity)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}