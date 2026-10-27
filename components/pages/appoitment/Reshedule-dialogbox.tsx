"use client";

import { getDoctorSlots } from "@/api/resheodule";
import CustomDialog from "@/components/custom/Dialogboxs";
import { Button } from "@/components/ui";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/context/userContext";
import { rescheduleAppointment } from "@/mutations/reschedule";
import { useEffect, useRef, useState } from "react";
import { Building2, CalendarDays, ChevronLeft, ChevronRight, Clock, Loader2, Video } from "lucide-react";
import { getDefaultFutureTime, isFutureTimeOnDate, parseTo24HourTime } from "@/api/appointment-actions";
import VideoTimePicker from "./VideoTimePicker";

interface RescheduleAppointmentDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    appointmentId: string;
    setCustomDialogOpen: (val: boolean) => void;
    setDialogData: (data: any) => void;
    // Booking still awaiting confirmation: rescheduling it also confirms it.
    isAwaitingConfirmation?: boolean;
    onSuccess?: () => void;
}

export function RescheduleAppointmentDialog({
    open,
    onOpenChange,
    appointmentId,
    setCustomDialogOpen,
    setDialogData,
    isAwaitingConfirmation = false,
    onSuccess,
}: RescheduleAppointmentDialogProps) {
    const [selectedDate, setSelectedDate] = useState("");
    const [selectedSlot, setSelectedSlot] = useState<any>(null);
    // Exact visit time inside the chosen OPD slot (e.g. 10:45 in a 10 AM - 4 PM OPD).
    const [visitTime, setVisitTime] = useState("");
    const [visitEndTime, setVisitEndTime] = useState("");
    // Video slots: the call can be set at any time on that date. In-person: the slot time.
    const isVideoSlot = String(selectedSlot?.consultation_type || "").toLowerCase().includes("video");
    const visitTimeValid = !selectedSlot || !isVideoSlot || isFutureTimeOnDate(selectedSlot?.date, visitTime);
    const pickSlot = (slot: any) => {
        setSelectedSlot(slot);
        const rawSlotTime = slot?.booking_start_time || slot?.start_time || "";
        const defaultTime = getDefaultFutureTime(slot?.date, rawSlotTime);
        setVisitTime(defaultTime);
        const rawEndTime = slot?.booking_end_time || slot?.end_time || "";
        setVisitEndTime(rawEndTime);
    };
    // "slots" = the doctor's availability; "custom" = any date & time (saved as a reschedule like any other).
    const [mode, setMode] = useState<"slots" | "custom">("slots");
    const todayKey = new Date().toLocaleDateString("en-CA");
    const [customDate, setCustomDate] = useState("");
    const [customStart, setCustomStart] = useState("");
    const [customEnd, setCustomEnd] = useState("");
    const customValid = mode === "custom" && !!customDate && !!customStart && isFutureTimeOnDate(customDate, customStart) && (!customEnd || customEnd > customStart);
    const [slots, setSlots] = useState<any[]>([]);
    const [schedule, setSchedule] = useState<{ consultation_type: string; opd_type: string | null; label: string } | null>(null);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();
    const dateStrip = useRef<HTMLDivElement>(null);
    const slideDates = (direction: 1 | -1) =>
        dateStrip.current?.scrollBy({ left: direction * dateStrip.current.clientWidth * 0.8, behavior: "smooth" });

    useEffect(() => {
        if (open && user?.doctor_id) {
            fetchSlots();
        }
    }, [open, user]); // eslint-disable-line react-hooks/exhaustive-deps

    const fetchSlots = async () => {
        try {
            const doctorId = user?.doctor_id;
            if (!doctorId) return;
            setLoadingSlots(true);

            const res = await getDoctorSlots(doctorId, appointmentId);
            setSchedule(res?.schedule ?? null);

            const formattedSlots = (res?.data ?? []).flatMap((dayItem: any) => dayItem.slots);
            setSlots(formattedSlots);
            const firstFree = formattedSlots.find((slot: any) => slot.available !== false);
            setSelectedDate(firstFree?.date ?? formattedSlots[0]?.date ?? "");
            setSelectedSlot(null);
            setVisitTime("");
            setVisitEndTime("");
        } catch (err) {
            console.log("Slot fetch error", err);
        } finally {
            setLoadingSlots(false);
        }
    };

    const uniqueDates = Array.from(new Set(slots.map((slot) => slot.date)));
    const slotsForDate = slots.filter((s) => s.date === selectedDate);
    const longDate = (date: string) =>
        new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    const isVideoSchedule = schedule?.consultation_type === "video";

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            {/* Bottom sheet on phones, centred dialog from sm up. */}
            <DialogContent className="flex max-h-[88dvh] w-full max-w-full flex-col gap-0 overflow-hidden rounded-b-none rounded-t-2xl p-0 max-sm:top-auto max-sm:bottom-0 max-sm:left-0 max-sm:translate-x-0 max-sm:translate-y-0 max-sm:data-[state=open]:slide-in-from-bottom-10 sm:max-h-[90vh] sm:w-[90vw] sm:max-w-2xl sm:rounded-md">
                {/* Header */}
                <div className="shrink-0 border-b border-slate-200 px-4 py-3 sm:px-6 sm:py-4">
                    <DialogTitle className="text-lg font-semibold sm:text-xl">Reschedule Appointment</DialogTitle>
                    <p className="text-xs text-muted-foreground">Pick a new date, then a time.</p>
                    <div role="tablist" className="mt-3 flex gap-1 rounded-lg border border-slate-200 bg-slate-100 p-1">
                        {([["slots", "From my schedule"], ["custom", "Custom date & time"]] as const).map(([value, label]) => (
                            <button key={value} type="button" role="tab" aria-selected={mode === value}
                                onClick={() => setMode(value)}
                                className={`flex-1 cursor-pointer rounded-md px-3 py-1.5 text-xs font-semibold transition-all sm:text-sm ${mode === value ? "bg-primary text-white shadow-xs" : "text-slate-600 hover:bg-white"}`}>
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-5 sm:px-6">
                    {mode === "custom" && (
                        <div className="space-y-4">
                            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-900">
                                Any date and time, even outside your OPD schedule. The patient is notified of the new timing.
                            </div>
                            <div>
                                <label htmlFor="custom-date" className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary">
                                    <CalendarDays className="h-4 w-4" /> Date
                                </label>
                                <input id="custom-date" type="date" min={todayKey} value={customDate}
                                    onChange={(e) => { setCustomDate(e.target.value); if (e.target.value && customStart && !isFutureTimeOnDate(e.target.value, customStart)) setCustomStart(getDefaultFutureTime(e.target.value, customStart)); }}
                                    className="h-10 w-full max-w-xs rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
                            </div>
                            {customDate && (
                                <VideoTimePicker
                                    id="custom-visit-time"
                                    date={customDate}
                                    startTime={customStart}
                                    endTime={customEnd}
                                    onStartTimeChange={setCustomStart}
                                    onEndTimeChange={setCustomEnd}
                                />
                            )}
                        </div>
                    )}

                    {mode === "slots" && schedule && (
                        <div className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 ${isVideoSchedule ? "border-blue-200 bg-blue-50 text-blue-900" : "border-primary/20 bg-primary/5 text-primary"}`}>
                            {isVideoSchedule ? <Video className="h-5 w-5 shrink-0" /> : <Building2 className="h-5 w-5 shrink-0" />}
                            <div className="text-sm">
                                <p className="font-semibold">You are on the {schedule.label}</p>
                                <p className="text-xs opacity-80">
                                    {isVideoSchedule
                                        ? "Video appointment: only video dates are shown."
                                        : `In-person ${schedule.opd_type === "private" ? "private" : "general"} OPD appointment: only ${schedule.opd_type === "private" ? "private" : "general"} OPD dates are shown.`}
                                </p>
                            </div>
                        </div>
                    )}

                    {mode === "custom" ? null : loadingSlots ? (
                        <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
                            <Loader2 className="h-5 w-5 animate-spin text-primary" /> Loading available slots...
                        </div>
                    ) : uniqueDates.length === 0 ? (
                        <div className="py-12 text-center text-sm text-muted-foreground">
                            <CalendarDays className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                            No {schedule ? schedule.label.toLowerCase() : "available"} dates found.
                        </div>
                    ) : (
                        <>
                            {/* Dates */}
                            <div>
                                <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary">
                                    <CalendarDays className="h-4 w-4" /> Date
                                </p>
                                <div className="flex items-center gap-2">
                                    <button type="button" onClick={() => slideDates(-1)} aria-label="Previous dates"
                                        className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-primary hover:border-primary sm:flex">
                                        <ChevronLeft className="h-4 w-4" />
                                    </button>
                                    <div ref={dateStrip} role="tablist" aria-label="Available dates"
                                        className="flex min-w-0 flex-1 snap-x gap-2 overflow-x-auto scroll-smooth py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                                        {uniqueDates.map((date) => {
                                            const d = new Date(`${date}T00:00:00`);
                                            const free = slots.filter((s) => s.date === date && s.available !== false).length;
                                            const selected = selectedDate === date;
                                            return (
                                                <button key={date} type="button" role="tab" aria-selected={selected}
                                                    onClick={() => { setSelectedDate(date); setSelectedSlot(null); }}
                                                    title={`${free} free`}
                                                    className={`flex h-15 py-1.5 w-15 shrink-0 snap-start flex-col items-center justify-center rounded-md border leading-none transition-all cursor-pointer ${selected
                                                        ? "border-primary bg-primary text-white shadow-xs"
                                                        : free > 0 ? "border-slate-200 bg-white text-slate-900 hover:border-primary/50 hover:bg-slate-50/80" : "border-slate-200 bg-slate-50 text-slate-400"}`}>
                                                    <span className="text-[10px] font-semibold uppercase tracking-wider">{d.toLocaleDateString("en-US", { weekday: "short" })}</span>
                                                    <span className="text-base font-bold my-0.5">{d.getDate()}</span>
                                                    <span className={`text-[10px] font-medium ${selected ? "text-white/90" : "text-slate-500"}`}>{d.toLocaleDateString("en-US", { month: "short" })}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <button type="button" onClick={() => slideDates(1)} aria-label="Next dates"
                                        className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-primary hover:border-primary sm:flex cursor-pointer">
                                        <ChevronRight className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Times */}
                            <div>
                                <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary">
                                    <Clock className="h-4 w-4" /> Time{selectedDate ? ` · ${longDate(selectedDate)}` : ""}
                                </p>
                                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                                    {slotsForDate.map((slot) => {
                                        const selected = selectedSlot?.id === slot.id && selectedSlot?.date === slot.date;

                                        // Check if slot time has passed based on current time for today's date
                                        const isPastSlot = (() => {
                                            if (!slot.date) return false;
                                            const now = new Date();
                                            const d = new Date(`${slot.date}T00:00:00`);
                                            const isToday =
                                                d.getFullYear() === now.getFullYear() &&
                                                d.getMonth() === now.getMonth() &&
                                                d.getDate() === now.getDate();
                                            if (!isToday) return false;

                                            const checkTime = slot.end_time || slot.start_time || "";
                                            let hours = 0;
                                            let minutes = 0;
                                            const match = checkTime.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
                                            if (match) {
                                                hours = parseInt(match[1], 10);
                                                minutes = parseInt(match[2], 10);
                                                const ampm = match[3]?.toUpperCase();
                                                if (ampm === "PM" && hours < 12) hours += 12;
                                                if (ampm === "AM" && hours === 12) hours = 0;
                                            } else {
                                                const parts = checkTime.split(":");
                                                if (parts.length >= 2) {
                                                    hours = parseInt(parts[0], 10);
                                                    minutes = parseInt(parts[1], 10);
                                                }
                                            }
                                            const slotTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
                                            return slotTime.getTime() <= now.getTime();
                                        })();

                                        const full = slot.available === false || isPastSlot;
                                        const video = String(slot.consultation_type).toLowerCase() === "video";
                                        return (
                                            <button key={`${slot.id}-${slot.date}`} type="button" disabled={full}
                                                onClick={() => pickSlot(slot)}
                                                className={`rounded-md border px-2.5 py-2 text-left transition-all cursor-pointer ${selected
                                                    ? "border-primary bg-primary text-white shadow-xs"
                                                    : full ? "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400"
                                                        : "border-slate-200 bg-white text-slate-900 hover:border-primary hover:text-primary"}`}>
                                                <span className="block text-xs font-bold">{slot.start_time} - {slot.end_time}</span>
                                                <span className={`mt-0.5 flex items-center gap-1 text-[10px] font-medium ${selected ? "text-white/90" : "text-slate-500"}`}>
                                                    {video ? <Video className="h-3 w-3" /> : <Building2 className="h-3 w-3" />}
                                                    {video ? "Video" : `In-person · ${slot.opd_type === "private" ? "Private" : "General"} OPD`}
                                                    {isPastSlot ? " · Passed" : full ? " · Full" : ""}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                                {slotsForDate.length === 0 && (
                                    <p className="py-6 text-center text-sm text-muted-foreground">No available slots for this date</p>
                                )}
                            </div>
                        </>
                    )}

                    {/* Video slot: choose start & end call time on that date */}
                    {mode === "slots" && selectedSlot && isVideoSlot && (
                        <VideoTimePicker
                            id="reschedule-visit-time"
                            date={selectedSlot.date}
                            startTime={visitTime}
                            endTime={visitEndTime}
                            onStartTimeChange={setVisitTime}
                            onEndTimeChange={setVisitEndTime}
                        />
                    )}

                </div>

                {/* Footer */}
                <div className="flex shrink-0 flex-col gap-3 border-t border-slate-200 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:flex-row sm:items-center sm:justify-between sm:px-6">
                    <p className="text-sm">
                        {mode === "custom"
                            ? (customDate && customStart
                                ? <span className="text-primary"><span className="font-semibold">Selected:</span> {longDate(customDate)}, {customStart}{customEnd ? ` – ${customEnd}` : ""}</span>
                                : <span className="text-muted-foreground">Choose a date and time</span>)
                            : selectedSlot
                                ? <span className="text-primary"><span className="font-semibold">Selected:</span> {longDate(selectedSlot.date)}, {visitTime || selectedSlot.start_time}{visitEndTime ? ` – ${visitEndTime}` : ""}</span>
                                : <span className="text-muted-foreground">Select a time slot</span>}
                    </p>
                    <button
                        disabled={loading || (mode === "custom" ? !customValid : (!selectedSlot || !visitTimeValid))}
                        onClick={async () => {
                            if (mode === "slots" && !selectedSlot) return;

                            const formatTime = (t: string) => {
                                if (!t) return "";
                                const clean = t.trim();
                                if (/^\d{1,2}:\d{2}$/.test(clean)) return `${clean}:00`;
                                return clean;
                            };

                            const payload = mode === "custom" ? {
                                appointment_id: appointmentId,
                                custom: true,
                                appointment_date: customDate,
                                appointment_time: formatTime(customStart),
                                appointment_end_time: customEnd ? formatTime(customEnd) : undefined,
                                confirm: true,
                            } : {
                                appointment_id: appointmentId,
                                availability_id: selectedSlot.id,
                                appointment_date: selectedSlot.date,
                                appointment_time: isVideoSlot && visitTime ? formatTime(visitTime) : (selectedSlot.booking_start_time || selectedSlot.start_time),
                                appointment_end_time: isVideoSlot && visitEndTime ? formatTime(visitEndTime) : (selectedSlot.booking_end_time || selectedSlot.end_time),
                                confirm: true,
                            };

                            try {
                                setLoading(true);
                                const res = await rescheduleAppointment(payload);


                                if (res.success) {
                                    setDialogData({
                                        title: isAwaitingConfirmation ? "Rescheduled & Confirmed" : "Appointment Rescheduled",
                                        description: isAwaitingConfirmation
                                            ? "The appointment has been moved to the new slot and confirmed. The patient has been emailed the new timing."
                                            : res.message,
                                        type: "success",
                                    });
                                    onSuccess?.();

                                    onOpenChange(false);
                                    setCustomDialogOpen(true);
                                } else {
                                    setDialogData({
                                        title: "Error",
                                        description: res.message || "Something went wrong.",
                                        type: "danger",
                                    });
                                    onOpenChange(false);
                                    setCustomDialogOpen(true);
                                }
                            } catch (err: any) {
                                console.error("Error rescheduling:", err);

                                setDialogData({
                                    title: "Validation Error",
                                    description:
                                        err.response?.data?.errors?.message ||
                                        err.response?.data?.message ||
                                        "Something went wrong",
                                    type: "danger",
                                });

                                onOpenChange(false);
                                setCustomDialogOpen(true);
                            } finally {
                                setLoading(false);
                            }
                        }}
                        className={`w-full rounded-lg px-6 py-2.5 text-sm font-semibold transition-all duration-200 sm:w-auto ${!loading && (mode === "custom" ? customValid : (selectedSlot && visitTimeValid))
                            ? "bg-primary text-white hover:bg-primary/90 active:scale-98"
                            : "bg-gray-300 text-gray-500 cursor-not-allowed"
                            }`}
                    >
                        {loading ? (
                            <div className="flex items-center justify-center gap-2">
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                Rescheduling...
                            </div>
                        ) : isAwaitingConfirmation ? (
                            "Reschedule & Confirm"
                        ) : (
                            "Reschedule"
                        )}
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
}