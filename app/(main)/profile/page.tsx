"use client";

import AddressSection from "@/components/pages/profile/addressSection";
import AiTrainingSection from "@/components/pages/profile/aiTrainingSection";
import AwardsSection from "@/components/pages/profile/awardsSection";
import CertificatesSection from "@/components/pages/profile/certificatesSection";
import EducationSection from "@/components/pages/profile/educationSection";
import ExperienceSection from "@/components/pages/profile/experienceSection";
import PersonalInfoSection from "@/components/pages/profile/personalInfoSection";
import PasswordSection from "@/components/pages/profile/passwordSection";
import ProfileHeader from "@/components/pages/profile/profileHeader";
import ReviewsSection from "@/components/pages/profile/reviewsSection";
import SocialLinksSection from "@/components/pages/profile/socialLinksSection";
import VoiceSettingsSection from "@/components/pages/profile/voiceSettingsSection";
import { Button } from "@/components/ui";
import HeroSection from "@/components/ui/hero-section";
import { useAuth } from "@/context/userContext";
import { cn, stripHtml } from "@/lib/utils";
import { useDoctorHome } from "@/queries/useHome";
import { useDoctorProfile, useUpdateDoctorProfile } from "@/queries/useProfile";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Award, BrainCircuit, ChevronDown, FileBadge, GraduationCap, KeyRound, Link, MapPinPen, Trophy, User, UserStar, Volume2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type TabKey = "personal" | "address" | "experience" | "education" | "awards" | "certificates" | "social" | "reviews" | "password";

