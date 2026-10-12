"use client";

import InstallAppButton from "@/components/InstallAppButton";
import PasswordSection from "@/components/pages/profile/passwordSection";
import ProfileEditor, { type ProfileStepKey } from "@/components/pages/profile/profileEditor";
import ProfileHeader from "@/components/pages/profile/profileHeader";
import ReviewsSection from "@/components/pages/profile/reviewsSection";
import { Button } from "@/components/ui";
import HeroSection from "@/components/ui/hero-section";
import { useAuth } from "@/context/userContext";
import { cn } from "@/lib/utils";
import { useDoctorHome } from "@/queries/useHome";
import { useDoctorProfile } from "@/queries/useProfile";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Award, BookOpenText, Globe, CalendarClock, ChevronDown, ChevronLeft, ChevronRight, FileBadge, GraduationCap, KeyRound, ListPlus, MapPinPen, Medal, Trophy, User, UserStar } from "lucide-react";
import { useMemo, useState } from "react";

type TabKey = ProfileStepKey | "reviews" | "password";

// Same steps, in the same order, as Admin → Doctors → Edit, plus International Payment.
const PROFILE_STEPS: { key: ProfileStepKey; label: string; icon: typeof User }[] = [
    { key: "basic", label: "Basic Info", icon: User },
    { key: "availability", label: "Availability", icon: CalendarClock },
    { key: "bio", label: "Professional Bio", icon: BookOpenText },
    { key: "education", label: "Education", icon: GraduationCap },
    { key: "awards", label: "Awards", icon: Trophy },
    { key: "certificates", label: "Certificates", icon: FileBadge },
    { key: "experience", label: "Experience", icon: Award },
    { key: "fellowships", label: "Fellowships", icon: Medal },
    { key: "additional", label: "Additional Information", icon: ListPlus },
    { key: "contact", label: "Contact", icon: MapPinPen },
    // Not an admin form step: the doctor's own international payment switch and fee.
    { key: "international", label: "International Payment", icon: Globe },
];

