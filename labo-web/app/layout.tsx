import type { Metadata } from "next";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { ClientShell } from "@/components/layout/ClientShell";
import "./globals.css";

export const metadata: Metadata = {
  title: "Alliya Laboratoire",
  description: "Système de gestion de laboratoire biomédical",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className="font-sans antialiased">
        <AuthProvider>
          <ClientShell>{children}</ClientShell>
        </AuthProvider>
      </body>
    </html>
  );
}
