import api from "@/lib/axios";

// Doctor confirms a booking that is awaiting confirmation.
export const confirmAppointment = async (appointmentId: string) => {
    const { data } = await api.post(`/appointments/${appointmentId}/confirm`);
    return data;
};

// Doctor marks the patient present / absent (voucher number optional, only for present).
export const markAttendance = async (
    appointmentId: string,
    payload: { attendance: "present" | "absent"; voucher_number?: string | null }
) => {
    const { data } = await api.post(`/appointments/${appointmentId}/attendance`, payload);
    return data;
};

export const getApiErrorMessage = (err: any, fallback = "Something went wrong") => {
    const errors = err?.response?.data?.errors;

    if (typeof errors === "string") return errors;
    if (errors?.message) return Array.isArray(errors.message) ? errors.message[0] : errors.message;
    if (errors && typeof errors === "object") {
        const first = Object.values(errors).flat()[0];
        if (typeof first === "string") return first;
    }

    return err?.response?.data?.message || err?.message || fallback;
};
