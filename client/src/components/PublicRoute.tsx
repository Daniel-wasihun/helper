import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "../context/AuthContext";
import { Loader2 } from "lucide-react";

interface LocationState {
  from?: {
    pathname: string;
  };
}

export default function PublicRoute() {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (user) {
    const state = location.state as LocationState | null;
    const redirectUrl = state?.from?.pathname || "/";
    return <Navigate to={redirectUrl} replace />;
  }

  return <Outlet />;
}
