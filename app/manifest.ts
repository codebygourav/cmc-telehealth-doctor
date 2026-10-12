import type { MetadataRoute } from "next";

// Web app manifest: makes the portal installable as an app (Android / desktop "Install",
// iPhone "Add to Home Screen") and opens it in its own window without the browser bars.
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "CMC Telehealth Doctor",
    short_name: "CMC Doctor",
    description: "CMC Telehealth for doctors: appointments, video consultations, prescriptions and patient records.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#073827",
    categories: ["medical", "health"],
    icons: [
      { src: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
