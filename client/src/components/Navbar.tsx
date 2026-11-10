import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router";
import { Ticket, Users, BarChart3, Bot, LogIn, LogOut, Activity, AlertCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";

interface HealthStatus {
  status: string;
  message: string;
}

export default function Navbar() {
  const { user, isLoading, signOut } = useAuth();
  const navigate = useNavigate();

  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [healthLoading, setHealthLoading] = useState<boolean>(true);
  const [healthError, setHealthError] = useState<string | null>(null);
  const hasFetchedHealth = useRef(false);

  useEffect(() => {
    if (hasFetchedHealth.current) return;
    hasFetchedHealth.current = true;

    const controller = new AbortController();

    fetch("/api/health", { signal: controller.signal })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        return res.json();
      })
      .then((data: HealthStatus) => {
        setHealth(data);
        setHealthLoading(false);
      })
      .catch((err: Error) => {
        if (err.name !== "AbortError") {
          setHealthError(err.message);
          setHealthLoading(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/");
    } catch (err) {
      console.error("Sign out error:", err);
    }
  };

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase() || "U";

  return (
    <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-xs">
      <div className="flex items-center gap-3">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 bg-indigo-600 group-hover:bg-indigo-700 transition-colors rounded-lg flex items-center justify-center text-white font-bold shadow-xs">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 leading-tight">Helper AI</h1>
            <p className="text-xs text-slate-500">Ticket Management & Autonomous Triage</p>
          </div>
        </Link>
      </div>

      <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
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
        {/* Backend Health Status Badge */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border border-slate-200 bg-slate-50">
          {healthLoading ? (
            <span className="flex items-center gap-1.5 text-slate-500">
              <Activity className="w-3.5 h-3.5 animate-spin" />
              Connecting API...
            </span>
          ) : healthError ? (
            <span className="flex items-center gap-1.5 text-rose-600">
              <AlertCircle className="w-3.5 h-3.5" />
              API Offline
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-emerald-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              API Online ({health?.status || "ok"})
            </span>
          )}
        </div>

        {/* Dynamic Authentication Controls */}
        {isLoading ? (
          <div className="h-9 w-24 bg-slate-100 animate-pulse rounded-lg" />
        ) : user ? (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5 pl-2 pr-3 py-1 bg-slate-50 border border-slate-200 rounded-lg">
              <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-semibold">
                {userInitial}
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xs font-semibold text-slate-800 leading-tight">
                  {user.name || user.email}
                </span>
                {user.role && (
                  <span className="text-[10px] text-indigo-600 font-medium tracking-wide uppercase">
                    {user.role}
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border border-slate-200 hover:border-slate-300 bg-white text-slate-700 hover:bg-slate-50 font-medium transition cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5 text-slate-500" />
              <span>Sign Out</span>
            </button>
          </div>
        ) : (
          <Link
            to="/login"
            className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition shadow-xs"
          >
            <LogIn className="w-4 h-4" />
            <span>Sign In</span>
          </Link>
        )}
      </div>
    </header>
  );
}
