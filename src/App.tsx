import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
import AllRecords from "./pages/AllRecords";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/suppliers" element={<Suppliers />} />
          <Route path="/payables" element={<Payables />} />
          <Route path="/receivables" element={<Receivables />} />
          <Route path="/payments" element={<Payments />} />
          <Route path="/bank-accounts" element={<BankAccounts />} />
          <Route path="/cash-flow" element={<CashFlow />} />
          <Route path="/all-records" element={<AllRecords />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/reports/payables" element={<ReportPayables />} />
          <Route path="/reports/receivables" element={<ReportReceivables />} />
          <Route path="/reports/consolidated" element={<ReportConsolidated />} />
          <Route path="/reports/paid-payables" element={<ReportPaidPayables />} />
          <Route path="/reports/received-payments" element={<ReportReceivedPayments />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
