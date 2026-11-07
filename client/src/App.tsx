import { useState, useEffect, useRef } from "react";
import { Routes, Route, Link } from "react-router-dom";
import { Ticket, Users, BarChart3, Bot, LogIn, Activity, CheckCircle2, AlertCircle } from "lucide-react";

interface HealthStatus {
  status: string;
  message: string;
}

export default function App() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    const controller = new AbortController();

    fetch("/api/health", { signal: controller.signal })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((data: HealthStatus) => {
        setHealth(data);
        setLoading(false);
      })
      .catch((err: Error) => {
        if (err.name !== "AbortError") {
          setError(err.message);
          setLoading(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 leading-tight">Helper AI</h1>
            <p className="text-xs text-slate-500">Ticket Management & Autonomous Triage</p>
          </div>
        </div>

        <nav className="flex items-center gap-6 text-sm font-medium text-slate-600">
          <Link to="/" className="flex items-center gap-2 hover:text-indigo-600 transition-colors">
            <BarChart3 className="w-4 h-4" />
            Dashboard
          </Link>
          <Link to="/tickets" className="flex items-center gap-2 hover:text-indigo-600 transition-colors">
            <Ticket className="w-4 h-4" />
            Tickets
          </Link>
          <Link to="/admin/users" className="flex items-center gap-2 hover:text-indigo-600 transition-colors">
            <Users className="w-4 h-4" />
            Agents (Admin)
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          {/* Health indicator in header */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border border-slate-200 bg-slate-50">
            {loading ? (
              <span className="flex items-center gap-1.5 text-slate-500">
                <Activity className="w-3.5 h-3.5 animate-spin" />
                Connecting API...
              </span>
            ) : error ? (
              <span className="flex items-center gap-1.5 text-rose-600">
                <AlertCircle className="w-3.5 h-3.5" />
                API Offline
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-emerald-600">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                API Online
              </span>
            )}
          </div>

          <Link
            to="/login"
            className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition"
          >
            <LogIn className="w-4 h-4" />
            Sign In
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6">
        <Routes>
          <Route
            path="/"
            element={
              <div className="space-y-6">
                {/* Health Check Message Banner */}
                <div
                  className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
                    loading
                      ? "bg-slate-100 border-slate-200 text-slate-700"
                      : error
                      ? "bg-rose-50 border-rose-200 text-rose-800"
                      : "bg-emerald-50 border-emerald-200 text-emerald-900"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {loading ? (
                      <Activity className="w-5 h-5 animate-spin text-slate-500" />
                    ) : error ? (
                      <AlertCircle className="w-5 h-5 text-rose-600" />
                    ) : (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    )}
                    <div>
                      <p className="text-sm font-semibold">
                        {loading
                          ? "Checking backend health status..."
                          : error
                          ? "Backend Health Check Failed"
                          : "Backend API Health Check Passed"}
                      </p>
                      <p className="text-xs opacity-90 mt-0.5">
                        {loading
                          ? "Attempting to reach /api/health on port 3001..."
                          : error
                          ? `Error: ${error}`
                          : health?.message}
                      </p>
                    </div>
                  </div>

                  {!loading && !error && (
                    <span className="text-xs font-mono px-2.5 py-1 bg-white border border-emerald-300 rounded-md text-emerald-800 font-semibold">
                      status: {health?.status}
                    </span>
                  )}
                </div>

                <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white p-8 rounded-2xl shadow">
                  <h2 className="text-2xl font-bold mb-2">Welcome to AI Ticket Assistant</h2>
                  <p className="text-indigo-200 text-sm max-w-2xl">
                    Autonomous email classification, RAG-grounded draft responses via Google Gemini Pro,
                    and intelligent agent triage powered by Express, React, TypeScript, and Bun.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Open Tickets</span>
                    <p className="text-3xl font-extrabold text-slate-900 mt-2">0</p>
                    <p className="text-xs text-slate-500 mt-1">Awaiting agent response</p>
                  </div>

                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">AI Categorized</span>
                    <p className="text-3xl font-extrabold text-emerald-600 mt-2">100%</p>
                    <p className="text-xs text-slate-500 mt-1">Automated classification rate</p>
                  </div>

                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Agents</span>
                    <p className="text-3xl font-extrabold text-indigo-600 mt-2">1</p>
                    <p className="text-xs text-slate-500 mt-1">Ready for ticket triage</p>
                  </div>
                </div>
              </div>
            }
          />
          <Route
            path="/login"
            element={
              <div className="max-w-md mx-auto mt-12 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                <h2 className="text-xl font-bold text-slate-900">Sign in to your account</h2>
                <p className="text-xs text-slate-500 mt-1">Enter your agent or admin credentials</p>
                <form className="mt-6 space-y-4" onSubmit={(e) => e.preventDefault()}>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase">Email</label>
                    <input
                      type="email"
                      placeholder="admin@example.com"
                      className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase">Password</label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition"
                  >
                    Sign In
                  </button>
                </form>
              </div>
            }
          />
        </Routes>
      </main>
    </div>
  );
}
