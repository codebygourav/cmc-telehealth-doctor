"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  AlertCircle,
  FileImage,
  ExternalLink,
  Trash2,
  Paperclip,
  Stethoscope,
} from "lucide-react";
import {
  usePatientMedicalRecord,
  useDeletePatientMedicalRecordFiles,
} from "@/queries/usePatientMedicalRecord";
import { PatientMedicalRecordFile } from "@/api/patient-medical-record";

interface PatientMedicalRecordTabProps {
  appointmentId: string;
}

const getFileUrl = (file: PatientMedicalRecordFile | string): string => {
  if (!file) return "#";
  const rawUrl = typeof file === "string" ? file : file.file_url || file.url || "";
  if (!rawUrl) return "#";
  if (
    rawUrl.startsWith("http://") ||
    rawUrl.startsWith("https://") ||
    rawUrl.startsWith("blob:") ||
    rawUrl.startsWith("data:")
  ) {
    return rawUrl;
  }
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "";
  const rootDomain = apiBase
    .replace(/\/api\/v2\/?$/, "")
    .replace(/\/api\/?$/, "");
  const baseUrl = rootDomain || "https://telehealthwebapplive.cmcludhiana.in";

  const cleanPath = rawUrl.startsWith("/") ? rawUrl : `/${rawUrl}`;
  return `${baseUrl}${cleanPath}`;
};

const isImageFile = (filenameOrUrl: string | undefined | null): boolean => {
  if (!filenameOrUrl) return false;
  const clean = filenameOrUrl.split("?")[0].toLowerCase();
  return (
    clean.endsWith(".jpg") ||
    clean.endsWith(".jpeg") ||
    clean.endsWith(".png") ||
    clean.endsWith(".gif") ||
    clean.endsWith(".webp") ||
    clean.endsWith(".svg") ||
    clean.endsWith(".bmp")
  );
};

const renderFormattedContent = (text: string | undefined | null) => {
  if (!text || !text.trim()) return null;

  const rawLines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (rawLines.length === 0) return null;

  if (rawLines.length === 1) {
    return <p className="text-sm leading-relaxed text-slate-800">{rawLines[0].replace(/^[\d+[\.\)]|\-|\*]\s*/, "")}</p>;
  }

  return (
    <ol className="list-decimal list-inside space-y-1 text-sm text-slate-800">
      {rawLines.map((line, idx) => (
        <li key={idx} className="leading-relaxed">
          {line.replace(/^[\d+[\.\)]|\-\|\*]\s*/, "")}
        </li>
      ))}
    </ol>
  );
};

