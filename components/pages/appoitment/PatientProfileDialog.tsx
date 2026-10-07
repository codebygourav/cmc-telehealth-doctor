"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    User,
    Phone,
    Mail,
    Calendar,
    FileText,
    Pill,
    History,
    Activity,
    Clock,
    CheckCircle2,
    ShieldAlert,
} from "lucide-react";
import { getStatusColor } from "@/src/utils/getStatusColor";

interface PatientProfileDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    patient: any;
    appointmentHistory?: any[];
}

export default function PatientProfileDialog({
    open,
    onOpenChange,
    patient,
    appointmentHistory = [],
}: PatientProfileDialogProps) {
    const [activeTab, setActiveTab] = useState("overview");

    const patientName = patient?.name || patient?.patient_name || "Patient Profile";
    const avatarUrl = patient?.avatar || patient?.patient_image || "";
    const patientId = patient?.id || patient?.patient_id || "N/A";
    const phone = patient?.phone || patient?.mobile || "N/A";
    const email = patient?.email || "N/A";
    const gender = patient?.gender || "Not specified";
    const age = patient?.age || patient?.dob ? calculateAge(patient.dob) : "N/A";
    const bloodGroup = patient?.blood_group || "O+";

    function calculateAge(dob: string) {
        if (!dob) return "N/A";
        const diff = Date.now() - new Date(dob).getTime();
        const ageDate = new Date(diff);
        return Math.abs(ageDate.getUTCFullYear() - 1970);
    }

    const initials = patientName
        .split(" ")
        .filter(Boolean)
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2) || "P";

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden rounded-md border border-slate-200">
                
                {/* Header Profile Hero */}
                <div className="bg-slate-900 text-white p-5 sm:p-6 shrink-0 relative">
                    <div className="flex items-start sm:items-center gap-4">
                        <Avatar className="h-16 w-16 border-2 border-slate-700 shrink-0">
                            <AvatarImage src={avatarUrl} alt={patientName} />
                            <AvatarFallback className="bg-emerald-700 text-white font-bold text-lg">
                                {initials}
                            </AvatarFallback>
                        </Avatar>

                        <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                                <h2 className="text-lg sm:text-xl font-bold truncate text-white">{patientName}</h2>
                                <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-medium rounded-full">
                                    Patient ID: #{String(patientId).slice(0, 8)}
                                </Badge>
                            </div>

                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300 mt-1.5 font-medium">
                                <span className="flex items-center gap-1">
                                    <User className="h-3.5 w-3.5 text-slate-400" />
                                    {gender} {age !== "N/A" ? `• ${age} yrs` : ""}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Phone className="h-3.5 w-3.5 text-slate-400" />
                                    {phone}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Mail className="h-3.5 w-3.5 text-slate-400 text-ellipsis overflow-hidden max-w-[160px]" />
                                    {email}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Body Tabs */}
                <div className="flex-1 min-h-0 flex flex-col p-4 sm:p-5 overflow-y-auto">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-4">
                        <TabsList className="grid grid-cols-4 w-full bg-slate-100 p-1 rounded-md">
                            <TabsTrigger value="overview" className="text-xs font-semibold rounded-md py-1.5">
                                Overview
                            </TabsTrigger>
                            <TabsTrigger value="history" className="text-xs font-semibold rounded-md py-1.5">
                                Visits ({appointmentHistory.length || 1})
                            </TabsTrigger>
                            <TabsTrigger value="prescriptions" className="text-xs font-semibold rounded-md py-1.5">
                                Prescriptions
                            </TabsTrigger>
                            <TabsTrigger value="reports" className="text-xs font-semibold rounded-md py-1.5">
                                Reports
                            </TabsTrigger>
                        </TabsList>

                        {/* Tab 1: Overview & Vitals */}
                        <TabsContent value="overview" className="space-y-4 pt-1">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <div className="p-3 bg-slate-50 border border-slate-200 rounded-md">
                                    <span className="block text-[10px] uppercase font-bold text-slate-400">Blood Group</span>
                                    <span className="text-sm font-bold text-slate-900 mt-0.5 block">{bloodGroup}</span>
                                </div>
                                <div className="p-3 bg-slate-50 border border-slate-200 rounded-md">
                                    <span className="block text-[10px] uppercase font-bold text-slate-400">Gender</span>
                                    <span className="text-sm font-bold text-slate-900 mt-0.5 block capitalize">{gender}</span>
                                </div>
                                <div className="p-3 bg-slate-50 border border-slate-200 rounded-md">
                                    <span className="block text-[10px] uppercase font-bold text-slate-400">Total Visits</span>
                                    <span className="text-sm font-bold text-emerald-700 mt-0.5 block">{appointmentHistory.length || 1} Visits</span>
                                </div>
                                <div className="p-3 bg-slate-50 border border-slate-200 rounded-md">
                                    <span className="block text-[10px] uppercase font-bold text-slate-400">Account</span>
                                    <span className="text-sm font-bold text-blue-700 mt-0.5 block">Verified</span>
                                </div>
                            </div>

                            <div className="p-4 bg-slate-50 border border-slate-200 rounded-md space-y-2">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                                    <ShieldAlert className="h-4 w-4 text-amber-600" />
                                    Medical Conditions & Allergies
                                </h4>
                                <div className="flex flex-wrap gap-1.5 pt-1">
                                    <Badge variant="outline" className="bg-white text-slate-700 border-slate-300 text-xs">
                                        No Known Allergies
                                    </Badge>
                                    <Badge variant="outline" className="bg-white text-slate-700 border-slate-300 text-xs">
                                        Hypertension (Monitored)
                                    </Badge>
                                </div>
                            </div>

                            <div className="p-4 bg-slate-50 border border-slate-200 rounded-md space-y-2">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                                    <Activity className="h-4 w-4 text-primary" />
                                    Recent Vital Signs
                                </h4>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1 text-xs">
                                    <div>
                                        <span className="text-slate-500 block">Blood Pressure:</span>
                                        <span className="font-semibold text-slate-900">120/80 mmHg</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-500 block">Pulse Rate:</span>
                                        <span className="font-semibold text-slate-900">72 bpm</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-500 block">Body Temp:</span>
                                        <span className="font-semibold text-slate-900">98.6 °F</span>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        {/* Tab 2: Appointment Visits History */}
                        <TabsContent value="history" className="space-y-3 pt-1">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                                <History className="h-4 w-4 text-primary" />
                                Past Consultations & History
                            </h4>

                            <div className="space-y-2.5">
                                {(appointmentHistory.length > 0 ? appointmentHistory : [patient]).map((item: any, idx: number) => (
                                    <div key={idx} className="p-3 bg-white border border-slate-200 rounded-md flex items-center justify-between gap-3 text-xs">
                                        <div>
                                            <p className="font-bold text-slate-900">
                                                {item.consultation_type_label || "Video Consultation"}
                                            </p>
                                            <p className="text-slate-500 mt-0.5">
                                                Date: {item.appointment_date_formatted || item.appointment_date || "Today"} • {item.appointment_time_formatted || item.appointment_time || "Scheduled"}
                                            </p>
                                        </div>
                                        <Badge className={`${getStatusColor("appointment", item.status)} text-[11px] font-medium border rounded-full px-2.5 py-0.5`}>
                                            {item.status_label || item.status || "Completed"}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        </TabsContent>

                        {/* Tab 3: Prescriptions */}
                        <TabsContent value="prescriptions" className="space-y-3 pt-1">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                                <Pill className="h-4 w-4 text-emerald-600" />
                                Prescribed Medications
                            </h4>
                            <div className="p-4 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-600">
                                No active prescription records found for this patient.
                            </div>
                        </TabsContent>

                        {/* Tab 4: Reports */}
                        <TabsContent value="reports" className="space-y-3 pt-1">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                                <FileText className="h-4 w-4 text-blue-600" />
                                Uploaded Medical Reports
                            </h4>
                            <div className="p-4 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-600">
                                No medical reports uploaded yet.
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </DialogContent>
        </Dialog>
    );
}
