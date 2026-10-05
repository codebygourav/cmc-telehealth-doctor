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

    const complete = async () => {
        try {
            setSaving(true);
            await completeAppointment(appointmentId);
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
                    You left the call{patientName ? ` with ${patientName}` : ""}. Mark the appointment as completed only when the consultation is done.
                    Until then you (and your staff) can rejoin any time before the appointment ends.
                </DialogDescription>
                <ul className="space-y-1.5 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
                    <li>• <strong>Completed:</strong> the patient sees it as completed. You can still rejoin until the end time; the patient can rejoin only after you do.</li>
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
