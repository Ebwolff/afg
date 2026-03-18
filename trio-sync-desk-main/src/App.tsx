import React, { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createIDBPersister } from "./lib/offline-storage";
import { OfflineSyncManager } from "./components/OfflineSyncManager";
import { RealtimeSyncProvider } from "./components/RealtimeSyncProvider";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { QueryClient } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AuthProvider } from "./hooks/useAuth";
import { HideValuesProvider } from "./hooks/useHideValues";
import { ThemeProvider } from "./hooks/useTheme";

// Lazy-loaded Pages (code splitting)
const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Financeiro = lazy(() => import("./pages/Financeiro"));
const ContasPagar = lazy(() => import("./pages/ContasPagar"));
const ContasReceber = lazy(() => import("./pages/ContasReceber"));
const Atendimentos = lazy(() => import("./pages/Atendimentos"));
const Clientes = lazy(() => import("./pages/Clientes"));
const Produtos = lazy(() => import("./pages/Produtos"));
const Agenda = lazy(() => import("./pages/Agenda"));
const SimuladorConsorcio = lazy(() => import("./pages/SimuladorConsorcio"));
const Relatorios = lazy(() => import("./pages/Relatorios"));
const Banners = lazy(() => import("./pages/Banners"));
const TasksPage = lazy(() => import("./features/tasks/pages/TasksPage"));
const Produtividade = lazy(() => import("./pages/Produtividade"));
const LeadsPage = lazy(() => import("./features/leads/pages/LeadsPage"));
const Administracao = lazy(() => import("./pages/Administracao"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 60 * 24,
    },
  },
});

const persister = createIDBPersister();

const App = () => (
  <PersistQueryClientProvider
    client={queryClient}
    persistOptions={{ persister }}
  >
    <RealtimeSyncProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <OfflineSyncManager />
        <ErrorBoundary>
          <HashRouter>
            <AuthProvider>
              <ThemeProvider>
              <HideValuesProvider>
              <Suspense fallback={<div className="flex items-center justify-center h-screen">Carregando...</div>}>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/dashboard" element={<ProtectedRoute requiredPermission="dashboard"><Dashboard /></ProtectedRoute>} />
                  <Route path="/financeiro" element={<ProtectedRoute requiredPermission="financeiro"><Financeiro /></ProtectedRoute>} />
                  <Route path="/contas-pagar" element={<ProtectedRoute requiredPermission="contas_pagar"><ContasPagar /></ProtectedRoute>} />
                  <Route path="/contas-receber" element={<ProtectedRoute requiredPermission="contas_receber"><ContasReceber /></ProtectedRoute>} />
                  <Route path="/tasks" element={<ProtectedRoute requiredPermission="tasks"><TasksPage /></ProtectedRoute>} />
                  <Route path="/produtividade" element={<ProtectedRoute requiredPermission="produtividade"><Produtividade /></ProtectedRoute>} />
                  <Route path="/leads" element={<ProtectedRoute requiredPermission="leads"><LeadsPage /></ProtectedRoute>} />
                  <Route path="/atendimentos" element={<ProtectedRoute requiredPermission="atendimentos"><Atendimentos /></ProtectedRoute>} />
                  <Route path="/clientes" element={<ProtectedRoute requiredPermission="clientes"><Clientes /></ProtectedRoute>} />
                  <Route path="/produtos" element={<ProtectedRoute requiredPermission="produtos"><Produtos /></ProtectedRoute>} />
                  <Route path="/agenda" element={<ProtectedRoute requiredPermission="agenda"><Agenda /></ProtectedRoute>} />
                  <Route path="/simulador" element={<ProtectedRoute requiredPermission="simulador"><SimuladorConsorcio /></ProtectedRoute>} />
                  <Route path="/relatorios" element={<ProtectedRoute requiredPermission="relatorios"><Relatorios /></ProtectedRoute>} />
                  <Route path="/banners" element={<ProtectedRoute requiredPermission="banners"><Banners /></ProtectedRoute>} />
                  <Route path="/admin" element={<ProtectedRoute><Administracao /></ProtectedRoute>} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
              </HideValuesProvider>
              </ThemeProvider>
            </AuthProvider>
          </HashRouter>
        </ErrorBoundary>
      </TooltipProvider>
    </RealtimeSyncProvider>
  </PersistQueryClientProvider>
);

export default App;

