"use client";

import { useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { CalendarClock, ClipboardList, Download, ExternalLink, FileText, Loader2, Lock, MessageCircle, Pill, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { usePrescriptionByAppointmentId } from "@/queries/usePrescriptionByAppointmentId";
import { usePatientMedicalRecord } from "@/queries/usePatientMedicalRecord";
import { useConclusionByAppointmentId } from "@/queries/useConclusionByAppointmentId";
import { downloadPatientMedicalRecord } from "@/api/patient-medical-record";
import { fetchFreshPrescriptionPdf } from "@/api/addPrescription";
import PdfPreviewDialog, { type PdfPreview } from "@/components/pdf/PdfPreviewDialog";
import SendPrescriptionWhatsAppDialog from "./SendPrescriptionWhatsAppDialog";
import { prescriptionShareKey } from "./PrescriptionShareHistory";

const text = (value: unknown): string => {
  if (value === null || value === undefined) return "";
  if (Array.isArray(value)) return value.flat().filter(Boolean).join(", ");
  return String(value).trim();
};

const RECORD_FIELDS: [string, string][] = [
  ["chief_complaint", "Chief complaint"],
  ["final_diagnosis", "Final diagnosis"],
  ["history_of_present_illness", "History of present illness"],
  ["present_medical_history", "Present medical history"],
  ["family_history", "Family history"],
  ["personal_history", "Personal history"],
  ["examination", "Examination"],
  ["investigation", "Investigation"],
  ["treatment", "Treatment"],
];

function Section({ icon: Icon, title, count, children, empty }: { icon: typeof Pill; title: string; count?: number; children?: ReactNode; empty?: string }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary"><Icon className="h-4 w-4" /></span>
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        {typeof count === "number" && <span className="rounded-full bg-slate-100 px-2 text-[11px] font-semibold leading-5 text-slate-600">{count}</span>}
      </div>
      {children ?? <p className="text-xs text-slate-500">{empty ?? "Nothing added."}</p>}
    </section>
  );
}

/**
 * Everything written for one appointment in one place: medicines, notes, medical record, tests and
 * files — to check before finishing, preview / download the PDFs or send the prescription on WhatsApp.
 */
export default function ConsultationSummaryDialog({
  open,
  onOpenChange,
  appointmentId,
  patientName,
  onEdit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointmentId: string;
  patientName?: string;
  /** Optional "Edit" button (e.g. opens the prescription dialog). */
  onEdit?: () => void;
}) {
  const queryClient = useQueryClient();
  const { data: prescription, isLoading: loadingRx } = usePrescriptionByAppointmentId(open ? appointmentId : "");
  const { data: recordResponse, isLoading: loadingRecord } = usePatientMedicalRecord(open ? appointmentId : "");
  const { data: conclusion } = useConclusionByAppointmentId(open ? appointmentId : "");
  const [pdf, setPdf] = useState<PdfPreview | null>(null);
  const [pdfLoading, setPdfLoading] = useState<null | "prescription" | "record">(null);
  const [shareOpen, setShareOpen] = useState(false);

  const rx: any = prescription?.data ?? {};
  const record: any = recordResponse?.data ?? {};
  const medicines: any[] = Array.isArray(rx.medicines) ? rx.medicines : [];
  const files = conclusion?.data?.shared_files ?? [];
  const recordFiles: any[] = Array.isArray(record.attached_docs) ? record.attached_docs : [];
  const recordRows = RECORD_FIELDS.map(([key, label]) => [label, text(record[key])] as const).filter(([, v]) => v);
  const instructions = text(rx.instructions_by_doctor);
  const notes = text(rx.notes);
  const confidential = text(record.clinical_notes);
  const recommended = text(record.recommended_tests);

  const openPdf = async (kind: "prescription" | "record") => {
    setPdfLoading(kind);
    try {
      const blob = kind === "prescription"
        ? await fetchFreshPrescriptionPdf(appointmentId)
        : new Blob([(await downloadPatientMedicalRecord(appointmentId)).data], { type: "application/pdf" });
      setPdf({
        title: kind === "prescription" ? "Prescription PDF" : "Patient Medical Record PDF",
        url: URL.createObjectURL(blob),
        filename: kind === "prescription" ? `Prescription-${appointmentId}.pdf` : `Medical-Record-${appointmentId}.pdf`,
      });
    } catch {
      alert("Could not create the PDF. Please try again.");
    } finally {
      setPdfLoading(null);
    }
  };
  const closePdf = () => {
    if (pdf?.url) URL.revokeObjectURL(pdf.url);
    setPdf(null);
    setPdfLoading(null);
  };

  const loading = loadingRx || loadingRecord;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="flex max-h-[92vh] w-[95vw] flex-col gap-0 overflow-hidden p-0 sm:max-w-4xl!">
          <DialogHeader className="shrink-0 border-b border-slate-200 px-5 py-4 text-left">
            <DialogTitle className="text-lg font-semibold">Consultation summary</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Everything added for this appointment{patientName ? ` with ${patientName}` : ""}. Check it, download the PDFs or send the prescription to the patient.
            </DialogDescription>
            <div className="flex flex-wrap gap-2 pt-2">
              <Button size="sm" variant="outline" className="border-primary/30 bg-primary/5 text-primary hover:bg-primary/10" disabled={pdfLoading !== null} onClick={() => openPdf("prescription")}>
                {pdfLoading === "prescription" ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Download className="mr-1.5 h-4 w-4" />} Prescription PDF
              </Button>
              <Button size="sm" variant="outline" className="border-primary/30 bg-primary/5 text-primary hover:bg-primary/10" disabled={pdfLoading !== null} onClick={() => openPdf("record")}>
                {pdfLoading === "record" ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <FileText className="mr-1.5 h-4 w-4" />} Medical Record PDF
              </Button>
              <Button size="sm" onClick={() => setShareOpen(true)}>
                <MessageCircle className="mr-1.5 h-4 w-4" /> Send on WhatsApp
              </Button>
            </div>
          </DialogHeader>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto bg-slate-50/60 p-4 sm:p-5">
            {loading ? (
              <div className="space-y-3">{[0, 1, 2].map((i) => <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-200/60" />)}</div>
            ) : (
              <>
                <Section icon={Pill} title="Medicines" count={medicines.length} empty="No medicines prescribed.">
                  {medicines.length > 0 ? (
                    <ol className="divide-y divide-slate-100">
                      {medicines.map((m, i) => (
                        <li key={m.prescription_id ?? i} className="flex gap-3 py-2 text-xs">
                          <span className="w-5 shrink-0 font-semibold text-slate-400">{i + 1}.</span>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900">{m.display_name || m.name}</p>
                            <p className="text-slate-600">
                              {[m.dosage, m.frequencylabel || m.frequency, m.meal, m.date].filter(Boolean).join(" · ") || text(m.display_instructions)}
                            </p>
                            {m.dosage && m.display_instructions && <p className="text-slate-500">{m.display_instructions}</p>}
                          </div>
                        </li>
                      ))}
                    </ol>
                  ) : undefined}
                </Section>

                <Section icon={Stethoscope} title="Notes & follow-up" empty="No notes, instructions or follow-up date.">
                  {instructions || notes || rx.next_visit_date ? (
                    <dl className="grid gap-3 text-xs sm:grid-cols-2">
                      {instructions && <div className="sm:col-span-2"><dt className="font-semibold text-slate-500">Instructions by doctor</dt><dd className="whitespace-pre-line text-slate-800">{instructions}</dd></div>}
                      {notes && <div><dt className="font-semibold text-slate-500">Notes</dt><dd className="whitespace-pre-line text-slate-800">{notes}</dd></div>}
                      {rx.next_visit_date && <div><dt className="flex items-center gap-1 font-semibold text-slate-500"><CalendarClock className="h-3.5 w-3.5" /> Next follow-up</dt><dd className="text-slate-800">{new Date(rx.next_visit_date).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short", year: "numeric" })}</dd></div>}
                    </dl>
                  ) : undefined}
                </Section>

                <Section icon={ClipboardList} title="Medical record" empty="No medical record written.">
                  {recordRows.length > 0 || confidential ? (
                    <div className="space-y-3">
                      {recordRows.length > 0 && (
                        <dl className="grid gap-3 text-xs sm:grid-cols-2">
                          {recordRows.map(([label, value]) => (
                            <div key={label}><dt className="font-semibold text-slate-500">{label}</dt><dd className="whitespace-pre-line text-slate-800">{value}</dd></div>
                          ))}
                        </dl>
                      )}
                      {confidential && (
                        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs">
                          <p className="flex items-center gap-1 font-semibold text-amber-800"><Lock className="h-3.5 w-3.5" /> Confidential Record — only you see this, never on the PDF</p>
                          <p className="mt-1 whitespace-pre-line text-amber-900">{confidential}</p>
                        </div>
                      )}
                    </div>
                  ) : undefined}
                </Section>

                <Section icon={FileText} title="Tests & reports" count={files.length + recordFiles.length} empty="No tests recommended and no files.">
                  {recommended || files.length > 0 || recordFiles.length > 0 ? (
                    <div className="space-y-3 text-xs">
                      {recommended && <div><p className="font-semibold text-slate-500">Recommended tests / reports</p><p className="whitespace-pre-line text-slate-800">{recommended}</p></div>}
                      {[...files.map((f) => ({ id: f.id, name: f.name, url: f.file_url, by: f.shared_by, at: f.uploaded_at, where: "Tests & reports" })),
                        ...recordFiles.map((f) => ({ id: f.id, name: f.name || f.file_name, url: f.file_url || f.url, by: f.uploaded_by ?? "doctor", at: f.uploaded_at, where: "Medical record" }))].map((f) => (
                        <a key={`${f.where}-${f.id}`} href={f.url || "#"} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-lg border border-slate-200 p-2 hover:border-primary/40">
                          <FileText className="h-4 w-4 shrink-0 text-slate-400" />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-medium text-slate-800">{f.name}</span>
                            <span className="text-[10px] text-slate-500">{f.where}{f.at ? ` · ${f.at}` : ""}</span>
                          </span>
                          <span className={`rounded-full px-1.5 text-[10px] font-semibold leading-4 ${f.by === "patient" ? "bg-sky-100 text-sky-800" : "bg-primary/10 text-primary"}`}>
                            {f.by === "patient" ? "By patient" : "By doctor"}
                          </span>
                          <ExternalLink className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                        </a>
                      ))}
                    </div>
                  ) : undefined}
                </Section>
              </>
            )}
          </div>

          <div className="flex shrink-0 justify-end gap-2 border-t border-slate-200 px-5 py-3">
            {onEdit && <Button variant="outline" onClick={() => { onOpenChange(false); onEdit(); }}>Edit notes &amp; prescription</Button>}
            <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>

      <PdfPreviewDialog preview={pdf} loading={pdfLoading !== null} onClose={closePdf} />
      <SendPrescriptionWhatsAppDialog
        appointmentId={appointmentId}
        open={shareOpen}
        onOpenChange={setShareOpen}
        onSent={() => queryClient.invalidateQueries({ queryKey: prescriptionShareKey(appointmentId) })}
      />
    </>
  );
}