const ProfilePage = () => {

    const [activeTab, setActiveTab] = useState<TabKey>("basic");
    const [isMobileProfileDrawerOpen, setIsMobileProfileDrawerOpen] = useState(false);

    const { user } = useAuth();
    const { data, isLoading, isError, error } = useDoctorProfile();
    const { data: homeData } = useDoctorHome();

    const profile = data?.data;
    const homeProfile = homeData?.data;
    const personalInfo = profile?.personal_information as any;
    const reviewSummary = profile?.review_summary ?? undefined;

    const sidebarItems: { key: TabKey; label: string; icon: typeof User; step?: number }[] = [
        ...PROFILE_STEPS.map((step, index) => ({ ...step, step: index + 1 })),
        { key: "reviews", label: "Reviews", icon: UserStar },
        { key: "password", label: "Change Password", icon: KeyRound },
    ];

    const activeSidebarItem = sidebarItems.find((i) => i.key === activeTab);
    const activeStepIndex = PROFILE_STEPS.findIndex((step) => step.key === activeTab);

    const fullName = `${personalInfo?.first_name ?? ""} ${personalInfo?.last_name ?? ""}`.trim() || "Doctor";
    const initials = `${personalInfo?.first_name?.[0] ?? ""}${personalInfo?.last_name?.[0] ?? ""}` || "DR";
    const primaryDepartment = personalInfo?.doctor_departments?.[0]?.department_name || "General Practice";
    const primaryRole = personalInfo?.doctor_departments?.[0]?.role || "Doctor";

    const reviews = useMemo(() => {
        return homeProfile?.doctor_reviews?.map((review, index) => ({
            id: parseInt(review.id) || index + 1,
            patient: review.patient_name,
            rating: review.rating,
            date: review.created_at,
            comment: review.content,
            patient_image: review.patient_image,
        })) || [];
    }, [homeProfile?.doctor_reviews]);

    if (isLoading) {
        return (
            <div className="flex min-h-[300px] items-center justify-center">
                <p className="text-sm text-muted-foreground">Loading profile...</p>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="flex min-h-[300px] items-center justify-center">
                <p className="text-sm text-red-500">
                    {getErrorMessage(error)}
                </p>
            </div>
        );
    }

    return (
        <div className="container-max-width w-full mx-auto">

            <HeroSection title="Profile" description="Edit your profile information and manage your account" />

            <ProfileHeader
                fullName={fullName}
                avatar={personalInfo?.avatar ?? ""}
                initials={initials}
                department={primaryDepartment}
                role={primaryRole}
                email={personalInfo?.email ?? ""}
                phone={personalInfo?.phone ?? user?.phone ?? ""}
                license={personalInfo?.medical_license_number ?? ""}
                reviewSummary={reviewSummary}
            />

            {/* Install the portal as an app (Android, iPhone, computer). */}
            <InstallAppButton appName="CMC Telehealth Doctor" className="mt-4" />

            {/* Mobile Profile Section Selector Trigger */}
            <div className="block md:hidden mb-4 mt-4">
                <button
                    type="button"
                    onClick={() => setIsMobileProfileDrawerOpen(true)}
                    className="w-full flex items-center justify-between gap-2 p-3 bg-white border border-slate-200 rounded-md shadow-xs text-slate-700 hover:bg-slate-50 transition-colors"
                >
                    <div className="flex items-center gap-2.5 font-medium text-sm text-slate-800">
                        {activeSidebarItem && <activeSidebarItem.icon className="h-4 w-4 text-primary shrink-0" />}
                        <span>Section: <strong className="text-primary font-bold">{activeSidebarItem?.label}</strong></span>
                    </div>
                    <div className="flex items-center gap-1 text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-md">
                        Change
                        <ChevronDown className="h-3.5 w-3.5" />
                    </div>
                </button>
            </div>

            {/* Mobile Bottom Sheet Drawer for Profile Sections */}
            <Dialog open={isMobileProfileDrawerOpen} onOpenChange={setIsMobileProfileDrawerOpen}>
                <DialogContent className="max-w-md w-full p-4 rounded-t-2xl sm:rounded-2xl fixed bottom-0 md:bottom-auto translate-y-0 sm:translate-y-0 max-h-[85vh] overflow-y-auto">
                    <DialogHeader className="pb-2 border-b border-slate-100">
                        <DialogTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                            <User className="h-4 w-4 text-primary" />
                            Select Profile Section
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-2 space-y-1">
                        {sidebarItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = activeTab === item.key;
                            return (
                                <button
                                    key={item.key}
                                    type="button"
                                    onClick={() => {
                                        setActiveTab(item.key);
                                        setIsMobileProfileDrawerOpen(false);
                                    }}
                                    className={`w-full flex items-center justify-between p-3 rounded-md text-xs sm:text-sm font-semibold transition-all ${isActive
                                        ? "bg-primary text-white shadow-xs font-bold"
                                        : "text-slate-700 hover:bg-slate-100"
                                        }`}
                                >
                                    <div className="flex items-center gap-2.5">
                                        <Icon className="h-4 w-4 shrink-0" />
                                        <span>{item.step ? `${String(item.step).padStart(2, "0")}  ${item.label}` : item.label}</span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </DialogContent>
            </Dialog>

            <div className="flex flex-col md:flex-row gap-x-5 container-max-width w-full mx-auto my-7">

                {/* Sidebar (Desktop Only) */}
                <aside className="hidden md:block md:w-72 lg:w-72 space-y-2 shrink-0">
                    <div className="bg-white p-3 lg:p-5 rounded-lg border-light-gray h-full">
                        {sidebarItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = activeTab === item.key;
                            return (
                                <Button
                                    key={item.key}
                                    variant="outline"
                                    onClick={() => setActiveTab(item.key)}
                                    className={cn(
                                        "w-full flex items-center justify-start gap-3 p-2 h-auto text-start hover:bg-primary/10",
                                        isActive
                                            ? "text-primary border-primary/300"
                                            : "g-text-dark border border-transparent"
                                    )}
                                >
                                    {/* The button forces its icons to 16px, so the tinted square is a wrapper around the icon. */}
                                    <span
                                        className={cn(
                                            "flex h-9 w-9 shrink-0 items-center justify-center rounded-md",
                                            isActive ? "bg-primary text-white" : "bg-primary/10 text-primary"
                                        )}
                                    >
                                        <Icon className="size-[18px]" />
                                    </span>
                                    <span className="font-medium">{item.label}</span>
                                </Button>
                            );
                        })}
                    </div>
                </aside>

                {/* Content Area */}
                <main className="flex-1 min-w-0 bg-white p-3 lg:p-5 rounded-lg border-light-gray min-h-[600px]">
                    {activeStepIndex >= 0 && (
                        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Step {activeStepIndex + 1} of {PROFILE_STEPS.length}
                        </p>
                    )}
                    {/* Always mounted: edits on every step are kept while moving between steps and tabs. */}
                    <ProfileEditor
                        step={activeStepIndex >= 0 ? PROFILE_STEPS[activeStepIndex].key : null}
                        profile={profile}
                        onStepError={(step) => setActiveTab(step)}
                    />
                    {activeStepIndex >= 0 && (
                        <div className="mt-5 flex items-center justify-between gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                disabled={activeStepIndex === 0}
                                onClick={() => setActiveTab(PROFILE_STEPS[activeStepIndex - 1].key)}
                            >
                                <ChevronLeft className="h-4 w-4" />
                                Previous
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                disabled={activeStepIndex === PROFILE_STEPS.length - 1}
                                onClick={() => setActiveTab(PROFILE_STEPS[activeStepIndex + 1].key)}
                            >
                                Next
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                    {activeTab === "reviews" && (
                        <ReviewsSection reviews={reviews} averageRating={reviewSummary?.average_rating?.toString() || "0"} />
                    )}
                    {activeTab === "password" && (
                        <PasswordSection />
                    )}
                </main>
            </div>

        </div>
    );
};

export default ProfilePage;

function getErrorMessage(error: unknown) {
    if (
        typeof error === "object" &&
        error !== null &&
        "response" in error &&
        typeof (error as any).response?.data?.message === "string"
    ) {
        return (error as any).response.data.message;
    }

    if (error instanceof Error) {
        return error.message;
    }

    return "Failed to load profile.";
}