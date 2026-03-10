import React from "react";
import { Badge } from "@/components/ui/badge";

const statusConfig = {
  pendiente: {
    label: "Pendiente",
    className: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50",
  },
  cobrada: {
    label: "Cobrada",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50",
  },
  cuenta_corriente: {
    label: "Cuenta Corriente",
    className: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-50",
  },
};

export default function StatusBadge({ status }) {
  const config = statusConfig[status] || statusConfig.pendiente;
  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
}