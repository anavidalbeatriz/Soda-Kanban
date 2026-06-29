import { FormEvent, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { authApi } from "../api/client";
import { useAuthStore } from "../store/auth";
import { btnPrimary, inputClass, labelClass } from "../components/ui/styles";
import { workspaceHomePath } from "../utils/workspace";

function AuthFormShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
      <div className="w-full max-w-md rounded-xl border border-gray-800 bg-gray-900 p-8 shadow-2xl">
        {children}
      </div>
    </div>
  );
}

export function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const { data } = await authApi.login({ email, password });
      setAuth(data.user, data.access_token, data.refresh_token);
      navigate(workspaceHomePath(data.user));
    } catch {
      setError("Invalid email or password");
    }
  };

  return (
    <AuthFormShell>
      <h1 className="text-2xl font-bold text-white mb-6">Sign in to SODA KANBAN</h1>
      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelClass}>Email</label>
          <input
            type="email"
            required
            className={inputClass}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label className={labelClass}>Password</label>
          <input
            type="password"
            required
            className={inputClass}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <p className="text-right text-sm">
          <Link to="/reset-password" className="text-blue-400 hover:text-blue-300 hover:underline">
            Forgot password?
          </Link>
        </p>
        <button type="submit" className={`w-full ${btnPrimary} py-2.5`}>
          Sign in
        </button>
      </form>
      <p className="text-center text-sm text-gray-400 mt-6">
        No account?{" "}
        <Link to="/register" className="text-blue-400 hover:text-blue-300 hover:underline">
          Register
        </Link>
      </p>
    </AuthFormShell>
  );
}

export function RegisterPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const inviteToken = searchParams.get("token") ?? undefined;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const { data } = await authApi.register({ name, email, password, invite_token: inviteToken });
      setAuth(data.user, data.access_token, data.refresh_token);
      navigate(workspaceHomePath(data.user));
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number; data?: { detail?: string } } })?.response?.status;
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      if (status === 409) {
        setError("This email is already registered. Sign in instead.");
        return;
      }
      setError(
        typeof detail === "string" && detail
          ? detail
          : inviteToken
            ? "Registration failed. The invite may be invalid or your email is already registered."
            : "Registration failed. Please try again.",
      );
    }
  };

  return (
    <AuthFormShell>
      <h1 className="text-2xl font-bold text-white mb-2">Create account</h1>
      {inviteToken && (
        <p className="text-sm text-green-400 mb-4">You have been invited to join a workspace.</p>
      )}
      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelClass}>Name</label>
          <input required className={inputClass} value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className={labelClass}>Email</label>
          <input
            type="email"
            required
            className={inputClass}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label className={labelClass}>Password</label>
          <input
            type="password"
            required
            minLength={8}
            className={inputClass}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <button type="submit" className={`w-full ${btnPrimary} py-2.5`}>
          Register
        </button>
      </form>
      <p className="text-center text-sm text-gray-400 mt-6">
        Already have an account?{" "}
        <Link to="/login" className="text-blue-400 hover:text-blue-300 hover:underline">
          Sign in
        </Link>
      </p>
    </AuthFormShell>
  );
}

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    try {
      const { data } = await authApi.resetPassword({ email, password });
      setAuth(data.user, data.access_token, data.refresh_token);
      navigate(workspaceHomePath(data.user));
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number; data?: { detail?: string } } })?.response
        ?.status;
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      if (status === 404) {
        setError(
          typeof detail === "string" && detail ? detail : "No account found for this email",
        );
        return;
      }
      setError("Could not reset password. Please try again.");
    }
  };

  return (
    <AuthFormShell>
      <h1 className="text-2xl font-bold text-white mb-2">Reset password</h1>
      <p className="text-sm text-gray-400 mb-6">Enter your email and choose a new password.</p>
      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelClass}>Email</label>
          <input
            type="email"
            required
            className={inputClass}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label className={labelClass}>New password</label>
          <input
            type="password"
            required
            minLength={8}
            className={inputClass}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div>
          <label className={labelClass}>Confirm password</label>
          <input
            type="password"
            required
            minLength={8}
            className={inputClass}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>
        <button type="submit" className={`w-full ${btnPrimary} py-2.5`}>
          Reset password
        </button>
      </form>
      <p className="text-center text-sm text-gray-400 mt-6">
        Remember your password?{" "}
        <Link to="/login" className="text-blue-400 hover:text-blue-300 hover:underline">
          Sign in
        </Link>
      </p>
    </AuthFormShell>
  );
}
