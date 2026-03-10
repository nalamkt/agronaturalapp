import React from "react";
import { Card } from "@/components/ui/card";
import { CheckCircle2, XCircle } from "lucide-react";

const categoryLabels = {
  venta_manual: "Venta manual",
  otro_ingreso: "Otro ingreso",
  alquiler: "Alquiler",
  servicios: "Servicios",
  personal: "Personal / Sueldos",
  proveedor: "Proveedor",
  impuestos: "Impuestos",
  mantenimiento: "Mantenimiento",
  otro_egreso: "Otro egreso",
};

export default function ClosingReport({ movements, ventasCobradas, date }) {
  const ingresos = movements.filter((m) => m.type === "ingreso");
  const egresos = movements.filter((m) => m.type === "egreso");

  const totalIngresos = ingresos.reduce((s, m) => s + m.amount, 0);
  const totalEgresos = egresos.reduce((s, m) => s + m.amount, 0);
  const saldo = ventasCobradas + totalIngresos - totalEgresos;

  // Group egresos by category
  const egresosByCategory = egresos.reduce((acc, m) => {
    const key = m.category || "otro_egreso";
    acc[key] = (acc[key] || 0) + m.amount;
    return acc;
  }, {});

  return (
    <Card className="border-slate-200/60 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
        <h2 className="font-semibold text-slate-900">Cierre de caja — {date}</h2>
      </div>

      <div className="p-6 space-y-6">
        {/* Ingresos */}
        <div>
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Ingresos</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center py-2 border-b border-slate-50">
              <span className="text-sm text-slate-700 flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                Ventas cobradas (módulo ventas)
              </span>
              <span className="text-sm font-semibold text-emerald-600">
                +${ventasCobradas.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
              </span>
            </div>
            {ingresos.map((m) => (
              <div key={m.id} className="flex justify-between items-center py-2 border-b border-slate-50">
                <span className="text-sm text-slate-700 flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  {m.concept}
                  {m.category && (
                    <span className="text-xs text-slate-400">({categoryLabels[m.category] || m.category})</span>
                  )}
                </span>
                <span className="text-sm font-semibold text-emerald-600">
                  +${m.amount.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                </span>
              </div>
            ))}
            <div className="flex justify-between items-center pt-2">
              <span className="text-sm font-semibold text-slate-700">Total ingresos</span>
              <span className="text-sm font-bold text-emerald-600">
                +${(ventasCobradas + totalIngresos).toLocaleString("es-AR", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Egresos */}
        <div>
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Egresos</h3>
          {egresos.length === 0 ? (
            <p className="text-sm text-slate-400">Sin egresos registrados</p>
          ) : (
            <div className="space-y-2">
              {egresos.map((m) => (
                <div key={m.id} className="flex justify-between items-center py-2 border-b border-slate-50">
                  <span className="text-sm text-slate-700 flex items-center gap-2">
                    <XCircle className="h-3.5 w-3.5 text-rose-500" />
                    {m.concept}
                    {m.category && (
                      <span className="text-xs text-slate-400">({categoryLabels[m.category] || m.category})</span>
                    )}
                  </span>
                  <span className="text-sm font-semibold text-rose-600">
                    −${m.amount.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              ))}
              {/* Summary by category */}
              {Object.keys(egresosByCategory).length > 1 && (
                <div className="pt-2 mt-2 border-t border-slate-100">
                  <p className="text-xs text-slate-400 mb-2">Por categoría:</p>
                  <div className="grid grid-cols-2 gap-1">
                    {Object.entries(egresosByCategory).map(([cat, val]) => (
                      <div key={cat} className="flex justify-between text-xs text-slate-500 px-2 py-1 bg-slate-50 rounded-lg">
                        <span>{categoryLabels[cat] || cat}</span>
                        <span className="font-medium">${val.toLocaleString("es-AR", { minimumFractionDigits: 2 })}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex justify-between items-center pt-2">
                <span className="text-sm font-semibold text-slate-700">Total egresos</span>
                <span className="text-sm font-bold text-rose-600">
                  −${totalEgresos.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Saldo final */}
        <div className={`rounded-2xl p-4 ${saldo >= 0 ? "bg-emerald-50 border border-emerald-200" : "bg-rose-50 border border-rose-200"}`}>
          <div className="flex justify-between items-center">
            <span className="font-semibold text-slate-700">Saldo final del día</span>
            <span className={`text-2xl font-bold ${saldo >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
              {saldo >= 0 ? "+" : ""}${saldo.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Ventas cobradas + otros ingresos − egresos del día
          </p>
        </div>
      </div>
    </Card>
  );
}