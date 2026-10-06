import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { ReactNode } from "react";
import { Button } from "@/components/ui";

interface ProfileItemCardProps {
  icon?: ReactNode;
  imageSrc?: string | null;
  imageAlt?: string;
  title?: string | null;
  subtitle?: string | null;
  meta?: string | null;
  badge?: ReactNode;
  description?: string | null;
  actions?: ReactNode;
  iconClassName?: string;
  isView?: boolean;
  viewUrl?: string | null;
}

const isBlankOrNA = (val?: string | null): boolean => {
  if (!val) return true;
  const norm = val.trim().toLowerCase();
  return (
    norm === "" ||
    norm === "n/a" ||
    norm === "null" ||
    norm === "undefined" ||
    norm === "unknown" ||
    norm === "no description available" ||
    norm === "organization not provided" ||
    norm === "issuer not provided" ||
    norm === "untitled award" ||
    norm === "untitled certificate" ||
    norm === "n/a - n/a" ||
    norm === "—"
  );
};

export function ProfileItemCard({
  icon,
  imageSrc,
  imageAlt = "Profile item image",
  title,
  subtitle,
  meta,
  badge,
  description,
  actions,
  iconClassName = "bg-primary/10 text-primary",
  isView = false,
  viewUrl,
}: ProfileItemCardProps) {
  const handleView = () => {
    if (viewUrl) {
      window.open(viewUrl, "_blank", "noopener,noreferrer");
    }
  };

  const cleanTitle = isBlankOrNA(title) ? "" : title?.trim();
  const cleanSubtitle = isBlankOrNA(subtitle) ? null : subtitle?.trim();
  const cleanMeta = isBlankOrNA(meta) ? null : meta?.trim();
  const cleanDescription = isBlankOrNA(description) ? null : description?.trim();

  return (
    <Card className="w-full border-border rounded-2xl shadow-2xs">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start gap-4">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl ${iconClassName}`}
          >
            {imageSrc ? (
              <Image
                src={imageSrc}
                alt={imageAlt}
                width={44}
                height={44}
                className="h-full w-full object-cover"
              />
            ) : (
              icon
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                {cleanTitle && (
                  <h4 className="font-bold text-sm sm:text-base text-slate-800 break-words">
                    {cleanTitle}
                  </h4>
                )}

                {cleanSubtitle && (
                  <p className="text-xs sm:text-sm font-medium text-slate-500 break-words mt-0.5">
                    {cleanSubtitle}
                  </p>
                )}
              </div>

              {badge}
            </div>

            {cleanMeta && (
              <p className="mt-1 text-xs font-semibold text-primary/80 break-words">
                {cleanMeta}
              </p>
            )}

            {cleanDescription && (
              <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed break-words">
                {cleanDescription}
              </p>
            )}

            {actions && <div className="mt-3">{actions}</div>}
          </div>

          {isView && viewUrl && (
            <div className="shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={handleView}
                className="text-xs h-8 px-3 rounded-xl border-primary/30 text-primary hover:bg-primary/10"
              >
                View
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}