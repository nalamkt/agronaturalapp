import { createContext, useContext, useEffect, useState } from "react"
import { supabase } from "./supabaseClient"

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkUser()

    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      checkUser()
    })

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  const checkUser = async () => {
    const { data } = await supabase.auth.getUser()

    if (!data?.user) {
      setUser(null)
      setProfile(null)
      setLoading(false)
      return
    }

    setUser(data.user)

    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", data.user.id)
      .single()

    setProfile(profileData)
    setLoading(false)
  }

  const login = async (email, password) => {
    return supabase.auth.signInWithPassword({
      email,
      password
    })
  }

  const logout = async () => {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        login,
        logout,
        isAdmin: profile?.role === "admin"
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)