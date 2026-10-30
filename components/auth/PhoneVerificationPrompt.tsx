"use client";

/**
 * Doctors: verify the WhatsApp number (optional). The popup is shown ONCE per doctor (on this
 * browser): after "Later" or verifying it never shows again. The profile card is always there.
 */

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/context/userContext";
import api from "@/lib/axios";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Smartphone } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import MobileVerifyForm, { type VerifiedPhone } from "./MobileVerifyForm";

export interface PhoneStatus {
    phone_verified: boolean;
    verified_phone: string | null;
    profile_phone: string | null;
    country_code: string | null;
}

export const phoneStatusKey = (userId?: string) => ["phone-status", userId];

export function usePhoneStatus() {
    const { user, initializing } = useAuth();
    return useQuery({
        queryKey: phoneStatusKey(user?.id),
        queryFn: async () => (await api.get<{ data: PhoneStatus }>("/auth/phone/status")).data.data,
        enabled: !initializing && !!user?.id,
        staleTime: 10 * 60 * 1000,
        retry: false,
    });
}

/** After a successful verification: the signed-in doctor and the cached status follow the new number. */
export function usePhoneVerified() {
    const { user, updateUser } = useAuth();
    const queryClient = useQueryClient();

    return async (result: VerifiedPhone, status: PhoneStatus | undefined, message?: string) => {
        await updateUser({ phone: result.phone, phone_verified: true });
        queryClient.setQueryData(phoneStatusKey(user?.id), {
            ...(status ?? {}),
            phone_verified: true,
            verified_phone: result.verified_phone,
            profile_phone: result.phone,
            country_code: result.country_code,
        });
        toast.success(message || "WhatsApp number verified.");
    };
}

const seenKey = (userId: string) => `doctor_whatsapp_prompt_seen:${userId}`;

export default function PhoneVerificationPrompt() {
    const { user } = useAuth();
    const { data: status } = usePhoneStatus();
    const onVerified = usePhoneVerified();
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (!user?.id || !status || status.phone_verified) return;
        try {
            if (localStorage.getItem(seenKey(user.id))) return;
            // Shown once: remembered right away, so a reload never brings it back.
            localStorage.setItem(seenKey(user.id), new Date().toISOString());
        } catch {
            return; // storage blocked: don't risk showing it on every page
        }
        setOpen(true);
    }, [user?.id, status]);

    if (!open || !status) return null;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="w-[calc(100%-2rem)] max-w-md max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-2xl p-5 sm:p-6">
                <DialogHeader className="items-center text-center sm:text-center">
                    <span className="mb-1 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Smartphone className="h-6 w-6" />
                    </span>
                    <DialogTitle className="text-xl font-semibold">Verify your WhatsApp number</DialogTitle>
                    <DialogDescription className="text-sm leading-relaxed">
                        Optional. Verify it once to get appointment updates on WhatsApp. You can also do this later from your profile.
                    </DialogDescription>
                </DialogHeader>

                <MobileVerifyForm
                    initialCountryCode={status.country_code}
                    initialNumber={status.profile_phone}
                    submitLabel="Verify"
                    onVerified={async (result, message) => {
                        await onVerified(result, status, message);
                        setOpen(false);
                    }}
                />

                <button type="button" onClick={() => setOpen(false)} className="mx-auto text-sm font-medium text-slate-500 hover:text-slate-800">
                    Later
                </button>
            </DialogContent>
        </Dialog>
    );
}
