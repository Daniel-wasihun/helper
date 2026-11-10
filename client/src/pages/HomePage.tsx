import { useState, useEffect, useRef } from "react";
import { Link } from "react-router";
import { Activity, CheckCircle2, AlertCircle, Ticket, ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import { useAuth } from "../context/AuthContext";

interface HealthStatus {
  status: string;
  message: string;
}

export default function HomePage() {
  const { user } = useAuth();
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
    <div className="space-y-6">
      {/* Backend API Health Status */}
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
          <span className="text-xs font-mono px-2.5 py-1 bg-white border border-emerald-300 rounded-md text-emerald-800 font-semibold shadow-2xs">
            status: {health?.status}
          </span>
        )}
      </div>

      {/* Hero Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white p-8 rounded-2xl shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
            AI-Powered Support Triage
          </span>
        </div>
        <h2 className="text-2xl font-bold mb-2">
          {user ? `Welcome back, ${user.name || user.email}!` : "Welcome to Helper AI"}
        </h2>
        <p className="text-indigo-200 text-sm max-w-2xl leading-relaxed">
          Autonomous email classification, RAG-grounded draft responses via Google Gemini Pro,
          and intelligent agent triage powered by Express, React, TypeScript, and Better Auth.
        </p>

        {user ? (
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/tickets"
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition"
            >
              <Ticket className="w-4 h-4" />
              View Ticket Queue
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition"
            >
              <ShieldCheck className="w-4 h-4" />
              Sign in as Agent or Admin
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Open Tickets</span>
          <p className="text-3xl font-extrabold text-slate-900 mt-2">0</p>
          <p className="text-xs text-slate-500 mt-1">Awaiting agent response</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">AI Categorized</span>
          <p className="text-3xl font-extrabold text-emerald-600 mt-2">100%</p>
          <p className="text-xs text-slate-500 mt-1">Automated classification rate</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Agents</span>
          <p className="text-3xl font-extrabold text-indigo-600 mt-2">1</p>
          <p className="text-xs text-slate-500 mt-1">Ready for ticket triage</p>
        </div>
      </div>
    </div>
  );
}