const ProfilePage = () => {

    const [activeTab, setActiveTab] = useState<TabKey>("personal");
    const [isEditingPersonal, setIsEditingPersonal] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isMobileProfileDrawerOpen, setIsMobileProfileDrawerOpen] = useState(false);

    const { user, updateUser } = useAuth();
    const { data, isLoading, isError, error } = useDoctorProfile();
    const updateProfileMutation = useUpdateDoctorProfile();
    const { data: homeData } = useDoctorHome();

    const profile = data?.data;
    const homeProfile = homeData?.data;
    const personalInfo = profile?.personal_information;
    const address = profile?.address;
    const workingExperience = profile?.working_experience ?? [];
    const educationInfo = profile?.education_info ?? [];
    const certificationsInfo = profile?.certifications_info ?? [];
    const awardsInfo = profile?.awards_info ?? [];
    const socialMedia = profile?.social_media ?? null;
    const reviewSummary = profile?.review_summary ?? undefined;

    const sidebarItems = [
        {
            key: "personal" as TabKey,
            label: "Personal Info",
            icon: User,
        },
        {
            key: "address" as TabKey,
            label: "Manage Address",
            icon: MapPinPen,
        },
        {
            key: "experience" as TabKey,
            label: "Experience",
            icon: Award,
        },
        {
            key: "education" as TabKey,
            label: "Education",
            icon: GraduationCap,
        },
        {
            key: "awards" as TabKey,
            label: "Awards",
            icon: Trophy,
        },
        {
            key: "certificates" as TabKey,
            label: "Certificates",
            icon: FileBadge,
        },
        {
            key: "social" as TabKey,
            label: "Social Links",
            icon: Link,
        },
        {
            key: "reviews" as TabKey,
            label: "Reviews",
            icon: UserStar,
        },
        {
            key: "password" as TabKey,
            label: "Change Password",
            icon: KeyRound,
        },
    ];

    const activeSidebarItem = useMemo(
        () => sidebarItems.find((i) => i.key === activeTab),
        [activeTab, sidebarItems]
    );

    const [formData, setFormData] = useState({
        first_name: "",
        last_name: "",
        email: "",
        bio: "",
        phone: "",
        medical_license: "",
    });

    useEffect(() => {
        if (personalInfo) {
            setFormData({
                first_name: personalInfo.first_name ?? "",
                last_name: personalInfo.last_name ?? "",
                email: personalInfo.email ?? "",
                bio: stripHtml(personalInfo.bio),
                phone: user?.phone ?? "",
                medical_license: personalInfo.medical_license ?? "",
            });
        }
    }, [personalInfo, user]);

    // Also update cancel handler when user changes
    useEffect(() => {
        if (!isEditingPersonal) {
            setFormData((prev) => ({
                ...prev,
                phone: user?.phone ?? "",
            }));
        }
    }, [user?.phone, isEditingPersonal]);

    const fullName = `${formData.first_name} ${formData.last_name}`.trim() || "Doctor";
    const initials = `${formData.first_name?.[0] ?? ""}${formData.last_name?.[0] ?? ""}` || "DR";
    const primaryDepartment = personalInfo?.doctor_departments?.[0]?.department_name || "General Practice";
    const primaryRole = personalInfo?.doctor_departments?.[0]?.role || "Doctor";

    const mappedExperience = useMemo(() => {
        return workingExperience.map((item, index) => ({
            id: index + 1,
            company: item.past_associations || "N/A",
            role: "Doctor",
            period: item.career_start ? `${item.career_start} - Present` : "N/A",
        }));
    }, [workingExperience]);

    const mappedEducation = useMemo(() => {
        return educationInfo.map((item, index) => ({
            id: index + 1,
            degree: item.degree || "N/A",
            institution: item.institution || "N/A",
            year: formatEducationYear(item.start_date, item.end_date),
        }));
    }, [educationInfo]);

    const mappedCertificates = useMemo(() => {
        return certificationsInfo
            .filter(
                (item) =>
                    item.name ||
                    item.organization ||
                    item.issue_date ||
                    item.expiry_date ||
                    item.certification_image
            )
            .map((item, index) => ({
                id: index + 1,
                name: item.name || "N/A",
                organization: item.organization || "N/A",
                issue_date: item.issue_date || "",
                expiry_date: item.expiry_date || "",
                certification_image: item.certification_image || "",
            }));
    }, [certificationsInfo]);

    const mappedAwards = useMemo(() => {
        return {
            awards_info: awardsInfo.map((item) => ({
                award_image: item.award_image || "",
                title: item.title || "N/A",
                organization: item.organization || "N/A",
                year: item.year || "",
                description: item.description || "",
            })),
        };
    }, [awardsInfo]);

    const mappedSocialMedia = useMemo(() => {
        return {
            facebook: socialMedia?.facebook || "",
            twitter: socialMedia?.twitter || "",
            linkedin: socialMedia?.linkedin || "",
            instagram: socialMedia?.instagram || "",
            website: socialMedia?.website || "",
        };
    }, [socialMedia]);

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

    const handleInputChange = (field: string, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleSavePersonalInfo = async () => {
        if (!user?.id) return;
        setIsSaving(true);
        try {
            await updateProfileMutation.mutateAsync({
                userId: user.id,
                group: "personal_information",
                data: {
                    first_name: formData.first_name,
                    last_name: formData.last_name,
                    bio: formData.bio,
                },
            });
            await updateUser({
                first_name: formData.first_name,
                last_name: formData.last_name,
            });
            setIsEditingPersonal(false);
            toast.success("Profile updated successfully!");
        } catch (error) {
            console.error("Error saving personal info:", error);
            toast.error("Failed to update profile");
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancelPersonalEdit = () => {
        setIsEditingPersonal(false);

        setFormData({
            first_name: personalInfo?.first_name ?? "",
            last_name: personalInfo?.last_name ?? "",
            email: personalInfo?.email ?? "",
            bio: stripHtml(personalInfo?.bio),
            phone: user?.phone ?? "",
            medical_license: personalInfo?.medical_license ?? "",
        });
    };

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
                phone={formData.phone}
                license={formData.medical_license}
                reviewSummary={reviewSummary}
            />

            {/* Mobile Profile Section Selector Trigger */}
            <div className="block md:hidden mb-4 mt-4">
                <button
                    type="button"
                    onClick={() => setIsMobileProfileDrawerOpen(true)}
                    className="w-full flex items-center justify-between gap-2 p-3 bg-white border border-slate-200 rounded-xl shadow-xs text-slate-700 hover:bg-slate-50 transition-colors"
                >
                    <div className="flex items-center gap-2.5 font-medium text-sm text-slate-800">
                        {activeSidebarItem && <activeSidebarItem.icon className="h-4 w-4 text-primary shrink-0" />}
                        <span>Section: <strong className="text-primary font-bold">{activeSidebarItem?.label}</strong></span>
                    </div>
                    <div className="flex items-center gap-1 text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-xl">
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
                                    className={`w-full flex items-center justify-between p-3 rounded-xl text-xs sm:text-sm font-semibold transition-all ${isActive
                                        ? "bg-primary text-white shadow-xs font-bold"
                                        : "text-slate-700 hover:bg-slate-100"
                                        }`}
                                >
                                    <div className="flex items-center gap-2.5">
                                        <Icon className="h-4 w-4 shrink-0" />
                                        <span>{item.label}</span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </DialogContent>
            </Dialog>

            <div className="flex flex-col md:flex-row gap-x-5 container-max-width w-full mx-auto my-7">

                {/* Sidebar (Desktop Only) */}
                <aside className="hidden md:block md:w-72 lg:w-96 space-y-2 shrink-0">
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
                                        "w-full flex items-center justify-start gap-3 px-5 py-3 h-auto text-start hover:bg-primary/10",
                                        isActive
                                            ? "text-primary"
                                            : "g-text-dark border border-transparent"
                                    )}
                                >
                                    <Icon size={14} color={`${isActive ? "var(--primary)" : "#4D4D4D"}`} />
                                    {item.label}
                                </Button>
                            );
                        })}
                    </div>
                </aside>

                {/* Content Area */}
                <main className="flex-1 bg-white p-3 lg:p-5 rounded-lg border-light-gray min-h-[600px]">
                    {activeTab === "personal" && (
                        <PersonalInfoSection
                            isEditing={isEditingPersonal}
                            setIsEditing={setIsEditingPersonal}
                            formData={formData}
                            profileData={{
                                email: personalInfo?.email ?? "",
                                bio: personalInfo?.bio ?? "",
                                avatar: personalInfo?.avatar ?? "",
                                doctor_departments: personalInfo?.doctor_departments ?? [],
                            }}
                            fullName={fullName}
                            primaryDepartment={primaryDepartment}
                            primaryRole={primaryRole}
                            isSaving={isSaving}
                            onInputChange={handleInputChange}
                            onSave={handleSavePersonalInfo}
                            onCancel={handleCancelPersonalEdit}
                            averageRating={reviewSummary}
                        />
                    )}
                    {activeTab === "address" && (
                        <div>
                            <AddressSection
                                address={{
                                    address_line1: address?.address_line1 ?? "",
                                    address_line2: address?.address_line2 ?? "",
                                    area: address?.area ?? "",
                                    landmark: address?.landmark ?? "",
                                    city: address?.city ?? "",
                                    state: address?.state ?? "",
                                    country: address?.country ?? "",
                                    pincode: address?.pincode ?? "",
                                }}
                            />
                        </div>
                    )}
                    {activeTab === "experience" && (
                        <ExperienceSection experience={mappedExperience} />
                    )}
                    {activeTab === "education" && (
                        <EducationSection education={mappedEducation} />
                    )}
                    {activeTab === "awards" && (
                        <AwardsSection awards={mappedAwards} />
                    )}
                    {activeTab === "certificates" && (
                        <CertificatesSection certificates={mappedCertificates} />
                    )}
                    {activeTab === "social" && (
                        <SocialLinksSection socialMedia={mappedSocialMedia} />
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

function formatEducationYear(
    startDate?: string | null,
    endDate?: string | null
) {
    if (!startDate && !endDate) return "N/A";

    const startYear = startDate ? new Date(startDate).getFullYear() : "";
    const endYear = endDate ? new Date(endDate).getFullYear() : "";

    if (startYear && endYear) return `${startYear} - ${endYear}`;
    if (startYear) return `${startYear}`;
    if (endYear) return `${endYear}`;

    return "N/A";
}

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