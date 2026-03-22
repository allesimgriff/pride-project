import type { Metadata } from "next";
import "./globals.css";

const isHandwerkerBuild =
  process.env.NEXT_PUBLIC_APP_EDITION?.trim().toLowerCase() === "handwerker" ||
  process.env.NEXT_PUBLIC_APP_EDITION?.trim().toLowerCase() === "hw";

export const metadata: Metadata = {
  title: isHandwerkerBuild ? "Handwerker" : "PRIDE – Projektname",
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
        {children}
      </body>
    </html>
  );
}
