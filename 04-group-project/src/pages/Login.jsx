import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginUser } from "../services/authService";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { setUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const profile = await loginUser(form.email, form.password);
      setUser(profile);
      navigate(profile.role === "admin" ? "/admin" : "/dashboard");
    } catch (err) {
      setError(err.message.replace("Firebase: ", ""));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-parchment px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 mx-auto rounded-full border-2 border-dashed border-gold flex items-center justify-center mb-3">
            <span className="font-display text-gold">V</span>
          </div>
          <h1 className="font-display text-2xl text-ink">Verifi</h1>
          <p className="text-sm text-slate2 mt-1">Sign in to your institutional record</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white border border-ink/10 rounded-lg p-6 shadow-sm">
          {error && (
            <p className="text-rust bg-rustlight border border-rust/20 text-sm rounded px-3 py-2 mb-4">{error}</p>
          )}
          <label className="block text-xs font-mono uppercase tracking-wide text-slate2 mb-1">Email</label>
          <input
            type="email"
            required
            className="w-full border border-ink/15 rounded px-3 py-2 mb-4 text-sm focus:outline-none focus:ring-2 focus:ring-gold/40"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="you@institute.edu"
          />
          <label className="block text-xs font-mono uppercase tracking-wide text-slate2 mb-1">Password</label>
          <input
            type="password"
            required
            className="w-full border border-ink/15 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold/40"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="••••••••"
          />
          <div className="flex justify-end mt-1.5 mb-5">
            <Link to="/forgot-password" className="text-xs text-gold hover:underline">
              Forgot password?
            </Link>
          </div>
          <button
            disabled={loading}
            className="w-full bg-ink text-parchment py-2.5 rounded text-sm font-medium hover:bg-ink/90 transition-colors disabled:opacity-60"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="text-center text-sm text-slate2 mt-5">
          New here?{" "}
          <Link to="/register" className="text-gold font-medium hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}