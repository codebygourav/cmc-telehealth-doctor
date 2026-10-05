"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Loader2, PhoneCall } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { completeAppointment, getApiErrorMessage } from "@/api/appointment-actions";

interface CompleteConsultationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    appointmentId: string;
    patientName?: string;
    /** Shown as "Rejoin call" when the call can still be joined. */
    onRejoin?: () => void;
    onCompleted?: () => void;
}

/** "Complete this appointment?" after the call: completing is a doctor's choice, never automatic. */
export default function CompleteConsultationDialog({ open, onOpenChange, appointmentId, patientName, onRejoin, onCompleted }: CompleteConsultationDialogProps) {
    const queryClient = useQueryClient();
    const [saving, setSaving] = useState(false);
    const [voucher, setVoucher] = useState("");

    const complete = async () => {
        try {
            setSaving(true);
            await completeAppointment(appointmentId, voucher.trim() || undefined);
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ["appointment"] }),
                queryClient.invalidateQueries({ queryKey: ["my-appointments"] }),
                queryClient.invalidateQueries({ queryKey: ["doctor-home"] }),
            ]);
            toast.success("Appointment marked as completed. You can still rejoin until the end time.");
            onOpenChange(false);
            onCompleted?.();
        } catch (err) {
            toast.error(getApiErrorMessage(err, "Could not complete the appointment."));
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(value) => !saving && onOpenChange(value)}>
            <DialogContent className="sm:max-w-md">
                <DialogTitle className="text-lg font-semibold">Complete this appointment?</DialogTitle>
                <DialogDescription className="text-sm text-slate-600">
                    Mark the consultation{patientName ? ` with ${patientName}` : ""} as completed when it is done.
                    The patient is marked <strong>present</strong> automatically. You can still rejoin the call today.
                </DialogDescription>
                <div>
                    <label htmlFor="complete-voucher" className="mb-1 block text-sm font-medium text-slate-800">Voucher number <span className="font-normal text-slate-500">(optional)</span></label>
                    <input id="complete-voucher" value={voucher} onChange={(e) => setVoucher(e.target.value)} maxLength={100}
                        placeholder="e.g. V-12345"
                        className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" />
                </div>
                <ul className="space-y-1.5 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
                    <li>• <strong>Completed:</strong> the patient sees it as completed and is marked present. You and the patient can still rejoin the call today.</li>
                    <li>• <strong>Not yet:</strong> the appointment stays open and both of you can rejoin.</li>
                </ul>
                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    {onRejoin ? (
                        <Button variant="outline" onClick={() => { onOpenChange(false); onRejoin(); }} disabled={saving}>
                            <PhoneCall className="mr-1.5 h-4 w-4" /> Rejoin call
                        </Button>
                    ) : (
                        <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Not yet</Button>
                    )}
                    <Button onClick={complete} disabled={saving}>
                        {saving ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-1.5 h-4 w-4" />}
                        Mark as completed
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
