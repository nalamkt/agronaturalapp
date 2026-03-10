import { supabase } from "@/lib/supabaseClient"

const mapTable = {
  Client: "clients",
  Product: "products",
  Sale: "sales",
  CashMovement: "cash_movements",
}

const createEntity = (name) => {
  const table = mapTable[name]

  return {
    async list() {
      const { data, error } = await supabase
        .from(table)
        .select("*")
        .order("created_at", { ascending: false })

      if (error) throw error
      return data
    },

    async get(id) {
      const { data, error } = await supabase
        .from(table)
        .select("*")
        .eq("id", id)
        .single()

      if (error) throw error
      return data
    },

    async create(payload) {
      const { data, error } = await supabase
        .from(table)
        .insert(payload)
        .select()
        .single()

      if (error) throw error
      return data
    },

    async update(id, payload) {
      const { data, error } = await supabase
        .from(table)
        .update(payload)
        .eq("id", id)
        .select()
        .single()

      if (error) throw error
      return data
    },

    async delete(id) {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq("id", id)

      if (error) throw error
      return true
    },
  }
}

export const base44 = {
  auth: {
    async me() {
      const { data } = await supabase.auth.getUser()
      if (!data?.user) return null

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", data.user.id)
        .single()

      return {
        ...data.user,
        ...profile,
      }
    },

    async logout() {
      await supabase.auth.signOut()
    },

    redirectToLogin() {
      window.location.href = "/login"
    },
  },

  entities: {
    Client: createEntity("Client"),
    Product: createEntity("Product"),
    Sale: createEntity("Sale"),
    CashMovement: createEntity("CashMovement"),
  },
}