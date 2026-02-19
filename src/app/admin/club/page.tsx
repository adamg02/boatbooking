"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";

interface Club {
  id: string;
  name: string;
  description: string | null;
  joinCode: string;
  createdAt: string;
}

export default function AdminClubPage() {
  const [club, setClub] = useState<Club | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Edit mode state
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    loadClub();
  }, []);

  const loadClub = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/club");
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to load club settings");
        return;
      }
      const data = await res.json();
      setClub(data);
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = async () => {
    if (!club) return;
    try {
      await navigator.clipboard.writeText(club.joinCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for browsers that don't support clipboard API
      const el = document.createElement("textarea");
      el.value = club.joinCode;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRegenerateCode = async () => {
    setShowConfirm(false);
    setRegenerating(true);
    try {
      const res = await fetch("/api/admin/club", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "regenerateJoinCode" }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to regenerate join code");
        return;
      }
      const data = await res.json();
      setClub(data);
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setRegenerating(false);
    }
  };

  const handleSaveDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/admin/club", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName, description: editDescription || null }),
      });
      if (!res.ok) {
        const data = await res.json();
        setSaveError(data.error || "Failed to save changes");
        return;
      }
      const data = await res.json();
      setClub(data);
      setEditing(false);
    } catch {
      setSaveError("An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = () => {
    if (!club) return;
    setEditName(club.name);
    setEditDescription(club.description || "");
    setSaveError(null);
    setEditing(true);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading club settings...</div>
        </div>
      </AdminLayout>
    );
  }

  if (error && !club) {
    return (
      <AdminLayout>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-2xl">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">Club Settings</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        {club && (
          <div className="space-y-6">
            {/* Club Details Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Club Details</h3>
                {!editing && (
                  <button
                    type="button"
                    onClick={startEdit}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Edit
                  </button>
                )}
              </div>

              {editing ? (
                <form onSubmit={handleSaveDetails} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Club Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      maxLength={100}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description <span className="text-gray-400">(optional)</span>
                    </label>
                    <textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      maxLength={500}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    />
                  </div>
                  {saveError && (
                    <div className="text-sm text-red-600">{saveError}</div>
                  )}
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={saving || !editName.trim()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                    >
                      {saving ? "Saving..." : "Save Changes"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditing(false)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <dl className="space-y-3">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Name</dt>
                    <dd className="mt-1 text-gray-900">{club.name}</dd>
                  </div>
                  {club.description && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Description</dt>
                      <dd className="mt-1 text-gray-900">{club.description}</dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Created</dt>
                    <dd className="mt-1 text-gray-900">
                      {new Date(club.createdAt).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </dd>
                  </div>
                </dl>
              )}
            </div>

            {/* Join Code Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Join Code</h3>
              <p className="text-sm text-gray-500 mb-4">
                Share this code with new members so they can join your club.
              </p>

              <div className="flex items-center gap-3">
                <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                  <span className="text-3xl font-mono font-bold tracking-widest text-gray-900">
                    {club.joinCode}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="px-4 py-3 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors whitespace-nowrap"
                >
                  {copied ? "✓ Copied!" : "Copy Code"}
                </button>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-sm text-gray-500 mb-3">
                  Regenerating the join code will invalidate the old one. Anyone who hasn&apos;t
                  joined yet will need the new code.
                </p>

                {showConfirm ? (
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-700">Are you sure?</span>
                    <button
                      type="button"
                      onClick={handleRegenerateCode}
                      disabled={regenerating}
                      className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
                    >
                      {regenerating ? "Regenerating..." : "Yes, regenerate"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowConfirm(false)}
                      className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowConfirm(true)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                  >
                    Regenerate Join Code
                  </button>
                )}
              </div>
            </div>

          </div>
        )}
      </div>
    </AdminLayout>
  );
}
