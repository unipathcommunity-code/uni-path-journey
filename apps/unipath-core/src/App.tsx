import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { AppProvider, useApp } from "@/contexts/AppContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { TenantProvider } from "@unipath/tenant";
import { SUPER_ADMIN_EMAILS } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { CreditProvider } from "@/contexts/CreditContext";
import { TenantRouter } from "@/core/TenantRouter";
import { CreditPricingModal } from "@/components/CreditPricingModal";
import { SocialProofToasts } from "@/components/SocialProofToasts";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { StudentLayout } from "@/components/layouts/StudentLayout";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { AgentLayout } from "@/components/layouts/AgentLayout";
import { AppBootstrapper } from "@/components/AppBootstrapper";
import { SuperAdminLayout } from "@/components/layouts/SuperAdminLayout";

// Subproject Providers
import { OrganizationProvider } from "@/hooks/useOrganization";
import { BranchProvider } from "@/hooks/useBranch";
import { LanguageProvider } from "@/hooks/useLanguage";
import { FeatureFlagProvider } from "@/hooks/useFeatureFlag";
import { ThemeProvider } from "@/hooks/useTheme";
import { WishlistProvider } from "@/hooks/useWishlist";


// Public Pages
import { LandingPage } from "@/components/landing/landing-page";
import TenantPublicPage from "./pages/TenantPublicPage";
import Onboarding from "./pages/Onboarding";
import Auth from "./pages/Auth";
import About from "./pages/About";
import UniversitySearch from "./pages/UniversitySearch";
import NotFound from "./pages/NotFound";
import DashboardRedirect from "./pages/DashboardRedirect";
import SuperAdminOverview from "./pages/superadmin/SuperAdminOverview";
import SuperAdminDashboard from "./pages/superadmin/SuperAdminDashboard";
import SuperAdminAuth from "./pages/superadmin/SuperAdminAuth";
import SuperAdminUsers from "./pages/superadmin/SuperAdminUsers";
import SuperAdminBilling from "./pages/superadmin/SuperAdminBilling";
import SuperAdminAnalytics from "./pages/superadmin/SuperAdminAnalytics";
import SuperAdminDomains from "./pages/superadmin/SuperAdminDomains";
import SuperAdminNotifications from "./pages/superadmin/SuperAdminNotifications";
import SuperAdminSettings from "./pages/superadmin/SuperAdminSettings";
import Systematize from "./pages/Systematize";
import PendingApproval from "./pages/PendingApproval";


// Student Pages
const StudentDashboard = lazy(() => import("./pages/student/StudentDashboard"));
const StudentApplications = lazy(() => import("./pages/student/StudentApplications"));
const StudentDocuments = lazy(() => import("./pages/student/StudentDocuments"));
const StudentVisa = lazy(() => import("./pages/student/StudentVisa"));
const StudentProfile = lazy(() => import("./pages/student/StudentProfile"));
const StudentGrants = lazy(() => import("./pages/student/StudentGrants"));
const StudentJobs = lazy(() => import("./pages/student/StudentJobs"));
const StudentMentors = lazy(() => import("./pages/student/StudentMentors"));
const StudentHousing = lazy(() => import("./pages/student/StudentHousing"));
const StudentArrival = lazy(() => import("./pages/student/StudentArrival"));

// Added Role Pages
const AccountantDashboard = lazy(() => import("./pages/AccountantDashboard"));

// Website Builder & Public Sites
const WebsiteBuilder = lazy(() => import("./pages/WebsiteBuilder"));
const PublicPricing = lazy(() => import("./pages/PublicPricing"));
const PublicSite = lazy(() => import("./pages/PublicSite"));
const PublicPage = lazy(() => import("./pages/PublicPage"));
const SiteLogin = lazy(() => import("./pages/SiteLogin"));

// Agent Pages
const AgentDashboard = lazy(() => import("./pages/agent/AgentDashboard"));
const AgentStudents = lazy(() => import("./pages/agent/AgentStudents"));
const AgentApplications = lazy(() => import("./pages/agent/AgentApplications"));
const AgentNotes = lazy(() => import("./pages/agent/AgentNotes"));
const AgentTasks = lazy(() => import("./pages/agent/AgentTasks"));

