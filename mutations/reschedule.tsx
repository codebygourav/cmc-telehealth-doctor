// mutations/reschedule.ts
import api from "@/lib/axios";

export const rescheduleAppointment = async (payload: {
    appointment_id: string;
    availability_id: string;
    appointment_date: string;
    appointment_time: string;
    // true = the new slot is confirmed (a doctor's reschedule confirms a booking awaiting confirmation)
    confirm?: boolean;
}) => {
    try {
        const { data } = await api.post(`/appointments/reschedule`, payload);
        console.log("Reschedule response:", data);
        return data;
    } catch (err) {
        console.error("Reschedule error:", err);
        throw err;
    }
};