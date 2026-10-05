"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type CategoryOption = { id: string; name: string; medicines: number };

interface CategoryComboboxProps {
    options: CategoryOption[];
    value: string;
    onChange: (id: string) => void;
    className?: string;
    onOpen?: () => void;
}

/** Searchable category picker (type to filter). Empty = all categories. */
export default function CategoryCombobox({ options, value, onChange, className, onOpen }: CategoryComboboxProps) {
    const [open, setOpen] = useState(false);
    const [text, setText] = useState("");
    const [active, setActive] = useState(0);
    const boxRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const selected = options.find((o) => o.id === value);

    const filtered = useMemo(() => {
        const q = text.trim().toLowerCase();
        return q ? options.filter((o) => o.name.toLowerCase().includes(q)) : options;
    }, [options, text]);

    // Close on a click outside.
    useEffect(() => {
        if (!open) return;
        const close = (e: PointerEvent) => {
            if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("pointerdown", close);
        return () => document.removeEventListener("pointerdown", close);
    }, [open]);

    const pick = (id: string) => {
        onChange(id);
        setText("");
        setOpen(false);
    };

    const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setOpen(true);
            setActive((i) => Math.min(i + 1, Math.max(filtered.length - 1, 0)));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((i) => Math.max(i - 1, 0));
        } else if (e.key === "Enter") {
            e.preventDefault();
            if (filtered[active]) pick(filtered[active].id);
        } else if (e.key === "Escape") {
            setOpen(false);
        }
    };

    return (
        <div ref={boxRef} className={cn("relative min-w-0", className)}>
            <div className={cn("flex h-10 sm:h-9 items-center rounded-lg border bg-white pl-2.5 pr-1 text-xs transition", open ? "border-primary ring-2 ring-primary/15" : "border-slate-200")}>
                <input
                    ref={inputRef}
                    value={open ? text : selected ? `${selected.name} (${selected.medicines})` : ""}
                    onChange={(e) => { setText(e.target.value); setOpen(true); setActive(0); }}
                    onFocus={() => { setOpen(true); setText(""); onOpen?.(); }}
                    onKeyDown={onKeyDown}
                    placeholder={open && selected ? selected.name : "All categories"}
                    aria-label="Filter by category"
                    role="combobox"
                    aria-expanded={open}
                    className="h-full min-w-0 flex-1 bg-transparent text-base text-slate-800 outline-none sm:text-xs placeholder:text-slate-500"
                />
                {value ? (
                    <button type="button" aria-label="Clear category" onMouseDown={(e) => e.preventDefault()}
                        onClick={() => { pick(""); inputRef.current?.blur(); }}
                        className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                        <X className="h-3.5 w-3.5" />
                    </button>
                ) : (
                    <ChevronDown className="mx-1 h-3.5 w-3.5 shrink-0 text-slate-400" />
                )}
            </div>

            {open && (
                <ul role="listbox" className="absolute z-40 mt-1 max-h-72 w-full overflow-auto sm:min-w-[16rem] rounded-lg border border-slate-200 bg-white py-1 shadow-xl">
                    {filtered.map((o, i) => (
                        <li key={o.id} role="option" aria-selected={o.id === value}
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => { pick(o.id); inputRef.current?.blur(); }}
                            onMouseEnter={() => setActive(i)}
                            className={cn("flex cursor-pointer items-center justify-between gap-2 px-3 py-2.5 text-sm sm:py-2 sm:text-xs", i === active ? "bg-primary/10" : "hover:bg-slate-50")}>
                            <span className="flex min-w-0 items-center gap-1.5">
                                {o.id === value ? <Check className="h-3.5 w-3.5 shrink-0 text-primary" /> : <span className="w-3.5 shrink-0" />}
                                <span className="truncate text-slate-800">{o.name}</span>
                            </span>
                            <span className="shrink-0 rounded-full bg-slate-100 px-1.5 text-[10px] font-semibold text-slate-500">{o.medicines}</span>
                        </li>
                    ))}
                    {options.length === 0 && <li className="px-3 py-2 text-xs text-slate-500">Loading categories…</li>}
                    {options.length > 0 && filtered.length === 0 && <li className="px-3 py-2 text-xs text-slate-500">No category matches “{text}”.</li>}
                </ul>
            )}
        </div>
    );
}
