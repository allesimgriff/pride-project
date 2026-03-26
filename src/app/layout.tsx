import type { Metadata } from "next";
import "./globals.css";
import { GlobalBusyIndicator } from "@/components/layout/GlobalBusyIndicator";

const isHandwerkerBuild =
  process.env.NEXT_PUBLIC_APP_EDITION?.trim().toLowerCase() === "handwerker" ||
  process.env.NEXT_PUBLIC_APP_EDITION?.trim().toLowerCase() === "hw";

export const metadata: Metadata = {
  title: isHandwerkerBuild ? "Allesimgriff" : "PRIDE – Projektname",
  description: "Interne Plattform für die Produktentwicklung von Polstermöbeln",
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body className="min-h-screen bg-surface-100 font-sans text-gray-900 antialiased">
        <GlobalBusyIndicator />
        {children}
      </body>
    </html>
  );
}
