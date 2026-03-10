import { Suspense } from "react"
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { AuthProvider } from "@/lib/AuthContext.jsx"
import Layout from "@/Layout.jsx"
import { Toaster } from "@/components/ui/toaster.jsx"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { pagesConfig } from "@/pages.config.js"
import PageNotFound from "@/lib/PageNotFound.jsx"

const queryClient = new QueryClient()
const { Pages, mainPage: mainPageKey, layout: LayoutComponent = Layout } = pagesConfig
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Suspense fallback={<div>Cargando...</div>}>
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
          </Suspense>
          <Toaster />
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App