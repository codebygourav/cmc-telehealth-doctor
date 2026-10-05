import { fetchAppointmentById } from "@/api/appoitments";
import { useQuery } from "@tanstack/react-query";

export const useAppointmentById = (id: string) => {
    return useQuery({
        queryKey: ["appointment", id],
        queryFn: () => fetchAppointmentById(id),
        enabled: !!id,
        staleTime: 30 * 1000,
        gcTime: 5 * 60 * 1000, // 5 minutes
        // Keep call state fresh (joinable / "call ended, complete it?") while the page is open.
        refetchInterval: 30 * 1000,
        refetchOnWindowFocus: true,
    });
};