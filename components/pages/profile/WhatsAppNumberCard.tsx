"use client";

/** Doctor profile: the WhatsApp number, with "Verify number" / "Change number" (code on WhatsApp). */

import MobileVerifyForm from "@/components/auth/MobileVerifyForm";
import { usePhoneStatus, usePhoneVerified } from "@/components/auth/PhoneVerificationPrompt";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BadgeCheck, Smartphone } from "lucide-react";
import { useState } from "react";

export default function WhatsAppNumberCard() {
    const { data: status } = usePhoneStatus();
    const onVerified = usePhoneVerified();
    const [open, setOpen] = useState(false);

    if (!status) return null;
    const shown = status.verified_phone ? `+${status.verified_phone}` : status.profile_phone || "No number yet";

    return (
        <div className="mb-4 flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Smartphone className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                    <p className="text-sm text-slate-500">WhatsApp number</p>
                    <p className="flex flex-wrap items-center gap-2 font-semibold text-slate-900">
                        <span className="break-all">{shown}</span>
                        {status.phone_verified ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                                <BadgeCheck className="h-3.5 w-3.5" /> Verified
                            </span>
                        ) : (
                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">Not verified</span>
                        )}
                    </p>
                </div>
            </div>
            <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => setOpen(true)}>
                {status.phone_verified ? "Change number" : "Verify number"}
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="w-[calc(100%-2rem)] max-w-md max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-2xl p-5 sm:p-6">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-semibold">{status.phone_verified ? "Change WhatsApp number" : "Verify WhatsApp number"}</DialogTitle>
                        <DialogDescription>We send a 6-digit code on WhatsApp to confirm the number.</DialogDescription>
                    </DialogHeader>
                    {open && (
                        <MobileVerifyForm
                            initialCountryCode={status.country_code}
                            initialNumber={status.phone_verified ? null : status.profile_phone}
                            currentVerified={status.verified_phone}
                            submitLabel={status.phone_verified ? "Confirm new number" : "Verify"}
                            onVerified={async (result, message) => {
                                await onVerified(result, status, message);
                                setOpen(false);
                            }}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
