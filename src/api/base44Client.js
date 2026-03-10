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

const getSaleNetAmount = (sale) =>
  Math.max((Number(sale.total) || 0) - (Number(sale.credit_applied) || 0), 0)

const shouldSkipStock = (item) =>
  item?.product_name === "DEUDA INICIAL"

const getClientById = async (clientId) => {
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("id", clientId)
    .single()

  if (error) throw error
  return data
}

const restoreClientCredit = async (clientId, amount) => {
  const restoreAmount = Number(amount) || 0
  if (restoreAmount <= 0) return

  const client = await getClientById(clientId)
  const currentCredit = Number(client.credit_balance) || 0

  const { error } = await supabase
    .from("clients")
    .update({
      credit_balance: currentCredit + restoreAmount,
    })
    .eq("id", clientId)

  if (error) throw error
}

const consumeClientCredit = async (clientId, total) => {
  const client = await getClientById(clientId)
  const currentCredit = Number(client.credit_balance) || 0
  const saleTotal = Number(total) || 0
  const creditApplied = Math.min(currentCredit, saleTotal)

  if (creditApplied > 0) {
    const { error } = await supabase
      .from("clients")
      .update({
        credit_balance: Math.max(currentCredit - creditApplied, 0),
      })
      .eq("id", clientId)

    if (error) throw error
  }

  return creditApplied
}

const restoreStockFromItems = async (items = []) => {
  for (const item of items) {
    if (shouldSkipStock(item)) continue

    const { data: product, error: productError } = await supabase
      .from("products")
      .select("*")
      .eq("id", item.product_id)
      .single()

    if (productError) throw productError

    const currentStock = Number(product.stock) || 0
    const quantity = Number(item.quantity) || 0

    const { error: updateError } = await supabase
      .from("products")
      .update({
        stock: currentStock + quantity,
      })
      .eq("id", item.product_id)

    if (updateError) throw updateError
  }
}

const consumeStockFromItems = async (items = []) => {
  for (const item of items) {
    if (shouldSkipStock(item)) continue

    const { data: product, error: productError } = await supabase
      .from("products")
      .select("*")
      .eq("id", item.product_id)
      .single()

    if (productError) throw productError

    const currentStock = Number(product.stock) || 0
    const quantity = Number(item.quantity) || 0

    if (currentStock < quantity) {
      throw new Error(`Stock insuficiente para ${product.name}`)
    }

    const { error: updateError } = await supabase
      .from("products")
      .update({
        stock: currentStock - quantity,
      })
      .eq("id", item.product_id)

    if (updateError) throw updateError
  }
}

const syncCashMovementForSale = async (sale) => {
  const netAmount = getSaleNetAmount(sale)

  if (sale.status !== "cobrada" || netAmount <= 0) {
    const { error } = await supabase
      .from("cash_movements")
      .delete()
      .eq("related_sale_id", sale.id)

    if (error) throw error
    return
  }

  const payload = {
    related_sale_id: sale.id,
    type: "ingreso",
    concept: `Venta ${sale.client_name || ""}`.trim(),
    amount: netAmount,
    category: "venta_manual",
    date: sale.sale_date || new Date().toISOString().split("T")[0],
    notes: `Movimiento generado automáticamente por venta ${sale.id}`,
  }

  const { error } = await supabase
    .from("cash_movements")
    .upsert(payload, {
      onConflict: "related_sale_id",
    })

  if (error) throw error
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
    const { items = [], credit_applied: _ignoredCreditApplied, ...salePayload } = payload

    await consumeStockFromItems(items)

    const autoCreditApplied = await consumeClientCredit(
      salePayload.client_id,
      salePayload.total
    )

    const finalStatus =
      getSaleNetAmount({
        total: salePayload.total,
        credit_applied: autoCreditApplied,
      }) <= 0
        ? "cobrada"
        : salePayload.status

    const { data: sale, error: saleError } = await supabase
      .from("sales")
      .insert({
        ...salePayload,
        credit_applied: autoCreditApplied,
        status: finalStatus,
      })
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

    const finalSale = await this.get(sale.id)
    await syncCashMovementForSale(finalSale)

    return finalSale
  },

  async update(id, payload) {
    const previousSale = await this.get(id)

    await restoreStockFromItems(previousSale.items || [])
    await restoreClientCredit(previousSale.client_id, previousSale.credit_applied || 0)

    const { items = [], credit_applied: _ignoredCreditApplied, ...salePayload } = payload

    await consumeStockFromItems(items)

    const autoCreditApplied = await consumeClientCredit(
      salePayload.client_id,
      salePayload.total
    )

    const finalStatus =
      getSaleNetAmount({
        total: salePayload.total,
        credit_applied: autoCreditApplied,
      }) <= 0
        ? "cobrada"
        : salePayload.status

    const { data: sale, error: saleError } = await supabase
      .from("sales")
      .update({
        ...salePayload,
        credit_applied: autoCreditApplied,
        status: finalStatus,
      })
      .eq("id", id)
      .select()
      .single()

    if (saleError) throw saleError

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

    const finalSale = await this.get(id)
    await syncCashMovementForSale(finalSale)

    return finalSale
  },

  async delete(id) {
    const sale = await this.get(id)

    await restoreStockFromItems(sale.items || [])
    await restoreClientCredit(sale.client_id, sale.credit_applied || 0)

    const { error: deleteCashError } = await supabase
      .from("cash_movements")
      .delete()
      .eq("related_sale_id", id)

    if (deleteCashError) throw deleteCashError

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