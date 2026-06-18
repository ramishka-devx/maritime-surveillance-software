import { AlertOctagon, AlertTriangle, Info } from "lucide-react";

export const SEVERITY_STYLES = {
  Critical: {
    pill: "bg-red-50 text-red-600 border-red-200",
    dot: "bg-red-500 shadow-sm",
    icon: AlertOctagon,
  },
  High: {
    pill: "bg-orange-50 text-orange-600 border-orange-200",
    dot: "bg-orange-500 shadow-sm",
    icon: AlertTriangle,
  },
  Medium: {
    pill: "bg-amber-50 text-amber-600 border-amber-200",
    dot: "bg-amber-500 shadow-sm",
    icon: AlertTriangle,
  },
  Low: {
    pill: "bg-emerald-50 text-emerald-600 border-emerald-200",
    dot: "bg-emerald-500 shadow-sm",
    icon: Info,
  },
};
