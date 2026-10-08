"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Loader2, Pill, Plus, Search, X } from "lucide-react";
import { getFormularyMedicines, getMedicineCategories } from "@/api/medicines";
import CategoryCombobox from "./CategoryCombobox";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AddedMedicine } from "./prescription-dialog-types";

/** A formulary medicine from the search (trade name = name). */
type FormularyMedicine = {
    id: string;
    name: string;
    generic_name?: string | null;
    strength?: string | null;
    form?: string | null;
    company?: string | null;
    category?: string | null;
    type?: string | null;
    label?: string | null;
};

/** Ready-to-edit notes for a medicine, always naming its form: dose · when · food · duration. */
const notesTemplate = (form?: string | null, strength?: string | null) => {
    const name = (form || "tablet").trim();
    const unit = name.toLowerCase();
    // Strength right after the form, e.g. "cream 5%w/w", "tablet 500 mg" (skipped when empty or "—").
    const str = strength && !/^[—\-–\s]*$/.test(strength) ? ` ${strength.trim()}` : "";
    const dose = /syrup|suspension|solution|liquid/.test(unit) ? `5 ml ${unit}${str}`
        : /drop/.test(unit) ? `1 drop (${unit}${str})`
            : /cream|ointment|gel|lotion|shampoo|paste|powder|spray/.test(unit) ? `Apply ${unit}${str} (thin layer)`
                : /inj|vial|amp/.test(unit) ? `1 ${unit}${str}`
                    : /inhaler|rotacap/.test(unit) ? `2 puffs (${unit}${str})`
                        : `1 ${unit}${str}`;
    const when = /cream|ointment|gel|lotion|shampoo|paste|powder/.test(unit) ? "twice a day" : "morning & night (1-0-1)";
    return `${dose} · ${when} · after food · for 5 days`;
};

/** Quick text for the notes. 1-0-1 = doses at morning - afternoon - night. */
const QUICK_CHIPS = [
    { label: "Morning & night (1-0-1)", text: "morning & night (1-0-1)", hint: "1 dose in the morning, none in the afternoon, 1 at night" },
    { label: "3 times a day (1-1-1)", text: "3 times a day (1-1-1)", hint: "Morning, afternoon and night" },
    { label: "Morning only (1-0-0)", text: "morning only (1-0-0)", hint: "1 dose in the morning" },
    { label: "Night only (0-0-1)", text: "night only (0-0-1)", hint: "1 dose at night" },
    { label: "When needed (SOS)", text: "when needed (SOS)", hint: "Only when required" },
    { label: "Before food", text: "before food", hint: "" },
    { label: "After food", text: "after food", hint: "" },
    { label: "3 days", text: "for 3 days", hint: "" },
    { label: "5 days", text: "for 5 days", hint: "" },
    { label: "7 days", text: "for 7 days", hint: "" },
    { label: "1 month", text: "for 1 month", hint: "" },
];

/** Older structured medicines (dose / frequency / timings...) become notes text when edited. */
export const notesFromStructured = (med: AddedMedicine) => {
    if (med.template) return med.instructions || "";
    const timings = [
        med.timing_morning && "morning",
        med.timing_afternoon && "afternoon",
        med.timing_evening && "evening",
        med.timing_night && "night",
    ].filter(Boolean).join(", ");
    return [
        [med.dosage, med.frequency, timings, med.meal?.replace(/_/g, " ")].filter(Boolean).join(" · "),
        med.start_date ? `from ${med.start_date}${med.end_date ? ` to ${med.end_date}` : ""}` : "",
        med.instructions || "",
    ].filter(Boolean).join("\n");
};

interface FormularyMedicineEntryProps {
    /** The medicine being edited (null = adding a new one). */
    editing: AddedMedicine | null;
    onSave: (medicine: AddedMedicine) => void;
    onCancelEdit?: () => void;
}

/**
 * One search (trade or generic name) picks the medicine; its line is locked and a notes template
 * is filled in, which the doctor edits freely. No dosage / frequency / meal dropdowns.
 */
