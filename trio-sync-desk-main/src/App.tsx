import React, { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Lazy load pages
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
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={<div className="flex items-center justify-center h-screen">Carregando...</div>}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/financeiro" element={<Financeiro />} />
            <Route path="/contas-pagar" element={<ContasPagar />} />
            <Route path="/contas-receber" element={<ContasReceber />} />
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
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

