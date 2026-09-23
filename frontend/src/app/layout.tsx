import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";

const interSans = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "X-RAY SQUARED — Smarter X-Rays. Clearer AI Insights.",
  description:
    "Academic AI-assisted chest X-ray screening and review platform with explainable AI, case prioritization and human-in-the-loop review.",
  keywords: [
    "X-Ray",
    "AI",
    "Grad-CAM",
    "Explainable AI",
    "Human-in-the-Loop",
    "Pneumonia",
    "Chest X-Ray",
    "Medical AI",
  ],
  authors: [{ name: "X-RAY SQUARED — Academic Project" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "X-RAY SQUARED",
    description: "Smarter X-Rays. Clearer AI Insights.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "X-RAY SQUARED",
    description: "Smarter X-Rays. Clearer AI Insights.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${interSans.variable} ${jetbrainsMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
          <SonnerToaster position="bottom-right" richColors closeButton />
        </ThemeProvider>
      </body>
    </html>
  );
}
