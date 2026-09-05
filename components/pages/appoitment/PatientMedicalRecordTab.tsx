"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  AlertCircle,
  FileImage,
  ExternalLink,
  Trash2,
  Paperclip,
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

export default function PatientMedicalRecordTab({
  appointmentId,
}: PatientMedicalRecordTabProps) {
  const { data, isLoading, error } = usePatientMedicalRecord(appointmentId);
  const deleteFilesMutation = useDeletePatientMedicalRecordFiles();

  const [deletingFileId, setDeletingFileId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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

  if (filesList.length === 0) {
    return (
      <Card className="rounded-2xl border-dashed mt-2">
        <CardContent className="p-8 text-center">
          <div className="flex flex-col items-center gap-3">
            <FileText className="h-12 w-12 text-muted-foreground/60" />
            <div className="space-y-1">
              <h4 className="font-semibold text-base text-foreground">
                No Medical Reports or Media Files Uploaded
              </h4>
              <p className="text-xs text-muted-foreground">
                No attached medical reports or media files found for this appointment.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      {/* Media & Report Files Section */}
      <Card className="rounded-2xl border shadow-xs overflow-hidden">
        <CardHeader className="p-4 border-b bg-muted/10 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Paperclip className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-bold text-foreground">
              Attached Media & Reports ({filesList.length})
            </CardTitle>
          </div>
          <Badge variant="secondary" className="text-[10px]">
            Uploaded Attachments
          </Badge>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {filesList.map((file, idx) => {
              const fullUrl = getFileUrl(file);
              const isImg = isImageFile(file.file_url || file.url || file.name || file.file_name);
              const fileName = file.name || file.file_name || `Attachment #${idx + 1}`;

              return (
                <div
                  key={file.id || idx}
                  className="flex items-center justify-between p-3 bg-background border hover:border-primary/40 rounded-xl transition-all shadow-2xs gap-2"
                >
                  <a
                    href={fullUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 flex-1 min-w-0 text-xs font-semibold text-foreground hover:underline truncate"
                  >
                    {isImg ? (
                      <FileImage className="h-4 w-4 text-indigo-600 shrink-0" />
                    ) : (
                      <FileText className="h-4 w-4 text-slate-500 shrink-0" />
                    )}
                    <span className="truncate">{fileName}</span>
                  </a>

                  <div className="flex items-center gap-1 shrink-0">
                    <a
                      href={fullUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 text-muted-foreground hover:text-primary transition-colors bg-muted/40 hover:bg-primary/10 rounded-lg"
                      title="Open file"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                    {file.id && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:bg-destructive/10 rounded-lg"
                        title="Delete media file"
                        onClick={() => handleDeleteFile(file.id)}
                        disabled={deletingFileId === file.id}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
