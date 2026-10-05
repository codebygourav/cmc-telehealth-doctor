import { ReactNode } from "react";
import { OPDSlotCard } from "./OPDSlotCard";
import { OPDSlot } from "@/types/schedule";

interface ScheduleCardProps {
    emptyIcon?: ReactNode;
    emptyMessage?: string;
    emptySubMessage?: string;
    OPDSlotsForSelectedDate: OPDSlot[];
    selectedSlot?: OPDSlot;
    onSlotClick: (slot: OPDSlot) => void;
}

const DoctorOpdSchedule = ({
    emptyIcon,
    OPDSlotsForSelectedDate,
    selectedSlot,
    onSlotClick,
    emptyMessage = "No data available",
    emptySubMessage = "Select a date to view details"
}: ScheduleCardProps) => {
    if (!OPDSlotsForSelectedDate.length) {
        return (
            <div className="rounded-lg border border-dashed py-10 text-center text-muted-foreground">
                {emptyIcon}
                <p className="text-sm">{emptyMessage}</p>
                <p className="text-xs">{emptySubMessage}</p>
            </div>
        );
    }

    return (
        <div className="space-y-2 md:max-h-[520px] md:overflow-y-auto">
            {OPDSlotsForSelectedDate.map((slot, index) => (
                <OPDSlotCard
                    key={slot.id || index}
                    slot={slot}
                    isSelected={selectedSlot?.id === slot.id}
                    onClick={() => onSlotClick(slot)}
                />
            ))}
        </div>
    )
}

export default DoctorOpdSchedule;
