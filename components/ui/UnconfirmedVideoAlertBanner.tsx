"use client";

import { useMyAppointments } from "@/queries/useAppointments";
import { useRouter } from "next/navigation";

export function UnconfirmedVideoAlertBanner() {
    const router = useRouter();
    const { data } = useMyAppointments("all", 1);
    const appointments = Array.isArray(data?.data) ? data.data : [];

    const urgentUnconfirmed = appointments.filter((apt: any) => {
        const type = String(apt.consultation_type || "").toLowerCase();
        if (type !== "video") return false;

        const isUnconfirmed =
            apt.awaiting_confirmation === true ||
            apt.can_confirm === true ||
            ["awaiting_confirmation", "pending_confirmation"].includes(String(apt.status).toLowerCase());
        if (!isUnconfirmed) return false;

        const now = new Date();
        const dateStr = String(apt.appointment_date || apt.date || "").slice(0, 10);
        const apptD = new Date(dateStr);
        if (isNaN(apptD.getTime())) return false;

        const isToday =
            apptD.getFullYear() === now.getFullYear() &&
            apptD.getMonth() === now.getMonth() &&
            apptD.getDate() === now.getDate();
        if (!isToday) return false;

        const timeStr = String(apt.appointment_time || apt.time || "").trim();
        if (!timeStr) return true;

        let hours = 0;
        let minutes = 0;
        const match12 = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
        if (match12) {
            hours = parseInt(match12[1], 10);
            minutes = parseInt(match12[2], 10);
            const ampm = match12[3]?.toUpperCase();
            if (ampm === "PM" && hours < 12) hours += 12;
            if (ampm === "AM" && hours === 12) hours = 0;
        } else {
            const parts = timeStr.split(":");
            if (parts.length >= 2) {
                hours = parseInt(parts[0], 10);
                minutes = parseInt(parts[1], 10);
            }
        }

        const apptStartTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
        const diffMs = apptStartTime.getTime() - now.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);

        return diffHours <= 2.0;
    });

    if (!urgentUnconfirmed.length) return null;

    return (
        <div className="sticky top-16 z-40 w-full bg-[#064e3b] text-white shadow-md border-b border-[#022c22] transition-all">
            <div className="w-full px-4 sm:px-8 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
                <div className="flex items-center gap-3">
                    <span className="relative flex h-3 w-3 shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400"></span>
                    </span>
                    <p className="font-medium text-emerald-50 leading-tight text-xs sm:text-sm">
                        <strong className="text-white font-bold">Action Required:</strong> You have {urgentUnconfirmed.length} unconfirmed Video Consultation starting soon. Please confirm the booking first to see and join the meeting call.
                    </p>
                </div>
                <button
                    onClick={() => {
                        router.push("/appointments?tab=pending_confirmation");
                    }}
                    className="shrink-0 rounded-md bg-white px-3.5 py-1.5 text-xs font-bold text-[#064e3b] shadow-xs hover:bg-emerald-50 transition-all cursor-pointer"
                >
                    Confirm Booking First
                </button>
            </div>
        </div>
    );
}
