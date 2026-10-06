"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Edit, Save, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/userContext";
import { useUpdateDoctorProfile } from "@/queries/useProfile";

interface AddressItem {
    address_line1: string | null;
    address_line2: string | null;
    area: string | null;
    landmark: string | null;
    city: string | null;
    state: string | null;
    country: string | null;
    pincode: string | null;
}

interface AddressSectionProps {
    address: AddressItem | null;
}

export default function AddressSection({ address }: AddressSectionProps) {
    const { user } = useAuth();
    const updateProfileMutation = useUpdateDoctorProfile();
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        address_line1: address?.address_line1 || "",
        address_line2: address?.address_line2 || "",
        area: address?.area || "",
        landmark: address?.landmark || "",
        city: address?.city || "",
        state: address?.state || "",
        country: address?.country || "",
        pincode: address?.pincode || "",
    });

    useEffect(() => {
        if (address) {
            setFormData({
                address_line1: address.address_line1 || "",
                address_line2: address.address_line2 || "",
                area: address.area || "",
                landmark: address.landmark || "",
                city: address.city || "",
                state: address.state || "",
                country: address.country || "",
                pincode: address.pincode || "",
            });
        }
    }, [address]);

    const handleSave = async () => {
        if (!user?.id) return;
        try {
            await updateProfileMutation.mutateAsync({
                userId: user.id,
                group: "address",
                data: formData,
            });
            setIsEditing(false);
        } catch (err) {
            console.error("Failed to update address:", err);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                <div>
                    <h2 className="text-[#1F1E1E] font-semibold text-lg">Manage Address</h2>
                    <p className="text-[#4D4D4D] text-sm">Enter your practice addresses to help patients find you</p>
                </div>
                {!isEditing && (
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditing(true)}
                        className="text-xs h-8 px-3 rounded-xl gap-1.5 font-semibold text-primary border-primary/30 bg-primary/5 hover:bg-primary/10"
                    >
                        <Edit className="h-3.5 w-3.5" /> Edit Address
                    </Button>
                )}
            </div>

            {isEditing ? (
                <Card className="border-border p-4 sm:p-5 space-y-4 rounded-2xl">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="address_line1">Address Line 1</Label>
                            <Input
                                id="address_line1"
                                value={formData.address_line1}
                                onChange={(e) => setFormData((p) => ({ ...p, address_line1: e.target.value }))}
                                placeholder="Street address or clinic location"
                            />
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="address_line2">Address Line 2</Label>
                            <Input
                                id="address_line2"
                                value={formData.address_line2}
                                onChange={(e) => setFormData((p) => ({ ...p, address_line2: e.target.value }))}
                                placeholder="Apartment, suite, unit, etc."
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="area">Area / Locality</Label>
                            <Input
                                id="area"
                                value={formData.area}
                                onChange={(e) => setFormData((p) => ({ ...p, area: e.target.value }))}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="landmark">Landmark</Label>
                            <Input
                                id="landmark"
                                value={formData.landmark}
                                onChange={(e) => setFormData((p) => ({ ...p, landmark: e.target.value }))}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="city">City</Label>
                            <Input
                                id="city"
                                value={formData.city}
                                onChange={(e) => setFormData((p) => ({ ...p, city: e.target.value }))}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="state">State</Label>
                            <Input
                                id="state"
                                value={formData.state}
                                onChange={(e) => setFormData((p) => ({ ...p, state: e.target.value }))}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="country">Country</Label>
                            <Input
                                id="country"
                                value={formData.country}
                                onChange={(e) => setFormData((p) => ({ ...p, country: e.target.value }))}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="pincode">Pincode / Postal Code</Label>
                            <Input
                                id="pincode"
                                value={formData.pincode}
                                onChange={(e) => setFormData((p) => ({ ...p, pincode: e.target.value }))}
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
                            {updateProfileMutation.isPending ? "Saving..." : "Save Address"}
                        </Button>
                    </div>
                </Card>
            ) : (
                <div className="grid gap-4 lg:grid-cols-2">
                    <Card className="border-border rounded-2xl">
                        <CardHeader>
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-2">
                                    <MapPin className="h-5 w-5 text-primary" />
                                    <CardTitle className="text-base">Primary Address</CardTitle>
                                </div>
                                <Badge className="bg-primary text-primary-foreground">Primary</Badge>
                            </div>
                        </CardHeader>

                        <CardContent className="space-y-3">
                            <div className="space-y-1">
                                {address?.address_line1 && <p className="text-sm font-medium">{address.address_line1}</p>}
                                {address?.address_line2 && <p className="text-sm">{address.address_line2}</p>}
                                {address?.area && <p className="text-sm">{address.area}</p>}
                                {address?.landmark && <p className="text-sm text-muted-foreground">Landmark: {address.landmark}</p>}
                                <p className="text-sm">
                                    {address?.city || "-"}, {address?.state || "-"} {address?.pincode || "-"}
                                </p>
                                {address?.country && <p className="text-sm">{address.country}</p>}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}