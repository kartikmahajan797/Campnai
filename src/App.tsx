import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/dashboard";
import Campaigns from "./pages/Campaigns";
import NewCampaignSuccess from "./components/campaigns/NewCampaignSuccess";
import CampaignDetails from "./components/campaigns/CampaignDetails";
import CampaignCommandCenter from "./components/campaigns/CampaignCommandCenter";
import NotFound from "./pages/NotFound";
import Chat from "./components/chat";
const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider
      defaultTheme="light"
      storageKey="vite-ui-theme"
      attribute="class"
    >
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            {/* <Route path="/" element={<Navigate to="/chat" replace />} /> */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/dashboard" element={<Dashboard />} />
            {/* <Route path="/chat" element={<Chat />} /> */}
            <Route path="/campaigns" element={<Campaigns />} />
            <Route
              path="/campaigns/new/success"
              element={<NewCampaignSuccess />}
            />
            <Route path="/campaigns/:id" element={<CampaignDetails />} />
            <Route
              path="/campaigns/:id/track"
              element={<CampaignCommandCenter />}
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
