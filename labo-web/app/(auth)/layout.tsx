import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Alliya Laboratoire - Connexion",
  description: "Espace de gestion de laboratoire biomédical",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-alliya-dark-900 via-alliya-dark-800 to-alliya-turquoise-900 p-4">{children}</div>;
}
