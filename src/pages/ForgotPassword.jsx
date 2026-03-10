import { useState } from "react"
import { Link } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.jsx"
import { Input } from "@/components/ui/input.jsx"
import { Button } from "@/components/ui/button.jsx"
import { supabase } from "@/lib/supabaseClient"
import { toast } from "sonner"

export default function ForgotPassword() {
  const [email, setEmail] = useState("")
  const [sending, setSending] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!email) {
      toast.error("Ingresá un mail")
      return
    }

    try {
      setSending(true)

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) throw error

      toast.success("Si el mail existe, te enviamos un enlace para recuperar la contraseña")
    } catch (error) {
      console.error(error)
      toast.error("No se pudo enviar el mail de recuperación")
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Recuperar contraseña</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="email"
              placeholder="Tu mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Button type="submit" className="w-full" disabled={sending}>
              {sending ? "Enviando..." : "Enviar mail de recuperación"}
            </Button>

            <div className="text-center">
              <Link to="/login" className="text-sm text-slate-500 hover:text-slate-700">
                Volver al login
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}