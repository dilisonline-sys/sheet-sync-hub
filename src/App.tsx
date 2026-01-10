import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ChecksProvider } from "@/contexts/ChecksContext";
import { CheckTypesProvider } from "@/contexts/CheckTypesContext";
import { DatabaseProvider } from "@/contexts/DatabaseContext";
import Auth from "@/pages/Auth";
import Dashboard from "@/pages/Dashboard";
import Databases from "@/pages/Databases";
import UserManagement from "@/pages/UserManagement";
import Import from "@/pages/Import";
import DataEntry from "@/pages/DataEntry";
import Reports from "@/pages/Reports";
import DailyReport from "@/pages/DailyReport";
import MonthlyReport from "@/pages/MonthlyReport";
import YearlyReport from "@/pages/YearlyReport";
import Settings from "@/pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <DatabaseProvider>
            <ChecksProvider>
              <CheckTypesProvider>
                <Routes>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/databases" element={<Databases />} />
                  <Route path="/users" element={<UserManagement />} />
                  <Route path="/import" element={<Import />} />
                  <Route path="/data-entry" element={<DataEntry />} />
                  <Route path="/reports" element={<Reports />} />
                  <Route path="/reports/daily" element={<DailyReport />} />
                  <Route path="/reports/monthly" element={<MonthlyReport />} />
                  <Route path="/reports/yearly" element={<YearlyReport />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </CheckTypesProvider>
            </ChecksProvider>
          </DatabaseProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
