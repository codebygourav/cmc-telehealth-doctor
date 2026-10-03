"use client";

import AddPrescriptionDialog from "@/components/pages/appoitment/AddPrescriptionDialog";
import EditConclusionDialog from "@/components/pages/appoitment/EditConclusionDialog";
import PatientMedicalRecordTab from "@/components/pages/appoitment/PatientMedicalRecordTab";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useConclusionByAppointmentId } from "@/queries/useConclusionByAppointmentId";
import { usePrescriptionByAppointmentId } from "@/queries/usePrescriptionByAppointmentId";
import { useDeletePrescriptionItem } from "@/queries/useDeletePrescriptionItem";
import { useDeleteConclusionFile } from "@/queries/useDeleteConclusionFile";
import { cleanAndDeduplicateText, parseClinicalInstructions } from "@/src/utils/cleanClinicalText";
import {
  AlertCircle,
  Clock,
  Download,
  ExternalLink,
  FileImage,
  FileText,
  Mic,
  Trash2,
  Pencil,
  ClipboardPlus,
  FilePlus2,
  ClipboardCheck,
  CalendarDays,
  Stethoscope,
  FlaskConical,
  NotebookPen,
  ListChecks,
  Lock,
} from "lucide-react";
import { useState } from "react";

// TypeScript interfaces
interface Medicine {
  prescription_id: string;
  medicine_id?: string;
  name: string;
  type: string;
  status: string;
  dosage: string;
  strength?: string;
  frequency?: string;
  frequencylabel: string;
  times: string;
  meal: string;
  date: string;
  application_area?: string;
  start_date?: string;
  end_date?: string;
  follow_up_note?: string;
  instructions?: string[];
  notes?: string;
  use_type?: string;
  take_when?: string;
  min_gap?: string;
  max_doses_per_day?: string;
  patient_instruction?: string;
  medicine_source?: "inventory" | "doctor_added" | "unknown";
  created_via?: "speech" | null;
}

type DraftHistoryItem = {
  id: string;
  source_type?: "text" | "speech" | string;
  status?: string;
  input_text?: string;
  confidence_score?: number | null;
  warnings?: string[];
  missing_fields?: string[];
  applied_at?: string | null;
  medicine_name?: string | null;
  medicine_source?: "inventory" | "doctor_added" | "unknown" | null;
  created_medicines?: Array<{
    prescription_id?: string;
    medicine_name?: string;
    medicine_source?: "inventory" | "doctor_added" | "unknown";
  }>;
};

type DictationAssistantConfig = {
  enabled?: boolean;
  input_mode?: string;
  text_mode_max_chars?: number;
  speech_locale?: string;
  supported_locales?: string[];
  allow_custom_locale?: boolean;
  requires_doctor_review?: boolean;
  browser_speech_enabled?: boolean;
};
type ConclusionReportFile = {
  id: string;
  name: string;
  url?: string;
  file_url?: string;
  type?: string;
};

