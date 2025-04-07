import "../globals.css";
import React from "react";
import Navbar from "@/components/Navbar";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-gotham bg-black text-white">
        <Navbar />
        <main className="pt-20 pb-16">{children}</main>
        <footer className="w-full text-center text-base text-gray-500 py-4 border-t border-gray-800 font-semibold">
          © 2025 Movie Club, BITS Hyderabad
        </footer>
      </body>
    </html>
  );
}
