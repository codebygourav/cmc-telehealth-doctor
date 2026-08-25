import { fetchSchedule, FetchScheduleParams } from "@/api/schedule";
import { useQuery } from "@tanstack/react-query";

export function useMySchedules(params?: FetchScheduleParams) {
    const month = params?.month;
    const year = params?.year;
    const date = params?.date;
    const filter = params?.filter;

    return useQuery({
        queryKey: ["my-schedules", month, year, date, filter],
        queryFn: () => fetchSchedule(params),
        retry: 0,
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
    });
}