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
    <aside className="fixed inset-x-0 bottom-0 z-30 h-16 bg-white border-t hairline flex flex-col md:static md:h-auto md:w-[230px] md:border-t-0 md:border-r">
      <div className="hidden px-4 py-4 border-b hairline md:block">
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
      <nav className="flex flex-1 gap-1 overflow-x-auto p-1.5 scroll-thin md:block md:space-y-1 md:overflow-x-visible md:p-2">
        {items.map((it) => {
          const I = Icons[it.icon as keyof typeof Icons] || Icons.dashboard;
          const badge = it.badgeKey ? badges[it.badgeKey] : null;
          return (
            <NavLink
              key={it.id}
              to={it.path}
              className={({ isActive }) =>
                `min-w-[74px] flex flex-col items-center justify-center gap-1 rounded px-2 py-1.5 text-center text-[10px] font-medium md:min-w-0 md:w-full md:flex-row md:justify-start md:gap-2.5 md:px-3 md:py-2 md:text-left md:text-sm ${
                  isActive ? "bg-blue-50 text-[var(--cr-brand)]" : "text-slate-700 hover:bg-slate-50"
                }`
              }
            >
              <I size={16} />
              <span className="w-full truncate md:flex-1 md:text-left">{it.label}</span>
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
