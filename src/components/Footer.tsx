// components/Footer.tsx

import Link from "next/link";

export default function Footer() {
  return (
    <footer className="w-full px-6 md:px-12 py-10 border-t border-gray-800 text-sm text-gray-400">
      <div className="max-w-screen-xl mx-auto flex flex-col md:flex-row justify-between gap-8">
        {/* Left Section */}
        <div className="space-y-2">
          <p className="text-white font-semibold">Movie Club, BITS Hyderabad</p>
          <p className="text-xs tracking-wide uppercase">© 2025 All Rights Reserved.</p>
        </div>

        {/* Right External Links */}
        <div className="flex flex-col md:items-end space-y-1 text-sm">
          <a
            href="https://instagram.com/movieclubbphc"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white transition"
          >
            Instagram
          </a>
          <a
            href="https://www.youtube.com/@movieclubbphc"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white transition"
          >
            YouTube
          </a>
          <a
            href="https://letterboxd.com/movieclubbphc"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white transition"
          >
            Letterboxd
          </a>
        </div>
      </div>
    </footer>
  );
}
