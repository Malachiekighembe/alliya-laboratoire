import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Alliya Laboratoire",
};

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  return <>{children}</>;
}
