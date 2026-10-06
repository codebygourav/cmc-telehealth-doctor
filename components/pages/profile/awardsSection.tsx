"use client";

import { useState, useEffect } from "react";
import { Award, Edit, Save, Plus, Trash2, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { ProfileItemCard } from "./profileItemCard";
import { useAuth } from "@/context/userContext";
import { useUpdateDoctorProfile } from "@/queries/useProfile";
import { toast } from "sonner";

interface AwardItem {
    award_image?: string;
    title?: string;
    organization?: string;
    year?: number | string;
    description?: string;
}

interface AwardsSectionProps {
    awards: {
        awards_info?: AwardItem[];
    } | any;
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
        norm !== "no description available" &&
        norm !== "organization not provided" &&
        norm !== "untitled award" &&
        norm !== "—"
    );
};

export default function AwardsSection({ awards }: AwardsSectionProps) {
    const { user } = useAuth();
    const updateProfileMutation = useUpdateDoctorProfile();
    const [isEditing, setIsEditing] = useState(false);

    const rawAwards: AwardItem[] = Array.isArray(awards?.awards_info)
        ? awards.awards_info
        : Array.isArray(awards)
            ? awards
            : [];

    const [items, setItems] = useState<AwardItem[]>([]);

    useEffect(() => {
        const cleanInitial = rawAwards
            .map((item) => ({
                title: hasRealValue(item.title) ? String(item.title) : "",
                organization: hasRealValue(item.organization) ? String(item.organization) : "",
                year: hasRealValue(item.year) ? String(item.year) : "",
                description: hasRealValue(item.description) ? String(item.description) : "",
                award_image: item.award_image || "",
            }))
            .filter((item) => item.title || item.organization || item.year || item.description);

        setItems(cleanInitial);
    }, [awards]);

    const handleAddItem = () => {
        setItems((prev) => [
            ...prev,
            { title: "", organization: "", year: "", description: "" },
        ]);
    };

    const handleRemoveItem = (index: number) => {
        setItems((prev) => prev.filter((_, i) => i !== index));
    };

    const handleChangeItem = (index: number, field: keyof AwardItem, value: string) => {
        setItems((prev) =>
            prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
        );
    };

    const handleSave = async () => {
        if (!user?.id) return;
        const validPayloadItems = items
            .map((item) => ({
                title: item.title?.trim() || "",
                organization: item.organization?.trim() || "",
                year: item.year ? String(item.year).trim() : "",
                description: item.description?.trim() || "",
            }))
            .filter((item) => item.title || item.organization || item.year || item.description);

        try {
            await updateProfileMutation.mutateAsync({
                userId: user.id,
                group: "awards_info",
                data: {
                    awards_info: validPayloadItems,
                },
            });
            toast.success("Awards updated successfully!");
            setIsEditing(false);
        } catch (err) {
            console.error("Failed to update awards:", err);
            toast.error("Failed to update awards");
        }
    };

    const validAwards = items.filter(
        (award) =>
            award &&
            (hasRealValue(award.title) ||
                hasRealValue(award.organization) ||
                hasRealValue(award.description) ||
                hasRealValue(award.year))
    );

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                <div>
                    <h2 className="text-[#1F1E1E] font-semibold text-lg">Awards & Recognition</h2>
                    <p className="text-[#4D4D4D] text-sm">Your professional achievements</p>
                </div>
                {!isEditing && (
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditing(true)}
                        className="text-xs h-8 px-3 rounded-xl gap-1.5 font-semibold text-primary border-primary/30 bg-primary/5 hover:bg-primary/10"
                    >
                        <Edit className="h-3.5 w-3.5" /> Edit Awards
                    </Button>
                )}
            </div>

            {isEditing ? (
                <Card className="border-border p-4 sm:p-5 space-y-4 rounded-2xl">
                    {items.length === 0 ? (
                        <p className="text-sm text-slate-500 italic text-center py-4">
                            No awards listed. Click below to add an award.
                        </p>
                    ) : (
                        items.map((item, index) => (
                            <div key={index} className="p-4 border border-slate-200 rounded-xl space-y-3 bg-slate-50/50 relative">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                                        Award #{index + 1}
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
                                        <Label className="text-xs">Award Title</Label>
                                        <Input
                                            value={item.title || ""}
                                            onChange={(e) => handleChangeItem(index, "title", e.target.value)}
                                            placeholder="e.g. Best Doctor Award"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs">Organization / Issuer</Label>
                                        <Input
                                            value={item.organization || ""}
                                            onChange={(e) => handleChangeItem(index, "organization", e.target.value)}
                                            placeholder="e.g. Medical Association"
                                        />
                                    </div>
                                    <div className="space-y-1 md:col-span-2">
                                        <Label className="text-xs">Year</Label>
                                        <Input
                                            value={item.year || ""}
                                            onChange={(e) => handleChangeItem(index, "year", e.target.value)}
                                            placeholder="e.g. 2024"
                                        />
                                    </div>
                                    <div className="space-y-1 md:col-span-2">
                                        <Label className="text-xs">Description (Optional)</Label>
                                        <Textarea
                                            value={item.description || ""}
                                            onChange={(e) => handleChangeItem(index, "description", e.target.value)}
                                            placeholder="Brief description of the award..."
                                            rows={2}
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
                            <Plus className="h-3.5 w-3.5" /> Add Award
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
                                {updateProfileMutation.isPending ? "Saving..." : "Save Awards"}
                            </Button>
                        </div>
                    </div>
                </Card>
            ) : (
                <>
                    {validAwards.length === 0 ? (
                        <div className="p-8 text-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50">
                            <Award className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                            <p className="text-sm font-medium text-slate-600">No awards or recognition recorded yet.</p>
                        </div>
                    ) : (
                        <div className="grid gap-4 xl:grid-cols-2">
                            {validAwards.map((award, index: number) => {
                                const yearStr = award.year ? String(award.year).trim() : "";
                                const showBadge = hasRealValue(yearStr);

                                return (
                                    <ProfileItemCard
                                        key={index}
                                        imageSrc={award.award_image}
                                        imageAlt={award.title || "Award image"}
                                        icon={<Award className="h-6 w-6" />}
                                        title={award.title}
                                        subtitle={award.organization}
                                        description={award.description}
                                        badge={showBadge ? <Badge variant="secondary">{yearStr}</Badge> : undefined}
                                        iconClassName="bg-amber-50 text-amber-500"
                                        isView={!!award.award_image}
                                        viewUrl={award.award_image}
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