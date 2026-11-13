"use client";

/**
 * Appointment → Prescription: every time the prescription PDF was sent on WhatsApp (date, number,
 * who sent it, WhatsApp status, the PDF that was sent), with Resend.
 */
import { useQuery } from "@tanstack/react-query";
import { CheckCheck, Check, AlertCircle, FileText, MessageCircle, RotateCcw } from "lucide-react";
import { getPrescriptionShareInfo } from "@/api/prescription-share";

const STATUS: Record<string, { label: string; className: string; Icon: typeof Check }> = {
    read: { label: "Read", className: "bg-emerald-50 text-emerald-700 border-emerald-200", Icon: CheckCheck },
    delivered: { label: "Delivered", className: "bg-emerald-50 text-emerald-700 border-emerald-200", Icon: CheckCheck },
    sent: { label: "Sent", className: "bg-sky-50 text-sky-700 border-sky-200", Icon: Check },
    accepted: { label: "Sent", className: "bg-sky-50 text-sky-700 border-sky-200", Icon: Check },
    failed: { label: "Failed", className: "bg-rose-50 text-rose-700 border-rose-200", Icon: AlertCircle },
};

export const prescriptionShareKey = (appointmentId: string) => ["prescription-share", appointmentId];

export default function PrescriptionShareHistory({ appointmentId, onResend }: {
    appointmentId: string;
    onResend: (number: string) => void;
}) {
    const { data } = useQuery({
        queryKey: prescriptionShareKey(appointmentId),
        queryFn: () => getPrescriptionShareInfo(appointmentId),
        enabled: !!appointmentId,
        staleTime: 30 * 1000,
    });
    const history = data?.history ?? [];

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
            <div className="mb-3 flex items-center justify-between gap-2">
                <h4 className="flex items-center gap-2 text-sm font-bold text-slate-900">
                    <MessageCircle className="h-4 w-4 text-emerald-600" /> Sent on WhatsApp
                </h4>
                <span className="text-xs text-slate-500">{history.length} time{history.length === 1 ? "" : "s"}</span>
            </div>

            {history.length === 0 ? (
                <p className="text-xs text-slate-500">The prescription has not been sent on WhatsApp yet. Use &quot;Send on WhatsApp&quot; above.</p>
            ) : (
                <ul className="divide-y divide-slate-100">
                    {history.map((log) => {
                        const st = STATUS[log.status] ?? { label: log.status, className: "bg-slate-50 text-slate-700 border-slate-200", Icon: Check };
                        return (
                            <li key={log.id} className="flex flex-wrap items-center gap-x-3 gap-y-1.5 py-2.5 text-xs">
                                <span className="font-semibold text-slate-900">{log.sent_at_label}</span>
                                <span className="text-slate-700">to {log.to_number}</span>
                                {log.sent_by && <span className="text-slate-500">by {log.sent_by}</span>}
                                <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-semibold ${st.className}`}>
                                    <st.Icon className="h-3 w-3" /> {st.label}
                                </span>
                                {log.error && <span className="w-full text-rose-700">{log.error}</span>}
                                <span className="ml-auto flex items-center gap-2">
                                    {log.pdf_url && (
                                        <a href={log.pdf_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold text-sky-700 hover:underline">
                                            <FileText className="h-3.5 w-3.5" /> PDF sent
                                        </a>
                                    )}
                                    <button type="button" onClick={() => onResend(log.to_number)}
                                        className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-emerald-300 bg-emerald-50 px-2 py-1 font-semibold text-emerald-800 hover:bg-emerald-100">
                                        <RotateCcw className="h-3.5 w-3.5" /> Resend
                                    </button>
                                </span>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}
