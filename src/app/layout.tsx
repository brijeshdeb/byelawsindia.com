/**
 * Root layout — server component.
 *
 * Responsibilities:
 * - Load Inter (Stitch Obsidian design system) as CSS variable.
 * - Load Material Symbols Outlined icon font.
 * - Set global metadata.
 * - Wrap the application in the TanStack Query provider.
 */
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { QueryProvider } from "@/providers/QueryProvider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-inter",
  preload: true,
});

export const metadata: Metadata = {
  title: {
    default: "ByelawsIndia: CHS Management Portal",
    template: "%s | ByelawsIndia",
  },
  description:
    "Society and Cooperative Housing Society management: applications, documents, maintenance, procurement, and compliance in one platform.",
  robots: {
    index: false, // Portal is not public-facing
    follow: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Never disable zoom — WCAG 1.4.4
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en-IN"
      className={inter.variable}
      suppressHydrationWarning
    >
      <head>
        {/* Material Symbols Outlined — Stitch Obsidian icon system */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
        />
      </head>
      <body className="min-h-dvh antialiased" style={{ backgroundColor: "#121212" }}>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
