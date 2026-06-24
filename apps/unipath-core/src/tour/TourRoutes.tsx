// TourRoutes — the UniTour route tree, mounted inside the single core router by
// vertical (providers come from core App.tsx). Tour tenants get this whole tree
// at unipath.me — no separate /unitour build.
import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { usePageAnalytics } from "@/hooks/usePageAnalytics";

import TenantPublicPage from "@/pages/TenantPublicPage";
import Auth from "@/pages/Auth";
import ToursPage from "./pages/ToursPage";
import TourDetailPage from "./pages/TourDetailPage";
import BookingPage from "./pages/BookingPage";
import DestinationsPage from "./pages/DestinationsPage";
import AboutPage from "./pages/AboutPage";
import ContactPage from "./pages/ContactPage";
import PrivacyPage from "./pages/PrivacyPage";
import TermsPage from "./pages/TermsPage";
import HotelsPage from "./pages/HotelsPage";
import TransportPage from "./pages/TransportPage";
import NotFound from "./pages/NotFound";
import UserDashboard from "./pages/dashboard/UserDashboard";
import WishlistPage from "./pages/WishlistPage";
import CustomTourPage from "./pages/CustomTourPage";
import AgentRegisterPage from "./pages/AgentRegisterPage";
import OnboardingPage from "./pages/OnboardingPage";
import TravelPlannerPage from "./pages/TravelPlannerPage";

// Operator
import OperatorLayout from "./components/operator/OperatorLayout";
import OperatorDashboard from "./pages/operator/OperatorDashboard";
import OperatorTours from "./pages/operator/OperatorTours";
import OperatorTourNew from "./pages/operator/OperatorTourNew";
import OperatorTourEdit from "./pages/operator/OperatorTourEdit";
import OperatorBookings from "./pages/operator/OperatorBookings";
import OperatorSettings from "./pages/operator/OperatorSettings";

// Admin
import AdminLayout from "./components/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminTours from "./pages/admin/AdminTours";
import AdminToursNew from "./pages/admin/AdminToursNew";
import AdminTourEdit from "./pages/admin/AdminTourEdit";
import AdminDestinations from "./pages/admin/AdminDestinations";
import AdminHotels from "./pages/admin/AdminHotels";
import AdminVehicles from "./pages/admin/AdminVehicles";
import AdminSupport from "./pages/admin/AdminSupport";
import AdminAgents from "./pages/admin/AdminAgents";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminBookings from "./pages/admin/AdminBookings";
import AdminTourAgents from "./pages/admin/AdminTourAgents";
import AdminAccounting from "./pages/admin/AdminAccounting";
import AdminAuditLog from "./pages/admin/AdminAuditLog";
import AdminDocumentControl from "./pages/admin/AdminDocumentControl";
import AdminNotifications from "./pages/admin/AdminNotifications";
import AdminPromoCodes from "./pages/admin/AdminPromoCodes";
import AdminNewsletter from "./pages/admin/AdminNewsletter";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminFeatureToggles from "./pages/admin/AdminFeatureToggles";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminUserControl from "./pages/admin/AdminUserControl";

// Agent
import AgentLayout from "./components/agent/AgentLayout";
import AgentDashboard from "./pages/agent/AgentDashboard";
import AgentTours from "./pages/agent/AgentTours";
import AgentReferrals from "./pages/agent/AgentReferrals";
import AgentClients from "./pages/agent/AgentClients";
import AgentEarnings from "./pages/agent/AgentEarnings";
import AgentAccounting from "./pages/agent/AgentAccounting";
import AgentSettings from "./pages/agent/AgentSettings";

// Tour Companies (Multi-tenant SaaS)
import CompanyLayout from "./components/company/CompanyLayout";
import CompanyDashboard from "./pages/company/CompanyDashboard";
import CompanyBranches from "./pages/company/CompanyBranches";
import CompanyTours from "./pages/company/CompanyTours";
import CompanyTourNew from "./pages/company/CompanyTourNew";
import CompanyTourEdit from "./pages/company/CompanyTourEdit";
import CompanyBookings from "./pages/company/CompanyBookings";
import CompanyLeads from "./pages/company/CompanyLeads";
import CompanyPosts from "./pages/company/CompanyPosts";
import CompanyBranding from "./pages/company/CompanyBranding";
import CompanySite from "./pages/company/CompanySite";
import CompanyTeam from "./pages/company/CompanyTeam";
import CompanyCustomers from "./pages/company/CompanyCustomers";
import CompanyAnalytics from "./pages/company/CompanyAnalytics";
import CompanySettings from "./pages/company/CompanySettings";
import RegisterCompanyPage from "./pages/RegisterCompanyPage";
import CompanyPublicSite from "./pages/CompanyPublicSite";
import AdminTourCompanies from "./pages/admin/AdminTourCompanies";
import AdminSubscriptions from "./pages/admin/AdminSubscriptions";
import AdminTelegramBots from "./pages/admin/AdminTelegramBots";
import AdminBilling from "./pages/admin/AdminBilling";
import AdminFeatureOverrides from "./pages/admin/AdminFeatureOverrides";
import AdminChangeRequests from "./pages/admin/AdminChangeRequests";
import AdminSiteEditor from "./pages/admin/AdminSiteEditor";
import AdminFeatureMatrix from "./pages/admin/AdminFeatureMatrix";

