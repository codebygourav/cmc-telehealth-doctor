
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


export interface PatientHistoryMedicine {
  prescription_id: string;
  medicine_id?: string;
  medicine_name: string;
  dosage?: string;
  frequency?: string;
  frequency_label?: string;
  timings?: string[];
  meal?: string;
  start_date?: string;
  end_date?: string;
  is_ongoing?: boolean;
  instructions?: string;
}

export interface PatientHistoryItem {
  date?: string | null;
  date_formatted?: string | null;
  appointment_id: string;
  doctor_name?: string | null;
  prescribed_medicines?: PatientHistoryMedicine[];
  order_investigation?: string | null;
  diagnosis?: string | null;
  notes?: string | null;
  confidential_notes?: string | null;
  instructions_by_doctor?: string | null;
  next_visit_date?: string | null;
  pdf_url?: string | null;
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
  patient_history?: PatientHistoryItem[];
}

export interface PaginationInfo {
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
  total_pages?: number;
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

