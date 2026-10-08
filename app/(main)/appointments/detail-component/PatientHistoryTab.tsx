"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useAppointmentById } from "@/queries/useAppointmentId";
import { usePatientMedicalRecord } from "@/queries/usePatientMedicalRecord";
import { PatientHistoryItem, PatientHistoryMedicine } from "@/types/appointment";
import {
  Activity,
  AlertCircle,
  Calendar,
  CalendarCheck,
  ChevronDown,
  ChevronUp,
  Clock,
  Download,
  ExternalLink,
  FileImage,
  FileText,
  FlaskConical,
  HeartPulse,
  History,
  Lock,
  Paperclip,
  Pill,
  Search,
  Stethoscope,
  User,
} from "lucide-react";
import { useMemo, useState } from "react";

interface PatientHistoryTabProps {
  appointment?: any;
  appointmentId?: string;
  patientHistory?: PatientHistoryItem[];
}

const PREVIEW_CHAR_LIMIT = 220;

function ReadMoreText({ text, className = "" }: { text: string; className?: string }) {
  const [expanded, setExpanded] = useState(false);
  const needsTrunc = text.length > PREVIEW_CHAR_LIMIT;
  return (
    <span className={className}>
      {needsTrunc && !expanded ? `${text.slice(0, PREVIEW_CHAR_LIMIT)}…` : text}
      {needsTrunc && (
        <button
          type="button"
          onClick={() => setExpanded((p) => !p)}
          className="ml-1.5 text-primary text-xs font-semibold hover:underline"
        >
          {expanded ? "Read less" : "Read more"}
        </button>
      )}
    </span>
  );
}

