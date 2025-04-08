import "@/app/globals.css";
import React from "react";
import Navbar from "@/components/Navbar";

export const metadata = {
  title: "Movie Club, BITS Hyderabad",
  description: "The filmmaking and review club of BITS Hyderabad."
}

export default function HomeLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-gotham bg-black text-white">
        <Navbar />
        {children}
      </body>
    </html>
  );
}
