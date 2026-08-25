"use client";

import AppointmentCard from "@/components/pages/appoitment/AppointmentCard";
import AppointmentFilters from "@/components/pages/appoitment/AppointmentFilters";
import CustomTabs, { TabItem } from "@/components/custom/CustomTabs";
import PaginationControls from "@/components/pagination/PaginationControls";
import { useMyAppointments } from "@/queries/useAppointments";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import HeroSection from "@/components/ui/hero-section";

const AppointmentsContent = () => {
    const searchParams = useSearchParams();
    const router = useRouter();
    const tabParam = searchParams.get("tab");
    const defaultTab =
        tabParam && ["today", "upcoming", "past", "all"].includes(tabParam)
            ? tabParam
            : "today";
    const [activeTab, setActiveTab] = useState(defaultTab);
    const [currentPage, setCurrentPage] = useState(1);
    const [isMounted, setIsMounted] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedFilter, setSelectedFilter] = useState("all");
    const [selectedType, setSelectedType] = useState("all");

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const { data, isLoading, error } = useMyAppointments(activeTab, currentPage);
    const appointments = Array.isArray(data?.data) ? data.data : [];
    const pagination = data?.pagination;

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

    // ✅ Unique status list
    const statusOptions = [
        { value: "all", label: "All Status" },
        ...Array.from(
            new Map(
                appointments.map((apt: any) => [
                    apt.status,
                    { value: apt.status, label: apt.status_label },
                ]),
            ).values(),
        ),
    ];

    useEffect(() => {
        if (tabParam && ["today", "upcoming", "past", "all"].includes(tabParam)) {
            setActiveTab(tabParam);
            setCurrentPage(1);
        }
    }, [tabParam]);

    const handleTabChange = (value: string) => {
        setActiveTab(value);
        setCurrentPage(1);
    };

    // ✅ Filters
    const applyFilters = (list: any[]) => {
        return list.filter((apt) => {
            const name = apt.patient?.name?.toLowerCase() || apt.patient_name?.toLowerCase() || "";
            const reason = apt.reason?.toLowerCase() || apt.appointment_reason?.toLowerCase() || "";
            const matchesSearch = name.includes(searchQuery.toLowerCase()) || reason.includes(searchQuery.toLowerCase());
            const matchesStatus =
                selectedFilter === "all" || apt.status === selectedFilter;
            const type = (apt.consultation_type || "").toLowerCase();
            const matchesType =
                selectedType === "all" ||
                (selectedType === "video" && type === "video") ||
                (selectedType === "in-person" && (type === "in-person" || type === "clinic"));
            return matchesSearch && matchesStatus && matchesType;
        });
    };

    const filteredAppointments = applyFilters(appointments);

    // ✅ Render Cards & Pagination
    const renderCardsWithPagination = () => {
        if (!filteredAppointments.length) {
            return (
                <div className="text-center py-12">
                    <p className="text-muted-foreground">No appointments found</p>
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
                            variant={activeTab as "today" | "upcoming" | "past" | "all"}
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
    if (!isMounted || isLoading) {
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

            {/* Tabs */}
            <CustomTabs
                tabs={appointmentTabs}
                activeTab={activeTab}
                onTabChange={handleTabChange}
                tabsListClassName="w-full md:max-w-lg overflow-x-auto overflow-y-hidden scrollbar-hide flex-nowrap justify-start sm:justify-start md:justify-start lg:justify-start [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
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