export default function FormularyMedicineEntry({ editing, onSave, onCancelEdit }: FormularyMedicineEntryProps) {
    const [query, setQuery] = useState("");
    // Search by trade name or generic name (the list shows and sorts by the chosen one).
    const [searchBy, setSearchBy] = useState<"trade" | "generic">("trade");
    const [categoryId, setCategoryId] = useState("");
    const [categories, setCategories] = useState<{ id: string; name: string; medicines: number }[]>([]);
    // Paged results: the next batch loads while scrolling the dropdown (never all 1,800+ at once).
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const PAGE_SIZE = 30;

    useEffect(() => {
        getMedicineCategories().then(setCategories).catch(() => setCategories([]));
    }, []);
    const [results, setResults] = useState<FormularyMedicine[]>([]);
    const [searching, setSearching] = useState(false);
    const [open, setOpen] = useState(false);
    const [active, setActive] = useState(0);
    const [picked, setPicked] = useState<{ id: string | null; line: string; form: string } | null>(null);
    const [notes, setNotes] = useState("");
    const [error, setError] = useState<string | null>(null);
    const notesRef = useRef<HTMLTextAreaElement>(null);
    const searchRef = useRef<HTMLInputElement>(null);

    // Editing a medicine already in the list: its line is locked, its notes are editable.
    useEffect(() => {
        if (!editing) return;
        setPicked({ id: editing.medicine_id || null, line: editing.medicine_name, form: editing.medication_type || "" });
        setNotes(notesFromStructured(editing));
        setQuery("");
        setError(null);
    }, [editing]);

    // Search the formulary by trade or generic name: short debounce, cached results, and an old
    // response never replaces a newer one.
    const cache = useRef(new Map<string, { list: FormularyMedicine[]; page: number; hasMore: boolean }>());
    const latest = useRef("");
    useEffect(() => {
        const term = query.trim().toLowerCase();
        // Empty box: browse A-Z (shown as soon as the field is clicked). Page 1 only here.
        const key = `${searchBy}|${categoryId}|${term}`;
        latest.current = key;
        if (term.length === 1) {
            return; // wait for a second letter
        }
        const cached = cache.current.get(key);
        if (cached) {
            setResults(cached.list);
            setPage(cached.page);
            setHasMore(cached.hasMore);
            setActive(0);
            setSearching(false);
            return;
        }
        setSearching(true);
        const timer = setTimeout(async () => {
            try {
                const response: any = await getFormularyMedicines({ search: term, by: searchBy, category_id: categoryId || undefined, limit: PAGE_SIZE, page: 1 });
                const list = (response.data || []) as FormularyMedicine[];
                const more = Boolean(response.meta?.has_more);
                cache.current.set(key, { list, page: 1, hasMore: more });
                if (latest.current === key) {
                    setResults(list);
                    setPage(1);
                    setHasMore(more);
                    setActive(0);
                }
            } catch {
                if (latest.current === key) {
                    setResults([]);
                    setHasMore(false);
                }
            } finally {
                if (latest.current === key) setSearching(false);
            }
        }, term ? 120 : 0);
        return () => clearTimeout(timer);
    }, [query, searchBy, categoryId]);

    // Scrolled near the bottom of the dropdown: load the next batch.
    const loadMore = async () => {
        if (!hasMore || loadingMore || searching) return;
        const key = latest.current;
        const term = query.trim().toLowerCase();
        setLoadingMore(true);
        try {
            const next = page + 1;
            const response: any = await getFormularyMedicines({ search: term, by: searchBy, category_id: categoryId || undefined, limit: PAGE_SIZE, page: next });
            if (latest.current !== key) return;
            const merged = [...results, ...((response.data || []) as FormularyMedicine[])];
            const more = Boolean(response.meta?.has_more);
            setResults(merged);
            setPage(next);
            setHasMore(more);
            cache.current.set(key, { list: merged, page: next, hasMore: more });
        } catch {
            // keep what is shown; scrolling again retries
        } finally {
            setLoadingMore(false);
        }
    };

    const choose = (medicine: FormularyMedicine) => {
        // Medicine line without the strength / pack size (e.g. "500ml,1000ml", "50 mg"): the doctor
        // writes the dose in "How to take".
        const line = [medicine.name, medicine.generic_name && `(${medicine.generic_name})`, medicine.form].filter(Boolean).join(" ");
        setPicked({ id: medicine.id, line, form: medicine.form || medicine.type || "" });
        setNotes(notesTemplate(medicine.form || medicine.type));
        setQuery("");
        setOpen(false);
        setError(null);
        setTimeout(() => notesRef.current?.focus(), 0);
    };

    // Not in the formulary: use the typed name as it is.
    const useTyped = () => {
        const line = query.trim();
        if (!line) return;
        setPicked({ id: null, line, form: "" });
        setNotes(notesTemplate(null));
        setQuery("");
        setOpen(false);
        setError(null);
        setTimeout(() => notesRef.current?.focus(), 0);
    };

    // A chip replaces the same kind of part (timing pattern, food or duration) instead of repeating it.
    const insertChip = (text: string) => {
        const groups = [/[^·\n]*\((\d-\d-\d|SOS)\)|\btwice a day\b/i, /\b(before|after) food\b/i, /\bfor \d+ (days?|months?)\b/i];
        const group = groups.find((pattern) => pattern.test(text));
        setNotes((current) => {
            const value = current.trim();
            if (group && group.test(value)) return value.replace(group, (match) => (match.match(/^\s*/)?.[0] ?? "") + text);
            return value ? `${value} · ${text}` : text;
        });
        notesRef.current?.focus();
    };

    const reset = () => {
        setPicked(null);
        setNotes("");
        setQuery("");
        setError(null);
        setTimeout(() => searchRef.current?.focus(), 0);
    };

    const save = () => {
        if (!picked) {
            setError("Search and pick a medicine first.");
            return;
        }
        if (!picked.line.trim()) {
            setError("Medicine name can't be empty.");
            return;
        }
        if (!notes.trim()) {
            setError("Please write how to take it.");
            return;
        }
        onSave({
            template: true,
            medicine_id: picked.id,
            medicine_name: picked.line.replace(/\s+/g, " ").trim(),
            medication_type: picked.form || "",
            dosage: "",
            frequency: "",
            timing_morning: false,
            timing_afternoon: false,
            timing_evening: false,
            timing_night: false,
            // Food timing is in the notes.
            meal: "" as AddedMedicine["meal"],
            instructions: notes.trim(),
            start_date: null,
            end_date: null,
        });
        reset();
    };

    const items = useMemo(() => results, [results]);

    const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setOpen(true);
            setActive((i) => Math.min(i + 1, query.trim() ? items.length : Math.max(items.length - 1, 0)));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((i) => Math.max(i - 1, 0));
        } else if (e.key === "Enter") {
            e.preventDefault();
            if (items[active]) choose(items[active]);
            else useTyped();
        } else if (e.key === "Escape") {
            setOpen(false);
        }
    };

    return (
        <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
            <header className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
                <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">{editing ? "Edit medicine" : "Add medicine"}</p>
                    <h3 className="text-base font-semibold text-slate-900">Search by trade or generic name</h3>
                </div>
                <Pill className="h-5 w-5 text-primary" />
            </header>

            <div className="space-y-4 p-5">
                {/* Medicine: search, or the locked line once picked */}
                {!picked ? (
                    <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                    <div className="flex w-full rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs font-semibold sm:inline-flex sm:w-auto" role="radiogroup" aria-label="Search by">
                        {([["trade", "Trade name"], ["generic", "Generic name"]] as const).map(([key, label]) => (
                            <button key={key} type="button" role="radio" aria-checked={searchBy === key}
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => { setSearchBy(key); setOpen(true); searchRef.current?.focus(); }}
                                className={cn("flex-1 rounded-md px-3 py-1.5 transition-colors sm:flex-none", searchBy === key ? "bg-primary text-white shadow-sm" : "text-slate-600 hover:text-primary")}>
                                {label}
                            </button>
                        ))}
                    </div>
                    <CategoryCombobox options={categories} value={categoryId}
                        onOpen={() => { if (!categories.length) getMedicineCategories().then(setCategories).catch(() => {}); }}
                        onChange={(id) => { setCategoryId(id); setOpen(true); setTimeout(() => searchRef.current?.focus(), 0); }}
                        className="w-full sm:w-auto sm:flex-1 sm:max-w-xs" />
                    </div>
                    <div className="relative">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            ref={searchRef}
                            value={query}
                            onChange={(e) => { setQuery(e.target.value); setOpen(true); setError(null); }}
                            onFocus={() => setOpen(true)}
                            onBlur={() => setTimeout(() => setOpen(false), 150)}
                            onKeyDown={onKeyDown}
                            placeholder={searchBy === "generic" ? "Generic name, e.g. Amoxicillin (or click to browse)" : "Trade name, e.g. Augmentin (or click to browse)"}
                            aria-label="Search medicine"
                            className="h-12 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-10 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
                        />
                        {searching && <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-400" />}

                        {open && query.trim().length !== 1 && (
                            <ul role="listbox" className="absolute z-30 mt-1.5 max-h-80 w-full overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-xl"
                                onScroll={(e) => {
                                    const el = e.currentTarget;
                                    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 80) loadMore();
                                }}>
                                {items.map((medicine, index) => (
                                    <li key={medicine.id} role="option" aria-selected={index === active}
                                        onMouseDown={(e) => { e.preventDefault(); choose(medicine); }}
                                        onMouseEnter={() => setActive(index)}
                                        className={cn("cursor-pointer px-4 py-2.5", index === active ? "bg-primary/10" : "hover:bg-slate-50")}>
                                        <div className="flex items-baseline justify-between gap-3">
                                            <span className="truncate text-sm font-semibold text-slate-900">
                                                {searchBy === "generic" ? (medicine.generic_name || medicine.name) : medicine.name}
                                            </span>
                                            {medicine.category && <span className="shrink-0 truncate text-[10px] font-medium uppercase tracking-wide text-slate-400">{medicine.category}</span>}
                                        </div>
                                        {searchBy === "generic"
                                            ? <p className="truncate text-xs text-primary">{medicine.name}</p>
                                            : medicine.generic_name && <p className="truncate text-xs text-primary">{medicine.generic_name}</p>}
                                        <p className="truncate text-[11px] text-slate-500">
                                            {[medicine.strength, medicine.form, medicine.company].filter(Boolean).join(" · ")}
                                        </p>
                                    </li>
                                ))}
                                {(loadingMore || (hasMore && items.length > 0)) && (
                                    <li className="flex items-center justify-center gap-2 px-4 py-2 text-xs text-slate-500">
                                        {loadingMore ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading more…</> : "Scroll for more"}
                                    </li>
                                )}
                                {!searching && items.length === 0 && (
                                    <li className="px-4 py-2 text-xs text-slate-500">{query.trim() ? "No match in the formulary." : "No medicines in the formulary yet."}</li>
                                )}
                                {query.trim() && <li role="option" aria-selected={active === items.length}
                                    onMouseDown={(e) => { e.preventDefault(); useTyped(); }}
                                    className={cn("flex cursor-pointer items-center gap-2 border-t border-slate-100 px-4 py-2.5 text-sm text-slate-700", active === items.length ? "bg-primary/10" : "hover:bg-slate-50")}>
                                    <Plus className="h-4 w-4 text-primary" /> Use &ldquo;{query.trim()}&rdquo; as typed
                                </li>}
                            </ul>
                        )}
                    </div>
                    </div>
                ) : (
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50/70 px-4 py-3">
                        <div className="mb-1.5 flex items-center justify-between gap-2">
                            <label htmlFor="formulary-line" className="text-sm font-semibold text-slate-900">Medicine (as printed)</label>
                            {!editing && (
                                <button type="button" onClick={reset} className="shrink-0 rounded-lg p-1 text-slate-500 hover:bg-white hover:text-slate-900" aria-label="Change medicine">
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                        {/* Editable: the doctor can trim the formulary text (e.g. remove a pack size). What is typed
                            here is saved and shown everywhere (list, PDF, doctor and patient apps). */}
                        <textarea
                            id="formulary-line"
                            rows={2}
                            value={picked.line}
                            onChange={(e) => setPicked({ ...picked, line: e.target.value })}
                            className="w-full resize-y rounded-md border border-emerald-200 bg-white px-3 py-2 text-base font-semibold leading-snug text-slate-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 sm:text-sm"
                        />
                        <p className="mt-1 text-[11px] text-slate-500">{picked.id ? "From the formulary" : "Typed medicine"} · you can edit this text</p>
                    </div>
                )}

                {/* Notes template: editable */}
                <div className={cn(!picked && "pointer-events-none opacity-50")}>
                    <label htmlFor="formulary-notes" className="mb-1.5 block text-sm font-semibold text-slate-900">How to take</label>
                    <textarea
                        id="formulary-notes"
                        ref={notesRef}
                        rows={3}
                        value={notes}
                        onChange={(e) => { setNotes(e.target.value); setError(null); }}
                        placeholder="Dose · when · before/after food · how many days"
                        className="w-full resize-y rounded-lg border border-slate-300 bg-white px-3.5 py-3 text-sm leading-relaxed outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
                    />
                    <div className="mt-2 flex flex-wrap gap-1.5">
                        {QUICK_CHIPS.map((chip) => (
                            <button key={chip.label} type="button" onClick={() => insertChip(chip.text)} title={chip.hint || undefined}
                                className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-700 transition hover:border-primary hover:bg-primary/5 hover:text-primary">
                                {chip.label}
                            </button>
                        ))}
                    </div>
                </div>

                {error && <p className="text-xs font-medium text-destructive">{error}</p>}

                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    {editing && onCancelEdit && (
                        <Button type="button" variant="outline" onClick={() => { reset(); onCancelEdit(); }}>Cancel</Button>
                    )}
                    <Button type="button" onClick={save} disabled={!picked} className="sm:min-w-48">
                        <Check className="mr-1.5 h-4 w-4" /> {editing ? "Update medicine" : "Add to prescription"}
                    </Button>
                </div>
            </div>
        </section>
    );
}
