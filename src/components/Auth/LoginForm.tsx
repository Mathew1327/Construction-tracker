// src/components/Auth/LoginForm.tsx
import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Building2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function LoginForm() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

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

        // If user is returned immediately (no email confirmation required),
        // create a profile row and go to dashboard.
        if (data?.user?.id) {
          await supabase.from('profiles').insert([
            { id: data.user.id, full_name: fullName, role: 'user' },
          ]);
          navigate('/', { replace: true });
        } else {
          // If email confirmation is required, inform user and send them to login.
          setMessage('Sign-up successful. Please check your email to confirm your account.');
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <div className="flex justify-center">
          <Building2 className="h-12 w-12 text-blue-600" />
        </div>

        <h2 className="mt-4 text-center text-2xl font-bold">
          {isSignUp ? 'Create an Account' : 'Sign in to ConstructPro'}
        </h2>

        {message && <div className="mt-4 text-center text-sm text-red-600">{message}</div>}

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

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => setIsSignUp((s) => !s)}
            className="text-blue-600 hover:underline text-sm"
          >
            {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Register"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default LoginForm;
