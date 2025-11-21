import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { TRPCProvider } from "~/lib/trpc/TRPCProvider";
import ThemeRegistry from "~/components/ThemeRegistry";
import "~/styles/globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: "Lumina Interiors AI - AI-Powered Interior Design",
  description:
    "Transform your space with AI-powered interior design. Upload a photo, get expert analysis, and see stunning redesigns in seconds.",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
  keywords: ["interior design", "AI", "home design", "room redesign", "Gemini AI"],
  authors: [{ name: "Lumina Interiors AI" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${plusJakartaSans.variable}`}>
      <body className={plusJakartaSans.className}>
        <ThemeRegistry>
          <TRPCProvider>{children}</TRPCProvider>
        </ThemeRegistry>
      </body>
    </html>
  );
}
