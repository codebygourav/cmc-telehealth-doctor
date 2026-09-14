import { useEffect, useState } from "react";
import { deletePushSubscription, storePushSubscription } from "@/api/notification";

const VAPID_PUBLIC_KEY =
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
    "BPGeTklCCSC2PnEF1fLpCg09b5-XW0ZfrDd3wA4hwqkCVbzNHkFTTj-KNJGJPknGsMt4L_OIH3qE8iJ01Lo0lT4";

function urlBase64ToUint8Array(base64String: string) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/\-/g, "+").replace(/_/g, "/");
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export function isNotificationOlderThanCurrent(item: any): boolean {
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

    let targetDate: Date | null = null;

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

export function showNativeNotification(title: string, options?: NotificationOptions) {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission !== "granted") return;

    if (options?.data && isNotificationOlderThanCurrent(options.data)) {
        return;
    }

    const defaultOptions: NotificationOptions = {
        icon: "/favicon.ico",
        badge: "/favicon.ico",
        tag: options?.tag || ("notification-" + Date.now()),
        requireInteraction: true,
        ...options,
    };

    const createFallbackNotification = (t: string, opts: NotificationOptions) => {
        try {
            const safeOpts = { ...opts };
            delete (safeOpts as any).actions;
            return new Notification(t, safeOpts);
        } catch (err) {
            console.error("Failed to create fallback Notification:", err);
        }
    };

    try {
        if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({
                type: "SHOW_NOTIFICATION",
                title,
                options: defaultOptions,
            });
        } else if ("serviceWorker" in navigator) {
            navigator.serviceWorker.ready
                .then((registration) => {
                    registration.showNotification(title, defaultOptions);
                })
                .catch(() => {
                    createFallbackNotification(title, defaultOptions);
                });
        } else {
            createFallbackNotification(title, defaultOptions);
        }
    } catch (e) {
        console.error("Error displaying native notification:", e);
    }
}

export function usePushNotifications() {
    const [permission, setPermission] = useState<NotificationPermission | null>(null);
    const [subscription, setSubscription] = useState<PushSubscription | null>(null);
    const [loading, setLoading] = useState(false);

    const subscribeToPush = async () => {
        if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) {
            console.warn("Push notifications are not supported in this browser.");
            return null;
        }

        setLoading(true);
        try {
            const perm = await Notification.requestPermission();
            setPermission(perm);

            if (perm !== "granted") {
                console.warn("Notification permission denied");
                return null;
            }

            const isDev = process.env.NODE_ENV === "development";
            const swPath = isDev ? "/sw-dev.js" : "/sw.js";

            let registration = await navigator.serviceWorker.getRegistration(swPath);
            if (!registration) {
                registration = await navigator.serviceWorker.register(swPath);
            }
            await navigator.serviceWorker.ready;

            let sub = await registration.pushManager.getSubscription();
            if (!sub) {
                sub = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
                });
            }

            setSubscription(sub);
            await storePushSubscription(sub);
            return sub;
        } catch (error) {
            console.error("Failed to subscribe to WebPush notifications:", error);
            return null;
        } finally {
            setLoading(false);
        }
    };

    const unsubscribeFromPush = async () => {
        if (!subscription) return;

        setLoading(true);
        try {
            if (subscription.endpoint) {
                await deletePushSubscription(subscription.endpoint);
            }
            await subscription.unsubscribe();
            setSubscription(null);
        } catch (error) {
            console.error("Failed to unsubscribe:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (typeof window !== "undefined" && "Notification" in window) {
            setPermission(Notification.permission);

            if ("serviceWorker" in navigator) {
                const isDev = process.env.NODE_ENV === "development";
                const swPath = isDev ? "/sw-dev.js" : "/sw.js";

                navigator.serviceWorker.register(swPath).then((registration) => {
                    registration.pushManager.getSubscription().then((existingSubscription) => {
                        setSubscription(existingSubscription);
                        if (Notification.permission === "granted" && !existingSubscription) {
                            subscribeToPush();
                        }
                    });
                }).catch((err) => {
                    console.error("Failed to register Service Worker:", err);
                });
            }
        }
    }, []);

    return {
        permission,
        subscription,
        loading,
        subscribeToPush,
        unsubscribeFromPush,
        isSupported: typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window,
    };
}
