"use client";

import { useEffect, useState } from "react";
import ManagementLayout from "@/components/ManagementLayout";
import toast, { Toaster } from "react-hot-toast";

interface AllowedIp {
  id: string;
  ip: string;
  label: string | null;
  createdAt: string;
}

export default function IpAllowlistPage() {
  const [items, setItems] = useState<AllowedIp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newIp, setNewIp] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [adding, setAdding] = useState(false);

  const load = () => {
    setLoading(true);
    fetch("/api/management/ip-allowlist")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load allowlist");
        return res.json();
      })
      .then((data) => {
        setItems(data);
        setError(null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIp.trim()) return;
    setAdding(true);
    try {
      const res = await fetch("/api/management/ip-allowlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ip: newIp.trim(), label: newLabel.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to add IP");
      } else {
        toast.success("IP address added");
        setNewIp("");
        setNewLabel("");
        load();
      }
    } catch {
      toast.error("Network error");
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: string, ip: string) => {
    if (!confirm(`Remove ${ip} from the allowlist?`)) return;
    try {
      const res = await fetch(`/api/management/ip-allowlist?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to remove IP");
      } else {
        toast.success("IP removed");
        load();
      }
    } catch {
      toast.error("Network error");
    }
  };

  return (
    <ManagementLayout>
      <Toaster position="top-right" />
      <div>
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white">IP Allowlist</h2>
          <p className="mt-1 text-gray-400">
            Only requests originating from these IP addresses can access the management console.
          </p>
        </div>

        {error && (
          <div className="bg-red-900/40 border border-red-700 text-red-300 rounded-lg p-4 mb-6">
            {error}
          </div>
        )}

        {/* Add IP form */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-white mb-4">Add IP Address</h3>
          <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="IP address (e.g. 203.0.113.42)"
              value={newIp}
              onChange={(e) => setNewIp(e.target.value)}
              required
              className="flex-1 rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              type="text"
              placeholder="Label (optional)"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              className="w-full sm:w-48 rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="submit"
              disabled={adding || !newIp.trim()}
              className="rounded-lg bg-indigo-600 px-6 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
            >
              {adding ? "Adding…" : "Add IP"}
            </button>
          </form>
        </div>

        {/* Allowed IPs list */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg">
          <div className="px-6 py-4 border-b border-gray-800">
            <h3 className="text-lg font-semibold text-white">
              Allowed IPs{" "}
              <span className="ml-2 text-sm font-normal text-gray-400">
                ({items.length} {items.length === 1 ? "entry" : "entries"})
              </span>
            </h3>
          </div>

          {loading && (
            <div className="text-gray-400 text-center py-12">Loading…</div>
          )}

          {!loading && items.length === 0 && (
            <div className="text-gray-500 text-center py-12">
              No IPs added yet. All management access will be blocked until an IP is added.
            </div>
          )}

          {!loading && items.length > 0 && (
            <ul className="divide-y divide-gray-800">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between px-6 py-4 hover:bg-gray-800/40 transition-colors"
                >
                  <div>
                    <span className="font-mono text-indigo-300 text-sm">{item.ip}</span>
                    {item.label && (
                      <span className="ml-3 text-gray-400 text-sm">{item.label}</span>
                    )}
                    <p className="text-xs text-gray-600 mt-0.5">
                      Added{" "}
                      {new Date(item.createdAt).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(item.id, item.ip)}
                    className="ml-4 rounded-md border border-red-800 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-900/40 transition-colors"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </ManagementLayout>
  );
}
