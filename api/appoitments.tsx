import api from "@/lib/axios";
import { AppointmentListResponse } from "@/types/appointment";


export const fetchMyAppointments = async (
    filter: string = "today",
    page: number = 1
): Promise<AppointmentListResponse> => {
    const { data } = await api.get("/appointments/my", {
        params: { filter, page },
    });
    return data;
};

// detail page open 
export const fetchAppointmentById = async (id: string) => {
    const { data } = await api.get(`/appointments/${id}`);
    
    return data;
};