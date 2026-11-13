"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

interface PaginationControlsProps {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    onPageChange: (page: number) => void;
    /** Optional page-size picker (sizes come from the admin setting). */
    perPage?: number | "all";
    perPageOptions?: number[];
    allowAll?: boolean;
    onPerPageChange?: (value: number | "all") => void;
}

export default function PaginationControls({
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    onPageChange,
    perPage,
    perPageOptions,
    allowAll,
    onPerPageChange,
}: PaginationControlsProps) {
    const hasPicker = !!onPerPageChange && (perPageOptions?.length ?? 0) > 0;

    if (totalPages <= 1 && !hasPicker) return null;
    if (totalItems === 0) return null;

    return (
        <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row items-center gap-3 sm:gap-4 justify-between">
            {/* Results Info */}
            <p className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
                Showing{" "}
                <span className="font-medium">
                    {(currentPage - 1) * itemsPerPage + 1}
                </span>{" "}
                to{" "}
                <span className="font-medium">
                    {Math.min(currentPage * itemsPerPage, totalItems)}
                </span>{" "}
                of <span className="font-medium">{totalItems}</span> results
            </p>

            {hasPicker && (
                <label className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                    Show
                    <select
                        value={String(perPage ?? itemsPerPage)}
                        onChange={(e) => onPerPageChange!(e.target.value === "all" ? "all" : Number(e.target.value))}
                        className="h-8 rounded-md border border-slate-300 bg-white px-2 text-sm font-medium text-slate-900 outline-none focus:border-primary"
                    >
                        {perPageOptions!.map((n) => <option key={n} value={n}>{n}</option>)}
                        {allowAll && <option value="all">All</option>}
                    </select>
                    per page
                </label>
            )}

            {/* Pagination Buttons */}
            <div className={`flex items-center gap-1 sm:gap-2 ${totalPages <= 1 ? "invisible" : ""}`}>
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => onPageChange(1)}
                    disabled={currentPage === 1}
                    className="h-8 w-8 sm:h-9 sm:w-9"
                >
                    <ChevronsLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </Button>

                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="h-8 w-8 sm:h-9 sm:w-9"
                >
                    <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </Button>

                {/* Page Indicator - WITH FULL TEXT LIKE ABOVE */}
                <div className="min-w-[140px] sm:min-w-[83px] text-center">
                    <p className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
                        Page{" "}
                        <span className="font-medium">{currentPage}</span>{" "}
                        of{" "}
                        <span className="font-medium">{totalPages}</span>
                    </p>
                </div>

                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="h-8 w-8 sm:h-9 sm:w-9"
                >
                    <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </Button>

                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => onPageChange(totalPages)}
                    disabled={currentPage === totalPages}
                    className="h-8 w-8 sm:h-9 sm:w-9"
                >
                    <ChevronsRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </Button>
            </div>
        </div>
    );
}