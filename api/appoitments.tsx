import api from "@/lib/axios";
import { AppointmentListResponse } from "@/types/appointment";


export interface AppointmentListOptions {
    search?: string;
    status?: string;            // "all" or a status value
    consultationType?: string;  // "all" | "video" | "in-person"
    perPage?: number | "all";
}

/** Tabs, search, status, type and page size are all applied by the server, over every appointment. */
export const fetchMyAppointments = async (
    filter: string = "today",
    page: number = 1,
    options: AppointmentListOptions = {}
): Promise<AppointmentListResponse> => {
    const params: Record<string, string | number> = { filter, page };
    if (options.search?.trim()) params.search = options.search.trim();
    if (options.status && options.status !== "all") params.status = options.status;
    if (options.consultationType && options.consultationType !== "all") params.consultation_type = options.consultationType;
    if (options.perPage) params.per_page = options.perPage;
    const { data } = await api.get("/appointments/my", { params });
    return data;
};

// detail page open 
export const fetchAppointmentById = async (id: string) => {
    const { data } = await api.get(`/appointments/${id}`);
    
    return data;
};