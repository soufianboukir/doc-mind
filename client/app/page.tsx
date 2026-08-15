'use client'

import { useState } from "react";
import { ArrowRight, Menu, X } from "lucide-react";

const NAV_LINKS = ["Home", "Projects", "Studio", "Reach Us"];

export default function HeroSection() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="relative h-screen w-full overflow-hidden bg-black font-sans">
      {/* Keyframes for the load-in sequence — these were referenced via
          inline `animation` below but never defined, so nothing was
          actually animating. */}
      <style jsx>{`
        @keyframes fadeSlideUp {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      {/* Background video */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 h-full w-full object-cover object-[70%_center]"
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260622_204221_5339e40b-e73d-4ab0-9c65-79c18c66fd50.mp4"
      />

      {/* Scrim so white text/nav stays legible over any frame of the video */}
      <div className="absolute inset-0 z-[5] bg-gradient-to-b from-black/60 via-black/20 to-black/70" />

      {/* Navbar */}
      <nav className="relative z-30 flex items-center justify-between px-6 py-5 md:px-12 lg:px-16">
        <div className="flex items-center gap-10">
          <span className="text-lg font-semibold tracking-tight text-white sm:text-xl">
            Foldcraft
          </span>
          <div className="hidden items-center gap-8 md:flex">
            {NAV_LINKS.map((link) => (
              <a
                key={link}
                href="#"
                className="text-sm text-white/80 transition-colors hover:text-white"
              >
                {link}
              </a>
            ))}
          </div>
        </div>

        {/* Desktop right-side actions */}
        <div className="hidden items-center gap-3 md:flex">
          <a
            href="/login"
            className="rounded-lg px-4 py-2 text-sm font-medium text-white/85 transition-colors hover:text-white"
          >
            Log in
          </a>
          <a
            href="/signup"
            className="inline-flex items-center rounded-lg bg-white px-5 py-2 text-sm font-medium text-black transition-transform hover:scale-105"
          >
            Sign up
          </a>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          className="relative z-50 flex h-10 w-10 items-center justify-center active:scale-90 md:hidden"
          aria-label="Toggle menu"
        >
          <Menu
            className={`absolute size-6 text-white transition-all duration-300 ${
              mobileMenuOpen
                ? "rotate-90 scale-0 opacity-0"
                : "rotate-0 scale-100 opacity-100"
            }`}
          />
          <X
            className={`absolute size-6 text-white transition-all duration-300 ${
              mobileMenuOpen
                ? "rotate-0 scale-100 opacity-100"
                : "-rotate-90 scale-0 opacity-0"
            }`}
          />
        </button>
      </nav>

      {/* Mobile menu overlay */}
      <div
        className={`absolute inset-x-0 top-0 z-20 bg-black/98 backdrop-blur-xl transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          mobileMenuOpen
            ? "h-screen opacity-100"
            : "pointer-events-none h-0 opacity-0"
        }`}
      >
        <div
          className={`flex h-full flex-col justify-center px-8 transition-all duration-500 delay-100 ${
            mobileMenuOpen
              ? "translate-y-0 opacity-100"
              : "translate-y-8 opacity-0"
          }`}
        >
          {NAV_LINKS.map((link) => (
            <a
              key={link}
              href="#"
              onClick={() => setMobileMenuOpen(false)}
              className="py-3 text-3xl font-medium text-white/90 hover:text-white"
            >
              {link}
            </a>
          ))}

          <div className="mt-6 flex items-center gap-4">
            <a
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="w-fit rounded-full px-6 py-3 text-base font-medium text-white/85 hover:text-white"
            >
              Log in
            </a>
            <a
              href="/signup"
              onClick={() => setMobileMenuOpen(false)}
              className="w-fit rounded-full bg-white px-8 py-3.5 text-base font-medium text-black transition-transform hover:scale-105"
            >
              Sign up
            </a>
          </div>
        </div>
      </div>

      {/* Hero content */}
      <div className="relative z-10 flex h-[calc(100vh-80px)] flex-col justify-between px-6 pb-10 pt-12 sm:pb-12 sm:pt-16 md:px-12 md:pb-16 md:pt-20 lg:px-16">
        {/* Top: badge + heading */}
        <div className="max-w-3xl">
          <p
            className="mb-4 text-xs text-white/90 sm:mb-6 sm:text-sm"
            style={{ animation: "fadeSlideUp 0.8s ease 0.2s both" }}
          >
            AI-Powered Admissions Assistant
          </p>
          <h1
            className="text-3xl font-medium leading-[1.1] tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl"
            style={{ animation: "fadeSlideUp 0.8s ease 0.4s both" }}
          >
            Every answer
            <br />
            grounded in
            <br />
            your own documents.
          </h1>
        </div>

        {/* Bottom: paragraph + CTA */}
        <div>
          <p
            className="mb-5 max-w-sm text-sm leading-relaxed text-white/60 sm:mb-6 sm:max-w-lg sm:text-base md:text-lg"
            style={{ animation: "fadeSlideUp 0.8s ease 0.7s both" }}
          >
            DocMind reads your transcripts, program requirements, and essays
            — then answers your questions with the exact source cited, every
            time.
          </p>
          <button
            className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-black transition-transform hover:scale-105 sm:px-6 sm:py-3"
            style={{ animation: "fadeSlideUp 0.8s ease 0.9s both" }}
          >
            Try DocMind
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}