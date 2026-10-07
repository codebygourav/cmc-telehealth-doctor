"use client";

import {
    Card,
    CardContent,
} from "@/components/ui/card";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Calendar, CheckCircle, CheckCircle2, Dot, Mail, Phone, Video } from "lucide-react";
import CompleteConsultationDialog from "@/components/pages/appoitment/CompleteConsultationDialog";
import { getStatusColor } from "@/src/utils/getStatusColor";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cancelAppointment } from "@/mutations/mange-appoitment";
import CustomDialog from "@/components/custom/Dialogboxs";
import AppointmentActions from "@/components/pages/appoitment/AppointmentActions";

const getInitials = (name: string) => {
    if (!name) return "?";
    return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
};

export default function AppointmentHeader({ appointment }: { appointment: any }) {

    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [localStatus, setLocalStatus] = useState(appointment?.status);

    // Keep the badge in sync after confirm / reschedule / attendance refresh the appointment.
    useEffect(() => {
        setLocalStatus(appointment?.status);
    }, [appointment?.status]);
    const patient = appointment?.patient || {};
    const schedule = appointment?.schedule || {};
    const [successOpen, setSuccessOpen] = useState(false);

    const handleCancelAppointment = async () => {
        try {
            setLoading(true);
            const appointmentId = appointment?.appointment_id || appointment?.id;

            const res = await cancelAppointment(appointmentId);

            setLocalStatus("cancelled");
            setOpen(false);
            setSuccessOpen(true);
        } catch (error: any) {
            const errorMessage =
                error?.response?.data?.errors?.message ||
                error?.response?.data?.message ||
                "Something went wrong";

            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const joinUrl = appointment?.join_url || "";
    const callNow = appointment?.call_now || "";
    const callLabel = appointment?.call_is_rejoin ? "Rejoin Call" : "Join Now";
    const consultationUrl = `/start-consultation?room_url=${encodeURIComponent(joinUrl)}&appointment_id=${appointment?.appointment_id || appointment?.id}`;
    // Video visit still open: the doctor completes it (leaving the call never does).
    const isOpenVideo = String(appointment?.consultation_type || "").toLowerCase() === "video"
        && ["confirmed", "rescheduled"].includes(String(appointment?.status));
    const canComplete = typeof appointment?.can_complete === "boolean" ? appointment.can_complete : isOpenVideo && (appointment?.awaiting_completion || appointment?.call_is_rejoin);
    const [askComplete, setAskComplete] = useState(false);

    return (
        <Card className="rounded-md border border-border/80 shadow-2xs p-3 sm:p-4">
            <CardContent className="p-0">
                <div className="flex flex-col w-full gap-2.5">

                    {/* Desktop Layout */}
                    <div className="hidden sm:flex sm:justify-between items-center w-full gap-3">

                        {/* Patient Info */}
                        <div className="flex items-center gap-3">
                            <Avatar className="h-16 w-16 shrink-0 border border-primary/10">
                                <AvatarImage src={patient?.avatar} />
                                <AvatarFallback className="bg-primary/10 text-primary font-bold text-base">
                                    {getInitials(patient?.name)}
                                </AvatarFallback>
                            </Avatar>

                            <div className="flex flex-col gap-0.5">
                                <div className="flex items-center gap-1 text-xs font-semibold text-primary">
                                    <span>{schedule?.date_format || appointment?.appointment_date_format}</span>
                                    <span className="opacity-40">|</span>
                                    <span>
                                        {schedule?.time_formatted || appointment?.appointment_time_formatted}
                                        {appointment?.appointment_end_time_formatted &&
                                            ` - ${appointment.appointment_end_time_formatted}`}
                                    </span>
                                    <span className="opacity-40">•</span>
                                    <span>{schedule?.day_format || appointment?.appointment_date_format}</span>
                                </div>

                                <div className="flex items-baseline gap-1.5">
                                    <h2 className="text-foreground text-xl font-bold">
                                        {patient?.name || "Unknown Patient"}
                                    </h2>
                                    <span className="text-xs text-muted-foreground font-medium">
                                        ({patient?.age_formatted || "N/A"},{" "}
                                        {patient?.gender_formatted || "N/A"})
                                    </span>
                                </div>

                                {appointment?.booked_by_name && appointment.booked_by_name !== patient?.name && (
                                    <p className="text-xs text-muted-foreground">Booked by {appointment.booked_by_name}</p>
                                )}

                                <div className="flex items-center flex-wrap gap-1.5 text-xs text-muted-foreground mt-0.5">
                                    <p className="text-xs font-medium flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted/60 border border-border/40">
                                        <Mail className="h-3 w-3 text-muted-foreground" /> {patient?.email || "Not provided"}
                                    </p>
                                    <p className="text-xs font-medium flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted/60 border border-border/40">
                                        <Phone className="h-3 w-3 text-muted-foreground" /> {patient?.phone || "Not provided"}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Date/Time, Badges, Cancel Button */}
                        <div className="flex flex-col items-end justify-center gap-1.5 shrink-0">

                            <div className="flex items-center gap-1.5">
                                <Badge className={`${getStatusColor("appointment", localStatus)} gap-1 py-1 px-2.5 rounded-md text-xs font-semibold`}>
                                    {appointment?.status_label || "Completed"}
                                </Badge>

                                <Badge variant="outline" className="gap-1 border-border py-1 px-2 rounded-md text-xs font-medium bg-muted/40">
                                    <Video className="h-3 w-3" />
                                    {schedule?.consultation_type_label || "Video"}
                                </Badge>
                            </div>

                            {callNow && joinUrl && (
                                <Button
                                    variant="default"
                                    onClick={() => window.open(consultationUrl, "_blank")}
                                    disabled={!joinUrl}
                                    className="h-9 py-2 px-4 font-semibold rounded-md gap-1.5 cursor-pointer bg-[#064e3b] hover:bg-[#022c22] text-white shadow-2xs"
                                >
                                    <Phone className="h-4 w-4" />
                                    {callLabel}
                                </Button>
                            )}

                            {canComplete && (
                                <Button variant="outline" onClick={() => setAskComplete(true)}
                                    className="h-10 gap-1.5 rounded-md border-primary px-4 font-semibold text-primary hover:bg-primary/5">
                                    <CheckCircle2 className="h-4 w-4" /> Mark as completed
                                </Button>
                            )}

                            <AppointmentActions appointment={appointment} className="justify-end" />
                        </div>

                    </div>

                    {/* Mobile Layout - Responsive Changes */}
                    <div className="flex flex-col gap-3 sm:hidden">

                        {/* Patient Profile - Top */}
                        <div className="flex items-center gap-3">
                            <Avatar className="h-12 w-12 border-2 border-primary/10 shrink-0">
                                <AvatarImage src={patient?.avatar} />
                                <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                                    {getInitials(patient?.name)}
                                </AvatarFallback>
                            </Avatar>

                            <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-baseline gap-x-1 gap-y-0.5">
                                    <h2 className="text-sm font-semibold truncate">
                                        {patient?.name || "Unknown Patient"}
                                    </h2>
                                    <span className="text-[10px] text-muted-foreground">
                                        ({patient?.age_formatted || "N/A"}, {patient?.gender_formatted || "N/A"})
                                    </span>
                                </div>
                                <div className="mt-1 space-y-0.5">
                                    <p className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                        <Phone className="h-2.5 w-2.5" />
                                        <span className="truncate">{patient?.phone || "Not provided"}</span>
                                    </p>
                                    <p className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                        <Mail className="h-2.5 w-2.5" />
                                        <span className="truncate">{patient?.email || "Not provided"}</span>
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Date & Time - Mobile */}
                        <div className="flex flex-wrap items-center gap-1">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            <span className="text-[11px] font-medium">
                                {schedule?.date_format || appointment?.appointment_date_format}
                            </span>
                            <span className="text-[11px] text-muted-foreground">|</span>
                            <span className="text-[11px] font-medium">
                                {schedule?.time_formatted || appointment?.appointment_time_formatted}
                                {appointment?.appointment_end_time_formatted &&
                                    ` - ${appointment.appointment_end_time_formatted}`}
                            </span>
                            <span className="text-[11px] text-muted-foreground">•</span>
                            <span className="text-[11px] font-medium">
                                {schedule?.day_format || appointment?.appointment_date_format}
                            </span>
                        </div>

                        {/* Badges - Mobile */}
                        <div className="flex flex-wrap items-center gap-1.5">
                            <Badge className={`${getStatusColor("appointment", localStatus)} gap-1 text-[9px] px-1.5 py-0`}>
                                {appointment?.status_label || "Completed"}
                            </Badge>
                            <Badge variant="outline" className="gap-1 text-[9px] px-1.5 py-0">
                                <Video className="h-2 w-2" />
                                {schedule?.consultation_type_label || "Video"}
                            </Badge>
                        </div>

                        <AppointmentActions appointment={appointment} />

                        {/* Join Now Button - Bottom */}
                        {!successOpen &&
                            ["confirmed", "rescheduled"].includes(appointment?.status) &&
                            joinUrl && (
                                <Button
                                    variant="default"
                                    className="w-full h-8 text-xs mt-1"
                                    onClick={() => window.open(consultationUrl, "_blank")}
                                >
                                    {callLabel}
                                </Button>
                            )}
                    </div>
                </div>

                {/* Everyone left the call and it is not completed yet */}
                {appointment?.awaiting_completion && isOpenVideo && (
                    <div className="mt-4 flex flex-col gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 sm:flex-row sm:items-center sm:justify-between">
                        <p><strong>The call has ended.</strong> Mark the appointment as completed when the consultation is done, or rejoin until the end time.</p>
                        <Button size="sm" onClick={() => setAskComplete(true)} className="shrink-0">Complete appointment</Button>
                    </div>
                )}

                <CompleteConsultationDialog
                    open={askComplete}
                    onOpenChange={setAskComplete}
                    appointmentId={appointment?.appointment_id || appointment?.id}
                    patientName={appointment?.patient?.name}
                    onRejoin={callNow && joinUrl ? () => window.open(consultationUrl, "_blank") : undefined}
                />

                {/* Dialogs */}
                <CustomDialog
                    open={open}
                    onClose={() => setOpen(false)}
                    title="Cancel Appointment"
                    description="Are you sure you would like to do this?"
                    confirmText={loading ? "Cancelling..." : "Yes, Cancel Appointment"}
                    cancelText="No, Keep Appointment"
                    onConfirm={handleCancelAppointment}
                    loading={loading}
                    type="danger"
                />

                <CustomDialog
                    open={successOpen}
                    onClose={() => setSuccessOpen(false)}
                    icon={<CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />}
                    title="Appointment Cancelled"
                    description="Your appointment has been successfully cancelled."
                    confirmText="OK"
                    onConfirm={() => setSuccessOpen(false)}
                    type="success"
                />
            </CardContent>
        </Card>
    );
}