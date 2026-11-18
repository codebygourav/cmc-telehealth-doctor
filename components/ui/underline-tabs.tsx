"use client";

import type { ComponentType } from "react";
import { cn } from "@/lib/utils";

export interface UnderlineTabItem<K extends string> {
  key: K;
  label: string;
  icon?: ComponentType<{ className?: string }>;
  count?: number;
}

/**
 * Secondary (nested) tabs: text with an underline on the active one. Main tabs use the filled
 * primary pill; anything inside them uses this so the two levels are easy to tell apart.
 */
export default function UnderlineTabs<K extends string>({
  items,
  value,
  onChange,
  className,
  stretch = false,
}: {
  items: UnderlineTabItem<K>[];
  value: K;
  onChange: (key: K) => void;
  className?: string;
  stretch?: boolean;
}) {
  return (
    <div role="tablist" className={cn("flex items-end gap-4 overflow-x-auto border-b border-slate-200", className)}>
      {items.map(({ key, label, icon: Icon, count }) => {
        const active = key === value;
        return (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(key)}
            className={cn(
              "-mb-px inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap border-b-2 px-1 pb-2 pt-1 text-[13px]! font-medium! leading-5! transition-colors",
              stretch && "flex-1",
              active ? "border-primary text-primary" : "border-transparent text-slate-500 hover:text-slate-800",
            )}
          >
            {Icon && <Icon className="h-3.5 w-3.5 shrink-0" />}
            {label}
            {typeof count === "number" && (
              <span
                className={cn(
                  "min-w-5 rounded-full px-1.5 text-center text-[11px] font-semibold leading-[18px]",
                  active ? "bg-primary text-white" : "bg-slate-100 text-slate-600",
                )}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
