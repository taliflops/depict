import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { FormProvider } from './contexts/FormContext';
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
  title: "Mini Promptwatch",
  description: "Depict's test",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body><FormProvider>{children}</FormProvider></body>
    </html>
  );
}
