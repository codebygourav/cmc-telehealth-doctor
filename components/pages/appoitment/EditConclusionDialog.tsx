"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { updateConclusion } from "@/api/conclusion";

export interface ConclusionValues {
    diagnosis?: string | null;
    orderInvestigation?: string | null;
    notes?: string | null;
    confidentialNotes?: string | null;
    instructionsByDoctor?: string | null;
    nextVisitDate?: string | null;
}

interface EditConclusionDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    appointmentId: string;
    initial: ConclusionValues;
}

const FIELDS: { key: keyof Omit<ConclusionValues, "nextVisitDate">; label: string; placeholder: string; rows: number }[] = [
    { key: "diagnosis", label: "Diagnosis", placeholder: "Final diagnosis", rows: 2 },
    { key: "orderInvestigation", label: "Order / Investigation", placeholder: "Tests or investigations to do", rows: 2 },
    { key: "notes", label: "Notes", placeholder: "Notes for the patient", rows: 3 },
    { key: "instructionsByDoctor", label: "Instructions by doctor", placeholder: "One instruction per line", rows: 3 },
    { key: "confidentialNotes", label: "Confidential notes", placeholder: "Only for doctors", rows: 2 },
];

/** Edit only the consultation conclusion (diagnosis, notes, instructions, next visit). No medicines. */
export default function EditConclusionDialog({ open, onOpenChange, appointmentId, initial }: EditConclusionDialogProps) {
    const queryClient = useQueryClient();
    const [values, setValues] = useState<ConclusionValues>(initial);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (open) setValues(initial);
    }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

    const set = (key: keyof ConclusionValues, value: string) => setValues((current) => ({ ...current, [key]: value }));

    const save = async () => {
        try {
            setSaving(true);
            await updateConclusion(appointmentId, {
                diagnosis: values.diagnosis?.trim() || "",
                order_investigation: values.orderInvestigation?.trim() || "",
                notes: values.notes?.trim() || "",
                confidential_notes: values.confidentialNotes?.trim() || "",
                instructions_by_doctor: values.instructionsByDoctor?.trim() || "",
                next_visit_date: values.nextVisitDate || "",
            });
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ["prescription", appointmentId] }),
                queryClient.invalidateQueries({ queryKey: ["conclusion", appointmentId] }),
            ]);
            toast.success("Conclusion saved");
            onOpenChange(false);
        } catch (error: any) {
            toast.error(error?.response?.data?.errors?.message || error?.response?.data?.message || "Could not save the conclusion.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="flex max-h-[90vh] w-[95vw] flex-col gap-0 overflow-hidden rounded-lg p-0 sm:max-w-2xl">
                <DialogHeader className="shrink-0 border-b border-slate-200 px-5 py-4">
                    <DialogTitle className="text-lg font-semibold">Edit conclusion</DialogTitle>
                    <p className="text-xs text-slate-500">Consultation notes and next visit. Medicines are edited from “Prescribed Medicines”.</p>
                </DialogHeader>

                <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
                    {FIELDS.map((field) => (
                        <div key={field.key}>
                            <label htmlFor={`conclusion-${field.key}`} className="mb-1.5 block text-sm font-semibold text-slate-900">{field.label}</label>
                            <textarea
                                id={`conclusion-${field.key}`}
                                rows={field.rows}
                                value={values[field.key] || ""}
                                onChange={(e) => set(field.key, e.target.value)}
                                placeholder={field.placeholder}
                                className="w-full resize-y rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
                            />
                        </div>
                    ))}
                    <div>
                        <label htmlFor="conclusion-next-visit" className="mb-1.5 block text-sm font-semibold text-slate-900">Next visit</label>
                        <input
                            id="conclusion-next-visit"
                            type="date"
                            value={values.nextVisitDate ? String(values.nextVisitDate).slice(0, 10) : ""}
                            onChange={(e) => set("nextVisitDate", e.target.value)}
                            className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 sm:w-60"
                        />
                    </div>
                </div>

                <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-slate-200 px-5 py-3 sm:flex-row sm:justify-end">
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
                    <Button type="button" onClick={save} disabled={saving} className="sm:min-w-40">
                        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Save conclusion
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
