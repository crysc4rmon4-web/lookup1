import type { Metadata } from "next";

import {
  Geist,
  Geist_Mono,
} from "next/font/google";

import { AuthProvider } from "../components/auth-provider";

import { RadarProvider } from "../components/radar-provider";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LookUp",
  description:
    "LookUp networking real",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-white">
        <AuthProvider>
          <RadarProvider>
            {children}
          </RadarProvider>
        </AuthProvider>
      </body>
    </html>
  );
}