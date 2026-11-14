"use client";

import AppointmentCard from "@/components/pages/appoitment/AppointmentCard";
import AppointmentFilters from "@/components/pages/appoitment/AppointmentFilters";
import CustomTabs, { TabItem } from "@/components/custom/CustomTabs";
import PaginationControls from "@/components/pagination/PaginationControls";
import { useMyAppointments } from "@/queries/useAppointments";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import HeroSection from "@/components/ui/hero-section";
import { Skeleton } from "@/components/ui/skeleton";

const AppointmentsContent = () => {
    const searchParams = useSearchParams();
    const router = useRouter();
    const tabParam = searchParams.get("tab");
    const defaultTab =
        tabParam && ["pending_confirmation", "today", "upcoming", "past", "all"].includes(tabParam)
            ? tabParam
            : "all";
    const [activeTab, setActiveTab] = useState(defaultTab);
    const [currentPage, setCurrentPage] = useState(1);
    const [isMounted, setIsMounted] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedFilter, setSelectedFilter] = useState("all");
    const [selectedType, setSelectedType] = useState("all");
    const [perPage, setPerPage] = useState<number | "all" | undefined>(undefined); // undefined = admin default
    // Search goes to the server after a short pause in typing.
    const [debouncedSearch, setDebouncedSearch] = useState("");
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchQuery.trim()), 400);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Tab, search, status, type and page size are applied by the server over ALL appointments.
    const { data, isLoading, isFetching, isPlaceholderData, error } = useMyAppointments(activeTab, currentPage, {
        search: debouncedSearch,
        status: selectedFilter,
        consultationType: selectedType,
        perPage,
    });
    const appointments = Array.isArray(data?.data) ? data.data : [];
    const pagination = data?.pagination;
    const listMeta = data as any;

    // Reset pagination to page 1 when query filters or search query change
    const handleSearchQueryChange = (query: string) => {
        setSearchQuery(query);
        setCurrentPage(1);
    };

    const handleSelectedFilterChange = (filter: string) => {
        setSelectedFilter(filter);
        setCurrentPage(1);
    };

    const handleSelectedTypeChange = (type: string) => {
        setSelectedType(type);
        setCurrentPage(1);
    };

    // Status choices of the current tab, from the server (with counts).
    const statusOptions = [
        { value: "all", label: "All Status" },
        ...((listMeta?.status_options ?? []) as { value: string; label: string; count: number }[])
            .map((o) => ({ value: o.value, label: `${o.label} (${o.count})` })),
    ];

    useEffect(() => {
        if (tabParam && ["pending_confirmation", "today", "upcoming", "past", "all"].includes(tabParam)) {
            setActiveTab(tabParam);
            setCurrentPage(1);
        }
    }, [tabParam]);

    const handleTabChange = (value: string) => {
        setActiveTab(value);
        setSelectedFilter("all"); // statuses differ per tab
        setCurrentPage(1);
    };

    useEffect(() => {
        setCurrentPage(1);
    }, [debouncedSearch]);

    // The server already filtered and ordered the list (today -> future; "Past" newest first).
    const filteredAppointments = appointments;

    // ✅ Render Cards & Pagination
    const renderCardsWithPagination = () => {
        // New results loading (search, filter, page, page size, tab): skeleton cards.
        if (isLoading || isPlaceholderData) {
            const count = Math.min(Number(perPage === "all" ? 9 : (perPage ?? listMeta?.default_per_page ?? 9)), 9);
            return (
                <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3" aria-busy="true" aria-label="Loading appointments">
                    {Array.from({ length: count }).map((_, i) => (
                        <div key={i} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
                            <div className="flex items-center gap-3">
                                <Skeleton className="h-11 w-11 rounded-full" />
                                <div className="flex-1 space-y-2">
                                    <Skeleton className="h-4 w-2/3" />
                                    <Skeleton className="h-3 w-1/2" />
                                </div>
                                <Skeleton className="h-6 w-20 rounded-full" />
                            </div>
                            <Skeleton className="mt-4 h-10 w-full rounded-lg" />
                            <div className="mt-4 grid grid-cols-2 gap-4">
                                <div className="space-y-2"><Skeleton className="h-3 w-12" /><Skeleton className="h-4 w-28" /></div>
                                <div className="space-y-2"><Skeleton className="h-3 w-16" /><Skeleton className="h-4 w-32" /></div>
                            </div>
                            <div className="mt-4 grid grid-cols-2 gap-3">
                                <Skeleton className="h-9 w-full rounded-md" />
                                <Skeleton className="h-9 w-full rounded-md" />
                            </div>
                        </div>
                    ))}
                </div>
            );
        }
        if (!filteredAppointments.length) {
            return (
                <div className="text-center py-12">
                    <p className="text-muted-foreground">
                        {debouncedSearch || selectedFilter !== "all" || selectedType !== "all" ? "No appointments match your search or filters" : "No appointments found"}
                    </p>
                </div>
            );
        }

        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 mt-5">
                    {filteredAppointments.map((apt: any, index: number) => (
                        <AppointmentCard
                            key={apt.appointment_id || index}
                            appointment={apt}
                            variant={(activeTab === "pending_confirmation" ? "upcoming" : activeTab) as "today" | "upcoming" | "past" | "all"}
                        />
                    ))}
                </div>

                {pagination && (
                    <PaginationControls
                        currentPage={pagination.current_page || currentPage}
                        totalPages={pagination.last_page || 1}
                        totalItems={pagination.total || filteredAppointments.length}
                        itemsPerPage={pagination.per_page || 10}
                        onPageChange={(page) => setCurrentPage(page)}
                        perPage={perPage ?? listMeta?.default_per_page ?? pagination.per_page}
                        perPageOptions={listMeta?.per_page_options}
                        allowAll={listMeta?.allow_all}
                        onPerPageChange={(value) => { setPerPage(value); setCurrentPage(1); }}
                    />
                )}
            </div>
        );
    };

    // ✅ Tabs with correct data
    const appointmentTabs: TabItem[] = [
        {
            key: "all",
            label: "All",
            content: activeTab === "all" ? renderCardsWithPagination() : null,
        },
        {
            key: "pending_confirmation",
            label: "Awaiting Confirmation",
            content: activeTab === "pending_confirmation" ? renderCardsWithPagination() : null,
        },
        {
            key: "today",
            label: "Today",
            content: activeTab === "today" ? renderCardsWithPagination() : null,
        },
        {
            key: "upcoming",
            label: "Upcoming",
            content: activeTab === "upcoming" ? renderCardsWithPagination() : null,
        },
        {
            key: "past",
            label: "Past",
            content: activeTab === "past" ? renderCardsWithPagination() : null,
        },
    ];

    // ✅ Loading & Error
    if (!isMounted) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-12">
                <p className="text-red-500">Something went wrong. Please try again.</p>
            </div>
        );
    }

    const urgentUnconfirmed = appointments.filter((apt: any) => {
        const type = String(apt.consultation_type || "").toLowerCase();
        if (type !== "video") return false;

        const isUnconfirmed =
            apt.awaiting_confirmation === true ||
            apt.can_confirm === true ||
            ["awaiting_confirmation", "pending_confirmation"].includes(String(apt.status).toLowerCase());
        if (!isUnconfirmed) return false;

        const now = new Date();
        const dateStr = String(apt.appointment_date || apt.date || "").slice(0, 10);
        const apptD = new Date(dateStr);
        if (isNaN(apptD.getTime())) return false;

        const isToday =
            apptD.getFullYear() === now.getFullYear() &&
            apptD.getMonth() === now.getMonth() &&
            apptD.getDate() === now.getDate();
        if (!isToday) return false;

        const timeStr = String(apt.appointment_time || apt.time || "").trim();
        if (!timeStr) return true;

        let hours = 0;
        let minutes = 0;
        const match12 = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
        if (match12) {
            hours = parseInt(match12[1], 10);
            minutes = parseInt(match12[2], 10);
            const ampm = match12[3]?.toUpperCase();
            if (ampm === "PM" && hours < 12) hours += 12;
            if (ampm === "AM" && hours === 12) hours = 0;
        } else {
            const parts = timeStr.split(":");
            if (parts.length >= 2) {
                hours = parseInt(parts[0], 10);
                minutes = parseInt(parts[1], 10);
            }
        }

        const apptStartTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
        const diffMs = apptStartTime.getTime() - now.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);

        return diffHours <= 2.0;
    });

    return (
        <div className="container-max-width w-full mx-auto space-y-6">

                <HeroSection title="My Appointments" description="Connect with world-class specialists curated for your health journey. Expert clinical care delivered with a human touch." />

                {/* Filters */}
                <AppointmentFilters
                    searchQuery={searchQuery}
                    selectedFilter={selectedFilter}
                    selectedType={selectedType}
                    setSearchQuery={handleSearchQueryChange}
                    setSelectedFilter={handleSelectedFilterChange}
                    setSelectedType={handleSelectedTypeChange}
                    statusOptions={statusOptions}
                />

                {isFetching && (
                    <p className="-mt-3 flex items-center gap-2 text-xs font-medium text-slate-500" role="status">
                        <span className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" /> Loading appointments…
                    </p>
                )}

                {/* Tabs */}
                <CustomTabs
                    tabs={appointmentTabs}
                    activeTab={activeTab}
                    onTabChange={handleTabChange}
                    tabsListClassName="w-full md:max-w-2xl overflow-x-auto overflow-y-hidden scrollbar-hide flex-nowrap justify-start sm:justify-start md:justify-start lg:justify-start [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                />
            </div>
    );
};

const Appointments = () => {
    return (
        <Suspense
            fallback={
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            }
        >
            <AppointmentsContent />
        </Suspense>
    );
};

export default Appointments;
