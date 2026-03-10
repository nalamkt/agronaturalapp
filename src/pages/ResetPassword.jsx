import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.jsx"
import { Input } from "@/components/ui/input.jsx"
import { Button } from "@/components/ui/button.jsx"
import { supabase } from "@/lib/supabaseClient"

export default function ResetPassword() {
  const navigate = useNavigate()

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [saving, setSaving] = useState(false)
  const [canReset, setCanReset] = useState(false)
  const [message, setMessage] = useState("")
  const [errorMessage, setErrorMessage] = useState("")

  useEffect(() => {
    const checkSession = async () => {
      const { data, error } = await supabase.auth.getSession()

      if (error) {
        console.error("Error obteniendo sesión:", error)
        setErrorMessage("No se pudo validar el enlace de recuperación.")
        return
      }

      if (data?.session) {
        setCanReset(true)
      } else {
        setErrorMessage("El enlace de recuperación no es válido o venció.")
      }
    }

    checkSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setCanReset(true)
        setErrorMessage("")
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()

    setMessage("")
    setErrorMessage("")

    if (!password || password.length < 6) {
      setErrorMessage("La contraseña debe tener al menos 6 caracteres.")
      return
    }

    if (password !== confirmPassword) {
      setErrorMessage("Las contraseñas no coinciden.")
      return
    }

    try {
      setSaving(true)

      const { data, error } = await supabase.auth.updateUser({
        password,
      })

      console.log("Resultado updateUser:", { data, error })

      if (error) {
        throw error
      }

      setMessage("Contraseña actualizada correctamente. Redirigiendo...")

      setTimeout(() => {
        navigate("/")
      }, 1200)
    } catch (error) {
      console.error("Error actualizando contraseña:", error)
      setErrorMessage(error?.message || "No se pudo actualizar la contraseña.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Nueva contraseña</CardTitle>
        </CardHeader>
        <CardContent>
          {!canReset ? (
            <div className="space-y-3">
              <p className="text-sm text-slate-500">
                Abrí el enlace de recuperación desde tu mail para cambiar la contraseña.
              </p>
              {errorMessage ? (
                <p className="text-sm text-red-600">{errorMessage}</p>
              ) : null}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                type="password"
                placeholder="Nueva contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Input
                type="password"
                placeholder="Repetir nueva contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />

              {errorMessage ? (
                <p className="text-sm text-red-600">{errorMessage}</p>
              ) : null}

              {message ? (
                <p className="text-sm text-green-600">{message}</p>
              ) : null}

              <Button type="submit" className="w-full" disabled={saving}>
                {saving ? "Guardando..." : "Guardar nueva contraseña"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}