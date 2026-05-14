import { useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Icons, useToast } from "@/components/ui";
import { PageHeader } from "@/layouts/PageHeader";
import {
  useGetNotificationsQuery,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation
} from "@/services/api";

export default function NotificationsPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [params] = useSearchParams();
  const selectedId = params.get("selected");
  const { data: notifications = [], isLoading } = useGetNotificationsQuery();
  const [markRead] = useMarkNotificationReadMutation();
  const [markAllRead, { isLoading: isMarkingAll }] = useMarkAllNotificationsReadMutation();

  const selected = useMemo(
    () => notifications.find((notification) => notification.id === selectedId) ?? notifications[0],
    [notifications, selectedId]
  );

  async function openNotification(id: string, routeTarget?: string | null, read?: boolean) {
    try {
      if (!read) await markRead(id).unwrap();
      if (routeTarget) navigate(routeTarget.startsWith("/") ? routeTarget : `/${routeTarget}`);
      else navigate(`/notifications?selected=${id}`);
    } catch {
      toast({ kind: "error", title: "Could not update notification" });
    }
  }

  async function markAll() {
    try {
      await markAllRead().unwrap();
      toast({ kind: "success", title: "Notifications marked read" });
    } catch {
      toast({ kind: "error", title: "Could not mark notifications read" });
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader title="Notifications" subtitle={`${notifications.length} total`}>
        <button className="btn" onClick={markAll} disabled={isMarkingAll}>
          <Icons.check size={14} />Mark all read
        </button>
      </PageHeader>

      {isLoading ? (
        <div className="panel rounded p-8 text-center ink-mute">Loading notifications...</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[360px_1fr]">
          <div className="panel rounded overflow-hidden">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-sm ink-mute">No notifications.</div>
            ) : (
              notifications.map((notification) => (
                <button
                  key={notification.id}
                  className={`block w-full border-b hairline px-4 py-3 text-left last:border-b-0 hover:bg-slate-50 ${
                    notification.id === selected?.id ? "bg-blue-50" : notification.read ? "" : "bg-slate-50"
                  }`}
                  onClick={() => openNotification(notification.id, null, notification.read)}
                  type="button"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold">{notification.title}</div>
                      {notification.body && <div className="mt-1 line-clamp-2 text-xs ink-mute">{notification.body}</div>}
                    </div>
                    {!notification.read && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-600" />}
                  </div>
                  <div className="mt-2 text-[11px] ink-mute">{new Date(notification.createdAt).toLocaleString()}</div>
                </button>
              ))
            )}
          </div>

          <div className="panel rounded p-5">
            {selected ? (
              <div className="space-y-4">
                <div>
                  <div className="field-label">{selected.type}</div>
                  <h2 className="mt-1 text-xl font-semibold">{selected.title}</h2>
                  <div className="mt-1 text-xs ink-mute">{new Date(selected.createdAt).toLocaleString()}</div>
                </div>
                {selected.body && <p className="text-sm ink-2">{selected.body}</p>}
              </div>
            ) : (
              <div className="text-sm ink-mute">Select a notification to view details.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
