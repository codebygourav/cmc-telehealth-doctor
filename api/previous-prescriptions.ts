import api from "@/lib/axios";

export interface PreviousPrescriptionMedicine {
  medicine_name: string;
  dosage?: string;
  frequency?: string;
  timings?: string[];
  meal?: string;
  start_date?: string;
  end_date?: string;
  is_ongoing?: boolean;
  instructions?: string;
}

export interface PreviousPrescriptionGroup {
  appointment_id: string;
  appointment_date: string;
  doctor_id?: string;
  doctor_name?: string;
  medicines: PreviousPrescriptionMedicine[];
}

export interface PreviousPrescriptionsResponse {
  success?: boolean;
  message?: string;
  path?: string;
  timestamp?: string;
  data: PreviousPrescriptionGroup[];
}

export const getPreviousPrescriptions = async (
  appointmentId: string
): Promise<PreviousPrescriptionsResponse> => {
  const { data } = await api.get(
    `/appointments/previous-prescriptions/${appointmentId}`
  );
  return data;
};
