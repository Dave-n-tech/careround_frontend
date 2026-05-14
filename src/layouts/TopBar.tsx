import { useState } from "react";
import { skipToken } from "@reduxjs/toolkit/query/react";
import { useNavigate } from "react-router-dom";
import { Icons, RoleBadge } from "@/components/ui";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { clearAuth } from "@/features/auth/authSlice";
import { appConfig } from "@/utils/config";
import { useLiveClock } from "@/hooks/useLiveClock";
import { resolvePatientRoute, resolveSearchResultRoute } from "@/utils/searchRoutes";
import {
  useGetNotificationsQuery,
  useGetUnreadNotificationCountQuery,
  useGlobalSearchQuery,
  useLogoutMutation,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation
} from "@/services/api";

export default function TopBar() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const role = useAppSelector((state) => state.auth.role);
  const [logout] = useLogoutMutation();
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const { data: searchResults } = useGlobalSearchQuery(search.trim().length >= 2 ? search.trim() : skipToken);
  const { data: unread } = useGetUnreadNotificationCountQuery();
  const { data: notifications = [] } = useGetNotificationsQuery(undefined, { skip: !notificationsOpen });
  const [markRead] = useMarkNotificationReadMutation();
  const [markAllRead] = useMarkAllNotificationsReadMutation();
  const clock = useLiveClock();

  const initials = user
    ? `${user.firstName[0]}${user.lastName[0]}`
    : "CR";

  async function handleLogout() {
    try {
      const refreshToken = localStorage.getItem("cr_refresh_token") || "";
      await logout({ refreshToken }).unwrap();
    } catch {
      // Ignore logout errors; local session cleanup still happens below.
    }
    dispatch(clearAuth());
  }

  function goTo(routeTarget?: string | null) {
    if (!routeTarget) return;
    navigate(routeTarget.startsWith("/") ? routeTarget : `/${routeTarget}`);
    setSearchOpen(false);
    setNotificationsOpen(false);
  }

  function showAllResults() {
    const trimmedSearch = search.trim();
    if (trimmedSearch.length < 2) return;
    navigate(`/search?q=${encodeURIComponent(trimmedSearch)}`);
    setSearchOpen(false);
  }

  // Only show patient results in the dropdown
  const patientGroup = searchResults?.groups.find((g) => g.type.toLowerCase().includes("patient"));
  const flatSearchResults = patientGroup?.results.map((result) => ({ ...result, groupType: patientGroup.type })) ?? [];

  return (
    <header className="min-h-14 bg-white border-b hairline px-3 py-2 flex flex-wrap items-center gap-2 sm:px-4 md:px-5 md:gap-4">
      <div className="min-w-0 flex items-center gap-2 text-sm">
        <span className="font-semibold truncate">{appConfig.hospitalShortName}</span>
        <span className="hidden ink-mute sm:inline">·</span>
        <span className="hidden ink-mute sm:inline">{clock.dateLabel} · {clock.timeLabel}</span>
      </div>
      <div className="flex-1" />
      {role !== "ADMIN" && (
      <div className="relative order-last w-full sm:order-none sm:w-72">
        <input
          className="input pl-8"
          placeholder="Search patients"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setSearchOpen(true);
          }}
          onFocus={() => setSearchOpen(true)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              showAllResults();
            }
          }}
        />
        <Icons.search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
        {searchOpen && search.trim().length >= 2 && (
          <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-40 max-h-80 overflow-y-auto rounded border border-[var(--cr-line)] bg-white shadow-lg scroll-thin">
            {flatSearchResults.length === 0 ? (
              <div className="p-3 text-sm ink-mute">No results found.</div>
            ) : (
              <>
                {flatSearchResults.slice(0, 8).map((result) => (
                  <button
                    key={`${result.type}-${result.id}`}
                    className="block w-full border-b hairline px-3 py-2 text-left last:border-b-0 hover:bg-slate-50"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => {
                      const route = result.routeTarget
                        ? result.routeTarget.startsWith("/") ? result.routeTarget : `/${result.routeTarget}`
                        : resolvePatientRoute(role, result.id);
                      goTo(route);
                    }}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="truncate text-sm font-medium">{result.title}</span>
                      <span className="field-label shrink-0">{result.groupType}</span>
                    </div>
                    {result.subtitle && <div className="truncate text-xs ink-mute">{result.subtitle}</div>}
                  </button>
                ))}
                <button
                  className="block w-full px-3 py-2 text-left text-sm font-medium text-[var(--cr-brand)] hover:bg-slate-50"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={showAllResults}
                  type="button"
                >
                  View all search results
                </button>
              </>
            )}
          </div>
        )}
      </div>
      )}
      <div className="relative">
        <button className="relative btn btn-ghost p-2" title="Notifications" onClick={() => setNotificationsOpen((open) => !open)}>
          <Icons.bell size={16} />
          {Boolean(unread?.unreadCount) && (
            <span className="absolute -right-0.5 -top-0.5 min-w-4 rounded-full bg-red-600 px-1 text-[10px] leading-4 text-white">
              {unread!.unreadCount > 9 ? "9+" : unread!.unreadCount}
            </span>
          )}
        </button>
        {notificationsOpen && (
          <div className="absolute right-0 top-[calc(100%+6px)] z-40 w-[min(360px,calc(100vw-1rem))] overflow-hidden rounded border border-[var(--cr-line)] bg-white shadow-lg">
            <div className="flex items-center justify-between gap-2 border-b hairline px-3 py-2">
              <div className="text-sm font-semibold">Notifications</div>
              <button className="btn btn-ghost px-2 py-1 text-xs" onClick={() => markAllRead()}>Mark all read</button>
            </div>
            <div className="max-h-80 overflow-y-auto scroll-thin">
              {notifications.length === 0 ? (
                <div className="p-3 text-sm ink-mute">No notifications.</div>
              ) : (
                notifications.map((notification) => (
                  <button
                    key={notification.id}
                    className={`block w-full border-b hairline px-3 py-2 text-left last:border-b-0 hover:bg-slate-50 ${
                      notification.read ? "" : "bg-blue-50"
                    }`}
                    onClick={() => {
                      if (!notification.read) markRead(notification.id);
                      navigate(`/notifications?selected=${notification.id}`);
                      setNotificationsOpen(false);
                    }}
                  >
                    <div className="text-sm font-medium">{notification.title}</div>
                    {notification.body && <div className="mt-0.5 line-clamp-2 text-xs ink-mute">{notification.body}</div>}
                  </button>
                ))
              )}
            </div>
            <div className="border-t hairline px-3 py-2">
              <button
                className="w-full text-center text-sm font-medium text-[var(--cr-brand)] hover:underline"
                onClick={() => { navigate("/notifications"); setNotificationsOpen(false); }}
                type="button"
              >
                View all notifications
              </button>
            </div>
          </div>
        )}
      </div>
      <div className="min-w-0 flex items-center gap-2 pl-2 border-l hairline sm:gap-2.5 sm:pl-3">
        <button
          className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-semibold"
          onClick={() => navigate("/profile")}
          title="Profile"
          type="button"
        >
          {initials}
        </button>
        <div className="hidden text-right sm:block">
          <div className="max-w-[150px] truncate text-sm font-medium leading-tight md:max-w-[220px]">
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
