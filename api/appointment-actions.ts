import api from "@/lib/axios";

// Doctor confirms a booking that is awaiting confirmation, optionally at an exact time
// inside the OPD window (e.g. "10:45" in a 10 AM - 4 PM OPD). The patient is emailed this time.
export const confirmAppointment = async (appointmentId: string, appointmentTime?: string | null) => {
    const { data } = await api.post(`/appointments/${appointmentId}/confirm`, appointmentTime ? { appointment_time: appointmentTime } : {});
    return data;
};

// "16:00:00" or "16:00" -> "4:00 PM"
export const formatClock = (value?: string | null) => {
    if (!value) return "";
    const clean = value.trim();
    const match = clean.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?$/i);
    if (!match) return value;
    let h = parseInt(match[1], 10);
    const m = match[2];
    const period = match[3];
    if (period) {
        return `${h}:${m} ${period.toUpperCase()}`;
    }
    const suffix = h >= 12 ? "PM" : "AM";
    const displayH = ((h + 11) % 12) + 1;
    return `${displayH}:${m} ${suffix}`;
};

// Converts 12-hour ("03:30 PM", "3:30 PM") or 24-hour ("15:30:00", "15:30") to standard "HH:mm" (24h)
export const parseTo24HourTime = (timeStr?: string | null): string => {
    if (!timeStr) return "";
    const clean = timeStr.trim();
    if (!clean) return "";

    const is12Hour = /pm|am/i.test(clean);
    if (!is12Hour) {
        const parts = clean.split(":");
        if (parts.length >= 2) {
            const h = parseInt(parts[0], 10);
            const m = parseInt(parts[1], 10);
            if (!isNaN(h) && !isNaN(m) && h >= 0 && h <= 23 && m >= 0 && m <= 59) {
                return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
            }
        }
        return "";
    }

    const match = clean.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)$/i);
    if (match) {
        let h = parseInt(match[1], 10);
        const m = match[2];
        const period = match[3].toUpperCase();
        if (period === "PM" && h < 12) h += 12;
        if (period === "AM" && h === 12) h = 0;
        return `${String(h).padStart(2, "0")}:${m}`;
    }
    return "";
};

// Video call time: any time on the date, but not in the past ("YYYY-MM-DD", "HH:MM").
export const isFutureTimeOnDate = (date?: string | null, time?: string) => {
    if (!time || !date) return false;
    const time24 = parseTo24HourTime(time) || time.slice(0, 5);
    const cleanDate = date.split("T")[0].split(" ")[0];
    if (!cleanDate || cleanDate.length < 10) return true;

    const todayStr = new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD in local time
    if (cleanDate > todayStr) {
        return true; // Any time on a future date is valid!
    }
    if (cleanDate < todayStr) {
        return false; // Past date
    }

    const [h, m] = time24.split(":").map(Number);
    if (isNaN(h) || isNaN(m)) return false;

    const now = new Date();
    const target = new Date();
    target.setHours(h, m, 0, 0);

    return target.getTime() > now.getTime();
};

// Computes a default valid future time (in 24h format "HH:mm") for a given date
export const getDefaultFutureTime = (dateStr?: string | null, rawTime?: string | null): string => {
    const parsed = parseTo24HourTime(rawTime);
    if (parsed && isFutureTimeOnDate(dateStr, parsed)) {
        return parsed;
    }

    const cleanDate = (dateStr || "").split("T")[0].split(" ")[0];
    const todayStr = new Date().toLocaleDateString("en-CA");

    if (cleanDate && cleanDate > todayStr) {
        return parsed || "10:00";
    }

    // Today or fallback: round up to next 15/30 minutes from now
    const now = new Date();
    let nextMinutes = Math.ceil((now.getMinutes() + 15) / 15) * 15;
    let nextHour = now.getHours();
    if (nextMinutes >= 60) {
        nextMinutes = 0;
        nextHour = (nextHour + 1) % 24;
    }
    return `${String(nextHour).padStart(2, "0")}:${String(nextMinutes).padStart(2, "0")}`;
};

// Is "HH:MM" inside [start, end) of the OPD window ("HH:MM:SS")?
export const isWithinWindow = (time: string, start?: string | null, end?: string | null) => {
    // No time entered: the booked time is kept. No window known: the server checks it.
    if (!time || !start || !end) return true;
    const t = time.slice(0, 5);
    return t >= start.slice(0, 5) && t < end.slice(0, 5);
};

// Doctor marks the patient present / absent (voucher number optional, only for present).
export const markAttendance = async (
    appointmentId: string,
    payload: { attendance: "present" | "absent"; voucher_number?: string | null }
) => {
    const { data } = await api.post(`/appointments/${appointmentId}/attendance`, payload);
    return data;
};

export const getApiErrorMessage = (err: any, fallback = "Something went wrong") => {
    const errors = err?.response?.data?.errors;

    if (typeof errors === "string") return errors;
    if (errors?.message) return Array.isArray(errors.message) ? errors.message[0] : errors.message;
    if (errors && typeof errors === "object") {
        const first = Object.values(errors).flat()[0];
        if (typeof first === "string") return first;
    }

    return err?.response?.data?.message || err?.message || fallback;
};
