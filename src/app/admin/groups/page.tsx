"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";

interface Group {
  id: string;
  name: string;
  boatGroups: Array<{ count: number }>;
  userGroups: Array<{ count: number }>;
}

interface User {
  id: string;
  name: string | null;
  email: string;
}

interface Boat {
  id: string;
  name: string;
}

interface GroupDetails {
  id: string;
  name: string;
  userGroups: Array<{ user: User }>;
  boatGroups: Array<{ boat: Boat }>;
}

export default function AdminGroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [boats, setBoats] = useState<Boat[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingGroup, setEditingGroup] = useState<GroupDetails | null>(null);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({ name: "" });
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedBoats, setSelectedBoats] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [groupsRes, usersRes, boatsRes] = await Promise.all([
        fetch("/api/admin/groups"),
        fetch("/api/admin/users"),
        fetch("/api/admin/boats"),
      ]);

      if (groupsRes.ok) {
        const groupsData = await groupsRes.json();
        setGroups(groupsData);
      }

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData);
      }

      if (boatsRes.ok) {
        const boatsData = await boatsRes.json();
        setBoats(boatsData);
      }
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadGroupDetails = async (groupId: string) => {
    try {
      const res = await fetch(`/api/admin/groups/${groupId}`);
      if (res.ok) {
        const data = await res.json();
        return data;
      }
    } catch (error) {
      console.error("Failed to load group details:", error);
    }
    return null;
  };

  const handleCreateGroup = () => {
    setCreating(true);
    setFormData({ name: "" });
    setSelectedUsers([]);
    setSelectedBoats([]);
  };

  const handleEditGroup = async (group: Group) => {
    const details = await loadGroupDetails(group.id);
    if (details) {
      setEditingGroup(details);
      setFormData({ name: details.name });
      setSelectedUsers(details.userGroups.map((ug: any) => ug.user.id));
      setSelectedBoats(details.boatGroups.map((bg: any) => bg.boat.id));
    }
  };

  const handleCreateSubmit = async () => {
    if (!formData.name.trim()) {
      alert("Group name is required");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          userIds: selectedUsers,
          boatIds: selectedBoats,
        }),
      });

      if (res.ok) {
        await loadData();
        setCreating(false);
        setFormData({ name: "" });
        setSelectedUsers([]);
        setSelectedBoats([]);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to create group");
      }
    } catch (error) {
      console.error("Failed to create:", error);
      alert("Failed to create group");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveGroup = async () => {
    if (!editingGroup || !formData.name.trim()) {
      alert("Group name is required");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/groups", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupId: editingGroup.id,
          name: formData.name,
          userIds: selectedUsers,
          boatIds: selectedBoats,
        }),
      });

      if (res.ok) {
        await loadData();
        setEditingGroup(null);
        setFormData({ name: "" });
        setSelectedUsers([]);
        setSelectedBoats([]);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to update group");
      }
    } catch (error) {
      console.error("Failed to save:", error);
      alert("Failed to update group");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteGroup = async (groupId: string, groupName: string) => {
    if (!confirm(`Are you sure you want to delete the group "${groupName}"?`)) {
      return;
    }

    setDeleting(groupId);
    try {
      const res = await fetch(`/api/admin/groups?id=${groupId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        await loadData();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete group");
      }
    } catch (error) {
      console.error("Failed to delete:", error);
      alert("Failed to delete group");
    } finally {
      setDeleting(null);
    }
  };

  const toggleUser = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const toggleBoat = (boatId: string) => {
    setSelectedBoats((prev) =>
      prev.includes(boatId)
        ? prev.filter((id) => id !== boatId)
        : [...prev, boatId]
    );
  };

  const selectAllUsers = () => {
    setSelectedUsers(users.map(user => user.id));
  };

  const deselectAllUsers = () => {
    setSelectedUsers([]);
  };

  const selectAllBoats = () => {
    setSelectedBoats(boats.map(boat => boat.id));
  };

  const deselectAllBoats = () => {
    setSelectedBoats([]);
  };

  const getBoatCount = (group: Group) => {
    return group.boatGroups?.[0]?.count || 0;
  };

  const getUserCount = (group: Group) => {
    return group.userGroups?.[0]?.count || 0;
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading groups...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Group Management</h2>
          <button
            onClick={handleCreateGroup}
            className="bg-blue-600 text-white px-3 py-2 sm:px-4 rounded-lg hover:bg-blue-700 text-sm sm:text-base whitespace-nowrap"
          >
            + Add Group
          </button>
        </div>

        {/* Mobile: Card View */}
        <div className="sm:hidden space-y-3">
          {groups.map((group) => (
            <div key={group.id} className="bg-white rounded-lg shadow p-4">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-gray-900">
                    {group.name}
                  </h3>
                  <div className="flex gap-3 mt-2 text-xs text-gray-600">
                    <span>{getUserCount(group)} users</span>
                    <span>{getBoatCount(group)} boats</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditGroup(group)}
                    className="text-xs text-blue-600 hover:text-blue-900 font-medium px-2 py-1"
                  >
                    Edit
                  </button>
                  {group.name.toLowerCase() !== "admin" && (
                    <button
                      onClick={() => handleDeleteGroup(group.id, group.name)}
                      disabled={deleting === group.id}
                      className="text-xs text-red-600 hover:text-red-900 font-medium px-2 py-1 disabled:opacity-50"
                    >
                      {deleting === group.id ? "..." : "Delete"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop: Table View */}
        <div className="hidden sm:block bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Group Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Users
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Boats
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {groups.map((group) => (
                <tr key={group.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {group.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {getUserCount(group)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {getBoatCount(group)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm space-x-3">
                    <button
                      onClick={() => handleEditGroup(group)}
                      className="text-blue-600 hover:text-blue-900 font-medium"
                    >
                      Edit
                    </button>
                    {group.name.toLowerCase() !== "admin" && (
                      <button
                        onClick={() => handleDeleteGroup(group.id, group.name)}
                        disabled={deleting === group.id}
                        className="text-red-600 hover:text-red-900 font-medium disabled:opacity-50"
                      >
                        {deleting === group.id ? "Deleting..." : "Delete"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Create Group Modal */}
        {creating && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-lg max-w-2xl w-full p-6 my-8 max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Create New Group</h3>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Group Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. Elite Rowers"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Add Users to Group
                    </label>
                    {users.length > 0 && (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={selectAllUsers}
                          className="text-xs text-blue-600 hover:text-blue-800"
                        >
                          Select All
                        </button>
                        <button
                          type="button"
                          onClick={deselectAllUsers}
                          className="text-xs text-gray-600 hover:text-gray-800"
                        >
                          Deselect All
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="border border-gray-300 rounded-lg max-h-48 overflow-y-auto">
                    {users.length === 0 ? (
                      <div className="p-4 text-sm text-gray-500">No users available</div>
                    ) : (
                      <div className="p-2 space-y-1">
                        {users.map((user) => (
                          <label
                            key={user.id}
                            className="flex items-center space-x-3 p-2 rounded hover:bg-gray-50 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={selectedUsers.includes(user.id)}
                              onChange={() => toggleUser(user.id)}
                              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-gray-900 truncate">
                                {user.name || "No name"}
                              </div>
                              <div className="text-xs text-gray-500 truncate">
                                {user.email}
                              </div>
                            </div>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {selectedUsers.length} user(s) selected
                  </p>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Add Boats to Group
                    </label>
                    {boats.length > 0 && (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={selectAllBoats}
                          className="text-xs text-blue-600 hover:text-blue-800"
                        >
                          Select All
                        </button>
                        <button
                          type="button"
                          onClick={deselectAllBoats}
                          className="text-xs text-gray-600 hover:text-gray-800"
                        >
                          Deselect All
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="border border-gray-300 rounded-lg max-h-48 overflow-y-auto">
                    {boats.length === 0 ? (
                      <div className="p-4 text-sm text-gray-500">No boats available</div>
                    ) : (
                      <div className="p-2 space-y-1">
                        {boats.map((boat) => (
                          <label
                            key={boat.id}
                            className="flex items-center space-x-3 p-2 rounded hover:bg-gray-50 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={selectedBoats.includes(boat.id)}
                              onChange={() => toggleBoat(boat.id)}
                              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                            />
                            <span className="text-sm font-medium text-gray-900">
                              {boat.name}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {selectedBoats.length} boat(s) selected
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setCreating(false);
                    setFormData({ name: "" });
                    setSelectedUsers([]);
                    setSelectedBoats([]);
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
                  {saving ? "Creating..." : "Create Group"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Group Modal */}
        {editingGroup && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-lg max-w-2xl w-full p-6 my-8 max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Edit Group: {editingGroup.name}
              </h3>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Group Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    disabled={editingGroup.name.toLowerCase() === "admin"}
                  />
                  {editingGroup.name.toLowerCase() === "admin" && (
                    <p className="text-xs text-gray-500 mt-1">
                      Admin group name cannot be changed
                    </p>
                  )}
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Users in Group
                    </label>
                    {users.length > 0 && (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={selectAllUsers}
                          className="text-xs text-blue-600 hover:text-blue-800"
                        >
                          Select All
                        </button>
                        <button
                          type="button"
                          onClick={deselectAllUsers}
                          className="text-xs text-gray-600 hover:text-gray-800"
                        >
                          Deselect All
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="border border-gray-300 rounded-lg max-h-48 overflow-y-auto">
                    {users.length === 0 ? (
                      <div className="p-4 text-sm text-gray-500">No users available</div>
                    ) : (
                      <div className="p-2 space-y-1">
                        {users.map((user) => (
                          <label
                            key={user.id}
                            className="flex items-center space-x-3 p-2 rounded hover:bg-gray-50 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={selectedUsers.includes(user.id)}
                              onChange={() => toggleUser(user.id)}
                              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-gray-900 truncate">
                                {user.name || "No name"}
                              </div>
                              <div className="text-xs text-gray-500 truncate">
                                {user.email}
                              </div>
                            </div>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {selectedUsers.length} user(s) selected
                  </p>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Boats in Group
                    </label>
                    {boats.length > 0 && (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={selectAllBoats}
                          className="text-xs text-blue-600 hover:text-blue-800"
                        >
                          Select All
                        </button>
                        <button
                          type="button"
                          onClick={deselectAllBoats}
                          className="text-xs text-gray-600 hover:text-gray-800"
                        >
                          Deselect All
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="border border-gray-300 rounded-lg max-h-48 overflow-y-auto">
                    {boats.length === 0 ? (
                      <div className="p-4 text-sm text-gray-500">No boats available</div>
                    ) : (
                      <div className="p-2 space-y-1">
                        {boats.map((boat) => (
                          <label
                            key={boat.id}
                            className="flex items-center space-x-3 p-2 rounded hover:bg-gray-50 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={selectedBoats.includes(boat.id)}
                              onChange={() => toggleBoat(boat.id)}
                              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                            />
                            <span className="text-sm font-medium text-gray-900">
                              {boat.name}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {selectedBoats.length} boat(s) selected
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setEditingGroup(null);
                    setFormData({ name: "" });
                    setSelectedUsers([]);
                    setSelectedBoats([]);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveGroup}
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
