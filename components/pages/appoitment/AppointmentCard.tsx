"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Video,
    Phone,
    MapPin,
    PhoneCallIcon,
    CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { getStatusColor } from "@/src/utils/getStatusColor";
import AppointmentActions from "./AppointmentActions";
import CompleteConsultationDialog from "./CompleteConsultationDialog";
import PatientProfileDialog from "./PatientProfileDialog";
import { useState } from "react";
import { UserCheck, UserX, ClipboardCheck } from "lucide-react";

interface AppointmentCardProps {
    appointment: any;
    variant?: "today" | "upcoming" | "past" | "all";
    onCallNow?: () => void;
}

// ✅ Consultation Icon
const getConsultationIcon = (type: string) => {
    const t = String(type || "").toLowerCase();
    switch (t) {
        case "video":
            return <Video className="h-3.5 w-3.5 text-blue-600" />;
        case "phone":
            return <Phone className="h-3.5 w-3.5 text-emerald-600" />;
        case "in-person":
        case "clinic":
            return <MapPin className="h-3.5 w-3.5 text-purple-600" />;
        default:
            return <Video className="h-3.5 w-3.5 text-blue-600" />;
    }
};

// ✅ Initials fallback
const getInitials = (name: string) => {
    if (!name) return "P";
    return name
        .split(" ")
        .filter(Boolean)
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
};

// ✅ Dynamic Middle Banner Right Text & Color (matching Gemini design preview)
const getMiddleBannerStatus = (appointment: any) => {
    const status = String(appointment.status || "").toLowerCase();
    const isConfirmedOrOngoing = ["confirmed", "ongoing"].includes(status);
    const patientJoined =
        appointment.in_waiting_room === true ||
        appointment.patient_in_room === true ||
        appointment.patient_joined === true ||
        appointment.patient_knocked === true ||
        appointment.knocked === true ||
        appointment.call_is_rejoin === true;
    const callNow = appointment.call_now === true && patientJoined && isConfirmedOrOngoing;

    if (callNow || appointment.call_is_rejoin) {
        return {
            label: appointment.call_is_rejoin ? "Ready to Rejoin" : "Ready to Join",
            className: "bg-sky-50 text-sky-700 border border-sky-100 font-semibold",
            isPendingAttendance: false,
        };
    }

    // Replace duplicate "Completed" text on completed cards with Attendance info
    if (status === "completed") {
        const attStatus = (typeof appointment.attendance === "string" ? appointment.attendance : appointment.attendance?.status) || null;
        const voucher = appointment.attendance?.voucher_number || null;

        if (attStatus === "present") {
            return {
                label: voucher ? `Present · Voucher ${voucher}` : "Present",
                className: "bg-emerald-50 text-emerald-700 border border-emerald-100 font-semibold",
                isPendingAttendance: false,
            };
        }
        if (attStatus === "absent") {
            return {
                label: "Absent",
                className: "bg-rose-50 text-rose-700 border border-rose-100 font-semibold",
                isPendingAttendance: false,
            };
        }
        return {
            label: "Pending Attendance",
            className: "bg-amber-50 text-amber-800 border border-amber-200 font-semibold cursor-pointer hover:bg-amber-100 transition-colors",
            isPendingAttendance: true,
        };
    }

    if (status === "awaiting_confirmation" || status === "pending_confirmation") {
        return {
            label: "Pending Approval",
            className: "text-amber-700 bg-amber-50/60 border border-amber-100 font-semibold",
            isPendingAttendance: false,
        };
    }
    if (status === "rescheduled") {
        return {
            label: "Slot Requested",
            className: "text-amber-700 bg-amber-50/60 border border-amber-100 font-semibold",
            isPendingAttendance: false,
        };
    }
    if (status === "cancelled" || status === "failed") {
        return {
            label: appointment.status_label || "Cancelled",
            className: "text-rose-600 bg-rose-50/60 border border-rose-100 font-semibold",
            isPendingAttendance: false,
        };
    }

    // Calculate relative day diff if date is available
    const apptDateStr = appointment.appointment_date || appointment.date;
    if (apptDateStr) {
        const d = new Date(apptDateStr);
        if (!isNaN(d.getTime())) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const target = new Date(d);
            target.setHours(0, 0, 0, 0);
            const diffTime = target.getTime() - today.getTime();
            const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays === 0) return { label: "Today", className: "bg-emerald-50 text-emerald-700 border border-emerald-100 font-semibold", isPendingAttendance: false };
            if (diffDays === 1) return { label: "Tomorrow", className: "bg-blue-50 text-blue-700 border border-blue-100 font-semibold", isPendingAttendance: false };
            if (diffDays > 1) return { label: `In ${diffDays} Days`, className: "bg-blue-50 text-blue-700 border border-blue-100 font-semibold", isPendingAttendance: false };
            if (diffDays < 0) return { label: `${Math.abs(diffDays)} Days Ago`, className: "bg-slate-100 text-slate-600 border border-slate-200/60 font-semibold", isPendingAttendance: false };
        }
    }
    return {
        label: appointment.status_label || "Scheduled",
        className: "bg-blue-50 text-blue-700 border border-blue-100 font-semibold",
        isPendingAttendance: false,
    };
};

