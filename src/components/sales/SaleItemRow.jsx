import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Trash2 } from "lucide-react";

export default function SaleItemRow({ item, index, products, onChange, onRemove }) {
  const selectedProduct = products.find((p) => p.id === item.product_id);
  const maxStock = selectedProduct ? selectedProduct.stock : 0;

  const handleProductChange = (productId) => {
    const product = products.find((p) => p.id === productId);
    if (product) {
      onChange(index, {
        product_id: product.id,
        product_name: product.name,
        unit_price: product.price,
        quantity: 1,
        subtotal: product.price,
      });
    }
  };

  const handleQuantityChange = (qty) => {
    const quantity = Math.max(1, Math.min(parseInt(qty) || 1, maxStock));
    onChange(index, {
      ...item,
      quantity,
      subtotal: quantity * item.unit_price,
    });
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 bg-slate-50/50 rounded-xl">
      <div className="flex-1 w-full sm:w-auto">
        <Select value={item.product_id || ""} onValueChange={handleProductChange}>
          <SelectTrigger className="bg-white">
            <SelectValue placeholder="Seleccionar producto" />
          </SelectTrigger>
          <SelectContent>
            {products
              .filter((p) => p.active !== false && p.stock > 0)
              .map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  <span>{p.name}</span>
                  <span className="text-slate-400 ml-2">
                    (${p.price?.toLocaleString("es-AR", { minimumFractionDigits: 2 })} — Stock: {p.stock})
                  </span>
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-3 w-full sm:w-auto">
        <div className="w-24">
          <Input
            type="number"
            min="1"
            max={maxStock}
            value={item.quantity}
            onChange={(e) => handleQuantityChange(e.target.value)}
            className="bg-white text-center"
            disabled={!item.product_id}
          />
        </div>

        <div className="w-28 text-right">
          <p className="text-xs text-slate-400">Unitario</p>
          <p className="text-sm font-medium">
            ${(item.unit_price || 0).toLocaleString("es-AR", { minimumFractionDigits: 2 })}
          </p>
        </div>

        <div className="w-28 text-right">
          <p className="text-xs text-slate-400">Subtotal</p>
          <p className="text-sm font-bold text-slate-900">
            ${(item.subtotal || 0).toLocaleString("es-AR", { minimumFractionDigits: 2 })}
          </p>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={() => onRemove(index)}
        >
          <Trash2 className="h-3.5 w-3.5 text-red-500" />
        </Button>
      </div>
    </div>
  );
}