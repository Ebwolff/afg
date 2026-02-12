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
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 60 * 24, // 24 hours
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
            <Suspense fallback={<div className="flex items-center justify-center h-screen">Carregando...</div>}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/financeiro" element={<Financeiro />} />
                <Route path="/contas-pagar" element={<ContasPagar />} />
                <Route path="/contas-receber" element={<ContasReceber />} />
                <Route path="/tasks" element={<TasksPage />} />
                <Route path="/atendimentos" element={<Atendimentos />} />
                <Route path="/clientes" element={<Clientes />} />
                <Route path="/produtos" element={<Produtos />} />
                <Route path="/agenda" element={<Agenda />} />
                <Route path="/simulador" element={<SimuladorConsorcio />} />
                <Route path="/relatorios" element={<Relatorios />} />
                <Route path="/banners" element={<Banners />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </HashRouter>
        </ErrorBoundary>
      </TooltipProvider>
    </RealtimeSyncProvider>
  </PersistQueryClientProvider>
);

export default App;
