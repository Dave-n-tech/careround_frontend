import { Icons, RoleBadge } from "@/components/ui";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { clearAuth } from "@/features/auth/authSlice";
import { demoClock } from "@/utils/time";
import { appConfig } from "@/utils/config";
import { useLogoutMutation } from "@/services/api";

export default function TopBar() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const role = useAppSelector((state) => state.auth.role);
  const [logout] = useLogoutMutation();

  const initials = user
    ? `${user.firstName[0]}${user.lastName[0]}`
    : "CR";

  async function handleLogout() {
    try {
      const refreshToken = localStorage.getItem("cr_refresh_token") || "";
      await logout({ refreshToken }).unwrap();
    } catch {
      // ignore logout errors in demo mode
    }
    dispatch(clearAuth());
  }

  return (
    <header className="h-14 bg-white border-b hairline px-5 flex items-center gap-4">
      <div className="flex items-center gap-2 text-sm">
        <span className="font-semibold">{appConfig.hospitalShortName}</span>
        <span className="ink-mute">·</span>
        <span className="ink-mute">{demoClock.dateLabel} · {demoClock.timeLabel}</span>
      </div>
      <div className="flex-1" />
      <div className="relative">
        <input className="input pl-8" placeholder="Search patients, MRN" style={{ width: 280 }} />
        <Icons.search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
      </div>
      <button className="relative btn btn-ghost p-2" title="Notifications">
        <Icons.bell size={16} />
      </button>
      <div className="flex items-center gap-2.5 pl-3 border-l hairline">
        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-semibold">
          {initials}
        </div>
        <div className="text-right">
          <div className="text-sm font-medium leading-tight">
            {user ? `${user.firstName} ${user.lastName}` : appConfig.hospitalName}
          </div>
          <div className="text-[10px]">{role && <RoleBadge role={role} />}</div>
        </div>
        <button className="btn btn-ghost p-1.5" title="Sign out" onClick={handleLogout}>
          <Icons.logout size={14} />
        </button>
      </div>
    </header>
  );
}
