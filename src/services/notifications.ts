import API from "./api";
import type { AppNotification } from "@/types";

export const getNotifications = async (
  params: { unread?: boolean } = {}
): Promise<{ notifications: AppNotification[]; unreadCount: number }> => {
  const { data } = await API.get("/notifications", { params });
  return { notifications: data.notifications, unreadCount: data.unreadCount };
};

export const markNotificationRead = async (id: string): Promise<void> => {
  await API.patch(`/notifications/${id}/read`);
};

export const markAllNotificationsRead = async (): Promise<void> => {
  await API.patch("/notifications/read-all");
};
