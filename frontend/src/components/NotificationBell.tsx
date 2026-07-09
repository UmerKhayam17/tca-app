import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import socketService from "@/services/socket/socket.service";
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  notificationHref,
  type AppNotification,
} from "@/lib/notificationsApi";
import { cn } from "@/lib/utils";

function formatWhen(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function NotificationBell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [liveUnread, setLiveUnread] = useState(0);

  const { data, refetch } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => fetchNotifications({ limit: 25 }),
    enabled: Boolean(user),
    refetchInterval: 60_000,
  });

  const items = data?.items ?? [];
  const unreadCount = Math.max(data?.unreadCount ?? 0, liveUnread);

  useEffect(() => {
    if (!user) return;
    void socketService.connectPanel();

    const onNew = (n: AppNotification) => {
      qc.setQueryData<{ items: AppNotification[]; unreadCount: number }>(
        ["notifications"],
        (prev) => {
          const list = prev?.items ?? [];
          if (list.some((x) => x._id === n._id)) return prev;
          return {
            items: [n, ...list].slice(0, 30),
            unreadCount: (prev?.unreadCount ?? 0) + 1,
          };
        }
      );
      setLiveUnread((c) => c + 1);
      toast({ title: n.title, description: n.body || undefined });
    };

    socketService.onNotificationNew(onNew);
    return () => socketService.offNotificationNew(onNew);
  }, [user, qc, toast]);

  useEffect(() => {
    if (data?.unreadCount != null) setLiveUnread(0);
  }, [data?.unreadCount]);

  const markReadMut = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const markAllMut = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const handleClick = useCallback(
    async (n: AppNotification) => {
      if (!n.read) {
        try {
          await markReadMut.mutateAsync(n._id);
        } catch {
          /* ignore */
        }
      }
      setOpen(false);
      if (n.path && user?.role) {
        navigate(notificationHref(user.role, n.path));
      }
    },
    [markReadMut, navigate, user?.role]
  );

  return (
    <Popover open={open} onOpenChange={(v) => { setOpen(v); if (v) void refetch(); }}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative shrink-0" aria-label="Notifications">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="cms-portal font-sans w-80 sm:w-96 p-0" align="end">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <p className="text-sm font-semibold">Notifications</p>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              disabled={markAllMut.isPending}
              onClick={() => markAllMut.mutate()}
            >
              Mark all read
            </Button>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto">
          {items.length === 0 && (
            <p className="p-4 text-sm text-muted-foreground text-center">No notifications yet.</p>
          )}
          {items.map((n) => (
            <button
              key={n._id}
              type="button"
              className={cn(
                "w-full text-left px-3 py-2.5 border-b last:border-0 hover:bg-muted/50 transition-colors",
                !n.read && "bg-primary/5"
              )}
              onClick={() => void handleClick(n)}
            >
              <p className="text-sm font-medium leading-snug">{n.title}</p>
              {n.body && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>}
              <p className="text-[10px] text-muted-foreground mt-1">{formatWhen(n.createdAt)}</p>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
