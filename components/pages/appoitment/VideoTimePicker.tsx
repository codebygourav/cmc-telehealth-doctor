"use client";

import { formatClock, isFutureTimeOnDate, parseTo24HourTime } from "@/api/appointment-actions";
import { Clock, Sun, Sunrise, Sunset, CheckCircle, AlertCircle, ArrowRight } from "lucide-react";

interface VideoTimePickerProps {
    date: string;
    // Backward-compatible single value / onChange props
    value?: string;
    onChange?: (time: string) => void;
    // Dual start and end time props
    startTime?: string;
    endTime?: string;
    onStartTimeChange?: (time: string) => void;
    onEndTimeChange?: (time: string) => void;
    id?: string;
}

const PRESETS = [
    {
        label: "Morning",
        icon: Sunrise,
        times: [
            { start: "08:00", end: "09:00" },
            { start: "09:00", end: "10:00" },
            { start: "10:00", end: "11:00" },
            { start: "11:00", end: "12:00" },
        ],
    },
    {
        label: "Afternoon",
        icon: Sun,
        times: [
            { start: "12:00", end: "13:00" },
            { start: "13:00", end: "14:00" },
            { start: "14:30", end: "19:30" },
            { start: "15:00", end: "16:00" },
            { start: "16:00", end: "17:00" },
        ],
    },
    {
        label: "Evening",
        icon: Sunset,
        times: [
            { start: "17:00", end: "18:00" },
            { start: "18:00", end: "19:00" },
            { start: "19:00", end: "20:00" },
            { start: "20:00", end: "21:00" },
        ],
    },
];

// Calculate 1 hour default after start time
const addOneHour = (timeStr: string) => {
    const clean = parseTo24HourTime(timeStr) || timeStr;
    const [hStr, mStr] = clean.split(":");
    let h = parseInt(hStr || "0", 10);
    const m = mStr || "00";
    h = (h + 1) % 24;
    return `${String(h).padStart(2, "0")}:${m}`;
};

export default function VideoTimePicker({
    date,
    value,
    onChange,
    startTime,
    endTime,
    onStartTimeChange,
    onEndTimeChange,
    id,
}: VideoTimePickerProps) {
    const effectiveStart = startTime !== undefined ? startTime : (value || "");
    const effectiveEnd = endTime !== undefined ? endTime : "";

    const cleanStart = parseTo24HourTime(effectiveStart) || effectiveStart;
    const cleanEnd = parseTo24HourTime(effectiveEnd) || effectiveEnd;
    const isValid = isFutureTimeOnDate(date, cleanStart);

    const displayStart = cleanStart ? formatClock(cleanStart) : "";
    const displayEnd = cleanEnd ? formatClock(cleanEnd) : "";

    const handleStartChange = (newStart: string) => {
        if (onStartTimeChange) onStartTimeChange(newStart);
        if (onChange) onChange(newStart);
        if (onEndTimeChange && (!cleanEnd || cleanEnd <= newStart)) {
            onEndTimeChange(addOneHour(newStart));
        }
    };

    const handleEndChange = (newEnd: string) => {
        if (onEndTimeChange) onEndTimeChange(newEnd);
    };

    return (
        <div className="space-y-3.5 rounded-md border border-slate-200 bg-slate-50/60 p-3.5 sm:p-4">
            {/* Header / Selected Time Banner */}
            <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
                <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Clock className="h-4 w-4" />
                    </div>
                    <div>
                        <label htmlFor={id} className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                            Time Slot Range (Start & End Time)
                        </label>
                        <p className="text-[11px] text-slate-500">Pick exact start and end times for this consultation</p>
                    </div>
                </div>

                {displayStart ? (
                    <div
                        className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold border transition-all ${isValid
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-rose-200 bg-rose-50 text-rose-700"
                            }`}
                    >
                        {isValid ? <CheckCircle className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
                        <span>{displayStart} {displayEnd ? `– ${displayEnd}` : ""}</span>
                    </div>
                ) : null}
            </div>

            {/* Start Time & End Time Inputs */}
            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
                        Start Time
                    </label>
                    <input
                        id={id}
                        type="time"
                        value={cleanStart}
                        onChange={(e) => handleStartChange(e.target.value)}
                        className={`h-10 w-full rounded-md border bg-white px-3 text-sm font-semibold outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 ${isValid ? "border-slate-300 text-slate-900" : "border-rose-500 text-rose-900"
                            }`}
                    />
                </div>

                <div className="space-y-1">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
                        End Time
                    </label>
                    <input
                        id={`${id}-end`}
                        type="time"
                        value={cleanEnd}
                        onChange={(e) => handleEndChange(e.target.value)}
                        className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                </div>
            </div>

            {/* Presets Grid across the full day */}
            <div className="space-y-2.5 pt-1">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Quick Time Slot Presets
                </p>

                <div className="space-y-2">
                    {PRESETS.map((section) => {
                        const Icon = section.icon;
                        return (
                            <div key={section.label} className="space-y-1">
                                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600">
                                    <Icon className="h-3 w-3 text-slate-400" />
                                    <span>{section.label}</span>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                                    {section.times.map((t) => {
                                        const selected = cleanStart === t.start && cleanEnd === t.end;
                                        const timeValid = isFutureTimeOnDate(date, t.start);
                                        return (
                                            <button
                                                key={`${t.start}-${t.end}`}
                                                type="button"
                                                onClick={() => {
                                                    handleStartChange(t.start);
                                                    handleEndChange(t.end);
                                                }}
                                                className={`flex h-9 items-center justify-center gap-1 rounded-md border text-xs font-semibold transition-all cursor-pointer ${selected
                                                    ? "border-primary bg-primary text-white shadow-sm ring-2 ring-primary/30"
                                                    : timeValid
                                                        ? "border-slate-200 bg-white text-slate-700 hover:border-primary/50 hover:bg-slate-100/80"
                                                        : "border-slate-100 bg-slate-100 text-slate-400 hover:bg-slate-200/50"
                                                    }`}
                                            >
                                                <span>{formatClock(t.start)}</span>
                                                <ArrowRight className="h-3 w-3 opacity-60" />
                                                <span>{formatClock(t.end)}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Help / Validation hint */}
            <p className={`text-xs ${isValid ? "text-slate-500" : "font-semibold text-rose-600"}`}>
                {isValid
                    ? "Patient will be notified of this time slot. The video call link opens 1 hour prior."
                    : "Please choose a start time later than now for today."}
            </p>
        </div>
    );
}

