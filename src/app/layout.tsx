import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PRIDE – Produktentwicklung Polstermöbel",
  description: "Interne Plattform für die Produktentwicklung von Polstermöbeln",
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
