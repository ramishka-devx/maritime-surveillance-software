import { AlertOctagon, AlertTriangle, Info } from "lucide-react";

export const SEVERITY = {
  critical: {
    label: "Critical",
    dot: "bg-red-500",
    badge: "bg-[#0b74c9]/10 text-[#08244a] border-[#0b74c9]/25",
    iconWrap: "bg-[#0b74c9]/10 text-[#08244a] border-[#0b74c9]/25",
    icon: AlertOctagon,
  },
  warning: {
    label: "Warning",
    dot: "bg-amber-500",
    badge: "bg-[#0b74c9]/10 text-[#08244a] border-[#0b74c9]/25",
    iconWrap: "bg-[#0b74c9]/10 text-[#08244a] border-[#0b74c9]/25",
    icon: AlertTriangle,
  },
  info: {
    label: "Info",
    dot: "bg-[#0b74c9]",
    badge: "bg-[#0b74c9]/10 text-[#08244a] border-[#0b74c9]/25",
    iconWrap: "bg-[#0b74c9]/10 text-[#08244a] border-[#0b74c9]/25",
    icon: Info,
  },
};

export const STATUS = {
  Active: {
    badge: "bg-[#0b74c9]/10 text-[#08244a] border-[#0b74c9]/25",
  },
  Investigating: {
    badge: "bg-[#0b74c9]/10 text-[#08244a] border-[#0b74c9]/25",
  },
  Resolved: {
    badge: "bg-[#0b74c9]/10 text-[#08244a] border-[#0b74c9]/25",
  },
};
