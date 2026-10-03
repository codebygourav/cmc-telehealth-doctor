import api from "@/lib/axios";

export const addPrescription = async (
    appointmentId: string,
    payload: any,
    token: string
) => {
    const response = await api.post(
        `/doctor/${appointmentId}/prescriptions`,
        payload,
        {
            headers: {
                Authorization: `Bearer ${token}` 
            }
        }
    );

    return response.data;
};

// PDF of the prescription as it is in the form now (nothing is saved).
export const previewPrescriptionPdf = async (appointmentId: string, payload: any): Promise<Blob> => {
    const response = await api.post(`/doctor/${appointmentId}/prescriptions/preview`, payload, {
        responseType: "blob",
    });
    return response.data as Blob;
};
