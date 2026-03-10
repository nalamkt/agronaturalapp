import React from "react";
import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign } from "lucide-react";

export default function CashSummaryCard({ totalIngresos, totalEgresos, totalVentasCobradas }) {
  const saldo = totalIngresos - totalEgresos;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="p-5 border-slate-200/60">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-slate-400 font-medium">Ventas cobradas</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">
              ${totalVentasCobradas.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-slate-400 mt-1">Del día (desde módulo ventas)</p>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-50">
            <TrendingUp className="h-5 w-5 text-emerald-600" />
          </div>
        </div>
      </Card>

      <Card className="p-5 border-slate-200/60">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-slate-400 font-medium">Otros ingresos</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">
              ${totalIngresos.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-slate-400 mt-1">Ingresos manuales</p>
          </div>
          <div className="p-2.5 rounded-xl bg-blue-50">
            <TrendingUp className="h-5 w-5 text-blue-600" />
          </div>
        </div>
      </Card>

      <Card className="p-5 border-slate-200/60">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-slate-400 font-medium">Egresos</p>
            <p className="text-2xl font-bold text-rose-600 mt-1">
              ${totalEgresos.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-slate-400 mt-1">Gastos operativos</p>
          </div>
          <div className="p-2.5 rounded-xl bg-rose-50">
            <TrendingDown className="h-5 w-5 text-rose-600" />
          </div>
        </div>
      </Card>

      <Card className={`p-5 border-2 ${saldo >= 0 ? "border-emerald-200 bg-emerald-50/30" : "border-rose-200 bg-rose-50/30"}`}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-slate-400 font-medium">Saldo del día</p>
            <p className={`text-2xl font-bold mt-1 ${saldo >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
              {saldo >= 0 ? "+" : ""}${saldo.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-slate-400 mt-1">Ventas cobradas + ingresos − egresos</p>
          </div>
          <div className={`p-2.5 rounded-xl ${saldo >= 0 ? "bg-emerald-100" : "bg-rose-100"}`}>
            <DollarSign className={`h-5 w-5 ${saldo >= 0 ? "text-emerald-700" : "text-rose-700"}`} />
          </div>
        </div>
      </Card>
    </div>
  );
}