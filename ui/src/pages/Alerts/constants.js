import { AlertOctagon, AlertTriangle, Info } from "lucide-react";

export const SEVERITY = {
  critical: {
    label: "Critical",
    dot: "bg-red-400",
    pill: "bg-red-500/15 text-red-200 border-red-400/25",
    icon: AlertOctagon,
  },
  warning: {
    label: "Warning",
    dot: "bg-amber-300",
    pill: "bg-amber-500/15 text-amber-200 border-amber-400/25",
    icon: AlertTriangle,
  },
  info: {
    label: "Info",
    dot: "bg-sky-300",
    pill: "bg-sky-500/15 text-sky-200 border-sky-400/25",
    icon: Info,
  },
};

export const STATUS = {
  Active: {
    pill: "bg-red-500/10 text-red-200 border-red-400/20",
  },
  Investigating: {
    pill: "bg-amber-500/10 text-amber-200 border-amber-400/20",
  },
  Resolved: {
    pill: "bg-emerald-500/10 text-emerald-200 border-emerald-400/20",
  },
};
