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
        <div className="-mx-3 flex gap-2 overflow-x-auto px-3 pb-1 snap-x md:mx-0 md:block md:space-y-2 md:overflow-x-visible md:px-0 md:max-h-[520px] md:overflow-y-auto">
            {OPDSlotsForSelectedDate.map((slot, index) => (
                <div key={slot.id || index} className="w-[220px] shrink-0 snap-start md:w-auto">
                <OPDSlotCard
                    slot={slot}
                    isSelected={selectedSlot?.id === slot.id}
                    onClick={() => onSlotClick(slot)}
                />
                </div>
            ))}
        </div>
    )
}

export default DoctorOpdSchedule;
