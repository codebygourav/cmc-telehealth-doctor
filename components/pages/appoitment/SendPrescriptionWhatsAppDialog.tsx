"use client";

/**
 * Doctor portal → "Send on WhatsApp": pick the patient's number (or type another), preview the
 * prescription PDF (medicines, notes, medical record, instructions, next visit), then send it with
 * the approved prescription_document template.
 */
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowLeft, ArrowRight, CheckCircle2, FileText, Loader2, MessageCircle, Phone, Send } from "lucide-react";
import { getPrescriptionShareInfo, getPrescriptionSharePdf, sendPrescriptionWhatsApp, type PrescriptionShareInfo } from "@/api/prescription-share";

const OTHER = "__other__";

export default function SendPrescriptionWhatsAppDialog({ appointmentId, open, onOpenChange, initialNumber, onSent }: {
    appointmentId: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** Resend: preselect this number (typed in "Another number" when it is not on record). */
    initialNumber?: string;
    onSent?: () => void;
}) {
    const [info, setInfo] = useState<PrescriptionShareInfo | null>(null);
    const [loading, setLoading] = useState(false);
    const [choice, setChoice] = useState<string>("");
    const [otherNumber, setOtherNumber] = useState("");
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [pdfLoading, setPdfLoading] = useState(false);
    const [reviewed, setReviewed] = useState(false);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [sentTo, setSentTo] = useState<string | null>(null);
    // 1 = choose the number, 2 = review the PDF and send
    const [step, setStep] = useState<1 | 2>(1);

    // Load numbers + the PDF preview each time the window opens.
    useEffect(() => {
        if (!open || !appointmentId) return;
        setInfo(null); setError(null); setSentTo(null); setReviewed(false); setOtherNumber(""); setStep(1);
        setLoading(true);
        getPrescriptionShareInfo(appointmentId)
            .then((data) => {
                setInfo(data);
                if (initialNumber) {
                    const onRecord = data?.numbers?.some((n) => n.number === initialNumber);
                    setChoice(onRecord ? initialNumber : OTHER);
                    if (!onRecord) setOtherNumber(initialNumber);
                } else {
                    setChoice(data?.numbers?.[0]?.number ?? OTHER); // no number on record: type one
                }
            })
            .catch((e) => setError(e?.response?.data?.message || "Could not load the patient's details."))
            .finally(() => setLoading(false));

        let url: string | null = null;
        setPdfLoading(true);
        getPrescriptionSharePdf(appointmentId)
            .then((blob) => { url = URL.createObjectURL(blob); setPdfUrl(url); })
            .catch(() => setPdfUrl(null))
            .finally(() => setPdfLoading(false));

        return () => { if (url) URL.revokeObjectURL(url); setPdfUrl(null); };
    }, [open, appointmentId, initialNumber]);

    const phone = choice === OTHER ? otherNumber.trim() : choice;
    const phoneValid = /^\+?[\d\s\-()]{10,20}$/.test(phone);
    const noNumber = !!info && info.numbers.length === 0;

    const send = async () => {
        if (!phoneValid || sending) return;
        setSending(true); setError(null);
        try {
            await sendPrescriptionWhatsApp(appointmentId, phone);
            setSentTo(phone);
            onSent?.();
        } catch (e: any) {
            const res = e?.response?.data;
            setError(res?.errors?.phone?.[0] || res?.message || "Could not send the prescription on WhatsApp.");
        } finally {
            setSending(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className={`flex w-[95vw] flex-col gap-0 overflow-hidden rounded-2xl p-0 sm:max-w-5xl! ${step === 2 && !sentTo ? "h-[92vh]" : "max-h-[92vh]"}`}>
                <DialogHeader className="shrink-0 border-b border-slate-200 px-5 py-4">
                    <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
                        <MessageCircle className="h-5 w-5 text-emerald-600" /> Send prescription on WhatsApp
                    </DialogTitle>
                    <DialogDescription>
                        {info?.patient_name ? `To ${info.patient_name}. ` : ""}Choose the number, check the PDF, then send.
                    </DialogDescription>
                </DialogHeader>

                {/* Steps */}
                {!sentTo && (
                    <div className="flex shrink-0 items-center gap-3 border-b border-slate-200 bg-slate-50 px-5 py-2.5 text-xs font-semibold">
                        {([[1, "WhatsApp number"], [2, "Review & send"]] as const).map(([n, label], i) => (
                            <div key={n} className="flex items-center gap-3">
                                {i > 0 && <span className="h-px w-8 bg-slate-300" />}
                                <span className={`flex items-center gap-2 ${step === n ? "text-primary" : step > n ? "text-emerald-700" : "text-slate-400"}`}>
                                    <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] ${step === n ? "bg-primary text-white" : step > n ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-500"}`}>
                                        {step > n ? <CheckCircle2 className="h-3.5 w-3.5" /> : n}
                                    </span>
                                    {label}
                                </span>
                            </div>
                        ))}
                    </div>
                )}

                {sentTo ? (
                    <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
                        <CheckCircle2 className="h-12 w-12 text-emerald-600" />
                        <p className="text-lg font-semibold text-slate-900">Prescription sent</p>
                        <p className="text-sm text-slate-600">The PDF was sent on WhatsApp to <span className="font-semibold">{sentTo}</span>.</p>
                        <Button className="mt-2" onClick={() => onOpenChange(false)}>Done</Button>
                    </div>
                ) : step === 1 ? (
                    /* Step 1: number */
                    <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
                        <div className="mx-auto max-w-xl space-y-4">
                            {loading ? (
                                <p className="flex items-center gap-2 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</p>
                            ) : (
                                <>
                                    {info && !info.can_send && (
                                        <div className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                                            <AlertCircle className="h-4 w-4 shrink-0" /> WhatsApp sending is switched off by the admin. You can still review the PDF.
                                        </div>
                                    )}
                                    {info && !info.has_content && (
                                        <div className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                                            <AlertCircle className="h-4 w-4 shrink-0" /> Nothing has been added for this visit yet (medicines, notes or medical record).
                                        </div>
                                    )}
                                    {noNumber && (
                                        <div className="flex gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-900">
                                            <Phone className="h-4 w-4 shrink-0" /> This patient has no mobile number on record. Enter the WhatsApp number to send the prescription to.
                                        </div>
                                    )}

                                    <p className="text-xs font-bold uppercase tracking-wider text-primary">Send to which WhatsApp number?</p>
                                    <div className="space-y-2">
                                        {info?.numbers.map((n) => (
                                            <label key={n.number} className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-sm ${choice === n.number ? "border-primary bg-primary/5" : "border-slate-200 hover:border-slate-300"}`}>
                                                <input type="radio" name="wa-number" checked={choice === n.number} onChange={() => setChoice(n.number)} className="accent-primary" />
                                                <span className="min-w-0">
                                                    <span className="block font-semibold text-slate-900">{n.number}</span>
                                                    <span className="block text-xs text-slate-500">{n.label}</span>
                                                </span>
                                            </label>
                                        ))}
                                        <label className={`flex cursor-pointer items-start gap-3 rounded-lg border px-4 py-3 text-sm ${choice === OTHER ? "border-primary bg-primary/5" : "border-slate-200 hover:border-slate-300"}`}>
                                            <input type="radio" name="wa-number" checked={choice === OTHER} onChange={() => setChoice(OTHER)} className="mt-1 accent-primary" />
                                            <span className="w-full">
                                                <span className="block font-semibold text-slate-900">{noNumber ? "WhatsApp number" : "Another number"}</span>
                                                <input
                                                    type="tel"
                                                    inputMode="tel"
                                                    placeholder="+91 98765 43210"
                                                    value={otherNumber}
                                                    onFocus={() => setChoice(OTHER)}
                                                    onChange={(e) => { setChoice(OTHER); setOtherNumber(e.target.value); }}
                                                    className="mt-1.5 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                                                />
                                                <span className="mt-1 block text-[11px] text-slate-500">With country code. Numbers without one are sent to India (+91).</span>
                                            </span>
                                        </label>
                                    </div>
                                    {!phoneValid && phone !== "" && <p className="text-[11px] text-rose-700">Enter a valid number (10–15 digits).</p>}
                                </>
                            )}
                        </div>
                    </div>
                ) : (
                    /* Step 2: full-size preview + send */
                    <div className="flex min-h-0 flex-1 flex-col">
                        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-5 py-2.5 text-sm">
                            <span className="text-slate-600">Sending to <span className="font-semibold text-slate-900">{phone}</span></span>
                            <button type="button" onClick={() => setStep(1)} className="text-xs font-semibold text-primary hover:underline">Change number</button>
                        </div>
                        {/* Plain preview: no viewer toolbar or page sidebar, fitted to the width. Takes the free space. */}
                        <div className="relative min-h-0 flex-1 bg-slate-100">
                            {pdfLoading ? (
                                <div className="flex h-full items-center justify-center gap-2 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Generating PDF…</div>
                            ) : pdfUrl ? (
                                <iframe
                                    src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=1&view=FitH`}
                                    title="Prescription preview"
                                    className="absolute inset-0 h-full w-full border-0 bg-white"
                                />
                            ) : (
                                <div className="flex h-full items-center justify-center gap-2 text-sm text-slate-500"><FileText className="h-4 w-4" /> The preview could not be loaded.</div>
                            )}
                        </div>
                        <div className="shrink-0 space-y-3 border-t border-slate-200 bg-white px-5 py-3">
                            <label className="flex cursor-pointer items-start gap-2 text-sm font-medium text-slate-800">
                                <input type="checkbox" checked={reviewed} onChange={(e) => setReviewed(e.target.checked)} className="mt-0.5 accent-primary" />
                                I have checked the prescription PDF and the details are correct.
                            </label>
                            {error && <p className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">{error}</p>}
                        </div>
                    </div>
                )}

                {/* Footer: Back / Next / Send */}
                {!sentTo && (
                    <div className="flex shrink-0 items-center justify-between gap-2 border-t border-slate-200 px-5 py-3">
                        {step === 1 ? (
                            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                        ) : (
                            <Button variant="outline" onClick={() => setStep(1)}><ArrowLeft className="mr-1.5 h-4 w-4" /> Back</Button>
                        )}
                        {step === 1 ? (
                            <Button onClick={() => setStep(2)} disabled={loading || !phoneValid} className="font-semibold">
                                Next: review PDF <ArrowRight className="ml-1.5 h-4 w-4" />
                            </Button>
                        ) : (
                            <Button onClick={send} disabled={!phoneValid || !reviewed || sending || (info ? !info.can_send : true)} className="font-semibold">
                                {sending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending…</> : <><Send className="mr-2 h-4 w-4" /> Send on WhatsApp</>}
                            </Button>
                        )}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
