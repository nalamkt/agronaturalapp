import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Wallet,
  CreditCard,
  Menu,
  LogOut,
  Shield,
  User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";

const navItems = [
  { name: "Dashboard", page: "Dashboard", icon: LayoutDashboard },
  { name: "Productos", page: "Products", icon: Package },
  { name: "Ventas", page: "Sales", icon: ShoppingCart },
  { name: "Clientes", page: "Clients", icon: Users },
  { name: "Cuenta Corriente", page: "CuentaCorriente", icon: CreditCard },
  { name: "Caja", page: "Cash", icon: Wallet },
];

export default function Layout({ children, currentPageName }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  const isAdmin = currentUser?.role === "admin";

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-64 bg-white border-r border-slate-200 z-50 transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center">
                <Package className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-slate-900 text-lg tracking-tight">AgroApp</h1>
                <p className="text-xs text-slate-400">Gestión de inventario</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => {
              const isActive = currentPageName === item.page;
              return (
                <Link
                  key={item.page}
                  to={createPageUrl(item.page)}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  <item.icon className={`h-[18px] w-[18px] ${isActive ? "text-indigo-600" : ""}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-slate-100 space-y-2">
            {currentUser && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50">
                {isAdmin ? (
                  <Shield className="h-4 w-4 text-indigo-500 shrink-0" />
                ) : (
                  <User className="h-4 w-4 text-slate-400 shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-700 truncate">{currentUser.full_name || currentUser.email}</p>
                  <p className="text-xs text-slate-400">{isAdmin ? "Administrador" : "Usuario"}</p>
                </div>
              </div>
            )}
            <button
              onClick={() => base44.auth.logout()}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all w-full"
            >
              <LogOut className="h-[18px] w-[18px]" />
              Cerrar sesión
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Mobile header */}
        <header className="lg:hidden sticky top-0 z-30 bg-white/80 backdrop-blur-lg border-b border-slate-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-indigo-600 flex items-center justify-center">
                <Package className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold text-slate-900">AgroApp</span>
            </div>
            <div className="w-10" />
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}