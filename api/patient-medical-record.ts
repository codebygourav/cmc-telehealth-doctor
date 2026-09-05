import api from "@/lib/axios";

export interface PatientMedicalRecordFile {
  id: string;
  name?: string;
  file_name?: string;
  url?: string;
  file_url?: string;
  type?: string;
  created_at?: string;
  size?: number;
}

export interface PatientMedicalRecordData {
  id?: string;
  appointment_id?: string;
  chief_complaint?: string;
  history_of_present_illness?: string;
  present_medical_history?: string;
  family_history?: string;
  personal_history?: string;
  examination?: string;
  final_diagnosis?: string;
  investigation?: string;
  treatment?: string;
  instructions_by_doctor?: string;
  notes?: string;
  clinical_notes?: string;
  next_visit_date?: string;
  type?: string;
  attached_docs?: PatientMedicalRecordFile[];
  files?: PatientMedicalRecordFile[];
  medical_record_files?: PatientMedicalRecordFile[];
  attached_files?: PatientMedicalRecordFile[];
}

export interface GetPatientMedicalRecordResponse {
  success?: boolean;
  message?: string;
  data: PatientMedicalRecordData;
}

export interface SavePatientMedicalRecordPayload {
  appointmentId: string;
  chief_complaint?: string;
  history_of_present_illness?: string;
  present_medical_history?: string;
  family_history?: string;
  personal_history?: string;
  examination?: string;
  final_diagnosis?: string;
  investigation?: string;
  treatment?: string;
  instructions_by_doctor?: string;
  notes?: string;
  clinical_notes?: string;
  next_visit_date?: string;
  type?: string;
  files?: File[];
  attached_docs?: File[];
}

export interface SavePatientMedicalRecordResponse {
  success?: boolean;
  message?: string;
  data: PatientMedicalRecordData;
}

export const getPatientMedicalRecord = async (
  appointmentId: string
): Promise<GetPatientMedicalRecordResponse> => {
  const { data } = await api.get(
    `/appointments/patient-medical-record/${appointmentId}`
  );
  return data;
};

export const savePatientMedicalRecord = async ({
  appointmentId,
  chief_complaint,
  history_of_present_illness,
  present_medical_history,
  family_history,
  personal_history,
  examination,
  final_diagnosis,
  investigation,
  treatment,
  instructions_by_doctor,
  notes,
  clinical_notes,
  next_visit_date,
  type = "patient_medical_record",
  files,
  attached_docs,
}: SavePatientMedicalRecordPayload): Promise<SavePatientMedicalRecordResponse> => {
  const formData = new FormData();

  if (chief_complaint !== undefined) formData.append("chief_complaint", chief_complaint);
  if (history_of_present_illness !== undefined) formData.append("history_of_present_illness", history_of_present_illness);
  if (present_medical_history !== undefined) formData.append("present_medical_history", present_medical_history);
  if (family_history !== undefined) formData.append("family_history", family_history);
  if (personal_history !== undefined) formData.append("personal_history", personal_history);
  if (examination !== undefined) formData.append("examination", examination);
  if (final_diagnosis !== undefined) formData.append("final_diagnosis", final_diagnosis);
  if (investigation !== undefined) formData.append("investigation", investigation);
  if (treatment !== undefined) formData.append("treatment", treatment);
  if (instructions_by_doctor !== undefined) formData.append("instructions_by_doctor", instructions_by_doctor);
  
  // Backend expects notes column. Append both notes and clinical_notes for full compatibility
  const noteContent = notes !== undefined ? notes : clinical_notes;
  if (noteContent !== undefined) {
    formData.append("notes", noteContent);
    formData.append("clinical_notes", noteContent);
  }

  if (next_visit_date !== undefined) formData.append("next_visit_date", next_visit_date);
  if (type) formData.append("type", type);

  const uploadFiles = attached_docs || files;
  if (uploadFiles && uploadFiles.length > 0) {
    uploadFiles.forEach((file, index) => {
      formData.append(`attached_docs[${index}]`, file);
      formData.append(`files[${index}]`, file);
    });
  }

  const { data } = await api.post(
    `/appointments/patient-medical-record/${appointmentId}`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return data;
};

export const deletePatientMedicalRecordFiles = async (
  appointmentId: string,
  fileIds: string[]
) => {
  if (!appointmentId) {
    throw new Error("appointmentId is required to delete medical record files");
  }

  const { data } = await api.delete(
    `/appointments/patient-medical-record/${appointmentId}/files`,
    {
      data: {
        file_ids: fileIds,
      },
    }
  );

  return data;
};
