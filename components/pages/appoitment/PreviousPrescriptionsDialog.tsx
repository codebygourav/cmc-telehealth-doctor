"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { usePreviousPrescriptions } from "@/queries/usePreviousPrescriptions";
import {
  Pill,
  Calendar,
  User,
  Clock,
  Search,
  AlertCircle,
  FileText,
  Utensils,
  CheckCircle2,
  CalendarDays,
} from "lucide-react";

interface PreviousPrescriptionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointmentId?: string;
}

const formatMealText = (meal?: string): string => {
  if (!meal) return "";
  switch (meal.toLowerCase().trim()) {
    case "after_meal":
      return "After Meal";
    case "before_meal":
      return "Before Meal";
    case "with_meal":
      return "With Meal";
    case "empty_stomach":
      return "Empty Stomach";
    default:
      return meal.replace(/_/g, " ");
  }
};

const formatDateString = (dateStr?: string): string => {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
};

export default function PreviousPrescriptionsDialog({
  open,
  onOpenChange,
  appointmentId,
}: PreviousPrescriptionsDialogProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const { data, isLoading, error } = usePreviousPrescriptions(
    open ? appointmentId : undefined
  );

  const groups = data?.data || [];

  const filteredGroups = groups
    .map((group) => {
      const matchSearch = searchTerm.trim().toLowerCase();
      if (!matchSearch) return group;

      const dateMatch = group.appointment_date?.toLowerCase().includes(matchSearch);
      const doctorMatch = group.doctor_name?.toLowerCase().includes(matchSearch);

      const matchingMedicines = (group.medicines || []).filter((med) => {
        return (
          med.medicine_name?.toLowerCase().includes(matchSearch) ||
          med.dosage?.toLowerCase().includes(matchSearch) ||
          med.frequency?.toLowerCase().includes(matchSearch) ||
          med.instructions?.toLowerCase().includes(matchSearch) ||
          med.timings?.some((t) => t.toLowerCase().includes(matchSearch))
        );
      });

      if (dateMatch || doctorMatch) {
        return group;
      }

      if (matchingMedicines.length > 0) {
        return { ...group, medicines: matchingMedicines };
      }

      return null;
    })
    .filter(Boolean) as typeof groups;

  const totalMedicines = groups.reduce(
    (acc, curr) => acc + (curr.medicines?.length || 0),
    0
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden rounded-2xl">
        {/* Header */}
        <DialogHeader className="p-5 pb-4 border-b bg-gradient-to-r from-slate-50 to-indigo-50/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 text-primary rounded-xl shrink-0">
              <Pill className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                Previous Prescribed Medicines
                {totalMedicines > 0 && (
                  <Badge variant="secondary" className="text-xs font-semibold bg-primary/10 text-primary hover:bg-primary/10">
                    {totalMedicines} total
                  </Badge>
                )}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 mt-0.5">
                Patient's complete medication history grouped by past appointment dates
              </DialogDescription>
            </div>
          </div>

          {/* Search bar */}
          {groups.length > 0 && (
            <div className="relative mt-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <Input
                placeholder="Search by medicine name, doctor, frequency, or date..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 text-xs h-9 bg-white/80 border-slate-200 focus-visible:bg-white rounded-xl"
              />
            </div>
          )}
        </DialogHeader>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-16 space-y-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="text-xs text-slate-500 font-medium">
                Loading previous prescription history...
              </p>
            </div>
          )}

          {error && (
            <div className="p-6 text-center bg-red-50/50 border border-red-100 rounded-2xl my-4">
              <div className="flex flex-col items-center gap-2 text-red-600">
                <AlertCircle className="h-6 w-6" />
                <p className="text-sm font-semibold">
                  Failed to load previous prescriptions
                </p>
                <p className="text-xs text-red-500 max-w-sm">
                  There was an error communicating with the server. Please try again.
                </p>
              </div>
            </div>
          )}

          {!isLoading && !error && groups.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
              <div className="p-4 bg-slate-100 rounded-full text-slate-400">
                <Pill className="h-8 w-8" />
              </div>
              <div className="space-y-1 max-w-xs">
                <h4 className="text-sm font-bold text-slate-800">
                  No Previous Prescriptions Found
                </h4>
                <p className="text-xs text-slate-500">
                  There are no previous medication records registered for this patient.
                </p>
              </div>
            </div>
          )}

          {!isLoading && !error && groups.length > 0 && filteredGroups.length === 0 && (
            <div className="py-12 text-center text-slate-500 space-y-2">
              <p className="text-sm font-medium">No medicines match your search "{searchTerm}"</p>
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="text-xs text-primary underline font-semibold"
              >
                Clear search filter
              </button>
            </div>
          )}

          {!isLoading &&
            !error &&
            filteredGroups.map((group, groupIdx) => (
              <div
                key={group.appointment_id || groupIdx}
                className="border border-slate-200/80 rounded-2xl overflow-hidden shadow-2xs bg-white transition-all hover:border-slate-300"
              >
                {/* Group Header */}
                <div className="p-3.5 px-4 bg-slate-50/80 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-blue-100 text-blue-700 rounded-lg">
                      <CalendarDays className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                        {formatDateString(group.appointment_date)}
                        <span className="text-[10px] font-normal text-slate-500">
                          ({group.appointment_date})
                        </span>
                      </h4>
                      {group.doctor_name && (
                        <p className="text-[11px] text-slate-600 flex items-center gap-1 mt-0.5 font-medium">
                          <User className="h-3 w-3 text-slate-400" />
                          {group.doctor_name}
                        </p>
                      )}
                    </div>
                  </div>

                  <Badge variant="outline" className="text-[11px] font-medium bg-white border-slate-200">
                    {group.medicines?.length || 0} {group.medicines?.length === 1 ? "Medicine" : "Medicines"}
                  </Badge>
                </div>

                {/* Medicines List */}
                <div className="divide-y divide-slate-100">
                  {group.medicines?.map((med, medIdx) => (
                    <div
                      key={medIdx}
                      className="p-4 hover:bg-slate-50/50 transition-colors space-y-2.5"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-900">
                              {med.medicine_name}
                            </span>
                            {med.is_ongoing && (
                              <Badge className="bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/10 border-emerald-200 text-[10px] font-semibold px-2 py-0.5">
                                Ongoing
                              </Badge>
                            )}
                          </div>
                          {med.dosage && (
                            <p className="text-xs font-semibold text-primary">
                              Dosage: {med.dosage}
                            </p>
                          )}
                        </div>

                        {/* Frequency & Timings Badges */}
                        <div className="flex flex-wrap items-center gap-1.5">
                          {med.frequency && (
                            <Badge
                              variant="secondary"
                              className="bg-indigo-50 text-indigo-700 border-indigo-100 text-[11px] font-bold"
                            >
                              {med.frequency}
                            </Badge>
                          )}
                          {med.meal && (
                            <Badge
                              variant="outline"
                              className="text-[11px] text-slate-600 border-slate-200 flex items-center gap-1"
                            >
                              <Utensils className="h-3 w-3 text-slate-400" />
                              {formatMealText(med.meal)}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Timings Pills */}
                      {med.timings && med.timings.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                          <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
                            <Clock className="h-3 w-3 text-slate-400" />
                            Timings:
                          </span>
                          {med.timings.map((timing, tIdx) => (
                            <span
                              key={tIdx}
                              className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200/60"
                            >
                              {timing}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Dates / Duration */}
                      {(med.start_date || med.end_date) && (
                        <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium pt-0.5">
                          <Calendar className="h-3 w-3 text-slate-400" />
                          <span>
                            Duration: {formatDateString(med.start_date)}
                            {med.end_date ? ` to ${formatDateString(med.end_date)}` : ""}
                          </span>
                        </div>
                      )}

                      {/* Instructions / Remarks */}
                      {med.instructions && (
                        <div className="mt-1 p-2 bg-amber-50/60 border border-amber-200/60 rounded-xl text-xs text-amber-900 font-medium flex items-start gap-2">
                          <FileText className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
                          <span>{med.instructions}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
