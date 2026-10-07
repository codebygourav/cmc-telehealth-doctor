"use client";

import { useState, useEffect } from "react";
import { Globe, Edit, Save, Loader2 } from "lucide-react";
import { ProfileItemCard } from "./profileItemCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/context/userContext";
import { useUpdateDoctorProfile } from "@/queries/useProfile";

interface SocialLinks {
    facebook?: string;
    twitter?: string;
    linkedin?: string;
    instagram?: string;
    website?: string;
    [key: string]: string | undefined;
}

interface SocialLinksSectionProps {
    socialMedia?: SocialLinks;
}

export default function SocialLinksSection({
    socialMedia,
}: SocialLinksSectionProps) {
    const { user } = useAuth();
    const updateProfileMutation = useUpdateDoctorProfile();
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        facebook: socialMedia?.facebook || "",
        twitter: socialMedia?.twitter || "",
        linkedin: socialMedia?.linkedin || "",
        instagram: socialMedia?.instagram || "",
        website: socialMedia?.website || "",
    });

    useEffect(() => {
        if (socialMedia) {
            setFormData({
                facebook: socialMedia.facebook || "",
                twitter: socialMedia.twitter || "",
                linkedin: socialMedia.linkedin || "",
                instagram: socialMedia.instagram || "",
                website: socialMedia.website || "",
            });
        }
    }, [socialMedia]);

    const handleSave = async () => {
        if (!user?.id) return;
        try {
            await updateProfileMutation.mutateAsync({
                userId: user.id,
                group: "social_media",
                data: {
                    social_links: formData,
                },
            });
            setIsEditing(false);
        } catch (err) {
            console.error("Failed to update social media links:", err);
        }
    };

    const safeSocialMedia = socialMedia
        ? Object.entries(socialMedia)
            .filter(([, url]) => !!url)
            .map(([platform, url], index) => ({
                id: index + 1,
                platform,
                url: url as string,
            }))
        : [];

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                <div>
                    <h2 className="text-[#1F1E1E] font-semibold text-lg">Social Media Links</h2>
                    <p className="text-[#4D4D4D] text-sm">Your professional online presence</p>
                </div>
                {!isEditing && (
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditing(true)}
                        className="text-xs h-8 px-3 rounded-md gap-1.5 font-semibold text-primary border-primary/30 bg-primary/5 hover:bg-primary/10"
                    >
                        <Edit className="h-3.5 w-3.5" /> Edit Social Links
                    </Button>
                )}
            </div>

            {isEditing ? (
                <Card className="border-border p-4 sm:p-5 space-y-4 rounded-2xl">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="facebook">Facebook URL</Label>
                            <Input
                                id="facebook"
                                value={formData.facebook}
                                onChange={(e) => setFormData((p) => ({ ...p, facebook: e.target.value }))}
                                placeholder="https://facebook.com/yourprofile"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="twitter">Twitter / X URL</Label>
                            <Input
                                id="twitter"
                                value={formData.twitter}
                                onChange={(e) => setFormData((p) => ({ ...p, twitter: e.target.value }))}
                                placeholder="https://twitter.com/yourprofile"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="linkedin">LinkedIn URL</Label>
                            <Input
                                id="linkedin"
                                value={formData.linkedin}
                                onChange={(e) => setFormData((p) => ({ ...p, linkedin: e.target.value }))}
                                placeholder="https://linkedin.com/in/yourprofile"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="instagram">Instagram URL</Label>
                            <Input
                                id="instagram"
                                value={formData.instagram}
                                onChange={(e) => setFormData((p) => ({ ...p, instagram: e.target.value }))}
                                placeholder="https://instagram.com/yourprofile"
                            />
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="website">Website / Portfolio URL</Label>
                            <Input
                                id="website"
                                value={formData.website}
                                onChange={(e) => setFormData((p) => ({ ...p, website: e.target.value }))}
                                placeholder="https://yourwebsite.com"
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsEditing(false)}
                            disabled={updateProfileMutation.isPending}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            onClick={handleSave}
                            disabled={updateProfileMutation.isPending}
                            className="gap-1.5"
                        >
                            {updateProfileMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            {updateProfileMutation.isPending ? "Saving..." : "Save Links"}
                        </Button>
                    </div>
                </Card>
            ) : (
                <div className="grid gap-4 xl:grid-cols-2">
                    {safeSocialMedia.length > 0 ? (
                        safeSocialMedia.map((social) => (
                            <ProfileItemCard
                                key={social.id}
                                icon={<Globe className="h-6 w-6" />}
                                title={
                                    social.platform.charAt(0).toUpperCase() +
                                    social.platform.slice(1)
                                }
                                subtitle={social.url}
                                isView={true}
                                viewUrl={social.url}
                            />
                        ))
                    ) : (
                        <p className="text-sm text-muted-foreground">
                            No social media links available.
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}