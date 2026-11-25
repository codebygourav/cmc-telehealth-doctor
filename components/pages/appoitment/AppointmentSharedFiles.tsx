"use client";

import MissingFileReupload from "@/components/common/MissingFileReupload";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ExternalLink, FileImage, FileText, Loader2, Trash2 } from "lucide-react";
import { deleteConclusionFile } from "@/api/conclusion";
import { useConclusionByAppointmentId } from "@/queries/useConclusionByAppointmentId";
import UnderlineTabs from "@/components/ui/underline-tabs";

const isImage = (name?: string | null) => /\.(png|jpe?g|webp|gif)$/i.test(name || "");

/** Tests & reports tab: every file of this appointment, shared by the patient or uploaded by the doctor. */
export default function AppointmentSharedFiles({ appointmentId }: { appointmentId: string }) {
  const queryClient = useQueryClient();
  const { data, isLoading } = useConclusionByAppointmentId(appointmentId);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "patient" | "doctor">("all");

  const files = data?.data?.shared_files ?? [];
  const counts = {
    all: files.length,
    patient: files.filter((f) => f.shared_by === "patient").length,
    doctor: files.filter((f) => f.shared_by === "doctor").length,
  };
  const shown = filter === "all" ? files : files.filter((f) => f.shared_by === filter);

  const remove = async (id: string) => {
    if (!window.confirm("Delete this file? The patient will no longer see it.")) return;
    setDeleting(id);
    try {
      await deleteConclusionFile(id, appointmentId);
      await queryClient.invalidateQueries({ queryKey: ["conclusion", appointmentId] });
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div>
      <div className="mb-3">
        <p className="text-sm font-semibold text-slate-900">Reports &amp; files for this appointment</p>
        <p className="text-xs text-slate-500">Shared by the patient, and files you uploaded.</p>
      </div>
      <UnderlineTabs
        className="mb-3"
        value={filter}
        onChange={setFilter}
        items={[
          { key: "all", label: "All", count: counts.all },
          { key: "patient", label: "By patient", count: counts.patient },
          { key: "doctor", label: "By doctor", count: counts.doctor },
        ]}
      />

      {isLoading ? (
        <div className="space-y-2">
          {[0, 1].map((i) => <div key={i} className="h-12 animate-pulse rounded-lg bg-slate-100" />)}
        </div>
      ) : shown.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-200 py-6 text-center text-xs text-slate-500">
          {files.length === 0 ? "No reports or files shared for this appointment yet." : "No files in this filter."}
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-2 @2xl:grid-cols-2">
          {shown.map((file) => {
            const byPatient = file.shared_by === "patient";
            const Icon = isImage(file.file_url || file.name) ? FileImage : FileText;
            return (
              <li key={file.id} className="flex items-center gap-2.5 rounded-lg border border-slate-200 bg-slate-50/60 p-2.5">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${byPatient ? "bg-sky-100 text-sky-700" : "bg-emerald-100 text-emerald-700"}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <a
                    href={file.file_url || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block truncate text-xs font-semibold text-slate-800 hover:text-primary hover:underline"
                    title={file.name}
                  >
                    {file.name}
                  </a>
                  <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                    <span className={`rounded-full px-1.5 py-px text-[10px] font-semibold ${byPatient ? "bg-sky-100 text-sky-800" : "bg-emerald-100 text-emerald-800"}`}>
                      {byPatient ? "Shared by patient" : "Shared by doctor"}
                    </span>
                    {file.uploaded_at && <span className="text-[10px] text-slate-500">{file.uploaded_at}</span>}
                  </div>
                </div>
                {file.file_missing ? (
                  <MissingFileReupload reportId={file.id} compact />
                ) : file.file_url && (
                  <a href={file.file_url} target="_blank" rel="noopener noreferrer" className="p-1 text-slate-400 hover:text-primary" title="Open">
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
                {file.can_delete && (
                  <button type="button" onClick={() => remove(file.id)} disabled={deleting === file.id} className="p-1 text-red-500 hover:text-red-700 disabled:opacity-50" title="Delete">
                    {deleting === file.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
