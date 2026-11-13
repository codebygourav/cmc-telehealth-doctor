import { fetchMyAppointments, type AppointmentListOptions } from "@/api/appoitments";
import { getAuthToken } from "@/lib/authToken";
import { useQuery } from "@tanstack/react-query";

/** Tab, search, status, type and page size are applied by the server over every appointment. */
export function useMyAppointments(filter: string = "today", page: number = 1, options: AppointmentListOptions = {}) {
    const token = getAuthToken();

    return useQuery({
        queryKey: ["my-appointments", filter, page, options],
        queryFn: () => fetchMyAppointments(filter, page, options),
        enabled: !!token,
        retry: 0,
        staleTime: 60 * 1000,
        // Keep the current list on screen while the next page / search result loads.
        placeholderData: (previous) => previous,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
    });
}
