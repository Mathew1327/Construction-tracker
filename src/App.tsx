<<<<<<< HEAD
import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { LoginForm } from "./components/Auth/LoginForm";
import { Dashboard } from "./pages/Dashboard";
import { Projects } from "./pages/Projects";
import { Expenses } from "./pages/Expenses";
import { Materials } from "./pages/Materials";
import { Reports } from "./pages/Reports";
import { Phases } from "./pages/Phases";
import { Users } from "./pages/Users";
import { Documents } from "./pages/Documents";
import { RoleManagement } from "./pages/RoleManagement";
import { Profile } from "./pages/Profile";

// Generalized ProtectedRoute for roles
function ProtectedRoute({
  children,
  allowedRoles = [],
}: {
  children: React.ReactNode;
  allowedRoles?: string[];
}) {
  const { user, loading, userRole } = useAuth();
=======
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginForm } from './components/Auth/LoginForm';
import { Dashboard } from './pages/Dashboard';
import { Projects } from './pages/Projects';
import { Expenses } from './pages/Expenses';
import { Materials } from './pages/Materials';
import { Reports } from './pages/Reports';
import { Phases } from './pages/Phases';
import { Users } from './pages/Users';
import { Documents } from './pages/Documents';
import { RoleManagement } from './pages/RoleManagement';
import { Profile } from './pages/Profile';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
>>>>>>> origin/main

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

<<<<<<< HEAD
  if (!user) return <Navigate to="/login" replace />;

  if (allowedRoles.length && !allowedRoles.includes(userRole ?? "")) {
    return <Navigate to="/" replace />;
=======
  if (!user) {
    return <LoginForm />;
>>>>>>> origin/main
  }

  return <>{children}</>;
}

function App() {
  return (
    <AuthProvider>
      <Router>
<<<<<<< HEAD
        <Routes>
          <Route path="/login" element={<LoginForm />} />

          {/* Dashboard accessible by all roles */}
          <Route
            path="/"
            element={
              <ProtectedRoute allowedRoles={["Admin", "Accounts", "Project Manager", "Site Engineer", "Client"]}>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* Role-based pages */}
          <Route
            path="/projects"
            element={
              <ProtectedRoute allowedRoles={["Admin", "Project Manager", "Site Engineer", "Client"]}>
                <Projects />
              </ProtectedRoute>
            }
          />
          <Route
            path="/phases"
            element={
              <ProtectedRoute allowedRoles={["Admin", "Project Manager", "Site Engineer", "Client"]}>
                <Phases />
              </ProtectedRoute>
            }
          />
          <Route
            path="/expenses"
            element={
              <ProtectedRoute allowedRoles={["Admin", "Accounts", "Client"]}>
                <Expenses />
              </ProtectedRoute>
            }
          />
          <Route
            path="/materials"
            element={
              <ProtectedRoute allowedRoles={["Admin", "Project Manager", "Client"]}>
                <Materials />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute allowedRoles={["Admin", "Project Manager", "Client"]}>
                <Reports />
              </ProtectedRoute>
            }
          />
          <Route
            path="/documents"
            element={
              <ProtectedRoute allowedRoles={["Admin", "Accounts", "Project Manager", "Site Engineer", "Client"]}>
                <Documents />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute allowedRoles={["Admin", "Accounts", "Project Manager", "Site Engineer", "Client"]}>
                <Profile />
              </ProtectedRoute>
            }
          />

          {/* Admin-only pages */}
          <Route
            path="/users"
            element={
              <ProtectedRoute allowedRoles={["Admin"]}>
                <Users />
              </ProtectedRoute>
            }
          />
          <Route
            path="/roles"
            element={
              <ProtectedRoute allowedRoles={["Admin"]}>
                <RoleManagement />
              </ProtectedRoute>
            }
          />

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
=======
        <div className="App">
          <Routes>
            <Route path="/login" element={<LoginForm />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/projects"
              element={
                <ProtectedRoute>
                  <Projects />
                </ProtectedRoute>
              }
            />
            <Route
              path="/phases"
              element={
                <ProtectedRoute>
                  <Phases />
                </ProtectedRoute>
              }
            />
            <Route
              path="/expenses"
              element={
                <ProtectedRoute>
                  <Expenses />
                </ProtectedRoute>
              }
            />
            <Route
              path="/materials"
              element={
                <ProtectedRoute>
                  <Materials />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <ProtectedRoute>
                  <Reports />
                </ProtectedRoute>
              }
            />
            <Route
              path="/users"
              element={
                <ProtectedRoute>
                  <Users />
                </ProtectedRoute>
              }
            />
            <Route
              path="/documents"
              element={
                <ProtectedRoute>
                  <Documents />
                </ProtectedRoute>
              }
            />
            <Route
              path="/roles"
              element={
                <ProtectedRoute>
                  <RoleManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
          </Routes>
        </div>
>>>>>>> origin/main
      </Router>
    </AuthProvider>
  );
}

export default App;
