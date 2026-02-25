import { AlertOctagon, AlertTriangle, Info } from "lucide-react";

export const SEVERITY_STYLES = {
  Critical: {
    pill: "bg-red-500/15 text-red-300 border-red-500/30",
    dot: "bg-red-500",
    icon: AlertOctagon,
  },
  High: {
    pill: "bg-orange-500/15 text-orange-300 border-orange-500/30",
    dot: "bg-orange-500",
    icon: AlertTriangle,
  },
  Medium: {
    pill: "bg-yellow-500/15 text-yellow-200 border-yellow-500/30",
    dot: "bg-yellow-400",
    icon: AlertTriangle,
  },
  Low: {
    pill: "bg-emerald-500/15 text-emerald-200 border-emerald-500/30",
    dot: "bg-emerald-400",
    icon: Info,
  },
};
