"use client";

/**
 * Doctors are reminded to verify their mobile number (WhatsApp code). Optional: "Later" hides it
 * for this browser session. Verified, they get password codes on WhatsApp and sign in with it.
 */

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/context/userContext";
import api from "@/lib/axios";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { LogOut, Smartphone } from "lucide-react";
import { toast } from "sonner";
import MobileVerifyForm from "./MobileVerifyForm";

export interface PhoneStatus {
    phone_verified: boolean;
    verified_phone: string | null;
    requires_phone_verification: boolean;
    suggest_phone_verification?: boolean;
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

const DISMISS_KEY = "doctor_phone_reminder_dismissed";

const PhoneVerificationGate = () => {
    const { user, updateUser, logout } = useAuth();
    const queryClient = useQueryClient();
    const { data: status } = usePhoneStatus();
    const [dismissed, setDismissed] = useState(() => {
        try {
            return typeof window !== "undefined" && sessionStorage.getItem(DISMISS_KEY) === "1";
        } catch {
            return false;
        }
    });

    const required = !!status?.requires_phone_verification;
    if (!user?.id || !status || !(required || (status.suggest_phone_verification && !dismissed))) return null;

    const later = () => {
        try {
            sessionStorage.setItem(DISMISS_KEY, "1");
        } catch {
            // Private mode: it simply shows again on the next page load.
        }
        setDismissed(true);
    };

    return (
        <Dialog open onOpenChange={(open) => !open && !required && later()}>
            <DialogContent
                className="w-[calc(100%-2rem)] max-w-md max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-2xl p-5 sm:p-6"
                onEscapeKeyDown={(e) => required && e.preventDefault()}
                onInteractOutside={(e) => e.preventDefault()}
            >
                <DialogHeader className="items-center text-center sm:text-center">
                    <span className="mb-1 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Smartphone className="h-6 w-6" />
                    </span>
                    <DialogTitle className="text-xl font-semibold">Verify your mobile number</DialogTitle>
                    <DialogDescription className="text-sm leading-relaxed">
                        Verify it once to sign in with your mobile number and get password codes and updates on WhatsApp. You can do this later.
                    </DialogDescription>
                </DialogHeader>

                <MobileVerifyForm
                    initialCountryCode={status.country_code}
                    initialNumber={status.profile_phone}
                    submitLabel="Verify and continue"
                    onVerified={async (result, message) => {
                        await updateUser({ phone: result.phone, phone_verified: true, requires_phone_verification: false, suggest_phone_verification: false });
                        queryClient.setQueryData(phoneStatusKey(user.id), {
                            ...status,
                            phone_verified: true,
                            verified_phone: result.verified_phone,
                            requires_phone_verification: false,
                            suggest_phone_verification: false,
                            profile_phone: result.phone,
                            country_code: result.country_code,
                        });
                        toast.success(message || "Mobile number verified.");
                    }}
                />

                {required ? (
                    <button
                        type="button"
                        onClick={() => logout()}
                        className="mx-auto flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800"
                    >
                        <LogOut className="h-4 w-4" /> Sign out
                    </button>
                ) : (
                    <button type="button" onClick={later} className="mx-auto text-sm font-medium text-slate-500 hover:text-slate-800">
                        Later
                    </button>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default PhoneVerificationGate;