const getFileUrl = (file: any): string => {
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

const formatDate = (dateStr?: string | null, formatted?: string | null) => {
  if (formatted) return formatted;
  if (!dateStr) return "N/A";
  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString("en-US", {
        weekday: "short",
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    }
  } catch {
    // fallback
  }
  return dateStr;
};

// Format duration from start_date -> end_date
function formatDuration(start?: string | null, end?: string | null, isOngoing?: boolean): string {
  if (isOngoing && !end) return "Ongoing";
  if (end) {
    const endDate = new Date(end);
    if (!isNaN(endDate.getTime())) {
      return endDate.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    }
  }
  if (start) {
    const startDate = new Date(start);
    if (!isNaN(startDate.getTime())) {
      return startDate.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    }
  }
  return "—";
}

function ViewUploadedFilesModal({
  appointmentId,
  open,
  onOpenChange,
}: {
  appointmentId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data, isLoading } = usePatientMedicalRecord(appointmentId || "");
  const record = data?.data;
  const filesList =
    record?.attached_docs ||
    record?.files ||
    record?.medical_record_files ||
    record?.attached_files ||
    [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-5 sm:p-6 rounded-2xl">
        <DialogHeader className="pb-3 border-b">
          <DialogTitle className="text-base sm:text-lg font-bold flex items-center gap-2 text-foreground">
            <Paperclip className="h-5 w-5 text-primary" />
            Attached Media &amp; Reports
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="py-10 text-center space-y-2">
            <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-muted-foreground">Loading uploaded files...</p>
          </div>
        ) : filesList.length === 0 ? (
          <div className="py-10 text-center space-y-2">
            <Paperclip className="h-8 w-8 text-muted-foreground mx-auto opacity-40" />
            <p className="text-sm font-medium text-foreground">No uploaded files found</p>
            <p className="text-xs text-muted-foreground">No media or report files were attached to this medical record.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-1 gap-3 py-3 max-h-[60vh] overflow-y-auto">
            {filesList.map((file: any, idx: number) => {
              const fullUrl = getFileUrl(file);
              const fileName = file.name || file.file_name || `Attachment #${idx + 1}`;
              const isImg = isImageFile(file.file_url || file.url || file.name || file.file_name);
              return (
                <div
                  key={file.id || idx}
                  className="flex items-center justify-between p-3 rounded-md border border-border bg-card hover:bg-accent/50 transition-colors gap-3"
                >
                  <a
                    href={fullUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 min-w-0 flex-1 group"
                  >
                    {isImg ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={fullUrl} alt={fileName} className="h-10 w-10 rounded-lg object-cover border shrink-0" />
                    ) : (
                      <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <FileText className="h-5 w-5" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-foreground group-hover:text-primary truncate" title={fileName}>
                        {fileName}
                      </p>
                      <p className="text-[10px] text-muted-foreground">Click to view file</p>
                    </div>
                  </a>
                  <a
                    href={fullUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg bg-muted text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors shrink-0"
                    title="Open file"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ClinicalInfoCard({
  icon: Icon,
  iconColor,
  label,
  value,
  fullWidth = false,
  variant = "default",
}: {
  icon: any;
  iconColor: string;
  label: string;
  value: string;
  fullWidth?: boolean;
  variant?: "default" | "amber" | "green";
}) {
  const borderCls =
    variant === "amber"
      ? "border-amber-200 bg-amber-50/60 dark:border-amber-700/30 dark:bg-amber-900/10"
      : variant === "green"
        ? "border-emerald-200 bg-emerald-50/60 dark:border-emerald-700/30 dark:bg-emerald-900/10"
        : "border-border bg-muted/10";
  return (
    <div
      className={`p-3.5 rounded-md border space-y-1.5 ${borderCls}${fullWidth ? " col-span-1 md:col-span-2" : ""}`}
    >
      <p className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5 uppercase tracking-wide">
        <Icon className={`h-3.5 w-3.5 ${iconColor}`} />
        {label}
      </p>
      <p className="text-xs sm:text-[13px] font-medium text-foreground whitespace-pre-line leading-relaxed">
        <ReadMoreText text={value} />
      </p>
    </div>
  );
}

export default function PatientHistoryTab({
  appointment: propAppointment,
  appointmentId,
  patientHistory: customHistory,
}: PatientHistoryTabProps) {
  const targetId = appointmentId || propAppointment?.appointment_id || propAppointment?.id;
  const { data: fetchedData, isLoading } = useAppointmentById(targetId ? String(targetId) : "");

  const appointment = fetchedData?.data || propAppointment;

  const patientHistory: PatientHistoryItem[] = useMemo(() => {
    if (customHistory && Array.isArray(customHistory)) {
      return customHistory;
    }
    const history = fetchedData?.data?.patient_history || appointment?.patient_history || propAppointment?.patient_history;
    if (Array.isArray(history)) {
      return history;
    }
    return [];
  }, [appointment, fetchedData, propAppointment, customHistory]);

  const [openIds, setOpenIds] = useState<Record<string, boolean>>(() => {
    if (patientHistory.length > 0 && patientHistory[0].appointment_id) {
      return { [patientHistory[0].appointment_id]: true };
    }
    return {};
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "prescriptions" | "notes" | "tests">("all");
  const [isMobileFilterDrawerOpen, setIsMobileFilterDrawerOpen] = useState(false);
  const [selectedApptForFiles, setSelectedApptForFiles] = useState<string | null>(null);

  const getFilterLabel = (key: string) => {
    switch (key) {
      case "all": return "All Records";
      case "prescriptions": return "Prescriptions";
      case "notes": return "Clinical Notes";
      case "tests": return "Tests & Reports";
      default: return "All Records";
    }
  };

  const toggleItem = (apptId: string) => {
    setOpenIds((prev) => ({
      ...prev,
      [apptId]: !prev[apptId],
    }));
  };

  const expandAll = () => {
    const nextState: Record<string, boolean> = {};
    patientHistory.forEach((item) => {
      if (item.appointment_id) {
        nextState[item.appointment_id] = true;
      }
    });
    setOpenIds(nextState);
  };

  const collapseAll = () => {
    setOpenIds({});
  };

  const filteredHistory = useMemo(() => {
    return patientHistory.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        item.date?.toLowerCase().includes(q) ||
        item.date_formatted?.toLowerCase().includes(q) ||
        item.doctor_name?.toLowerCase().includes(q) ||
        item.diagnosis?.toLowerCase().includes(q) ||
        item.chief_complaint?.toLowerCase().includes(q) ||
        item.history_of_present_illness?.toLowerCase().includes(q) ||
        item.present_medical_history?.toLowerCase().includes(q) ||
        item.family_history?.toLowerCase().includes(q) ||
        item.personal_history?.toLowerCase().includes(q) ||
        item.examination?.toLowerCase().includes(q) ||
        item.treatment?.toLowerCase().includes(q) ||
        item.notes?.toLowerCase().includes(q) ||
        item.clinical_notes?.toLowerCase().includes(q) ||
        item.instructions_by_doctor?.toLowerCase().includes(q) ||
        item.order_investigation?.toLowerCase().includes(q) ||
        item.prescribed_medicines?.some((med) => med.medicine_name?.toLowerCase().includes(q));

      let matchCategory = true;
      if (activeFilter === "prescriptions") {
        matchCategory = (item.prescribed_medicines?.length ?? 0) > 0;
      } else if (activeFilter === "tests") {
        matchCategory = Boolean(item.order_investigation);
      } else if (activeFilter === "notes") {
        matchCategory = Boolean(
          item.diagnosis || item.chief_complaint || item.treatment || item.notes || item.clinical_notes
        );
      }

      return matchSearch && matchCategory;
    });
  }, [patientHistory, searchQuery, activeFilter]);

  if (isLoading && appointmentId && !propAppointment) {
    return (
      <Card className="rounded-2xl border shadow-xs bg-card">
        <CardContent className="py-10 text-center">
          <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-sm font-medium text-muted-foreground">Loading patient history...</p>
        </CardContent>
      </Card>
    );
  }

  if (!patientHistory.length) {
    return (
      <Card className="rounded-2xl border shadow-xs bg-card">
        <CardContent className="py-14 px-4 text-center">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
            <History className="h-7 w-7" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">No Patient History Available</h3>
          <p className="text-sm text-muted-foreground mt-1.5 max-w-md mx-auto">
            Previous consultation records, prescribed medicines, clinical notes, and investigations for this patient will
            appear here once recorded.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {/* Uploaded Files Modal */}
      <ViewUploadedFilesModal
        appointmentId={selectedApptForFiles}
        open={Boolean(selectedApptForFiles)}
        onOpenChange={(open) => {
          if (!open) setSelectedApptForFiles(null);
        }}
      />

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
            <History className="h-4.5 w-4.5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              Patient Consultation History
              <Badge
                variant="secondary"
                className="text-xs bg-primary/10 text-primary font-semibold hover:bg-primary/10"
              >
                {patientHistory.length} {patientHistory.length === 1 ? "Record" : "Records"}
              </Badge>
            </h3>
            <p className="text-xs text-muted-foreground">
              All appointments — prescriptions, diagnosis, notes, and investigations
            </p>
          </div>
        </div>

        {patientHistory.length > 1 && (
          <div className="flex items-center gap-1.5 justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={expandAll}
              className="text-xs h-7.5 px-2.5 rounded-lg border-border"
            >
              Expand All
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={collapseAll}
              className="text-xs h-7.5 px-2.5 rounded-lg border-border"
            >
              Collapse All
            </Button>
          </div>
        )}
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search by date, medicine, diagnosis, doctor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8.5 text-xs sm:text-sm h-8.5 bg-card rounded-md border-border"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground font-medium"
            >
              Clear
            </button>
          )}
        </div>

        {/* Desktop Filter Pills */}
        <div className="hidden md:flex items-center gap-1 shrink-0">
          {(
            [
              ["all", "All Records"],
              ["prescriptions", "Prescriptions"],
              ["notes", "Clinical Notes"],
              ["tests", "Tests"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveFilter(key)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${activeFilter === key
                ? "bg-primary text-primary-foreground shadow-2xs"
                : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground border border-border/60"
                }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Mobile Filter Drawer Trigger */}
        <div className="block md:hidden shrink-0 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setIsMobileFilterDrawerOpen(true)}
            className="w-full flex items-center justify-between gap-2 p-2 bg-white border border-slate-200 rounded-md text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
              <History className="h-3.5 w-3.5 text-primary" />
              <span>Filter: <strong className="text-primary font-bold">{getFilterLabel(activeFilter)}</strong></span>
            </div>
            <div className="flex items-center gap-1 text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-lg">
              Change
              <ChevronDown className="h-3 w-3" />
            </div>
          </button>
        </div>
      </div>

      {/* Mobile Category Filter Bottom Sheet Drawer */}
      <Dialog open={isMobileFilterDrawerOpen} onOpenChange={setIsMobileFilterDrawerOpen}>
        <DialogContent className="max-w-md w-full p-4 rounded-t-2xl sm:rounded-2xl fixed bottom-0 md:bottom-auto translate-y-0 sm:translate-y-0 max-h-[85vh] overflow-y-auto">
          <DialogHeader className="pb-2 border-b border-slate-100">
            <DialogTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
              <History className="h-4 w-4 text-primary" />
              Select Record Filter
            </DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-1">
            {(
              [
                ["all", "All Records"],
                ["prescriptions", "Prescriptions"],
                ["notes", "Clinical Notes"],
                ["tests", "Tests & Reports"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setActiveFilter(key);
                  setIsMobileFilterDrawerOpen(false);
                }}
                className={`w-full flex items-center justify-between p-3 rounded-md text-xs font-semibold transition-all ${activeFilter === key
                  ? "bg-primary text-white shadow-xs font-bold"
                  : "text-slate-700 hover:bg-slate-100"
                  }`}
              >
                <span>{label}</span>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Filtered empty */}
      {filteredHistory.length === 0 && (
        <Card className="rounded-md border shadow-xs bg-card">
          <CardContent className="py-8 text-center">
            <Search className="h-7 w-7 text-muted-foreground mx-auto mb-2 opacity-50" />
            <p className="text-sm font-medium text-foreground">No matching records found</p>
            <p className="text-xs text-muted-foreground mt-1">Try modifying your search query or filter category</p>
          </CardContent>
        </Card>
      )}

      {/* Accordion List */}
      <div className="space-y-2.5">
        {filteredHistory.map((item, index) => {
          const itemKey = item.appointment_id || `history-${index}`;
          const isOpen = !!openIds[itemKey];
          const medicines = item.prescribed_medicines || [];
          const filesCount = (item.attached_docs?.length || item.files?.length || 0);
          const timeFormatted = item.time_formatted || item.time;

          const hasConsultationData =
            item.diagnosis ||
            item.chief_complaint ||
            item.history_of_present_illness ||
            item.present_medical_history ||
            item.family_history ||
            item.personal_history ||
            item.examination ||
            item.treatment ||
            item.order_investigation ||
            item.instructions_by_doctor ||
            item.notes ||
            item.clinical_notes ||
            item.confidential_notes ||
            item.next_visit_date;

          return (
            <div
              key={itemKey}
              className={`rounded-md overflow-hidden bg-card shadow-2xs transition-all border ${isOpen
                ? "border-primary/40 shadow-xs"
                : "border-border/80 hover:border-border"
                }`}
            >
              {/* Toggle Header */}
              <button
                type="button"
                onClick={() => toggleItem(itemKey)}
                aria-expanded={isOpen}
                className={`w-full text-left p-3 sm:p-3.5 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 cursor-pointer ${isOpen ? "bg-primary/5 border-b border-primary/15" : "bg-muted/15 hover:bg-muted/30"
                  }`}
              >
                {/* Left: Date + Doctor info (NO redundant OCT date box!) */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                    <Calendar className="h-4 w-4" />
                  </div>

                  <div className="space-y-0.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold text-foreground">
                        {formatDate(item.date, item.date_formatted)}
                      </span>
                      {timeFormatted && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md bg-muted text-muted-foreground border border-border/60">
                          <Clock className={`h-3 w-3 ${isOpen ? "text-primary" : "text-muted-foreground"}`} />
                          {timeFormatted}
                        </span>
                      )}
                    </div>
                    {item.doctor_name && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                        <User className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span className="truncate">Consulted with {item.doctor_name}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Badges + View Details */}
                <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {medicines.length > 0 && (
                      <Badge
                        variant="outline"
                        className={`text-[11px] font-semibold flex items-center gap-1 border ${isOpen ? "border-primary/30 bg-primary/5 text-primary" : "border-border bg-card"
                          }`}
                      >
                        <Pill className="h-3 w-3 text-primary" />
                        {medicines.length} {medicines.length === 1 ? "Medicine" : "Medicines"}
                      </Badge>
                    )}
                    {filesCount > 0 && (
                      <Badge
                        variant="outline"
                        className="text-[11px] font-semibold flex items-center gap-1 border border-primary/30 bg-primary/5 text-primary"
                      >
                        <Paperclip className="h-3 w-3 text-primary" />
                        {filesCount} {filesCount === 1 ? "File" : "Files"}
                      </Badge>
                    )}
                    {item.next_visit_date && (
                      <Badge
                        variant="secondary"
                        className="text-[11px] font-medium hidden md:inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200"
                      >
                        <CalendarCheck className="h-3 w-3 text-emerald-600" />
                        Next: {formatDate(item.next_visit_date)}
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-1 text-xs font-semibold text-primary">
                    <span>{isOpen ? "Hide Details" : "View Details"}</span>
                    {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </div>
              </button>

              {/* Accordion Body */}
              {isOpen && (
                <div className="bg-card divide-y divide-border/50">


                  {/* SECTION 1: Prescribed Medicines */}
                  <div className="px-3 sm:px-4 py-3 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-xs sm:text-sm font-bold text-foreground flex items-center gap-1.5">
                        <div className="p-1 rounded-md bg-primary/10 text-primary">
                          <Pill className="h-3.5 w-3.5" />
                        </div>
                        Prescribed Medicines
                        <Badge variant="secondary" className="text-[10px] bg-primary/10 text-primary font-semibold px-1.5 py-0">
                          {medicines.length}
                        </Badge>
                      </h4>
                      {/* Appointment Action Bar */}
                      <div className="px-3 sm:px-6 py-2.5 flex items-center justify-end bg-muted/20">
                        <div className="flex flex-row items-center gap-1.5 sm:gap-2 justify-end w-full sm:w-auto">
                          {/* Button to view all uploaded files */}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            title="View Uploaded Files"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedApptForFiles(item.appointment_id);
                            }}
                            className="text-xs h-8 px-2.5 sm:px-3 rounded-lg border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 gap-1.5 font-semibold shrink-0"
                          >
                            <Paperclip className="h-3.5 w-3.5 shrink-0" />
                            <span className="hidden sm:inline">View Uploaded Files</span>
                          </Button>

                          {/* Link to view appointment */}
                          <a
                            href={`/appointments/${item.appointment_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="View Appointment"
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition px-2.5 sm:px-3 py-1.5 rounded-lg border border-primary/30 bg-primary/5 hover:bg-primary/10 h-8 shrink-0"
                          >
                            <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                            <span className="hidden sm:inline">View Appointment</span>
                          </a>

                          {item.pdf_url ? (
                            <a
                              href={item.pdf_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Download PDF"
                              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/90 transition shadow-xs cursor-pointer h-8 shrink-0"
                            >
                              <Download className="h-3.5 w-3.5 shrink-0" />
                              <span className="hidden sm:inline">Download PDF</span>
                            </a>
                          ) : (
                            <Button
                              disabled
                              variant="outline"
                              size="sm"
                              title="Download PDF"
                              className="text-xs text-muted-foreground gap-1.5 opacity-50 rounded-lg h-8 px-2.5 sm:px-3 shrink-0"
                            >
                              <Download className="h-3.5 w-3.5 shrink-0" />
                              <span className="hidden sm:inline">Download PDF</span>
                            </Button>
                          )}
                        </div>
                      </div>
                      {medicines.length > 0 && (
                        <span className="text-[10px] text-muted-foreground italic">All items digitally verified</span>
                      )}
                    </div>

                    {medicines.length === 0 ? (
                      <div className="p-2.5 rounded-lg border border-dashed border-border bg-muted/15 text-center text-xs text-muted-foreground">
                        No medicines prescribed for this consultation.
                      </div>
                    ) : (
                      <div className="overflow-x-auto rounded-md border border-border bg-card shadow-2xs">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-muted/60 border-b border-border text-muted-foreground font-semibold text-[11px] uppercase tracking-wide">
                              <th className="py-2.5 px-3 w-10 text-center">#</th>
                              <th className="py-2.5 px-3 min-w-[220px]">Medicine &amp; Type</th>
                              <th className="py-2.5 px-3 min-w-[150px]">Duration</th>
                              <th className="py-2.5 px-3 min-w-[260px]">Instructions &amp; Remarks</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/50">
                            {medicines.map((med: PatientHistoryMedicine, medIdx: number) => {
                              const durationStr = formatDuration(med.start_date, med.end_date, med.is_ongoing);

                              return (
                                <tr
                                  key={med.prescription_id || medIdx}
                                  className="hover:bg-muted/20 transition-colors"
                                >
                                  <td className="py-3 px-3 text-center font-medium text-muted-foreground">{medIdx + 1}</td>

                                  <td className="py-2.5 px-3">
                                    <div className="space-y-0.5">
                                      <span className="font-bold text-foreground block">
                                        {med.medicine_name}
                                      </span>
                                      {med.dosage && (
                                        <span className="text-[11px] text-muted-foreground block">
                                          {med.dosage}
                                        </span>
                                      )}
                                    </div>
                                  </td>

                                  <td className="py-2.5 px-3">
                                    <div className="text-xs font-semibold">
                                      {med.is_ongoing ? (
                                        <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-200 text-[10px] font-semibold px-2 py-0.5">
                                          Ongoing
                                        </Badge>
                                      ) : (
                                        <span className="text-muted-foreground">{durationStr}</span>
                                      )}
                                    </div>
                                    {med.end_date && !med.is_ongoing && (
                                      <div className="text-[10px] text-muted-foreground mt-0.5">
                                        {med.end_date
                                          ? (() => {
                                            const start = med.start_date ? new Date(med.start_date) : null;
                                            const end = new Date(med.end_date);
                                            if (start && !isNaN(end.getTime())) {
                                              const diffMs = end.getTime() - start.getTime();
                                              const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
                                              return days > 0 ? `${days} Days Course` : "";
                                            }
                                            return "";
                                          })()
                                          : ""}
                                      </div>
                                    )}
                                  </td>

                                  <td className="py-3 px-3">
                                    {med.instructions ? (
                                      <span className="text-xs text-amber-900 dark:text-amber-200 bg-amber-500/10 px-2 py-1 rounded-md border border-amber-500/20 inline-block leading-snug">
                                        <ReadMoreText text={med.instructions} />
                                      </span>
                                    ) : (
                                      <span className="text-muted-foreground">—</span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* SECTION 2: Clinical Examination & Diagnostics */}
                  {hasConsultationData && (
                    <div className="px-4 sm:px-6 py-5 space-y-3">
                      <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                          <Stethoscope className="h-4 w-4" />
                        </div>
                        Clinical Examination &amp; Diagnostics
                      </h4>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {item.diagnosis && (
                          <ClinicalInfoCard
                            icon={Stethoscope}
                            iconColor="text-primary"
                            label="Diagnosis"
                            value={item.diagnosis}
                          />
                        )}
                        {item.order_investigation && (
                          <div className="p-3.5 rounded-md border border-border bg-muted/10 space-y-1.5">
                            <p className="text-[11px] font-semibold text-muted-foreground flex items-center justify-between gap-1.5 uppercase tracking-wide">
                              <span className="flex items-center gap-1.5">
                                <FlaskConical className="h-3.5 w-3.5 text-primary" />
                                Order Investigation / Tests
                              </span>
                              <Badge className="text-[10px] px-1.5 py-0 bg-sky-50 text-sky-700 border-sky-200 font-semibold border">
                                Ordered
                              </Badge>
                            </p>
                            <p className="text-xs sm:text-[13px] font-medium text-foreground whitespace-pre-line leading-relaxed">
                              <ReadMoreText text={item.order_investigation} />
                            </p>
                          </div>
                        )}

                        {item.instructions_by_doctor && (
                          <ClinicalInfoCard
                            icon={FileText}
                            iconColor="text-primary"
                            label="Instructions by Doctor"
                            value={item.instructions_by_doctor}
                          />
                        )}
                        {(item.notes || item.clinical_notes) && (
                          <ClinicalInfoCard
                            icon={FileText}
                            iconColor="text-muted-foreground"
                            label="Patient Reported Clinical Notes"
                            value={item.clinical_notes || item.notes || ""}
                          />
                        )}

                        {item.chief_complaint && (
                          <ClinicalInfoCard
                            icon={AlertCircle}
                            iconColor="text-amber-600"
                            label="Chief Complaint"
                            value={item.chief_complaint}
                          />
                        )}
                        {item.history_of_present_illness && (
                          <ClinicalInfoCard
                            icon={FileText}
                            iconColor="text-primary"
                            label="History of Present Illness"
                            value={item.history_of_present_illness}
                          />
                        )}
                        {item.present_medical_history && (
                          <ClinicalInfoCard
                            icon={HeartPulse}
                            iconColor="text-rose-600"
                            label="Present Medical History"
                            value={item.present_medical_history}
                          />
                        )}
                        {item.family_history && (
                          <ClinicalInfoCard
                            icon={User}
                            iconColor="text-primary"
                            label="Family History"
                            value={item.family_history}
                          />
                        )}
                        {item.personal_history && (
                          <ClinicalInfoCard
                            icon={User}
                            iconColor="text-muted-foreground"
                            label="Personal History"
                            value={item.personal_history}
                          />
                        )}
                        {item.examination && (
                          <ClinicalInfoCard
                            icon={Activity}
                            iconColor="text-emerald-600"
                            label="Clinical Examination Findings"
                            value={item.examination}
                          />
                        )}
                        {item.treatment && (
                          <ClinicalInfoCard
                            icon={Pill}
                            iconColor="text-primary"
                            label="Treatment Plan"
                            value={item.treatment}
                            fullWidth
                          />
                        )}
                      </div>

                      {/* Bottom row: Next Visit + Confidential side by side */}
                      {(item.next_visit_date || item.confidential_notes) && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                          {item.next_visit_date && (
                            <div className="p-3.5 rounded-md border border-emerald-200 bg-emerald-50/60 dark:border-emerald-700/30 dark:bg-emerald-900/10 space-y-1.5">
                              <p className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5 uppercase tracking-wide">
                                <CalendarCheck className="h-3.5 w-3.5 text-emerald-600" />
                                Next Scheduled Visit
                              </p>
                              <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                                {formatDate(item.next_visit_date)}
                              </p>
                              <p className="text-[10px] text-muted-foreground">Slot confirmed</p>
                            </div>
                          )}

                          {item.confidential_notes && (
                            <div className="p-3.5 rounded-md border border-amber-200 bg-amber-50/60 dark:border-amber-700/30 dark:bg-amber-900/10 space-y-1.5">
                              <p className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 flex items-center justify-between gap-1.5 uppercase tracking-wide">
                                <span className="flex items-center gap-1.5">
                                  <Lock className="h-3.5 w-3.5 text-amber-600" />
                                  Confidential Notes (Doctor Only)
                                </span>
                                <Badge className="text-[10px] px-1.5 py-0 bg-amber-100 text-amber-700 border border-amber-300 font-semibold">
                                  Restricted Access
                                </Badge>
                              </p>
                              <p className="text-xs sm:text-[13px] font-mono text-foreground whitespace-pre-line leading-relaxed">
                                <ReadMoreText text={item.confidential_notes} />
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
