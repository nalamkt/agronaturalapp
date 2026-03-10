import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, ChevronLeft, ChevronRight, Wallet } from "lucide-react";
import { useRole } from "@/components/auth/useRole";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import MovementFormDialog from "@/components/cash/MovementFormDialog";
import CashSummaryCard from "@/components/cash/CashSummaryCard";
import ClosingReport from "@/components/cash/ClosingReport";
import EmptyState from "@/components/shared/EmptyState";

const categoryLabels = {
  venta_manual: "Venta manual",
  otro_ingreso: "Otro ingreso",
  alquiler: "Alquiler",
  servicios: "Servicios",
  personal: "Personal",
  proveedor: "Proveedor",
  impuestos: "Impuestos",
  mantenimiento: "Mantenimiento",
  otro_egreso: "Otro egreso",
};

export default function Cash() {
  const today = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const { isAdmin } = useRole();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMovement, setEditMovement] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [showClosing, setShowClosing] = useState(false);

  const queryClient = useQueryClient();

  const { data: movements = [], isLoading } = useQuery({
    queryKey: ["cashMovements"],
    queryFn: () => base44.entities.CashMovement.list("-date"),
  });

  const { data: sales = [] } = useQuery({
    queryKey: ["sales"],
    queryFn: () => base44.entities.Sale.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.CashMovement.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cashMovements"] });
      setDialogOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.CashMovement.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cashMovements"] });
      setDialogOpen(false);
      setEditMovement(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.CashMovement.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cashMovements"] });
      setDeleteId(null);
    },
  });

  const handleSave = (data) => {
    if (editMovement) {
      updateMutation.mutate({ id: editMovement.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const changeDate = (days) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split("T")[0]);
  };

  // Filter movements for selected date
  const dayMovements = useMemo(
    () => movements.filter((m) => m.date === selectedDate),
    [movements, selectedDate]
  );

  // Ventas cobradas del día seleccionado (desde el módulo de ventas)
  const ventasCobradas = useMemo(
    () =>
      sales
        .filter((s) => {
          const saleDate = s.sale_date || (s.created_date ? s.created_date.split("T")[0] : null);
          return saleDate === selectedDate && s.status === "cobrada";
        })
        .reduce((sum, s) => sum + (s.total || 0), 0),
    [sales, selectedDate]
  );

  const totalIngresos = dayMovements
    .filter((m) => m.type === "ingreso")
    .reduce((s, m) => s + m.amount, 0);

  const totalEgresos = dayMovements
    .filter((m) => m.type === "egreso")
    .reduce((s, m) => s + m.amount, 0);

  const formattedDate = format(parseISO(selectedDate), "EEEE d 'de' MMMM, yyyy", { locale: es });
  const isToday = selectedDate === today;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Caja</h1>
          <p className="text-slate-400 text-sm mt-1 capitalize">{formattedDate}</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowClosing(!showClosing)}
            className="border-slate-200"
          >
            {showClosing ? "Ver movimientos" : "Cierre del día"}
          </Button>
          {isAdmin && (
            <Button
              onClick={() => { setEditMovement(null); setDialogOpen(true); }}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Registrar movimiento
            </Button>
          )}
        </div>
      </div>

      {/* Date navigator */}
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" onClick={() => changeDate(-1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {isToday && (
            <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 text-xs">
              Hoy
            </Badge>
          )}
        </div>
        <Button variant="outline" size="icon" onClick={() => changeDate(1)} disabled={selectedDate >= today}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Summary cards */}
      <CashSummaryCard
        totalIngresos={totalIngresos}
        totalEgresos={totalEgresos}
        totalVentasCobradas={ventasCobradas}
      />

      {/* Closing or Movements */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
        </div>
      ) : showClosing ? (
        <ClosingReport
          movements={dayMovements}
          ventasCobradas={ventasCobradas}
          date={format(parseISO(selectedDate), "dd/MM/yyyy")}
        />
      ) : dayMovements.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="Sin movimientos"
          description="No hay movimientos registrados para este día. Registrá un ingreso o egreso para comenzar."
          action={isAdmin ? (
            <Button onClick={() => setDialogOpen(true)} className="bg-indigo-600 hover:bg-indigo-700">
              <Plus className="h-4 w-4 mr-2" /> Registrar movimiento
            </Button>
          ) : null}
        />
      ) : (
        <Card className="border-slate-200/60 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Movimientos del día</h2>
            <span className="text-xs text-slate-400">{dayMovements.length} registros</span>
          </div>
          <div className="divide-y divide-slate-50">
            {dayMovements.map((m) => (
              <div key={m.id} className="px-5 py-3.5 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`h-8 w-8 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${
                    m.type === "ingreso" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                  }`}>
                    {m.type === "ingreso" ? "+" : "−"}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{m.concept}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {m.category && (
                        <span className="text-xs text-slate-400">{categoryLabels[m.category] || m.category}</span>
                      )}
                      {m.notes && (
                        <span className="text-xs text-slate-300">· {m.notes}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`font-semibold text-sm ${m.type === "ingreso" ? "text-emerald-600" : "text-rose-600"}`}>
                    {m.type === "ingreso" ? "+" : "−"}${m.amount.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                  </span>
                  {isAdmin && (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost" size="icon" className="h-7 w-7"
                        onClick={() => { setEditMovement(m); setDialogOpen(true); }}
                      >
                        <Pencil className="h-3 w-3 text-slate-400" />
                      </Button>
                      <Button
                        variant="ghost" size="icon" className="h-7 w-7"
                        onClick={() => setDeleteId(m.id)}
                      >
                        <Trash2 className="h-3 w-3 text-red-400" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <MovementFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        movement={editMovement}
        onSave={handleSave}
        saving={createMutation.isPending || updateMutation.isPending}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar movimiento?</AlertDialogTitle>
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