import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/features/auth/AuthContext";

// Auth screens
import { AdminLoginPage } from "@/features/auth/AdminLoginPage";
import { KidSelectPage } from "@/features/auth/KidSelectPage";
import { KidPinPage } from "@/features/auth/KidPinPage";

// Kid screens
import { KidChatPage } from "@/features/kid/KidChatPage";
import { KidConversationsPage } from "@/features/kid/KidConversationsPage";

// Admin screens
import { AdminDashboard } from "@/features/admin/AdminDashboard";
import { AdminProfiles } from "@/features/admin/AdminProfiles";
import { AdminProfileDetail } from "@/features/admin/AdminProfileDetail";
import { AdminConversationView } from "@/features/admin/AdminConversationView";
import { AdminSafetyEvents } from "@/features/admin/AdminSafetyEvents";
import { AdminDevices } from "@/features/admin/AdminDevices";

function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user || user.role !== "admin") return <Navigate to="/admin/login" replace />;
  return <>{children}</>;
}

function RequireKid({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user || user.role !== "kid") return <Navigate to="/select" replace />;
  return <>{children}</>;
}

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="animate-pulse text-foreground-muted text-heading">
        Chargement...
      </div>
    </div>
  );
}

export function AppRouter() {
  return (
    <Routes>
      {/* Public / Auth */}
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route path="/select" element={<KidSelectPage />} />
      <Route path="/pin/:profileId" element={<KidPinPage />} />

      {/* Kid routes */}
      <Route
        path="/chat"
        element={
          <RequireKid>
            <KidConversationsPage />
          </RequireKid>
        }
      />
      <Route
        path="/chat/:conversationId"
        element={
          <RequireKid>
            <KidChatPage />
          </RequireKid>
        }
      />

      {/* Admin routes */}
      <Route
        path="/admin"
        element={
          <RequireAdmin>
            <AdminDashboard />
          </RequireAdmin>
        }
      />
      <Route
        path="/admin/profiles"
        element={
          <RequireAdmin>
            <AdminProfiles />
          </RequireAdmin>
        }
      />
      <Route
        path="/admin/profiles/:profileId"
        element={
          <RequireAdmin>
            <AdminProfileDetail />
          </RequireAdmin>
        }
      />
      <Route
        path="/admin/conversations/:conversationId"
        element={
          <RequireAdmin>
            <AdminConversationView />
          </RequireAdmin>
        }
      />
      <Route
        path="/admin/safety"
        element={
          <RequireAdmin>
            <AdminSafetyEvents />
          </RequireAdmin>
        }
      />
      <Route
        path="/admin/devices"
        element={
          <RequireAdmin>
            <AdminDevices />
          </RequireAdmin>
        }
      />

      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/select" replace />} />
      <Route path="*" element={<Navigate to="/select" replace />} />
    </Routes>
  );
}
