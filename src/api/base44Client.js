import { supabase } from "@/lib/supabaseClient"

const mapTable = {
  Client: "clients",
  Product: "products",
  CashMovement: "cash_movements",
}

const normalizeRow = (row) => ({
  ...row,
  created_date: row.created_at ?? null,
  updated_date: row.updated_at ?? null,
})

const createEntity = (name) => {
  const table = mapTable[name]

  return {
    async list() {
      const { data, error } = await supabase
        .from(table)
        .select("*")
        .order("created_at", { ascending: false })

      if (error) throw error
      return (data || []).map(normalizeRow)
    },

    async get(id) {
      const { data, error } = await supabase
        .from(table)
        .select("*")
        .eq("id", id)
        .single()

      if (error) throw error
      return normalizeRow(data)
    },

    async create(payload) {
      const { data, error } = await supabase
        .from(table)
        .insert(payload)
        .select()
        .single()

      if (error) throw error
      return normalizeRow(data)
    },

    async update(id, payload) {
      const { data, error } = await supabase
        .from(table)
        .update(payload)
        .eq("id", id)
        .select()
        .single()

      if (error) throw error
      return normalizeRow(data)
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

const saleEntity = {
  async list() {
    const { data: sales, error: salesError } = await supabase
      .from("sales")
      .select("*")
      .order("created_at", { ascending: false })

    if (salesError) throw salesError

    const saleIds = (sales || []).map((s) => s.id)

    let items = []
    if (saleIds.length > 0) {
      const { data: saleItems, error: itemsError } = await supabase
        .from("sale_items")
        .select("*")
        .in("sale_id", saleIds)
        .order("created_at", { ascending: true })

      if (itemsError) throw itemsError
      items = saleItems || []
    }

    return (sales || []).map((sale) => ({
      ...normalizeRow(sale),
      items: items.filter((item) => item.sale_id === sale.id),
    }))
  },

  async get(id) {
    const { data: sale, error: saleError } = await supabase
      .from("sales")
      .select("*")
      .eq("id", id)
      .single()

    if (saleError) throw saleError

    const { data: items, error: itemsError } = await supabase
      .from("sale_items")
      .select("*")
      .eq("sale_id", id)
      .order("created_at", { ascending: true })

    if (itemsError) throw itemsError

    return {
      ...normalizeRow(sale),
      items: items || [],
    }
  },

  async create(payload) {
    const { items = [], ...salePayload } = payload

    const { data: sale, error: saleError } = await supabase
      .from("sales")
      .insert(salePayload)
      .select()
      .single()

    if (saleError) throw saleError

    if (items.length > 0) {
      const rows = items.map((item) => ({
        sale_id: sale.id,
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        subtotal: item.subtotal,
      }))

      const { error: itemsError } = await supabase
        .from("sale_items")
        .insert(rows)

      if (itemsError) throw itemsError
    }

    return this.get(sale.id)
  },

  async update(id, payload) {
    const { items, ...salePayload } = payload

    const { data: sale, error: saleError } = await supabase
      .from("sales")
      .update(salePayload)
      .eq("id", id)
      .select()
      .single()

    if (saleError) throw saleError

    if (items !== undefined) {
      const { error: deleteItemsError } = await supabase
        .from("sale_items")
        .delete()
        .eq("sale_id", id)

      if (deleteItemsError) throw deleteItemsError

      if (items.length > 0) {
        const rows = items.map((item) => ({
          sale_id: id,
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          subtotal: item.subtotal,
        }))

        const { error: insertItemsError } = await supabase
          .from("sale_items")
          .insert(rows)

        if (insertItemsError) throw insertItemsError
      }
    }

    return this.get(id)
  },

  async delete(id) {
    const sale = await this.get(id)

    for (const item of sale.items || []) {
      const { data: product, error: productError } = await supabase
        .from("products")
        .select("*")
        .eq("id", item.product_id)
        .single()

      if (productError) throw productError

      const currentStock = Number(product.stock) || 0
      const quantity = Number(item.quantity) || 0

      const { error: updateStockError } = await supabase
        .from("products")
        .update({
          stock: currentStock + quantity,
        })
        .eq("id", item.product_id)

      if (updateStockError) throw updateStockError
    }

    if ((Number(sale.credit_applied) || 0) > 0) {
      const { data: client, error: clientError } = await supabase
        .from("clients")
        .select("*")
        .eq("id", sale.client_id)
        .single()

      if (clientError) throw clientError

      const currentCredit = Number(client.credit_balance) || 0
      const creditToRestore = Number(sale.credit_applied) || 0

      const { error: updateClientError } = await supabase
        .from("clients")
        .update({
          credit_balance: currentCredit + creditToRestore,
        })
        .eq("id", sale.client_id)

      if (updateClientError) throw updateClientError
    }

    const { error } = await supabase
      .from("sales")
      .delete()
      .eq("id", id)

    if (error) throw error

    return true
  },
}

export const base44 = {
  auth: {
    async me() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return null

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()

      return {
        ...user,
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
    CashMovement: createEntity("CashMovement"),
    Sale: saleEntity,
  },
}