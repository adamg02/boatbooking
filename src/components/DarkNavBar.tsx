"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getSupabaseClientComponent } from "@/lib/supabase-client";

interface DarkNavBarProps {
  title: string;
  subtitle?: string;
  isAdmin?: boolean;
  /** Optional extra content rendered between the title and the burger button */
  children?: React.ReactNode;
}

export default function DarkNavBar({ title, subtitle, isAdmin, children }: DarkNavBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = getSupabaseClientComponent();

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  // Close menu on navigation
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const handleSignOut = async () => {
    setMenuOpen(false);
    await supabase.auth.signOut();
    router.replace("/auth/signin");
  };

  return (
    <div className="sticky top-0 z-10 border-b border-gray-700 bg-gray-800 px-4 py-3 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        {/* Title */}
        <div className="mr-2">
          <h1 className="text-base font-semibold text-gray-100 leading-tight">{title}</h1>
          {subtitle && (
            <p className="text-xs text-gray-400 leading-tight mt-0.5">{subtitle}</p>
          )}
        </div>

        {/* Slot for page-specific controls */}
        {children}

        {/* Burger menu — always on the right */}
        <div className="ml-auto relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Open navigation menu"
            className="rounded p-1.5 text-gray-400 hover:bg-gray-700 hover:text-gray-100 transition-colors"
          >
            {menuOpen ? (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-52 rounded-lg border border-gray-700 bg-gray-800 shadow-xl py-1 z-50">
              {pathname !== "/boats" && (
                <Link
                  href="/boats"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-200 hover:bg-gray-700 transition-colors"
                >
                  <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                  Book a Boat
                </Link>
              )}
              {pathname !== "/calendar" && (
                <Link
                  href="/calendar"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-200 hover:bg-gray-700 transition-colors"
                >
                  <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Bookings Calendar
                </Link>
              )}
              {isAdmin && (
                <>
                  <div className="my-1 border-t border-gray-700" />
                  <Link
                    href="/admin"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-purple-300 hover:bg-gray-700 transition-colors"
                  >
                    <svg className="h-4 w-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                    </svg>
                    Admin Panel
                  </Link>
                </>
              )}
              <div className="my-1 border-t border-gray-700" />
              <button
                onClick={handleSignOut}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-gray-700 transition-colors"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
