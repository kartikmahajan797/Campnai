import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/dashboard";
import Campaigns from "./pages/Campaigns";
import NewCampaignSuccess from "./components/campaigns/NewCampaignSuccess";
import CampaignDetails from "./components/campaigns/CampaignDetails";
import CampaignCommandCenter from "./components/campaigns/CampaignCommandCenter";
import CampaignHistory from "./components/dashboard/CampaignHistory";
import CampaignFlowPage from "./pages/CampaignFlowPage";
import Account from "./pages/Account";
import NotFound from "./pages/NotFound";
import MaintenancePage from "./pages/MaintenancePage";

const MAINTENANCE = import.meta.env.VITE_MAINTENANCE_MODE === 'true';

// Renders MaintenancePage for any route when maintenance mode is on
const Maintained: React.FC<{ element: React.ReactNode }> = ({ element }) =>
  MAINTENANCE ? <MaintenancePage /> : <>{element}</>;

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme" attribute="class">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Landing always visible */}
            <Route path="/" element={<Index />} />

            {/* Auth & app routes — gated behind maintenance mode */}
            <Route path="/login" element={<Maintained element={<Login />} />} />
            <Route path="/signup" element={<Maintained element={<Signup />} />} />
            <Route path="/dashboard" element={<Maintained element={<Dashboard />} />} />
            <Route path="/dashboard/:sessionId" element={<Maintained element={<Dashboard />} />} />
            <Route path="/dashboard/history" element={<Maintained element={<CampaignHistory />} />} />
            <Route path="/dashboard/account" element={<Maintained element={<Account />} />} />
            <Route path="/campaigns" element={<Maintained element={<Campaigns />} />} />
            <Route path="/campaigns/new/success" element={<Maintained element={<NewCampaignSuccess />} />} />
            <Route path="/campaigns/:id" element={<Maintained element={<CampaignDetails />} />} />
            <Route path="/campaigns/:id/track" element={<Maintained element={<CampaignCommandCenter />} />} />
            <Route path="/campaign/new" element={<Maintained element={<CampaignFlowPage />} />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
