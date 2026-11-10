import { Routes, Route, Link } from "react-router";
import { AuthProvider } from "./context/AuthContext";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicRoute from "./components/PublicRoute";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import { Ticket, Users, ArrowLeft } from "lucide-react";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Guest-only Route (Sign In) */}
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<LoginPage />} />
        </Route>

        {/* All other routes strictly protected */}
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/" element={<HomePage />} />
            <Route
              path="/tickets"
              element={
                <div className="space-y-4">
                  <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xs">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                        <Ticket className="w-6 h-6" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-slate-900">Support Ticket Queue</h2>
                        <p className="text-xs text-slate-500">Autonomous ticket triage, status tracking, and AI drafts</p>
                      </div>
                    </div>
                    <div className="mt-8 border-t border-slate-100 pt-6 text-sm text-slate-600">
                      <p>Currently no pending tickets in the inbox. When new emails are received, they will appear here.</p>
                    </div>
                  </div>
                </div>
              }
            />
            <Route
              path="/admin/users"
              element={
                <div className="space-y-4">
                  <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xs">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                        <Users className="w-6 h-6" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-slate-900">Agent & Admin Management</h2>
                        <p className="text-xs text-slate-500">Manage support agents, admins, and permissions</p>
                      </div>
                    </div>
                    <div className="mt-8 border-t border-slate-100 pt-6 text-sm text-slate-600">
                      <p>Active administrators and support agents are synchronized with PostgreSQL and Better Auth.</p>
                    </div>
                  </div>
                </div>
              }
            />
            <Route
              path="*"
              element={
                <div className="min-h-[50vh] flex flex-col items-center justify-center text-center">
                  <h2 className="text-4xl font-extrabold text-slate-900">404</h2>
                  <p className="mt-2 text-sm text-slate-500">The page you were looking for does not exist.</p>
                  <Link
                    to="/"
                    className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Return to Dashboard
                  </Link>
                </div>
              }
            />
          </Route>
        </Route>
      </Routes>
    </AuthProvider>
  );
}
