import type { Metadata, Viewport } from "next";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { ClientShell } from "@/components/layout/ClientShell";
import { ServiceWorkerRegistrar } from "@/components/offline/ServiceWorkerRegistrar";
import { OfflineBanner } from "@/components/offline/OfflineBanner";
import "./globals.css";

export const metadata: Metadata = {
  title: "Alliya Laboratoire",
  description: "Système de gestion de laboratoire biomédical",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
  appleWebApp: {
    capable: true,
    title: "Alliya Laboratoire",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#1E2A47",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" data-scroll-behavior="smooth">
      <body className="font-sans antialiased overflow-x-hidden">
        <AuthProvider>
          <ClientShell>
            <ServiceWorkerRegistrar />
            <OfflineBanner />
            {children}
          </ClientShell>
        </AuthProvider>
      </body>
    </html>
  );
}
