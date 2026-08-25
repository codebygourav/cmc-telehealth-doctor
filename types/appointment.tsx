
export interface appointmentProps {
  id?: string | number;
  appointmentId?: string;
  status?: string;
  image?: string;
  name: string;
  mode: string;
  date?: string;
  time: string;
  call_now?: boolean;
}

export interface Patient {
  id: string;
  user_id: string;
  name: string;
  avatar?: string;
  slug: string;
}


export interface Appointment {
  appointment_id: string;
  appointment_date: string;
  appointment_date_formatted: string;
  appointment_time: string;
  appointment_time_formatted: string;
  consultation_type: "video" | "clinic";
  consultation_type_label: string;
  status: string;
  status_label: string;
  fee_amount: number;
  call_now: boolean;
  patient: Patient;
}

export interface PaginationInfo {
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
}

export interface AppointmentListResponse {
  success?: boolean;
  message?: string;
  pagination?: PaginationInfo;
  filter?: string;
  path?: string;
  timestamp?: string;
  data: Appointment[];
}