const PageAnalyticsTracker = () => { usePageAnalytics(); return null; };

export default function TourRoutes() {
  return (
    <>
      <PageAnalyticsTracker />
      <Routes>
        {/* Public Routes (home page served by the unified TenantPublicPage) */}
        <Route path="/" element={<TenantPublicPage />} />
        <Route path="/tours" element={<ToursPage />} />
        <Route path="/tours/:id" element={<TourDetailPage />} />
        <Route path="/booking/:id" element={<BookingPage />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/destinations" element={<DestinationsPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/hotels" element={<HotelsPage />} />
        <Route path="/transport" element={<TransportPage />} />
        <Route path="/wishlist" element={<WishlistPage />} />
        <Route path="/custom-tour" element={<CustomTourPage />} />
        <Route path="/travel-planner" element={<TravelPlannerPage />} />
        <Route path="/agent-register" element={<AgentRegisterPage />} />
        <Route path="/register-company" element={<RegisterCompanyPage />} />
        <Route path="/c/:slug" element={<CompanyPublicSite />} />
        <Route path="/s/:slug" element={<CompanyPublicSite />} />
        <Route path="/onboarding" element={<ProtectedRoute><OnboardingPage /></ProtectedRoute>} />

        {/* User Dashboard */}
        <Route path="/dashboard" element={<ProtectedRoute><UserDashboard /></ProtectedRoute>} />

        {/* Operator Panel */}
        <Route
          path="/operator"
          element={
            <ProtectedRoute allowedRoles={["moderator", "admin", "super_admin"]}>
              <OperatorLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<OperatorDashboard />} />
          <Route path="tours" element={<OperatorTours />} />
          <Route path="tours/new" element={<OperatorTourNew />} />
          <Route path="tours/:id/edit" element={<OperatorTourEdit />} />
          <Route path="bookings" element={<OperatorBookings />} />
          <Route path="settings" element={<OperatorSettings />} />
        </Route>

        {/* Admin Panel */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["admin", "super_admin"]}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="bookings" element={<AdminBookings />} />
          <Route path="agents" element={<AdminAgents />} />
          <Route path="tour-agents" element={<AdminTourAgents />} />
          <Route path="tours" element={<AdminTours />} />
          <Route path="tours/new" element={<AdminToursNew />} />
          <Route path="tours/:id/edit" element={<AdminTourEdit />} />
          <Route path="destinations" element={<AdminDestinations />} />
          <Route path="hotels" element={<AdminHotels />} />
          <Route path="vehicles" element={<AdminVehicles />} />
          <Route path="accounting" element={<AdminAccounting />} />
          <Route path="audit-log" element={<AdminAuditLog />} />
          <Route path="document-control" element={<AdminDocumentControl />} />
          <Route path="notifications" element={<AdminNotifications />} />
          <Route path="promo-codes" element={<AdminPromoCodes />} />
          <Route path="newsletter" element={<AdminNewsletter />} />
          <Route path="support" element={<AdminSupport />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="feature-toggles" element={<AdminFeatureToggles />} />
          <Route path="analytics" element={<AdminAnalytics />} />
          <Route path="user-control" element={<AdminUserControl />} />
          <Route path="tour-companies" element={<AdminTourCompanies />} />
          <Route path="subscriptions" element={<AdminSubscriptions />} />
          <Route path="telegram-bots" element={<AdminTelegramBots />} />
          <Route path="billing" element={<AdminBilling />} />
          <Route path="feature-overrides" element={<AdminFeatureOverrides />} />
          <Route path="feature-matrix" element={<AdminFeatureMatrix />} />
          <Route path="change-requests" element={<AdminChangeRequests />} />
          <Route path="site-editor/:companyId" element={<AdminSiteEditor />} />
        </Route>

        {/* Tour Company Panel (Multi-tenant) */}
        <Route
          path="/company"
          element={
            <ProtectedRoute>
              <CompanyLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<CompanyDashboard />} />
          <Route path="branches" element={<CompanyBranches />} />
          <Route path="tours" element={<CompanyTours />} />
          <Route path="tours/new" element={<CompanyTourNew />} />
          <Route path="tours/:id/edit" element={<CompanyTourEdit />} />
          <Route path="bookings" element={<CompanyBookings />} />
          <Route path="leads" element={<CompanyLeads />} />
          <Route path="posts" element={<CompanyPosts />} />
          <Route path="branding" element={<CompanyBranding />} />
          <Route path="site" element={<CompanySite />} />
          <Route path="team" element={<CompanyTeam />} />
          <Route path="customers" element={<CompanyCustomers />} />
          <Route path="analytics" element={<CompanyAnalytics />} />
          <Route path="settings" element={<CompanySettings />} />
        </Route>

        {/* Agent Panel */}
        <Route
          path="/agent"
          element={
            <ProtectedRoute requireAgent>
              <AgentLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AgentDashboard />} />
          <Route path="tours" element={<AgentTours />} />
          <Route path="clients" element={<AgentClients />} />
          <Route path="referrals" element={<AgentReferrals />} />
          <Route path="earnings" element={<AgentEarnings />} />
          <Route path="accounting" element={<AgentAccounting />} />
          <Route path="settings" element={<AgentSettings />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}
