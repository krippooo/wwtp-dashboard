import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/component/Navbar";
import Sidebar from "@/component/sidebar";
import MiniBarGlobal from "@/component/MiniBarGlobal";
import { DataProvider } from "@/component/providers/DataProvider";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "WWTP Dashboard",
  description: "Admin Dashboard",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`min-h-screen bg-background ${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Navbar />
        <div className="flex">
          <div className="hidden md:block h-[200px] flex-col pl-5">
            <Sidebar />
          </div>
          <div className="p-2 w-full md:max-w-[1280px]">
            {/* Provider global, semua anak share data */}
            <DataProvider>
              {/* Minibar global: otomatis hidden di '/' */}
              <MiniBarGlobal />
              {children}
            </DataProvider>
          </div>
        </div>
      </body>
    </html>
  );
}
