import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Bot, Mail, Lock, Eye, EyeOff, Loader2, AlertCircle, ArrowLeft, KeyRound } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(6, "Password must be at least 6 characters"),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface LocationState {
  from?: {
    pathname: string;
  };
}

export default function LoginPage() {
  const { signIn, refetchSession } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setServerError(null);

    try {
      const response = await signIn({
        email: data.email.trim(),
        password: data.password,
      });

      if (response.error) {
        setServerError(response.error.message || "Invalid email or password. Please try again.");
        return;
      }

      // Refresh session state and navigate
      refetchSession();
      const state = location.state as LocationState | null;
      const destination = state?.from?.pathname || "/";
      navigate(destination, { replace: true });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to sign in. Please check your connection.";
      setServerError(message);
    }
  };

  const handleFillDemoAdmin = () => {
    setValue("email", "admin@example.com", { shouldValidate: true });
    setValue("password", "password123", { shouldValidate: true });
    clearErrors();
    setServerError(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Top back link */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4 mb-4">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-indigo-600 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Dashboard
        </Link>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-600 rounded-xl text-white shadow-xs mb-3">
            <Bot className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Sign in to Helper AI</h2>
          <p className="mt-1 text-sm text-slate-500">
            Enter your agent or administrator credentials to access your dashboard.
          </p>
        </div>

        {/* Card */}
        <div className="mt-8 bg-white py-8 px-6 shadow-xs border border-slate-200 rounded-2xl sm:px-10">
          {/* Server Error Banner */}
          {serverError && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-800 text-sm">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-rose-900">Sign In Failed</p>
                <p className="mt-0.5 text-xs text-rose-700">{serverError}</p>
              </div>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Email address
              </label>
              <div className="mt-1.5 relative rounded-lg">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="admin@example.com"
                  {...register("email")}
                  className={`block w-full pl-10 pr-3 py-2.5 border rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none transition ${
                    errors.email
                      ? "border-rose-300 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 bg-rose-50/20"
                      : "border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  }`}
                />
              </div>
              {errors.email && (
                <p className="mt-1.5 text-xs text-rose-600 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Password
              </label>
              <div className="mt-1.5 relative rounded-lg">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  {...register("password")}
                  className={`block w-full pl-10 pr-10 py-2.5 border rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none transition ${
                    errors.password
                      ? "border-rose-300 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 bg-rose-50/20"
                      : "border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs text-rose-600 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {errors.password.message}
                </p>
              )}
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-lg text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed transition shadow-xs cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <span>Sign In</span>
                )}
              </button>
            </div>
          </form>

          {/* Quick Demo Credentials Hint */}
          <div className="mt-6 pt-6 border-t border-slate-100">
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                  <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
                  Default Admin Credentials
                </span>
                <button
                  type="button"
                  onClick={handleFillDemoAdmin}
                  className="text-xs text-indigo-600 font-semibold hover:text-indigo-800 transition cursor-pointer underline underline-offset-2"
                >
                  Fill credentials
                </button>
              </div>
              <p className="text-[11px] font-mono text-slate-500 mt-1">
                admin@example.com / password123
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
