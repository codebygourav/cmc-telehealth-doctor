import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { PushNotificationBanner } from "@/components/ui/PushNotificationBanner";
import { Toaster } from "sonner";

export default function MainLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <Header />
            <PushNotificationBanner />
            <main className="flex-1 min-h-screen px-5 sm:px-5 py-5 sm:py-5 mx-auto w-full">{children}</main>
            <Toaster
                richColors
                closeButton
                position="top-right"
                toastOptions={{
                    className: "p-4 sm:p-5 text-sm sm:text-base font-medium rounded-2xl shadow-xl border border-border/80 min-w-[320px] sm:min-w-[420px]",
                    style: {
                        padding: "16px 20px",
                        fontSize: "15px",
                    },
                }}
            />
            <Footer />
        </>
    );
}
