"use client"

import { useMyAppointments } from "@/queries/useAppointments";
import { useMySchedules } from "@/queries/getMySchedules";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar"
import { useState, useMemo, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { Appointment } from "@/types/appointment";
import { ScheduleDay, OPDSlot } from "@/types/schedule";
import DoctorOpdSchedule from "@/components/pages/my-schedules/DoctorOpdSchedule";
import BookAppointments from "@/components/pages/my-schedules/BookAppointments";
import { Stethoscope } from "lucide-react";
import HeroSection from "@/components/ui/hero-section";

const filterAppointmentsByDate = (
    appointments: any[],
    selectedDate?: Date
) => {
    if (!selectedDate) return [];

    const formattedDate = format(selectedDate, "yyyy-MM-dd");

    return appointments.filter(
        (apt) => apt.appointment_date === formattedDate || apt.appointment_date?.startsWith(formattedDate)
    );
};

const MySchedulesPage = () => {

    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
    const [currentDate, setCurrentDate] = useState<Date>(new Date());
    const [selectedSlot, setSelectedSlot] = useState<OPDSlot | undefined>(undefined);
    const router = useRouter();

    const { data, isLoading, error } = useMyAppointments("all");

    const monthParams = useMemo(() => ({
        month: currentDate.getMonth() + 1,
        year: currentDate.getFullYear(),
    }), [currentDate]);

    const dayParams = useMemo(() => ({
        month: currentDate.getMonth() + 1,
        year: currentDate.getFullYear(),
        date: selectedDate ? format(selectedDate, "yyyy-MM-dd") : undefined,
    }), [currentDate, selectedDate]);

    const { data: monthScheduleData, isLoading: monthLoading, error: monthError } = useMySchedules(monthParams);
    const { data: dayScheduleData, isLoading: dayLoading, error: dayError } = useMySchedules(dayParams);

    const filteredAppointments = useMemo(() => {
        const dateFiltered = filterAppointmentsByDate(
            data?.data || [],
            selectedDate
        );

        if (selectedSlot) {
            // Priority 1: Use appointments inside the slot if available
            if (selectedSlot.appointments && selectedSlot.appointments.length > 0) {
                return selectedSlot.appointments;
            }

            // Priority 2: Filter the date-filtered appointments by matching time or slot link
            // Most appointments will match the slot's start_time or fall within time_range
            return dateFiltered.filter((appt: any) => {
                const apptTime = appt.appointment_time; // format like "18:00:00" or "06:00 PM"
                const slotStart = selectedSlot.start_time; // format like "18:00:00"

                // Try direct match first (often both are in HH:mm:ss format from API)
                if (apptTime === slotStart) return true;

                // Fallback: compare formatted times if they exist
                const apptFormatted = appt.appointment_time_formatted; // e.g. "06:00 PM"
                const slotTimeRange = selectedSlot.time_range; // e.g. "6:00 PM - 7:30 PM"
                if (apptFormatted && slotTimeRange && slotTimeRange.startsWith(apptFormatted.replace(/^0/, ''))) {
                    return true;
                }

                // General check: see if appt time is mentioned in slot time range string
                if (apptFormatted && slotTimeRange && slotTimeRange.includes(apptFormatted)) {
                    return true;
                }

                return false;
            });
        }

        return dateFiltered;
    }, [data, selectedDate, selectedSlot]);

    const getOPDSlotsForDate = (date: Date | undefined): OPDSlot[] => {
        if (!date) return [];
        const formattedDate = format(date, "yyyy-MM-dd");
        const monthDays = monthScheduleData?.data?.days || [];
        const dayDays = dayScheduleData?.data?.days || [];

        // Prioritize dayDays if matching exact date, otherwise fallback to monthDays
        const days = [...dayDays, ...monthDays];

        // 1. Try exact date match
        const exactDay = days.find((s: ScheduleDay) => {
            if (!s.date) return false;
            return s.date === formattedDate || s.date.startsWith(formattedDate) || s.date.split("T")[0] === formattedDate;
        });

        const dateAppointments = filterAppointmentsByDate(data?.data || [], date);

        if (exactDay && exactDay.slots && exactDay.slots.length > 0) {
            return exactDay.slots.map((slot: OPDSlot) => {
                const slotStart = slot.start_time;
                const slotTimeRange = slot.time_range;
                const apptsForSlot = dateAppointments.filter((appt: any) => {
                    const apptTime = appt.appointment_time;
                    if (apptTime && slotStart && apptTime === slotStart) return true;
                    const apptFormatted = appt.appointment_time_formatted;
                    if (apptFormatted && slotTimeRange && (slotTimeRange.includes(apptFormatted) || slotTimeRange.startsWith(apptFormatted.replace(/^0/, '')))) {
                        return true;
                    }
                    const apptStart = appt.start_time;
                    if (apptStart && slotStart && (apptStart === slotStart || apptStart.startsWith(slotStart.slice(0, 5)))) return true;
                    return false;
                });

                return {
                    ...slot,
                    date: formattedDate,
                    booked_count: Math.max(slot.booked_count || 0, apptsForSlot.length),
                    appointments: apptsForSlot.length > 0 ? apptsForSlot : (slot.appointments || []),
                };
            });
        }

        // Check if days array elements have date property
        const hasDateSpecificData = days.some((s: ScheduleDay) => Boolean(s.date));

        // 2. Fallback: match by day of week ONLY if API data is a generic weekly template (no date fields in days)
        if (!hasDateSpecificData) {
            const dayOfWeekNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
            const dayOfWeekShorts = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
            const dayIndex = date.getDay();
            const targetDayName = dayOfWeekNames[dayIndex];
            const targetDayShort = dayOfWeekShorts[dayIndex];

            const matchingDay = days.find((s: ScheduleDay) => {
                if (s.day_name && s.day_name.toLowerCase() === targetDayName.toLowerCase()) return true;
                if (s.day_short && s.day_short.toLowerCase() === targetDayShort.toLowerCase()) return true;
                return false;
            });

            if (matchingDay && matchingDay.slots && matchingDay.slots.length > 0) {
                return matchingDay.slots.map((slot: OPDSlot) => {
                    const slotStart = slot.start_time;
                    const slotTimeRange = slot.time_range;
                    const apptsForSlot = dateAppointments.filter((appt: any) => {
                        const apptTime = appt.appointment_time;
                        if (apptTime && slotStart && apptTime === slotStart) return true;
                        const apptFormatted = appt.appointment_time_formatted;
                        if (apptFormatted && slotTimeRange && (slotTimeRange.includes(apptFormatted) || slotTimeRange.startsWith(apptFormatted.replace(/^0/, '')))) {
                            return true;
                        }
                        return false;
                    });

                    return {
                        ...slot,
                        date: formattedDate,
                        booked_count: Math.max(slot.booked_count || 0, apptsForSlot.length),
                        appointments: apptsForSlot.length > 0 ? apptsForSlot : (slot.appointments || []),
                    };
                });
            }
        }

        // 3. Fallback: if date has appointments, synthesize slots from appointments
        if (dateAppointments.length > 0) {
            const dayOfWeekNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
            const dayIndex = date.getDay();
            const targetDayName = dayOfWeekNames[dayIndex];

            return dateAppointments.map((appt: any, idx: number) => {
                const timeStr = appt.appointment_time_formatted || appt.appointment_time || "Scheduled Time";
                return {
                    id: appt.appointment_id || `synth-${idx}`,
                    startTime: appt.appointment_time || "09:00:00",
                    date: formattedDate,
                    day_name: targetDayName,
                    start_time: appt.appointment_time || "09:00:00",
                    end_time: appt.appointment_time || "10:00:00",
                    time_range: timeStr,
                    consultation_type: appt.consultation_type === "video" ? "video" : "in-person",
                    consultation_type_label: appt.consultation_type_label || (appt.consultation_type === "video" ? "Video Consultation" : "In-Person Consultation"),
                    capacity: 10,
                    slot_capacity: 10,
                    booked_count: 1,
                    available_slots: 9,
                    appointments: [appt],
                };
            });
        }

        return [];
    };

    const onSlotClick = (slot: OPDSlot) => {
        setSelectedSlot(slot);
    };

    const onViewAllSlots = (slots: OPDSlot[]) => {
        console.log("Viewing all slots:", slots);
        // Implement view all logic if needed
    };

    const onDateClick = (date: Date | undefined) => {
        if (!date) return;
        setSelectedDate(date);

        if (date.getMonth() !== currentDate.getMonth() || date.getFullYear() !== currentDate.getFullYear()) {
            setCurrentDate(new Date(date.getFullYear(), date.getMonth(), 1));
        }

        const slots = getOPDSlotsForDate(date);
        setSelectedSlot(slots.length > 0 ? slots[0] : undefined);
    };

    // Auto-select first slot when schedule data is loaded or date changes
    useEffect(() => {
        if (selectedDate && (monthScheduleData?.data || dayScheduleData?.data)) {
            const slots = getOPDSlotsForDate(selectedDate);
            setSelectedSlot(slots.length > 0 ? slots[0] : undefined);
        }
    }, [selectedDate, monthScheduleData, dayScheduleData]);

    const onMonthChange = (month: Date) => {
        setCurrentDate(month);
        const newSelectedDate = new Date(month.getFullYear(), month.getMonth(), 1);
        setSelectedDate(newSelectedDate);
        setSelectedSlot(undefined);
    };

    const getOPDCount = (date: Date) => {
        const slots = getOPDSlotsForDate(date);
        return slots.length;
    };

    const hasAppointments = (date: Date) => {
        if (!date || !data?.data) return false;
        const formattedDate = date.toLocaleDateString("en-CA");
        return data.data.some((appt: Appointment) => {
            return appt.appointment_date === formattedDate || appt.appointment_date?.startsWith(formattedDate);
        });
    };

    const isToday = (date: Date) => {
        const today = new Date();
        return date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear();
    };

    return (
        <div className="container-max-width w-full mx-auto">

            <HeroSection title="My Schedules" description="Manage your OPD appointments and availability" />

            <Card className="border-border mt-5">

                <CardHeader>
                    <CardTitle>
                        {format(currentDate, "MMMM yyyy")}
                    </CardTitle>
                    <CardDescription>
                        <span className="font-semibold text-primary">OPD sessions</span> this month
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mt-2">

                        {/* Left Column - Calendar */}
                        <div className="lg:col-span-1">
                            <Calendar
                                mode="single"
                                selected={selectedDate}
                                onSelect={onDateClick}
                                month={currentDate}
                                onMonthChange={onMonthChange}
                                className="rounded-lg border gap-1 w-full"
                                components={{
                                    DayButton: ({ day, ...props }) => {
                                        const date = day.date;
                                        const count = getOPDCount(date);
                                        const isSelected = selectedDate?.toDateString() === date.toDateString();
                                        const isTodayDate = isToday(date);
                                        const hasAppt = count > 0 || hasAppointments(date);
                                        return (
                                            <button
                                                {...props}
                                                className={`
                                                    relative flex flex-col items-center justify-center
                                                    aspect-square w-full p-1 gap-0.5
                                                    text-sm font-normal rounded-md transition-all duration-200
                                                    h-auto mx-auto z-10
                                                    ${isSelected
                                                        ? 'bg-primary text-primary-foreground shadow-sm scale-105'
                                                        : ''
                                                    }
                                                    ${isTodayDate && !isSelected
                                                        ? 'bg-primary/5 text-primary hover:bg-primary/10 font-bold border border-primary'
                                                        : ''
                                                    }
                                                    ${hasAppt && !isSelected && !isTodayDate
                                                        ? 'bg-primary/5 text-primary hover:bg-primary/10 cursor-pointer'
                                                        : ''
                                                    }
                                                    ${!hasAppt && !isTodayDate && !isSelected
                                                        ? 'text-muted-foreground'
                                                        : ''
                                                    }
                                                `}
                                            >
                                                <div className="flex flex-col items-center justify-center gap-0.5 w-full h-full">
                                                    <span className="text-xs sm:text-sm font-medium leading-none">{date.getDate()}</span>
                                                    {count > 0 && (
                                                        <Badge
                                                            variant="outline"
                                                            className={`h-3.5 md:px-1 px-0.5 text-[8px] font-normal leading-none bg-primary/10 border-primary/20 shrink-0 ${isSelected ? 'text-white border-white/30' : ''}`}
                                                        >
                                                            {count} {count === 1 ? 'OPD' : "OPD's"}
                                                        </Badge>
                                                    )}
                                                    {isTodayDate && (
                                                        <span className={`absolute md:top-1.5 top-1 md:right-1.5 right-1 h-1.5 w-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-primary'}`} />
                                                    )}
                                                </div>
                                            </button>
                                        );
                                    }
                                }}
                            />
                        </div>

                        {/* Middle Column - Doctor OPD Schedule */}
                        <div className="lg:col-span-1">
                            <DoctorOpdSchedule
                                title="Doctor OPD Schedule"
                                date={selectedDate
                                    ? selectedDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
                                    : 'Select a date'}
                                count={selectedDate ? getOPDCount(selectedDate) : 0}
                                countLabel="Slots"
                                emptyIcon={<Stethoscope className="h-8 w-8 mx-auto mb-2 opacity-30" />}
                                emptyMessage="No doctor OPD scheduled"
                                emptySubMessage="Select a date with OPD sessions"
                                OPDSlotsForSelectedDate={getOPDSlotsForDate(selectedDate)}
                                selectedSlot={selectedSlot}
                                onSlotClick={onSlotClick}
                            />
                        </div>


                        {/* Right Column - Booked Appointments */}
                        <div className="lg:col-span-1 space-y-3">

                            <Card className="border-border h-full py-0 flex flex-col">

                                {/* Header */}
                                <CardHeader className="bg-primary text-white rounded-t-lg py-2">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <CardTitle className="text-sm">Booked Appointments</CardTitle>
                                            {selectedSlot && (
                                                <p className="text-xs opacity-80">
                                                    {selectedSlot.time_range} • {filteredAppointments.length} Booked
                                                </p>
                                            )}
                                        </div>
                                        <Badge variant="secondary">
                                            {filteredAppointments.length} Patients
                                        </Badge>
                                    </div>
                                </CardHeader>

                                <CardContent className="pt-4 flex-1 overflow-y-auto max-h-[500px]">
                                    <div className="space-y-3">
                                        {filteredAppointments.length ? (
                                            filteredAppointments.map((appointment: any, idx: number) => {
                                                const patientName =
                                                    appointment.patient?.name ||
                                                    appointment.patient_name ||
                                                    appointment.name ||
                                                    "Unknown Patient";

                                                const patientAvatar =
                                                    appointment.patient?.avatar ||
                                                    appointment.patient_avatar ||
                                                    appointment.avatar ||
                                                    "";

                                                const appointmentTime =
                                                    appointment.appointment_time_formatted ||
                                                    (appointment.start_time && appointment.end_time
                                                        ? `${appointment.start_time} - ${appointment.end_time}`
                                                        : appointment.appointment_time || appointment.appointmentTime || "");

                                                const consultationType =
                                                    appointment.consultation_type === "video" || appointment.type === "Telehealth"
                                                        ? "Video"
                                                        : "In-Person";

                                                const statusLabel =
                                                    appointment.status_label ||
                                                    appointment.status ||
                                                    "Confirmed";

                                                const apptId = appointment.appointment_id || appointment.id;

                                                return (
                                                    <BookAppointments
                                                        key={apptId || idx}
                                                        type="patient"
                                                        title={patientName}
                                                        avatar={patientAvatar}
                                                        time={appointmentTime}
                                                        appointmentType={consultationType}
                                                        status={statusLabel as any}
                                                        onClick={() => {
                                                            if (apptId) {
                                                                router.push(`/appointments/${apptId}`);
                                                            }
                                                        }}
                                                    />
                                                );
                                            })
                                        ) : (
                                            <div className="text-center py-10 border rounded-lg border-dashed text-muted-foreground">
                                                <p className="text-sm">
                                                    {selectedSlot
                                                        ? "No appointments booked for this slot"
                                                        : "Select an OPD slot to view appointments"}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>

                            </Card>
                        </div>

                    </div>

                </CardContent>

            </Card>
        </div>
    );
};

export default MySchedulesPage;