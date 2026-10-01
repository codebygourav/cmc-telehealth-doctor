import type { Metadata } from "next";
import { Cormorant_Garamond, Manrope, Geist_Mono } from "next/font/google";
import { cn } from "@/lib/utils";
import "./globals.css";
import { Providers } from "./providers";

const cormorant = Cormorant_Garamond({
    subsets: ['latin'],
    weight: ['300', '400', '500', '600', '700'],
    variable: '--font-headings',
})

const manrope = Manrope({
    subsets: ['latin'],
    variable: '--font-sans',
})

const fontMono = Geist_Mono({
    subsets: ["latin"],
    variable: "--font-mono",
})

export const metadata: Metadata = {
    title: "CMC Telehealth - Doctor",
    description: "A Progressive Web App for Doctors in Cmc Telehealth",
    manifest: "/manifest.webmanifest",
    icons: {
        icon: [
            { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
        ],
        shortcut: "/icons/icon-192x192.png",
        apple: "/icons/icon-192x192.png",
    },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        <html
            lang="en"
            className={cn("antialiased", fontMono.variable, "font-sans", manrope.variable, cormorant.variable)}
            suppressHydrationWarning
        >
            <head>
                <link rel="icon" href="/icons/icon-192x192.png" type="image/png" sizes="192x192" />
                <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
            </head>
            <body className="min-h-full flex flex-col" suppressHydrationWarning>
                <Providers>
                    {children}
                </Providers>
            </body>
        </html>
    );
}