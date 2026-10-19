"use client";

import { cn } from "@/lib/utils";

import { confirmAppointment, formatClock, getApiErrorMessage, getDefaultFutureTime, isFutureTimeOnDate, markAttendance, parseTo24HourTime } from "@/api/appointment-actions";
import CustomDialog from "@/components/custom/Dialogboxs";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useQueryClient } from "@tanstack/react-query";
import { CalendarClock, CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, ClipboardCheck, Loader2, UserCheck, UserX } from "lucide-react";
import { useRef, useState } from "react";
import { getDoctorSlots } from "@/api/resheodule";
import { useAuth } from "@/context/userContext";
import { RescheduleAppointmentDialog } from "./Reshedule-dialogbox";
import VideoTimePicker from "./VideoTimePicker";

type Attendance = "present" | "absent";
const RESCHEDULABLE_STATUSES = ["awaiting_confirmation", "confirmed", "rescheduled", "completed"];

interface AppointmentActionsProps {
    appointment: any;
    // Allows a parent view to suppress the button for layout-specific reasons.
    hideReschedule?: boolean;
    className?: string;
    renderOnly?: "confirm" | "reschedule" | "attendance";
    initialAttendanceOpen?: boolean;
}

/**
 * Doctor actions for one appointment:
 * - Confirm (booking awaiting confirmation)
 * - Reschedule (reschedule & confirm when awaiting)
 * - Mark Attendance (confirmed / rescheduled visit on or after the visit date)
 */
