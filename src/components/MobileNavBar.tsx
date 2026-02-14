"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import SignOutButton from "@/components/SignOutButton";

interface NavBarProps {
  isAdmin?: boolean;
  title: string;
  subtitle?: string;
}

export default function MobileNavBar({ isAdmin, title, subtitle }: NavBarProps) {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Close menu when route changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (isMenuOpen && !target.closest('.mobile-nav-menu') && !target.closest('.mobile-nav-toggle')) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isMenuOpen]);

  return (
    <header className="bg-white dark:bg-gray-800 shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between gap-3">
          {/* Left section: Menu button (mobile) + Title */}
          <div className="flex items-center gap-3">
            {/* Hamburger menu button - visible on mobile */}
            <button
              type="button"
              className="md:hidden mobile-nav-toggle inline-flex items-center justify-center rounded-md p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              aria-label="Toggle navigation menu"
              aria-expanded={isMenuOpen}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {/* Hamburger icon */}
              {!isMenuOpen ? (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              ) : (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </button>

            {/* Title */}
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">{title}</h1>
              {subtitle && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {/* Right section: Desktop navigation + Sign out */}
          <div className="hidden md:flex items-center gap-2">
            {pathname !== "/boats" && (
              <Link
                href="/boats"
                className="text-xs sm:text-sm bg-gray-200 text-gray-800 px-3 py-2 rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600 transition-colors whitespace-nowrap"
              >
                Boats
              </Link>
            )}
            {pathname !== "/daily-bookings" && (
              <Link
                href="/daily-bookings"
                className="text-xs sm:text-sm bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
              >
                Daily Bookings
              </Link>
            )}
            {isAdmin && (
              <Link
                href="/admin"
                className="text-xs sm:text-sm bg-purple-600 text-white px-3 py-2 rounded-lg hover:bg-purple-700 transition-colors whitespace-nowrap"
              >
                Admin
              </Link>
            )}
            <SignOutButton />
          </div>

          {/* Mobile sign out button - visible on mobile */}
          <div className="md:hidden">
            <SignOutButton />
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMenuOpen && (
          <nav className="md:hidden mobile-nav-menu border-t border-gray-200 dark:border-gray-700 mt-4 pt-4">
            <div className="flex flex-col space-y-2">
              {pathname !== "/boats" && (
                <Link
                  href="/boats"
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  Boats
                </Link>
              )}
              {pathname !== "/daily-bookings" && (
                <Link
                  href="/daily-bookings"
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  Daily Bookings
                </Link>
              )}
              {isAdmin && (
                <Link
                  href="/admin"
                  className="px-3 py-2 rounded-md text-sm font-medium text-purple-700 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
                >
                  Admin Panel
                </Link>
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
