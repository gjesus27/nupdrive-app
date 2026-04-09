import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import LoginPage from "./pages/LoginPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import VeiculosPage from "./pages/VeiculosPage";
import ChecklistPage from "./pages/ChecklistPage";
import CorridaPage from "./pages/CorridaPage";
import AdminDashboard from "./pages/AdminDashboard";
import AdminUsuariosPage from "./pages/AdminUsuariosPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) {
  const { session, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!session) return <Navigate to="/login" replace />;
  if (adminOnly && profile?.tipo !== 'admin') return <Navigate to="/veiculos" replace />;

  return <>{children}</>;
}

function AppRoutes() {
  const { session, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center gradient-primary">
        <div className="text-center">
          <div className="h-10 w-10 mx-auto animate-spin rounded-full border-4 border-primary-foreground border-t-transparent mb-4" />
          <p className="text-primary-foreground/70">Carregando NupDrive...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={session ? <Navigate to={profile?.tipo === 'admin' ? '/admin' : '/veiculos'} replace /> : <LoginPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/veiculos" element={<ProtectedRoute><VeiculosPage /></ProtectedRoute>} />
      <Route path="/checklist/:veiculoId" element={<ProtectedRoute><ChecklistPage /></ProtectedRoute>} />
      <Route path="/corrida/:veiculoId" element={<ProtectedRoute><CorridaPage /></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/usuarios" element={<ProtectedRoute adminOnly><AdminUsuariosPage /></ProtectedRoute>} />
      <Route path="/" element={<Navigate to={session ? (profile?.tipo === 'admin' ? '/admin' : '/veiculos') : '/login'} replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
