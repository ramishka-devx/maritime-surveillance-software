import { AlertOctagon, AlertTriangle, Info } from "lucide-react";

export const SEVERITY = {
  critical: {
    label: "Critical",
    dot: "bg-red-500",
    badge: "bg-red-100 text-red-700 border-red-200",
    iconWrap: "bg-red-100 text-red-700 border-red-200",
    icon: AlertOctagon,
  },
  warning: {
    label: "Warning",
    dot: "bg-[#F28C1B]",
    badge: "bg-orange-100 text-[#d97c18] border-orange-200",
    iconWrap: "bg-orange-100 text-[#d97c18] border-orange-200",
    icon: AlertTriangle,
  },
  info: {
    label: "Info",
    dot: "bg-[#1b397e]",
    badge: "bg-blue-100 text-[#1b397e] border-blue-200",
    iconWrap: "bg-blue-100 text-[#1b397e] border-blue-200",
    icon: Info,
  },
};

export const STATUS = {
  Active: {
    badge: "bg-green-100 text-green-700 border-green-200",
  },
  Investigating: {
    badge: "bg-amber-100 text-amber-700 border-amber-200",
  },
  Resolved: {
    badge: "bg-slate-100 text-slate-700 border-slate-200",
  },
};
