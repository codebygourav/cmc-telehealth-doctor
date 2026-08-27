export interface NotificationItem {
  id: string;
  group: "appointment" | "review" | "availability" | "document" | string;
  title: string;
  desc: string;
  created_at: string;
  is_read: boolean;
  appointment_id?: string | null;
  join_url?: string | null;
}

export interface NotificationsResponse {
  unread_count: number;
  data: NotificationItem[];
  meta: {
    total_unread: number;
    total?: number;
  };
}
