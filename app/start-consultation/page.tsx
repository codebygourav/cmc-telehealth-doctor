"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Pill, FileUser, Loader2 } from "lucide-react";
import AddPrescriptionDialog from "@/components/pages/appoitment/AddPrescriptionDialog";
import { usePrescriptionByAppointmentId } from "@/queries/usePrescriptionByAppointmentId";

import { cleanAndDeduplicateText, parseClinicalInstructions } from "@/src/utils/cleanClinicalText";

const ConsultationContent = () => {

    const searchParams = useSearchParams();
    const router = useRouter();
    const roomUrl = searchParams.get("room_url");
    const appointmentId = searchParams.get("appointment_id");

    const [joined, setJoined] = useState(false);
    const [chatOpen, setChatOpen] = useState(false);
    const [isPrescribeDialogOpen, setIsPrescribeDialogOpen] = useState(false);

    const { data: prescriptionData } = usePrescriptionByAppointmentId(appointmentId || "");

    const medicines = prescriptionData?.data?.medicines || [];
    const rawInstructions = prescriptionData?.data?.instructions_by_doctor;
    const parsedClinical = parseClinicalInstructions(rawInstructions);
    const instructionsByDoctor = parsedClinical.instructionsByDoctor;
    const diagnosis = prescriptionData?.data?.diagnosis || parsedClinical.diagnosis;
    const orderInvestigation = prescriptionData?.data?.order_investigation || parsedClinical.orderInvestigation;
    const notes = prescriptionData?.data?.notes || parsedClinical.notes;
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
            }
            // Fires when chat or people panel opens/closes
            if (event.data?.type === "chat_toggle" || event.data?.type === "people_toggle") {
                setChatOpen(event.data?.open ?? false);
            }
        };

        window.addEventListener("message", handleMessage);
        return () => window.removeEventListener("message", handleMessage);
    }, []);

    if (!roomUrl) {
        return (
            <div className="flex h-screen w-full items-center justify-center p-4 text-sm text-destructive">
                No Room URL provided.
            </div>
        );
    }

    return (
        <div className="relative w-full h-screen">

            {/* Whereby iframe — full default Whereby UI */}
            <iframe
                src={roomUrl}
                allow="camera; microphone; fullscreen; speaker; display-capture"
                className="w-full h-full border-none"
            />

            {/* Floating Action Buttons placed right before Cam */}
            {joined && (
                <div
                    className={`fixed z-50 flex items-center gap-2 sm:gap-3 transition-all duration-300 ${chatOpen
                        ? "bottom-1 right-[calc(50%+410px)] md:right-[calc(50%+405px)] max-[768px]:right-[calc(50%+325px)] max-[480px]:right-[calc(50%+260px)]"
                        : "bottom-1 right-[calc(50%+250px)] md:right-[calc(50%+245px)] max-[768px]:right-[calc(50%+165px)] max-[480px]:right-[calc(50%+100px)]"
                        }`}
                >
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
                <AddPrescriptionDialog
                    open={isPrescribeDialogOpen}
                    onOpenChange={setIsPrescribeDialogOpen}
                    appointmentId={appointmentId}
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