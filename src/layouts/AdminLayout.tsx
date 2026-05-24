import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Building2,
  UserSquare2,
  Settings,
  LogOut,
  Activity,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { clearAuth } from "@/features/auth/authSlice";
import { useLogoutMutation } from "@/services/api";

const navItems = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/patients", label: "Patients", icon: UserSquare2 },
  { to: "/admin/wards", label: "Wards", icon: Building2 },
  { to: "/admin/users", label: "Staff", icon: Users },
  { to: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminLayout() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector((s) => s.auth.user);
  const [logout] = useLogoutMutation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  async function handleLogout() {
    try {
      await logout().unwrap();
    } catch {
      // ignore — clear locally regardless
    }
    dispatch(clearAuth());
    navigate("/login", { replace: true });
  }

  return (
    <div className="flex h-screen bg-[var(--cr-bg)] overflow-hidden">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-60 flex flex-col bg-white border-r border-[var(--cr-line)] transition-transform duration-200",
          "md:relative md:z-auto md:translate-x-0 md:shrink-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="px-5 py-5 border-b border-[var(--cr-line)]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[var(--cr-accent)] flex items-center justify-center">
              <Activity size={16} className="text-white" />
            </div>
            <span className="font-display font-bold text-[var(--cr-ink)] text-base">
              CareRound
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                  isActive
                    ? "bg-[var(--cr-accent)]/10 text-[var(--cr-accent)] border-l-2 border-[var(--cr-accent)] pl-[10px]"
                    : "text-[var(--cr-ink-2)] hover:bg-[var(--cr-surface-3)] hover:text-[var(--cr-ink)]"
                )
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Footer: user + logout */}
        <div className="px-4 py-4 border-t border-[var(--cr-line)] flex flex-col gap-2">
          {user && (
            <div className="text-xs text-[var(--cr-muted)] truncate">
              <div className="font-medium text-[var(--cr-ink-2)] truncate">
                {user.firstName} {user.lastName}
              </div>
              <div className="truncate">{user.email}</div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-xs text-[var(--cr-muted)] hover:text-[var(--cr-danger)] transition-colors mt-1"
          >
            <LogOut size={13} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile top bar */}
        <header className="md:hidden h-14 bg-white border-b border-[var(--cr-line)] flex items-center px-4 gap-3 shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 rounded-md text-[var(--cr-ink-2)] hover:bg-[var(--cr-surface-3)]"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[var(--cr-accent)] flex items-center justify-center">
              <Activity size={14} className="text-white" />
            </div>
            <span className="font-display font-bold text-[var(--cr-ink)] text-sm">CareRound</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
