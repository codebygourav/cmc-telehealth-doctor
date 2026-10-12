"use client";

/**
 * Doctor profile editor: the same steps and fields as Admin → Doctors → Edit.
 * List sections (education, awards, …) offer the same two entry methods as admin:
 * a structured list or a free-text (HTML) editor, saved in the same format.
 */

import { Button } from "@/components/ui";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/userContext";
import { useUpdateDoctorProfile } from "@/queries/useProfile";
import { Bold, Code, ImagePlus, Italic, Link2, List, ListOrdered, Plus, Trash2, Underline } from "lucide-react";
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

export type ProfileStepKey =
    | "basic"
    | "availability"
    | "bio"
    | "education"
    | "awards"
    | "certificates"
    | "experience"
    | "fellowships"
    | "additional"
    | "contact"
    | "international";

const LANGUAGES = [
    "English", "Hindi", "Bengali", "Marathi", "Gujarati", "Tamil", "Telugu",
    "Kannada", "Punjabi", "Urdu", "Odia", "Malayalam", "Kashmiri", "Other",
];

const labelClass = "block text-sm font-medium text-slate-700 mb-1.5";
const controlClass =
    "w-full rounded-md border border-input bg-transparent px-3 py-2.5 text-sm outline-none focus:border-primary disabled:bg-slate-100 disabled:text-slate-500";

function errorMessage(error: unknown, fallback: string) {
    const data = (error as any)?.response?.data;
    // Field errors come as { field: [messages] }; other errors as { message: "..." }.
    const first = data?.errors ? Object.values(data.errors)[0] : undefined;
    const firstFieldError = Array.isArray(first) ? first[0] : typeof first === "string" ? first : undefined;
    return firstFieldError || data?.message || fallback;
}

function readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

/* ------------------------------------------------------------------ */
/* Small building blocks                                               */
/* ------------------------------------------------------------------ */

