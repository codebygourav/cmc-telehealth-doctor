"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import { useAuth } from "@/context/userContext";
import { useSearchParams, useRouter } from "next/navigation";
import { Pill, FileUser, Loader2 } from "lucide-react";
import AddPrescriptionDialog from "@/components/pages/appoitment/AddPrescriptionDialog";
import CompleteConsultationDialog from "@/components/pages/appoitment/CompleteConsultationDialog";
import { usePrescriptionByAppointmentId } from "@/queries/usePrescriptionByAppointmentId";

import { cleanAndDeduplicateText, parseClinicalInstructions } from "@/src/utils/cleanClinicalText";

const ConsultationContent = () => {

    const searchParams = useSearchParams();
    const router = useRouter();
    const { user } = useAuth();
    // Always join under the signed-in doctor's own name. Whereby remembers the last typed name in
    // this browser, so a link without displayName would reuse another doctor's name.
    const roomUrl = useMemo(() => {
        const raw = searchParams.get("room_url");
        if (!raw) return raw;
        const name = [user?.first_name, user?.last_name].filter(Boolean).join(" ").trim();
        if (!name) return raw;
        try {
            const url = new URL(raw);
            url.searchParams.set("displayName", /^dr\.?\s/i.test(name) ? name : `Dr. ${name}`);
            return url.toString();
        } catch {
            return raw;
        }
    }, [searchParams, user?.first_name, user?.last_name]);
    const appointmentId = searchParams.get("appointment_id");

    const [joined, setJoined] = useState(false);
    const [chatOpen, setChatOpen] = useState(false);
    const [isPrescribeDialogOpen, setIsPrescribeDialogOpen] = useState(false);
    // Leaving the call asks "complete this appointment?"; it is never completed automatically.
    const [askComplete, setAskComplete] = useState(false);
    const [callKey, setCallKey] = useState(0);
    const rejoin = () => setCallKey((k) => k + 1);

    const { data: prescriptionData } = usePrescriptionByAppointmentId(appointmentId || "");

    const medicines = prescriptionData?.data?.medicines || [];
    const rawInstructions = prescriptionData?.data?.instructions_by_doctor;
    const parsedClinical = parseClinicalInstructions(rawInstructions);
    const instructionsByDoctor = parsedClinical.instructionsByDoctor;
    const diagnosis = prescriptionData?.data?.diagnosis || parsedClinical.diagnosis;
    const orderInvestigation = prescriptionData?.data?.order_investigation || parsedClinical.orderInvestigation;
    const rawPrescriptionNotes = prescriptionData?.data?.notes;
    const rawClinicalNotes = prescriptionData?.data?.clinical_notes;
    const isDistinctPrescriptionNote =
        Boolean(rawPrescriptionNotes) &&
        (!rawClinicalNotes || rawPrescriptionNotes.trim() !== rawClinicalNotes.trim());
    const notes =
        (isDistinctPrescriptionNote ? rawPrescriptionNotes : undefined) ||
        parsedClinical.notes ||
        undefined;
    const confidentialNotes = prescriptionData?.data?.confidential_notes;

    const instructionsParts = rawInstructions ? rawInstructions.split("Recommended Tests:") : [];
    const rawFindings = instructionsParts[0] ? instructionsParts[0].replace("Clinical Findings:", "").trim() : "";
    const initialFindings = cleanAndDeduplicateText(rawFindings);
    const initialRecommendedTests = instructionsParts[1] ? cleanAndDeduplicateText(instructionsParts[1]) : "";
    const nextVisitDate = prescriptionData?.data?.next_visit_date;
    const dictationAssistant = prescriptionData?.data?.dictation_assistant ?? null;

    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            // Whereby sends postMessage events from the iframe
            if (event.data?.type === "join") {
                setJoined(true);
            }
            if (event.data?.type === "leave") {
                setJoined(false);
                setChatOpen(false);
                if (appointmentId) setAskComplete(true);
            }
            // Fires when chat or people panel opens/closes
            if (event.data?.type === "chat_toggle" || event.data?.type === "people_toggle") {
                setChatOpen(event.data?.open ?? false);
            }
        };

        window.addEventListener("message", handleMessage);
        return () => window.removeEventListener("message", handleMessage);
    }, [appointmentId]);

    if (!roomUrl) {
        return (
            <div className="flex h-screen w-full items-center justify-center p-4 text-sm text-destructive">
                No Room URL provided.
            </div>
        );
    }

    return (
        // h-dvh: the visible screen height on phones (h-screen is taller than Safari's view and "sticks").
        <div className="relative h-dvh w-full overflow-hidden bg-[#063a28]">

            {/* Whereby iframe — full default Whereby UI */}
            <iframe
                key={callKey}
                src={roomUrl}
                allow="camera; microphone; fullscreen; speaker; display-capture"
                className="w-full h-full border-none"
            />

            {/* Floating Action Buttons placed right before Cam */}
            {joined && (
                // Phones: top-left corner (Whereby's control bar spans the whole bottom). Desktop: bottom-left.
                <div className="absolute left-3 top-3 z-50 flex items-center gap-2 sm:left-5 sm:top-auto sm:bottom-1 sm:gap-3">
                    <button
                        type="button"
                        onClick={() => {
                            window.open(`/appointments/${appointmentId}`, '_blank');
                        }}
                        className="flex flex-col items-center gap-1 group cursor-pointer"
                        title="View Patient Details"
                    >
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#0000008f] rounded-xl flex items-center justify-center hover:bg-[#000000af] transition-all shadow-md border border-white/10 group-hover:scale-105">
                            <FileUser color="#fff" className="w-5 h-5 sm:w-6 sm:h-6" />
                        </div>
                        <span className="font-inter font-bold text-[10px] sm:text-xs text-white drop-shadow-md">
                            Patient
                        </span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setIsPrescribeDialogOpen(true)}
                        className="flex flex-col items-center gap-1 group cursor-pointer"
                        title="Build Prescription"
                    >
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#0000008f] rounded-xl flex items-center justify-center hover:bg-[#000000af] transition-all shadow-md border border-white/10 group-hover:scale-105">
                            <Pill color="#fff" className="w-5 h-5 sm:w-6 sm:h-6" />
                        </div>
                        <span className="font-inter font-bold text-[10px] sm:text-xs text-white drop-shadow-md">
                            Prescribe
                        </span>
                    </button>
                </div>
            )}

            {appointmentId && (
                <CompleteConsultationDialog
                    open={askComplete}
                    onOpenChange={setAskComplete}
                    appointmentId={appointmentId}
                    onRejoin={rejoin}
                    onCompleted={() => router.push(`/appointments/${appointmentId}`)}
                />
            )}

            {appointmentId && (
                <AddPrescriptionDialog
                    open={isPrescribeDialogOpen}
                    onOpenChange={setIsPrescribeDialogOpen}
                    appointmentId={appointmentId}
                    showRecordTab
                    initialTab="medicines"
                    assistantConfig={dictationAssistant}
                    initialMedicines={medicines}
                    initialFindings={initialFindings}
                    initialNextVisitDate={nextVisitDate}
                    initialRecommendedTests={initialRecommendedTests}
                    initialGeneralNotes={prescriptionData?.data?.follow_up_note}
                    initialDiagnosis={diagnosis}
                    initialOrderInvestigation={orderInvestigation}
                    initialNotes={notes}
                    initialConfidentialNotes={confidentialNotes}
                    initialInstructionsByDoctor={instructionsByDoctor}
                />
            )}
        </div>
    );
};

export default function StartConsultation() {
    return (
        <Suspense
            fallback={
                <div className="flex h-screen w-full items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            }
        >
            <ConsultationContent />
        </Suspense>
    );
}