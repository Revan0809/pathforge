import type { Metadata } from "next";
import { Space_Grotesk, Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-heading",
  weight: ["400", "500", "600", "700"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  // ── Core ────────────────────────────────────────────────────────────────────
  title: {
    default: "PathForge — AI-Powered Placement Prep for CSE Students",
    template: "%s | PathForge",
  },
  description:
    "PathForge is India's #1 AI placement preparation platform for CSE students. Get a personalised 16-week roadmap, track DSA progress (Striver A2Z), calculate your readiness score, and crack your dream company. Founded by Abhinav.",
  keywords: [
    "PathForge",
    "pathforge placement prep",
    "pathforge AI roadmap",
    "placement preparation for CSE students India",
    "AI roadmap for engineering students",
    "DSA tracker India",
    "Striver A2Z tracker",
    "CGPA calculator company cutoff",
    "campus placement preparation",
    "software engineering placement",
    "CSE placement app",
    "AI career roadmap India",
    "placement readiness score",
  ],
  authors: [{ name: "Abhinav", url: "https://pathforge.online" }],
  creator: "Abhinav",
  publisher: "PathForge",
  category: "Education",

  // ── Canonical + robots ───────────────────────────────────────────────────────
  metadataBase: new URL("https://pathforge.online"),
  alternates: { canonical: "/" },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  // ── Open Graph ───────────────────────────────────────────────────────────────
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://pathforge.online",
    siteName: "PathForge",
    title: "PathForge — AI-Powered Placement Prep for CSE Students",
    description:
      "Personalised 16-week AI roadmap, DSA tracker, readiness score, and daily tasks for CSE students targeting product companies. Built for India.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "PathForge — AI Placement Prep Platform",
      },
    ],
  },

  // ── Twitter / X ──────────────────────────────────────────────────────────────
  twitter: {
    card: "summary_large_image",
    title: "PathForge — AI-Powered Placement Prep for CSE Students",
    description:
      "Personalised 16-week AI roadmap, DSA tracker, readiness score, and daily tasks for CSE students targeting product companies.",
    images: ["/og-image.png"],
    creator: "@pathforge",
  },

  // ── PWA ──────────────────────────────────────────────────────────────────────
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "PathForge",
  },
  other: {
    "mobile-web-app-capable": "yes",
    "msapplication-TileColor": "#12102A",
    "msapplication-TileImage": "/icons/icon-144.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#7C3AED" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152.png" />
        <link rel="apple-touch-icon" sizes="144x144" href="/icons/icon-144.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="PathForge" />
      </head>
      <body className={`${spaceGrotesk.variable} ${inter.variable} font-body antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
