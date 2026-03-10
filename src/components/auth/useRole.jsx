import { useAuth } from "@/lib/AuthContext.jsx"

export function useRole() {
  const { profile, isAdmin } = useAuth()

  return {
    role: profile?.role ?? null,
    isAdmin: !!isAdmin,
  }
}