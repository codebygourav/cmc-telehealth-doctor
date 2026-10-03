import api from "@/lib/axios";

// With an appointment: only slots of its own schedule (video / general OPD / private OPD),
// plus `schedule` describing it.
export const getDoctorSlots = async (doctorId: string, appointmentId?: string) => {
    const { data } = await api.get(`/doctor/${doctorId}/get-slot-detail`, {
        params: appointmentId ? { appointment_id: appointmentId } : undefined,
    });
    return data;
};