export default function PatientMedicalRecordTab({
  appointmentId,
}: PatientMedicalRecordTabProps) {
  const { data, isLoading, error } = usePatientMedicalRecord(appointmentId);
  const deleteFilesMutation = useDeletePatientMedicalRecordFiles();

  const [deletingFileId, setDeletingFileId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-4" aria-busy="true">
        <div className="h-4 w-56 animate-pulse rounded bg-slate-100" />
        <div className="h-3 w-full animate-pulse rounded bg-slate-100" />
        <div className="h-3 w-2/3 animate-pulse rounded bg-slate-100" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <div className="flex items-center justify-center gap-2 text-red-500">
          <AlertCircle className="h-5 w-5" />
          <p className="text-sm">Error loading Patient Medical Record</p>
        </div>
      </div>
    );
  }

  const record = data?.data;
  const filesList =
    record?.attached_docs ||
    record?.files ||
    record?.medical_record_files ||
    record?.attached_files ||
    [];

  const medicalFields = [
    { label: "Final Diagnosis", value: record?.final_diagnosis },
    { label: "Chief Complaint", value: record?.chief_complaint },
    { label: "History of Present Illness", value: record?.history_of_present_illness },
    { label: "Present Medical History", value: record?.present_medical_history },
    { label: "Family History", value: record?.family_history },
    { label: "Personal History", value: record?.personal_history },
    { label: "Examination", value: record?.examination },
    { label: "Clinical Notes", value: record?.notes || record?.clinical_notes },
    { label: "Investigation", value: record?.investigation },
    { label: "Treatment", value: record?.treatment },
  ].filter((f) => f.value && typeof f.value === "string" && f.value.trim().length > 0);

  const handleDeleteFile = async (fileId: string) => {
    if (!appointmentId || !fileId) return;
    setDeletingFileId(fileId);
    try {
      await deleteFilesMutation.mutateAsync({
        appointmentId,
        fileIds: [fileId],
      });
    } catch (err) {
      console.error("Failed to delete file:", err);
    } finally {
      setDeletingFileId(null);
    }
  };

  if (filesList.length === 0 && medicalFields.length === 0) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-dashed border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
        <FileText className="h-4 w-4 shrink-0 text-slate-400" />
        No patient medical record for this appointment yet.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Patient Medical Record summary: compact tiles, two columns on wider screens */}
      {medicalFields.length > 0 && (
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <header className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10"><Stethoscope className="h-4 w-4 text-primary" /></span>
              <h3 className="text-sm font-semibold text-slate-900 sm:text-base">Patient Medical Record Summary</h3>
            </div>
            <Badge variant="secondary" className="text-[10px] sm:text-xs">{medicalFields.length} fields</Badge>
          </header>
          <dl className="grid grid-cols-1 gap-3 p-3 sm:p-4 md:grid-cols-2">
            {medicalFields.map((field) => (
              <div key={field.label} className={`min-w-0 rounded-lg border border-slate-100 bg-slate-50/70 px-3 py-2.5 ${field.label === "Final Diagnosis" ? "md:col-span-2 border-primary/20 bg-primary/5" : ""}`}>
                <dt className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">{field.label}</dt>
                <dd className="min-w-0 break-words">{renderFormattedContent(field.value)}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {/* Media & Report Files */}
      {filesList.length > 0 && (
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <header className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10"><Paperclip className="h-4 w-4 text-primary" /></span>
              <h3 className="text-sm font-semibold text-slate-900 sm:text-base">Attached Media & Reports</h3>
            </div>
            <Badge variant="secondary" className="text-[10px] sm:text-xs">{filesList.length} file{filesList.length === 1 ? "" : "s"}</Badge>
          </header>
          <div className="grid grid-cols-1 gap-3 p-3 sm:grid-cols-2 sm:p-4 lg:grid-cols-3">
            {filesList.map((file, idx) => {
              const fullUrl = getFileUrl(file);
              const isImg = isImageFile(file.file_url || file.url || file.name || file.file_name);
              const fileName = file.name || file.file_name || `Attachment #${idx + 1}`;
              const ext = (fileName.split("?")[0].split(".").pop() || "file").slice(0, 4).toUpperCase();

              return (
                <div key={file.id || idx} className="group flex min-w-0 items-center gap-3 rounded-lg border border-slate-200 p-2.5 transition-colors hover:border-primary/40 hover:bg-primary/5">
                  <a href={fullUrl} target="_blank" rel="noopener noreferrer" className="flex min-w-0 flex-1 items-center gap-3">
                    {isImg ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={fullUrl} alt="" className="h-11 w-11 shrink-0 rounded-md border object-cover" />
                    ) : (
                      <span className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-md bg-slate-100 text-slate-500">
                        {isImg ? <FileImage className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                        <span className="text-[9px] font-bold">{ext}</span>
                      </span>
                    )}
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-slate-800 group-hover:text-primary" title={fileName}>{fileName}</span>
                      <span className="text-xs text-slate-500">Open in new tab</span>
                    </span>
                  </a>
                  <div className="flex shrink-0 items-center gap-1">
                    <a href={fullUrl} target="_blank" rel="noopener noreferrer" title="Open file"
                      className="rounded-md p-1.5 text-slate-500 hover:bg-primary/10 hover:text-primary"><ExternalLink className="h-4 w-4" /></a>
                    {file.id && (
                      <Button type="button" variant="ghost" size="icon" title="Delete file"
                        className="h-8 w-8 rounded-md text-destructive hover:bg-destructive/10"
                        onClick={() => handleDeleteFile(file.id)} disabled={deletingFileId === file.id}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
