// src/pages/Users.tsx
import React, { useEffect, useState } from "react";
import { Plus, Edit, Trash2 } from "lucide-react";
import { Layout } from "../components/Layout/Layout";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";

type Project = { id: string; name: string };
type UserRow = {
  id: string;
  full_name: string;
  email: string;
  role: string | null;
  project_id: string | null;
  project_name: string | null;
  created_at: string | null;
};

export function Users() {
  const { loading: authLoading, userRole } = useAuth();
  const isAdmin = (userRole || "").toLowerCase() === "admin";

  const [users, setUsers] = useState<UserRow[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [newUser, setNewUser] = useState({
    full_name: "",
    email: "",
    role: "",
    project_id: "",
  });

  // Fetch projects
  useEffect(() => {
    if (!isAdmin) return;
    let mounted = true;
    const fetchProjects = async () => {
      try {
        const { data, error } = await supabase
          .from("projects")
          .select("id, name")
          .order("name");
        if (error) throw error;
        if (mounted) setProjects(data || []);
      } catch (e) {
        console.error("Error fetching projects:", e);
      }
    };
    fetchProjects();
    return () => {
      mounted = false;
    };
  }, [isAdmin]);

  // Fetch users
  useEffect(() => {
    if (!isAdmin) return;
    let mounted = true;
    const fetchUsers = async () => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("id, full_name, email, role, project_id, created_at");
        if (error) throw error;

        const formattedUsers = (data || []).map((u: any) => ({
          id: u.id,
          full_name: u.full_name,
          email: u.email,
          role: u.role,
          project_id: u.project_id,
          project_name:
            projects.find((p) => p.id === u.project_id)?.name ?? "—",
          created_at: u.created_at ?? null,
        }));

        if (mounted) setUsers(formattedUsers);
      } catch (e) {
        console.error("Error fetching users:", e);
        if (mounted) setUsers([]);
      }
    };
    fetchUsers();
    return () => {
      mounted = false;
    };
  }, [projects, isAdmin]);

  // Add new user
  const handleSaveUser = async () => {
    if (!newUser.full_name.trim() || !newUser.email.trim() || !newUser.role) {
      alert("Please fill name, email, role.");
      return;
    }
    setSaving(true);
    try {
      const tempPassword = Math.random().toString(36).slice(-10);

      // Create Auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newUser.email.trim(),
        password: tempPassword,
      });
      if (authError) throw authError;

      const userId = authData.user?.id;
      if (!userId) throw new Error("Failed to get user ID");

      // Insert into profiles
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert([
          {
            id: userId,
            full_name: newUser.full_name.trim(),
            email: newUser.email.trim(),
            role: newUser.role,
            project_id: newUser.project_id || null,
          },
        ]);
      if (profileError) throw profileError;

      alert(
        `✅ User created!\nEmail: ${newUser.email}\nTemporary Password: ${tempPassword}`
      );

      setShowModal(false);
      setNewUser({ full_name: "", email: "", role: "", project_id: "" });
      // Refresh users
      const { data: refreshedData } = await supabase
        .from("profiles")
        .select("id, full_name, email, role, project_id, created_at");
      const formattedUsers = (refreshedData || []).map((u: any) => ({
        id: u.id,
        full_name: u.full_name,
        email: u.email,
        role: u.role,
        project_id: u.project_id,
        project_name:
          projects.find((p) => p.id === u.project_id)?.name ?? "—",
        created_at: u.created_at ?? null,
      }));
      setUsers(formattedUsers);
    } catch (e: any) {
      console.error(e);
      alert(e.message || "Failed to create user");
    } finally {
      setSaving(false);
    }
  };

  // Delete profile
  const handleDeleteUser = async (id: string) => {
    if (!confirm("Remove this user profile?")) return;
    try {
      const { error } = await supabase.from("profiles").delete().eq("id", id);
      if (error) throw error;
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (e: any) {
      alert(e.message || "Failed to delete profile");
    }
  };

  if (authLoading) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600" />
        </div>
      </Layout>
    );
  }

  if (!isAdmin) {
    return (
      <Layout>
        <div className="p-6 text-red-600 font-semibold">Access Denied</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">Users</h1>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center bg-purple-600 text-white px-4 py-2 rounded-lg shadow hover:bg-purple-700"
          >
            <Plus className="w-5 h-5 mr-2" /> Add New User
          </button>
        </div>

        {/* Users table */}
        <div className="overflow-x-auto bg-white border rounded shadow">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="px-4 py-2 text-left">Name</th>
                <th className="px-4 py-2 text-left">Email</th>
                <th className="px-4 py-2 text-left">Role</th>
                <th className="px-4 py-2 text-left">Assigned Project</th>
                <th className="px-4 py-2 text-left">Created</th>
                <th className="px-4 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length > 0 ? (
                users.map((u) => (
                  <tr key={u.id} className="border-b">
                    <td className="px-4 py-2">{u.full_name}</td>
                    <td className="px-4 py-2">{u.email}</td>
                    <td className="px-4 py-2">{u.role ?? "—"}</td>
                    <td className="px-4 py-2">{u.project_name ?? "—"}</td>
                    <td className="px-4 py-2">
                      {u.created_at
                        ? new Date(u.created_at).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <button
                          className="p-2 rounded hover:bg-gray-100"
                          title="Edit (not implemented)"
                        >
                          <Edit className="w-5 h-5 text-blue-600" />
                        </button>
                        <button
                          className="p-2 rounded hover:bg-gray-100"
                          onClick={() => handleDeleteUser(u.id)}
                          title="Delete"
                        >
                          <Trash2 className="w-5 h-5 text-red-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-4 py-6 text-gray-500" colSpan={6}>
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Add User Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Add New User</h2>

              <label className="text-sm font-medium">Full Name</label>
              <input
                type="text"
                className="w-full border rounded px-3 py-2 mb-3"
                value={newUser.full_name}
                onChange={(e) =>
                  setNewUser((s) => ({ ...s, full_name: e.target.value }))
                }
              />

              <label className="text-sm font-medium">Email</label>
              <input
                type="email"
                className="w-full border rounded px-3 py-2 mb-3"
                value={newUser.email}
                onChange={(e) =>
                  setNewUser((s) => ({ ...s, email: e.target.value }))
                }
              />

              <label className="text-sm font-medium">Role</label>
              <input
                type="text"
                className="w-full border rounded px-3 py-2 mb-3"
                value={newUser.role}
                onChange={(e) =>
                  setNewUser((s) => ({ ...s, role: e.target.value }))
                }
              />

              <label className="text-sm font-medium">Assigned Project</label>
              <select
                className="w-full border rounded px-3 py-2 mb-6"
                value={newUser.project_id}
                onChange={(e) =>
                  setNewUser((s) => ({ ...s, project_id: e.target.value }))
                }
              >
                <option value="">None</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>

              <div className="flex justify-end gap-2">
                <button
                  className="px-4 py-2 bg-gray-200 rounded"
                  onClick={() => setShowModal(false)}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 bg-purple-600 text-white rounded disabled:opacity-50"
                  onClick={handleSaveUser}
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save User"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
