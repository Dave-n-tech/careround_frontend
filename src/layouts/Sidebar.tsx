import { NavLink } from "react-router-dom";
import { Icons } from "@/components/ui";
import { NAV } from "@/navigation/nav";
import { useAppSelector } from "@/app/hooks";
import { appConfig } from "@/utils/config";

export default function Sidebar() {
  const role = useAppSelector((state) => state.auth.role);

  if (!role) return null;

  const items = NAV[role] || [];

  // Badge counts are not available without ward context in the sidebar.
  // Pages that need them can fetch ward-scoped data directly.
  const badges = {
    openEscalations: 0,
    pendingShifts: 0
  };

  return (
    <aside className="w-[230px] bg-white border-r hairline flex flex-col">
      <div className="px-4 py-4 border-b hairline">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-[var(--cr-brand)] flex items-center justify-center">
            <Icons.hospital size={16} className="text-white" />
          </div>
          <div>
            <div className="font-semibold text-sm leading-tight">CareRound</div>
            <div className="text-[10px] ink-mute">{appConfig.hospitalShortName}</div>
          </div>
        </div>
      </div>
      <nav className="p-2 flex-1">
        {items.map((it) => {
          const I = Icons[it.icon as keyof typeof Icons] || Icons.dashboard;
          const badge = it.badgeKey ? badges[it.badgeKey] : null;
          return (
            <NavLink
              key={it.id}
              to={it.path}
              className={({ isActive }) =>
                `w-full flex items-center gap-2.5 px-3 py-2 rounded text-sm font-medium ${
                  isActive ? "bg-blue-50 text-[var(--cr-brand)]" : "text-slate-700 hover:bg-slate-50"
                }`
              }
            >
              <I size={16} />
              <span className="flex-1 text-left">{it.label}</span>
              {badge && badge > 0 && (
                <span className="text-[10px] mono px-1.5 py-0.5 rounded bg-red-600 text-white">
                  {badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
