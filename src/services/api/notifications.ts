import { api } from "./baseApi";

export type Notification = {
  id: string;
  type: string;
  title: string;
  body?: string | null;
  routeTarget?: string | null;
  read: boolean;
  createdAt: string;
};

export type UnreadCount = { unreadCount: number };

const notificationsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getNotifications: builder.query<Notification[], void>({
      query: () => "/notifications",
      providesTags: ["Notifications"]
    }),
    getUnreadNotificationCount: builder.query<UnreadCount, void>({
      query: () => "/notifications/unread-count",
      providesTags: ["Notifications"]
    }),
    markNotificationRead: builder.mutation<void, string>({
      query: (id) => ({ url: `/notifications/${id}/read`, method: "PATCH" }),
      invalidatesTags: ["Notifications"]
    }),
    markAllNotificationsRead: builder.mutation<void, void>({
      query: () => ({ url: "/notifications/read-all", method: "PATCH" }),
      invalidatesTags: ["Notifications"]
    })
  })
});

export const {
  useGetNotificationsQuery,
  useGetUnreadNotificationCountQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation
} = notificationsApi;
