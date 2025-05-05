"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showNavbar, setShowNavbar] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > lastScrollY && currentScrollY > 50) {
        setShowNavbar(false); // hide on scroll down
      } else {
        setShowNavbar(true); // show on scroll up
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [lastScrollY]);

  return (
    <>
      {/* Top Navbar */}
      <nav
        className={`fixed top-0 left-0 w-full px-6 py-4 flex justify-between items-center z-50 transition-transform duration-300 ${
          showNavbar ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        <Link href="/">
          <Image
            src="/images/movieclub-white.png"
            alt="Movie Club Logo"
            width={60}
            height={20}
            className="object-contain"
            priority
          />
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex space-x-10 text-lg font-regular">
          <Link href="/about" className="hover:text-gray-300">About Us</Link>
          <Link href="/films" className="hover:text-gray-300">Films</Link>
          <Link href="/festival" className="hover:text-gray-300">Catharsis</Link>
          <Link href="/contact" className="hover:text-gray-300">Contact Us</Link>
        </div>

        {/* Hamburger Button */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden flex flex-col gap-[4px] p-2 group"
          aria-label="Toggle menu"
        >
          <span className="w-6 h-[2px] bg-white transition-all group-hover:w-8" />
          <span className="w-6 h-[2px] bg-white transition-all group-hover:w-8" />
          <span className="w-6 h-[2px] bg-white transition-all group-hover:w-8" />
        </button>
      </nav>

      {/* Mobile Menu */}
      <div
        className={`fixed top-0 right-0 h-full w-64 bg-black bg-opacity-95 transform transition-transform z-40 ${
          menuOpen ? "translate-x-0" : "translate-x-full"
        } md:hidden`}
      >
        <div className="flex flex-col items-end mt-16 p-6 space-y-6">
          <button onClick={() => setMenuOpen(false)} className="text-white text-xl">✕</button>
          <Link href="/about" onClick={() => setMenuOpen(false)} className="text-lg hover:text-gray-300">About Us</Link>
          <Link href="/films" onClick={() => setMenuOpen(false)} className="text-lg hover:text-gray-300">Films</Link>
          {/* <Link href="/editorials" onClick={() => setMenuOpen(false)} className="text-lg hover:text-gray-300">Editorials</Link> */}
          <Link href="/festival" onClick={() => setMenuOpen(false)} className="text-lg hover:text-gray-300">Catharsis</Link>
          <Link href="/contact" className="hover:text-gray-300">Contact Us</Link>
        </div>
      </div>
    </>
  );
}