export default function AppointmentCard({
    appointment,
    variant = "all",
    onCallNow,
}: AppointmentCardProps) {

    const joinUrl = appointment?.video_consultation?.join_url || appointment?.join_url;
    // Show "In Waiting Room" ONLY if patient is active/knocks AND booking is confirmed
    const patientJoined =
        appointment.in_waiting_room === true ||
        appointment.patient_in_room === true ||
        appointment.patient_joined === true ||
        appointment.patient_knocked === true ||
        appointment.knocked === true ||
        appointment.call_is_rejoin === true;
    const showCallNow = (appointment.call_now === true && patientJoined && ["confirmed", "ongoing"].includes(String(appointment.status).toLowerCase())) || appointment.call_is_rejoin === true;
    const router = useRouter();
    const [askComplete, setAskComplete] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const [showAttendanceDialog, setShowAttendanceDialog] = useState(false);

    const isOpenVideo = String(appointment.consultation_type).toLowerCase() === "video" && ["confirmed", "rescheduled"].includes(String(appointment.status));
    const canComplete = typeof appointment.can_complete === "boolean" ? appointment.can_complete : isOpenVideo && (appointment.awaiting_completion || appointment.call_is_rejoin);

    const apptDateStr = appointment.appointment_date || appointment.date;
    const isToday = (() => {
        if (!apptDateStr) return false;
        const d = new Date(apptDateStr);
        if (isNaN(d.getTime())) return false;
        const today = new Date();
        return (
            d.getFullYear() === today.getFullYear() &&
            d.getMonth() === today.getMonth() &&
            d.getDate() === today.getDate()
        );
    })();
    const isPastDate = (() => {
        if (!apptDateStr) return false;
        const d = new Date(apptDateStr);
        if (isNaN(d.getTime())) return false;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        d.setHours(0, 0, 0, 0);
        return d.getTime() < today.getTime();
    })();

    // Reschedule rule: allow for today regardless of completed status; block past dates or cancelled/failed.
    const shouldHideReschedule =
        isPastDate ||
        variant === "past" ||
        ["failed", "cancelled"].includes(appointment.status) ||
        (!isToday && ["completed"].includes(appointment.status));

    const isAwaiting = appointment?.awaiting_confirmation === true || String(appointment?.status).toLowerCase() === "awaiting_confirmation";
    const canConfirm = appointment?.can_confirm ?? isAwaiting;

    const patientName = appointment.patient?.name || appointment?.patient_name || "Unknown Patient";
    const bookedByName = appointment?.booked_by_name || appointment.patient?.name || appointment?.patient_name || "Patient";
    const bannerInfo = getMiddleBannerStatus(appointment);

    return (
        <>
            <Card className="group flex h-full flex-col rounded-md border border-slate-200/80 bg-white p-3.5 sm:p-4 shadow-2xs hover:shadow-xs transition-all">
                <CardContent className="flex flex-1 flex-col p-0">

                    {/* 🔹 Top Row: Avatar + Patient Info + Status Badge */}
                    <div className="flex items-start justify-between gap-2.5">
                        <div className="flex items-center gap-2.5 min-w-0">
                            <div className="relative shrink-0 cursor-pointer" onClick={(e) => { e.stopPropagation(); router.push(`/patient-detail/${appointment.appointment_id || appointment.id}`); }}>
                                <Avatar className="h-10 w-10 border border-slate-100 hover:ring-2 hover:ring-primary/40 transition-all">
                                    <AvatarImage
                                        src={appointment.patient?.avatar || appointment?.patient_image || ""}
                                        alt={patientName}
                                    />
                                    <AvatarFallback className="bg-sky-100 text-sky-800 font-bold text-xs">
                                        {getInitials(patientName)}
                                    </AvatarFallback>
                                </Avatar>
                                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                            </div>

                            <div className="min-w-0">
                                <h3
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        router.push(`/patient-detail/${appointment.appointment_id || appointment.id}`);
                                    }}
                                    className="font-bold text-slate-900 text-base text-[18px] truncate leading-snug cursor-pointer hover:text-primary hover:underline transition-colors"
                                    title="Click to view patient profile"
                                >
                                    {patientName}
                                </h3>
                                <p className="text-xs text-slate-500 font-normal truncate mt-0">
                                    Booked by {bookedByName}
                                </p>
                            </div>
                        </div>

                        {/* Status Badge (Top Right) */}
                        {showCallNow ? (
                            <Badge
                                className="bg-emerald-50 text-emerald-700 border border-emerald-200/80 hover:bg-emerald-100 cursor-pointer shrink-0 gap-1 px-2.5 py-0.5 text-[11px] font-medium rounded-full whitespace-nowrap"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onCallNow?.();
                                }}
                            >
                                <PhoneCallIcon className="h-3 w-3" />
                                <span>{appointment.call_is_rejoin ? "Rejoin Call" : "In Waiting Room"}</span>
                            </Badge>
                        ) : (
                            <Badge
                                className={`${getStatusColor(
                                    "appointment",
                                    appointment.status
                                )} text-[11px] font-medium px-2.5 py-0.5 rounded-full shrink-0 whitespace-nowrap`}
                            >
                                {appointment.status_label || appointment.status}
                            </Badge>
                        )}
                    </div>

                    {/* 🔹 Middle Bar: Consultation Type & Dynamic Status/Time Badge */}
                    <div className="my-2.5 flex items-center justify-between rounded-md bg-slate-50/90 border border-slate-100 p-2 px-3 text-xs">
                        <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                            {getConsultationIcon(appointment.consultation_type)}
                            <span>
                                {appointment.consultation_type === "in-person" || appointment.consultation_type === "clinic"
                                    ? "Clinic Visit"
                                    : appointment.consultation_type_label || "Video Call"}
                            </span>
                        </div>
                        <span className={`font-medium text-[11px] px-2 py-0.5 rounded-md ${bannerInfo.className}`}>
                            {bannerInfo.label}
                        </span>
                    </div>

                    {/* 🔹 Dashed Divider */}
                    <div className="border-b border-dashed border-slate-200 my-1.5" />

                    {/* 🔹 Date & Time Slot Section */}
                    <div className="grid grid-cols-2 gap-2 my-2">
                        <div>
                            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                {appointment.status === "rescheduled" ? "NEW DATE" : "DATE"}
                            </span>
                            <span className="block font-bold text-slate-900 text-xs sm:text-sm mt-0.5">
                                {appointment.appointment_date_formatted ||
                                    appointment.appointment_date || appointment.date}
                            </span>
                        </div>

                        <div>
                            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                TIME SLOT
                            </span>
                            <span className="block font-bold text-slate-900 text-xs sm:text-sm mt-0.5">
                                {appointment.appointment_time_formatted ||
                                    appointment.appointment_time || appointment.time}
                                {appointment.appointment_end_time_formatted
                                    ? ` – ${appointment.appointment_end_time_formatted}`
                                    : appointment.appointment_end_time
                                        ? ` – ${appointment.appointment_end_time}`
                                        : ""}
                            </span>
                        </div>
                    </div>

                    {/* 🔹 Bottom Actions Area */}
                    <div className="mt-auto pt-1">
                        {canConfirm ? (
                            /* 3 Buttons Layout: Details & Reschedule in top 2 columns, Confirm as full-width bottom button */
                            <div className="space-y-1.5 w-full">
                                <div className="grid grid-cols-2 gap-2 w-full">
                                    <Button
                                        variant="outline"
                                        className="h-8 sm:h-8.5 px-3 text-xs font-medium rounded-md border border-slate-300 text-slate-800 hover:bg-slate-50 cursor-pointer shadow-none w-full"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            router.push(`/appointments/${appointment.appointment_id || appointment.id}`);
                                        }}
                                    >
                                        Details
                                    </Button>

                                    <AppointmentActions
                                        appointment={appointment}
                                        hideReschedule={shouldHideReschedule}
                                        renderOnly="reschedule"
                                        className="w-full"
                                    />
                                </div>

                                <AppointmentActions
                                    appointment={appointment}
                                    hideReschedule={shouldHideReschedule}
                                    renderOnly="confirm"
                                    className="w-full"
                                />
                            </div>
                        ) : canComplete ? (
                            /* 3 Buttons Layout: Details & Reschedule in top 2 columns, Mark Complete as full-width bottom button */
                            <div className="space-y-1.5 w-full">
                                <div className="grid grid-cols-2 gap-2 w-full">
                                    <Button
                                        variant="outline"
                                        className="h-8 sm:h-8.5 px-3 text-xs font-medium rounded-md border border-slate-300 text-slate-800 hover:bg-slate-50 cursor-pointer shadow-none w-full"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            router.push(`/appointments/${appointment.appointment_id || appointment.id}`);
                                        }}
                                    >
                                        Details
                                    </Button>

                                    <AppointmentActions
                                        appointment={appointment}
                                        hideReschedule={shouldHideReschedule}
                                        renderOnly="reschedule"
                                        className="w-full"
                                    />
                                </div>

                                <Button
                                    className="h-8 sm:h-8.5 px-3 text-xs font-semibold rounded-md bg-[#064e3b] hover:bg-[#022c22] text-white gap-1.5 w-full flex items-center justify-center shadow-2xs cursor-pointer"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setAskComplete(true);
                                    }}
                                >
                                    <CheckCircle2 className="h-3.5 w-3.5" /> Mark complete
                                </Button>
                            </div>
                        ) : appointment.video_consultation?.can_join || (appointment.call_now && patientJoined) ? (
                            /* 2-Column layout: Details + Join Call */
                            <div className="grid grid-cols-2 gap-2 w-full">
                                <Button
                                    variant="outline"
                                    className="h-8 sm:h-8.5 px-3 text-xs font-medium rounded-md border border-slate-300 text-slate-800 hover:bg-slate-50 cursor-pointer shadow-none w-full"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        router.push(`/appointments/${appointment.appointment_id || appointment.id}`);
                                    }}
                                >
                                    Details
                                </Button>

                                <Button
                                    className="h-8 sm:h-8.5 px-3 text-xs font-semibold rounded-md bg-[#064e3b] hover:bg-[#022c22] text-white gap-1.5 flex items-center justify-center shadow-2xs cursor-pointer w-full"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        window.open(
                                            `/start-consultation?room_url=${encodeURIComponent(joinUrl)}&appointment_id=${appointment.appointment_id || appointment.id}`,
                                            "_blank"
                                        );
                                    }}
                                >
                                    <PhoneCallIcon className="h-3.5 w-3.5" />
                                    <span>{appointment.call_is_rejoin ? "Rejoin Call" : "Join Call"}</span>
                                </Button>
                            </div>
                        ) : !shouldHideReschedule ? (
                            /* 2-Column layout: Details + Reschedule */
                            <div className="grid grid-cols-2 gap-2 w-full">
                                <Button
                                    variant="outline"
                                    className="h-8 sm:h-8.5 px-3 text-xs font-medium rounded-md border border-slate-300 text-slate-800 hover:bg-slate-50 cursor-pointer shadow-none w-full"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        router.push(`/appointments/${appointment.appointment_id || appointment.id}`);
                                    }}
                                >
                                    Details
                                </Button>

                                <AppointmentActions
                                    appointment={appointment}
                                    hideReschedule={shouldHideReschedule}
                                    className="w-full"
                                />
                            </div>
                        ) : (
                            /* Single Full-Width Details Button */
                            <Button
                                variant="outline"
                                className="h-8 sm:h-8.5 px-3 text-xs font-medium rounded-md border border-slate-300 text-slate-800 hover:bg-slate-50 cursor-pointer shadow-none w-full"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    router.push(`/appointments/${appointment.appointment_id || appointment.id}`);
                                }}
                            >
                                Details
                            </Button>
                        )}
                    </div>

                </CardContent>
            </Card>

            <CompleteConsultationDialog
                open={askComplete}
                onOpenChange={setAskComplete}
                appointmentId={appointment.appointment_id || appointment.id}
                patientName={patientName}
            />

            <PatientProfileDialog
                open={profileOpen}
                onOpenChange={setProfileOpen}
                patient={appointment.patient || { name: patientName, patient_name: patientName, booked_by_name: bookedByName }}
                appointmentHistory={[appointment]}
            />

            {showAttendanceDialog && (
                <AppointmentActions
                    appointment={{ ...appointment, can_mark_attendance: true }}
                    renderOnly="attendance"
                    initialAttendanceOpen={true}
                />
            )}
        </>
    );
}