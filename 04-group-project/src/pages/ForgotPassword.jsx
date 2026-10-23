import { useState } from "react";
import { Link } from "react-router-dom";
import { resetPassword } from "../services/authService";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      await resetPassword(email);
      setSent(true);
    } catch (err) {
      console.error(err);
      if (err.code === "auth/invalid-email") {
        setError("Please enter a valid email address.");
      } else {
        // Don't reveal whether the account exists — treat as success
        setSent(true);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-parchment flex items-center justify-center px-6">
      <div className="max-w-sm w-full bg-white border border-ink/10 rounded-lg p-6">
        <h1 className="font-display text-2xl text-ink mb-1">Reset your password</h1>
        <p className="text-sm text-slate2 mb-6">
          Enter your account email and we'll send you a reset link.
        </p>

        {sent ? (
          <div className="text-sm text-sage bg-sagelight border border-sage/20 rounded px-3 py-3">
            If an account exists for that email, a reset link has been sent.
            Check your inbox (and spam folder).
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <p className="text-sm text-rust bg-rustlight border border-rust/20 rounded px-3 py-2">
                {error}
              </p>
            )}

            <div>
              <label className="block text-xs font-mono uppercase tracking-wide text-slate2 mb-1">
                Email
              </label>
              <input
                type="email"
                required
                placeholder="you@institution.edu"
                className="w-full border border-ink/15 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold/40"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-ink text-parchment py-2.5 rounded text-sm font-medium disabled:opacity-60"
            >
              {submitting ? "Sending…" : "Send reset link"}
            </button>
          </form>
        )}

        <p className="text-sm text-slate2 mt-4 text-center">
          <Link to="/login" className="text-gold hover:underline">
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}