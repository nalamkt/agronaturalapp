import React, { useState } from "react"
import { base44 } from "@/api/base44Client"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus, Search, Users, Pencil, Trash2 } from "lucide-react"
import { useRole } from "@/components/auth/useRole"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import ClientFormDialog from "@/components/clients/ClientFormDialog"
import EmptyState from "@/components/shared/EmptyState"

const parseAddress = (address = "") => {
  const parts = String(address).split("|").map((p) => p.trim())

  return {
    commercial_address: parts[0] || "—",
    locality: parts[1] || "—",
    province: parts[2] || "—",
  }
}

export default function Clients() {
  const [search, setSearch] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editClient, setEditClient] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const { isAdmin } = useRole()

  const queryClient = useQueryClient()

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ["clients"],
    queryFn: () => base44.entities.Client.list(),
  })

  const { data: sales = [] } = useQuery({
    queryKey: ["sales"],
    queryFn: () => base44.entities.Sale.list(),
  })

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Client.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] })
      setDialogOpen(false)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Client.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] })
      setDialogOpen(false)
      setEditClient(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Client.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] })
      setDeleteId(null)
    },
  })

  const handleSave = (data) => {
    if (editClient) {
      updateMutation.mutate({ id: editClient.id, data })
    } else {
      createMutation.mutate(data)
    }
  }

  const getClientDebt = (clientId) => {
    return sales
      .filter(
        (s) =>
          s.client_id === clientId &&
          (s.status === "pendiente" || s.status === "cuenta_corriente")
      )
      .reduce((sum, s) => sum + (Number(s.total) || 0), 0)
  }

  const filtered = clients.filter((client) => {
    const q = search.toLowerCase()

    return (
      client.name?.toLowerCase().includes(q) ||
      client.fantasy_name?.toLowerCase().includes(q) ||
      client.legal_name?.toLowerCase().includes(q) ||
      client.cuit?.toLowerCase().includes(q) ||
      client.phone?.toLowerCase().includes(q) ||
      String(client.legacy_code || "").includes(q)
    )
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Clientes
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {clients.length} clientes registrados
          </p>
        </div>

        {isAdmin && (
          <Button
            onClick={() => {
              setEditClient(null)
              setDialogOpen(true)
            }}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nuevo cliente
          </Button>
        )}
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Buscar por nombre, código, CUIT o teléfono..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 && clients.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Sin clientes"
          description="Agregá tu primer cliente para empezar."
          action={
            isAdmin ? (
              <Button
                onClick={() => {
                  setEditClient(null)
                  setDialogOpen(true)
                }}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Agregar cliente
              </Button>
            ) : null
          }
        />
      ) : (
        <Card className="border-slate-200/60 overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/50">
                  <TableHead>Código</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>CUIT</TableHead>
                  <TableHead>Cond. IVA</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Ubicación</TableHead>
                  <TableHead className="text-right">Deuda</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filtered.map((client) => {
                  const parsedAddress = parseAddress(client.address)
                  const debt = getClientDebt(client.id)

                  return (
                    <TableRow key={client.id} className="hover:bg-slate-50/50">
                      <TableCell className="text-slate-500 text-sm">
                        {client.legacy_code || "—"}
                      </TableCell>

                      <TableCell>
                        <div>
                          <p className="font-medium text-slate-900">
                            {client.fantasy_name || client.name}
                          </p>
                          <p className="text-xs text-slate-400">
                            {client.legal_name || "—"}
                          </p>
                        </div>
                      </TableCell>

                      <TableCell className="text-slate-500 text-sm">
                        {client.cuit || "—"}
                      </TableCell>

                      <TableCell className="text-slate-500 text-sm">
                        {client.tax_status || "—"}
                      </TableCell>

                      <TableCell>
                        <div>
                          <p className="text-sm text-slate-700">
                            {client.contact_name || "—"}
                          </p>
                          <p className="text-xs text-slate-400">
                            {client.phone || "—"}
                          </p>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div>
                          <p className="text-sm text-slate-700">
                            {parsedAddress.commercial_address}
                          </p>
                          <p className="text-xs text-slate-400">
                            {parsedAddress.locality} · {parsedAddress.province}
                          </p>
                        </div>
                      </TableCell>

                      <TableCell className="text-right">
                        <span
                          className={`font-medium ${
                            debt > 0 ? "text-amber-600" : "text-slate-400"
                          }`}
                        >
                          $
                          {debt.toLocaleString("es-AR", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {isAdmin && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => {
                                  setEditClient(client)
                                  setDialogOpen(true)
                                }}
                              >
                                <Pencil className="h-3.5 w-3.5 text-slate-500" />
                              </Button>

                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => setDeleteId(client.id)}
                              >
                                <Trash2 className="h-3.5 w-3.5 text-red-500" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {isAdmin && (
        <ClientFormDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          client={editClient}
          onSave={handleSave}
          saving={createMutation.isPending || updateMutation.isPending}
        />
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar cliente?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate(deleteId)}
              className="bg-red-600 hover:bg-red-700"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}