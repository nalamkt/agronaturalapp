import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Plus, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import SaleItemRow from "@/components/sales/SaleItemRow";
import { toast } from "sonner";

const emptyItem = { product_id: "", product_name: "", quantity: 1, unit_price: 0, subtotal: 0 };

export default function EditSale() {
  const urlParams = new URLSearchParams(window.location.search);
  const saleId = urlParams.get("id");

  const [clientId, setClientId] = useState("");
  const [items, setItems] = useState([{ ...emptyItem }]);
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("pendiente");
  const [originalSale, setOriginalSale] = useState(null);
  const [initialized, setInitialized] = useState(false);
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

  const { data: saleData, isLoading: loadingSale } = useQuery({
    queryKey: ["sale", saleId],
    queryFn: () => base44.entities.Sale.list().then((list) => list.find((s) => s.id === saleId)),
    enabled: !!saleId,
  });

  useEffect(() => {
    if (saleData && !initialized) {
      setClientId(saleData.client_id || "");
      setItems(saleData.items?.length ? saleData.items : [{ ...emptyItem }]);
      setNotes(saleData.notes || "");
      setStatus(saleData.status || "pendiente");
      setOriginalSale(saleData);
      setInitialized(true);
    }
  }, [saleData, initialized]);

  // Effective products: add back original quantities so the stock selector is correct
  const effectiveProducts = useMemo(() => {
    if (!originalSale) return products;
    const bonus = {};
    for (const item of originalSale.items || []) {
      bonus[item.product_id] = (bonus[item.product_id] || 0) + item.quantity;
    }
    return products.map((p) => ({ ...p, stock: p.stock + (bonus[p.id] || 0) }));
  }, [products, originalSale]);

  const handleItemChange = (index, updatedItem) => {
    const newItems = [...items];
    newItems[index] = updatedItem;
    setItems(newItems);
  };

  const handleRemoveItem = (index) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const total = items.reduce((sum, item) => sum + (item.subtotal || 0), 0);

  const handleSubmit = async () => {
    if (!clientId) { toast.error("Seleccioná un cliente"); return; }
    const validItems = items.filter((i) => i.product_id);
    if (validItems.length === 0) { toast.error("Agregá al menos un producto"); return; }

    setSaving(true);
    const client = clients.find((c) => c.id === clientId);

    // Calculate net stock changes: original items restore (+), new items deduct (-)
    const stockChanges = {};
    for (const item of originalSale?.items || []) {
      stockChanges[item.product_id] = (stockChanges[item.product_id] || 0) + item.quantity;
    }
    for (const item of validItems) {
      stockChanges[item.product_id] = (stockChanges[item.product_id] || 0) - item.quantity;
    }

    for (const [productId, change] of Object.entries(stockChanges)) {
      const realStock = products.find((p) => p.id === productId)?.stock ?? 0;
      await base44.entities.Product.update(productId, {
        stock: Math.max(0, realStock + change),
      });
    }

    await base44.entities.Sale.update(saleId, {
      client_id: clientId,
      client_name: client?.name || "",
      items: validItems,
      total,
      status,
      notes,
    });

    queryClient.invalidateQueries({ queryKey: ["sales"] });
    queryClient.invalidateQueries({ queryKey: ["products"] });
    queryClient.invalidateQueries({ queryKey: ["sale", saleId] });

    toast.success("Venta actualizada");
    navigate(createPageUrl("Sales"));
  };

  if (loadingSale && !initialized) {
    return (
      <div className="space-y-4 max-w-3xl">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
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
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Editar venta</h1>
          <p className="text-slate-400 text-sm mt-0.5">Modificá los datos de la venta</p>
        </div>
      </div>

      <Card className="p-5 border-slate-200/60 space-y-4">
        <Label className="text-base font-semibold text-slate-900">Cliente</Label>
        <Select value={clientId} onValueChange={setClientId}>
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar cliente" />
          </SelectTrigger>
          <SelectContent>
            {clients.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Card>

      <Card className="p-5 border-slate-200/60 space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-base font-semibold text-slate-900">Productos</Label>
          <Button type="button" variant="outline" size="sm" onClick={() => setItems([...items, { ...emptyItem }])}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Agregar producto
          </Button>
        </div>
        <div className="space-y-3">
          {items.map((item, index) => (
            <SaleItemRow
              key={index}
              item={item}
              index={index}
              products={effectiveProducts}
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

      <Card className="p-5 border-slate-200/60 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Estado de la venta</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
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

      <div className="flex justify-end gap-3">
        <Link to={createPageUrl("Sales")}>
          <Button variant="outline">Cancelar</Button>
        </Link>
        <Button onClick={handleSubmit} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700">
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Guardando..." : "Guardar cambios"}
        </Button>
      </div>
    </div>
  );
}