function Field({ label, hint, children, full }: { label: string; hint?: string; children: ReactNode; full?: boolean }) {
    return (
        <div className={full ? "md:col-span-2" : undefined}>
            <label className={labelClass}>{label}</label>
            {children}
            {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
        </div>
    );
}

function StepShell({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
    const { saveAll, saving } = useContext(SaveContext)!;

    return (
        <div className="space-y-5">
            <div>
                <h2 className="text-[#1F1E1E] font-semibold text-lg">{title}</h2>
                {description && <p className="text-[#4D4D4D] text-sm">{description}</p>}
            </div>
            {children}
            <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-100 pt-4">
                <p className="text-xs text-slate-500">Saves what you changed on every step, not only this one.</p>
                <Button type="button" onClick={saveAll} disabled={saving} className="bg-primary hover:bg-primary/90">
                    {saving ? "Saving..." : "Save all changes"}
                </Button>
            </div>
        </div>
    );
}

const EDITOR_TOOLS = [
    { icon: Bold, title: "Bold", command: "bold" },
    { icon: Italic, title: "Italic", command: "italic" },
    { icon: Underline, title: "Underline", command: "underline" },
    { icon: List, title: "Bullet list", command: "insertUnorderedList" },
    { icon: ListOrdered, title: "Numbered list", command: "insertOrderedList" },
    { icon: Link2, title: "Link", command: "createLink" },
];

/** Free-text editor that produces HTML (bold, lists, links) and can also edit the HTML directly. */
export function RichTextEditor({ value, onChange, placeholder }: { value: string; onChange: (html: string) => void; placeholder?: string }) {
    const ref = useRef<HTMLDivElement>(null);
    const [showHtml, setShowHtml] = useState(false);

    // Write the value into the editor only when it changed from outside (not while typing).
    useEffect(() => {
        if (ref.current && ref.current.innerHTML !== value) {
            ref.current.innerHTML = value || "";
        }
    }, [value, showHtml]);

    const run = (command: string, argument?: string) => {
        ref.current?.focus();
        document.execCommand(command, false, argument);
        onChange(ref.current?.innerHTML ?? "");
    };

    const addLink = () => {
        const url = window.prompt("Link address (https://…)");
        if (url && /^https?:\/\//i.test(url.trim())) run("createLink", url.trim());
    };

    return (
        <div className="rounded-md border border-input overflow-hidden">
            <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 bg-slate-50 px-2 py-1.5">
                {!showHtml &&
                    EDITOR_TOOLS.map(({ icon: Icon, title, command }) => (
                        <button
                            key={title}
                            type="button"
                            title={title}
                            aria-label={title}
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => (command === "createLink" ? addLink() : run(command))}
                            className="h-8 w-8 inline-flex items-center justify-center rounded hover:bg-slate-200 text-slate-700"
                        >
                            <Icon className="h-4 w-4" />
                        </button>
                    ))}
                <button
                    type="button"
                    onClick={() => setShowHtml((v) => !v)}
                    className="ml-auto inline-flex items-center gap-1 rounded px-2 h-8 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                >
                    <Code className="h-3.5 w-3.5" />
                    {showHtml ? "Visual editor" : "Edit HTML"}
                </button>
            </div>
            {showHtml ? (
                <textarea
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    rows={8}
                    spellCheck={false}
                    className="w-full p-3 font-mono text-xs outline-none"
                />
            ) : (
                <div
                    ref={ref}
                    contentEditable
                    suppressContentEditableWarning
                    data-placeholder={placeholder}
                    onInput={(e) => onChange((e.target as HTMLDivElement).innerHTML)}
                    className="min-h-[140px] p-3 text-sm outline-none [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_a]:text-primary [&_a]:underline empty:before:content-[attr(data-placeholder)] empty:before:text-slate-400"
                />
            )}
        </div>
    );
}

function ImageInput({
    label,
    src,
    onPick,
    onRemove,
    maxMb = 2,
}: {
    label: string;
    src?: string | null;
    onPick: (dataUrl: string) => void;
    onRemove?: () => void;
    maxMb?: number;
}) {
    const inputRef = useRef<HTMLInputElement>(null);

    const pick = async (file?: File) => {
        if (!file) return;
        if (!file.type.startsWith("image/")) return toast.error("Please choose an image file.");
        if (file.size > maxMb * 1024 * 1024) return toast.error(`Image must be up to ${maxMb} MB.`);
        onPick(await readFileAsDataUrl(file));
    };

    return (
        <div>
            <span className={labelClass}>{label}</span>
            <div className="flex items-center gap-3">
                {src ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={src} alt={label} className="h-16 w-16 rounded-md border border-slate-200 object-contain bg-white" />
                ) : (
                    <div className="h-16 w-16 rounded-md border border-dashed border-slate-300 flex items-center justify-center text-slate-400">
                        <ImagePlus className="h-5 w-5" />
                    </div>
                )}
                <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="outline" onClick={() => inputRef.current?.click()}>
                        {src ? "Change" : "Upload"}
                    </Button>
                    {src && onRemove && (
                        <Button type="button" variant="outline" onClick={onRemove} className="text-red-600">
                            Remove
                        </Button>
                    )}
                </div>
                <input
                    ref={inputRef}
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(e) => {
                        pick(e.target.files?.[0]);
                        e.target.value = "";
                    }}
                />
            </div>
        </div>
    );
}

type SaveCall = { group: string; data: Record<string, any> };
/** What a step wants saved, or why it cannot be saved yet. */
type Collected = { calls?: SaveCall[]; error?: string };
type StepEntry = { collect: () => Collected; isDirty: () => boolean; markSaved: () => void; afterSave?: () => void };

const SaveContext = createContext<{
    register: (step: ProfileStepKey, entry: StepEntry) => () => void;
    saveAll: () => void;
    saving: boolean;
} | null>(null);

/**
 * Registers a step with the shared "Save all changes" button. A step counts as changed when what
 * it would save differs from what it would have saved when the page opened.
 */
function useStepSave(step: ProfileStepKey, collect: () => Collected, afterSave?: () => void) {
    const { register } = useContext(SaveContext)!;
    const latest = useRef({ collect, afterSave });
    const saved = useRef<string | null>(null);

    useEffect(() => {
        latest.current = { collect, afterSave };
    });

    useEffect(() => {
        const snapshot = () => JSON.stringify(latest.current.collect().calls ?? null);
        saved.current = snapshot();

        return register(step, {
            collect: () => latest.current.collect(),
            isDirty: () => snapshot() !== saved.current,
            markSaved: () => {
                saved.current = snapshot();
            },
            afterSave: () => latest.current.afterSave?.(),
        });
    }, [register, step]);
}

