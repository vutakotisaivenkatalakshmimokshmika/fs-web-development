import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import StatusBadge from "../components/StatusBadge";
import {
  submitAchievement,
  getMyAchievements,
  CATEGORIES,
} from "../services/achievementService";
import { getAcademicYearOptions } from "../utils/academicYear";

const emptyForm = {
  category: "hackathon",
  title: "",
  description: "",
  dateOfActivity: "",
  proofUrl: "",
};

export default function RecordDashboard() {
  const { user } = useAuth();

  const [items, setItems] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState("");
  const [yearFilter, setYearFilter] = useState("");

  const load = async () => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setLoadError("");

    try {
      const data = await getMyAchievements(user.uid);
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);

      const message =
        err instanceof Error
          ? err.message
          : "Failed to load achievements.";

      setLoadError(
        message.includes("index")
          ? "Firestore needs a one-time index for this view. Check the browser console for a link to create it, then refresh."
          : message
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.uid) {
      load();
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!user) {
      setNotice(
        "User information is unavailable. Please log in again."
      );
      return;
    }

    setSubmitting(true);
    setNotice("");

    try {
      await submitAchievement(user, form);

      setForm(emptyForm);
      setNotice(
        "Record submitted — pending verification."
      );

      await load();

      setTimeout(() => {
        setNotice("");
      }, 4000);
    } catch (err) {
      console.error(err);

      const message =
        err instanceof Error
          ? err.message
          : "Failed to submit achievement.";

      setNotice(message);
    } finally {
      setSubmitting(false);
    }
  };

  const visibleItems = yearFilter
    ? items.filter(
        (item) => item.academicYear === yearFilter
      )
    : items;

  const academicYearOptions =
    getAcademicYearOptions();

  const yearBreakdown = items.reduce(
    (accumulator, item) => {
      const year =
        item.academicYear || "Unspecified";

      accumulator[year] =
        (accumulator[year] || 0) + 1;

      return accumulator;
    },
    {}
  );

  const yearEntries = Object.entries(
    yearBreakdown
  ).sort((a, b) =>
    String(b[0]).localeCompare(String(a[0]))
  );

  const maxYearCount =
    yearEntries.length > 0
      ? Math.max(
          ...yearEntries.map(
            ([, count]) => Number(count)
          )
        )
      : 0;

  const counts = {
    pending: visibleItems.filter(
      (item) => item.status === "pending"
    ).length,

    approved: visibleItems.filter(
      (item) => item.status === "approved"
    ).length,

    rejected: visibleItems.filter(
      (item) => item.status === "rejected"
    ).length,
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-parchment">
        <Navbar />

        <main className="max-w-4xl mx-auto px-6 py-10">
          <p className="text-sm text-slate2">
            Loading user information…
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-parchment">
      <Navbar />

      <main className="max-w-4xl mx-auto px-6 py-10">
        <div className="mb-8">
          <p className="text-xs font-mono uppercase tracking-widest text-gold mb-1">
            {user.role} record
          </p>

          <h1 className="font-display text-3xl text-ink">
            Welcome, {user.name}
          </h1>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <StatCard
            label="Pending"
            value={counts.pending}
            tone="amber"
          />

          <StatCard
            label="Approved"
            value={counts.approved}
            tone="sage"
          />

          <StatCard
            label="Rejected"
            value={counts.rejected}
            tone="rust"
          />
        </div>

        {yearEntries.length > 1 && (
          <section className="bg-white border border-ink/10 rounded-lg p-5 mb-8">
            <h2 className="font-display text-base text-ink mb-4">
              Your records by academic year
            </h2>

            <div className="space-y-2.5">
              {yearEntries.map(
                ([year, count]) => {
                  const numericCount =
                    Number(count);

                  const percentage =
                    maxYearCount > 0
                      ? (numericCount /
                          maxYearCount) *
                        100
                      : 0;

                  return (
                    <div
                      key={year}
                      className="flex items-center gap-3"
                    >
                      <span className="text-xs font-mono uppercase tracking-wide text-slate2 w-28 shrink-0">
                        {year}
                      </span>

                      <div className="flex-1 h-2 bg-parchment2 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber rounded-full"
                          style={{
                            width: `${percentage}%`,
                          }}
                        />
                      </div>

                      <span className="text-xs font-mono text-slate2 w-6 text-right">
                        {numericCount}
                      </span>
                    </div>
                  );
                }
              )}
            </div>
          </section>
        )}

        <section className="bg-white border border-ink/10 rounded-lg p-6 mb-8 shadow-sm">
          <h2 className="font-display text-lg text-ink mb-4">
            Submit a new achievement
          </h2>

          {notice && (
            <p className="text-sage bg-sagelight border border-sage/20 text-sm rounded px-3 py-2 mb-4">
              {notice}
            </p>
          )}

          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
            <div>
              <label className="block text-xs font-mono uppercase tracking-wide text-slate2 mb-1">
                Category
              </label>

              <select
                className="w-full border border-ink/15 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold/40"
                value={form.category}
                onChange={(event) =>
                  setForm((previousForm) => ({
                    ...previousForm,
                    category:
                      event.target.value,
                  }))
                }
              >
                {CATEGORIES.map((category) => (
                  <option
                    key={category}
                    value={category}
                  >
                    {category[0].toUpperCase() +
                      category.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wide text-slate2 mb-1">
                Date
              </label>

              <input
                type="date"
                required
                className="w-full border border-ink/15 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold/40"
                value={form.dateOfActivity}
                onChange={(event) =>
                  setForm((previousForm) => ({
                    ...previousForm,
                    dateOfActivity:
                      event.target.value,
                  }))
                }
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-mono uppercase tracking-wide text-slate2 mb-1">
                Title
              </label>

              <input
                type="text"
                required
                placeholder="e.g. Winner — Smart India Hackathon 2026"
                className="w-full border border-ink/15 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold/40"
                value={form.title}
                onChange={(event) =>
                  setForm((previousForm) => ({
                    ...previousForm,
                    title: event.target.value,
                  }))
                }
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-mono uppercase tracking-wide text-slate2 mb-1">
                Description
              </label>

              <textarea
                rows={2}
                className="w-full border border-ink/15 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold/40"
                value={form.description}
                onChange={(event) =>
                  setForm((previousForm) => ({
                    ...previousForm,
                    description:
                      event.target.value,
                  }))
                }
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-mono uppercase tracking-wide text-slate2 mb-1">
                Proof link{" "}
                <span className="text-slate2/60 normal-case">
                  (certificate, LinkedIn post,
                  Drive folder, etc.)
                </span>
              </label>

              <input
                type="url"
                required
                placeholder="https://drive.google.com/..."
                className="w-full border border-ink/15 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold/40"
                value={form.proofUrl}
                onChange={(event) =>
                  setForm((previousForm) => ({
                    ...previousForm,
                    proofUrl:
                      event.target.value,
                  }))
                }
              />

              <p className="text-xs text-slate2/70 mt-1">
                Upload your certificate to Google
                Drive, set sharing to &quot;Anyone
                with the link&quot;, and paste the
                link here.
              </p>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="sm:col-span-2 bg-ink text-parchment py-2.5 rounded text-sm font-medium hover:bg-ink/90 transition-colors disabled:opacity-60"
            >
              {submitting
                ? "Submitting…"
                : "Submit for verification"}
            </button>
          </form>
        </section>

        <section>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <h2 className="font-display text-lg text-ink">
              Your records
            </h2>

            <select
              value={yearFilter}
              onChange={(event) =>
                setYearFilter(event.target.value)
              }
              className="border border-ink/15 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gold/40"
            >
              <option value="">
                All academic years
              </option>

              {academicYearOptions.map((year) => (
                <option
                  key={year}
                  value={year}
                >
                  {year}
                </option>
              ))}
            </select>
          </div>

          {loading ? (
            <p className="text-sm text-slate2">
              Loading records…
            </p>
          ) : loadError ? (
            <p className="text-sm text-rust bg-rustlight border border-rust/20 rounded-lg p-4">
              {loadError}
            </p>
          ) : visibleItems.length === 0 ? (
            <p className="text-sm text-slate2 bg-white border border-ink/10 rounded-lg p-6 text-center">
              {yearFilter
                ? `No records found for academic year ${yearFilter}.`
                : "No records yet. Submit your first achievement above."}
            </p>
          ) : (
            <div className="bg-white border border-ink/10 rounded-lg divide-y divide-ink/5">
              {visibleItems.map(
                (item, index) => (
                  <div
                    key={item.id}
                    className="p-4 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-4 min-w-0">
                      <span className="font-mono text-xs text-slate2/60 pt-0.5 shrink-0">
                        {String(index + 1).padStart(
                          3,
                          "0"
                        )}
                      </span>

                      <div className="min-w-0">
                        <p className="font-medium text-ink break-words">
                          {item.title}
                        </p>

                        <p className="text-xs text-slate2 mt-0.5 font-mono uppercase tracking-wide">
                          {item.category ||
                            "Uncategorized"}

                          {item.academicYear &&
                            ` · ${item.academicYear}`}

                          {item.dateOfActivity
                            ?.toDate &&
                            ` · ${item.dateOfActivity
                              .toDate()
                              .toLocaleDateString()}`}
                        </p>

                        {item.reviewComment && (
                          <p className="text-xs text-slate2 mt-1 italic">
                            Note:{" "}
                            {item.reviewComment}
                          </p>
                        )}

                        {item.proofUrl && (
                          <a
                            href={item.proofUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-gold hover:underline mt-1 inline-block font-medium"
                          >
                            View submitted proof ↗
                          </a>
                        )}
                      </div>
                    </div>

                    <StatusBadge
                      status={item.status}
                    />
                  </div>
                )
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function StatCard({ label, value, tone }) {
  const toneMap = {
    amber: "text-amber",
    sage: "text-sage",
    rust: "text-rust",
  };

  return (
    <div className="bg-white border border-ink/10 rounded-lg p-4">
      <p className="text-xs font-mono uppercase tracking-wide text-slate2 mb-1">
        {label}
      </p>

      <p
        className={`font-display text-3xl ${
          toneMap[tone] || "text-ink"
        }`}
      >
        {value}
      </p>
    </div>
  );
}