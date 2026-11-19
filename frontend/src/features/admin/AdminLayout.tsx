import { NavLink, useNavigate } from "react-router-dom";

import { useAuth } from "@/features/auth/AuthContext";
import { Button } from "@/components/Button";
import { Logo } from "@/components/Logo";

import type { ReactNode } from "react";

const NAV_ITEMS = [
  {
    to: "/admin",
    label: "Tableau de bord",
    end: true,
    icon: "M3 12l9-9 9 9M5 10v10a1 1 0 0 0 1 1h3v-6h6v6h3a1 1 0 0 0 1-1V10",
  },
  {
    to: "/admin/profiles",
    label: "Profils",
    end: false,
    icon: "M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM4 21a8 8 0 0 1 16 0",
  },
  {
    to: "/admin/safety",
    label: "Alertes",
    end: false,
    icon: "M12 9v2m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z",
  },
  {
    to: "/admin/devices",
    label: "Appareils",
    end: false,
    icon: "M4 5h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zm-1 3v2m18-2v2M7 19h10",
  },
  {
    to: "/admin/security",
    label: "Sécurité",
    end: false,
    icon: "M12 3l8 3v6c0 4.5-3.2 7.7-8 9-4.8-1.3-8-4.5-8-9V6l8-3zm-3 9l2 2 4-4",
  },
];

function NavIcon({ path }: { path: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[var(--size-icon)] w-[var(--size-icon)] shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={path} />
    </svg>
  );
}

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
      <aside className="hidden w-60 flex-col border-r border-border bg-surface lg:flex">
        <div className="border-b border-border px-4 py-4">
          <NavLink to="/admin" aria-label="Lumio — tableau de bord" className="inline-block focus:outline-none">
            <Logo height={34} />
          </NavLink>
        </div>
        <nav aria-label="Navigation admin" className="flex-1 space-y-1 p-3">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-2.5 rounded-button px-3 py-2 text-small font-medium transition-colors duration-fast ease-out focus:outline-none ${
                  isActive
                    ? "bg-primary-light text-primary"
                    : "text-foreground-muted hover:bg-surface-alt hover:text-foreground"
                }`
              }
            >
              <NavIcon path={item.icon} />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-border p-3">
          <Button variant="ghost" size="sm" onClick={handleLogout} className="w-full justify-start">
            <svg
              viewBox="0 0 24 24"
              className="h-[var(--size-icon)] w-[var(--size-icon)]"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
            Déconnexion
          </Button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border bg-surface px-4 py-3 lg:hidden">
          <Logo height={28} />
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            Déconnexion
          </Button>
        </header>

        {/* Mobile nav */}
        <nav
          aria-label="Navigation admin"
          className="flex gap-1 overflow-x-auto border-b border-border bg-surface px-2 py-1 lg:hidden"
        >
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-1.5 whitespace-nowrap rounded-button px-3 py-1.5 text-small font-medium transition-colors duration-fast ${
                  isActive
                    ? "bg-primary-light text-primary"
                    : "text-foreground-muted"
                }`
              }
            >
              <NavIcon path={item.icon} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Content */}
        <main className="flex-1 p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
