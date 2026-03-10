import React, { useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const categoryOptions = {
  ingreso: [
    { value: "venta_manual", label: "Venta manual" },
    { value: "otro_ingreso", label: "Otro ingreso" },
  ],
  egreso: [
    { value: "alquiler", label: "Alquiler" },
    { value: "servicios", label: "Servicios" },
    { value: "personal", label: "Personal / Sueldos" },
    { value: "proveedor", label: "Proveedor" },
    { value: "impuestos", label: "Impuestos" },
    { value: "mantenimiento", label: "Mantenimiento" },
    { value: "otro_egreso", label: "Otro egreso" },
  ],
};

const emptyForm = {
  type: "ingreso",
  concept: "",
  amount: "",
  category: "",
  date: new Date().toISOString().split("T")[0],
  notes: "",
};

export default function MovementFormDialog({ open, onOpenChange, movement, onSave, saving }) {
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (movement) {
      setForm({
        type: movement.type || "ingreso",
        concept: movement.concept || "",
        amount: movement.amount ?? "",
        category: movement.category || "",
        date: movement.date || new Date().toISOString().split("T")[0],
        notes: movement.notes || "",
      });
    } else {
      setForm(emptyForm);
    }
  }, [movement, open]);

  const handleTypeChange = (type) => {
    setForm({ ...form, type, category: "" });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...form, amount: parseFloat(form.amount) || 0 });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{movement ? "Editar movimiento" : "Nuevo movimiento"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tipo */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleTypeChange("ingreso")}
              className={`py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
                form.type === "ingreso"
                  ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                  : "border-slate-200 bg-white text-slate-400 hover:border-slate-300"
              }`}
            >
              + Ingreso
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange("egreso")}
              className={`py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
                form.type === "egreso"
                  ? "border-rose-500 bg-rose-50 text-rose-700"
                  : "border-slate-200 bg-white text-slate-400 hover:border-slate-300"
              }`}
            >
              − Egreso
            </button>
          </div>

          <div className="space-y-2">
            <Label>Concepto *</Label>
            <Input
              value={form.concept}
              onChange={(e) => setForm({ ...form, concept: e.target.value })}
              placeholder="Descripción del movimiento"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Monto *</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder="0.00"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Fecha *</Label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Categoría</Label>
            <Select
              value={form.category}
              onValueChange={(v) => setForm({ ...form, category: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar categoría" />
              </SelectTrigger>
              <SelectContent>
                {categoryOptions[form.type].map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Notas</Label>
            <Textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Notas adicionales..."
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving} className="bg-indigo-600 hover:bg-indigo-700">
              {saving ? "Guardando..." : movement ? "Actualizar" : "Registrar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}