import { useQuery } from "@tanstack/react-query";
import {
  getPreviousPrescriptions,
  PreviousPrescriptionsResponse,
} from "@/api/previous-prescriptions";

export const usePreviousPrescriptions = (appointmentId?: string) => {
  return useQuery<PreviousPrescriptionsResponse>({
    queryKey: ["previous-prescriptions", appointmentId],
    queryFn: () => getPreviousPrescriptions(appointmentId!),
    enabled: !!appointmentId,
  });
};
