import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DisasterLens AI — Real-Time Disaster Intelligence & Response Co-Pilot",
  description: "AI-powered disaster management platform monitoring emergency reports, weather alerts, flood indicators, risk estimation, and decision co-pilot.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark h-full antialiased bg-slate-950">
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-100">
        {children}
      </body>
    </html>
  );
}
