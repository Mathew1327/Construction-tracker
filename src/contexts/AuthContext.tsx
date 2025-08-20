<<<<<<< HEAD
// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

interface AuthContextType {
  user: User | null;
  userRole: string | null;
  permissions: string[];
=======
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  userRole: UserRole | null;
>>>>>>> origin/main
  session: Session | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
<<<<<<< HEAD
  const [userRole, setUserRole] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
=======
  const [userRole, setUserRole] = useState<UserRole | null>(null);
>>>>>>> origin/main
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
<<<<<<< HEAD
        fetchUserRoleAndPermissions(session.user.id);
=======
        fetchUserRole(session.user.id);
>>>>>>> origin/main
      }
      setLoading(false);
    });

<<<<<<< HEAD
    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserRoleAndPermissions(session.user.id);
      } else {
        setUserRole(null);
        setPermissions([]);
=======
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserRole(session.user.id);
      } else {
        setUserRole(null);
>>>>>>> origin/main
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

<<<<<<< HEAD
  const fetchUserRoleAndPermissions = async (userId: string) => {
    // 1. Get role from profiles
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .maybeSingle(); // <-- changed from .single() to .maybeSingle()

    if (profileError) {
      console.error("Error fetching profile role:", profileError);
      return;
    }

    if (profile?.role) {
      setUserRole(profile.role);

      // 2. Get permissions from roles table
      const { data: roleData, error: roleError } = await supabase
        .from("roles")
        .select("permissions")
        .eq("role_name", profile.role)
        .maybeSingle(); // optional: safer than .single()

      if (roleError) {
        console.error("Error fetching role permissions:", roleError);
        return;
      }

      setPermissions(roleData?.permissions ?? []);
=======
  const fetchUserRole = async (userId: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    if (data && !error) {
      setUserRole(data.role);
>>>>>>> origin/main
    }
  };

  const signIn = async (email: string, password: string) => {
<<<<<<< HEAD
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
=======
    const { error } = await supabase.auth.signInWithPassword({ email, password });
>>>>>>> origin/main
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

<<<<<<< HEAD
  const value: AuthContextType = {
    user,
    userRole,
    permissions,
=======
  const value = {
    user,
    userRole,
>>>>>>> origin/main
    session,
    signIn,
    signOut,
    loading,
  };

<<<<<<< HEAD
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
=======
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
>>>>>>> origin/main
}

export function useAuth() {
  const context = useContext(AuthContext);
<<<<<<< HEAD
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
=======
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
>>>>>>> origin/main
