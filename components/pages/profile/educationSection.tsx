"use client";

import { useState, useEffect } from "react";
import { GraduationCap, Edit, Save, Plus, Trash2, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { ProfileItemCard } from "./profileItemCard";
import { useAuth } from "@/context/userContext";
import { useUpdateDoctorProfile } from "@/queries/useProfile";
import { toast } from "sonner";

interface EducationItem {
    degree?: string | null;
    institution?: string | null;
    institute_name?: string | null;
    start_date?: string | null;
    end_date?: string | null;
    year?: string | number | null;
    location?: string | null;
}

interface EducationSectionProps {
    education?: any;
}

const hasRealValue = (val?: string | number | null): boolean => {
    if (!val) return false;
    const norm = String(val).trim().toLowerCase();
    return (
        norm !== "" &&
        norm !== "n/a" &&
        norm !== "null" &&
        norm !== "undefined" &&
        norm !== "unknown" &&
        norm !== "—"
    );
};

export default function EducationSection({ education }: EducationSectionProps) {
    const { user } = useAuth();
    const updateProfileMutation = useUpdateDoctorProfile();
    const [isEditing, setIsEditing] = useState(false);

    const rawEducation: EducationItem[] = Array.isArray(education)
        ? education
        : Array.isArray(education?.education_info)
            ? education.education_info
            : [];

    const [items, setItems] = useState<EducationItem[]>([]);

    useEffect(() => {
        const cleanInitial = rawEducation
            .map((item) => ({
                degree: hasRealValue(item.degree) ? String(item.degree) : "",
                institution: hasRealValue(item.institution || item.institute_name)
                    ? String(item.institution || item.institute_name)
                    : "",
                start_date: hasRealValue(item.start_date) ? String(item.start_date) : "",
                end_date: hasRealValue(item.end_date) ? String(item.end_date) : "",
                year: hasRealValue(item.year) ? String(item.year) : "",
            }))
            .filter((item) => item.degree || item.institution || item.start_date || item.year);

        setItems(cleanInitial);
    }, [education]);

    const handleAddItem = () => {
        setItems((prev) => [
            ...prev,
            { degree: "", institution: "", start_date: "", end_date: "" },
        ]);
    };

    const handleRemoveItem = (index: number) => {
        setItems((prev) => prev.filter((_, i) => i !== index));
    };

    const handleChangeItem = (index: number, field: keyof EducationItem, value: string) => {
        setItems((prev) =>
            prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
        );
    };

    const handleSave = async () => {
        if (!user?.id) return;
        const validPayloadItems = items
            .map((item) => ({
                degree: item.degree?.trim() || "",
                institution: item.institution?.trim() || "",
                start_date: item.start_date?.trim() || "",
                end_date: item.end_date?.trim() || "",
            }))
            .filter((item) => item.degree || item.institution);

        try {
            await updateProfileMutation.mutateAsync({
                userId: user.id,
                group: "education_info",
                data: {
                    education_info: validPayloadItems,
                },
            });
            toast.success("Education history updated successfully!");
            setIsEditing(false);
        } catch (err) {
            console.error("Failed to update education history:", err);
            toast.error("Failed to update education history");
        }
    };

    const validItems = items.filter(
        (edu) =>
            edu &&
            (hasRealValue(edu.degree) ||
                hasRealValue(edu.institution) ||
                hasRealValue(edu.institute_name))
    );

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                <div>
                    <h2 className="text-[#1F1E1E] font-semibold text-lg">Education History</h2>
                    <p className="text-[#4D4D4D] text-sm">Your academic qualifications</p>
                </div>
                {!isEditing && (
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditing(true)}
                        className="text-xs h-8 px-3 rounded-md gap-1.5 font-semibold text-primary border-primary/30 bg-primary/5 hover:bg-primary/10"
                    >
                        <Edit className="h-3.5 w-3.5" /> Edit Education
                    </Button>
                )}
            </div>

            {isEditing ? (
                <Card className="border-border p-4 sm:p-5 space-y-4 rounded-2xl">
                    {items.length === 0 ? (
                        <p className="text-sm text-slate-500 italic text-center py-4">
                            No education entries listed. Click below to add your education.
                        </p>
                    ) : (
                        items.map((item, index) => (
                            <div key={index} className="p-4 border border-slate-200 rounded-md space-y-3 bg-slate-50/50">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                                        Degree / Qualification #{index + 1}
                                    </span>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleRemoveItem(index)}
                                        className="h-7 px-2 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                                    >
                                        <Trash2 className="h-3.5 w-3.5 mr-1" /> Remove
                                    </Button>
                                </div>

                                <div className="grid gap-3 md:grid-cols-2">
                                    <div className="space-y-1">
                                        <Label className="text-xs">Degree / Qualification</Label>
                                        <Input
                                            value={item.degree || ""}
                                            onChange={(e) => handleChangeItem(index, "degree", e.target.value)}
                                            placeholder="e.g. MBBS, MD, MS"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs">Institution / University</Label>
                                        <Input
                                            value={item.institution || ""}
                                            onChange={(e) => handleChangeItem(index, "institution", e.target.value)}
                                            placeholder="e.g. Harvard Medical School"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs">Start Date / Year</Label>
                                        <Input
                                            value={item.start_date || ""}
                                            onChange={(e) => handleChangeItem(index, "start_date", e.target.value)}
                                            placeholder="e.g. 2015 or 2015-08-01"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs">End Date / Year</Label>
                                        <Input
                                            value={item.end_date || ""}
                                            onChange={(e) => handleChangeItem(index, "end_date", e.target.value)}
                                            placeholder="e.g. 2020 or 2020-05-30"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))
                    )}

                    <div className="flex items-center justify-between pt-2 border-t">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleAddItem}
                            className="gap-1.5 text-xs rounded-md"
                        >
                            <Plus className="h-3.5 w-3.5" /> Add Education
                        </Button>

                        <div className="flex items-center gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setIsEditing(false)}
                                disabled={updateProfileMutation.isPending}
                                className="rounded-md text-xs"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                size="sm"
                                onClick={handleSave}
                                disabled={updateProfileMutation.isPending}
                                className="gap-1.5 rounded-md text-xs"
                            >
                                {updateProfileMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                                {updateProfileMutation.isPending ? "Saving..." : "Save Education"}
                            </Button>
                        </div>
                    </div>
                </Card>
            ) : (
                <>
                    {validItems.length === 0 ? (
                        <div className="p-8 text-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50">
                            <GraduationCap className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                            <p className="text-sm font-medium text-slate-600">No education history recorded yet.</p>
                        </div>
                    ) : (
                        <div className="grid gap-3 md:grid-cols-2">
                            {validItems.map((edu, index: number) => {
                                const yearDisplay = edu.year || (edu.start_date && edu.end_date ? `${edu.start_date} - ${edu.end_date}` : edu.start_date || edu.end_date);
                                const hasYear = hasRealValue(yearDisplay);

                                return (
                                    <ProfileItemCard
                                        key={index}
                                        icon={<GraduationCap className="h-5 w-5" />}
                                        title={edu.degree || edu.institution}
                                        subtitle={edu.institution && edu.institution !== edu.degree ? edu.institution : undefined}
                                        meta={edu.location}
                                        badge={hasYear ? <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 border-0 text-[10px] font-bold">{yearDisplay}</Badge> : null}
                                    />
                                );
                            })}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}