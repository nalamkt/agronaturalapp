import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider, useAuth } from "@/lib/AuthContext.jsx"
import Layout from "@/Layout.jsx"
import { Toaster } from "@/components/ui/toaster.jsx"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { pagesConfig } from "@/pages.config.js"
import PageNotFound from "@/lib/PageNotFound.jsx"
import Login from "@/pages/Login.jsx"

const queryClient = new QueryClient()
const { Pages, mainPage: mainPageKey, layout: LayoutComponent = Layout } = pagesConfig
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>

function ProtectedApp() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          <LayoutComponent currentPageName={mainPageKey}>
            <MainPage />
          </LayoutComponent>
        }
      />
      {Object.entries(Pages).map(([key, PageComponent]) => (
        <Route
          key={key}
          path={`/${key.toLowerCase()}`}
          element={
            <LayoutComponent currentPageName={key}>
              <PageComponent />
            </LayoutComponent>
          }
        />
      ))}
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  )
}

function AppRoutes() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to="/" replace /> : <Login />}
      />
      <Route path="/*" element={<ProtectedApp />} />
    </Routes>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <AppRoutes />
          <Toaster />
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  )
}