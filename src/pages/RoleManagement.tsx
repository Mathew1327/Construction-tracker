import React, { useEffect, useState } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Layout } from '../components/Layout/Layout';
import { supabase } from '../lib/supabase';

export function RoleManagement() {
  const [roles, setRoles] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch roles, permissions, and mappings
  const fetchData = async () => {
    setLoading(true);

    // 1️⃣ Fetch roles
    const { data: rolesData, error: rolesError } = await supabase
      .from('roles')
      .select('*');
    if (rolesError) {
      console.error('Error fetching roles:', rolesError);
      setLoading(false);
      return;
    }

    // 2️⃣ Fetch permissions
    const { data: permData, error: permError } = await supabase
      .from('permissions')
      .select('id, name');
    if (permError) {
      console.error('Error fetching permissions:', permError);
      setLoading(false);
      return;
    }

    // 3️⃣ Fetch role-permission mappings
    const { data: rolePermData, error: rolePermError } = await supabase
      .from('role_permissions')
      .select('role_id, permission_id');
    if (rolePermError) {
      console.error('Error fetching role permissions:', rolePermError);
      setLoading(false);
      return;
    }

    // 4️⃣ Combine permissions with roles
    const formattedRoles = rolesData.map((role) => ({
      ...role,
      permissions: rolePermData
        .filter((rp) => rp.role_id === role.id)
        .map((rp) => permData.find((p) => p.id === rp.permission_id)?.name || '')
    }));

    setRoles(formattedRoles);
    setPermissions(permData.map((p) => p.name));
    setLoading(false);
  };

  // Assign permissions to a role
  const assignPermission = async (roleId: number, permissionName: string) => {
    const perm = await supabase
      .from('permissions')
      .select('id')
      .eq('name', permissionName)
      .single();

    if (!perm.data) return;

    await supabase.from('role_permissions').insert({
      role_id: roleId,
      permission_id: perm.data.id,
    });

    fetchData(); // refresh
  };

  // Remove permission from a role
  const removePermission = async (roleId: number, permissionName: string) => {
    const perm = await supabase
      .from('permissions')
      .select('id')
      .eq('name', permissionName)
      .single();

    if (!perm.data) return;

    await supabase
      .from('role_permissions')
      .delete()
      .eq('role_id', roleId)
      .eq('permission_id', perm.data.id);

    fetchData(); // refresh
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <Layout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Role Management</h1>
          <button className="bg-blue-500 text-white px-4 py-2 rounded flex items-center gap-2">
            <Plus size={18} /> Add Role
          </button>
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left border">Role</th>
                  <th className="px-4 py-2 text-left border">Permissions</th>
                  <th className="px-4 py-2 text-left border">Actions</th>
                </tr>
              </thead>
              <tbody>
                {roles.map((role) => (
                  <tr key={role.id} className="border-t">
                    <td className="px-4 py-2 border">{role.name}</td>
                    <td className="px-4 py-2 border">
                      <div className="flex flex-wrap gap-2">
                        {role.permissions.map((perm: string) => (
                          <span
                            key={perm}
                            className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm"
                          >
                            {perm}
                          </span>
                        ))}
                      </div>
                      <select
                        className="mt-2 border rounded p-1"
                        onChange={(e) => {
                          if (e.target.value) {
                            assignPermission(role.id, e.target.value);
                            e.target.value = '';
                          }
                        }}
                      >
                        <option value="">+ Add Permission</option>
                        {permissions
                          .filter((p) => !role.permissions.includes(p))
                          .map((p) => (
                            <option key={p} value={p}>
                              {p}
                            </option>
                          ))}
                      </select>
                    </td>
                    <td className="px-4 py-2 border">
                      <div className="flex gap-2">
                        <button className="p-1 bg-yellow-100 rounded">
                          <Edit size={16} />
                        </button>
                        <button className="p-1 bg-red-100 rounded">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}
