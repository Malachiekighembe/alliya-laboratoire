import "./globals.css";
import Nav from "../components/Nav";

export const metadata = {
  title: "Alliya Laboratoire",
  description: "Plateforme de gestion de laboratoire biomédical",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-background text-foreground antialiased">
        <Nav />
        <main className="min-h-screen pt-16">{children}</main>
      </body>
    </html>
  );
}