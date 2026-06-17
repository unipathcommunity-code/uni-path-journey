// NovaRoutes — the NOVA (academy) route tree, mounted inside the single core
// router by vertical (providers come from core App.tsx). Academy tenants get
// this whole tree at unipath.me — no separate /nova build.
import { Route, Routes, Navigate } from "react-router-dom";
import ProtectedRoute from "@/components/ProtectedRoute";
import RoleHome from "@/components/RoleHome";
import FeatureGate from "@/components/FeatureGate";

import TenantPublicPage from "@/pages/TenantPublicPage";
import Auth from "@/pages/Auth";
import StudentDashboard from "./pages/StudentDashboard";
import ResetPassword from "./pages/ResetPassword";
import AdminDashboard from "./pages/AdminDashboard";
import OwnerDashboard from "./pages/OwnerDashboard";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
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
import TestTake from "./pages/TestTake";
import CertificateVerify from "./pages/CertificateVerify";

export default function NovaRoutes() {
  return (
    <Routes>
      {/* Public (home page served by the unified TenantPublicPage) */}
      <Route path="/" element={<TenantPublicPage />} />
      <Route path="/pricing" element={<Navigate to="/" replace />} />
      <Route path="/plans" element={<Navigate to="/" replace />} />
      <Route path="/demo" element={<Navigate to="/" replace />} />
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
  );
}