const getFileUrl = (fileOrUrl: ConclusionReportFile | string | undefined | null): string => {
  if (!fileOrUrl) return "#";
  const rawUrl = typeof fileOrUrl === "string" ? fileOrUrl : (fileOrUrl.file_url || fileOrUrl.url || "");
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


// Accordion Item Component
export default function PrescriptionTab({
  appointmentId,
}: {
  appointmentId: string;
}) {
  const deleteMutation = useDeletePrescriptionItem(appointmentId);
  const deleteConclusionFileMutation = useDeleteConclusionFile(appointmentId);

  const { data, isLoading, error } =
    usePrescriptionByAppointmentId(appointmentId);
  const { data: conclusionData } = useConclusionByAppointmentId(appointmentId);
  const [subTab, setSubTab] = useState<"prescription" | "medical_record">("prescription");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [dialogTab, setDialogTab] = useState<"findings" | "medicines" | "reports" | "medical_record" | "prescribe">("prescribe");
  const [dialogMode, setDialogMode] = useState<"full" | "medicines" | "medical_record" | "reports">("full");
  const [deleteTarget, setDeleteTarget] = useState<Medicine | null>(null);
  const [fileToDelete, setFileToDelete] = useState<ConclusionReportFile | null>(null);
  const [previewFile, setPreviewFile] = useState<ConclusionReportFile | null>(null);
  // Medicine row being edited (opens the dialog on it) and the small conclusion editor.
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [isConclusionOpen, setIsConclusionOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8 sm:py-12">
        <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 sm:p-6 text-center">
        <div className="flex items-center justify-center gap-2 text-red-500">
          <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5" />
          <p className="text-xs sm:text-sm">Error loading prescription</p>
        </div>
      </div>
    );
  }

  const medicines = data?.data?.medicines || [];
  const draftHistory = (data?.data?.draft_history ?? []) as DraftHistoryItem[];
  const pdfUrl = data?.data?.pdf_url;
  const instructionsByDoctorRaw =
    data?.data?.instructions_by_doctor ||
    conclusionData?.data?.instructions_by_doctor || "";

  const parsedClinical = parseClinicalInstructions(instructionsByDoctorRaw);

  const rawPrescriptionNotes = data?.data?.notes;
  const rawClinicalNotes = data?.data?.clinical_notes;
  const isDistinctPrescriptionNote =
    Boolean(rawPrescriptionNotes) &&
    (!rawClinicalNotes || rawPrescriptionNotes.trim() !== rawClinicalNotes.trim());

  const notes =
    (isDistinctPrescriptionNote ? rawPrescriptionNotes : undefined) ||
    (conclusionData?.data as any)?.notes ||
    parsedClinical.notes ||
    undefined;

  const confidentialNotes =
    data?.data?.confidential_notes ||
    (conclusionData?.data as any)?.confidential_notes ||
    undefined;

  const diagnosis =
    data?.data?.diagnosis ||
    (conclusionData?.data as any)?.diagnosis ||
    parsedClinical.diagnosis ||
    undefined;

  const orderInvestigation =
    data?.data?.order_investigation ||
    data?.data?.order_investigations ||
    (conclusionData?.data as any)?.order_investigation ||
    (conclusionData?.data as any)?.order_investigations ||
    parsedClinical.orderInvestigation ||
    undefined;

  const instructionsByDoctor = parsedClinical.instructionsByDoctor || undefined;

  const instructionsParts = instructionsByDoctor ? instructionsByDoctor.split("Recommended Tests:") : [];
  const rawFindings = instructionsParts[0] ? instructionsParts[0].replace("Clinical Findings:", "").trim() : "";
  const initialFindings = cleanAndDeduplicateText(rawFindings);
  const initialRecommendedTests = instructionsParts[1] ? cleanAndDeduplicateText(instructionsParts[1]) : "";
  const nextVisitDate = data?.data?.next_visit_date || conclusionData?.data?.next_visit_date;
  const dictationAssistant = (data?.data?.dictation_assistant ??
    null) as DictationAssistantConfig | null;
  const doctorAddedCount = medicines.filter(
    (medicine: Medicine) => medicine.medicine_source === "doctor_added",
  ).length;
  const voiceAddedCount = medicines.filter(
    (medicine: Medicine) => medicine.created_via === "speech",
  ).length;
  const speechDraftHistoryCount = draftHistory.filter(
    (draft) => draft.source_type === "speech",
  ).length;

  // Conclusion data
  const conclusionFiles = (conclusionData?.data?.conclusion_report_files ??
    []) as ConclusionReportFile[];

  // Filter out files uploaded from patient medical record tab
  const doctorReferenceFiles = conclusionFiles.filter((file) => {
    const typeLower = (file.type || "").toLowerCase();
    const nameLower = (file.name || "").toLowerCase();
    const isPatientMedicalRecord =
      typeLower === "patient_medical_record" ||
      typeLower === "patient-medical-record" ||
      typeLower.includes("patient_medical_record") ||
      typeLower.includes("patient-medical-record") ||
      nameLower.includes("patient_medical_record") ||
      nameLower.includes("patient-medical-record");
    return !isPatientMedicalRecord;
  });

  // Check if both prescription and conclusion are empty
  const hasPrescriptionData =
    medicines.length > 0 || instructionsByDoctor || diagnosis || orderInvestigation || notes || nextVisitDate || pdfUrl;
  const hasConclusionData =
    doctorReferenceFiles.length > 0 ||
    instructionsByDoctor ||
    diagnosis ||
    orderInvestigation ||
    notes ||
    nextVisitDate;

  if (!hasPrescriptionData && !hasConclusionData) {
    return (
      <>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 mt-4 mb-4 w-full">
          <Button type="button" variant="outline" className="w-full sm:w-auto h-8 sm:h-9 text-xs sm:text-sm flex items-center gap-1.5"
            onClick={() => { setEditIndex(null); setDialogMode("medical_record"); setDialogTab("medical_record"); setIsAddDialogOpen(true); }}>
            <ClipboardPlus className="h-3.5 w-3.5" /> Medical Record
          </Button>
          <Button type="button" variant="outline" className="w-full sm:w-auto h-8 sm:h-9 text-xs sm:text-sm flex items-center gap-1.5"
            onClick={() => { setEditIndex(null); setDialogMode("reports"); setDialogTab("reports"); setIsAddDialogOpen(true); }}>
            <FilePlus2 className="h-3.5 w-3.5" /> Tests & Reports
          </Button>
          <Button
            type="button"
            onClick={() => {
              setDialogMode("full");
              setDialogTab("prescribe");
              setIsAddDialogOpen(true);
            }}
            className="w-full sm:w-auto h-8 sm:h-9 text-xs sm:text-sm"
          >
            Add Notes & Prescription
          </Button>
        </div>
        <Card>
          <CardContent className="p-6 sm:p-8 text-center">
            <div className="flex flex-col items-center gap-2 sm:gap-3">
              <FileText className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground" />
              <p className="text-xs sm:text-sm text-muted-foreground">
                No prescription or conclusion available
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Start by adding findings, diagnostics, or a prescription
              </p>
            </div>
          </CardContent>
        </Card>
        <PatientMedicalRecordTab appointmentId={appointmentId} />
        <AddPrescriptionDialog
          open={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
          mode={dialogMode}
          initialTab={dialogTab}
          assistantConfig={dictationAssistant}
          initialMedicines={medicines}
          initialFindings={initialFindings}
          initialNextVisitDate={nextVisitDate}
          initialRecommendedTests={initialRecommendedTests}
          initialGeneralNotes={data?.data?.follow_up_note}
          initialDiagnosis={diagnosis}
          initialOrderInvestigation={orderInvestigation}
          initialNotes={notes}
          initialConfidentialNotes={confidentialNotes}
          initialInstructionsByDoctor={instructionsByDoctor}
        />
      </>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-5 md:space-y-6">
      <div className="flex flex-wrap items-center justify-end gap-2 w-full">
        {pdfUrl && (
            <a href={pdfUrl} target="_blank" rel="noopener noreferrer"
              className="inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-md border border-primary/30 bg-white px-3 text-xs font-medium text-primary transition-colors hover:bg-primary/5 sm:h-9 sm:w-auto sm:text-sm">
              <Download className="h-3.5 w-3.5" /> Download Prescription (PDF)
            </a>
          )}
          <Button type="button" variant="outline" className="w-full sm:w-auto h-8 sm:h-9 text-xs sm:text-sm flex items-center gap-1.5"
            onClick={() => { setEditIndex(null); setDialogMode("medical_record"); setDialogTab("medical_record"); setIsAddDialogOpen(true); }}>
            <ClipboardPlus className="h-3.5 w-3.5" /> Medical Record
          </Button>
          <Button type="button" variant="outline" className="w-full sm:w-auto h-8 sm:h-9 text-xs sm:text-sm flex items-center gap-1.5"
            onClick={() => { setEditIndex(null); setDialogMode("reports"); setDialogTab("reports"); setIsAddDialogOpen(true); }}>
            <FilePlus2 className="h-3.5 w-3.5" /> Tests & Reports
          </Button>
          <Button
          type="button"
          onClick={() => {
            setDialogMode("full");
            setDialogTab("prescribe");
            setIsAddDialogOpen(true);
          }}
          className="w-full sm:w-auto h-8 sm:h-9 text-xs sm:text-sm flex items-center gap-1.5"
        >
          <Pencil className="h-3.5 w-3.5" />
          Edit Notes & Prescription
        </Button>
      </div>

      <PatientMedicalRecordTab appointmentId={appointmentId} />

      {/* Medicines List - Accordion */}
      {medicines.length > 0 && (
        <div className="space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between gap-3 w-full flex-wrap">
            <div className="flex items-center gap-2">
              <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10">
                <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-sm sm:text-base md:text-lg">
                  Prescribed Medicines
                </h3>
                <div className="flex flex-wrap gap-1.5 mt-0.5">
                  <Badge
                    variant="secondary"
                    className="text-[10px] sm:text-xs px-1.5 sm:px-2"
                  >
                    {medicines.length} Items
                  </Badge>
                  {voiceAddedCount > 0 && (
                    <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 text-[10px] sm:text-xs px-1.5 sm:px-2">
                      {voiceAddedCount} Voice-added
                    </Badge>
                  )}
                  {doctorAddedCount > 0 && (
                    <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 text-[10px] sm:text-xs px-1.5 sm:px-2">
                      {doctorAddedCount} Doctor-added
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs flex items-center gap-1 shrink-0"
              onClick={() => {
                setEditIndex(null);
                setDialogMode("medicines");
                setDialogTab("prescribe");
                setIsAddDialogOpen(true);
              }}
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit Medicines
            </Button>
          </div>

          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
            <div className="overflow-x-auto">
              <table className="block w-full text-left text-sm md:table">
                <thead className="hidden bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500 md:table-header-group">
                  <tr>
                    <th className="w-10 px-4 py-3">#</th>
                    <th className="px-4 py-3">Medicine</th>
                    <th className="px-4 py-3">How to take</th>
                    <th className="px-4 py-3">Duration</th>
                    <th className="w-24 px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="block divide-y divide-slate-100 md:table-row-group">
                  {medicines.map((medicine: Medicine, index: number) => {
                    const m = medicine as any;
                    // Formulary lines carry everything in their notes (no dosage / frequency).
                    const isNoteLine = !String(m.dosage || "").trim() && !String(m.frequency || m.frequencylabel || "").trim();
                    const howToTake = isNoteLine ? "" : [m.dosage, m.frequencylabel || m.frequency, Array.isArray(m.times) ? m.times.join(", ") : m.times, m.meal?.replace?.(/_/g, " ")]
                      .filter((part: unknown) => typeof part === "string" && part.trim())
                      .join(" · ");
                    const duration = typeof m.date === "string" && /\S\s*-\s*\S/.test(m.date) ? m.date : "";
                    const notesText = Array.isArray(m.instructions) ? m.instructions.join(", ") : m.instructions || m.notes || "";
                    return (
                      <tr key={m.prescription_id || index} className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-2 gap-y-1 px-3 py-3 align-top hover:bg-slate-50/60 md:table-row md:p-0">
                        <td className="hidden px-4 py-3 text-slate-400 md:table-cell">{index + 1}</td>
                        <td className="min-w-0 md:table-cell md:px-4 md:py-3">
                          <p className="font-semibold leading-snug text-slate-900"><span className="mr-1 text-slate-400 md:hidden">{index + 1}.</span>{m.name || m.medicine_name}</p>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {m.type && <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">{m.type}</span>}
                            {m.created_via === "speech" && <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700">Voice</span>}
                            {m.medicine_source === "doctor_added" && <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">Typed</span>}
                          </div>
                        </td>
                        <td className="col-span-2 row-start-2 text-slate-700 md:table-cell md:px-4 md:py-3">
                          {howToTake && <p>{howToTake}</p>}
                          {notesText && <p className={`whitespace-pre-line ${howToTake ? "mt-1 text-xs text-slate-500" : "text-slate-800"}`}>{notesText}</p>}
                          {!howToTake && !notesText && <span className="text-slate-400">—</span>}
                        </td>
                        <td className="col-span-2 row-start-3 text-xs text-slate-500 md:table-cell md:whitespace-nowrap md:px-4 md:py-3 md:text-sm md:text-slate-600"><span className="md:hidden">Duration: </span>{duration || (isNoteLine ? "As in notes" : "—")}</td>
                        <td className="col-start-2 row-start-1 md:table-cell md:px-4 md:py-3">
                          <div className="flex justify-end gap-1">
                            <button type="button" title="Edit" aria-label={`Edit ${m.name || m.medicine_name}`}
                              onClick={() => { setEditIndex(index); setDialogMode("medicines"); setDialogTab("prescribe"); setIsAddDialogOpen(true); }}
                              className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-primary">
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button type="button" title="Remove" aria-label={`Remove ${m.name || m.medicine_name}`}
                              onClick={() => setDeleteTarget(medicine)}
                              className="rounded-md p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recommended Diagnostics / Tests */}
          {((instructionsByDoctor && instructionsByDoctor.includes("Recommended Tests:")) || doctorReferenceFiles.length > 0) && (
            <Card className="overflow-hidden border border-indigo-100 hover:shadow-md transition-all duration-300 rounded-2xl bg-linear-to-br from-indigo-50/10 to-indigo-50/30 mt-4">
              <CardHeader className="p-4 sm:p-5 border-b border-indigo-100/50 bg-indigo-50/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-indigo-600" />
                    <CardTitle className="text-sm font-bold text-indigo-900">Recommended Diagnostics & Patient Reports</CardTitle>
                  </div>
                  <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-100 text-[10px] uppercase font-bold tracking-wider">
                    Diagnostics Active
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-5 space-y-4">
                {instructionsByDoctor && instructionsByDoctor.includes("Recommended Tests:") && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">Assigned Tests</span>
                    <p className="text-xs sm:text-sm font-medium text-foreground bg-background p-3 rounded-xl border border-indigo-50 whitespace-pre-line leading-relaxed">
                      {instructionsByDoctor.split("Recommended Tests:")[1]?.trim()}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  {/* Doctor Uploads */}
                  <div className="space-y-2">
                    <span className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider block">Doctor Reference Files</span>
                    {doctorReferenceFiles.length > 0 ? (
                      <div className="space-y-2">
                        {doctorReferenceFiles.map((file, idx) => {
                          const fullUrl = getFileUrl(file);
                          const isImg = isImageFile(file.file_url || file.url || file.name);

                          return (
                            <div
                              key={file.id || idx}
                              className="flex items-center justify-between p-2.5 bg-background hover:bg-indigo-50/40 border border-muted rounded-xl transition-all text-xs text-indigo-950 font-semibold shadow-xs gap-2"
                            >
                              <a
                                href={fullUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 flex-1 min-w-0 text-left hover:underline focus:outline-none"
                              >
                                {isImg ? (
                                  <FileImage className="h-4 w-4 text-indigo-600 shrink-0" />
                                ) : (
                                  <FileText className="h-4 w-4 text-slate-500 shrink-0" />
                                )}
                                <span className="truncate">{file.name || `Reference Document #${idx + 1}`}</span>
                              </a>

                              <div className="flex items-center gap-1 shrink-0">
                                <a
                                  href={fullUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1.5 text-indigo-700 hover:text-indigo-900 transition-colors bg-indigo-50 hover:bg-indigo-100 rounded-lg"
                                  title="Open in new tab"
                                >
                                  <ExternalLink className="h-4 w-4" />
                                </a>

                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-lg"
                                  title="Delete report"
                                  onClick={() => setFileToDelete(file)}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs italic text-muted-foreground bg-background/50 p-3 rounded-xl border border-dashed text-center">No reference files uploaded by doctor</p>
                    )}
                  </div>

                  {/* Patient Upload Status */}
                  <div className="space-y-2">
                    <span className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider block">Patient Report Upload</span>
                    {doctorReferenceFiles.some(f => f.type === "patient-uploaded" || f.name?.toLowerCase().includes("patient")) ? (
                      <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl flex items-center gap-2">
                        <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-xs text-emerald-800 font-bold">Patient uploaded report files successfully</span>
                      </div>
                    ) : (
                      <div className="p-3 bg-amber-50/50 border border-amber-100 rounded-xl flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-amber-400" />
                          <span className="text-xs text-amber-800 font-medium">Reports Pending Patient Upload</span>
                        </div>
                        <Badge variant="outline" className="text-[9px] bg-white border-amber-200 text-amber-700">Awaiting Upload</Badge>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

        </div>
      )}

      {draftHistory.length > 0 && (
        <Card className="overflow-hidden p-0">
          <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-4 border-b">
            <CardTitle className="flex flex-wrap items-center gap-2 text-sm sm:text-base">
              <Mic className="h-4 w-4 text-primary" />
              Draft Verification
              <Badge
                variant="secondary"
                className="text-[10px] sm:text-xs px-1.5 sm:px-2"
              >
                {draftHistory.length} Drafts
              </Badge>
              {speechDraftHistoryCount > 0 && (
                <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 text-[10px] sm:text-xs px-1.5 sm:px-2">
                  {speechDraftHistoryCount} Voice
                </Badge>
              )}
            </CardTitle>
          </CardHeader>

          <CardContent className="p-3 sm:p-4 space-y-3">
            {draftHistory.map((draft) => (
              <div
                key={draft.id}
                className="rounded-lg border bg-muted/20 p-3 sm:p-4 space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      className={`text-[10px] sm:text-xs px-1.5 sm:px-2 ${draft.source_type === "speech"
                        ? "bg-blue-100 text-blue-700 hover:bg-blue-100"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-100"
                        }`}
                    >
                      {draft.source_type === "speech"
                        ? "Voice Draft"
                        : "Typed Draft"}
                    </Badge>
                    {draft.medicine_source === "doctor_added" && (
                      <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 text-[10px] sm:text-xs px-1.5 sm:px-2">
                        Doctor-added medicine
                      </Badge>
                    )}
                    {draft.medicine_source === "inventory" && (
                      <Badge
                        variant="outline"
                        className="text-[10px] sm:text-xs px-1.5 sm:px-2"
                      >
                        Stock medicine
                      </Badge>
                    )}
                    {typeof draft.confidence_score === "number" && (
                      <Badge
                        variant="outline"
                        className="text-[10px] sm:text-xs px-1.5 sm:px-2"
                      >
                        Confidence {draft.confidence_score}%
                      </Badge>
                    )}
                  </div>

                  {draft.applied_at && (
                    <p className="text-[10px] sm:text-xs text-muted-foreground">
                      Applied{" "}
                      {new Date(draft.applied_at).toLocaleString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </p>
                  )}
                </div>

                {draft.input_text && (
                  <div className="space-y-1">
                    <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wide">
                      Doctor Input
                    </p>
                    <p className="text-xs sm:text-sm leading-relaxed wrap-break-word">
                      {draft.input_text}
                    </p>
                  </div>
                )}

                {draft.created_medicines &&
                  draft.created_medicines.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wide">
                        Saved Medicines
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {draft.created_medicines.map((medicine, index) => (
                          <Badge
                            key={`${draft.id}-medicine-${medicine.prescription_id ?? index}`}
                            variant="outline"
                            className="text-[10px] sm:text-xs px-1.5 sm:px-2"
                          >
                            {medicine.medicine_name}
                            {medicine.medicine_source === "doctor_added"
                              ? " • doctor-added"
                              : medicine.medicine_source === "inventory"
                                ? " • stock"
                                : ""}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                {(draft.warnings?.length || draft.missing_fields?.length) && (
                  <div className="rounded-lg bg-amber-50 p-2.5 sm:p-3">
                    <p className="text-[10px] sm:text-xs text-amber-700 uppercase tracking-wide mb-1">
                      Review Notes
                    </p>
                    {draft.warnings?.length ? (
                      <ul className="list-disc list-inside space-y-1 text-[11px] sm:text-sm text-amber-800">
                        {draft.warnings.map((warning) => (
                          <li key={`${draft.id}-warning-${warning}`}>
                            {warning}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    {draft.missing_fields?.length ? (
                      <p className="text-[11px] sm:text-sm text-amber-800 mt-1">
                        Missing fields: {draft.missing_fields.join(", ")}
                      </p>
                    ) : null}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Conclusion: icon sections, next visit banner, confidential notes kept apart */}
      {(instructionsByDoctor || diagnosis || orderInvestigation || notes || confidentialNotes || nextVisitDate) && (
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <header className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10"><ClipboardCheck className="h-4 w-4 text-primary" /></span>
              <h3 className="text-sm font-semibold text-slate-900 sm:text-base">Conclusion</h3>
            </div>
            <Button variant="outline" size="sm" className="h-8 shrink-0 gap-1 text-xs" onClick={() => setIsConclusionOpen(true)}>
              <Pencil className="h-3.5 w-3.5" /> Edit Conclusion
            </Button>
          </header>

          <div className="space-y-4 p-3 sm:p-4">
            {nextVisitDate && (
              <div className="flex items-center gap-3 rounded-lg bg-primary px-4 py-3 text-white">
                <CalendarDays className="h-5 w-5 shrink-0" />
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-white/70">Next visit</p>
                  <p className="text-sm font-semibold">{new Date(nextVisitDate).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {([
                ["Final diagnosis", diagnosis, Stethoscope],
                ["Order / Investigation", orderInvestigation, FlaskConical],
                ["Notes", notes, NotebookPen],
                ["Instructions by doctor", instructionsByDoctor ? cleanAndDeduplicateText(instructionsByDoctor) || instructionsByDoctor : undefined, ListChecks],
              ] as [string, string | undefined, typeof Stethoscope][])
                .filter(([, value]) => typeof value === "string" && value.trim())
                .map(([label, value, Icon]) => {
                  const lines = String(value).split(/\n+/).map((l) => l.replace(/^(\d+[.)]\s+|[-•*]\s*)/, "").trim()).filter(Boolean);
                  return (
                    <div key={label} className="min-w-0 rounded-lg border border-slate-100 bg-slate-50/70 p-3">
                      <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        <Icon className="h-3.5 w-3.5 text-primary" /> {label}
                      </p>
                      {lines.length > 1 ? (
                        <ul className="space-y-1 text-sm text-slate-800">
                          {lines.map((line, i) => (
                            <li key={i} className="flex gap-2 break-words"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />{line}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="break-words text-sm leading-relaxed text-slate-800">{lines[0]}</p>
                      )}
                    </div>
                  );
                })}
            </div>

            {confidentialNotes && confidentialNotes.trim() && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                <p className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-amber-800">
                  <Lock className="h-3.5 w-3.5" /> Confidential notes · not shown to the patient
                </p>
                <p className="whitespace-pre-line break-words text-sm text-amber-900">{confidentialNotes}</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* File URLs - Only show for type "other" */}
      {doctorReferenceFiles.some((f) => f.type === "other") && (
        <div className="mt-3 sm:mt-4 p-4 border rounded-lg">
          <p className="text-base font-medium tracking-wide mb-1 sm:mb-2">
            Uploaded by Doctor
          </p>
          <div className="space-y-2">
            {doctorReferenceFiles
              .filter((f) => f.type === "other")
              .map((file, index: number) => {
                const url = getFileUrl(file);
                return (
                  <a
                    key={file.id || index}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-2 bg-white rounded border hover:bg-blue-50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-800 truncate flex-1">
                        {file.name || `File ${index + 1}`}
                      </span>
                    </div>
                    <ExternalLink className="h-4 w-4 text-blue-600 shrink-0" />
                  </a>
                );
              })}
          </div>
        </div>
      )}

      <EditConclusionDialog
        open={isConclusionOpen}
        onOpenChange={setIsConclusionOpen}
        appointmentId={appointmentId}
        initial={{ diagnosis, orderInvestigation, notes, confidentialNotes, instructionsByDoctor, nextVisitDate }}
      />

      <AddPrescriptionDialog
        open={isAddDialogOpen}
        onOpenChange={(value) => { setIsAddDialogOpen(value); if (!value) setEditIndex(null); }}
        mode={dialogMode}
        initialTab={dialogTab}
        initialEditIndex={editIndex}
        assistantConfig={dictationAssistant}
        initialMedicines={medicines}
        initialFindings={initialFindings}
        initialNextVisitDate={nextVisitDate}
        initialRecommendedTests={initialRecommendedTests}
        initialGeneralNotes={data?.data?.follow_up_note}
        initialDiagnosis={diagnosis}
        initialOrderInvestigation={orderInvestigation}
        initialNotes={notes}
        initialConfidentialNotes={confidentialNotes}
        initialInstructionsByDoctor={instructionsByDoctor}
      />

      {deleteTarget && (
        <Dialog
          open={!!deleteTarget}
          onOpenChange={(open) => !open && setDeleteTarget(null)}
        >
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-destructive flex items-center gap-2">
                Remove Medicine
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to remove{" "}
                <strong className="text-foreground">{deleteTarget.name}</strong>{" "}
                from this prescription? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex sm:justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDeleteTarget(null)}
                disabled={deleteMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={deleteMutation.isPending}
                onClick={async () => {
                  try {
                    const remainingMedicines = medicines.filter(
                      (m: Medicine) => m.prescription_id !== deleteTarget.prescription_id
                    );

                    const medicinesPayload = remainingMedicines.map((med: Medicine) => {
                      const timings: string[] = [];
                      const timesStr = String(med.times || "").toLowerCase();
                      if (timesStr.includes("morning")) timings.push("morning");
                      if (timesStr.includes("afternoon")) timings.push("afternoon");
                      if (timesStr.includes("evening")) timings.push("evening");
                      if (timesStr.includes("night")) timings.push("night");

                      const mapFrequencyLabelToValue = (lbl: string): string => {
                        const norm = String(lbl || "").toLowerCase().trim();
                        if (norm.includes("once") || norm === "od") return "OD";
                        if (norm.includes("twice") || norm === "bd") return "BD";
                        if (norm.includes("three") || norm === "tds") return "TDS";
                        if (norm.includes("sos")) return "SOS";
                        return "OD";
                      };

                      const ensureValidDate = (dateStr: any): string | null => {
                        if (!dateStr) return null;
                        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
                        const parsed = Date.parse(dateStr);
                        if (!isNaN(parsed)) return new Date(parsed).toISOString().split("T")[0];
                        return null;
                      };

                      const rawDate = med.date || "";
                      let fallbackStartDate = new Date().toISOString().split("T")[0];
                      if (rawDate && /^\d{4}-\d{2}-\d{2}$/.test(rawDate.split(" - ")[0])) {
                        fallbackStartDate = rawDate.split(" - ")[0];
                      }

                      return {
                        medicine_id: med.prescription_id || med.medicine_id || null,
                        medicine_name: (med.name || "").trim(),
                        medication_type: med.type || "tablet",
                        strength: med.strength || "",
                        dosage: med.dosage,
                        frequency: med.frequency || mapFrequencyLabelToValue(med.frequencylabel) || "OD",
                        timings,
                        meal: med.meal || "after_meal",
                        application_area: med.application_area || "",
                        start_date: ensureValidDate(med.start_date) || fallbackStartDate,
                        end_date: ensureValidDate(med.end_date) || null,
                        instructions: med.instructions?.join(", ") || "",
                      };
                    });

                    await deleteMutation.mutateAsync(deleteTarget.prescription_id);
                  } catch (err) {
                    console.error(err);
                  } finally {
                    setDeleteTarget(null);
                  }
                }}
              >
                {deleteMutation.isPending ? "Removing..." : "Remove"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* File Preview Dialog */}
      {previewFile && (
        <Dialog open={!!previewFile} onOpenChange={(open) => !open && setPreviewFile(null)}>
          <DialogContent className="max-w-3xl w-[95vw] p-4 sm:p-6 rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-base sm:text-lg font-bold flex items-center justify-between gap-2 pr-6">
                <span className="truncate">{previewFile.name || "Medical Report Preview"}</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                View uploaded document or image
              </DialogDescription>
            </DialogHeader>

            <div className="mt-2 flex flex-col items-center justify-center bg-slate-950/5 rounded-xl border p-2 sm:p-4 max-h-[70vh] overflow-auto">
              {isImageFile(previewFile.url || previewFile.name) ? (
                <img
                  src={getFileUrl(previewFile.url)}
                  alt={previewFile.name || "Report Image"}
                  className="max-h-[65vh] w-auto max-w-full object-contain rounded-lg shadow-sm"
                />
              ) : (
                <iframe
                  src={getFileUrl(previewFile.url)}
                  title={previewFile.name || "Document Preview"}
                  className="w-full h-[60vh] border-0 rounded-lg"
                />
              )}
            </div>

            <DialogFooter className="flex flex-row items-center justify-between gap-2 pt-3 border-t mt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPreviewFile(null)}
              >
                Close
              </Button>

              <a
                href={getFileUrl(previewFile.url)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Open Full File
              </a>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Report Confirmation Dialog */}
      {fileToDelete && (
        <Dialog open={!!fileToDelete} onOpenChange={(open) => !open && setFileToDelete(null)}>
          <DialogContent className="max-w-md w-[95vw] p-4 sm:p-6 rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-base sm:text-lg font-bold text-destructive flex items-center gap-2">
                <Trash2 className="h-5 w-5" />
                Delete Medical Report
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm text-muted-foreground mt-2">
                Are you sure you want to delete <span className="font-semibold text-foreground">&quot;{fileToDelete.name || "this file"}&quot;</span>? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>

            <DialogFooter className="flex flex-row items-center justify-end gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={deleteConclusionFileMutation.isPending}
                onClick={() => setFileToDelete(null)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                disabled={deleteConclusionFileMutation.isPending}
                onClick={async () => {
                  if (!fileToDelete) return;
                  try {
                    await deleteConclusionFileMutation.mutateAsync(fileToDelete.id);
                    setFileToDelete(null);
                  } catch (err: any) {
                    console.error("Delete report file error:", err);
                    alert(err?.response?.data?.message || err?.message || "Failed to delete file");
                  }
                }}
              >
                {deleteConclusionFileMutation.isPending ? "Deleting..." : "Delete Report"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
