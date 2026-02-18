import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "RowBook – Simple Boat Booking for Rowing Clubs",
  description:
    "RowBook helps rowing clubs manage boat reservations online. Members book 2-hour slots or full days from any device. Admins control boats, groups, and schedules with ease.",
  alternates: { canonical: "/" },
};

const features = [
  {
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    title: "Calendar-based booking",
    body:
      "Members pick a date and reserve a 2-hour slot or a full day – no spreadsheets, no phone calls, no double-bookings.",
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    title: "Group-based access control",
    body:
      "Restrict specific boats to specific squads or weight classes. Admins assign members to groups and the app handles the rest automatically.",
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
    title: "Mobile-first design",
    body:
      "Optimised for phones so members can book on the way to the boathouse. Works just as well on tablet and desktop.",
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    title: "Secure social sign-in",
    body:
      "Members log in with their existing Google, Microsoft, or Facebook account – no passwords to forget or manage.",
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
    title: "Daily bookings view",
    body:
      "See every reservation for any day at a glance. Admins can cancel bookings; members can cancel their own. Perfect for coxes and coaches.",
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
    title: "Multi-club support",
    body:
      "Each club gets its own isolated workspace. Share an invite code with your members and everyone's data stays completely separate.",
  },
];

const steps = [
  {
    number: "01",
    title: "Create your club",
    body: "Sign in and set up your club in seconds. You'll get a unique join code to share with your squad.",
  },
  {
    number: "02",
    title: "Add your boats",
    body: "Enter each boat with its name, type, and weight class. Assign boats to groups to control who can book what.",
  },
  {
    number: "03",
    title: "Members join & book",
    body: "Members sign in with Google, Microsoft, or Facebook, enter the join code, and start booking straight away.",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">

      {/* ── Nav ── */}
      <header className="border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <span className="text-xl font-bold tracking-tight">RowBook</span>
          <Link
            href="/auth/signin"
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            Sign in
          </Link>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-20 sm:py-28 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-medium px-3 py-1 rounded-full mb-6">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          Built for rowing clubs
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight mb-6">
          Boat booking,
          <br className="hidden sm:block" />{" "}
          <span className="text-blue-600 dark:text-blue-400">finally simple.</span>
        </h1>

        <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-10">
          RowBook gives your rowing club a clean, mobile-friendly way to manage boat reservations.
          No spreadsheets. No group chats. Just book and row.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/auth/signin"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3.5 rounded-xl text-lg transition-colors shadow-lg shadow-blue-200 dark:shadow-none"
          >
            Get started free
          </Link>
          <a
            href="#how-it-works"
            className="bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold px-8 py-3.5 rounded-xl text-lg transition-colors"
          >
            See how it works
          </a>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="bg-gray-50 dark:bg-gray-900 py-20 sm:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">Everything your club needs</h2>
          <p className="text-center text-gray-600 dark:text-gray-400 mb-14 max-w-xl mx-auto">
            A focused set of features that solves the real problems rowing clubs face when managing shared equipment.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((f) => (
              <div
                key={f.title}
                className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700"
              >
                <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 mb-4">
                  {f.icon}
                </div>
                <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how-it-works" className="py-20 sm:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">Up and running in minutes</h2>
          <p className="text-center text-gray-600 dark:text-gray-400 mb-14 max-w-xl mx-auto">
            No installation, no IT department, no credit card required.
          </p>
          <div className="grid sm:grid-cols-3 gap-10">
            {steps.map((s) => (
              <div key={s.number} className="text-center">
                <div className="text-5xl font-black text-blue-100 dark:text-blue-900 mb-3">{s.number}</div>
                <h3 className="font-semibold text-lg mb-2">{s.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="bg-blue-600 dark:bg-blue-700 py-16 sm:py-20">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to simplify your bookings?
          </h2>
          <p className="text-blue-100 mb-8 text-lg">
            Sign in with your Google, Microsoft, or Facebook account and set up your club in under 5 minutes.
          </p>
          <Link
            href="/auth/signin"
            className="inline-block bg-white text-blue-600 font-semibold px-8 py-3.5 rounded-xl text-lg hover:bg-blue-50 transition-colors shadow-lg"
          >
            Get started free
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-100 dark:border-gray-800 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-500 dark:text-gray-400">
          <span>© {new Date().getFullYear()} RowBook. Built for rowing clubs.</span>
          <Link href="/auth/signin" className="hover:text-blue-600 transition-colors">
            Sign in
          </Link>
        </div>
      </footer>

    </div>
  );
}
