import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Package, ShoppingCart, Users, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import StatCard from "@/components/dashboard/StatCard";
import StatusBadge from "@/components/shared/StatusBadge";
import { format } from "date-fns";

export default function Dashboard() {
  const { data: products = [], isLoading: loadingProducts } = useQuery({
    queryKey: ["products"],
    queryFn: () => base44.entities.Product.list(),
  });

  const { data: sales = [], isLoading: loadingSales } = useQuery({
    queryKey: ["sales"],
    queryFn: () => base44.entities.Sale.list("-created_date", 50),
  });

  const { data: clients = [], isLoading: loadingClients } = useQuery({
    queryKey: ["clients"],
    queryFn: () => base44.entities.Client.list(),
  });

  const isLoading = loadingProducts || loadingSales || loadingClients;

  const totalStock = products.reduce((sum, p) => sum + (p.stock || 0), 0);
  const lowAgroAppducts = products.filter((p) => p.stock <= 5 && p.active !== false);
  const pendingSales = sales.filter((s) => s.status === "pendiente" || s.status === "cuenta_corriente");
  const totalDebt = pendingSales.reduce((sum, s) => sum + (s.total || 0), 0);
  const recentSales = sales.slice(0, 5);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
        <p className="text-slate-400 text-sm mt-1">Resumen general de tu negocio</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Productos"
          value={products.length}
          subtitle={`${totalStock} unidades en stock`}
          icon={Package}
          color="indigo"
        />
        <StatCard
          title="Ventas totales"
          value={sales.length}
          subtitle={`${pendingSales.length} pendientes`}
          icon={ShoppingCart}
          color="emerald"
        />
        <StatCard
          title="Clientes"
          value={clients.length}
          icon={Users}
          color="amber"
        />
        <StatCard
          title="Deuda total"
          value={`$${totalDebt.toLocaleString("es-AR", { minimumFractionDigits: 2 })}`}
          subtitle={`${pendingSales.length} ventas sin cobrar`}
          icon={AlertTriangle}
          color="rose"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Últimas ventas */}
        <Card className="border-slate-200/60">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Últimas ventas</h2>
            <Link to={createPageUrl("Sales")}>
              <Button variant="ghost" size="sm" className="text-indigo-600 hover:text-indigo-700">
                Ver todas
              </Button>
            </Link>
          </div>
          <div className="divide-y divide-slate-50">
            {recentSales.length === 0 ? (
              <p className="p-5 text-sm text-slate-400 text-center">No hay ventas aún</p>
            ) : (
              recentSales.map((sale) => (
                <div key={sale.id} className="px-5 py-3 flex items-center justify-between hover:bg-slate-25 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{sale.client_name}</p>
                    <p className="text-xs text-slate-400">
                      {sale.sale_date ? format(new Date(sale.sale_date), "dd/MM/yyyy") : format(new Date(sale.created_date), "dd/MM/yyyy")}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={sale.status} />
                    <span className="text-sm font-semibold text-slate-900">
                      ${sale.total?.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Productos con bajo stock */}
        <Card className="border-slate-200/60">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Stock bajo</h2>
            <Link to={createPageUrl("Products")}>
              <Button variant="ghost" size="sm" className="text-indigo-600 hover:text-indigo-700">
                Ver productos
              </Button>
            </Link>
          </div>
          <div className="divide-y divide-slate-50">
            {lowAgroAppducts.length === 0 ? (
              <p className="p-5 text-sm text-slate-400 text-center">Todo el stock está bien</p>
            ) : (
              lowAgroAppducts.slice(0, 5).map((product) => (
                <div key={product.id} className="px-5 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{product.name}</p>
                    {product.sku && <p className="text-xs text-slate-400">SKU: {product.sku}</p>}
                  </div>
                  <span className={`text-sm font-semibold ${product.stock === 0 ? "text-red-600" : "text-amber-600"}`}>
                    {product.stock} uds.
                  </span>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}