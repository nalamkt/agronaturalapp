import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Plus, Search, ShoppingCart, Filter, Pencil, Trash2 } from "lucide-react";
import { useRole } from "@/components/auth/useRole";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import StatusBadge from "@/components/shared/StatusBadge";
import EmptyState from "@/components/shared/EmptyState";
import { format } from "date-fns";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function Sales() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deleteId, setDeleteId] = useState(null);
  const { isAdmin } = useRole();

  const queryClient = useQueryClient();

  const { data: sales = [], isLoading } = useQuery({
    queryKey: ["sales"],
    queryFn: () => base44.entities.Sale.list("-created_date"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Sale.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sales"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Sale.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      setDeleteId(null);
    },
  });

  const filtered = sales.filter((s) => {
    const matchSearch =
      s.client_name?.toLowerCase().includes(search.toLowerCase()) ||
      s.items?.some((i) => i.product_name?.toLowerCase().includes(search.toLowerCase()));
    const matchStatus = statusFilter === "all" || s.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Ventas</h1>
          <p className="text-slate-400 text-sm mt-1">{sales.length} ventas registradas</p>
        </div>
        <Link to={createPageUrl("NewSale")}>
          <Button className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="h-4 w-4 mr-2" />
            Nueva venta
          </Button>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar por cliente o producto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <Filter className="h-4 w-4 mr-2 text-slate-400" />
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="pendiente">Pendiente</SelectItem>
            <SelectItem value="cobrada">Cobrada</SelectItem>
            <SelectItem value="cuenta_corriente">Cuenta Corriente</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
        </div>
      ) : filtered.length === 0 && sales.length === 0 ? (
        <EmptyState
          icon={ShoppingCart}
          title="Sin ventas"
          description="Creá tu primera venta para comenzar."
          action={
            <Link to={createPageUrl("NewSale")}>
              <Button className="bg-indigo-600 hover:bg-indigo-700">
                <Plus className="h-4 w-4 mr-2" /> Nueva venta
              </Button>
            </Link>
          }
        />
      ) : (
        <Card className="border-slate-200/60 overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/50">
                  <TableHead>Fecha</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Artículos</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((sale) => (
                  <TableRow key={sale.id} className="hover:bg-slate-50/50">
                    <TableCell className="text-sm text-slate-600">
                      {sale.sale_date
                        ? format(new Date(sale.sale_date), "dd/MM/yyyy")
                        : format(new Date(sale.created_date), "dd/MM/yyyy")}
                    </TableCell>
                    <TableCell className="font-medium text-slate-900">{sale.client_name}</TableCell>
                    <TableCell>
                      <div className="text-sm text-slate-500 max-w-[200px] truncate">
                        {sale.items?.map((i) => `${i.product_name} x${i.quantity}`).join(", ")}
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={sale.status} />
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      ${sale.total?.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {sale.status !== "cobrada" && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                              onClick={() => updateMutation.mutate({ id: sale.id, data: { status: "cobrada" } })}
                            >
                              Cobrar
                            </Button>
                            {sale.status !== "cuenta_corriente" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                onClick={() => updateMutation.mutate({ id: sale.id, data: { status: "cuenta_corriente" } })}
                              >
                                Cta. Cte.
                              </Button>
                            )}
                          </>
                        )}
                        <Link to={createPageUrl("SaleDetail") + `?id=${sale.id}`}>
                          <Button variant="ghost" size="sm" className="text-xs text-indigo-600">
                            Ver
                          </Button>
                        </Link>
                        <Link to={createPageUrl("EditSale") + `?id=${sale.id}`}>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <Pencil className="h-3.5 w-3.5 text-slate-400" />
                          </Button>
                        </Link>
                        {isAdmin && (
                          <Button
                            variant="ghost" size="icon" className="h-7 w-7"
                            onClick={() => setDeleteId(sale.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5 text-red-400" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar venta?</AlertDialogTitle>
            <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteMutation.mutate(deleteId)} className="bg-red-600 hover:bg-red-700">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}