"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Upload,
  Trash2,
  Calendar,
  Loader2,
  Plus,
  Paperclip,
  CheckCircle2,
  AlertCircle,
  FileImage,
  ExternalLink,
} from "lucide-react";
import {
  PatientMedicalRecordData,
  PatientMedicalRecordFile,
} from "@/api/patient-medical-record";
import {
  useSavePatientMedicalRecord,
  useDeletePatientMedicalRecordFiles,
} from "@/queries/usePatientMedicalRecord";

interface PatientMedicalRecordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointmentId: string;
  initialData?: PatientMedicalRecordData | null;
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

export default function PatientMedicalRecordDialog({
  open,
  onOpenChange,
  appointmentId,
  initialData,
}: PatientMedicalRecordDialogProps) {
  const saveMutation = useSavePatientMedicalRecord();
  const deleteFilesMutation = useDeletePatientMedicalRecordFiles();

  const [formData, setFormData] = useState({
    chief_complaint: "",
    history_of_present_illness: "",
    present_medical_history: "",
    family_history: "",
    personal_history: "",
    examination: "",
    final_diagnosis: "",
    investigation: "",
    treatment: "",
    notes: "",
  });

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [existingFiles, setExistingFiles] = useState<PatientMedicalRecordFile[]>([]);
  const [fileToDelete, setFileToDelete] = useState<PatientMedicalRecordFile | null>(null);
  const [toastMessage, setToastMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    if (open) {
      setFormData({
        chief_complaint: initialData?.chief_complaint || "",
        history_of_present_illness: initialData?.history_of_present_illness || "",
        present_medical_history: initialData?.present_medical_history || "",
        family_history: initialData?.family_history || "",
        personal_history: initialData?.personal_history || "",
        examination: initialData?.examination || "",
        final_diagnosis: initialData?.final_diagnosis || "",
        investigation: initialData?.investigation || "",
        treatment: initialData?.treatment || "",
        notes: initialData?.notes || initialData?.clinical_notes || "",
      });

      const filesList =
        initialData?.attached_docs ||
        initialData?.files ||
        initialData?.medical_record_files ||
        initialData?.attached_files ||
        [];
      setExistingFiles(filesList);
      setSelectedFiles([]);
      setFileToDelete(null);
      setToastMessage(null);
    }
  }, [open, initialData]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const handleRemoveSelectedFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDeleteExistingFile = async (file: PatientMedicalRecordFile) => {
    if (!file.id) return;
    try {
      await deleteFilesMutation.mutateAsync({
        appointmentId,
        fileIds: [file.id],
      });
      setExistingFiles((prev) => prev.filter((f) => f.id !== file.id));
      setFileToDelete(null);
      setToastMessage({
        type: "success",
        text: "Media file deleted successfully",
      });
    } catch (err: any) {
      setToastMessage({
        type: "error",
        text: err?.response?.data?.message || "Failed to delete file",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appointmentId) return;

    try {
      await saveMutation.mutateAsync({
        appointmentId,
        ...formData,
        notes: formData.notes,
        clinical_notes: formData.notes,
        files: selectedFiles,
        attached_docs: selectedFiles,
        type: "patient_medical_record",
      });
      setToastMessage({
        type: "success",
        text: "Patient Medical Record saved successfully",
      });
      setTimeout(() => {
        onOpenChange(false);
      }, 800);
    } catch (err: any) {
      setToastMessage({
        type: "error",
        text:
          err?.response?.data?.message ||
          "Failed to save Patient Medical Record",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-4 sm:p-6 rounded-2xl">
        <DialogHeader className="pb-3 border-b">
          <DialogTitle className="text-lg sm:text-xl font-bold flex items-center gap-2 text-foreground">
            <FileText className="h-5 w-5 text-primary" />
            {initialData ? "Edit Patient Medical Record" : "Add Patient Medical Record"}
          </DialogTitle>
        </DialogHeader>

        {toastMessage && (
          <div
            className={`p-3 rounded-xl flex items-center gap-2 text-xs font-semibold ${
              toastMessage.type === "success"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            {toastMessage.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 py-2">
          {/* Main Grid of Textarea Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Chief Complaint */}
            <div className="space-y-1.5">
              <Label htmlFor="chief_complaint" className="text-xs font-bold text-foreground">
                Chief Complaint
              </Label>
              <Textarea
                id="chief_complaint"
                name="chief_complaint"
                placeholder="Primary reason for visit..."
                rows={3}
                value={formData.chief_complaint}
                onChange={handleInputChange}
                className="text-xs rounded-xl resize-none focus:border-primary"
              />
            </div>

            {/* History of Present Illness */}
            <div className="space-y-1.5">
              <Label htmlFor="history_of_present_illness" className="text-xs font-bold text-foreground">
                History of Present Illness
              </Label>
              <Textarea
                id="history_of_present_illness"
                name="history_of_present_illness"
                placeholder="Detailed timeline and symptoms..."
                rows={3}
                value={formData.history_of_present_illness}
                onChange={handleInputChange}
                className="text-xs rounded-xl resize-none focus:border-primary"
              />
            </div>

            {/* Present Medical History */}
            <div className="space-y-1.5">
              <Label htmlFor="present_medical_history" className="text-xs font-bold text-foreground">
                Present Medical History
              </Label>
              <Textarea
                id="present_medical_history"
                name="present_medical_history"
                placeholder="Existing conditions or active treatments..."
                rows={3}
                value={formData.present_medical_history}
                onChange={handleInputChange}
                className="text-xs rounded-xl resize-none focus:border-primary"
              />
            </div>

            {/* Family History */}
            <div className="space-y-1.5">
              <Label htmlFor="family_history" className="text-xs font-bold text-foreground">
                Family History
              </Label>
              <Textarea
                id="family_history"
                name="family_history"
                placeholder="Hereditary diseases / family history..."
                rows={3}
                value={formData.family_history}
                onChange={handleInputChange}
                className="text-xs rounded-xl resize-none focus:border-primary"
              />
            </div>

            {/* Personal History */}
            <div className="space-y-1.5">
              <Label htmlFor="personal_history" className="text-xs font-bold text-foreground">
                Personal History
              </Label>
              <Textarea
                id="personal_history"
                name="personal_history"
                placeholder="Lifestyle, habits, allergies..."
                rows={3}
                value={formData.personal_history}
                onChange={handleInputChange}
                className="text-xs rounded-xl resize-none focus:border-primary"
              />
            </div>

            {/* Examination */}
            <div className="space-y-1.5">
              <Label htmlFor="examination" className="text-xs font-bold text-foreground">
                Examination
              </Label>
              <Textarea
                id="examination"
                name="examination"
                placeholder="Vitals & clinical inspection findings..."
                rows={3}
                value={formData.examination}
                onChange={handleInputChange}
                className="text-xs rounded-xl resize-none focus:border-primary"
              />
            </div>

            {/* Final Diagnosis */}
            <div className="space-y-1.5">
              <Label htmlFor="final_diagnosis" className="text-xs font-bold text-foreground">
                Final Diagnosis
              </Label>
              <Textarea
                id="final_diagnosis"
                name="final_diagnosis"
                placeholder="Conclusive medical diagnosis..."
                rows={3}
                value={formData.final_diagnosis}
                onChange={handleInputChange}
                className="text-xs rounded-xl resize-none focus:border-primary"
              />
            </div>

            {/* Investigation */}
            <div className="space-y-1.5">
              <Label htmlFor="investigation" className="text-xs font-bold text-foreground">
                Investigation
              </Label>
              <Textarea
                id="investigation"
                name="investigation"
                placeholder="Ordered tests (lab, radiology)..."
                rows={3}
                value={formData.investigation}
                onChange={handleInputChange}
                className="text-xs rounded-xl resize-none focus:border-primary"
              />
            </div>

            {/* Treatment */}
            <div className="space-y-1.5">
              <Label htmlFor="treatment" className="text-xs font-bold text-foreground">
                Treatment
              </Label>
              <Textarea
                id="treatment"
                name="treatment"
                placeholder="Prescribed medications & care plan..."
                rows={3}
                value={formData.treatment}
                onChange={handleInputChange}
                className="text-xs rounded-xl resize-none focus:border-primary"
              />
            </div>

            {/* Doctor Instructions */}
            {/* Notes */}
            <div className="space-y-1.5">
              <Label htmlFor="notes" className="text-xs font-bold text-foreground">
                Clinical Notes
              </Label>
              <Textarea
                id="notes"
                name="notes"
                placeholder="Additional clinical notes..."
                rows={3}
                value={formData.notes}
                onChange={handleInputChange}
                className="text-xs rounded-xl resize-none focus:border-primary"
              />
            </div>
          </div>

          {/* Media Attachments Section */}
          <div className="space-y-3 pt-2 border-t">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Paperclip className="h-4 w-4 text-primary" />
                Attached Media & Reports (PDF, PNG, JPG, JPEG, WEBP)
              </Label>
              <Badge variant="secondary" className="text-[10px]">
                Progressive Upload
              </Badge>
            </div>

            {/* Existing Uploaded Files List */}
            {existingFiles.length > 0 && (
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                  Previously Uploaded Files ({existingFiles.length})
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {existingFiles.map((file, idx) => {
                    const fullUrl = getFileUrl(file);
                    const isImg = isImageFile(file.file_url || file.url || file.name || file.file_name);
                    const fileName = file.name || file.file_name || `Attachment #${idx + 1}`;
                    return (
                      <div
                        key={file.id || idx}
                        className="flex items-center justify-between p-2.5 bg-muted/20 border rounded-xl text-xs gap-2"
                      >
                        <a
                          href={fullUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 flex-1 min-w-0 font-medium text-foreground hover:underline truncate"
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
                            className="p-1 text-muted-foreground hover:text-primary transition-colors"
                            title="Open file"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                          {file.id && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:bg-destructive/10 rounded-lg shrink-0"
                              onClick={() => handleDeleteExistingFile(file)}
                              disabled={deleteFilesMutation.isPending}
                              title="Delete media file"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {selectedFiles.length > 0 && (
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-bold text-primary tracking-wider">
                  New Files to Upload ({selectedFiles.length})
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedFiles.map((file, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 bg-primary/5 border border-primary/20 rounded-xl text-xs gap-2"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Upload className="h-4 w-4 text-primary shrink-0" />
                        <span className="truncate font-medium text-foreground">
                          {file.name}
                        </span>
                        <span className="text-[10px] text-muted-foreground shrink-0">
                          ({(file.size / 1024).toFixed(0)} KB)
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:bg-destructive/10 rounded-lg shrink-0"
                        onClick={() => handleRemoveSelectedFile(idx)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* File Upload Input Drop Area */}
            <div className="relative border-2 border-dashed border-muted hover:border-primary/50 transition-colors rounded-xl p-4 text-center cursor-pointer bg-background">
              <input
                type="file"
                multiple
                accept=".pdf,.png,.jpg,.jpeg,.webp"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center gap-1 pointer-events-none">
                <Upload className="h-6 w-6 text-muted-foreground" />
                <p className="text-xs font-semibold text-foreground">
                  Click or drag files here to attach media
                </p>
                <p className="text-[10px] text-muted-foreground">
                  Supports PDF, PNG, JPG, JPEG, WEBP files
                </p>
              </div>
            </div>
          </div>

          <DialogFooter className="pt-3 border-t flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="text-xs h-9 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saveMutation.isPending}
              className="text-xs h-9 rounded-xl flex items-center gap-1.5"
            >
              {saveMutation.isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Patient Medical Record"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
