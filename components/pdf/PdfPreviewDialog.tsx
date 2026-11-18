"use client";

import type { ReactNode } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import PdfFrame from "./PdfFrame";

export interface PdfPreview {
  title: string;
  url: string; // object URL of the PDF blob
  filename: string;
}

/** Preview a freshly built PDF, then download it. */
export default function PdfPreviewDialog({
  preview,
  loading = false,
  onClose,
  subtitle = "Just rebuilt with the latest saved data.",
  closeLabel = "Close",
  action,
}: {
  preview: PdfPreview | null;
  loading?: boolean;
  onClose: () => void;
  subtitle?: string;
  closeLabel?: string;
  /** Replaces the Download button (e.g. "Save & Submit" for an unsaved draft preview). */
  action?: ReactNode;
}) {
  const download = () => {
    if (!preview) return;
    const link = document.createElement("a");
    link.href = preview.url;
    link.download = preview.filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <Dialog open={!!preview || loading} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex h-[92vh] w-[95vw] flex-col gap-0 overflow-hidden rounded-2xl p-0 sm:max-w-5xl!">
        <DialogHeader className="shrink-0 border-b border-slate-200 px-5 py-3">
          <DialogTitle className="text-base font-semibold">{preview?.title ?? "Preparing PDF…"}</DialogTitle>
          <DialogDescription className="text-xs text-slate-500">{subtitle}</DialogDescription>
        </DialogHeader>
        {preview ? (
          <PdfFrame url={preview.url} title={preview.title} />
        ) : (
          <div className="flex flex-1 items-center justify-center bg-slate-50 text-sm text-slate-500">
            <Loader2 className="mr-2 h-5 w-5 animate-spin text-primary" /> Building the PDF…
          </div>
        )}
        <div className="flex shrink-0 justify-end gap-2 border-t border-slate-200 px-5 py-3">
          <Button type="button" variant="outline" onClick={onClose}>{closeLabel}</Button>
          {action ?? (
            <Button type="button" onClick={download} disabled={!preview} className="sm:min-w-44 font-semibold">
              <Download className="mr-2 h-4 w-4" /> Download PDF
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
