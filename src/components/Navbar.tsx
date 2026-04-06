'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { User, Menu, X } from 'lucide-react';

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
    switch (user?.role) {
      case 'admin':
        return 'Admin';
      case 'club':
        return 'Club Member';
      case 'college':
        return 'BITS Student';
      default:
        return 'User';
    }
  };

  // Hide navbar on scroll down
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setShowNavbar(currentScrollY < lastScrollY || currentScrollY < 50);
      setLastScrollY(currentScrollY);
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

  const navLinks = [
    { href: '/about', label: 'About Us' },
    { href: '/films', label: 'Films' },
    { href: '/festival', label: 'Film Festival' },
    { href: '/contact', label: 'Contact Us' },
  ];

  const handleUserClick = () => {
    if (status === 'authenticated') {
      setDropdownOpen((prev) => !prev);
    } else {
      router.push('/login');
    }
  };

  return (
    <>
      <nav
        className={`fixed top-0 left-0 w-full px-6 py-4 flex justify-between items-center z-50 transition-transform duration-300 backdrop-blur-md bg-black/60 text-white ${
          showNavbar ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/images/movieclub-white.png"
            alt="Movie Club Logo"
            width={60}
            height={20}
            className="object-contain"
            priority
          />
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center space-x-10 text-lg">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-gray-300">
              {link.label}
            </Link>
          ))}

          {status === 'authenticated' && (
            <Link href="/club/filmoftheweek" className="hover:text-gray-300">
              Film of the Week
            </Link>
          )}

          <div className="relative ml-6" ref={dropdownRef}>
            <button
              onClick={handleUserClick}
              className="flex items-center gap-2 px-3 py-1 rounded-full hover:bg-white/10 focus:outline-none"
              aria-label="User menu"
            >
              <User size={20} />
            </button>

            {dropdownOpen && status === 'authenticated' && (
              <div className="absolute right-0 mt-2 w-60 bg-gray-900 rounded-xl shadow-lg p-4 z-50 text-sm">
                <p className="font-semibold truncate">{user?.email}</p>
                <div className="flex items-center justify-between text-gray-400">
                  <span>{getRoleLabel()}</span>

                  {/* Inline admin link */}
                  {user?.role === 'admin' && (
                    <Link
                      href="/admin"
                      className="text-blue-400 hover:underline flex items-center gap-1 text-xs"
                    >
                      Dashboard →
                    </Link>
                  )}
                </div>

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
          onClick={() => setMenuOpen(true)}
          className="md:hidden p-2 text-white"
          aria-label="Open menu"
        >
          <Menu size={28} />
        </button>
      </nav>

      {/* Mobile Overlay */}
      <div
        className={`fixed inset-0 z-40 transition-all duration-300 ${
          menuOpen ? 'bg-black/50 backdrop-blur-sm visible' : 'invisible'
        }`}
        onClick={() => setMenuOpen(false)}
      />

      {/* Mobile Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-72 bg-gray-950 text-white shadow-xl transform transition-transform duration-300 z-50 ${
          menuOpen ? 'translate-x-0' : 'translate-x-full'
        } md:hidden flex flex-col`}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <span className="text-lg font-semibold">Menu</span>
          <button onClick={() => setMenuOpen(false)} aria-label="Close menu">
            <X size={26} />
          </button>
        </div>

        <div className="flex flex-col p-6 space-y-4 text-base">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="hover:text-gray-300"
            >
              {link.label}
            </Link>
          ))}

          {status === 'authenticated' && (
            <Link
              href="/club/filmoftheweek"
              onClick={() => setMenuOpen(false)}
              className="hover:text-gray-300"
            >
              Film of the Week
            </Link>
          )}

          {user?.role === 'admin' && (
            <Link
              href="/admin"
              onClick={() => setMenuOpen(false)}
              className="hover:text-blue-400 font-medium mt-2"
            >
              Admin Dashboard
            </Link>
          )}

          {status === 'authenticated' ? (
            <div className="pt-6 border-t border-gray-800 text-sm text-gray-300">
              <p className="truncate">{user?.email}</p>
              <p className="text-gray-400 text-xs">{getRoleLabel()}</p>
              <button onClick={() => signOut()} className="text-red-400 underline text-xs mt-2">
                Sign Out
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              onClick={() => setMenuOpen(false)}
              className="text-blue-400 underline mt-4 text-sm"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </>
  );
}
