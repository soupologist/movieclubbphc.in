'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { User } from 'lucide-react';

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showNavbar, setShowNavbar] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: session, status } = useSession();
  const user = session?.user;

  const router = useRouter();

  const getRoleLabel = () => {
    if (!user?.role) return 'User';
    if (user.role === 'admin') return 'Admin';
    if (user.role === 'club') return 'Club Member';
    if (user.role === 'college') return 'BITS Student';
    return 'General User';
  };

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 50) {
        setShowNavbar(false);
      } else {
        setShowNavbar(true);
      }
      setLastScrollY(currentScrollY);

      // close dropdown on scroll
      setDropdownOpen(false);
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [lastScrollY]);

  return (
    <>
      <nav
        className={`fixed top-0 left-0 w-full px-6 py-4 flex justify-between items-center z-50 transition-transform duration-300 ${
          showNavbar ? 'translate-y-0' : '-translate-y-full'
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
        <div className="hidden md:flex items-center space-x-10 text-lg font-regular">
          <Link href="/about" className="hover:text-gray-300">
            About Us
          </Link>
          <Link href="/films" className="hover:text-gray-300">
            Films
          </Link>
          <Link href="/editorials" className="hover:text-gray-300">
            Editorials
          </Link>
          <Link href="/festival" className="hover:text-gray-300">
            Film Festival
          </Link>
          <Link href="/contact" className="hover:text-gray-300">
            Contact Us
          </Link>

          <div className="relative ml-6" ref={dropdownRef}>
            <button
              onClick={() => {
                if (status === 'authenticated') {
                  setDropdownOpen((prev) => !prev);
                } else {
                  router.push('/login');
                }
              }}
              className="flex items-center gap-2 px-3 py-1 rounded-full hover:bg-white/10"
            >
              <User size={20} />
            </button>
            {dropdownOpen && status === 'authenticated' && (
              <div className="absolute right-0 mt-2 w-56 bg-gray-900 rounded-lg shadow-lg p-4 z-50 text-sm">
                <p className="font-semibold truncate">{user?.email}</p>
                <p className="text-gray-400">{getRoleLabel()}</p>
                <hr className="my-2 border-gray-700" />
                <button onClick={() => signOut()} className="text-red-400 hover:underline text-sm">
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Hamburger */}
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

      {/* Mobile menu */}
      <div
        className={`fixed top-0 right-0 h-full w-64 bg-black bg-opacity-95 transform transition-transform z-40 ${
          menuOpen ? 'translate-x-0' : 'translate-x-full'
        } md:hidden`}
      >
        <div className="flex flex-col items-end mt-16 p-6 space-y-6">
          <button onClick={() => setMenuOpen(false)} className="text-white text-xl">
            ✕
          </button>
          <Link
            href="/about"
            onClick={() => setMenuOpen(false)}
            className="text-lg hover:text-gray-300"
          >
            About Us
          </Link>
          <Link
            href="/films"
            onClick={() => setMenuOpen(false)}
            className="text-lg hover:text-gray-300"
          >
            Films
          </Link>
          <Link
            href="/editorials"
            onClick={() => setMenuOpen(false)}
            className="text-lg hover:text-gray-300"
          >
            Editorials
          </Link>
          <Link
            href="/festival"
            onClick={() => setMenuOpen(false)}
            className="text-lg hover:text-gray-300"
          >
            Film Festival
          </Link>
          <Link
            href="/contact"
            onClick={() => setMenuOpen(false)}
            className="text-lg hover:text-gray-300"
          >
            Contact Us
          </Link>

          {status === 'authenticated' && (
            <div className="mt-6 text-sm text-white border-t pt-4 border-gray-700">
              <p>{user?.email}</p>
              <p className="text-xs text-gray-400">{getRoleLabel()}</p>
              <button onClick={() => signOut()} className="text-red-400 underline text-xs mt-1">
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
