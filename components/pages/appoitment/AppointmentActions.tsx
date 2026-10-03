"use client";

import { confirmAppointment, formatClock, getApiErrorMessage, getDefaultFutureTime, isFutureTimeOnDate, markAttendance, parseTo24HourTime } from "@/api/appointment-actions";
import CustomDialog from "@/components/custom/Dialogboxs";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useQueryClient } from "@tanstack/react-query";
import { CalendarClock, CheckCircle2, ClipboardCheck, UserCheck, UserX } from "lucide-react";
import { useState } from "react";
import { RescheduleAppointmentDialog } from "./Reshedule-dialogbox";
import VideoTimePicker from "./VideoTimePicker";

type Attendance = "present" | "absent";

interface AppointmentActionsProps {
    appointment: any;
    // Hide the reschedule button (e.g. past tab)
    hideReschedule?: boolean;
    className?: string;
}

const ACTIVE_STATUSES = ["awaiting_confirmation", "confirmed", "rescheduled"];

/**
 * Doctor actions for one appointment:
 * - Confirm (booking awaiting confirmation)
 * - Reschedule (reschedule & confirm when awaiting)
 * - Mark Attendance (confirmed / rescheduled visit on or after the visit date)
 */
export default function AppointmentActions({ appointment, hideReschedule = false, className = "" }: AppointmentActionsProps) {
    const queryClient = useQueryClient();
    const appointmentId: string = appointment?.appointment_id || appointment?.id;
    const status: string = appointment?.status;

    const isAwaiting = appointment?.awaiting_confirmation === true || status === "awaiting_confirmation";
    const canConfirm = appointment?.can_confirm ?? isAwaiting;
    const canReschedule = !hideReschedule && ACTIVE_STATUSES.includes(status);
    const canMarkAttendance = appointment?.can_mark_attendance === true;
    const markedAttendance: Attendance | null =
        (typeof appointment?.attendance === "string" ? appointment.attendance : appointment?.attendance?.status) || null;
    const voucherNumber: string | null = appointment?.attendance?.voucher_number || null;

    const [confirmOpen, setConfirmOpen] = useState(false);
    const [attendanceOpen, setAttendanceOpen] = useState(false);
    const [rescheduleOpen, setRescheduleOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [choice, setChoice] = useState<Attendance | null>(null);
    const [voucher, setVoucher] = useState("");
    // Video consultations: the doctor picks the call time (any time that day) when confirming.
    // In-person visits are confirmed at the booked slot time (no time to choose).
    const consultationType: string = String(appointment?.consultation_type || appointment?.schedule?.consultation_type || "").toLowerCase();
    const isVideo = consultationType.includes("video") || appointment?.slot_window?.mode === "any";
    const appointmentDate: string = appointment?.appointment_date || appointment?.schedule?.date || appointment?.date || "";
    const rawTimeStr: string = appointment?.appointment_time || appointment?.schedule?.time || appointment?.time || "";
    const bookedTime: string = parseTo24HourTime(rawTimeStr);
    const [visitTime, setVisitTime] = useState(() => getDefaultFutureTime(appointmentDate, rawTimeStr));
    const visitTimeValid = !isVideo || isFutureTimeOnDate(appointmentDate, visitTime);
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
            await confirmAppointment(appointmentId, isVideo ? visitTime || null : null);
            setConfirmOpen(false);
            showResult(
                "Appointment Confirmed",
                `The patient has been emailed the confirmation${isVideo && visitTime ? ` for ${formatClock(visitTime)}` : ""}.`,
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
        setChoice(markedAttendance);
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

    const hasAnyAction = canConfirm || canReschedule || canMarkAttendance || markedAttendance;
    if (!hasAnyAction) {
        return null;
    }

    return (
        <>
            <div className={`flex flex-wrap items-center gap-2 ${className}`} onClick={(e) => e.stopPropagation()}>
                {markedAttendance && (
                    <span
                        className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-semibold border ${markedAttendance === "present"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-rose-50 text-rose-700 border-rose-200"
                            }`}
                    >
                        {markedAttendance === "present" ? <UserCheck className="h-3.5 w-3.5" /> : <UserX className="h-3.5 w-3.5" />}
                        {markedAttendance === "present" ? "Present" : "Absent"}
                        {markedAttendance === "present" && voucherNumber ? ` · Voucher ${voucherNumber}` : ""}
                    </span>
                )}

                {canConfirm && (
                    <Button size="sm" className="h-auto py-2 px-3 font-semibold rounded-md cursor-pointer" onClick={() => {
                        const initTime = getDefaultFutureTime(appointmentDate, rawTimeStr);
                        setVisitTime(initTime);
                        setConfirmOpen(true);
                    }}>
                        <CheckCircle2 className="h-4 w-4" />
                        Confirm
                    </Button>
                )}

                {canReschedule && (
                    <Button
                        size="sm"
                        variant="outline"
                        className="h-auto py-2 px-3 font-semibold rounded-md cursor-pointer border-[#4D4D4D]"
                        onClick={() => setRescheduleOpen(true)}
                    >
                        <CalendarClock className="h-4 w-4" />
                        Reschedule
                    </Button>
                )}

                {canMarkAttendance && (
                    <Button
                        size="sm"
                        variant="outline"
                        className="h-auto py-2 px-3 font-semibold rounded-md cursor-pointer border-primary text-primary"
                        onClick={openAttendance}
                    >
                        <ClipboardCheck className="h-4 w-4" />
                        {markedAttendance ? "Update Attendance" : "Mark Attendance"}
                    </Button>
                )}
            </div>

            <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <DialogContent className="max-w-[95vw] sm:max-w-lg rounded-xl p-5">
                    <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                        Confirm Appointment
                    </DialogTitle>
                    <p className="text-sm text-muted-foreground">
                        Confirm the booking for {appointment?.patient?.name || appointment?.patient_name || "this patient"}.
                        {isVideo
                            ? " Choose the time of the video call; the patient is emailed this time."
                            : ` The patient will be emailed the confirmation${bookedTime ? ` for ${formatClock(bookedTime)}` : ""}.`}
                    </p>

                    {isVideo && (
                        <VideoTimePicker
                            id={`visit-time-${appointmentId}`}
                            date={appointmentDate}
                            value={visitTime}
                            onChange={setVisitTime}
                        />
                    )}

                    <div className="flex justify-end gap-2 pt-1">
                        <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={loading}>Not now</Button>
                        <Button onClick={handleConfirm} disabled={loading || !visitTimeValid}>
                            {loading ? "Confirming..." : "Yes, Confirm"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={attendanceOpen} onOpenChange={setAttendanceOpen}>
                <DialogContent className="max-w-[95vw] sm:max-w-md rounded-xl p-5">
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
