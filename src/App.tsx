
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Admin from "./pages/Admin";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Project from "./pages/Project";
import DashboardSettings from "./pages/DashboardSettings";
import Team from "./pages/Team";
import AIAssistant from "./pages/AIAssistant";
import UIKit from "./pages/UIKit";
import CodeEditor from "./pages/CodeEditor";
import CLIPage from "./pages/CLIPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/dashboard/project/:id" element={<Project />} />
          <Route path="/dashboard/settings" element={<DashboardSettings />} />
          <Route path="/dashboard/team" element={<Team />} />
          <Route path="/dashboard/project/:id/ai" element={<AIAssistant />} />
          <Route path="/dashboard/ui-kit" element={<UIKit />} />
          <Route path="/dashboard/editor" element={<CodeEditor />} />
          <Route path="/dashboard/cli" element={<CLIPage />} />
          <Route path="/admin" element={<Admin />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;