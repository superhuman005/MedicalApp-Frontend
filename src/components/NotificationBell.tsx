import { useCallback, useEffect, useState } from "react";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/services/notifications";
import { getSocket } from "@/services/socket";
import { isUserInactive, playNotificationChime, warmNotificationAudio } from "@/lib/notificationSound";
import type { AppNotification } from "@/types";

const timeAgo = (iso: string) => {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
};

// Bell + dropdown used in every dashboard header (patient, doctor, admin).
// Loads recent notifications on mount, then stays live via the
// "notification:new" socket event the backend's notify() helper emits
// whenever something happens that's worth telling this user about.
const NotificationBell = () => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const { notifications: items, unreadCount: count } = await getNotifications();
      setNotifications(items);
      setUnreadCount(count);
    } catch {
      // Silent - a failed notification fetch shouldn't block the rest of the dashboard.
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Unlocks the chime below the first time the person clicks or presses a
  // key anywhere on the page, so it's ready to play later even if a
  // notification arrives while this tab is in the background.
  useEffect(() => warmNotificationAudio(), []);

  // Live updates: prepend anything the server pushes us in real time, and -
  // for a patient or doctor who isn't actively looking at the tab right now -
  // play a short chime so a time-sensitive update (a new consultation
  // request, a doctor coming online, a prescription being ready) doesn't go
  // unnoticed until they happen to check back.
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const onNew = (notification: AppNotification) => {
      setNotifications((prev) => [notification, ...prev].slice(0, 100));
      setUnreadCount((prev) => prev + 1);
      if (isUserInactive()) playNotificationChime();
    };

    socket.on("notification:new", onNew);
    return () => {
      socket.off("notification:new", onNew);
    };
  }, []);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) load();
  };

  const handleMarkRead = async (notification: AppNotification) => {
    if (notification.isRead) return;
    setNotifications((prev) => prev.map((n) => (n._id === notification._id ? { ...n, isRead: true } : n)));
    setUnreadCount((prev) => Math.max(0, prev - 1));
    try {
      await markNotificationRead(notification._id);
    } catch {
      // Best-effort - if this fails the item just stays "read" locally until next load.
    }
  };

  const handleMarkAllRead = async () => {
    setIsMarkingAll(true);
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      // Best-effort
    } finally {
      setIsMarkingAll(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative shrink-0" aria-label="Notifications">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 min-w-5 px-1 flex items-center justify-center bg-red-500 hover:bg-red-500 text-[10px]">
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <p className="font-semibold text-sm">Notifications</p>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={handleMarkAllRead}
              disabled={isMarkingAll}
            >
              {isMarkingAll ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <CheckCheck className="w-3 h-3 mr-1" />}
              Mark all read
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : notifications.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-10 px-4">
            You're all caught up - no notifications yet.
          </p>
        ) : (
          <ScrollArea className="max-h-96">
            <div className="divide-y">
              {notifications.map((n) => (
                <button
                  key={n._id}
                  type="button"
                  onClick={() => handleMarkRead(n)}
                  className={`w-full text-left px-4 py-3 hover:bg-secondary/60 transition-colors ${
                    n.isRead ? "" : "bg-accent/10"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {!n.isRead && <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />}
                    <div className={n.isRead ? "pl-3.5" : ""}>
                      <p className="text-sm font-medium text-foreground">{n.title}</p>
                      {n.message && <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>}
                      <p className="text-[11px] text-muted-foreground mt-1">{timeAgo(n.createdAt)}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;
