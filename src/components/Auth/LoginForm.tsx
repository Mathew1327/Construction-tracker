// src/components/Auth/LoginForm.tsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Building2, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function LoginForm() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  // Check session on load
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
          },
        });

        if (error) throw error;

        if (data?.user?.id) {
          // Profile will now be created automatically by Supabase trigger
          navigate('/', { replace: true });
        } else {
          setMessage(
            'Sign-up successful. Please check your email to confirm your account.'
          );
          navigate('/login', { replace: true });
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        navigate('/', { replace: true });
      }
    } catch (err: any) {
      setMessage(err?.message || 'Authentication error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Logout failed:', error.message);
    } else {
      navigate('/login', { replace: true });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <div className="flex justify-center">
          <Building2 className="h-12 w-12 text-blue-600" />
        </div>

        <h2 className="mt-4 text-center text-2xl font-bold">
          {user
            ? `Welcome, ${user.user_metadata?.full_name || user.email}`
            : isSignUp
            ? 'Create an Account'
            : 'Sign in to ConstructPro'}
        </h2>

        {message && (
          <div className="mt-4 text-center text-sm text-red-600">{message}</div>
        )}

        {!user ? (
          <form onSubmit={handleAuth} className="mt-6 space-y-4">
            {isSignUp && (
              <div>
                <label className="block mb-1 font-medium">Full name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="w-full border px-3 py-2 rounded"
                />
              </div>
            )}

            <div>
              <label className="block mb-1 font-medium">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full border px-3 py-2 rounded"
              />
            </div>

            <div>
              <label className="block mb-1 font-medium">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full border px-3 py-2 rounded"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-60"
            >
              {loading ? 'Please wait...' : isSignUp ? 'Register' : 'Sign In'}
            </button>
          </form>
        ) : (
          <div className="mt-6 text-center">
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 flex items-center gap-2 mx-auto"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        )}

        {!user && (
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setIsSignUp((s) => !s)}
              className="text-blue-600 hover:underline text-sm"
            >
              {isSignUp
                ? 'Already have an account? Sign in'
                : "Don't have an account? Register"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default LoginForm;