// Admin Pages
const AdminConsulting = lazy(() => import("./pages/admin/AdminConsulting"));
const AdminApplications = lazy(() => import("./pages/admin/AdminApplications"));
const AdminStudents = lazy(() => import("./pages/admin/AdminStudents"));
const AdminDocuments = lazy(() => import("./pages/admin/AdminDocuments"));
const AdminUniversities = lazy(() => import("./pages/admin/AdminUniversities"));
const AdminCountries = lazy(() => import("./pages/admin/AdminCountries"));
const AdminGrants = lazy(() => import("./pages/admin/AdminGrants"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminAnalytics = lazy(() => import("./pages/admin/AdminAnalytics"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));
const AdminNotificationCenter = lazy(() => import("./pages/admin/AdminNotificationCenter"));
const AdminWelcome = lazy(() => import("./pages/admin/AdminWelcome"));
const AdminAnnouncements = lazy(() => import("./pages/admin/AdminAnnouncements"));
const AdminJobs = lazy(() => import("./pages/admin/AdminJobs"));
const AdminMentors = lazy(() => import("./pages/admin/AdminMentors"));
const AdminHousing = lazy(() => import("./pages/admin/AdminHousing"));
const AdminPayments = lazy(() => import("./pages/admin/AdminPayments"));
const AdminArrival = lazy(() => import("./pages/admin/AdminArrival"));
const AdminContactRequests = lazy(() => import("./pages/admin/AdminContactRequests"));
const AdminCRM = lazy(() => import("./pages/admin/AdminCRM"));
const AdminAccounting = lazy(() => import("./pages/admin/AdminAccounting"));

// Owner Hub
const OwnerHub = lazy(() => import("./pages/owner/OwnerHub"));



const queryClient = new QueryClient();

/**
 * Smart root route: if visitor is on a tenant subdomain (activeTenant is set)
 * AND is not authenticated → show the public-facing business website.
 * Otherwise show the main UniPath SaaS landing page.
 */
function TenantRootRoute() {
  const navigate = useNavigate();
  const { activeTenant, isTenantLoading } = useApp();
  const { user, isLoading: authLoading } = useAuth();

  // Check for impersonated tenant from super-admin
  const impersonatedRaw = localStorage.getItem('active_tenant');
  const impersonatedTenant = impersonatedRaw ? (() => { try { return JSON.parse(impersonatedRaw); } catch { return null; } })() : null;
  const effectiveTenant = impersonatedTenant || activeTenant;

  if (isTenantLoading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Get current hostname and determine if it is a core SaaS root domain
  const hostname = window.location.hostname;
  const coreDomains = ['unipath.me', 'unipath.uz', 'localhost', '127.0.0.1', 'vercel.app', 'unipath-journey.vercel.app'];
  const isCoreRoot = hostname === 'unipath.me' || hostname === 'www.unipath.me' ||
                     hostname === 'unipath.uz' || hostname === 'www.unipath.uz' ||
                     hostname === 'localhost' || hostname === '127.0.0.1' ||
                     hostname.endsWith('.vercel.app') || hostname === 'vercel.app' ||
                     hostname === 'unipath-journey.vercel.app' || hostname === 'www.unipath-journey.vercel.app';

  // If strictly on the core root domain and no tenant parameter is present in URL,
  // we must redirect to auth or dashboard, but NEVER show a tenant public page!
  const urlParams = new URLSearchParams(window.location.search);
  const tenantParam = urlParams.get('tenant') || urlParams.get('company');
  const hasTenantOverride = !!(tenantParam || window.sessionStorage.getItem('unipath_session_tenant'));

  if (isCoreRoot && !hasTenantOverride) {
    if (user) {
      return <Navigate to="/dashboard" replace />;
    }
    return (
      <LandingPage 
        onLogin={() => navigate('/auth')} 
        onGetStarted={() => navigate('/tizimlashtirish')} 
      />
    );
  }

  // On a tenant subdomain with no logged-in user → public site
  if (effectiveTenant && !user) {
    const vertical = effectiveTenant?.business_type || effectiveTenant?.config?.business_type || effectiveTenant?.vertical;
    const slug = effectiveTenant?.subdomain || '';
    return <TenantPublicPage />;
  }

  // Authenticated user on tenant subdomain → redirect to their dashboard
  if (effectiveTenant && user) {
    return <Navigate to="/dashboard" replace />;
  }

  // Root domain (unipath.me) → redirect to auth or dashboard
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }
  return (
    <LandingPage 
      onLogin={() => navigate('/auth')} 
      onGetStarted={() => navigate('/tizimlashtirish')} 
    />
  );
}



const App = () => (
  <QueryClientProvider client={queryClient}>
    <ErrorBoundary>
      <ThemeProvider>
        {/* TenantProvider must be outermost so AppProvider can call useTenant() */}
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <TenantProvider client={supabase as any} superAdminEmails={SUPER_ADMIN_EMAILS}>
        <AuthProvider>
        <WishlistProvider>
        <OrganizationProvider>
          <BranchProvider>
            <FeatureFlagProvider>
              <LanguageProvider>
                <AppProvider>
                  <TenantRouter>
                    <CreditProvider>
            <TooltipProvider>
              <CreditPricingModal />
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <SocialProofToasts />
                <AppBootstrapper />
                <Suspense fallback={
                  <div className="min-h-screen flex items-center justify-center bg-[#030712] text-white">
                    <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                }>
                  <Routes>
              {/* Public Routes */}
              <Route path="/" element={<TenantRootRoute />} />
              <Route path="/superadmin" element={<Navigate to="/super-admin" replace />} />
              <Route path="/superadmin/*" element={<Navigate to="/super-admin" replace />} />
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/select-country" element={<Onboarding />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/super-admin/login" element={<SuperAdminAuth />} />
              <Route path="/tizimlashtirish" element={<Systematize />} />
              <Route path="/pending-approval" element={<PendingApproval />} />
              {/* Not authorized route removed - users silently redirected */}
              <Route path="/login" element={<Navigate to="/auth" replace />} />
              <Route path="/register" element={<Navigate to="/auth" replace />} />
              <Route path="/about" element={<About />} />
              <Route path="/pricing" element={<PublicPricing />} />
              <Route path="/plans" element={<PublicPricing />} />
              <Route path="/search" element={<UniversitySearch />} />

              {/* Public Sites generated by Website Builder */}
              <Route path="/c/:slug" element={<PublicSite />} />
              <Route path="/c/:slug/login" element={<SiteLogin />} />
              <Route path="/c/:slug/:pageSlug" element={<PublicPage />} />
              <Route path="/site/:slug" element={<PublicSite />} />
              <Route path="/site/:slug/login" element={<SiteLogin />} />
              <Route path="/site/:slug/p/:pageSlug" element={<PublicPage />} />

              {/* Super Admin Routes - Only for super_admin role */}
              <Route path="/super-admin" element={
                <ProtectedRoute requireSuperAdmin>
                  <SuperAdminLayout>
                    <SuperAdminOverview />
                  </SuperAdminLayout>
                </ProtectedRoute>
              } />
              
              {/* Owner Hub Route */}
              <Route path="/hub" element={
                <ProtectedRoute>
                  <OwnerHub />
                </ProtectedRoute>
              } />

              <Route path="/super-admin/tenants" element={
                <ProtectedRoute requireSuperAdmin>
                  <SuperAdminLayout>
                    <SuperAdminDashboard />
                  </SuperAdminLayout>
                </ProtectedRoute>
              } />
              <Route path="/super-admin/users" element={
                <ProtectedRoute requireSuperAdmin>
                  <SuperAdminLayout>
                    <SuperAdminUsers />
                  </SuperAdminLayout>
                </ProtectedRoute>
              } />
              <Route path="/super-admin/billing" element={
                <ProtectedRoute requireSuperAdmin>
                  <SuperAdminLayout>
                    <SuperAdminBilling />
                  </SuperAdminLayout>
                </ProtectedRoute>
              } />
              <Route path="/super-admin/analytics" element={
                <ProtectedRoute requireSuperAdmin>
                  <SuperAdminLayout>
                    <SuperAdminAnalytics />
                  </SuperAdminLayout>
                </ProtectedRoute>
              } />
              <Route path="/super-admin/domains" element={
                <ProtectedRoute requireSuperAdmin>
                  <SuperAdminLayout>
                    <SuperAdminDomains />
                  </SuperAdminLayout>
                </ProtectedRoute>
              } />
              <Route path="/super-admin/notifications" element={
                <ProtectedRoute requireSuperAdmin>
                  <SuperAdminLayout>
                    <SuperAdminNotifications />
                  </SuperAdminLayout>
                </ProtectedRoute>
              } />
              <Route path="/super-admin/settings" element={
                <ProtectedRoute requireSuperAdmin>
                  <SuperAdminLayout>
                    <SuperAdminSettings />
                  </SuperAdminLayout>
                </ProtectedRoute>
              } />


              {/* Legacy routes redirect to new structure */}
              <Route path="/dashboard" element={<DashboardRedirect />} />
              <Route path="/documents" element={<Navigate to="/student/documents" replace />} />
              <Route path="/applications" element={<Navigate to="/student/applications" replace />} />


              {/* Student Routes (Protected) */}
              <Route
                path="/student/dashboard"
                element={
                  <ProtectedRoute>
                    <StudentLayout>
                      <ErrorBoundary><StudentDashboard /></ErrorBoundary>
                    </StudentLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/student/applications"
                element={
                  <ProtectedRoute>
                    <StudentLayout>
                      <ErrorBoundary><StudentApplications /></ErrorBoundary>
                    </StudentLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/student/documents"
                element={
                  <ProtectedRoute>
                    <StudentLayout>
                      <StudentDocuments />
                    </StudentLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/student/visa"
                element={
                  <ProtectedRoute>
                    <StudentLayout>
                      <StudentVisa />
                    </StudentLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/student/profile"
                element={
                  <ProtectedRoute>
                    <StudentLayout>
                      <StudentProfile />
                    </StudentLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/student/grants"
                element={
                  <ProtectedRoute>
                    <StudentLayout>
                      <StudentGrants />
                    </StudentLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/student/jobs"
                element={
                  <ProtectedRoute>
                    <StudentLayout>
                      <StudentJobs />
                    </StudentLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/student/housing"
                element={
                  <ProtectedRoute>
                    <StudentLayout>
                      <StudentHousing />
                    </StudentLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/student/mentors"
                element={
                  <ProtectedRoute>
                    <StudentLayout>
                      <StudentMentors />
                    </StudentLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/student/arrival"
                element={
                  <ProtectedRoute>
                    <StudentLayout>
                      <StudentArrival />
                    </StudentLayout>
                  </ProtectedRoute>
                }
              />

              {/* Specific Roles */}
              <Route
                path="/accountant"
                element={
                  <ProtectedRoute>
                    <AccountantDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Agent Routes (Protected + Agent Role) */}
              <Route path="/agent" element={<Navigate to="/agent/dashboard" replace />} />
              <Route path="/agent/dashboard" element={<ProtectedRoute requireAgent><AgentLayout><AgentDashboard /></AgentLayout></ProtectedRoute>} />
              <Route path="/agent/students" element={<ProtectedRoute requireAgent><AgentLayout><AgentStudents /></AgentLayout></ProtectedRoute>} />
              <Route path="/agent/applications" element={<ProtectedRoute requireAgent><AgentLayout><AgentApplications /></AgentLayout></ProtectedRoute>} />
              <Route path="/agent/notes" element={<ProtectedRoute requireAgent><AgentLayout><AgentNotes /></AgentLayout></ProtectedRoute>} />
              <Route path="/agent/tasks" element={<ProtectedRoute requireAgent><AgentLayout><AgentTasks /></AgentLayout></ProtectedRoute>} />

              {/* Admin Routes (Protected + Admin Role) - Hidden, direct URL access only */}
              <Route path="/admin/login" element={<Navigate to="/auth" replace />} />
              <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
              
              {/* Secret admin portal entry point */}
              <Route path="/control" element={<Navigate to="/admin/dashboard" replace />} />
              <Route
                path="/admin/dashboard"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminLayout>
                      <AdminConsulting />
                    </AdminLayout>
                  </ProtectedRoute>
                }
              />
              <Route path="/admin/arrival" element={<ProtectedRoute requireAdmin><AdminLayout><AdminArrival /></AdminLayout></ProtectedRoute>} />
              <Route
                path="/admin/applications"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminLayout>
                      <AdminApplications />
                    </AdminLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/students"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminLayout>
                      <AdminStudents />
                    </AdminLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/documents"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminLayout>
                      <AdminDocuments />
                    </AdminLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/universities"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminLayout>
                      <AdminUniversities />
                    </AdminLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/countries"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminLayout>
                      <AdminCountries />
                    </AdminLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/grants"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminLayout>
                      <AdminGrants />
                    </AdminLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/users"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminLayout>
                      <AdminUsers />
                    </AdminLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/analytics"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminLayout>
                      <AdminAnalytics />
                    </AdminLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/announcements"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminLayout>
                      <AdminAnnouncements />
                    </AdminLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/settings"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminLayout>
                      <AdminSettings />
                    </AdminLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/notifications"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminLayout>
                      <AdminNotificationCenter />
                    </AdminLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/welcome"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminWelcome />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/jobs"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminLayout>
                      <AdminJobs />
                    </AdminLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/housing"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminLayout>
                      <AdminHousing />
                    </AdminLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/mentors"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminLayout>
                      <AdminMentors />
                    </AdminLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/payments"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminLayout>
                      <AdminPayments />
                    </AdminLayout>
                  </ProtectedRoute>
                }
              />
              <Route path="/admin/contact-requests" element={<ProtectedRoute requireAdmin><AdminLayout><AdminContactRequests /></AdminLayout></ProtectedRoute>} />
              <Route path="/admin/crm" element={<ProtectedRoute requireAdmin><AdminLayout><AdminCRM /></AdminLayout></ProtectedRoute>} />
              <Route path="/admin/accounting" element={<ProtectedRoute requireAdmin><AdminLayout><AdminAccounting /></AdminLayout></ProtectedRoute>} />
              <Route path="/website-builder" element={<ProtectedRoute><WebsiteBuilder /></ProtectedRoute>} />
              
              <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
          </TooltipProvider>
                  </CreditProvider>
                </TenantRouter>
              </AppProvider>
            </LanguageProvider>
          </FeatureFlagProvider>
        </BranchProvider>
      </OrganizationProvider>
      </WishlistProvider>
      </AuthProvider>
      </TenantProvider>
    </ThemeProvider>
    </ErrorBoundary>
  </QueryClientProvider>
);

export default App;
