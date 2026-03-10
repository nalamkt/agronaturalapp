import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Plus, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import SaleItemRow from "@/components/sales/SaleItemRow";
import { toast } from "sonner";

const emptyItem = { product_id: "", product_name: "", quantity: 1, unit_price: 0, subtotal: 0 };

export default function NewSale() {
  const urlParams = new URLSearchParams(window.location.search);
  const preselectedClientId = urlParams.get("client_id") || "";

  const [clientId, setClientId] = useState(preselectedClientId);
  const [items, setItems] = useState([{ ...emptyItem }]);
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("pendiente");
  const [saving, setSaving] = useState(false);

  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: () => base44.entities.Client.list(),
  });

  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: () => base44.entities.Product.list(),
  });

  const handleItemChange = (index, updatedItem) => {
    const newItems = [...items];
    newItems[index] = updatedItem;
    setItems(newItems);
  };

  const handleRemoveItem = (index) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const addItem = () => {
    setItems([...items, { ...emptyItem }]);
  };

  const total = items.reduce((sum, item) => sum + (item.subtotal || 0), 0);

  const handleSubmit = async () => {
  if (!clientId) {
    toast.error("Seleccioná un cliente")
    return
  }

  const validItems = items.filter((i) => i.product_id)
  if (validItems.length === 0) {
    toast.error("Agregá al menos un producto")
    return
  }

  try {
    setSaving(true)
    const client = clients.find((c) => c.id === clientId)

    await base44.entities.Sale.create({
      client_id: clientId,
      client_name: client?.name || "",
      items: validItems,
      total,
      status,
      notes,
      sale_date: new Date().toISOString().split("T")[0],
    })

    for (const item of validItems) {
      const product = products.find((p) => p.id === item.product_id)
      if (product) {
        await base44.entities.Product.update(product.id, {
          stock: Math.max(0, product.stock - item.quantity),
        })
      }
    }

    queryClient.invalidateQueries({ queryKey: ["sales"] })
    queryClient.invalidateQueries({ queryKey: ["products"] })

    toast.success("Venta creada exitosamente")
    navigate("/newsale" === window.location.pathname ? "/sales" : "/sales")
  } catch (error) {
    console.error(error)
    toast.error("No se pudo crear la venta")
  } finally {
    setSaving(false)
  }
}

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <Link to={createPageUrl("Sales")}>
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Nueva venta</h1>
          <p className="text-slate-400 text-sm mt-0.5">Completá los datos de la venta</p>
        </div>
      </div>

      {/* Cliente */}
      <Card className="p-5 border-slate-200/60 space-y-4">
        <Label className="text-base font-semibold text-slate-900">Cliente</Label>
        <Select value={clientId} onValueChange={setClientId}>
          <SelectTrigger className="bg-white">
            <SelectValue placeholder="Seleccionar cliente" />
          </SelectTrigger>
          <SelectContent>
            {clients.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Card>

      {/* Productos */}
      <Card className="p-5 border-slate-200/60 space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-base font-semibold text-slate-900">Productos</Label>
          <Button type="button" variant="outline" size="sm" onClick={addItem}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Agregar producto
          </Button>
        </div>

        <div className="space-y-3">
          {items.map((item, index) => (
            <SaleItemRow
              key={index}
              item={item}
              index={index}
              products={products}
              onChange={handleItemChange}
              onRemove={handleRemoveItem}
            />
          ))}
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-100">
          <div className="text-right">
            <p className="text-sm text-slate-400">Total de la venta</p>
            <p className="text-3xl font-bold text-slate-900">
              ${total.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </Card>

      {/* Estado y notas */}
      <Card className="p-5 border-slate-200/60 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Estado de la venta</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pendiente">Pendiente</SelectItem>
                <SelectItem value="cobrada">Cobrada</SelectItem>
                <SelectItem value="cuenta_corriente">Cuenta Corriente</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Notas (opcional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notas adicionales..."
              rows={1}
            />
          </div>
        </div>
      </Card>

      {/* Botón guardar */}
      <div className="flex justify-end gap-3">
        <Link to={createPageUrl("Sales")}>
          <Button variant="outline">Cancelar</Button>
        </Link>
        <Button
          onClick={handleSubmit}
          disabled={saving}
          className="bg-indigo-600 hover:bg-indigo-700"
        >
          <ShoppingCart className="h-4 w-4 mr-2" />
          {saving ? "Creando venta..." : "Crear venta"}
        </Button>
      </div>
    </div>
  );
}