/* ------------------------------------------------------------------ */
/* Steps                                                               */
/* ------------------------------------------------------------------ */

function BasicInfoStep({ profile }: { profile: any }) {
    const info = profile?.personal_information ?? {};
    const { updateUser } = useAuth();
    const currentYear = new Date().getFullYear();

    const [form, setForm] = useState({
        first_name: info.first_name ?? "",
        last_name: info.last_name ?? "",
        phone: info.phone ?? "",
        medical_license_number: info.medical_license_number ?? profile?.medical_license ?? "",
        career_start_year: info.career_start_year ? String(info.career_start_year) : "",
        languages_known: (Array.isArray(info.languages_known) ? info.languages_known : []) as string[],
    });
    const [avatar, setAvatar] = useState<{ src: string; base64?: string }>({ src: info.avatar ?? "" });
    const [signature, setSignature] = useState<{ src: string; base64?: string }>({ src: info.signature ?? "" });

    const set = (key: keyof typeof form, value: any) => setForm((prev) => ({ ...prev, [key]: value }));
    const toggleLanguage = (language: string) =>
        set(
            "languages_known",
            form.languages_known.includes(language)
                ? form.languages_known.filter((l) => l !== language)
                : [...form.languages_known, language]
        );

    const years = Array.from({ length: 51 }, (_, i) => currentYear - i);
    const experience = form.career_start_year ? currentYear - Number(form.career_start_year) : 0;

    useStepSave(
        "basic",
        () => {
            if (!form.first_name.trim() || !form.last_name.trim()) {
                return { error: "First name and last name are required." };
            }

            return {
                calls: [
                    {
                        group: "personal_information",
                        data: {
                            first_name: form.first_name.trim(),
                            last_name: form.last_name.trim(),
                            phone: form.phone.trim() || null,
                            medical_license_number: form.medical_license_number.trim() || null,
                            career_start_year: form.career_start_year ? Number(form.career_start_year) : null,
                            languages_known: form.languages_known,
                            ...(avatar.base64 ? { avatar_base64: avatar.base64 } : {}),
                            ...(signature.base64 ? { signature_base64: signature.base64 } : {}),
                        },
                    },
                ],
            };
        },
        () => updateUser({ first_name: form.first_name.trim(), last_name: form.last_name.trim(), phone: form.phone.trim() } as any)
    );

    return (
        <StepShell title="Basic Info" description="Your name, contact, registration and photo.">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="First Name">
                    <Input value={form.first_name} onChange={(e) => set("first_name", e.target.value)} className="p-2.5" />
                </Field>
                <Field label="Last Name">
                    <Input value={form.last_name} onChange={(e) => set("last_name", e.target.value)} className="p-2.5" />
                </Field>
                <Field label="Email" hint="Email is managed by the hospital admin.">
                    <Input value={info.email ?? ""} disabled className="p-2.5" />
                </Field>
                <Field label="Phone">
                    <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} inputMode="tel" className="p-2.5" />
                </Field>
                <Field label="PMC Registration Number / License Number">
                    <Input value={form.medical_license_number} onChange={(e) => set("medical_license_number", e.target.value)} className="p-2.5" />
                </Field>
                <Field label="Year of start of Senior Residency / Career Start Year" hint={`Years of experience: ${experience > 0 ? experience : 0}`}>
                    <select value={form.career_start_year} onChange={(e) => set("career_start_year", e.target.value)} className={controlClass}>
                        <option value="">Select year</option>
                        {years.map((year) => (
                            <option key={year} value={year}>{year}</option>
                        ))}
                    </select>
                </Field>
                <Field label="Languages Familiar" full>
                    <div className="flex flex-wrap gap-2">
                        {LANGUAGES.map((language) => {
                            const active = form.languages_known.includes(language);
                            return (
                                <button
                                    key={language}
                                    type="button"
                                    aria-pressed={active}
                                    onClick={() => toggleLanguage(language)}
                                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${active ? "bg-primary text-white border-primary" : "border-slate-300 text-slate-700 hover:bg-slate-50"}`}
                                >
                                    {language}
                                </button>
                            );
                        })}
                    </div>
                </Field>
                <ImageInput
                    label="Profile Photo"
                    src={avatar.src}
                    maxMb={2}
                    onPick={(dataUrl) => setAvatar({ src: dataUrl, base64: dataUrl })}
                />
                <ImageInput
                    label="Signature"
                    src={signature.src}
                    maxMb={5}
                    onPick={(dataUrl) => setSignature({ src: dataUrl, base64: dataUrl })}
                />
                <Field label="Departments" hint="Departments are assigned by the hospital admin." full>
                    <div className="flex flex-wrap gap-2">
                        {(info.doctor_departments ?? []).length === 0 && <span className="text-sm text-slate-500">No department assigned.</span>}
                        {(info.doctor_departments ?? []).map((department: any) => (
                            <span key={department.department_id} className="rounded-md bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700">
                                {department.department_name}
                                {department.role ? ` (${department.role})` : ""}
                            </span>
                        ))}
                    </div>
                </Field>
            </div>
        </StepShell>
    );
}

/** One or more rich-text fields saved to a single profile group. */
function RichFieldsStep({
    step,
    title,
    description,
    group,
    source,
    fields,
}: {
    step: ProfileStepKey;
    title: string;
    description?: string;
    group: string;
    source: Record<string, any>;
    fields: { key: string; label: string; type?: "rich" | "text"; hint?: string }[];
}) {
    const [form, setForm] = useState<Record<string, string>>(() =>
        Object.fromEntries(fields.map((field) => [field.key, source?.[field.key] ?? ""]))
    );

    useStepSave(step, () => ({
        calls: [{ group, data: Object.fromEntries(fields.map((field) => [field.key, form[field.key]?.trim() ? form[field.key] : null])) }],
    }));

    return (
        <StepShell title={title} description={description}>
            <div className="space-y-4">
                {fields.map((field) => (
                    <Field key={field.key} label={field.label} hint={field.hint}>
                        {field.type === "text" ? (
                            <Input value={form[field.key]} onChange={(e) => setForm((prev) => ({ ...prev, [field.key]: e.target.value }))} className="p-2.5" />
                        ) : (
                            <RichTextEditor value={form[field.key]} onChange={(html) => setForm((prev) => ({ ...prev, [field.key]: html }))} />
                        )}
                    </Field>
                ))}
            </div>
        </StepShell>
    );
}

/** A saved structured list as HTML, to pre-fill the free-text editor. */
function rowsToHtml(rows: any[], columns: { key: string; type?: string }[]): string {
    const escape = (value: unknown) => String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    const lines = rows
        .map((row) => columns.filter((column) => column.type !== "image").map((column) => String(row?.[column.key] ?? "").trim()).filter(Boolean))
        .filter((values) => values.length > 0)
        .map(([first, ...rest]) => `<li><strong>${escape(first)}</strong>${rest.length ? ` — ${rest.map(escape).join(", ")}` : ""}</li>`);

    return lines.length ? `<ul>${lines.join("")}</ul>` : "";
}

type ListColumn = { key: string; label: string; type?: "text" | "textarea" | "image"; maxLength?: number };
type ListItem = Record<string, any> & { _key: string; _newImages?: Record<string, string> };

let listItemCounter = 0;
const newKey = () => `item-${++listItemCounter}`;

/**
 * A list section with the two entry methods of the admin form:
 * "Structured List" (one card per entry) or "Free-text Editor" (HTML).
 */
function ListStep({
    step,
    title,
    description,
    group,
    field,
    data,
    structuredLabel,
    entryLabel,
    columns,
}: {
    step: ProfileStepKey;
    title: string;
    description?: string;
    group: string;
    field: string;
    data: any[];
    structuredLabel: string;
    entryLabel: string;
    columns: ListColumn[];
}) {
    const rows = Array.isArray(data) ? data : [];
    const freeText = Boolean(rows[0]?.is_free_text);

    // The free-text editor is the default. A saved structured list is pre-filled into it as a
    // bullet list; nothing changes on the server unless this step is edited and saved.
    const [mode, setMode] = useState<"repeater" | "editor">("editor");
    const [html, setHtml] = useState<string>(() => (freeText ? rows[0]?.html ?? "" : rowsToHtml(rows, columns)));
    const [items, setItems] = useState<ListItem[]>(() => (freeText ? [] : rows.map((row) => ({ ...row, _key: newKey() }))));
    const hasImages = items.some((item) => columns.some((column) => column.type === "image" && item[column.key]));

    const update = (key: string, patch: Record<string, any>) =>
        setItems((prev) => prev.map((item) => (item._key === key ? { ...item, ...patch } : item)));

    useStepSave(step, () => {
        let payload: any[];

        if (mode === "editor") {
            payload = html.replace(/<[^>]*>/g, "").trim() ? [{ is_free_text: true, html }] : [];
        } else {
            payload = items
                .map((item) => {
                    const row: Record<string, any> = item.id ? { id: item.id } : {};
                    let hasValue = false;

                    for (const column of columns) {
                        if (column.type === "image") {
                            const fresh = item._newImages?.[column.key];
                            if (fresh) {
                                row[`${column.key}_base64`] = fresh;
                                hasValue = true;
                            } else if (item[column.key]) {
                                // Unchanged image: the server keeps the stored file.
                                row[`${column.key}_existing`] = item[column.key];
                                hasValue = true;
                            }
                            continue;
                        }

                        const value = String(item[column.key] ?? "").trim();
                        row[column.key] = value || null;
                        if (value) hasValue = true;
                    }

                    return hasValue ? row : null;
                })
                .filter(Boolean) as any[];
        }

        return { calls: [{ group, data: { [field]: payload } }] };
    });

    return (
        <StepShell title={title} description={description}>
            <div>
                <span className={labelClass}>Entry Method</span>
                <div className="flex flex-col sm:flex-row gap-2" role="radiogroup" aria-label="Entry Method">
                    {([
                        ["repeater", structuredLabel],
                        ["editor", "Free-text Editor (Write custom text / HTML)"],
                    ] as const).map(([value, label]) => (
                        <label
                            key={value}
                            className={`flex-1 flex items-center gap-2 rounded-md border px-3 py-2.5 text-sm cursor-pointer ${mode === value ? "border-primary bg-primary/5 text-primary font-semibold" : "border-slate-300 text-slate-700"}`}
                        >
                            <input type="radio" name={`${field}-mode`} checked={mode === value} onChange={() => setMode(value)} className="accent-[var(--primary)]" />
                            {label}
                        </label>
                    ))}
                </div>
                <p className="mt-1 text-xs text-slate-500">Only the selected method is saved and shown on your public profile.</p>
            </div>

            {mode === "editor" ? (
                <div className="space-y-2">
                    <RichTextEditor value={html} onChange={setHtml} placeholder={`Write your ${title.toLowerCase()} here…`} />
                    {hasImages && (
                        <p className="text-xs text-amber-700">
                            Images are kept only in the structured list. Saving this step as free text removes the images of these entries.
                        </p>
                    )}
                </div>
            ) : (
                <div className="space-y-3">
                    {items.length === 0 && <p className="text-sm text-slate-500">No entries yet.</p>}
                    {items.map((item, index) => (
                        <div key={item._key} className="rounded-lg border border-slate-200 p-3 sm:p-4">
                            <div className="mb-3 flex items-center justify-between">
                                <span className="text-sm font-semibold text-slate-800">{entryLabel} {index + 1}</span>
                                <button
                                    type="button"
                                    aria-label={`Remove ${entryLabel} ${index + 1}`}
                                    onClick={() => setItems((prev) => prev.filter((row) => row._key !== item._key))}
                                    className="inline-flex h-8 w-8 items-center justify-center rounded text-red-600 hover:bg-red-50"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {columns.map((column) =>
                                    column.type === "image" ? (
                                        <div key={column.key} className="md:col-span-2">
                                            <ImageInput
                                                label={column.label}
                                                src={item._newImages?.[column.key] || item[column.key] || ""}
                                                onPick={(dataUrl) => update(item._key, { _newImages: { ...(item._newImages ?? {}), [column.key]: dataUrl } })}
                                                onRemove={() => update(item._key, { [column.key]: "", _newImages: { ...(item._newImages ?? {}), [column.key]: "" } })}
                                            />
                                        </div>
                                    ) : (
                                        <Field key={column.key} label={column.label} full={column.type === "textarea"}>
                                            {column.type === "textarea" ? (
                                                <textarea
                                                    rows={3}
                                                    value={item[column.key] ?? ""}
                                                    onChange={(e) => update(item._key, { [column.key]: e.target.value })}
                                                    className={controlClass}
                                                />
                                            ) : (
                                                <Input
                                                    value={item[column.key] ?? ""}
                                                    maxLength={column.maxLength}
                                                    onChange={(e) => update(item._key, { [column.key]: e.target.value })}
                                                    className="p-2.5"
                                                />
                                            )}
                                        </Field>
                                    )
                                )}
                            </div>
                        </div>
                    ))}
                    <Button type="button" variant="outline" onClick={() => setItems((prev) => [...prev, { _key: newKey() }])}>
                        <Plus className="h-4 w-4" />
                        Add {entryLabel.toLowerCase()}
                    </Button>
                </div>
            )}
        </StepShell>
    );
}

function ContactStep({ profile }: { profile: any }) {
    const address = profile?.address ?? {};
    const social = profile?.social_media ?? {};

    const addressFields: { key: string; label: string; textarea?: boolean }[] = [
        { key: "address_line1", label: "Address Line 1", textarea: true },
        { key: "address_line2", label: "Address Line 2", textarea: true },
        { key: "country", label: "Country" },
        { key: "state", label: "State" },
        { key: "city", label: "City" },
        { key: "pincode", label: "Pincode" },
        { key: "area", label: "Area" },
        { key: "landmark", label: "Landmark" },
    ];
    const socialFields = ["facebook", "twitter", "linkedin", "instagram", "website"];

    const [addressForm, setAddressForm] = useState<Record<string, string>>(() =>
        Object.fromEntries(addressFields.map((f) => [f.key, address[f.key] ?? ""]))
    );
    const [socialForm, setSocialForm] = useState<Record<string, string>>(() =>
        Object.fromEntries(socialFields.map((key) => [key, social[key] ?? ""]))
    );

    useStepSave("contact", () => {
        const invalid = socialFields.find((key) => socialForm[key].trim() && !/^https?:\/\/\S+$/i.test(socialForm[key].trim()));
        if (invalid) {
            return { error: `The ${invalid} link must start with https://` };
        }

        return {
            calls: [
                { group: "address", data: Object.fromEntries(addressFields.map((f) => [f.key, addressForm[f.key].trim() || null])) },
                { group: "social_media", data: { social_links: Object.fromEntries(socialFields.map((key) => [key, socialForm[key].trim() || null])) } },
            ],
        };
    });

    return (
        <StepShell title="Contact" description="Address and social media links.">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {addressFields.map((f) => (
                    <Field key={f.key} label={f.label}>
                        {f.textarea ? (
                            <textarea rows={2} value={addressForm[f.key]} onChange={(e) => setAddressForm((p) => ({ ...p, [f.key]: e.target.value }))} className={controlClass} />
                        ) : (
                            <Input value={addressForm[f.key]} onChange={(e) => setAddressForm((p) => ({ ...p, [f.key]: e.target.value }))} className="p-2.5" />
                        )}
                    </Field>
                ))}
            </div>
            <h3 className="text-sm font-semibold text-slate-800 pt-2">Social Media</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {socialFields.map((key) => (
                    <Field key={key} label={key.charAt(0).toUpperCase() + key.slice(1)}>
                        <Input
                            type="url"
                            placeholder="https://"
                            value={socialForm[key]}
                            onChange={(e) => setSocialForm((p) => ({ ...p, [key]: e.target.value }))}
                            className="p-2.5"
                        />
                    </Field>
                ))}
            </div>
        </StepShell>
    );
}

/** Switch international payment on / off and set the international (USD) video fee. */
function InternationalPaymentStep({ profile }: { profile: any }) {
    const saved = profile?.international_payment ?? {};
    const defaultFee = Number(saved.default_international_fee) || 30;
    const upcomingVideoOpds = Number(saved.upcoming_video_opds) || 0;

    const [enabled, setEnabled] = useState<boolean>(Boolean(saved.international_payment_enabled));
    const [fee, setFee] = useState<string>(String(saved.international_fee ?? defaultFee));

    useStepSave("international", () => {
        const amount = Number(fee);
        if (enabled && (!fee.trim() || !Number.isFinite(amount) || amount < 1)) {
            return { error: "Enter the international video fee in USD (at least $1)." };
        }

        return {
            calls: [
                {
                    group: "international_payment",
                    data: {
                        international_payment_enabled: enabled,
                        // The fee is kept when the switch is off, so it is there when switched back on.
                        ...(enabled ? { international_fee: amount } : {}),
                    },
                },
            ],
        };
    });

    return (
        <StepShell
            title="International Payment"
            description="Let patients outside India book your video consultations and pay in US dollars. In-person visits are always charged your Indian fee (₹)."
        >
            <label className="flex items-start gap-3 rounded-lg border border-slate-200 p-4 cursor-pointer">
                <input
                    type="checkbox"
                    role="switch"
                    checked={enabled}
                    onChange={(e) => setEnabled(e.target.checked)}
                    className="mt-0.5 h-5 w-5 accent-[var(--primary)]"
                />
                <span>
                    <span className="block text-sm font-semibold text-slate-800">Enable international payment</span>
                    <span className="block text-xs text-slate-500">
                        Off: every patient pays your Indian fee (₹) and no international fee is shown.
                    </span>
                </span>
            </label>

            {enabled && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field
                        label="International video fee (USD)"
                        hint={
                            upcomingVideoOpds > 0
                                ? `Saved on your ${upcomingVideoOpds} upcoming video OPD${upcomingVideoOpds === 1 ? "" : "s"}; new video OPDs start with it.`
                                : "You have no upcoming video OPD. International patients can book once a video OPD is added."
                        }
                    >
                        <div className="flex items-center rounded-md border border-input focus-within:border-primary">
                            <span className="px-3 text-sm text-slate-500">$</span>
                            <input
                                type="number"
                                inputMode="decimal"
                                min={1}
                                step="1"
                                value={fee}
                                onChange={(e) => setFee(e.target.value)}
                                className="w-full bg-transparent py-2.5 pr-3 text-sm outline-none"
                            />
                        </div>
                    </Field>
                </div>
            )}
        </StepShell>
    );
}

