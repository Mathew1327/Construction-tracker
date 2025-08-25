// src/pages/Users.tsx
import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { Layout } from "../components/Layout/Layout";
import { Plus, Edit2, Trash2, X } from "lucide-react";

type User = {
  id: string;
  name: string;
  email: string;
  role_id: string | null;
  roles?: {
    role_name: string;
  } | null;
};

type Role = {
  id: string;
  role_name: string;
};

type Project = {
  id: string;
  name: string;
};

export function Users() {
  const { profile } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role_id: "",
    projectIds: [] as string[],
  });

  useEffect(() => {
    async function fetchData() {
      setLoading(true);

      // Fetch users with roles (JOIN)
      const { data: usersData, error: usersError } = await supabase
        .from("users")
        .select("id, name, email, role_id, roles(role_name)");

      if (usersError) console.error(usersError);
      else setUsers(usersData as User[]);

      // Fetch roles from role management
      const { data: rolesData, error: rolesError } = await supabase
        .from("roles")
        .select("id, role_name");
      if (rolesError) console.error(rolesError);
      else setRoles(rolesData as Role[]);

      // Fetch projects
      const { data: projectsData, error: projError } = await supabase
        .from("projects")
        .select("id, name");
      if (projError) console.error(projError);
      else setProjects(projectsData as Project[]);

      setLoading(false);
    }
    fetchData();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Generate random password (for emailing later)
    const password = Math.random().toString(36).slice(-8);

    // Insert user
    const { data: newUser, error: insertError } = await supabase
      .from("users")
      .insert([
        {
          name: formData.name,
          email: formData.email,
          role_id: formData.role_id || null,
        },
      ])
      .select("id, name, email, role_id, roles(role_name)")
      .single();

    if (insertError) {
      console.error(insertError);
      return;
    }

    // Map projects
    if (formData.projectIds.length > 0) {
      const mappings = formData.projectIds.map((pid) => ({
        user_id: newUser.id,
        project_id: pid,
      }));
      await supabase.from("user_projects").insert(mappings);
    }

    // Placeholder for sending email
    console.log(`Send email to ${formData.email} with password ${password}`);

    setUsers((prev) => [...prev, newUser]);
    setShowForm(false);
    setFormData({ name: "", email: "", role_id: "", projectIds: [] });
  }

  async function handleDelete(userId: string) {
    const { error } = await supabase.from("users").delete().eq("id", userId);
    if (error) console.error(error);
    else setUsers(users.filter((u) => u.id !== userId));
  }

  if (loading) return <Layout>Loading...</Layout>;

  return (
    <Layout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Users</h1>

        <button
          onClick={() => setShowForm(true)}
          className="mb-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus /> Add User
        </button>

        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="mb-6 p-4 border rounded shadow space-y-4"
          >
            <div>
              <label className="block font-semibold">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full border p-2 rounded"
                required
              />
            </div>
            <div>
              <label className="block font-semibold">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full border p-2 rounded"
                required
              />
            </div>
            <div>
              <label className="block font-semibold">Role</label>
              <select
                value={formData.role_id}
                onChange={(e) =>
                  setFormData({ ...formData, role_id: e.target.value })
                }
                className="w-full border p-2 rounded"
                required
              >
                <option value="">Select role</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.role_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold">Projects</label>
              <select
                multiple
                value={formData.projectIds}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    projectIds: Array.from(
                      e.target.selectedOptions,
                      (opt) => opt.value
                    ),
                  })
                }
                className="w-full border p-2 rounded"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border rounded hover:bg-gray-100 flex items-center gap-2"
              >
                <X /> Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2"
              >
                <Plus /> Add
              </button>
            </div>
          </form>
        )}

        {/* Users List */}
        <table className="w-full border-collapse border">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2">Name</th>
              <th className="border p-2">Email</th>
              <th className="border p-2">Role</th>
              <th className="border p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td className="border p-2">{u.name}</td>
                <td className="border p-2">{u.email}</td>
                <td className="border p-2">
                  {u.roles?.role_name || "-"}
                </td>
                <td className="border p-2 flex gap-2">
                  <button className="p-1 border rounded hover:bg-gray-100">
                    <Edit2 />
                  </button>
                  <button
                    className="p-1 border rounded hover:bg-red-100 text-red-600"
                    onClick={() => handleDelete(u.id)}
                  >
                    <Trash2 />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}