import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Activity, LogOut, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { clearAuth } from "@/features/auth/authSlice";
import { useLogoutMutation } from "@/services/api";
import { useState } from "react";

interface TopNavLayoutProps {
  /** Nav links to show */
  links: { to: string; label: string }[];
}

export default function TopNavLayout({ links }: TopNavLayoutProps) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector((s) => s.auth.user);
  const [logout] = useLogoutMutation();
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleLogout() {
    try {
      await logout().unwrap();
    } catch {
      // clear locally regardless
    }
    dispatch(clearAuth());
    navigate("/login", { replace: true });
  }

  return (
    <div className="min-h-screen bg-[var(--cr-bg)] flex flex-col">
      {/* Top nav bar */}
      <header className="h-14 bg-white border-b border-[var(--cr-line)] flex items-center px-6 gap-6 shrink-0">
        {/* Logo */}
        <NavLink to="/" className="flex items-center gap-2 shrink-0 mr-2">
          <div className="w-7 h-7 rounded-md bg-[var(--cr-accent)] flex items-center justify-center">
            <Activity size={14} className="text-white" />
          </div>
          <span className="font-display font-bold text-[var(--cr-ink)] text-sm">CareRound</span>
        </NavLink>

        {/* Nav links */}
        <nav className="flex items-center gap-1 flex-1">
          {links.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                  isActive
                    ? "text-[var(--cr-accent)] bg-[var(--cr-accent)]/10"
                    : "text-[var(--cr-ink-2)] hover:bg-[var(--cr-surface-3)] hover:text-[var(--cr-ink)]"
                )
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 text-sm text-[var(--cr-ink-2)] hover:text-[var(--cr-ink)] px-2 py-1 rounded-md hover:bg-[var(--cr-surface-3)]"
          >
            <div className="w-7 h-7 rounded-full bg-[var(--cr-accent)]/20 flex items-center justify-center">
              <User size={14} className="text-[var(--cr-accent)]" />
            </div>
            {user && (
              <span className="hidden sm:inline">
                {user.firstName} {user.lastName}
              </span>
            )}
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-10 z-20 w-44 bg-white rounded-lg shadow-lg border border-[var(--cr-line)] py-1">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-[var(--cr-muted)] hover:text-[var(--cr-danger)] hover:bg-[var(--cr-surface-3)]"
                >
                  <LogOut size={13} />
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