/* ------------------------------------------------------------------ */
/* Entry point                                                         */
/* ------------------------------------------------------------------ */

/**
 * Every step stays mounted (the inactive ones are hidden), so what is typed on one step is kept
 * while moving with Next / Previous, and "Save all changes" saves every changed step together.
 */
export default function ProfileEditor({
    step,
    profile,
    onStepError,
}: {
    step: ProfileStepKey | null;
    profile: any;
    onStepError?: (step: ProfileStepKey) => void;
}) {
    const { user } = useAuth();
    const userId = user?.id;
    const { mutateAsync } = useUpdateDoctorProfile();
    const steps = useRef(new Map<ProfileStepKey, StepEntry>());
    const [saving, setSaving] = useState(false);

    const register = useCallback((key: ProfileStepKey, entry: StepEntry) => {
        steps.current.set(key, entry);
        return () => {
            steps.current.delete(key);
        };
    }, []);

    const saveAll = useCallback(async () => {
        if (!userId) return;

        const changed = [...steps.current.entries()].filter(([, entry]) => entry.isDirty());
        if (changed.length === 0) {
            toast.info("No changes to save.");
            return;
        }

        // Steps that share a group (e.g. Basic Info and Professional Bio) go in one request.
        const byGroup = new Map<string, Record<string, any>>();
        for (const [key, entry] of changed) {
            const collected = entry.collect();
            if (collected.error) {
                toast.error(collected.error);
                onStepError?.(key);
                return;
            }
            for (const call of collected.calls ?? []) {
                byGroup.set(call.group, { ...(byGroup.get(call.group) ?? {}), ...call.data });
            }
        }

        setSaving(true);
        try {
            for (const [group, data] of byGroup) {
                await mutateAsync({ userId, group, data });
            }
            changed.forEach(([, entry]) => {
                entry.markSaved();
                entry.afterSave?.();
            });
            toast.success(changed.length === 1 ? "Profile saved." : `Profile saved (${changed.length} steps updated).`);
        } catch (error) {
            toast.error(errorMessage(error, "Could not save. Please try again."));
        } finally {
            setSaving(false);
        }
    }, [mutateAsync, onStepError, userId]);

    const context = useMemo(() => ({ register, saveAll, saving }), [register, saveAll, saving]);

    return (
        <SaveContext.Provider value={context}>
            <div className={step === "basic" ? undefined : "hidden"}>
                <BasicInfoStep profile={profile} />
            </div>
            <div className={step === "availability" ? undefined : "hidden"}>
            <RichFieldsStep
                step="availability"
                title="Availability"
                description="General note about when you are available (shown on your public profile). Your bookable slots are managed under Availability."
                group="additional_information"
                source={profile?.additional_information}
                fields={[{ key: "availability_info", label: "Availability Info" }]}
            />
        
            </div>
            <div className={step === "bio" ? undefined : "hidden"}>
            <RichFieldsStep
                step="bio"
                title="Professional Bio"
                group="personal_information"
                source={profile?.personal_information}
                fields={[
                    { key: "sub_title", label: "Sub Title", type: "text", hint: "Short line under your name, e.g. Principal (Dean), Professor and Head." },
                    { key: "bio", label: "Bio" },
                    { key: "description", label: "Description" },
                ]}
            />
        
            </div>
            <div className={step === "education" ? undefined : "hidden"}>
            <ListStep
                step="education"
                title="Education"
                group="education_info"
                field="education_info"
                data={profile?.education_info}
                structuredLabel="Structured List (Degrees, Institutions, Years)"
                entryLabel="Education entry"
                columns={[
                    { key: "degree", label: "Degree", maxLength: 255 },
                    { key: "institution", label: "Institution", maxLength: 255 },
                    { key: "completion_year", label: "Completion Year", maxLength: 255 },
                ]}
            />
        
            </div>
            <div className={step === "awards" ? undefined : "hidden"}>
            <ListStep
                step="awards"
                title="Awards"
                group="awards_info"
                field="awards_info"
                data={profile?.awards_info}
                structuredLabel="Structured List (Titles, Years, Descriptions)"
                entryLabel="Award"
                columns={[
                    { key: "title", label: "Title", maxLength: 255 },
                    { key: "year", label: "Year", maxLength: 4 },
                    { key: "description", label: "Description", type: "textarea" },
                    { key: "award_image", label: "Award Image", type: "image" },
                ]}
            />
        
            </div>
            <div className={step === "certificates" ? undefined : "hidden"}>
            <ListStep
                step="certificates"
                title="Certificates"
                group="certifications_info"
                field="certifications_info"
                data={profile?.certifications_info}
                structuredLabel="Structured List (Names, Organizations, Descriptions)"
                entryLabel="Certificate"
                columns={[
                    { key: "name", label: "Name", maxLength: 255 },
                    { key: "organization", label: "Organization", maxLength: 255 },
                    { key: "description", label: "Description", type: "textarea" },
                    { key: "certification_image", label: "Certificate Image", type: "image" },
                ]}
            />
        
            </div>
            <div className={step === "experience" ? undefined : "hidden"}>
            <ListStep
                step="experience"
                title="Experience"
                group="working_experience"
                field="professional_experience_info"
                data={profile?.working_experience}
                structuredLabel="Structured List (Associations, Descriptions)"
                entryLabel="Experience"
                columns={[
                    { key: "association", label: "Association", maxLength: 255 },
                    { key: "description", label: "Description", type: "textarea" },
                ]}
            />
        
            </div>
            <div className={step === "fellowships" ? undefined : "hidden"}>
            <ListStep
                step="fellowships"
                title="Fellowships"
                group="fellowships_training"
                field="fellowships_info"
                data={profile?.fellowships_training}
                structuredLabel="Structured List (Titles, Institutions, Years)"
                entryLabel="Fellowship"
                columns={[
                    { key: "title", label: "Title", maxLength: 255 },
                    { key: "institution", label: "Institution", maxLength: 255 },
                    { key: "year_started", label: "Year Started", maxLength: 4 },
                    { key: "description", label: "Description", type: "textarea" },
                ]}
            />
        
            </div>
            <div className={step === "additional" ? undefined : "hidden"}>
            <RichFieldsStep
                step="additional"
                title="Additional Information"
                group="additional_information"
                source={profile?.additional_information}
                fields={[
                    { key: "specializations_info", label: "Specializations" },
                    { key: "key_procedures_info", label: "Key Procedures" },
                    { key: "memberships_info", label: "Memberships" },
                    { key: "special_interests", label: "Special Interests" },
                    { key: "expertise_info", label: "Expertise" },
                ]}
            />
        
            </div>
            <div className={step === "contact" ? undefined : "hidden"}>
                <ContactStep profile={profile} />
            </div>
            <div className={step === "international" ? undefined : "hidden"}>
                <InternationalPaymentStep profile={profile} />
            </div>
        </SaveContext.Provider>
    );
}
