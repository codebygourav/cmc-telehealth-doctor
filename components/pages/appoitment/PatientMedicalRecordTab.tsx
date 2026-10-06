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
  Activity,
  HeartPulse,
  User,
  FlaskConical,
  Pill,
} from "lucide-react";
import {
  usePatientMedicalRecord,
  useDeletePatientMedicalRecordFiles,
} from "@/queries/usePatientMedicalRecord";
import { PatientMedicalRecordFile } from "@/api/patient-medical-record";

interface PatientMedicalRecordTabProps {
  appointmentId: string;
  viewSection?: "all" | "summary" | "files";
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
    return <p className="text-xs sm:text-sm font-medium leading-relaxed text-foreground">{rawLines[0].replace(/^[\d+[\.\)]|\-|\*]\s*/, "")}</p>;
  }

  return (
    <ol className="list-decimal list-inside space-y-1 text-xs sm:text-sm font-medium text-foreground">
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
  viewSection = "all",
}: PatientMedicalRecordTabProps) {
  const { data, isLoading, error } = usePatientMedicalRecord(appointmentId);
  const deleteFilesMutation = useDeletePatientMedicalRecordFiles();

  const [deletingFileId, setDeletingFileId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-3 rounded-2xl border border-border bg-card p-6 shadow-xs" aria-busy="true">
        <div className="h-5 w-48 animate-pulse rounded-lg bg-muted" />
        <div className="h-4 w-full animate-pulse rounded-lg bg-muted/60" />
        <div className="h-4 w-3/4 animate-pulse rounded-lg bg-muted/60" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center rounded-2xl border border-destructive/20 bg-destructive/5">
        <div className="flex items-center justify-center gap-2 text-destructive">
          <AlertCircle className="h-5 w-5" />
          <p className="text-sm font-semibold">Error loading Patient Medical Record</p>
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

  const fieldIconMap: Record<string, { icon: any; color: string }> = {
    "Final Diagnosis": { icon: Stethoscope, color: "text-primary" },
    "Chief Complaint": { icon: AlertCircle, color: "text-amber-600" },
    "History of Present Illness": { icon: FileText, color: "text-primary" },
    "Present Medical History": { icon: HeartPulse, color: "text-rose-600" },
    "Family History": { icon: User, color: "text-primary" },
    "Personal History": { icon: User, color: "text-muted-foreground" },
    Examination: { icon: Activity, color: "text-emerald-600" },
    "Clinical Notes": { icon: FileText, color: "text-muted-foreground" },
    Investigation: { icon: FlaskConical, color: "text-primary" },
    Treatment: { icon: Pill, color: "text-primary" },
  };

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

  const showSummary = (viewSection === "all" || viewSection === "summary") && medicalFields.length > 0;
  const showFiles = (viewSection === "all" || viewSection === "files") && filesList.length > 0;

  if (!showSummary && !showFiles) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-dashed border-border bg-card px-5 py-4 text-sm text-muted-foreground">
        <FileText className="h-5 w-5 shrink-0 text-muted-foreground opacity-60" />
        No record data or attachments recorded for this consultation section yet.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Patient Medical Record Summary */}
      {showSummary && (
        <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-xs">
          <header className="flex items-center justify-between gap-2 border-b border-border/70 px-4 sm:px-6 py-3.5 bg-muted/20">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Stethoscope className="h-4.5 w-4.5" />
              </span>
              <h3 className="text-sm sm:text-base font-bold text-foreground">
                Patient Medical Record Summary
              </h3>
            </div>
            <Badge variant="secondary" className="text-xs bg-primary/10 text-primary font-semibold">
              {medicalFields.length} {medicalFields.length === 1 ? "field" : "fields"}
            </Badge>
          </header>

          <dl className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 sm:p-5">
            {medicalFields.map((field) => {
              const meta = fieldIconMap[field.label] || { icon: FileText, color: "text-primary" };
              const IconComp = meta.icon;
              const isHero = field.label === "Final Diagnosis";
              return (
                <div
                  key={field.label}
                  className={`min-w-0 rounded-xl border p-3.5 space-y-1.5 transition-colors ${
                    isHero
                      ? "md:col-span-2 border-primary/30 bg-primary/5 shadow-2xs"
                      : "border-border/70 bg-muted/10 hover:bg-muted/30"
                  }`}
                >
                  <dt className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <IconComp className={`h-3.5 w-3.5 ${meta.color}`} />
                    {field.label}
                  </dt>
                  <dd className="min-w-0 break-words">{renderFormattedContent(field.value)}</dd>
                </div>
              );
            })}
          </dl>
        </section>
      )}

      {/* Media & Report Files */}
      {showFiles && (
        <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-xs">
          <header className="flex items-center justify-between gap-2 border-b border-border/70 px-4 sm:px-6 py-3.5 bg-muted/20">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Paperclip className="h-4.5 w-4.5" />
              </span>
              <h3 className="text-sm sm:text-base font-bold text-foreground">
                Attached Media &amp; Reports
              </h3>
            </div>
            <Badge variant="secondary" className="text-xs bg-primary/10 text-primary font-semibold">
              {filesList.length} {filesList.length === 1 ? "file" : "files"}
            </Badge>
          </header>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-4 sm:p-5">
            {filesList.map((file: any, idx: number) => {
              const fullUrl = getFileUrl(file);
              const isImg = isImageFile(file.file_url || file.url || file.name || file.file_name);
              const fileName = file.name || file.file_name || `Attachment #${idx + 1}`;
              const ext = (fileName.split("?")[0].split(".").pop() || "file").slice(0, 4).toUpperCase();

              return (
                <div
                  key={file.id || idx}
                  className="group flex min-w-0 items-center justify-between gap-3 rounded-xl border border-border bg-card p-3 transition-all hover:border-primary/40 hover:bg-primary/5 hover:shadow-2xs"
                >
                  <a
                    href={fullUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex min-w-0 flex-1 items-center gap-3"
                  >
                    {isImg ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={fullUrl} alt={fileName} className="h-11 w-11 shrink-0 rounded-lg border object-cover" />
                    ) : (
                      <span className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <FileText className="h-4 w-4" />
                        <span className="text-[9px] font-bold">{ext}</span>
                      </span>
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-bold text-foreground group-hover:text-primary transition-colors" title={fileName}>
                        {fileName}
                      </span>
                      <span className="text-[10px] text-muted-foreground">Click to view</span>
                    </span>
                  </a>

                  <div className="flex shrink-0 items-center gap-1">
                    <a
                      href={fullUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Open file in new tab"
                      className="rounded-lg p-1.5 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                    {file.id && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        title="Delete file"
                        className="h-8 w-8 rounded-lg text-destructive hover:bg-destructive/10"
                        onClick={() => handleDeleteFile(file.id)}
                        disabled={deletingFileId === file.id}
                      >
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
