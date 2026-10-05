import { Video, MapPin } from "lucide-react";
import { OPDSlot } from "@/types/schedule";
import { cn } from "@/lib/utils";

interface OPDSlotCardProps {
    slot: OPDSlot;
    isSelected: boolean;
    onClick: () => void;
}

export const OPDSlotCard = ({ slot, isSelected, onClick }: OPDSlotCardProps) => {
    const isVideo = slot.consultation_type === "video";
    const booked = slot.booked_count || 0;
    const capacity = slot.slot_capacity || slot.capacity || 0;
    const pct = capacity ? Math.min(100, Math.round((booked / capacity) * 100)) : 0;

    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                "w-full rounded-lg border p-3 text-left transition-colors",
                isSelected ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border hover:bg-muted/50"
            )}
        >
            <div className="flex items-start justify-between gap-2">
                <span className="text-sm font-semibold">{slot.time_range}</span>
                <span
                    className={cn(
                        "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
                        isVideo ? "bg-blue-50 text-blue-700" : "bg-purple-50 text-purple-700"
                    )}
                >
                    {isVideo ? <Video className="h-3 w-3" /> : <MapPin className="h-3 w-3" />}
                    {isVideo ? "Video" : "In-Clinic"}
                </span>
            </div>
            <div className="mt-2.5 flex items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-xs text-muted-foreground">
                    {booked}{capacity ? `/${capacity}` : ""} booked
                </span>
            </div>
        </button>
    );
};
