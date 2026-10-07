import React from "react";

interface StatsCardProps {
    title: string;
    value: number | string;
    badgeText?: string;
    icon?: React.ReactNode;
    subTitle?: string;
    iconBgColor?: string;
    progress?: string;
    progressBgColor?: string;
}

export default function StatsCard({
    title,
    value,
    icon,
    iconBgColor,
}: StatsCardProps) {
    return (
        <div className="bg-white border border-border/80 rounded-xl p-3.5 sm:p-4 shadow-2xs hover:shadow-xs transition-all flex items-center justify-between gap-3">
            <div className="space-y-1 min-w-0">
                <p className="text-muted-foreground text-xs sm:text-sm font-medium truncate">
                    {title}
                </p>
                <p className="text-foreground font-bold text-xl sm:text-2xl leading-none">
                    {value}
                </p>
            </div>
            {icon && (
                <div
                    className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl flex items-center justify-center shrink-0 shadow-2xs"
                    style={{ backgroundColor: iconBgColor || "rgba(var(--primary), 0.08)" }}
                >
                    {icon}
                </div>
            )}
        </div>
    );
}