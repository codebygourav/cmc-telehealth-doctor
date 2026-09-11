import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getPatientMedicalRecord,
  savePatientMedicalRecord,
  deletePatientMedicalRecordFiles,
  handleDownloadPatientMedicalRecord,
  SavePatientMedicalRecordPayload,
  GetPatientMedicalRecordResponse,
} from "@/api/patient-medical-record";

export const usePatientMedicalRecord = (appointmentId: string) => {
  return useQuery<GetPatientMedicalRecordResponse>({
    queryKey: ["patient-medical-record", appointmentId],
    queryFn: () => getPatientMedicalRecord(appointmentId),
    enabled: !!appointmentId,
  });
};

export const useDownloadPatientMedicalRecord = () => {
  return useMutation({
    mutationFn: (appointmentId: string) =>
      handleDownloadPatientMedicalRecord(appointmentId),
  });
};

export const useSavePatientMedicalRecord = () => {

  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SavePatientMedicalRecordPayload) =>
      savePatientMedicalRecord(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["patient-medical-record", variables.appointmentId],
      });
      queryClient.invalidateQueries({
        queryKey: ["appointment", variables.appointmentId],
      });
      queryClient.invalidateQueries({
        queryKey: ["appointments"],
      });
    },
  });
};

export const useDeletePatientMedicalRecordFiles = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      appointmentId,
      fileIds,
    }: {
      appointmentId: string;
      fileIds: string[];
    }) => deletePatientMedicalRecordFiles(appointmentId, fileIds),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["patient-medical-record", variables.appointmentId],
      });
      queryClient.invalidateQueries({
        queryKey: ["appointment", variables.appointmentId],
      });
      queryClient.invalidateQueries({
        queryKey: ["appointments"],
      });
    },
  });
};
