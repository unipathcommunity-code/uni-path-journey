import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";
import { LanguageProvider } from "@/hooks/useLanguage";
import { OrganizationProvider } from "@/hooks/useOrganization";
import { BranchProvider } from "@/hooks/useBranch";
import { FeatureFlagProvider } from "@/hooks/useFeatureFlag";
import ProtectedRoute from "@/components/ProtectedRoute";
import RoleHome from "@/components/RoleHome";
import Landing from "./pages/Landing";
import Pricing from "./pages/Pricing";
import PricingPlans from "./pages/PricingPlans";
import StudentDashboard from "./pages/StudentDashboard";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import AdminDashboard from "./pages/AdminDashboard";
import OwnerDashboard from "./pages/OwnerDashboard";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import Demo from "./pages/Demo";
import StudentEvolution from "./pages/StudentEvolution";
import NovaStore from "./pages/NovaStore";
import ParentMirror from "./pages/ParentMirror";
import TeacherDashboard from "./pages/TeacherDashboard";
import Profile from "./pages/Profile";
import AccountantDashboard from "./pages/AccountantDashboard";
import WebsiteBuilder from "./pages/WebsiteBuilder";
import PublicSite from "./pages/PublicSite";
import PublicPage from "./pages/PublicPage";
import SiteLogin from "./pages/SiteLogin";
import NotFound from "./pages/NotFound";
import FeatureGate from "@/components/FeatureGate";
import TestTake from "./pages/TestTake";
import CertificateVerify from "./pages/CertificateVerify";

import ErrorBoundary from "@/components/ErrorBoundary";
import OfflineDetector from "@/components/OfflineDetector";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
    mutations: { retry: 1 },
  },
});

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <LanguageProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <OfflineDetector />
            <BrowserRouter basename="/nova">
              <AuthProvider>
                <OrganizationProvider>
                  <BranchProvider>
                  <FeatureFlagProvider>
                  <Routes>
                    {/* Public */}
                    <Route path="/" element={<Landing />} />
                    <Route path="/pricing" element={<Pricing />} />
                    <Route path="/plans" element={<PricingPlans />} />
                    <Route path="/demo" element={<Demo />} />
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="/c/:slug" element={<PublicSite />} />
                    <Route path="/c/:slug/login" element={<SiteLogin />} />
                    <Route path="/c/:slug/:pageSlug" element={<PublicPage />} />
                    <Route path="/site/:slug" element={<PublicSite />} />
                    <Route path="/site/:slug/login" element={<SiteLogin />} />
                    <Route path="/site/:slug/p/:pageSlug" element={<PublicPage />} />
                    <Route path="/verify/:token" element={<CertificateVerify />} />

                    {/* Authenticated */}
                    <Route path="/app" element={<ProtectedRoute><RoleHome><StudentDashboard /></RoleHome></ProtectedRoute>} />
                    <Route path="/student" element={<ProtectedRoute><StudentDashboard /></ProtectedRoute>} />
                    <Route path="/superadmin" element={<ProtectedRoute requiredRole="superadmin"><SuperAdminDashboard /></ProtectedRoute>} />
                    <Route path="/owner" element={<ProtectedRoute requiredRole="owner"><OwnerDashboard /></ProtectedRoute>} />
                    <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />
                    <Route path="/evolution" element={<ProtectedRoute><StudentEvolution /></ProtectedRoute>} />
                    <Route
                      path="/store"
                      element={
                        <ProtectedRoute>
                          <FeatureGate feature="nova_store">
                            <NovaStore />
                          </FeatureGate>
                        </ProtectedRoute>
                      }
                    />
                    <Route path="/teacher" element={<ProtectedRoute requiredRole="teacher"><TeacherDashboard /></ProtectedRoute>} />
                    <Route path="/test/:testId" element={<ProtectedRoute><TestTake /></ProtectedRoute>} />
                    <Route path="/parent" element={<ProtectedRoute requiredRole="parent"><ParentMirror /></ProtectedRoute>} />
                    <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                    <Route path="/accountant" element={<ProtectedRoute><AccountantDashboard /></ProtectedRoute>} />
                    <Route path="/website-builder" element={<ProtectedRoute anyOfRoles={["superadmin", "owner", "admin"]}><WebsiteBuilder /></ProtectedRoute>} />

                    <Route path="*" element={<NotFound />} />
                  </Routes>
                  </FeatureFlagProvider>
                  </BranchProvider>
                </OrganizationProvider>
              </AuthProvider>
            </BrowserRouter>
          </TooltipProvider>
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
