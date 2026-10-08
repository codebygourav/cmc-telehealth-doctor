"use client";

import { ClipboardList, Pencil, X } from "lucide-react";
import type { AddedMedicine } from "./prescription-dialog-types";

interface AddedMedicinesListProps {
    medicines: AddedMedicine[];
    editingIndex: number | null;
    onEdit: (index: number) => void;
    onDelete: (index: number) => void;
}

/** Removes the medicine strength / pack size (e.g. "500ml,1000ml", "50 mg") from a text: this list
 *  shows only the medicine and how to take it. */
export const withoutStrength = (text: string | undefined, strength?: string) => {
    if (!text) return "";
    // The formulary label collapses spaces, so compare with single spaces.
    let out = text.replace(/[ \t]+/g, " ");
    const s = strength?.replace(/\s+/g, " ").trim();
    if (s && !/^[—\-–\s]*$/.test(s)) out = out.split(s).join(" ");
    return out.replace(/[ \t]{2,}/g, " ").replace(/ +·/g, " ·").replace(/ +([),])/g, "$1").trim();
};

/** Name for a list that shows the type as a badge: no strength and no type word at the end. */
export const listName = (name: string | undefined, strength?: string, type?: string) => {
    const base = withoutStrength(name, strength);
    const t = type?.trim();
    if (!t) return base;
    const short = base.replace(new RegExp(`\\s+${t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`, "i"), "").trim();
    return short || base;
};

/** The medicines in this prescription, under the add-medicine form. */
export default function AddedMedicinesList({ medicines, editingIndex, onEdit, onDelete }: AddedMedicinesListProps) {
    return (
        <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
            <header className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
                <h3 className="text-sm font-semibold text-slate-900">Medicines to be submitted</h3>
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                    {medicines.length} {medicines.length === 1 ? "medicine" : "medicines"}
                </span>
            </header>

            {medicines.length === 0 ? (
                <div className="flex flex-col items-center px-4 py-8 text-center">
                    <ClipboardList className="mb-2 h-8 w-8 text-slate-300" />
                    <p className="text-sm font-medium text-slate-700">No medicines added yet</p>
                    <p className="mt-0.5 text-xs text-slate-500">Search above and press “Add to prescription”.</p>
                </div>
            ) : (
                <ol className="divide-y divide-slate-100">
                    {medicines.map((med, index) => {
                        // Notes are shown exactly as written; only the name hides the strength.
                        const details = med.template
                            ? med.instructions
                            : [med.dosage, med.frequency, med.instructions].filter(Boolean).join(" · ");
                        const name = listName(med.medicine_name, med.strength, med.medication_type);
                        return (
                            <li key={`${med.medicine_name}-${index}`}
                                className={`flex items-start gap-3 px-4 py-3 ${editingIndex === index ? "bg-primary/5" : ""}`}>
                                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">{index + 1}</span>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-semibold leading-snug text-slate-900">
                                        {name}
                                        {med.medication_type && (
                                            <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 align-middle text-[10px] font-semibold uppercase tracking-wide text-slate-500">{med.medication_type}</span>
                                        )}
                                    </p>
                                    {details && <p className="mt-0.5 whitespace-pre-line text-xs leading-relaxed text-slate-600">{details}</p>}
                                </div>
                                <div className="flex shrink-0 gap-1">
                                    <button type="button" onClick={() => onEdit(index)} title="Edit" aria-label={`Edit ${med.medicine_name}`}
                                        className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-primary">
                                        <Pencil className="h-4 w-4" />
                                    </button>
                                    <button type="button" onClick={() => onDelete(index)} title="Remove" aria-label={`Remove ${med.medicine_name}`}
                                        className="rounded-md p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600">
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            </li>
                        );
                    })}
                </ol>
            )}
        </section>
    );
}
