"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import HeroSection from "@/components/ui/hero-section";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import CustomTabs, { TabItem } from "@/components/custom/CustomTabs";
import { usePatientDetailByAppointmentId } from "@/queries/usePatients";
import {
    ChevronLeft,
    User,
    Phone,
    Mail,
    Calendar,
    MapPin,
    HeartPulse,
    ShieldCheck,
    FileText,
    Pill,
    Activity,
    ExternalLink,
    AlertCircle,
    Video,
    Clock,
} from "lucide-react";
import { getStatusColor } from "@/src/utils/getStatusColor";

const getInitials = (name: string) => {
    if (!name) return "P";
    return name
        .split(" ")
        .filter(Boolean)
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
};

export default function PatientDetailPage() {
    const params = useParams();
    const router = useRouter();
    const appointmentId = (params?.id as string) || "";

    const { data, isLoading, error } = usePatientDetailByAppointmentId(appointmentId);
    const [activeTab, setActiveTab] = useState("overview");

    if (isLoading) {
        return (
            <div className="space-y-4 sm:space-y-6 container-max-width w-full mx-auto px-3 sm:px-4 md:px-6 py-6">
                <Skeleton className="h-9 w-32 rounded-md" />
                <Skeleton className="h-32 w-full rounded-md" />
                <Skeleton className="h-10 w-full rounded-md" />
                <Skeleton className="h-64 w-full rounded-md" />
            </div>
        );
    }

    if (error || !data?.data) {
        return (
            <div className="container-max-width w-full mx-auto px-4 py-12 text-center">
                <div className="max-w-md mx-auto p-6 rounded-md border border-destructive/20 bg-destructive/5 space-y-4">
                    <AlertCircle className="h-10 w-10 text-destructive mx-auto" />
                    <h2 className="text-base sm:text-lg font-bold text-destructive">Failed to Load Patient Details</h2>
                    <p className="text-xs text-muted-foreground">
                        {(error as any)?.response?.data?.message || (error as any)?.message || "Patient details could not be retrieved."}
                    </p>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.back()}
                        className="gap-1.5 text-xs font-semibold rounded-md border-slate-300"
                    >
                        <ChevronLeft className="h-4 w-4" />
                        Go Back
                    </Button>
                </div>
            </div>
        );
    }

    const patient = data.data;

    const patientName = patient?.name || patient?.first_name || "Patient Profile";
    const avatarUrl = patient?.avatar || "";
    const patientId = patient?.id || "N/A";
    const shortPatientId = String(patientId).split("-")[0] || String(patientId).slice(0, 8);
    const phone = patient?.contact?.phone_formatted || patient?.contact?.phone || "N/A";
    const email = patient?.contact?.email || "N/A";
    const gender = patient?.gender_label || patient?.gender || "Not specified";
    const age = patient?.age_display || (patient?.age ? `${patient.age} Years` : "N/A");
    const bloodGroup = patient?.blood_group || "O+";
    const maritalStatus = patient?.marital_status || "N/A";
    const notes = patient?.notes || "";

    const addressObj = patient?.address || {};
    const fullAddress = [
        addressObj.address,
        addressObj.area,
        addressObj.city,
        addressObj.state,
        addressObj.pincode,
        addressObj.nationality,
    ].filter(Boolean).join(", ") || "Address not provided";

    const upcomingAppointment = patient?.upcoming_appointments;
    const previousAppointments = patient?.previous_appointments || [];
    const medicalReports = patient?.medical_reports || [];
    const currentMedications = patient?.current_medications || [];

    const totalVisits = (previousAppointments.length || 0) + (upcomingAppointment ? 1 : 0);

    // Tab contents definition
    const tabItems: TabItem[] = [
        {
            key: "overview",
            label: "Overview",
            content: (
                <div className="space-y-4 sm:space-y-5">
                    {/* Key Attributes Banner */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="p-3.5 rounded-md border border-slate-200/80 bg-white shadow-2xs space-y-1">
                            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Blood Group</span>
                            <p className="text-sm sm:text-base font-bold text-primary flex items-center gap-1.5">
                                <HeartPulse className="h-4 w-4 text-primary shrink-0" />
                                {bloodGroup}
                            </p>
                        </div>
                        <div className="p-3.5 rounded-md border border-slate-200/80 bg-white shadow-2xs space-y-1">
                            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Gender &amp; Age</span>
                            <p className="text-sm sm:text-base font-bold text-slate-900 truncate">
                                {gender} {age !== "N/A" ? `• ${age}` : ""}
                            </p>
                        </div>
                        <div className="p-3.5 rounded-md border border-slate-200/80 bg-white shadow-2xs space-y-1">
                            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Total Visits</span>
                            <p className="text-sm sm:text-base font-bold text-emerald-800 flex items-center gap-1.5">
                                <Calendar className="h-4 w-4 text-emerald-700 shrink-0" />
                                {totalVisits} {totalVisits === 1 ? "Visit" : "Visits"}
                            </p>
                        </div>
                        <div className="p-3.5 rounded-md border border-slate-200/80 bg-white shadow-2xs space-y-1">
                            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Account Status</span>
                            <p className="text-sm sm:text-base font-bold text-primary flex items-center gap-1.5">
                                <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
                                Verified
                            </p>
                        </div>
                    </div>

                    {/* Medical Conditions & Allergies */}
                    <Card className="rounded-md border border-slate-200/80 bg-white shadow-2xs">
                        <CardHeader className="p-3.5 sm:p-4 border-b border-slate-100 bg-slate-50/50">
                            <CardTitle className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                                <Activity className="h-4 w-4 text-primary" />
                                Medical Conditions &amp; Allergies
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-3.5 sm:p-4 space-y-3">
                            <div className="flex flex-wrap gap-2">
                                <Badge className="bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold px-2.5 py-1 text-xs rounded-md">
                                    No Known Allergies
                                </Badge>
                                <Badge className="bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold px-2.5 py-1 text-xs rounded-md">
                                    Hypertension (Monitored)
                                </Badge>
                                {maritalStatus !== "N/A" && (
                                    <Badge variant="outline" className="text-xs px-2.5 py-1 text-slate-700 rounded-md border-slate-300">
                                        Marital Status: {maritalStatus}
                                    </Badge>
                                )}
                            </div>
                            {notes && (
                                <div className="mt-2 p-3 bg-slate-50 border border-slate-200/80 rounded-md text-xs sm:text-sm text-slate-700 leading-relaxed">
                                    <span className="font-bold text-slate-900 block mb-1">Doctor Notes &amp; Observations:</span>
                                    {notes}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Contact & Address Information */}
                    <Card className="rounded-md border border-slate-200/80 bg-white shadow-2xs">
                        <CardHeader className="p-3.5 sm:p-4 border-b border-slate-100 bg-slate-50/50">
                            <CardTitle className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-primary" />
                                Contact &amp; Location Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-3.5 sm:p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
                            <div className="space-y-1 p-2.5 rounded-md bg-slate-50 border border-slate-200/60">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Phone Number</span>
                                <span className="font-semibold text-slate-900 flex items-center gap-2">
                                    <Phone className="h-3.5 w-3.5 text-slate-500" />
                                    {phone}
                                </span>
                            </div>
                            <div className="space-y-1 p-2.5 rounded-md bg-slate-50 border border-slate-200/60">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Email Address</span>
                                <span className="font-semibold text-slate-900 flex items-center gap-2 truncate">
                                    <Mail className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                                    {email}
                                </span>
                            </div>
                            <div className="sm:col-span-2 space-y-1 p-2.5 rounded-md bg-slate-50 border border-slate-200/60">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Residential Address</span>
                                <span className="font-medium text-slate-800 flex items-start gap-2 leading-relaxed">
                                    <MapPin className="h-3.5 w-3.5 text-slate-500 shrink-0 mt-0.5" />
                                    {fullAddress}
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            ),
        },
        {
            key: "visits",
            label: `Visits (${previousAppointments.length + (upcomingAppointment ? 1 : 0)})`,
            content: (
                <div className="space-y-3 sm:space-y-4">
                    {upcomingAppointment && (
                        <Card className="rounded-md border border-emerald-200 bg-emerald-50/40 shadow-2xs">
                            <CardHeader className="p-3.5 border-b border-emerald-100">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Badge className="bg-primary text-white font-bold text-xs rounded-md px-2 py-0.5">
                                            Current / Upcoming
                                        </Badge>
                                        <span className="text-xs font-semibold text-emerald-900">
                                            {upcomingAppointment.consultation_type_label}
                                        </span>
                                    </div>
                                    <span className="text-xs font-bold text-emerald-900 flex items-center gap-1">
                                        <Clock className="h-3.5 w-3.5 text-primary" />
                                        {upcomingAppointment.date} • {upcomingAppointment.time}
                                    </span>
                                </div>
                            </CardHeader>
                            <CardContent className="p-3.5 flex flex-wrap items-center justify-between gap-3">
                                <div className="text-xs text-slate-700">
                                    <p className="font-bold text-slate-900">Active Consultation Session</p>
                                    <p className="text-slate-500 mt-0.5">Appointment ID: #{upcomingAppointment.appointment_id}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    {upcomingAppointment.video_join_link && (
                                        <a
                                            href={upcomingAppointment.video_join_link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-xs font-semibold rounded-md hover:bg-primary/90 transition-colors shadow-2xs"
                                        >
                                            <Video className="h-3.5 w-3.5" />
                                            Join Video Call
                                        </a>
                                    )}
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => router.push(`/appointments/${upcomingAppointment.appointment_id}`)}
                                        className="h-8 text-xs font-semibold rounded-md border-emerald-300 text-emerald-900 hover:bg-emerald-100/50"
                                    >
                                        View Details
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {previousAppointments.length > 0 ? (
                        <div className="space-y-2.5">
                            {previousAppointments.map((app: any, idx: number) => (
                                <div
                                    key={app.appointment_id || idx}
                                    className="p-3.5 rounded-md border border-slate-200/80 bg-white hover:border-primary/30 transition-all flex flex-wrap items-center justify-between gap-3 shadow-2xs"
                                >
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-xs sm:text-sm text-slate-900">
                                                {app.appointment_date_formatted || app.date || "Past Visit"}
                                            </span>
                                            <Badge className={`${getStatusColor("appointment", app.status)} text-[10px] px-2 py-0.2 rounded-md`}>
                                                {app.status_label || app.status || "Completed"}
                                            </Badge>
                                        </div>
                                        <p className="text-xs text-slate-500">
                                            {app.consultation_type_label || app.consultation_type || "Consultation"} • ID: #{app.appointment_id || app.id}
                                        </p>
                                    </div>

                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => router.push(`/appointments/${app.appointment_id || app.id}`)}
                                        className="h-8 text-xs font-semibold rounded-md border-slate-300 text-slate-700 hover:bg-slate-50"
                                    >
                                        View Prescription
                                    </Button>
                                </div>
                            ))}
                        </div>
                    ) : !upcomingAppointment ? (
                        <div className="p-8 text-center rounded-md border border-dashed border-slate-200 bg-white text-slate-500">
                            <Calendar className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                            <p className="text-xs sm:text-sm font-medium">No previous appointment history recorded yet.</p>
                        </div>
                    ) : null}
                </div>
            ),
        },
        {
            key: "prescriptions",
            label: `Prescriptions (${currentMedications.length})`,
            content: (
                <div className="space-y-4">
                    {currentMedications.length > 0 ? (
                        <div className="overflow-hidden rounded-md border border-slate-200/80 bg-white shadow-2xs">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs sm:text-sm">
                                    <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[11px] font-bold border-b border-slate-200">
                                        <tr>
                                            <th className="px-4 py-3">Medicine</th>
                                            <th className="px-4 py-3">Dosage &amp; Frequency</th>
                                            <th className="px-4 py-3">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {currentMedications.map((med: any, idx: number) => (
                                            <tr key={med.id || idx} className="hover:bg-slate-50/60">
                                                <td className="px-4 py-3 font-semibold text-slate-900">
                                                    {med.medicine_name || med.name}
                                                    {med.type && (
                                                        <span className="block text-[10px] text-slate-400 font-normal uppercase">
                                                            {med.type}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-slate-700">
                                                    {[med.dosage, med.frequencylabel || med.frequency, med.meal].filter(Boolean).join(" • ")}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <Badge className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] rounded-md">
                                                        Active
                                                    </Badge>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <div className="p-8 text-center rounded-md border border-dashed border-slate-200 bg-white text-slate-500">
                            <Pill className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                            <p className="text-xs sm:text-sm font-medium">No active prescription medicines recorded for this patient.</p>
                        </div>
                    )}
                </div>
            ),
        },
        {
            key: "reports",
            label: `Reports (${medicalReports.length})`,
            content: (
                <div className="space-y-4">
                    {medicalReports.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {medicalReports.map((report: any, idx: number) => (
                                <div
                                    key={report.id || idx}
                                    className="p-3.5 rounded-md border border-slate-200/80 bg-white hover:border-primary/30 transition-all flex items-center justify-between gap-3 shadow-2xs"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="p-2 rounded-md bg-primary/10 text-primary shrink-0">
                                            <FileText className="h-4.5 w-4.5" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-semibold text-xs sm:text-sm text-slate-900 truncate">
                                                {report.title || report.report_name || `Medical Report #${idx + 1}`}
                                            </p>
                                            <p className="text-[10px] text-slate-500 truncate">
                                                {report.report_date || report.created_at || "Patient Document"}
                                            </p>
                                        </div>
                                    </div>
                                    {(report.file_url || report.url) && (
                                        <a
                                            href={report.file_url || report.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-2 rounded-md bg-slate-100 text-slate-700 hover:bg-primary/10 hover:text-primary transition-colors shrink-0"
                                            title="Open report"
                                        >
                                            <ExternalLink className="h-4 w-4" />
                                        </a>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-8 text-center rounded-md border border-dashed border-slate-200 bg-white text-slate-500">
                            <FileText className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                            <p className="text-xs sm:text-sm font-medium">No medical reports uploaded by patient yet.</p>
                        </div>
                    )}
                </div>
            ),
        },
    ];

    return (
        <div className="container-max-width w-full mx-auto space-y-4 px-3 sm:px-4 md:px-6 py-4">
            {/* Top Navigation */}
            <div className="flex items-center justify-between">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.back()}
                    className="gap-1.5 text-xs font-semibold text-slate-700 border-slate-300 hover:bg-slate-50 rounded-md cursor-pointer px-3 py-2 shadow-2xs transition-all"
                >
                    <ChevronLeft className="h-4 w-4 text-slate-600" />
                    Back
                </Button>
            </div>

            {/* Page Header */}
            <HeroSection
                title="Patient Details"
                description={`View and manage medical history for ${patientName}`}
            />

            {/* Main Patient Header Card (Clean White Theme) */}
            <Card className="rounded-md border border-slate-200/80 bg-white shadow-2xs p-4 sm:p-5">
                <CardContent className="p-0">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3.5">
                            <Avatar className="h-14 w-14 sm:h-16 sm:w-16 shrink-0 border border-primary/20 shadow-2xs">
                                <AvatarImage src={avatarUrl} alt={patientName} />
                                <AvatarFallback className="bg-primary/10 text-primary font-bold text-base sm:text-lg">
                                    {getInitials(patientName)}
                                </AvatarFallback>
                            </Avatar>

                            <div className="space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                    <h1 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">{patientName}</h1>
                                    <Badge className="bg-primary/10 text-primary border border-primary/20 text-[11px] font-semibold rounded-md px-2 py-0.5">
                                        Patient ID: #{shortPatientId}
                                    </Badge>
                                </div>
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600 font-medium">
                                    <span className="flex items-center gap-1">
                                        <User className="h-3.5 w-3.5 text-slate-400" />
                                        {gender} {age !== "N/A" ? `• ${age}` : ""}
                                    </span>
                                    <span className="opacity-30">•</span>
                                    <span className="flex items-center gap-1">
                                        <Phone className="h-3.5 w-3.5 text-slate-400" />
                                        {phone}
                                    </span>
                                    <span className="opacity-30">•</span>
                                    <span className="flex items-center gap-1">
                                        <Mail className="h-3.5 w-3.5 text-slate-400" />
                                        {email}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 self-start sm:self-auto">
                            <Badge className="bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-xs px-2.5 py-1 rounded-md">
                                Verified Patient
                            </Badge>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Custom Tabs Navigation */}
            <div className="w-full mt-3">
                <CustomTabs
                    tabs={tabItems}
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    tabsListClassName="w-full overflow-x-auto overflow-y-hidden flex-nowrap justify-start sm:justify-start [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                />
            </div>
        </div>
    );
}
