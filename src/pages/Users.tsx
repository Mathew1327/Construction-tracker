import React, { useEffect, useState } from 'react';
import { Layout } from '../components/Layout/Layout';
import { supabase } from '../lib/supabase';
import { User, Mail, Calendar } from 'lucide-react';

export function Users() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('profiles') // table from your SQL structure
        .select('id, full_name, email, role, created_at')
        .order('created_at', { ascending: false });

      if (error) {
        setError(error.message);
      } else {
        setUsers(data || []);
      }
      setLoading(false);
    };

    fetchUsers();
  }, []);

  return (
    <Layout>
      <div className="p-6">
        <h1 className="text-2xl font-semibold text-gray-900 mb-6">Users</h1>

        {loading && <p className="text-gray-500">Loading users...</p>}
        {error && <p className="text-red-500">{error}</p>}

        {!loading && users.length === 0 && (
          <p className="text-gray-500">No users found.</p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map((user) => (
            <div
              key={user.id}
              className="bg-white rounded-lg shadow p-4 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <User className="w-5 h-5 text-blue-500" />
                  <h2 className="text-lg font-medium">{user.full_name}</h2>
                </div>
                <p className="flex items-center text-sm text-gray-600">
                  <Mail className="w-4 h-4 mr-2" /> {user.email || 'N/A'}
                </p>
                <p className="text-sm text-gray-600">Role: {user.role || 'N/A'}</p>
                <p className="flex items-center text-sm text-gray-500">
                  <Calendar className="w-4 h-4 mr-2" /> Joined:{' '}
                  {user.created_at
                    ? new Date(user.created_at).toLocaleDateString()
                    : 'N/A'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
