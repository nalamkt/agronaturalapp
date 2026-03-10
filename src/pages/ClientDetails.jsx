import React, { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import { ArrowLeft, User, Wallet, AlertTriangle, CircleDollarSign } from "lucide-react"
import { base44 } from "@/api/base44Client"
import { createPageUrl } from "@/utils"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import StatusBadge from "@/components/shared/StatusBadge"

const parseAddress = (address = "") => {
  const parts = String(address).split("|").map((p) => p.trim())
  return {
    commercial_address: parts[0] || "—",
    locality: parts[1] || "—",
    province: parts[2] || "—",
  }
}

const formatCurrency = (value) =>
  `$${Number(value || 0).toLocaleString("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`

const getNetSaleAmount = (sale) =>
  Math.max((Number(sale.total) || 0) - (Number(sale.credit_applied) || 0), 0)

export default function ClientDetails() {
  const urlParams = new URLSearchParams(window.location.search)
  const clientId = urlParams.get("id")

  const { data: clients = [], isLoading: loadingClients } = useQuery({
    queryKey: ["clients"],
    queryFn: () => base44.entities.Client.list(),
  })

  const { data: sales = [], isLoading: loadingSales } = useQuery({
    queryKey: ["sales"],
    queryFn: () => base44.entities.Sale.list(),
  })

  const { data: cashMovements = [], isLoading: loadingCash } = useQuery({
    queryKey: ["cash_movements"],
    queryFn: () => base44.entities.CashMovement.list(),
  })

  const client = useMemo(
    () => clients.find((c) => c.id === clientId),
    [clients, clientId]
  )

  const clientSales = useMemo(
    () =>
      sales
        .filter((s) => s.client_id === clientId)
        .sort((a, b) => new Date(b.sale_date || b.created_date) - new Date(a.sale_date || a.created_date)),
    [sales, clientId]
  )

  const debtSales = useMemo(
    () =>
      clientSales.filter(
        (s) => s.status === "pendiente" || s.status === "cuenta_corriente"
      ),
    [clientSales]
  )

  const totalDebt = useMemo(
    () => debtSales.reduce((sum, s) => sum + getNetSaleAmount(s), 0),
    [debtSales]
  )

  const creditBalance = Number(client?.credit_balance) || 0
  const balance = creditBalance - totalDebt

  const clientCashMovements = useMemo(() => {
    const saleIds = new Set(clientSales.map((s) => s.id))
    return cashMovements.filter((m) => m.related_sale_id && saleIds.has(m.related_sale_id))
  }, [cashMovements, clientSales])

  const address = parseAddress(client?.address)

  if (loadingClients || loadingSales || loadingCash) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-56" />
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    )
  }

  if (!client) {
    return (
      <div className="space-y-4">
        <Link to={createPageUrl("Clients")}>
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a clientes
          </Button>
        </Link>
        <Card className="p-6">
          <p className="text-slate-500">Cliente no encontrado.</p>
        </Card>
      </div>
    )
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
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {client.fantasy_name || client.name}
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">
            Detalle histórico del cliente
          </p>
        </div>
      </div>

      <Card className="p-5 border-slate-200/60">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <User className="h-4 w-4 text-slate-500" />
              <p className="text-sm font-semibold text-slate-800">Datos</p>
            </div>
            <div className="space-y-1 text-sm text-slate-600">
              <p><span className="font-medium">Código:</span> {client.legacy_code || "—"}</p>
              <p><span className="font-medium">Razón social:</span> {client.legal_name || "—"}</p>
              <p><span className="font-medium">CUIT:</span> {client.cuit || "—"}</p>
              <p><span className="font-medium">IVA:</span> {client.tax_status || "—"}</p>
              <p><span className="font-medium">Contacto:</span> {client.contact_name || "—"}</p>
              <p><span className="font-medium">Tel:</span> {client.phone || "—"}</p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="h-4 w-4 text-emerald-600" />
              <p className="text-sm font-semibold text-slate-800">Saldo a favor</p>
            </div>
            <p className="text-2xl font-bold text-emerald-600">
              {formatCurrency(creditBalance)}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <p className="text-sm font-semibold text-slate-800">Deuda actual</p>
            </div>
            <p className="text-2xl font-bold text-red-600">
              {formatCurrency(totalDebt)}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <CircleDollarSign className="h-4 w-4 text-indigo-600" />
              <p className="text-sm font-semibold text-slate-800">Balance</p>
            </div>
            <p
              className={`text-2xl font-bold ${
                balance > 0
                  ? "text-emerald-600"
                  : balance < 0
                  ? "text-red-600"
                  : "text-slate-500"
              }`}
            >
              {balance > 0 ? "+" : ""}
              {formatCurrency(balance)}
            </p>
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-slate-100 text-sm text-slate-600">
          <p><span className="font-medium">Dirección:</span> {address.commercial_address}</p>
          <p><span className="font-medium">Localidad:</span> {address.locality}</p>
          <p><span className="font-medium">Provincia:</span> {address.province}</p>
        </div>
      </Card>

      <Card className="border-slate-200/60 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
          <h2 className="font-semibold text-slate-900">Ventas pendientes / cuenta corriente</h2>
        </div>

        {debtSales.length === 0 ? (
          <div className="p-5 text-sm text-slate-500">No tiene ventas pendientes.</div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/50">
                  <TableHead>Fecha</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Notas</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Crédito aplicado</TableHead>
                  <TableHead className="text-right">Deuda neta</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {debtSales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell className="text-sm text-slate-600">
                      {sale.sale_date || "—"}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={sale.status} />
                    </TableCell>
                    <TableCell className="text-sm text-slate-500">
                      {sale.notes || "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(sale.total)}
                    </TableCell>
                    <TableCell className="text-right text-emerald-600">
                      {formatCurrency(sale.credit_applied || 0)}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-red-600">
                      {formatCurrency(getNetSaleAmount(sale))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      <Card className="border-slate-200/60 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
          <h2 className="font-semibold text-slate-900">Histórico completo de ventas</h2>
        </div>

        {clientSales.length === 0 ? (
          <div className="p-5 text-sm text-slate-500">No hay ventas para este cliente.</div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/50">
                  <TableHead>Fecha</TableHead>
                  <TableHead>Artículos</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Crédito aplicado</TableHead>
                  <TableHead className="text-right">Neto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientSales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell className="text-sm text-slate-600">
                      {sale.sale_date || "—"}
                    </TableCell>
                    <TableCell className="text-sm text-slate-500 max-w-[360px]">
                      {sale.items?.map((i) => `${i.product_name} x${i.quantity}`).join(", ") || "—"}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={sale.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(sale.total)}
                    </TableCell>
                    <TableCell className="text-right text-emerald-600">
                      {formatCurrency(sale.credit_applied || 0)}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(getNetSaleAmount(sale))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      <Card className="border-slate-200/60 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
          <h2 className="font-semibold text-slate-900">Movimientos de caja vinculados</h2>
        </div>

        {clientCashMovements.length === 0 ? (
          <div className="p-5 text-sm text-slate-500">No hay movimientos de caja vinculados.</div>
        ) : (
          <div className="divide-y divide-slate-50">
            {clientCashMovements.map((m) => (
              <div key={m.id} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-900">{m.concept}</p>
                  <p className="text-xs text-slate-400">
                    {m.date} · {m.notes || "Sin notas"}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={m.type === "ingreso"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-red-50 text-red-700 border-red-200"
                  }
                >
                  {m.type === "ingreso" ? "+" : "-"}
                  {formatCurrency(m.amount)}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}