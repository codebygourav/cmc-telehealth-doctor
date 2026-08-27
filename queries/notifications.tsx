import { getNotifications, getSingleNotification, getUnreadCount } from "@/api/notification";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export enum NotificationQueryKeys {
  NOTIFICATIONS = "notifications",
  UNREAD_COUNT = "notifications_unread_count",
}

interface UseNotificationsOptions {
  enabled?: boolean;
}

export function useNotifications({ enabled = true }: UseNotificationsOptions = {}) {
  return useQuery({
    queryKey: [NotificationQueryKeys.NOTIFICATIONS],
    queryFn: getNotifications,
    enabled,
    staleTime: 5 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchInterval: 10 * 1000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
}

export function useUnreadCount({ enabled = true }: UseNotificationsOptions = {}) {
  return useQuery({
    queryKey: [NotificationQueryKeys.UNREAD_COUNT],
    queryFn: getUnreadCount,
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
