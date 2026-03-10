import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Mail, Phone, MapPin, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import StatusBadge from "@/components/shared/StatusBadge";
import { format } from "date-fns";

export default function ClientDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const clientId = urlParams.get("id");

  const { data: client, isLoading: loadingClient } = useQuery({
    queryKey: ["client", clientId],
    queryFn: () => base44.entities.Client.list().then((list) => list.find((c) => c.id === clientId)),
    enabled: !!clientId,
  });

  const { data: sales = [], isLoading: loadingSales } = useQuery({
    queryKey: ["clientSales", clientId],
    queryFn: () => base44.entities.Sale.filter({ client_id: clientId }, "-created_date"),
    enabled: !!clientId,
  });

  const isLoading = loadingClient || loadingSales;
  const totalDebt = sales
    .filter((s) => s.status === "pendiente" || s.status === "cuenta_corriente")
    .reduce((sum, s) => sum + (s.total || 0), 0);
  const totalPaid = sales
    .filter((s) => s.status === "cobrada")
    .reduce((sum, s) => sum + (s.total || 0), 0);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-400">Cliente no encontrado</p>
        <Link to={createPageUrl("Clients")}>
          <Button variant="outline" className="mt-4">Volver a clientes</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to={createPageUrl("Clients")}>
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{client.name}</h1>
          <p className="text-slate-400 text-sm mt-0.5">Detalle del cliente</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5 border-slate-200/60">
          <div className="space-y-3">
            {client.email && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Mail className="h-4 w-4 text-slate-400" />
                {client.email}
              </div>
            )}
            {client.phone && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Phone className="h-4 w-4 text-slate-400" />
                {client.phone}
              </div>
            )}
            {client.address && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <MapPin className="h-4 w-4 text-slate-400" />
                {client.address}
              </div>
            )}
            {client.notes && (
              <p className="text-sm text-slate-400 pt-2 border-t border-slate-100">{client.notes}</p>
            )}
            {!client.email && !client.phone && !client.address && (
              <p className="text-sm text-slate-400">Sin información de contacto</p>
            )}
          </div>
        </Card>

        <Card className="p-5 border-slate-200/60">
          <p className="text-sm text-slate-400">Deuda pendiente</p>
          <p className={`text-2xl font-bold mt-1 ${totalDebt > 0 ? "text-red-600" : "text-slate-400"}`}>
            ${totalDebt.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {sales.filter((s) => s.status === "pendiente" || s.status === "cuenta_corriente").length} ventas pendientes
          </p>
        </Card>

        <Card className="p-5 border-slate-200/60">
          <p className="text-sm text-slate-400">Total cobrado</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">
            ${totalPaid.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-slate-400 mt-1">{sales.filter((s) => s.status === "cobrada").length} ventas cobradas</p>
        </Card>
      </div>

      <Card className="border-slate-200/60 overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Historial de ventas</h2>
          <Link to={createPageUrl("NewSale") + `?client_id=${client.id}`}>
            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">
              <ShoppingCart className="h-3.5 w-3.5 mr-2" /> Nueva venta
            </Button>
          </Link>
        </div>
        {sales.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-400">Este cliente no tiene ventas</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/50">
                  <TableHead>Fecha</TableHead>
                  <TableHead>Artículos</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Detalle</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.map((sale) => (
                  <TableRow key={sale.id} className="hover:bg-slate-50/50">
                    <TableCell className="text-sm text-slate-600">
                      {sale.sale_date ? format(new Date(sale.sale_date), "dd/MM/yyyy") : format(new Date(sale.created_date), "dd/MM/yyyy")}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-slate-600">
                        {sale.items?.map((item, i) => (
                          <span key={i}>
                            {item.product_name} x{item.quantity}
                            {i < sale.items.length - 1 ? ", " : ""}
                          </span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={sale.status} />
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      ${sale.total?.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link to={createPageUrl("SaleDetail") + `?id=${sale.id}`}>
                        <Button variant="ghost" size="sm" className="text-indigo-600">
                          Ver
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
}