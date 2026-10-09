import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { HealthProfileProvider } from "@/context/HealthProfileContext";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "AisleAlly — Your AI Health Grocery Companion",
  description:
    "Shop smarter with AisleAlly. Get personalised grocery recommendations based on your food sensitivities, allergies, and health goals.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans bg-cream text-primary">
        <HealthProfileProvider>
          {children}
        </HealthProfileProvider>
      </body>
    </html>
  );
}
