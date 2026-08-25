import { deleteConclusionFile } from "@/api/conclusion";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useDeleteConclusionFile = (appointmentId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (fileId: string) => deleteConclusionFile(fileId, appointmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conclusion", appointmentId] });
      queryClient.invalidateQueries({ queryKey: ["prescription", appointmentId] });
      queryClient.invalidateQueries({ queryKey: ["appointment", appointmentId] });
    },
  });
};
