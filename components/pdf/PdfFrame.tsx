"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";

/** Zoom choices passed to the browser PDF viewer (#zoom / #view open parameters). */
const ZOOMS = [
  ["page-fit", "Fit page"],
  ["page-width", "Fit width"],
  ["50", "50%"],
  ["75", "75%"],
  ["100", "100%"],
  ["125", "125%"],
  ["150", "150%"],
  ["200", "200%"],
] as const;
type Zoom = (typeof ZOOMS)[number][0];

const hashFor = (zoom: Zoom) =>
  zoom === "page-fit" ? "view=Fit" : zoom === "page-width" ? "view=FitH" : `zoom=${zoom}`;

/** A PDF in an iframe with a zoom picker. Starts at "Fit page" so the whole page is visible. */
export default function PdfFrame({ url, title, className = "" }: { url: string; title: string; className?: string }) {
  const [zoom, setZoom] = useState<Zoom>("page-fit");
  const index = ZOOMS.findIndex(([key]) => key === zoom);
  const numeric = ZOOMS.filter(([key]) => /^\d+$/.test(key));
  const step = (direction: 1 | -1) => {
    const current = /^\d+$/.test(zoom) ? Number(zoom) : 100;
    const next = direction === 1
      ? numeric.find(([key]) => Number(key) > current)
      : [...numeric].reverse().find(([key]) => Number(key) < current);
    if (next) setZoom(next[0]);
  };

  return (
    <div className={`flex min-h-0 flex-1 flex-col ${className}`}>
      <div className="flex shrink-0 items-center justify-end gap-1.5 border-b border-slate-200 bg-white px-3 py-1.5">
        <span className="mr-1 text-[11px] font-medium text-slate-500">Zoom</span>
        <button type="button" onClick={() => step(-1)} className="rounded-md border border-slate-200 p-1 text-slate-600 hover:border-primary/40 hover:text-primary" title="Zoom out">
          <Minus className="h-3.5 w-3.5" />
        </button>
        <select
          value={zoom}
          onChange={(e) => setZoom(e.target.value as Zoom)}
          className="h-7 rounded-md border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-700 focus:border-primary focus:outline-none"
          aria-label="PDF zoom"
        >
          {ZOOMS.map(([key, label]) => <option key={key} value={key}>{label}</option>)}
        </select>
        <button type="button" onClick={() => step(1)} className="rounded-md border border-slate-200 p-1 text-slate-600 hover:border-primary/40 hover:text-primary" title="Zoom in" disabled={index === ZOOMS.length - 1}>
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
      {/* key: the viewer only reads the zoom when it loads, so reload on change. */}
      <iframe
        key={zoom}
        src={`${url}#toolbar=0&navpanes=0&${hashFor(zoom)}`}
        title={title}
        className="block h-full min-h-[60vh] w-full flex-1 border-0 bg-slate-100"
      />
    </div>
  );
}
