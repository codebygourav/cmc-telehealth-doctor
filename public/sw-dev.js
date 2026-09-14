self.addEventListener("install", (event) => {
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    event.waitUntil(self.clients.claim());
});

function isNotificationOlderThanCurrent(item) {
    if (!item) return false;

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    let dateStr =
        item.date ||
        item.appointment_date ||
        item.created_at ||
        item.datetime ||
        item.scheduled_at ||
        item.timestamp ||
        item.time_stamp;

    let timeStr = item.time || item.appointment_time;

    if (!dateStr) return false;

    let targetDate = null;

    if (typeof dateStr === "number") {
        targetDate = new Date(dateStr > 1e11 ? dateStr : dateStr * 1000);
    } else if (typeof dateStr === "string") {
        let rawStr = dateStr.trim();
        if (timeStr && typeof timeStr === "string" && !rawStr.includes(":") && !rawStr.includes("T")) {
            rawStr = `${rawStr} ${timeStr.trim()}`;
        }
        if (/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}/.test(rawStr)) {
            rawStr = rawStr.replace(" ", "T");
        }
        targetDate = new Date(rawStr);
    }

    if (!targetDate || isNaN(targetDate.getTime())) {
        return false;
    }

    const targetTime = targetDate.getTime();
    const isOlderThanToday = targetTime < startOfToday;
    const BUFFER_MS = 2 * 60 * 1000;
    const isOlderThanCurrentTime = targetTime < (now.getTime() - BUFFER_MS);

    return isOlderThanToday || isOlderThanCurrentTime;
}

self.addEventListener("push", (event) => {
    if (!event.data) return;

    try {
        let rawData = {};
        try {
            rawData = event.data.json();
        } catch {
            rawData = { body: event.data.text() };
        }

        const payloadData = rawData.data || rawData;
        const notificationData = rawData.notification || {};

        if (isNotificationOlderThanCurrent(payloadData) || isNotificationOlderThanCurrent(rawData)) {
            return;
        }

        const title = rawData.title || notificationData.title || payloadData.title || "New Notification";
        const desc = rawData.desc || rawData.body || rawData.message || notificationData.body || payloadData.desc || payloadData.body || payloadData.message || "";
        const join_url = rawData.join_url || payloadData.join_url || notificationData.join_url;
        const appointment_id = rawData.appointment_id || payloadData.appointment_id || notificationData.appointment_id;
        const group = rawData.group || payloadData.group || "";

        const options = {
            body: desc,
            icon: rawData.icon || notificationData.icon || "/favicon.ico",
            badge: rawData.badge || notificationData.badge || "/favicon.ico",
            tag: rawData.id || payloadData.id || rawData.tag || "notification-" + Date.now(),
            requireInteraction: true,
            data: {
                url: rawData.url || payloadData.url || "/notifications",
                join_url: join_url,
                appointment_id: appointment_id,
                title: title,
                group: group,
                ...payloadData,
            },
        };

        const isAppointmentReminder =
            title.toLowerCase().includes("appointment reminder") ||
            group.toLowerCase() === "appointment" ||
            (join_url && title.toLowerCase().includes("reminder"));

        if (isAppointmentReminder && join_url) {
            options.actions = [
                {
                    action: "join_call",
                    title: "Join Call",
                },
            ];
        }

        event.waitUntil(
            self.registration.showNotification(title, options)
        );
    } catch (e) {
        console.error("Error displaying push notification:", e);
        const text = event.data ? event.data.text() : "New Notification";
        event.waitUntil(
            self.registration.showNotification("New Notification", {
                body: text,
                icon: "/favicon.ico",
                data: { url: "/notifications" },
            })
        );
    }
});

self.addEventListener("message", (event) => {
    if (event.data && event.data.type === "SHOW_NOTIFICATION") {
        const { title, options } = event.data;
        if (options && options.data && isNotificationOlderThanCurrent(options.data)) {
            return;
        }
        self.registration.showNotification(title || "New Notification", options);
    }
});

self.addEventListener("notificationclick", (event) => {
    event.notification.close();

    const notifData = event.notification.data || {};
    const join_url = notifData.join_url;
    const appointment_id = notifData.appointment_id;
    const title = notifData.title || event.notification.title || "";
    const group = notifData.group || "";

    let targetUrl = notifData.url || "/notifications";

    const isAppointmentReminder =
        event.action === "join_call" ||
        title.toLowerCase().includes("appointment reminder") ||
        group.toLowerCase() === "appointment";

    if (isAppointmentReminder && join_url) {
        targetUrl = `/start-consultation?room_url=${encodeURIComponent(join_url)}&appointment_id=${appointment_id || ""}`;
    }

    event.waitUntil(
        self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
            for (let i = 0; i < clientList.length; i++) {
                let client = clientList[i];
                if (client.url.includes(targetUrl) && "focus" in client) {
                    return client.focus();
                }
            }
            if (self.clients.openWindow) {
                return self.clients.openWindow(targetUrl);
            }
        })
    );
});
