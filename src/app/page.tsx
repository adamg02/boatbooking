import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <main className="text-center max-w-md">
        <h1 className="text-4xl font-bold mb-4">Boat Booking</h1>
        <p className="text-lg mb-8 text-gray-600 dark:text-gray-400">
          Book your rowing boat session
        </p>
        <Link 
          href="/auth/signin"
          className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Sign In
        </Link>
      </main>
    </div>
  );
}
