import React, { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog.jsx"
import { Input } from "@/components/ui/input.jsx"
import { Label } from "@/components/ui/label.jsx"
import { Button } from "@/components/ui/button.jsx"
import { Textarea } from "@/components/ui/textarea.jsx"

const emptyClient = {
  legacy_code: "",
  name: "",
  legal_name: "",
  fantasy_name: "",
  cuit: "",
  tax_status: "",
  contact_name: "",
  phone: "",
  email: "",
  commercial_address: "",
  locality: "",
  province: "",
  billing_notes: "",
  claims_contact: "",
  salesperson: "",
  notes: "",
}

function parseAddress(address = "") {
  const parts = address.split("|").map((p) => p.trim())
  return {
    commercial_address: parts[0] || "",
    locality: parts[1] || "",
    province: parts[2] || "",
  }
}

export default function ClientFormDialog({ open, onOpenChange, client, onSave, saving }) {
  const [form, setForm] = useState(emptyClient)

  useEffect(() => {
    if (client) {
      const parsedAddress = parseAddress(client.address)

      setForm({
        legacy_code: client.legacy_code ?? "",
        name: client.name || "",
        legal_name: client.legal_name || "",
        fantasy_name: client.fantasy_name || "",
        cuit: client.cuit || "",
        tax_status: client.tax_status || "",
        contact_name: client.contact_name || "",
        phone: client.phone || "",
        email: client.email || "",
        commercial_address: parsedAddress.commercial_address,
        locality: parsedAddress.locality,
        province: parsedAddress.province,
        billing_notes: client.billing_notes || "",
        claims_contact: client.claims_contact || "",
        salesperson: client.salesperson || "",
        notes: client.notes || "",
      })
    } else {
      setForm(emptyClient)
    }
  }, [client, open])

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    const finalName =
      form.fantasy_name?.trim() ||
      form.legal_name?.trim() ||
      form.name?.trim()

    onSave({
      legacy_code: form.legacy_code ? Number(form.legacy_code) : null,
      name: finalName,
      legal_name: form.legal_name?.trim() || null,
      fantasy_name: form.fantasy_name?.trim() || null,
      cuit: form.cuit?.trim() || null,
      tax_status: form.tax_status?.trim() || null,
      contact_name: form.contact_name?.trim() || null,
      phone: form.phone?.trim() || null,
      email: form.email?.trim() || null,
      address: [
        form.commercial_address?.trim() || "",
        form.locality?.trim() || "",
        form.province?.trim() || "",
      ].join(" | "),
      billing_notes: form.billing_notes?.trim() || null,
      claims_contact: form.claims_contact?.trim() || null,
      salesperson: form.salesperson?.trim() || null,
      notes: form.notes?.trim() || null,
      active: true,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{client ? "Editar cliente" : "Nuevo cliente"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="legacy_code">Código cliente</Label>
              <Input
                id="legacy_code"
                type="number"
                value={form.legacy_code}
                onChange={(e) => handleChange("legacy_code", e.target.value)}
                placeholder="Ej: 293"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="fantasy_name">Nombre fantasía</Label>
              <Input
                id="fantasy_name"
                value={form.fantasy_name}
                onChange={(e) => handleChange("fantasy_name", e.target.value)}
                placeholder="Nombre visible"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="legal_name">Razón social</Label>
            <Input
              id="legal_name"
              value={form.legal_name}
              onChange={(e) => handleChange("legal_name", e.target.value)}
              placeholder="Razón social"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cuit">CUIT</Label>
              <Input
                id="cuit"
                value={form.cuit}
                onChange={(e) => handleChange("cuit", e.target.value)}
                placeholder="30-12345678-9"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tax_status">Condición IVA</Label>
              <Input
                id="tax_status"
                value={form.tax_status}
                onChange={(e) => handleChange("tax_status", e.target.value)}
                placeholder="Responsable Inscripto"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="salesperson">Vendedor</Label>
              <Input
                id="salesperson"
                value={form.salesperson}
                onChange={(e) => handleChange("salesperson", e.target.value)}
                placeholder="Isi"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contact_name">Contacto</Label>
              <Input
                id="contact_name"
                value={form.contact_name}
                onChange={(e) => handleChange("contact_name", e.target.value)}
                placeholder="Nombre del contacto"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                value={form.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                placeholder="11..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Mail</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="mail@cliente.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="commercial_address">Dirección comercial</Label>
              <Input
                id="commercial_address"
                value={form.commercial_address}
                onChange={(e) => handleChange("commercial_address", e.target.value)}
                placeholder="Calle, altura, etc."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="locality">Localidad</Label>
              <Input
                id="locality"
                value={form.locality}
                onChange={(e) => handleChange("locality", e.target.value)}
                placeholder="Tapiales"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="province">Provincia</Label>
              <Input
                id="province"
                value={form.province}
                onChange={(e) => handleChange("province", e.target.value)}
                placeholder="Buenos Aires"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="claims_contact">Contacto reclamos</Label>
              <Input
                id="claims_contact"
                value={form.claims_contact}
                onChange={(e) => handleChange("claims_contact", e.target.value)}
                placeholder="Contacto de reclamos"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="billing_notes">Notas de facturación</Label>
            <Textarea
              id="billing_notes"
              value={form.billing_notes}
              onChange={(e) => handleChange("billing_notes", e.target.value)}
              placeholder="Observaciones para facturación"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas internas</Label>
            <Textarea
              id="notes"
              value={form.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              placeholder="Notas internas del cliente"
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving} className="bg-indigo-600 hover:bg-indigo-700">
              {saving ? "Guardando..." : client ? "Actualizar" : "Crear"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}