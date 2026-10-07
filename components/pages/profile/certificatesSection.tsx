"use client";

import { useState, useEffect } from "react";
import { FileText, Edit, Save, Plus, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { ProfileItemCard } from "./profileItemCard";
import { useAuth } from "@/context/userContext";
import { useUpdateDoctorProfile } from "@/queries/useProfile";
import { toast } from "sonner";

interface CertificateItem {
    id?: number | string;
    name?: string | null;
    issuer?: string | null;
    issue_date?: string | null;
    expiry_date?: string | null;
    organization?: string | null;
    certification_image?: string | null;
}

interface CertificatesSectionProps {
    certificates?: CertificateItem[];
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
        norm !== "untitled certificate" &&
        norm !== "issuer not provided" &&
        norm !== "n/a - n/a" &&
        norm !== "—"
    );
};

export default function CertificatesSection({
    certificates = [],
}: CertificatesSectionProps) {
    const { user } = useAuth();
    const updateProfileMutation = useUpdateDoctorProfile();
    const [isEditing, setIsEditing] = useState(false);

    const rawCertificates = Array.isArray(certificates) ? certificates : [];
    const [items, setItems] = useState<CertificateItem[]>([]);

    useEffect(() => {
        const cleanInitial = rawCertificates
            .map((item) => ({
                name: hasRealValue(item.name) ? String(item.name) : "",
                organization: hasRealValue(item.organization || item.issuer)
                    ? String(item.organization || item.issuer)
                    : "",
                issue_date: hasRealValue(item.issue_date) ? String(item.issue_date) : "",
                expiry_date: hasRealValue(item.expiry_date) ? String(item.expiry_date) : "",
                certification_image: item.certification_image || "",
            }))
            .filter((item) => item.name || item.organization || item.issue_date);

        setItems(cleanInitial);
    }, [certificates]);

    const handleAddItem = () => {
        setItems((prev) => [
            ...prev,
            { name: "", organization: "", issue_date: "", expiry_date: "" },
        ]);
    };

    const handleRemoveItem = (index: number) => {
        setItems((prev) => prev.filter((_, i) => i !== index));
    };

    const handleChangeItem = (index: number, field: keyof CertificateItem, value: string) => {
        setItems((prev) =>
            prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
        );
    };

    const handleSave = async () => {
        if (!user?.id) return;
        const validPayloadItems = items
            .map((item) => ({
                name: item.name?.trim() || "",
                organization: item.organization?.trim() || "",
                issue_date: item.issue_date?.trim() || "",
                expiry_date: item.expiry_date?.trim() || "",
            }))
            .filter((item) => item.name || item.organization);

        try {
            await updateProfileMutation.mutateAsync({
                userId: user.id,
                group: "certifications_info",
                data: {
                    certifications_info: validPayloadItems,
                },
            });
            toast.success("Certificates updated successfully!");
            setIsEditing(false);
        } catch (err) {
            console.error("Failed to update certificates:", err);
            toast.error("Failed to update certificates");
        }
    };

    const validCertificates = items.filter(
        (cert) =>
            cert &&
            (hasRealValue(cert.name) ||
                hasRealValue(cert.organization) ||
                hasRealValue(cert.issuer))
    );

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                <div>
                    <h2 className="text-[#1F1E1E] font-semibold text-lg">Certificates & Licenses</h2>
                    <p className="text-[#4D4D4D] text-sm">Your professional certifications</p>
                </div>
                {!isEditing && (
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditing(true)}
                        className="text-xs h-8 px-3 rounded-md gap-1.5 font-semibold text-primary border-primary/30 bg-primary/5 hover:bg-primary/10"
                    >
                        <Edit className="h-3.5 w-3.5" /> Edit Certificates
                    </Button>
                )}
            </div>

            {isEditing ? (
                <Card className="border-border p-4 sm:p-5 space-y-4 rounded-2xl">
                    {items.length === 0 ? (
                        <p className="text-sm text-slate-500 italic text-center py-4">
                            No certificates listed. Click below to add a certificate.
                        </p>
                    ) : (
                        items.map((item, index) => (
                            <div key={index} className="p-4 border border-slate-200 rounded-md space-y-3 bg-slate-50/50">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                                        Certificate #{index + 1}
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
                                        <Label className="text-xs">Certificate Name</Label>
                                        <Input
                                            value={item.name || ""}
                                            onChange={(e) => handleChangeItem(index, "name", e.target.value)}
                                            placeholder="e.g. Advanced Cardiac Life Support"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs">Issuing Organization</Label>
                                        <Input
                                            value={item.organization || ""}
                                            onChange={(e) => handleChangeItem(index, "organization", e.target.value)}
                                            placeholder="e.g. American Heart Association"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs">Issue Date</Label>
                                        <Input
                                            value={item.issue_date || ""}
                                            onChange={(e) => handleChangeItem(index, "issue_date", e.target.value)}
                                            placeholder="e.g. 2022-01-15"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs">Expiry Date (Optional)</Label>
                                        <Input
                                            value={item.expiry_date || ""}
                                            onChange={(e) => handleChangeItem(index, "expiry_date", e.target.value)}
                                            placeholder="e.g. 2025-01-15"
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
                            <Plus className="h-3.5 w-3.5" /> Add Certificate
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
                                {updateProfileMutation.isPending ? "Saving..." : "Save Certificates"}
                            </Button>
                        </div>
                    </div>
                </Card>
            ) : (
                <>
                    {validCertificates.length === 0 ? (
                        <div className="p-8 text-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50">
                            <FileText className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                            <p className="text-sm font-medium text-slate-600">No certificates recorded yet.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {validCertificates.map((cert, index) => {
                                const hasIssue = hasRealValue(cert.issue_date);
                                const hasExpiry = hasRealValue(cert.expiry_date);

                                let metaText: string | null = null;
                                if (hasIssue && hasExpiry) {
                                    metaText = `${cert.issue_date} - ${cert.expiry_date}`;
                                } else if (hasIssue) {
                                    metaText = `Issued: ${cert.issue_date}`;
                                } else if (hasExpiry) {
                                    metaText = `Expires: ${cert.expiry_date}`;
                                }

                                const orgOrIssuer = cert.organization || cert.issuer;

                                return (
                                    <ProfileItemCard
                                        key={index}
                                        icon={<FileText className="h-6 w-6" />}
                                        title={cert.name}
                                        subtitle={orgOrIssuer}
                                        meta={metaText}
                                        isView={!!cert.certification_image}
                                        viewUrl={cert.certification_image}
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