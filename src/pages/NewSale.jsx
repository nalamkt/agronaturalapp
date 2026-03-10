import React, { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { base44 } from "@/api/base44Client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.jsx"
import { Button } from "@/components/ui/button.jsx"
import { Input } from "@/components/ui/input.jsx"
import { Label } from "@/components/ui/label.jsx"
import { Textarea } from "@/components/ui/textarea.jsx"
import { Skeleton } from "@/components/ui/skeleton.jsx"
import { Plus, Trash2 } from "lucide-react"

const emptyItem = {
  product_id: "",
  product_name: "",
  quantity: 1,
  unit_price: 0,
  subtotal: 0,
}

export default function NewSale() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [clientId, setClientId] = useState("")
  const [status, setStatus] = useState("pendiente")
  const [notes, setNotes] = useState("")
  const [saving, setSaving] = useState(false)
  const [items, setItems] = useState([{ ...emptyItem }])

  const { data: clients = [], isLoading: loadingClients } = useQuery({
    queryKey: ["clients"],
    queryFn: () => base44.entities.Client.list(),
  })

  const { data: products = [], isLoading: loadingProducts } = useQuery({
    queryKey: ["products"],
    queryFn: () => base44.entities.Product.list(),
  })

  const { data: sales = [], isLoading: loadingSales } = useQuery({
    queryKey: ["sales"],
    queryFn: () => base44.entities.Sale.list(),
  })

  const selectedClient = useMemo(
    () => clients.find((c) => c.id === clientId),
    [clients, clientId]
  )

  const selectedClientDebtSales = useMemo(() => {
    if (!clientId) return []

    return sales.filter((sale) => {
      if (sale.client_id !== clientId) return false
      return sale.status === "pendiente" || sale.status === "cuenta_corriente"
    })
  }, [sales, clientId])

  const totalDebt = useMemo(() => {
    return selectedClientDebtSales.reduce((acc, sale) => {
      const netDebt = (Number(sale.total) || 0) - (Number(sale.credit_applied) || 0)
      return acc + Math.max(netDebt, 0)
    }, 0)
  }, [selectedClientDebtSales])

  const total = useMemo(() => {
    return items.reduce((acc, item) => acc + (Number(item.subtotal) || 0), 0)
  }, [items])

  const creditBalance = Number(selectedClient?.credit_balance) || 0
  const creditToApply = Math.min(creditBalance, total)
  const remainingAfterCredit = Math.max(total - creditToApply, 0)

  const formatCurrency = (value) =>
    new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 2,
    }).format(Number(value) || 0)

  const addItem = () => {
    setItems((prev) => [...prev, { ...emptyItem }])
  }

  const removeItem = (index) => {
    setItems((prev) => prev.filter((_, i) => i !== index))
  }

  const updateItem = (index, patch) => {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item

        const updated = { ...item, ...patch }
        const quantity = Number(updated.quantity) || 0
        const unitPrice = Number(updated.unit_price) || 0

        return {
          ...updated,
          subtotal: quantity * unitPrice,
        }
      })
    )
  }

  const handleProductChange = (index, productId) => {
    const product = products.find((p) => p.id === productId)

    if (!product) {
      updateItem(index, {
        product_id: "",
        product_name: "",
        unit_price: 0,
        subtotal: 0,
      })
      return
    }

    const currentQty = Number(items[index]?.quantity) || 1

    updateItem(index, {
      product_id: product.id,
      product_name: product.name,
      unit_price: Number(product.price) || 0,
      quantity: currentQty,
      subtotal: currentQty * (Number(product.price) || 0),
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!clientId) {
      toast.error("Seleccioná un cliente")
      return
    }

    const validItems = items.filter((i) => i.product_id && Number(i.quantity) > 0)

    if (validItems.length === 0) {
      toast.error("Agregá al menos un producto")
      return
    }

    for (const item of validItems) {
      const product = products.find((p) => p.id === item.product_id)

      if (!product) {
        toast.error("Hay productos inválidos en la venta")
        return
      }

      if ((Number(product.stock) || 0) < Number(item.quantity)) {
        toast.error(`Stock insuficiente para ${product.name}`)
        return
      }
    }

    try {
      setSaving(true)

      const autoStatus =
        remainingAfterCredit <= 0
          ? "cobrada"
          : status

      const notesWithCredit =
        creditToApply > 0
          ? `${notes ? `${notes} | ` : ""}Saldo a favor aplicado: ${formatCurrency(creditToApply)}`
          : notes

      await base44.entities.Sale.create({
        client_id: clientId,
        client_name: selectedClient?.name || "",
        items: validItems.map((item) => ({
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: Number(item.quantity) || 0,
          unit_price: Number(item.unit_price) || 0,
          subtotal: Number(item.subtotal) || 0,
        })),
        total,
        status,
        notes,
        sale_date: new Date().toISOString().split("T")[0],
      })

      for (const item of validItems) {
        const product = products.find((p) => p.id === item.product_id)

        if (product) {
          await base44.entities.Product.update(product.id, {
            stock: Math.max(0, (Number(product.stock) || 0) - (Number(item.quantity) || 0)),
          })
        }
      }

      if (creditToApply > 0 && selectedClient) {
        await base44.entities.Client.update(selectedClient.id, {
          credit_balance: Math.max(0, creditBalance - creditToApply),
        })
      }

      queryClient.invalidateQueries({ queryKey: ["sales"] })
      queryClient.invalidateQueries({ queryKey: ["products"] })
      queryClient.invalidateQueries({ queryKey: ["clients"] })

      toast.success("Venta creada exitosamente")
      navigate("/sales")
    } catch (error) {
      console.error(error)
      toast.error("No se pudo crear la venta")
    } finally {
      setSaving(false)
    }
  }

  if (loadingClients || loadingProducts || loadingSales) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-56" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-72 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Nueva venta</h1>
        <p className="text-sm text-slate-500 mt-1">Registrá una venta y descontá stock automáticamente</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="border-slate-200/60">
          <CardHeader>
            <CardTitle>Datos de la venta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="client">Cliente</Label>
              <select
                id="client"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="flex h-10 w-full rounded-md border border-slate-200 bg-background px-3 py-2 text-sm"
                required
              >
                <option value="">Seleccionar cliente</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </div>

            {clientId && selectedClientDebtSales.length > 0 && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-3">
                <div>
                  <p className="text-sm font-semibold text-amber-900">
                    Este cliente tiene deuda
                  </p>
                  <p className="text-sm text-amber-800">
                    {selectedClientDebtSales.length} venta{selectedClientDebtSales.length > 1 ? "s" : ""} pendiente{selectedClientDebtSales.length > 1 ? "s" : ""}
                  </p>
                </div>

                <div className="space-y-2">
                  {selectedClientDebtSales.map((sale) => {
                    const netDebt = Math.max((Number(sale.total) || 0) - (Number(sale.credit_applied) || 0), 0)

                    return (
                      <div
                        key={sale.id}
                        className="flex items-center justify-between rounded-lg bg-white/70 px-3 py-2 border border-amber-100"
                      >
                        <div>
                          <p className="text-sm font-medium text-slate-800">
                            Venta #{String(sale.id).slice(0, 8)}
                          </p>
                          <p className="text-xs text-slate-500">
                            Estado: {sale.status}
                          </p>
                        </div>
                        <p className="text-sm font-semibold text-amber-900">
                          {formatCurrency(netDebt)}
                        </p>
                      </div>
                    )
                  })}
                </div>

                <div className="flex items-center justify-between border-t border-amber-200 pt-3">
                  <span className="text-sm font-semibold text-slate-800">Deuda total</span>
                  <span className="text-base font-bold text-amber-900">
                    {formatCurrency(totalDebt)}
                  </span>
                </div>
              </div>
            )}

            {clientId && creditBalance > 0 && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 space-y-3">
                <div>
                  <p className="text-sm font-semibold text-emerald-900">
                    Este cliente tiene saldo a favor
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                  <div className="rounded-lg bg-white/70 border border-emerald-100 p-3">
                    <p className="text-slate-500">Saldo a favor actual</p>
                    <p className="font-semibold text-emerald-900">{formatCurrency(creditBalance)}</p>
                  </div>

                  <div className="rounded-lg bg-white/70 border border-emerald-100 p-3">
                    <p className="text-slate-500">Se aplicará en esta venta</p>
                    <p className="font-semibold text-emerald-900">{formatCurrency(creditToApply)}</p>
                  </div>

                  <div className="rounded-lg bg-white/70 border border-emerald-100 p-3">
                    <p className="text-slate-500">Saldo pendiente luego del crédito</p>
                    <p className="font-semibold text-emerald-900">{formatCurrency(remainingAfterCredit)}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Estado</Label>
                <select
                  id="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-background px-3 py-2 text-sm"
                >
                  <option value="pendiente">Pendiente</option>
                  <option value="cobrada">Cobrada</option>
                  <option value="cuenta_corriente">Cuenta corriente</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label>Total bruto</Label>
                <Input value={formatCurrency(total)} disabled />
              </div>
            </div>

            {creditToApply > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Crédito aplicado</Label>
                  <Input value={formatCurrency(creditToApply)} disabled />
                </div>

                <div className="space-y-2">
                  <Label>Total pendiente</Label>
                  <Input value={formatCurrency(remainingAfterCredit)} disabled />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="notes">Notas</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Observaciones de la venta"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/60">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Productos</CardTitle>
            <Button type="button" onClick={addItem} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Agregar producto
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {items.map((item, index) => {
              const selectedProduct = products.find((p) => p.id === item.product_id)

              return (
                <div
                  key={index}
                  className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end rounded-xl border border-slate-200 p-4"
                >
                  <div className="md:col-span-5 space-y-2">
                    <Label>Producto</Label>
                    <select
                      value={item.product_id}
                      onChange={(e) => handleProductChange(index, e.target.value)}
                      className="flex h-10 w-full rounded-md border border-slate-200 bg-background px-3 py-2 text-sm"
                    >
                      <option value="">Seleccionar producto</option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.legacy_id ? `${product.legacy_id} - ` : ""}
                          {product.name} {product.stock !== undefined ? `(stock: ${product.stock})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2 space-y-2">
                    <Label>Cantidad</Label>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) =>
                        updateItem(index, {
                          quantity: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="md:col-span-2 space-y-2">
                    <Label>Precio</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={item.unit_price}
                      onChange={(e) =>
                        updateItem(index, {
                          unit_price: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="md:col-span-2 space-y-2">
                    <Label>Subtotal</Label>
                    <Input value={formatCurrency(item.subtotal)} disabled />
                  </div>

                  <div className="md:col-span-1 flex justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(index)}
                      disabled={items.length === 1}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>

                  {selectedProduct && (
                    <div className="md:col-span-12">
                      <p className="text-xs text-slate-500">
                        Stock disponible: {selectedProduct.stock ?? 0}
                      </p>
                    </div>
                  )}
                </div>
              )
            })}
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate("/sales")}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving} className="bg-indigo-600 hover:bg-indigo-700">
            {saving ? "Creando venta..." : "Crear venta"}
          </Button>
        </div>
      </form>
    </div>
  )
}