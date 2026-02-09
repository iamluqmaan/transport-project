import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { cn } from "@/lib/utils";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "sonner";
import { Footer } from "@/components/footer";
import { WhatsAppWidget } from "@/components/whatsapp-widget";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TransportNG - Nigeria's Transport Marketplace",
  description: "Book interstate and intrastate travel tickets online.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={cn(inter.className, "min-h-screen bg-background font-sans antialiased")} suppressHydrationWarning>
        <SessionProvider>
            <Navbar />
            <main className="flex-1">
            {children}
            </main>
            <Footer />
            <WhatsAppWidget />
            <Footer />
            <WhatsAppWidget />
            <Toaster />
            <SonnerToaster />
        </SessionProvider>
      </body>
    </html>
  );
}
