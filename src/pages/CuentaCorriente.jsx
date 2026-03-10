import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { CreditCard, Users, ShoppingCart, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import StatCard from "@/components/dashboard/StatCard";
import EmptyState from "@/components/shared/EmptyState";
import { format } from "date-fns";

export default function CuentaCorriente() {
  const queryClient = useQueryClient();

  const { data: sales = [], isLoading } = useQuery({
    queryKey: ["sales"],
    queryFn: () => base44.entities.Sale.list("-created_date"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Sale.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sales"] }),
  });

  const ccSales = sales.filter((s) => s.status === "cuenta_corriente");
  const totalDeuda = ccSales.reduce((sum, s) => sum + (s.total || 0), 0);
  const uniqueClientIds = [...new Set(ccSales.map((s) => s.client_id))];
  const promedioDeuda = uniqueClientIds.length > 0 ? totalDeuda / uniqueClientIds.length : 0;

  // Group by client
  const byClient = uniqueClientIds.map((clientId) => {
    const clientSales = ccSales.filter((s) => s.client_id === clientId);
    return {
      clientId,
      clientName: clientSales[0]?.client_name || "—",
      sales: clientSales,
      total: clientSales.reduce((sum, s) => sum + (s.total || 0), 0),
    };
  }).sort((a, b) => b.total - a.total);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Cuenta Corriente</h1>
        <p className="text-slate-400 text-sm mt-1">Ventas pendientes de cobro en cuenta corriente</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total deuda CC"
          value={`$${totalDeuda.toLocaleString("es-AR", { minimumFractionDigits: 2 })}`}
          subtitle="Monto total adeudado"
          icon={CreditCard}
          color="rose"
        />
        <StatCard
          title="Promedio por cliente"
          value={`$${promedioDeuda.toLocaleString("es-AR", { minimumFractionDigits: 2 })}`}
          subtitle={`${uniqueClientIds.length} cliente${uniqueClientIds.length !== 1 ? "s" : ""} con deuda`}
          icon={Users}
          color="amber"
        />
        <StatCard
          title="Ventas en CC"
          value={ccSales.length}
          subtitle="Ventas pendientes"
          icon={ShoppingCart}
          color="indigo"
        />
      </div>

      {ccSales.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="Sin ventas en cuenta corriente"
          description="No hay ventas pendientes en cuenta corriente. ¡Todo al día!"
        />
      ) : (
        <>
          {/* All CC sales */}
          <Card className="border-slate-200/60 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
              <h2 className="font-semibold text-slate-900">Todas las ventas en CC</h2>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/50">
                    <TableHead>Fecha</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Artículos</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ccSales.map((sale) => (
                    <TableRow key={sale.id} className="hover:bg-slate-50/50">
                      <TableCell className="text-sm text-slate-600">
                        {sale.sale_date
                          ? format(new Date(sale.sale_date), "dd/MM/yyyy")
                          : format(new Date(sale.created_date), "dd/MM/yyyy")}
                      </TableCell>
                      <TableCell>
                        <Link
                          to={createPageUrl("ClientDetails") + `?id=${sale.client_id}`}
                          className="font-medium text-slate-900 hover:text-indigo-600 hover:underline"
                        >
                          {sale.client_name}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-slate-500 max-w-[200px] truncate">
                          {sale.items?.map((i) => `${i.product_name} x${i.quantity}`).join(", ")}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-semibold text-rose-600">
                        ${sale.total?.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                            onClick={() => updateMutation.mutate({ id: sale.id, data: { status: "cobrada" } })}
                            disabled={updateMutation.isPending}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                            Cobrar
                          </Button>
                          <Link to={createPageUrl("SaleDetail") + `?id=${sale.id}`}>
                            <Button variant="ghost" size="sm" className="text-xs text-indigo-600">
                              Ver
                            </Button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>

          {/* By client summary */}
          <Card className="border-slate-200/60 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
              <h2 className="font-semibold text-slate-900">Resumen por cliente</h2>
            </div>
            <div className="divide-y divide-slate-50">
              {byClient.map(({ clientId, clientName, sales: clientSales, total }) => (
                <div key={clientId} className="px-5 py-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <Link
                        to={createPageUrl("ClientDetails") + `?id=${clientId}`}
                        className="font-semibold text-slate-900 hover:text-indigo-600 hover:underline"
                      >
                        {clientName}
                      </Link>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {clientSales.length} venta{clientSales.length !== 1 ? "s" : ""} en CC
                      </p>
                    </div>
                    <span className="text-lg font-bold text-rose-600">
                      ${total.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="space-y-1 pl-2 border-l-2 border-slate-100">
                    {clientSales.map((s) => (
                      <div key={s.id} className="flex justify-between text-xs text-slate-500">
                        <span>
                          {s.sale_date
                            ? format(new Date(s.sale_date), "dd/MM/yyyy")
                            : format(new Date(s.created_date), "dd/MM/yyyy")}
                          {" — "}
                          {s.items?.map((i) => `${i.product_name} x${i.quantity}`).join(", ")}
                        </span>
                        <span className="font-medium text-slate-700">
                          ${s.total?.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}