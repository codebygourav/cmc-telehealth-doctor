"use client";

import { useState, useEffect } from "react";
import { Briefcase, Edit, Save, Plus, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { ProfileItemCard } from "./profileItemCard";
import { useAuth } from "@/context/userContext";
import { useUpdateDoctorProfile } from "@/queries/useProfile";
import { toast } from "sonner";

interface WorkingExperienceItem {
    company?: string | null;
    past_associations?: string | null;
    association?: string | null;
    role?: string | null;
    career_start?: number | string | null;
    period?: string | null;
    description?: string | null;
}

interface ExperienceSectionProps {
    experience?: any;
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

export default function ExperienceSection({
    experience,
}: ExperienceSectionProps) {
    const { user } = useAuth();
    const updateProfileMutation = useUpdateDoctorProfile();
    const [isEditing, setIsEditing] = useState(false);

    const safeExperience: WorkingExperienceItem[] = Array.isArray(experience)
        ? experience
        : Array.isArray(experience?.working_experience)
            ? experience.working_experience
            : Array.isArray(experience?.professional_experience_info)
                ? experience.professional_experience_info
                : [];

    const [items, setItems] = useState<WorkingExperienceItem[]>([]);

    useEffect(() => {
        const cleanInitial = safeExperience
            .map((item) => ({
                past_associations: hasRealValue(item.company || item.past_associations || item.association)
                    ? String(item.company || item.past_associations || item.association)
                    : "",
                role: hasRealValue(item.role) ? String(item.role) : "",
                career_start: hasRealValue(item.career_start || item.period)
                    ? String(item.career_start || item.period)
                    : "",
                description: hasRealValue(item.description) ? String(item.description) : "",
            }))
            .filter((item) => item.past_associations || item.role || item.career_start);

        setItems(cleanInitial);
    }, [experience]);

    const handleAddItem = () => {
        setItems((prev) => [
            ...prev,
            { past_associations: "", role: "", career_start: "", description: "" },
        ]);
    };

    const handleRemoveItem = (index: number) => {
        setItems((prev) => prev.filter((_, i) => i !== index));
    };

    const handleChangeItem = (index: number, field: keyof WorkingExperienceItem, value: string) => {
        setItems((prev) =>
            prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
        );
    };

    const handleSave = async () => {
        if (!user?.id) return;
        const validPayloadItems = items
            .map((item) => ({
                past_associations: item.past_associations?.trim() || "",
                career_start: item.career_start ? String(item.career_start).trim() : "",
            }))
            .filter((item) => item.past_associations);

        try {
            await updateProfileMutation.mutateAsync({
                userId: user.id,
                group: "working_experience",
                data: {
                    professional_experience_info: validPayloadItems,
                },
            });
            toast.success("Working experience updated successfully!");
            setIsEditing(false);
        } catch (err) {
            console.error("Failed to update working experience:", err);
            toast.error("Failed to update working experience");
        }
    };

    const validItems = items.filter(
        (exp) => exp && hasRealValue(exp.past_associations)
    );

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                <div>
                    <h2 className="text-[#1F1E1E] font-semibold text-lg">Working Experience</h2>
                    <p className="text-[#4D4D4D] text-sm">Your professional work history</p>
                </div>
                {!isEditing && (
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditing(true)}
                        className="text-xs h-8 px-3 rounded-xl gap-1.5 font-semibold text-primary border-primary/30 bg-primary/5 hover:bg-primary/10"
                    >
                        <Edit className="h-3.5 w-3.5" /> Edit Experience
                    </Button>
                )}
            </div>

            {isEditing ? (
                <Card className="border-border p-4 sm:p-5 space-y-4 rounded-2xl">
                    {items.length === 0 ? (
                        <p className="text-sm text-slate-500 italic text-center py-4">
                            No experience entries listed. Click below to add your experience.
                        </p>
                    ) : (
                        items.map((item, index) => (
                            <div key={index} className="p-4 border border-slate-200 rounded-xl space-y-3 bg-slate-50/50">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                                        Hospital / Association #{index + 1}
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
                                    <div className="space-y-1 md:col-span-2">
                                        <Label className="text-xs">Hospital / Clinic / Organization Name</Label>
                                        <Input
                                            value={item.past_associations || ""}
                                            onChange={(e) => handleChangeItem(index, "past_associations", e.target.value)}
                                            placeholder="e.g. City General Hospital"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs">Start Year / Period</Label>
                                        <Input
                                            value={item.career_start || ""}
                                            onChange={(e) => handleChangeItem(index, "career_start", e.target.value)}
                                            placeholder="e.g. 2018 or 2018 - Present"
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
                            className="gap-1.5 text-xs rounded-xl"
                        >
                            <Plus className="h-3.5 w-3.5" /> Add Experience
                        </Button>

                        <div className="flex items-center gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setIsEditing(false)}
                                disabled={updateProfileMutation.isPending}
                                className="rounded-xl text-xs"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                size="sm"
                                onClick={handleSave}
                                disabled={updateProfileMutation.isPending}
                                className="gap-1.5 rounded-xl text-xs"
                            >
                                {updateProfileMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                                {updateProfileMutation.isPending ? "Saving..." : "Save Experience"}
                            </Button>
                        </div>
                    </div>
                </Card>
            ) : (
                <>
                    {validItems.length === 0 ? (
                        <div className="p-8 text-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50">
                            <Briefcase className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                            <p className="text-sm font-medium text-slate-600">No working experience recorded yet.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {validItems.map((exp, index: number) => {
                                const companyName = exp.past_associations;
                                const periodStr = hasRealValue(exp.career_start) ? String(exp.career_start) : null;
                                return (
                                    <ProfileItemCard
                                        key={index}
                                        icon={<Briefcase className="h-5 w-5" />}
                                        title={companyName}
                                        subtitle={exp.role && exp.role !== "Doctor" ? exp.role : undefined}
                                        meta={periodStr}
                                        description={exp.description}
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