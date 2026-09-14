import { getNotifications, getSingleNotification, getUnreadCount } from "@/api/notification";
import { useAuth } from "@/context/userContext";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export enum NotificationQueryKeys {
  NOTIFICATIONS = "notifications",
  UNREAD_COUNT = "notifications_unread_count",
}

interface UseNotificationsOptions {
  after?: string | null;
  enabled?: boolean;
}

export function useNotifications({ after, enabled = true }: UseNotificationsOptions = {}) {
  const { loginTime } = useAuth();
  const cutoff = after !== undefined ? after : loginTime;

  return useQuery({
    queryKey: [NotificationQueryKeys.NOTIFICATIONS, cutoff],
    queryFn: () => getNotifications(cutoff ?? undefined),
    enabled,
    staleTime: 5 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchInterval: 10 * 1000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
}

export function useUnreadCount({ after, enabled = true }: UseNotificationsOptions = {}) {
  const { loginTime } = useAuth();
  const cutoff = after !== undefined ? after : loginTime;

  return useQuery({
    queryKey: [NotificationQueryKeys.UNREAD_COUNT, cutoff],
    queryFn: () => getUnreadCount(cutoff ?? undefined),
    enabled,
    staleTime: 5 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchInterval: 10 * 1000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
}

export function useReadNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => getSingleNotification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [NotificationQueryKeys.NOTIFICATIONS] });
      queryClient.invalidateQueries({ queryKey: [NotificationQueryKeys.UNREAD_COUNT] });
    },
  });
}
