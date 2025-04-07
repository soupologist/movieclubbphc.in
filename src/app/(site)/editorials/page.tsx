"use client"; // Required in Next.js 13+ for client-side code

import { useEffect, useRef } from "react";
import React from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function GsapTestPage() {
  const boxRef = useRef(null);

  useEffect(() => {
    gsap.fromTo(
      boxRef.current,
      { x: -200, opacity: 0 },
      { x: 0, opacity: 1, duration: 1.5, ease: "power2.out" }
    );
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div
        ref={boxRef}
        className="bg-blue-500 text-white p-6 rounded-lg text-2xl"
      >
        GSAP is Working!
      </div>
    </div>
  );
}
