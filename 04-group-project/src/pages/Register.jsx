import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerUser } from "../services/authService";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "student",
    department: "",
    rollNoOrEmpId: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { setUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const profile = await registerUser(form);
      setUser(profile);
      navigate(profile.role === "admin" ? "/admin" : "/dashboard");
    } catch (err) {
      setError(err.message.replace("Firebase: ", ""));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-parchment px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <h1 className="font-display text-2xl text-ink">Create your record</h1>
          <p className="text-sm text-slate2 mt-1">Register as a student or faculty member</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white border border-ink/10 rounded-lg p-6 shadow-sm">
          {error && (
            <p className="text-rust bg-rustlight border border-rust/20 text-sm rounded px-3 py-2 mb-4">{error}</p>
          )}

          <label className="block text-xs font-mono uppercase tracking-wide text-slate2 mb-1">Full name</label>
          <input
            required
            className="w-full border border-ink/15 rounded px-3 py-2 mb-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold/40"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />

          <label className="block text-xs font-mono uppercase tracking-wide text-slate2 mb-1">Email</label>
          <input
            type="email"
            required
            className="w-full border border-ink/15 rounded px-3 py-2 mb-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold/40"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />

          <label className="block text-xs font-mono uppercase tracking-wide text-slate2 mb-1">Password</label>
          <input
            type="password"
            required
            minLength={6}
            className="w-full border border-ink/15 rounded px-3 py-2 mb-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold/40"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wide text-slate2 mb-1">Role</label>
              <select
                className="w-full border border-ink/15 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold/40"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              >
                <option value="student">Student</option>
                <option value="faculty">Faculty</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-mono uppercase tracking-wide text-slate2 mb-1">Department</label>
              <input
                required
                placeholder="CSE"
                className="w-full border border-ink/15 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold/40"
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
              />
            </div>
          </div>

          <label className="block text-xs font-mono uppercase tracking-wide text-slate2 mb-1">
            Roll No. / Employee ID
          </label>
          <input
            className="w-full border border-ink/15 rounded px-3 py-2 mb-5 text-sm focus:outline-none focus:ring-2 focus:ring-gold/40"
            value={form.rollNoOrEmpId}
            onChange={(e) => setForm({ ...form, rollNoOrEmpId: e.target.value })}
          />

          <button
            disabled={loading}
            className="w-full bg-ink text-parchment py-2.5 rounded text-sm font-medium hover:bg-ink/90 transition-colors disabled:opacity-60"
          >
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="text-center text-sm text-slate2 mt-5">
          Already registered?{" "}
          <Link to="/login" className="text-gold font-medium hover:underline">
            Sign in
          </Link>
        </p>
        <p className="text-center text-xs text-slate2/70 mt-3">
          Administrator accounts are provisioned separately — see README.
        </p>
      </div>
    </div>
  );
}
