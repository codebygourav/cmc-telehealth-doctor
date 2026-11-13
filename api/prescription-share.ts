import api from "@/lib/axios";

export interface PrescriptionShareInfo {
    patient_name: string;
    numbers: { label: string; number: string }[];
    can_send: boolean;
    has_content: boolean;
    history: PrescriptionShareLog[];
}

export interface PrescriptionShareLog {
    id: string;
    sent_at: string | null;
    sent_at_label: string | null;
    to_number: string;
    status: string;           // sent | delivered | read | failed
    error: string | null;
    sent_by: string | null;
    pdf_url: string | null;
}

/** Numbers on record for the patient and whether WhatsApp sending is switched on. */
export const getPrescriptionShareInfo = async (appointmentId: string): Promise<PrescriptionShareInfo> => {
    const { data } = await api.get(`/prescriptions/share/${appointmentId}`);
    return data?.data;
};

/** The PDF exactly as it will be sent (generated now, with every note and the medical record). */
export const getPrescriptionSharePdf = async (appointmentId: string): Promise<Blob> => {
    const { data } = await api.get(`/prescriptions/share/${appointmentId}/pdf`, { responseType: "blob" });
    return data;
};

/** Send the prescription PDF on WhatsApp (template prescription_document). */
export const sendPrescriptionWhatsApp = async (appointmentId: string, phone: string) => {
    const { data } = await api.post(`/prescriptions/share/${appointmentId}/whatsapp`, { phone });
    return data;
};
