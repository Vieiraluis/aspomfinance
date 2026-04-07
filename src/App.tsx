import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuthContext } from "@/contexts/AuthContext";
import Dashboard from "./pages/Dashboard";
import Suppliers from "./pages/Suppliers";
import Payables from "./pages/Payables";
import Receivables from "./pages/Receivables";
import Payments from "./pages/Payments";
import BankAccounts from "./pages/BankAccounts";
import CashFlow from "./pages/CashFlow";
import Reports from "./pages/Reports";
import ReportPayables from "./pages/ReportPayables";
import ReportReceivables from "./pages/ReportReceivables";
import ReportConsolidated from "./pages/ReportConsolidated";
import ReportPaidPayables from "./pages/ReportPaidPayables";
import ReportReceivedPayments from "./pages/ReportReceivedPayments";
import ReportBySupplier from "./pages/ReportBySupplier";
import AllRecords from "./pages/AllRecords";
import Settings from "./pages/Settings";
import Auth from "./pages/Auth";
import HR from "./pages/HR";
import NotFound from "./pages/NotFound";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthContext();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthContext();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/auth" element={<PublicRoute><Auth /></PublicRoute>} />
      <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/suppliers" element={<ProtectedRoute><Suppliers /></ProtectedRoute>} />
      <Route path="/payables" element={<ProtectedRoute><Payables /></ProtectedRoute>} />
      <Route path="/receivables" element={<ProtectedRoute><Receivables /></ProtectedRoute>} />
      <Route path="/payments" element={<ProtectedRoute><Payments /></ProtectedRoute>} />
      <Route path="/bank-accounts" element={<ProtectedRoute><BankAccounts /></ProtectedRoute>} />
      <Route path="/cash-flow" element={<ProtectedRoute><CashFlow /></ProtectedRoute>} />
      <Route path="/all-records" element={<ProtectedRoute><AllRecords /></ProtectedRoute>} />
      <Route path="/hr" element={<ProtectedRoute><HR /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
      <Route path="/reports/payables" element={<ProtectedRoute><ReportPayables /></ProtectedRoute>} />
      <Route path="/reports/receivables" element={<ProtectedRoute><ReportReceivables /></ProtectedRoute>} />
      <Route path="/reports/consolidated" element={<ProtectedRoute><ReportConsolidated /></ProtectedRoute>} />
      <Route path="/reports/paid-payables" element={<ProtectedRoute><ReportPaidPayables /></ProtectedRoute>} />
      <Route path="/reports/received-payments" element={<ProtectedRoute><ReportReceivedPayments /></ProtectedRoute>} />
      <Route path="/reports/by-supplier" element={<ProtectedRoute><ReportBySupplier /></ProtectedRoute>} />
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
