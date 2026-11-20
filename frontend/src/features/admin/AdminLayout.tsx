import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/features/auth/AuthContext";
import type { ReactNode } from "react";

const NAV_ITEMS = [
  { to: "/admin", label: "Tableau de bord", end: true },
  { to: "/admin/profiles", label: "Profils" },
  { to: "/admin/safety", label: "Alertes" },
  { to: "/admin/devices", label: "Appareils" },
  { to: "/admin/security", label: "Sécurité" },
];

export function AdminLayout({ children }: { children: ReactNode }) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/admin/login", { replace: true });
  }

  return (
    <div data-theme="admin" className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="hidden w-56 flex-col border-r border-border bg-surface lg:flex">
        <div className="border-b border-border px-4 py-4">
          <h1 className="text-subheading font-bold text-foreground">
            Lumio Admin
          </h1>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `block rounded-button px-3 py-2 text-small font-medium transition-colors ${
                  isActive
                    ? "bg-primary-light text-primary"
                    : "text-foreground-muted hover:bg-surface-alt hover:text-foreground"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-border p-3">
          <button
            onClick={handleLogout}
            className="w-full rounded-button px-3 py-2 text-left text-small text-foreground-muted hover:bg-surface-alt"
          >
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border bg-surface px-4 py-3 lg:hidden">
          <h1 className="text-subheading font-bold text-foreground">
            Lumio Admin
          </h1>
          <button
            onClick={handleLogout}
            className="text-small text-foreground-muted"
          >
            Déconnexion
          </button>
        </header>

        {/* Mobile nav */}
        <nav className="flex gap-1 overflow-x-auto border-b border-border bg-surface px-2 py-1 lg:hidden">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `whitespace-nowrap rounded-button px-3 py-1.5 text-small font-medium ${
                  isActive
                    ? "bg-primary-light text-primary"
                    : "text-foreground-muted"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Content */}
        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
