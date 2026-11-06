"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { fireEvent } from "@/lib/gtag";
import { getSupabaseClientComponent } from "@/lib/supabase-client";
import SignOutButton from "@/components/SignOutButton";

type Tab = "create" | "join" | "nocode";

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteCode = (searchParams.get("code") ?? "").trim().toUpperCase();
  const [activeTab, setActiveTabState] = useState<Tab>("join");

  const setActiveTab = (tab: Tab) => {
    setActiveTabState(tab);
    fireEvent("onboarding_tab_switched", { tab });
  };

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

  // "No code" pitch helper
  const [pitchClubName, setPitchClubName] = useState("");
  const [pitchCopied, setPitchCopied] = useState(false);

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
        const message = data.error || "Failed to create club";
        setCreateError(message);
        fireEvent("club_create_failed", { reason: message });
        return;
      }
      router.push("/onboarding/club-created");
    } catch {
      setCreateError("An unexpected error occurred. Please try again.");
      fireEvent("club_create_failed", { reason: "network_error" });
    } finally {
      setCreating(false);
    }
  };

  const performJoin = useCallback(
    async (code: string) => {
      setJoinError(null);
      setJoining(true);
      try {
        const res = await fetch("/api/clubs/join", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ joinCode: code }),
        });
        const data = await res.json();
        if (!res.ok) {
          const message = data.error || "Failed to join club";
          setJoinError(message);
          fireEvent("join_failed", { reason: message });
          return;
        }
        fireEvent("club_joined");
        router.push("/boats");
        router.refresh();
      } catch {
        setJoinError("An unexpected error occurred. Please try again.");
        fireEvent("join_failed", { reason: "network_error" });
      } finally {
        setJoining(false);
      }
    },
    [router]
  );

  // On mount: require a session (invite links can be opened signed-out), then
  // auto-submit the invite code if one was provided in the URL.
  const initRan = useRef(false);
  useEffect(() => {
    if (initRan.current) return;
    initRan.current = true;
    const supabase = getSupabaseClientComponent();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        const next = inviteCode
          ? `/onboarding?code=${encodeURIComponent(inviteCode)}`
          : "/onboarding";
        router.replace(`/auth/signin?next=${encodeURIComponent(next)}`);
        return;
      }
      if (inviteCode) {
        setJoinCode(inviteCode);
        setActiveTabState("join");
        fireEvent("invite_link_used");
        performJoin(inviteCode);
      }
    });
  }, [inviteCode, performJoin, router]);

  const handleJoinClub = async (e: React.FormEvent) => {
    e.preventDefault();
    await performJoin(joinCode.trim());
  };

  const pitchMessage = `Hi! I found RowBook – a boat booking app made for rowing clubs. Members book boats from their phone and admins manage the fleet, groups and schedules. Could we set it up for ${pitchClubName.trim() || "our club"}? Take a look: ${typeof window !== "undefined" ? window.location.origin : ""}`;

  const handleCopyPitch = async () => {
    try {
      await navigator.clipboard.writeText(pitchMessage);
    } catch {
      const el = document.createElement("textarea");
      el.value = pitchMessage;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setPitchCopied(true);
    fireEvent("pitch_copied");
    setTimeout(() => setPitchCopied(false), 2000);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🚣</div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Welcome!</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Do you have a join code from your club? Join with it below — or set up a brand
            new club in under a minute.
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
            <button
              type="button"
              onClick={() => setActiveTab("nocode")}
              className={`flex-1 py-3 text-sm font-semibold transition-colors ${
                activeTab === "nocode"
                  ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              }`}
            >
              No Code?
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

                <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                  Don&apos;t have a code?{" "}
                  <button
                    type="button"
                    onClick={() => setActiveTab("nocode")}
                    className="text-blue-600 dark:text-blue-400 font-medium hover:underline"
                  >
                    See your options
                  </button>
                </p>
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

            {/* No code yet */}
            {activeTab === "nocode" && (
              <div className="space-y-5">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  No problem — your club may not be on RowBook yet. You have two options:
                </p>

                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                    1. Set up your club yourself
                  </h3>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    It takes under a minute. You&apos;ll become the administrator and get a
                    join code to share with your clubmates.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab("create")}
                    className="mt-3 w-full bg-green-600 text-white py-2.5 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                  >
                    Create a Club
                  </button>
                </div>

                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                    2. Ask your club to set it up
                  </h3>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    Send a ready-made message to whoever runs bookings at your club.
                  </p>
                  <input
                    type="text"
                    value={pitchClubName}
                    onChange={(e) => setPitchClubName(e.target.value)}
                    placeholder="Your club's name (optional)"
                    maxLength={100}
                    className="mt-3 w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                  <p className="mt-3 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 whitespace-pre-wrap">
                    {pitchMessage}
                  </p>
                  <button
                    type="button"
                    onClick={handleCopyPitch}
                    className="mt-3 w-full border border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400 py-2.5 rounded-lg font-semibold hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                  >
                    {pitchCopied ? "✓ Copied!" : "Copy Message"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-gray-500 dark:text-gray-500">
          Need help? Contact your club administrator for a join code, or create a new club above.
        </p>

        <div className="mt-4 flex justify-center">
          <SignOutButton />
        </div>
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <p className="text-gray-500 dark:text-gray-400">Loading…</p>
        </div>
      }
    >
      <OnboardingContent />
    </Suspense>
  );
}
