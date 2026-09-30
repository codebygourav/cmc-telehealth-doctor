"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PatientHistoryItem, PatientHistoryMedicine } from "@/types/appointment";
import {
  Calendar,
  CalendarCheck,
  ChevronDown,
  ChevronUp,
  Clock,
  Download,
  ExternalLink,
  FileText,
  History,
  Lock,
  Pill,
  Search,
  Stethoscope,
  TestTube,
  User,
  Utensils,
} from "lucide-react";
import { useMemo, useState } from "react";

interface PatientHistoryTabProps {
  appointment: any;
}

const formatMealText = (meal?: string | null) => {
  if (!meal) return "";
  switch (meal.toLowerCase()) {
    case "after_meal":
      return "After Meal";
    case "before_meal":
      return "Before Meal";
    case "with_meal":
      return "With Meal";
    case "empty_stomach":
      return "Empty Stomach";
    default:
      return meal.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }
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
    // fallback to original string
  }
  return dateStr;
};

export default function PatientHistoryTab({ appointment }: PatientHistoryTabProps) {
  const patientHistory: PatientHistoryItem[] = useMemo(() => {
    const history = appointment?.patient_history;
    if (Array.isArray(history)) {
      return history;
    }
    return [];
  }, [appointment]);

  // Keep track of which appointment card toggles are open
  // Default to expanding the first history item if available
  const [openIds, setOpenIds] = useState<Record<string, boolean>>(() => {
    if (patientHistory.length > 0 && patientHistory[0].appointment_id) {
      return { [patientHistory[0].appointment_id]: true };
    }
    return {};
  });

  const [searchQuery, setSearchQuery] = useState("");

  const toggleItem = (appointmentId: string) => {
    setOpenIds((prev) => ({
      ...prev,
      [appointmentId]: !prev[appointmentId],
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
    if (!searchQuery.trim()) return patientHistory;
    const q = searchQuery.toLowerCase().trim();

    return patientHistory.filter((item) => {
      const matchDate =
        item.date?.toLowerCase().includes(q) ||
        item.date_formatted?.toLowerCase().includes(q);
      const matchDoctor = item.doctor_name?.toLowerCase().includes(q);
      const matchDiagnosis = item.diagnosis?.toLowerCase().includes(q);
      const matchNotes = item.notes?.toLowerCase().includes(q);
      const matchInstructions = item.instructions_by_doctor?.toLowerCase().includes(q);
      const matchInvestigation = item.order_investigation?.toLowerCase().includes(q);
      const matchMedicine = item.prescribed_medicines?.some((med) =>
        med.medicine_name?.toLowerCase().includes(q)
      );

      return (
        matchDate ||
        matchDoctor ||
        matchDiagnosis ||
        matchNotes ||
        matchInstructions ||
        matchInvestigation ||
        matchMedicine
      );
    });
  }, [patientHistory, searchQuery]);

  // Empty state when no history is present
  if (!patientHistory.length) {
    return (
      <Card className="rounded-2xl border shadow-xs">
        <CardContent className="py-14 px-4 text-center">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
            <History className="h-7 w-7" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">
            No Patient History Available
          </h3>
          <p className="text-sm text-muted-foreground mt-1.5 max-w-md mx-auto">
            Previous consultation records, prescribed medicines, clinical notes, and investigations for this patient will appear here once recorded.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Top Header & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-primary/10 text-primary">
            <History className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
              Patient Consultation History
              <Badge variant="secondary" className="text-xs bg-primary/10 text-primary font-semibold hover:bg-primary/10">
                {patientHistory.length} {patientHistory.length === 1 ? "Record" : "Records"}
              </Badge>
            </h3>
            <p className="text-xs text-muted-foreground">
              Date-wise consultation details, prescriptions, diagnosis, and medical records
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {patientHistory.length > 1 && (
            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={expandAll}
                className="text-xs h-8 px-2.5"
              >
                Expand All
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={collapseAll}
                className="text-xs h-8 px-2.5"
              >
                Collapse All
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Optional Search if more than 1 entry */}
      {patientHistory.length > 1 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by date, medicine name, diagnosis, doctor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-xs sm:text-sm h-9 bg-card"
          />
        </div>
      )}

      {/* Filtered empty state */}
      {filteredHistory.length === 0 && (
        <Card className="rounded-xl border shadow-xs">
          <CardContent className="py-10 text-center">
            <Search className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
            <p className="text-sm font-medium text-foreground">No matching history found</p>
            <p className="text-xs text-muted-foreground mt-1">Try modifying your search term</p>
          </CardContent>
        </Card>
      )}

      {/* Date-wise Appointments Accordion/Toggle List */}
      <div className="space-y-4">
        {filteredHistory.map((item, index) => {
          const itemKey = item.appointment_id || `history-${index}`;
          const isOpen = !!openIds[itemKey];
          const medicines = item.prescribed_medicines || [];

          return (
            <div
              key={itemKey}
              className="border border-border/80 rounded-2xl overflow-hidden bg-card shadow-xs transition-all hover:border-border"
            >
              {/* Accordion / Toggle Header */}
              <button
                type="button"
                onClick={() => toggleItem(itemKey)}
                aria-expanded={isOpen}
                className="w-full text-left p-4 sm:p-5 bg-muted/30 hover:bg-muted/50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60"
              >
                <div className="flex items-start sm:items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0 mt-0.5 sm:mt-0">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm sm:text-base font-bold text-foreground">
                        {formatDate(item.date, item.date_formatted)}
                      </span>
                      {item.date && item.date_formatted && item.date !== item.date_formatted && (
                        <span className="text-[11px] text-muted-foreground font-normal">
                          ({item.date})
                        </span>
                      )}
                    </div>
                    {item.doctor_name && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                        <User className="h-3.5 w-3.5 text-primary" />
                        <span>Consulted with {item.doctor_name}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                  <div className="flex items-center gap-2">
                    {medicines.length > 0 && (
                      <Badge variant="outline" className="text-xs bg-card border-border font-medium flex items-center gap-1">
                        <Pill className="h-3 w-3 text-primary" />
                        {medicines.length} {medicines.length === 1 ? "Medicine" : "Medicines"}
                      </Badge>
                    )}
                    {item.next_visit_date && (
                      <Badge variant="secondary" className="text-[11px] font-medium hidden md:inline-flex items-center gap-1">
                        <CalendarCheck className="h-3 w-3 text-emerald-600" />
                        Next: {item.next_visit_date}
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-1 text-xs font-semibold text-primary pl-2">
                    <span>{isOpen ? "Hide Details" : "View Details"}</span>
                    {isOpen ? (
                      <ChevronUp className="h-4 w-4 transition-transform" />
                    ) : (
                      <ChevronDown className="h-4 w-4 transition-transform" />
                    )}
                  </div>
                </div>
              </button>

              {/* Accordion / Toggle Body (Dropdown Details) */}
              {isOpen && (
                <div className="p-4 sm:p-6 space-y-6 bg-card divide-y divide-border/60">
                  {/* Top Bar inside Dropdown: Download Prescription Button */}
                  <div className="flex items-center justify-end pb-3">
                    {item.pdf_url ? (
                      <a
                        href={item.pdf_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-xs sm:text-sm font-semibold rounded-xl hover:bg-primary/90 transition shadow-2xs cursor-pointer"
                      >
                        <Download className="h-4 w-4" />
                        Download Prescription
                        <ExternalLink className="h-3.5 w-3.5 opacity-80" />
                      </a>
                    ) : (
                      <Button
                        disabled
                        variant="outline"
                        size="sm"
                        className="text-xs text-muted-foreground gap-1.5 opacity-60 rounded-xl"
                      >
                        <Download className="h-4 w-4" />
                        Download Prescription
                      </Button>
                    )}
                  </div>

                  {/* SECTION 1: Prescribed Medicines */}
                  <div className="pt-5 space-y-3.5">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                        <div className="p-1 rounded-md bg-primary/10 text-primary">
                          <Pill className="h-4 w-4" />
                        </div>
                        Prescribed Medicines
                        <Badge variant="secondary" className="text-xs">
                          {medicines.length}
                        </Badge>
                      </h4>
                    </div>

                    {medicines.length === 0 ? (
                      <div className="p-4 rounded-xl border border-dashed border-border bg-muted/20 text-center text-xs text-muted-foreground">
                        No medicines prescribed for this appointment.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                        {medicines.map((med: PatientHistoryMedicine, medIdx: number) => (
                          <div
                            key={med.prescription_id || medIdx}
                            className="p-3.5 sm:p-4 rounded-xl border border-border bg-muted/10 hover:bg-muted/20 transition-colors space-y-2.5 flex flex-col justify-between"
                          >
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-bold text-foreground">
                                    {med.medicine_name}
                                  </span>
                                  {med.is_ongoing && (
                                    <Badge className="bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/10 border-emerald-200 text-[10px] font-semibold px-2 py-0.5">
                                      Ongoing
                                    </Badge>
                                  )}
                                </div>
                                {med.dosage && (
                                  <p className="text-xs font-semibold text-primary mt-0.5">
                                    Dosage: {med.dosage}
                                  </p>
                                )}
                              </div>

                              {/* Frequency & Meal Badges */}
                              <div className="flex flex-wrap items-center gap-1.5">
                                {(med.frequency || med.frequency_label) && (
                                  <Badge
                                    variant="secondary"
                                    className="bg-primary/10 text-primary border-primary/20 text-[11px] font-semibold"
                                  >
                                    {med.frequency_label || med.frequency}
                                  </Badge>
                                )}
                                {med.meal && (
                                  <Badge
                                    variant="outline"
                                    className="text-[11px] text-muted-foreground border-border flex items-center gap-1"
                                  >
                                    <Utensils className="h-3 w-3 text-muted-foreground" />
                                    {formatMealText(med.meal)}
                                  </Badge>
                                )}
                              </div>
                            </div>

                            {/* Timings */}
                            {med.timings && med.timings.length > 0 && (
                              <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                                <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  Timings:
                                </span>
                                {med.timings.map((timing, tIdx) => (
                                  <span
                                    key={tIdx}
                                    className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-muted text-foreground border border-border/60"
                                  >
                                    {timing}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Dates / Duration */}
                            {(med.start_date || med.end_date) && (
                              <div className="flex items-center gap-1 text-[11px] text-muted-foreground font-medium pt-0.5">
                                <Calendar className="h-3 w-3" />
                                <span>
                                  Duration: {formatDate(med.start_date)}
                                  {med.end_date ? ` to ${formatDate(med.end_date)}` : ""}
                                </span>
                              </div>
                            )}

                            {/* Specific Medicine Instructions */}
                            {med.instructions && (
                              <div className="mt-1 p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-900 dark:text-amber-200 font-medium flex items-start gap-2">
                                <FileText className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                                <span>{med.instructions}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* SECTION 2: Clinical Details (Diagnosis, Investigations, Notes, etc.) */}
                  <div className="pt-5 space-y-4">
                    <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                      <div className="p-1 rounded-md bg-primary/10 text-primary">
                        <Stethoscope className="h-4 w-4" />
                      </div>
                      Consultation Information & Records
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 pt-1">
                      {/* Diagnosis */}
                      {item.diagnosis && (
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                            <Stethoscope className="h-3.5 w-3.5 text-primary" />
                            Diagnosis
                          </p>
                          <p className="text-xs sm:text-sm font-medium text-foreground whitespace-pre-line leading-relaxed">
                            {item.diagnosis}
                          </p>
                        </div>
                      )}

                      {/* Order Investigation */}
                      {item.order_investigation && (
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                            <TestTube className="h-3.5 w-3.5 text-primary" />
                            Order Investigation
                          </p>
                          <p className="text-xs sm:text-sm font-medium text-foreground whitespace-pre-line leading-relaxed">
                            {item.order_investigation}
                          </p>
                        </div>
                      )}

                      {/* Instructions by Doctor */}
                      {item.instructions_by_doctor && (
                        <div className="space-y-1 md:col-span-2">
                          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                            <FileText className="h-3.5 w-3.5 text-primary" />
                            Instructions by Doctor
                          </p>
                          <p className="text-xs sm:text-sm font-medium text-foreground whitespace-pre-line leading-relaxed">
                            {item.instructions_by_doctor}
                          </p>
                        </div>
                      )}

                      {/* Notes */}
                      {item.notes && (
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                            <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                            Notes
                          </p>
                          <p className="text-xs sm:text-sm font-medium text-foreground whitespace-pre-line leading-relaxed">
                            {item.notes}
                          </p>
                        </div>
                      )}

                      {/* Next Visit Date */}
                      {item.next_visit_date && (
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                            <CalendarCheck className="h-3.5 w-3.5 text-emerald-600" />
                            Next Visit Date
                          </p>
                          <p className="text-xs sm:text-sm font-medium text-foreground">
                            {formatDate(item.next_visit_date)}
                          </p>
                        </div>
                      )}

                      {/* Confidential Notes */}
                      {item.confidential_notes && (
                        <div className="space-y-1 md:col-span-2">
                          <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                            <Lock className="h-3.5 w-3.5 text-amber-600" />
                            Confidential Notes (Doctor Only)
                          </p>
                          <p className="text-xs sm:text-sm font-medium text-foreground whitespace-pre-line leading-relaxed">
                            {item.confidential_notes}
                          </p>
                        </div>
                      )}
                    </div>

                    {!item.diagnosis &&
                      !item.order_investigation &&
                      !item.instructions_by_doctor &&
                      !item.notes &&
                      !item.confidential_notes &&
                      !item.next_visit_date && (
                        <p className="text-xs text-muted-foreground italic">
                          No additional clinical notes recorded for this consultation.
                        </p>
                      )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
