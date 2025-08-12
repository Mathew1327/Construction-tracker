import React, { useEffect, useState } from "react";
import { Plus, Eye, Edit, Trash2 } from "lucide-react";
import { Layout } from "../components/Layout/Layout";
import { supabase } from "../lib/supabase";

export function Users() {
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedRole, setSelectedRole] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [viewUser, setViewUser] = useState<any | null>(null);
  const [editUser, setEditUser] = useState<any | null>(null);
  const [deleteUser, setDeleteUser] = useState<any | null>(null);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    role_id: "",
    project_id: "",
  });

  useEffect(() => {
    fetchUsers();
    fetchRoles();
    fetchProjects();
  }, []);

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from("users")
      .select(
        `
        id,
        name,
        email,
        created_at,
        active,
        roles:role_id ( role_name ),
        projects:project_id ( name )
      `
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching users:", error);
      return;
    }

    const mappedUsers = (data || [])
      .filter((u) => u.active !== false)
      .map((u) => ({
        ...u,
        role_name: u.roles?.role_name || "N/A",
        assigned_project: u.projects?.name || "None",
      }));

    setUsers(mappedUsers);
  };

  const fetchRoles = async () => {
    const { data, error } = await supabase
      .from("roles")
      .select("id, role_name")
      .order("role_name");

    if (error) {
      console.error("Error fetching roles:", error);
      return;
    }
    setRoles(data.map((r) => ({ id: r.id, name: r.role_name })));
  };

  const fetchProjects = async () => {
    const { data, error } = await supabase
      .from("projects")
      .select("id, name")
      .order("name");

    if (error) {
      console.error("Error fetching projects:", error);
      return;
    }
    setProjects(data);
  };

  const handleSaveUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.role_id) {
      alert("Please fill all required fields");
      return;
    }

    const { error: userError } = await supabase.from("users").insert([
      {
        name: newUser.name,
        email: newUser.email,
        role_id: newUser.role_id,
        project_id: newUser.project_id || null,
        active: true,
      },
    ]);

    if (userError) {
      alert(userError.message);
      return;
    }

    await sendAccountCreationEmail(newUser.email, newUser.name);

    setShowModal(false);
    setNewUser({ name: "", email: "", role_id: "", project_id: "" });
    fetchUsers();
  };

  const sendAccountCreationEmail = async (email: string, name: string) => {
    await fetch("/api/send-welcome-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, name }),
    });
  };

  const saveEditedUser = async () => {
    if (!editUser?.name.trim()) return;

    const { error } = await supabase
      .from("users")
      .update({ name: editUser.name })
      .eq("id", editUser.id);

    if (error) {
      alert("Error updating user");
      return;
    }

    setEditUser(null);
    fetchUsers();
  };

  const confirmDeleteUser = async () => {
    if (!deleteUser) return;

    const { error } = await supabase
      .from("users")
      .update({ active: false })
      .eq("id", deleteUser.id);

    if (error) {
      alert("Error deactivating user");
      return;
    }

    setUsers((prev) => prev.filter((u) => u.id !== deleteUser.id));
    setDeleteUser(null);
  };

  const filteredUsers =
    selectedRole === "All"
      ? users
      : users.filter((u) => u.role_name === selectedRole);

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

        {/* Role Filter */}
        <div className="mb-4">
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="border rounded px-3 py-2"
          >
            <option value="All">All</option>
            {roles.map((role) => (
              <option key={role.id} value={role.name}>
                {role.name}
              </option>
            ))}
          </select>
        </div>

        {/* Table */}
        <table className="min-w-full bg-white border rounded shadow">
          <thead>
            <tr className="bg-gray-100 border-b">
              <th className="px-4 py-2 text-left">Name</th>
              <th className="px-4 py-2 text-left">Email</th>
              <th className="px-4 py-2 text-left">Role</th>
              <th className="px-4 py-2 text-left">Assigned Project</th>
              <th className="px-4 py-2 text-left">Created On</th>
              <th className="px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id} className="border-b">
                <td className="px-4 py-2">{user.name}</td>
                <td className="px-4 py-2">{user.email}</td>
                <td className="px-4 py-2">{user.role_name}</td>
                <td className="px-4 py-2">{user.assigned_project}</td>
                <td className="px-4 py-2">
                  {new Date(user.created_at).toLocaleString()}
                </td>
                <td className="px-4 py-2 flex space-x-2">
                  <Eye
                    className="w-5 h-5 text-blue-500 cursor-pointer"
                    onClick={() => setViewUser(user)}
                  />
                  <Edit
                    className="w-5 h-5 text-yellow-500 cursor-pointer"
                    onClick={() => setEditUser({ ...user })}
                  />
                  <Trash2
                    className="w-5 h-5 text-red-500 cursor-pointer"
                    onClick={() => setDeleteUser(user)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Add New User Modal */}
        {showModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Add New User</h2>

              <input
                type="text"
                placeholder="Enter name"
                className="w-full border rounded px-3 py-2 mb-3"
                value={newUser.name}
                onChange={(e) =>
                  setNewUser({ ...newUser, name: e.target.value })
                }
              />
              <input
                type="email"
                placeholder="Enter email"
                className="w-full border rounded px-3 py-2 mb-3"
                value={newUser.email}
                onChange={(e) =>
                  setNewUser({ ...newUser, email: e.target.value })
                }
              />

              <select
                className="w-full border rounded px-3 py-2 mb-3"
                value={newUser.role_id}
                onChange={(e) =>
                  setNewUser({ ...newUser, role_id: e.target.value })
                }
              >
                <option value="">Select Role</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>

              <label className="block text-sm font-medium text-gray-700 mb-1">
                Assigned Project
              </label>
              <select
                className="w-full border rounded px-3 py-2 mb-3"
                value={newUser.project_id}
                onChange={(e) =>
                  setNewUser({ ...newUser, project_id: e.target.value })
                }
              >
                <option value="">None</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>

              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-200 rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveUser}
                  className="px-4 py-2 bg-purple-600 text-white rounded"
                >
                  Save User
                </button>
              </div>
            </div>
          </div>
        )}

        {/* View User Modal */}
        {viewUser && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
              <h2 className="text-xl font-semibold mb-4">User Information</h2>
              <p><strong>Name:</strong> {viewUser.name}</p>
              <p><strong>Email:</strong> {viewUser.email}</p>
              <p><strong>Role:</strong> {viewUser.role_name}</p>
              <p><strong>Project:</strong> {viewUser.assigned_project}</p>
              <div className="flex justify-end mt-4">
                <button
                  onClick={() => setViewUser(null)}
                  className="px-4 py-2 bg-gray-200 rounded"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit User Modal */}
        {editUser && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
              <h2 className="text-xl font-semibold mb-4">Edit User</h2>
              <input
                type="text"
                className="w-full border rounded px-3 py-2 mb-3"
                value={editUser.name}
                onChange={(e) =>
                  setEditUser({ ...editUser, name: e.target.value })
                }
              />
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setEditUser(null)}
                  className="px-4 py-2 bg-gray-200 rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={saveEditedUser}
                  className="px-4 py-2 bg-purple-600 text-white rounded"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteUser && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
              <h2 className="text-xl font-semibold mb-4">Confirm Delete</h2>
              <p>
                Are you sure you want to delete{" "}
                <strong>{deleteUser.name}</strong>?
              </p>
              <div className="flex justify-end space-x-2 mt-4">
                <button
                  onClick={() => setDeleteUser(null)}
                  className="px-4 py-2 bg-gray-200 rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteUser}
                  className="px-4 py-2 bg-red-600 text-white rounded"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
