import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, User, Pencil } from "lucide-react";
import { useRole } from "@/components/auth/useRole";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import StatusBadge from "@/components/shared/StatusBadge";
import { format } from "date-fns";

export default function SaleDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const saleId = urlParams.get("id");
  const { isAdmin } = useRole();

  const queryClient = useQueryClient();

  const { data: sale, isLoading } = useQuery({
    queryKey: ["sale", saleId],
    queryFn: () => base44.entities.Sale.list().then((list) => list.find((s) => s.id === saleId)),
    enabled: !!saleId,
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Sale.update(saleId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sale", saleId] });
      queryClient.invalidateQueries({ queryKey: ["sales"] });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    );
  }

  if (!sale) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-400">Venta no encontrada</p>
        <Link to={createPageUrl("Sales")}>
          <Button variant="outline" className="mt-4">Volver a ventas</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <Link to={createPageUrl("Sales")}>
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Detalle de venta</h1>
          <Link to={createPageUrl("EditSale") + `?id=${sale?.id}`} className="text-xs text-indigo-600 hover:underline flex items-center gap-1 mt-0.5">
            <Pencil className="h-3 w-3" /> Editar venta
          </Link>
          <p className="text-slate-400 text-sm mt-0.5">
            {sale.sale_date
              ? format(new Date(sale.sale_date), "dd/MM/yyyy")
              : format(new Date(sale.created_date), "dd/MM/yyyy")}
          </p>
        </div>
        <StatusBadge status={sale.status} />
      </div>

      {/* Cliente */}
      <Card className="p-5 border-slate-200/60">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center">
            <User className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <p className="font-semibold text-slate-900">{sale.client_name}</p>
            <Link
              to={createPageUrl("ClientDetail") + `?id=${sale.client_id}`}
              className="text-xs text-indigo-600 hover:underline"
            >
              Ver perfil del cliente
            </Link>
          </div>
        </div>
      </Card>

      {/* Artículos */}
      <Card className="border-slate-200/60 overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">Artículos</h2>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/50">
              <TableHead>Producto</TableHead>
              <TableHead className="text-center">Cantidad</TableHead>
              <TableHead className="text-right">Precio unit.</TableHead>
              <TableHead className="text-right">Subtotal</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sale.items?.map((item, i) => (
              <TableRow key={i}>
                <TableCell className="font-medium">{item.product_name}</TableCell>
                <TableCell className="text-center">{item.quantity}</TableCell>
                <TableCell className="text-right">
                  ${item.unit_price?.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                </TableCell>
                <TableCell className="text-right font-medium">
                  ${item.subtotal?.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="p-5 border-t border-slate-100 flex justify-end">
          <div className="text-right">
            <p className="text-sm text-slate-400">Total</p>
            <p className="text-2xl font-bold text-slate-900">
              ${sale.total?.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </Card>

      {/* Notas */}
      {sale.notes && (
        <Card className="p-5 border-slate-200/60">
          <p className="text-sm text-slate-400 mb-1">Notas</p>
          <p className="text-sm text-slate-700">{sale.notes}</p>
        </Card>
      )}

      {/* Acciones de estado */}
      {sale.status !== "cobrada" && (
        <Card className="p-5 border-slate-200/60">
          <p className="text-sm text-slate-400 mb-3">Cambiar estado</p>
          <div className="flex gap-3">
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={() => updateMutation.mutate({ status: "cobrada" })}
              disabled={updateMutation.isPending}
            >
              Marcar como cobrada
            </Button>
            {sale.status !== "cuenta_corriente" && (
              <Button
                variant="outline"
                className="border-blue-200 text-blue-700 hover:bg-blue-50"
                onClick={() => updateMutation.mutate({ status: "cuenta_corriente" })}
                disabled={updateMutation.isPending}
              >
                Enviar a cuenta corriente
              </Button>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}