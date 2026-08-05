import React from "react";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle2, XCircle } from "lucide-react";

export const StatusBadge = ({ status }) => {
  const map = {
    pending: {
      label: "Menunggu",
      cls: "bg-amber-50 text-amber-700 border-amber-200",
      icon: Clock,
    },
    approved: {
      label: "Disetujui",
      cls: "bg-green-50 text-green-700 border-green-200",
      icon: CheckCircle2,
    },
    rejected: {
      label: "Ditolak",
      cls: "bg-red-50 text-red-700 border-red-200",
      icon: XCircle,
    },
  };
  const { label, cls, icon: Icon } = map[status] ?? map.pending;
  return (
    <Badge
      variant="outline"
      className={`inline-flex items-center gap-1 font-bib text-[10px] uppercase px-2.5 py-0.5 rounded-full border ${cls}`}
    >
      <Icon className="w-2.5 h-2.5" />
      {label}
    </Badge>
  );
};
