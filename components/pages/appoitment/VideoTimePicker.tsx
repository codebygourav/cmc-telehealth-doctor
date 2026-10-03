"use client";

import { formatClock, isFutureTimeOnDate, parseTo24HourTime } from "@/api/appointment-actions";
import { Clock, Sun, Sunrise, Sunset, CheckCircle, AlertCircle } from "lucide-react";

interface VideoTimePickerProps {
    date: string;
    value: string;
    onChange: (time: string) => void;
    id?: string;
}

const PRESETS = [
    {
        label: "Morning",
        icon: Sunrise,
        times: ["08:00", "09:00", "10:00", "11:00"],
    },
    {
        label: "Afternoon",
        icon: Sun,
        times: ["12:00", "13:00", "14:00", "15:00", "16:00"],
    },
    {
        label: "Evening",
        icon: Sunset,
        times: ["17:00", "18:00", "19:00", "20:00"],
    },
];

export default function VideoTimePicker({ date, value, onChange, id }: VideoTimePickerProps) {
    const cleanTime = parseTo24HourTime(value) || value;
    const isValid = isFutureTimeOnDate(date, cleanTime);
    const displayTime = cleanTime ? formatClock(cleanTime) : "";

    return (
        <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 sm:p-4">
            {/* Header / Selected Time Banner */}
            <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
                <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Clock className="h-4 w-4" />
                    </div>
                    <div>
                        <label htmlFor={id} className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                            Video Call Time
                        </label>
                        <p className="text-[11px] text-slate-500">Select any timing for this date</p>
                    </div>
                </div>

                {displayTime ? (
                    <div
                        className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold border transition-all ${
                            isValid
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                : "border-rose-200 bg-rose-50 text-rose-700"
                        }`}
                    >
                        {isValid ? <CheckCircle className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
                        <span>{displayTime}</span>
                    </div>
                ) : null}
            </div>

            {/* Custom Time Clock Input */}
            <div className="space-y-1">
                <div className="relative flex items-center">
                    <input
                        id={id}
                        type="time"
                        value={cleanTime}
                        onChange={(e) => onChange(e.target.value)}
                        className={`h-11 w-full rounded-lg border bg-white px-3.5 text-base font-semibold outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 ${
                            isValid ? "border-slate-300 text-slate-900" : "border-rose-500 text-rose-900"
                        }`}
                    />
                </div>
            </div>

            {/* Presets Grid across the full day */}
            <div className="space-y-2.5 pt-1">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Quick Time Slots (Full Day Clock)
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
                                <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-5">
                                    {section.times.map((t) => {
                                        const selected = cleanTime === t;
                                        const timeValid = isFutureTimeOnDate(date, t);
                                        return (
                                            <button
                                                key={t}
                                                type="button"
                                                onClick={() => onChange(t)}
                                                className={`flex h-9 items-center justify-center rounded-md border text-xs font-semibold transition-all cursor-pointer ${
                                                    selected
                                                        ? "border-primary bg-primary text-white shadow-sm ring-2 ring-primary/30"
                                                        : timeValid
                                                        ? "border-slate-200 bg-white text-slate-700 hover:border-primary/50 hover:bg-slate-100/80"
                                                        : "border-slate-100 bg-slate-100 text-slate-400 hover:bg-slate-200/50"
                                                }`}
                                            >
                                                {formatClock(t)}
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
                    ? "Patient will be notified of this time. The video call link opens 1 hour prior."
                    : "Please choose a time later than now for today."}
            </p>
        </div>
    );
}
