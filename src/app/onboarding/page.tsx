"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fireEvent } from "@/lib/gtag";

type Tab = "create" | "join";

export default function OnboardingPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("join");

  useEffect(() => {
    fireEvent("onboarding_started");
  }, []);

  // Create club form
  const [clubName, setClubName] = useState("");
  const [clubDescription, setClubDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Join club form
  const [joinCode, setJoinCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  const handleCreateClub = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setCreating(true);
    try {
      const res = await fetch("/api/clubs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: clubName.trim(), description: clubDescription.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCreateError(data.error || "Failed to create club");
        return;
      }
      router.push("/onboarding/club-created");
    } catch {
      setCreateError("An unexpected error occurred. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  const handleJoinClub = async (e: React.FormEvent) => {
    e.preventDefault();
    setJoinError(null);
    setJoining(true);
    try {
      const res = await fetch("/api/clubs/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ joinCode: joinCode.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setJoinError(data.error || "Failed to join club");
        return;
      }
      fireEvent("club_joined");
      router.push("/boats");
      router.refresh();
    } catch {
      setJoinError("An unexpected error occurred. Please try again.");
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🚣</div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Welcome!</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            To get started, join an existing boat club or create a new one.
          </p>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => setActiveTab("join")}
              className={`flex-1 py-3 text-sm font-semibold transition-colors ${
                activeTab === "join"
                  ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              }`}
            >
              Join a Club
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("create")}
              className={`flex-1 py-3 text-sm font-semibold transition-colors ${
                activeTab === "create"
                  ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              }`}
            >
              Create a Club
            </button>
          </div>

          <div className="p-6">
            {/* Join Club */}
            {activeTab === "join" && (
              <form onSubmit={handleJoinClub} className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Enter the join code shared by your club administrator.
                  </p>
                  <label
                    htmlFor="joinCode"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Join Code
                  </label>
                  <input
                    id="joinCode"
                    type="text"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="e.g. ABCD1234"
                    maxLength={20}
                    required
                    className="w-full px-4 py-3 text-center text-2xl tracking-widest font-mono border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white uppercase"
                  />
                </div>

                {joinError && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">
                    {joinError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={joining || !joinCode.trim()}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {joining ? "Joining..." : "Join Club"}
                </button>
              </form>
            )}

            {/* Create Club */}
            {activeTab === "create" && (
              <form onSubmit={handleCreateClub} className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Create a new club. You will be the first administrator and can invite others
                    using the generated join code.
                  </p>
                  <label
                    htmlFor="clubName"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Club Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="clubName"
                    type="text"
                    value={clubName}
                    onChange={(e) => setClubName(e.target.value)}
                    placeholder="e.g. Riverside Rowing Club"
                    maxLength={100}
                    required
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label
                    htmlFor="clubDescription"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Description <span className="text-gray-400">(optional)</span>
                  </label>
                  <textarea
                    id="clubDescription"
                    value={clubDescription}
                    onChange={(e) => setClubDescription(e.target.value)}
                    placeholder="A short description of your club..."
                    maxLength={500}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white resize-none"
                  />
                </div>

                {createError && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">
                    {createError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={creating || !clubName.trim()}
                  className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creating ? "Creating..." : "Create Club"}
                </button>
              </form>
            )}
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-gray-500 dark:text-gray-500">
          Need help? Contact your club administrator for a join code.
        </p>
      </div>
    </div>
  );
}
