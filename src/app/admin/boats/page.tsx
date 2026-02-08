"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";

interface Group {
  id: string;
  name: string;
}

interface Boat {
  id: string;
  name: string;
  description: string | null;
  capacity: number;
  imageUrl: string | null;
  isActive: boolean;
  boatGroups: Array<{
    group: Group;
  }>;
}

export default function AdminBoatsPage() {
  const [boats, setBoats] = useState<Boat[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingBoat, setEditingBoat] = useState<Boat | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    capacity: 1,
    imageUrl: "",
    isActive: true,
  });
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [boatsRes, groupsRes] = await Promise.all([
        fetch("/api/admin/boats"),
        fetch("/api/admin/groups"),
      ]);

      if (boatsRes.ok) {
        const boatsData = await boatsRes.json();
        setBoats(boatsData);
      }

      if (groupsRes.ok) {
        const groupsData = await groupsRes.json();
        setGroups(groupsData);
      }
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditBoat = (boat: Boat) => {
    setEditingBoat(boat);
    setFormData({
      name: boat.name,
      description: boat.description || "",
      capacity: boat.capacity,
      imageUrl: boat.imageUrl || "",
      isActive: boat.isActive,
    });
    setSelectedGroups(boat.boatGroups.map((bg) => bg.group.id));
  };

  const handleCreateBoat = () => {
    setCreating(true);
    setFormData({
      name: "",
      description: "",
      capacity: 1,
      imageUrl: "",
      isActive: true,
    });
    setSelectedGroups([]);
  };

  const handleSaveBoat = async () => {
    if (!editingBoat) return;

    setSaving(true);
    try {
      const res = await fetch("/api/admin/boats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          boatId: editingBoat.id,
          ...formData,
          groupIds: selectedGroups,
        }),
      });

      if (res.ok) {
        await loadData();
        setEditingBoat(null);
        setFormData({ name: "", description: "", capacity: 1, imageUrl: "", isActive: true });
        setSelectedGroups([]);
      } else {
        alert("Failed to update boat");
      }
    } catch (error) {
      console.error("Failed to save:", error);
      alert("Failed to update boat");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateSubmit = async () => {
    if (!formData.name.trim()) {
      alert("Boat name is required");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/boats", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          groupIds: selectedGroups,
        }),
      });

      if (res.ok) {
        await loadData();
        setCreating(false);
        setFormData({ name: "", description: "", capacity: 1, imageUrl: "", isActive: true });
        setSelectedGroups([]);
      } else {
        alert("Failed to create boat");
      }
    } catch (error) {
      console.error("Failed to create:", error);
      alert("Failed to create boat");
    } finally {
      setSaving(false);
    }
  };

  const toggleGroup = (groupId: string) => {
    setSelectedGroups((prev) =>
      prev.includes(groupId)
        ? prev.filter((id) => id !== groupId)
        : [...prev, groupId]
    );
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading boats...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-900">Boat Management</h2>
          <button
            onClick={handleCreateBoat}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            + Add Boat
          </button>
        </div>

        {/* Boats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {boats.map((boat) => (
            <div 
              key={boat.id} 
              className={`bg-white rounded-lg shadow overflow-hidden ${!boat.isActive ? 'opacity-60' : ''}`}
            >
              {boat.imageUrl && (
                <img
                  src={boat.imageUrl}
                  alt={boat.name}
                  className="w-full h-48 object-cover"
                />
              )}
              <div className="p-4">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="text-lg font-bold text-gray-900">{boat.name}</h3>
                  {!boat.isActive && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                      Inactive
                    </span>
                  )}
                </div>
                {boat.description && (
                  <p className="text-sm text-gray-600 mt-1">{boat.description}</p>
                )}
                <p className="text-sm text-gray-600 mt-2">
                  Capacity: {boat.capacity} {boat.capacity === 1 ? "person" : "people"}
                </p>
                <div className="mt-3">
                  <p className="text-xs text-gray-500 mb-1">Access Groups:</p>
                  <div className="flex flex-wrap gap-1">
                    {boat.boatGroups.length > 0 ? (
                      boat.boatGroups.map((bg) => (
                        <span
                          key={bg.group.id}
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800"
                        >
                          {bg.group.name}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-gray-400">All users</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleEditBoat(boat)}
                  className="mt-4 w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200"
                >
                  Edit Boat
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Edit Boat Modal */}
        {editingBoat && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-lg max-w-lg w-full p-6 my-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Edit {editingBoat.name}
              </h3>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Capacity
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.capacity}
                    onChange={(e) =>
                      setFormData({ ...formData, capacity: parseInt(e.target.value) || 1 })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Image URL
                  </label>
                  <input
                    type="text"
                    value={formData.imageUrl}
                    onChange={(e) =>
                      setFormData({ ...formData, imageUrl: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Boat Status
                  </label>
                  <label className="flex items-center space-x-3 p-3 rounded-lg border border-gray-300 hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) =>
                        setFormData({ ...formData, isActive: e.target.checked })
                      }
                      className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-900">
                        Active (accepting new bookings)
                      </span>
                      <p className="text-xs text-gray-500">
                        Uncheck to prevent new bookings. Existing bookings remain valid.
                      </p>
                    </div>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Access Groups (leave empty for all users)
                  </label>
                  <div className="space-y-2">
                    {groups.map((group) => (
                      <label
                        key={group.id}
                        className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedGroups.includes(group.id)}
                          onChange={() => toggleGroup(group.id)}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-900">
                          {group.name}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setEditingBoat(null);
                    setFormData({ name: "", description: "", capacity: 1, imageUrl: "", isActive: true });
                    setSelectedGroups([]);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveBoat}
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create Boat Modal */}
        {creating && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-lg w-full p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Create New Boat</h3>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. Single Scull"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Brief description of the boat"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Capacity
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.capacity}
                    onChange={(e) =>
                      setFormData({ ...formData, capacity: parseInt(e.target.value) || 1 })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Image URL
                  </label>
                  <input
                    type="text"
                    value={formData.imageUrl}
                    onChange={(e) =>
                      setFormData({ ...formData, imageUrl: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="https://example.com/boat.jpg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Access Groups (leave empty for all users)
                  </label>
                  <div className="space-y-2">
                    {groups.map((group) => (
                      <label
                        key={group.id}
                        className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedGroups.includes(group.id)}
                          onChange={() => toggleGroup(group.id)}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-900">
                          {group.name}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setCreating(false);
                    setFormData({ name: "", description: "", capacity: 1, imageUrl: "", isActive: true });
                    setSelectedGroups([]);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateSubmit}
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? "Creating..." : "Create Boat"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