export default function AppointmentActions({ appointment, hideReschedule = false, className = "", renderOnly, initialAttendanceOpen = false }: AppointmentActionsProps) {
    const queryClient = useQueryClient();
    const appointmentId: string = appointment?.appointment_id || appointment?.id;
    const status: string = appointment?.status;

    const isAwaiting = appointment?.awaiting_confirmation === true || status === "awaiting_confirmation";
    const canConfirm = appointment?.can_confirm ?? isAwaiting;
    const canReschedule = !hideReschedule && (typeof appointment?.can_reschedule === "boolean"
        ? appointment.can_reschedule
        : RESCHEDULABLE_STATUSES.includes(status));
    const canMarkAttendance = appointment?.can_mark_attendance === true;
    const markedAttendance: Attendance | null =
        (typeof appointment?.attendance === "string" ? appointment.attendance : appointment?.attendance?.status) || null;
    const voucherNumber: string | null = appointment?.attendance?.voucher_number || null;

    const [confirmOpen, setConfirmOpen] = useState(false);
    const [attendanceOpen, setAttendanceOpen] = useState(initialAttendanceOpen);
    const [rescheduleOpen, setRescheduleOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [choice, setChoice] = useState<Attendance | null>(markedAttendance || "present");
    const [voucher, setVoucher] = useState(voucherNumber || "");

    const consultationType: string = String(appointment?.consultation_type || appointment?.schedule?.consultation_type || "").toLowerCase();
    const isVideo = consultationType.includes("video") || appointment?.slot_window?.mode === "any";
    const appointmentDate: string = appointment?.appointment_date || appointment?.schedule?.date || appointment?.date || "";
    const rawTimeStr: string = appointment?.appointment_time || appointment?.schedule?.time || appointment?.time || "";
    const rawEndTimeStr: string = appointment?.appointment_end_time || appointment?.schedule?.end_time || appointment?.end_time || "";
    const bookedTime: string = parseTo24HourTime(rawTimeStr);
    const [visitTime, setVisitTime] = useState(() => getDefaultFutureTime(appointmentDate, rawTimeStr));
    const [visitEndTime, setVisitEndTime] = useState(() => parseTo24HourTime(rawEndTimeStr));
    // Video: the doctor can confirm on any of their video dates (the booked date is always offered).
    const { user } = useAuth();
    const bookedDate = String(appointmentDate || "").split("T")[0].split(" ")[0];
    const [confirmDate, setConfirmDate] = useState(bookedDate);
    const [confirmDates, setConfirmDates] = useState<string[]>([]);
    const [loadingDates, setLoadingDates] = useState(false);
    const confirmDateStrip = useRef<HTMLDivElement>(null);
    const slideConfirmDates = (direction: 1 | -1) =>
        confirmDateStrip.current?.scrollBy({ left: direction * confirmDateStrip.current.clientWidth * 0.8, behavior: "smooth" });

    const loadConfirmDates = async () => {
        if (!isVideo || !user?.doctor_id) return;
        setLoadingDates(true);
        const today = new Date().toLocaleDateString("en-CA");
        try {
            const res = await getDoctorSlots(user.doctor_id, appointmentId);
            const days: { slots?: { date?: string }[] }[] = res?.data ?? [];
            const dates = days.flatMap((day) => day.slots ?? []).map((slot) => slot.date || "");
            if (bookedDate && bookedDate >= today) dates.push(bookedDate);
            setConfirmDates(Array.from(new Set(dates.filter((d) => d && d >= today))).sort());
        } catch {
            setConfirmDates(bookedDate && bookedDate >= today ? [bookedDate] : []);
        } finally {
            setLoadingDates(false);
        }
    };
    const visitTimeValid = !isVideo || (!!confirmDate && isFutureTimeOnDate(confirmDate, visitTime));
    const [resultOpen, setResultOpen] = useState(false);
    const [result, setResult] = useState<{ title: string; description: string; type: "success" | "danger" } | null>(null);

    const refresh = () => {
        queryClient.invalidateQueries({ queryKey: ["my-appointments"] });
        queryClient.invalidateQueries({ queryKey: ["doctor-home"] });
        queryClient.invalidateQueries({ queryKey: ["appointment"] });
    };

    const showResult = (title: string, description: string, type: "success" | "danger" = "success") => {
        setResult({ title, description, type });
        setResultOpen(true);
    };

    const handleConfirm = async () => {
        try {
            setLoading(true);
            await confirmAppointment(
                appointmentId,
                isVideo ? visitTime || null : null,
                isVideo ? visitEndTime || null : null,
                isVideo && confirmDate && confirmDate !== bookedDate ? confirmDate : null,
            );
            setConfirmOpen(false);
            showResult(
                "Appointment Confirmed",
                `The patient has been emailed the confirmation${isVideo && visitTime ? ` for ${confirmDate ? new Date(`${confirmDate}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) + ", " : ""}${formatClock(visitTime)}${visitEndTime ? ` - ${formatClock(visitEndTime)}` : ""}` : ""}.`,
            );
            refresh();
        } catch (err) {
            setConfirmOpen(false);
            showResult("Could not confirm", getApiErrorMessage(err), "danger");
        } finally {
            setLoading(false);
        }
    };

    const openAttendance = () => {
        setChoice(markedAttendance || "present");
        setVoucher(voucherNumber || "");
        setAttendanceOpen(true);
    };

    const handleAttendance = async () => {
        if (!choice) return;

        try {
            setLoading(true);
            await markAttendance(appointmentId, {
                attendance: choice,
                voucher_number: choice === "present" ? voucher.trim() || null : null,
            });
            setAttendanceOpen(false);
            showResult("Attendance Saved", `Patient marked as ${choice === "present" ? "Present" : "Absent"}.`);
            refresh();
        } catch (err) {
            setAttendanceOpen(false);
            showResult("Could not save attendance", getApiErrorMessage(err), "danger");
        } finally {
            setLoading(false);
        }
    };

    const hasAnyAction = canConfirm || canReschedule || canMarkAttendance || markedAttendance || initialAttendanceOpen;
    if (!hasAnyAction) {
        return null;
    }

    const showConfirm = canConfirm && (!renderOnly || renderOnly === "confirm");
    const showReschedule = canReschedule && (!renderOnly || renderOnly === "reschedule");
    const showAttendance = (canMarkAttendance || initialAttendanceOpen) && (!renderOnly || renderOnly === "attendance");

    if (!showConfirm && !showReschedule && !showAttendance && !markedAttendance && !initialAttendanceOpen) {
        return null;
    }

    return (
        <>
            <div className={cn("flex items-center gap-2 w-full empty:hidden", className)} onClick={(e) => e.stopPropagation()}>
                {showConfirm && (
                    <Button
                        size="sm"
                        className="h-8 sm:h-8.5 px-3 text-xs font-semibold rounded-md cursor-pointer gap-1.5 w-full bg-[#064e3b] hover:bg-[#022c22] text-white shadow-2xs justify-center"
                        onClick={() => {
                            const initTime = getDefaultFutureTime(appointmentDate, rawTimeStr);
                            setVisitTime(initTime);
                            setConfirmDate(bookedDate);
                            setConfirmOpen(true);
                            loadConfirmDates();
                        }}
                    >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Confirm
                    </Button>
                )}

                {showReschedule && (
                    <Button
                        size="sm"
                        variant="outline"
                        className="h-8 sm:h-8.5 px-3 text-xs font-medium rounded-md cursor-pointer border border-slate-300 text-slate-800 hover:bg-slate-50 gap-1.5 w-full shadow-none justify-center"
                        onClick={() => setRescheduleOpen(true)}
                    >
                        <CalendarClock className="h-3.5 w-3.5 text-slate-500" />
                        Reschedule
                    </Button>
                )}

                {showAttendance && (
                    <Button
                        size="sm"
                        variant="outline"
                        className="h-8 sm:h-8.5 px-3 text-xs font-medium rounded-md cursor-pointer border border-slate-300 text-slate-800 hover:bg-slate-50 gap-1.5 w-full shadow-none justify-center"
                        onClick={openAttendance}
                    >
                        <ClipboardCheck className="h-3.5 w-3.5" />
                        {markedAttendance ? "Update Attendance" : "Mark Attendance"}
                    </Button>
                )}
            </div>

            <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                {/* Same layout as the Reschedule dialog: bottom sheet on phones, centred from sm up. */}
                <DialogContent className={cn(
                    "flex w-full max-w-full flex-col gap-0 overflow-hidden p-0",
                    isVideo
                        ? "max-h-[88dvh] rounded-b-none rounded-t-2xl max-sm:top-auto max-sm:bottom-0 max-sm:left-0 max-sm:translate-x-0 max-sm:translate-y-0 sm:max-h-[90vh] sm:w-[90vw] sm:max-w-2xl sm:rounded-md"
                        : "max-w-[95vw] rounded-md sm:max-w-lg",
                )}>
                    <div className="shrink-0 border-b border-slate-200 px-4 py-3 sm:px-6 sm:py-4">
                        <DialogTitle className="flex items-center gap-2 text-lg font-semibold sm:text-xl">
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                            Confirm Appointment
                        </DialogTitle>
                        <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                            Confirm the booking for {appointment?.patient?.name || appointment?.patient_name || "this patient"}.
                            {isVideo
                                ? " Pick a date, then the time of the video call. The patient is notified of it."
                                : ` The patient will be emailed the confirmation${bookedTime ? ` for ${formatClock(bookedTime)}` : ""}.`}
                        </p>
                    </div>

                    {isVideo && (
                        <div className="min-h-0 min-w-0 flex-1 space-y-5 overflow-y-auto px-4 py-5 sm:px-6">
                            <div className="min-w-0">
                                <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary">
                                    <CalendarDays className="h-4 w-4" /> Date
                                </p>
                                {loadingDates ? (
                                    <p className="flex items-center gap-2 py-3 text-sm text-muted-foreground">
                                        <Loader2 className="h-4 w-4 animate-spin text-primary" /> Loading your video dates...
                                    </p>
                                ) : confirmDates.length === 0 ? (
                                    <p className="py-2 text-sm text-muted-foreground">No upcoming video dates in your schedule.</p>
                                ) : (
                                    <div className="flex min-w-0 items-center gap-2">
                                        <button type="button" onClick={() => slideConfirmDates(-1)} aria-label="Previous dates"
                                            className="hidden h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border border-slate-200 bg-white text-primary hover:border-primary sm:flex">
                                            <ChevronLeft className="h-4 w-4" />
                                        </button>
                                        <div ref={confirmDateStrip} role="tablist" aria-label="Video dates"
                                            className="flex min-w-0 flex-1 snap-x gap-2 overflow-x-auto scroll-smooth py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                                            {confirmDates.map((date) => {
                                                const d = new Date(`${date}T00:00:00`);
                                                const selected = confirmDate === date;
                                                return (
                                                    <button key={date} type="button" role="tab" aria-selected={selected}
                                                        onClick={() => {
                                                            setConfirmDate(date);
                                                            if (!isFutureTimeOnDate(date, visitTime)) setVisitTime(getDefaultFutureTime(date, visitTime));
                                                        }}
                                                        className={`flex w-15 shrink-0 snap-start cursor-pointer flex-col items-center justify-center rounded-md border py-1.5 leading-none transition-all ${selected
                                                            ? "border-primary bg-primary text-white shadow-xs"
                                                            : "border-slate-200 bg-white text-slate-900 hover:border-primary/50 hover:bg-slate-50/80"}`}>
                                                        <span className="text-[10px] font-semibold uppercase tracking-wider">{d.toLocaleDateString("en-US", { weekday: "short" })}</span>
                                                        <span className="my-0.5 text-base font-bold">{d.getDate()}</span>
                                                        <span className={`text-[10px] font-medium ${selected ? "text-white/90" : "text-slate-500"}`}>{d.toLocaleDateString("en-US", { month: "short" })}</span>
                                                        {date === bookedDate && <span className={`mt-0.5 text-[9px] font-semibold ${selected ? "text-white/90" : "text-primary"}`}>Booked</span>}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        <button type="button" onClick={() => slideConfirmDates(1)} aria-label="Next dates"
                                            className="hidden h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border border-slate-200 bg-white text-primary hover:border-primary sm:flex">
                                            <ChevronRight className="h-4 w-4" />
                                        </button>
                                    </div>
                                )}
                            </div>

                            {confirmDate && (
                                <div className="min-w-0">
                                    <VideoTimePicker
                                        id={`visit-time-${appointmentId}`}
                                        date={confirmDate}
                                        startTime={visitTime}
                                        endTime={visitEndTime}
                                        onStartTimeChange={setVisitTime}
                                        onEndTimeChange={setVisitEndTime}
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    <div className="flex shrink-0 flex-col gap-3 border-t border-slate-200 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:flex-row sm:items-center sm:justify-between sm:px-6">
                        <p className="text-sm">
                            {isVideo && confirmDate && visitTime ? (
                                <span className="text-primary">
                                    <span className="font-semibold">Selected:</span>{" "}
                                    {new Date(`${confirmDate}T00:00:00`).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })},{" "}
                                    {formatClock(visitTime)}{visitEndTime ? ` – ${formatClock(visitEndTime)}` : ""}
                                </span>
                            ) : null}
                        </p>
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={loading}>Not now</Button>
                            <Button onClick={handleConfirm} disabled={loading || !visitTimeValid}>
                                {loading ? "Confirming..." : "Yes, Confirm"}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={attendanceOpen} onOpenChange={setAttendanceOpen}>
                <DialogContent className="max-w-[95vw] sm:max-w-md rounded-md p-5">
                    <DialogTitle className="text-lg font-semibold">Mark Attendance</DialogTitle>
                    <p className="text-sm text-muted-foreground -mt-2">
                        {appointment?.patient?.name || appointment?.patient_name || "Patient"}
                    </p>

                    <div className="grid grid-cols-2 gap-3 mt-2">
                        {(["present", "absent"] as Attendance[]).map((option) => {
                            const selected = choice === option;
                            const isPresent = option === "present";
                            return (
                                <button
                                    key={option}
                                    type="button"
                                    onClick={() => setChoice(option)}
                                    className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-3 text-sm font-semibold transition-colors cursor-pointer ${selected
                                        ? isPresent
                                            ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                                            : "border-rose-500 bg-rose-50 text-rose-700"
                                        : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                                        }`}
                                >
                                    {isPresent ? <UserCheck className="h-4 w-4" /> : <UserX className="h-4 w-4" />}
                                    {isPresent ? "Mark Present" : "Mark Absent"}
                                </button>
                            );
                        })}
                    </div>

                    {choice === "present" && (
                        <div className="mt-3 space-y-1.5">
                            <label htmlFor={`voucher-${appointmentId}`} className="text-sm font-medium">
                                Voucher Number <span className="text-muted-foreground font-normal">(optional)</span>
                            </label>
                            <Input
                                id={`voucher-${appointmentId}`}
                                value={voucher}
                                onChange={(e) => setVoucher(e.target.value)}
                                placeholder="Enter voucher number"
                                maxLength={255}
                            />
                        </div>
                    )}

                    <p className="text-xs text-muted-foreground mt-2">Attendance can be changed within 5 minutes of saving.</p>

                    <div className="flex justify-end gap-2 mt-3">
                        <Button variant="outline" onClick={() => setAttendanceOpen(false)} className="cursor-pointer">
                            Cancel
                        </Button>
                        <Button onClick={handleAttendance} disabled={!choice || loading} className="cursor-pointer">
                            {loading ? "Saving..." : "Save"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {canReschedule && (
                <RescheduleAppointmentDialog
                    open={rescheduleOpen}
                    onOpenChange={setRescheduleOpen}
                    appointmentId={appointmentId}
                    isAwaitingConfirmation={isAwaiting}
                    onSuccess={refresh}
                    setCustomDialogOpen={setResultOpen}
                    setDialogData={(data: any) => setResult(data)}
                />
            )}

            <CustomDialog
                open={resultOpen}
                onClose={() => {
                    setResultOpen(false);
                    setResult(null);
                }}
                type={result?.type === "danger" || result?.title === "Validation Error" ? "danger" : "success"}
                title={result?.title || ""}
                description={result?.description || ""}
                confirmText="OK"
                onConfirm={() => {
                    setResultOpen(false);
                    setResult(null);
                }}
            />
        </>
    );
}
