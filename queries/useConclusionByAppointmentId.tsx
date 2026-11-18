import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";

interface ConclusionData {
  instructions_by_doctor?: string;
  next_visit_date?: string;
  type?: string;
  conclusion_report_files?: Array<{
    id: string;
    name: string;
    url?: string;
    file_url?: string;
    type?: string;
  }>;
  /** Tests & reports tab: files shared by the patient or uploaded by the doctor for this appointment. */
  shared_files?: AppointmentSharedFile[];
}

export interface AppointmentSharedFile {
  id: string;
  name: string;
  type?: string | null;
  file_url?: string | null;
  file_type?: string | null;
  report_date?: string | null;
  uploaded_at?: string | null;
  shared_by: "patient" | "doctor";
  can_delete?: boolean;
}

interface ConclusionResponse {
  data: ConclusionData;
}

export const useConclusionByAppointmentId = (appointmentId: string) => {
  return useQuery({
    queryKey: ["conclusion", appointmentId],
    queryFn: async (): Promise<ConclusionResponse> => {
      const { data } = await api.get(`/appointments/doctor-instructions/${appointmentId}`);
      return data;
    },
    enabled: !!appointmentId,
  });
};
