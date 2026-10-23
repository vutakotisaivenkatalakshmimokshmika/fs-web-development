import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import StatusBadge from "../components/StatusBadge";
import { getAcademicYearOptions } from "../utils/academicYear";
import {
  getFilteredAchievements,
  reviewAchievement,
  getAnalytics,
  CATEGORIES,
} from "../services/achievementService";
import { exportPDF, exportExcel } from "../utils/export";

export default function AdminDashboard() {
  const { user } = useAuth();

  const [items, setItems] = useState([]);
  const [analytics, setAnalytics] = useState(null);

  const [filters, setFilters] = useState({
    status: "",
    category: "",
    department: "",
    role: "",
    academicYear: "",
  });

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [analyticsError, setAnalyticsError] = useState("");
  const [reviewingId, setReviewingId] = useState(null);

  const load = async () => {
    setLoading(true);
    setLoadError("");

    try {
      const data = await getFilteredAchievements(filters);
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);

      const message =
        err instanceof Error
          ? err.message
          : "Failed to load achievements.";

      setLoadError(
        message.includes("index")
          ? "This filter combination needs a Firestore index. Check the browser console for a link to create it, then retry."
          : message
      );

      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    setAnalyticsError("");

    try {
      const data = await getAnalytics();
      setAnalytics(data);
    } catch (err) {
      console.error(err);

      setAnalyticsError(
        "Couldn't load analytics — check the browser console for details."
      );
    }
  };

  useEffect(() => {
    load();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const handleReview = async (id, status) => {
    if (!user?.uid) {
      console.error("Admin user UID is unavailable.");
      return;
    }

    setReviewingId(id);

    try {
      await reviewAchievement(
        id,
        status,
        "",
        user.uid
      );

      await Promise.all([
        load(),
        loadAnalytics(),
      ]);
    } catch (err) {
      console.error(
        "Failed to review achievement:",
        err
      );

      const message =
        err instanceof Error
          ? err.message
          : "Failed to review achievement.";

      setLoadError(message);
    } finally {
      setReviewingId(null);
    }
  };

  const yearBreakdown = items.reduce(
    (acc, item) => {
      const year =
        item.academicYear || "Unspecified";

      acc[year] = (acc[year] || 0) + 1;

      return acc;
    },
    {}
  );

  const yearEntries = Object.entries(
    yearBreakdown
  ).sort((a, b) => b[0].localeCompare(a[0]));

  const maxYearCount =
    yearEntries.length > 0
      ? Math.max(
          ...yearEntries.map(
            ([, count]) => count
          )
        )
      : 0;

  const departmentBreakdown = items.reduce(
    (acc, item) => {
      const department =
        item.department || "Unspecified";

      acc[department] =
        (acc[department] || 0) + 1;

      return acc;
    },
    {}
  );

  const departmentEntries = Object.entries(
    departmentBreakdown
  ).sort((a, b) => b[1] - a[1]);

  const maxDeptCount =
    departmentEntries.length > 0
      ? Math.max(
          ...departmentEntries.map(
            ([, count]) => count
          )
        )
      : 0;

  const analyticsTotal = analytics?.total || 0;

  const academicYearOptions =
    getAcademicYearOptions(6);

  return (
    <div className="min-h-screen bg-parchment">
      <Navbar />

      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="text-xs font-mono uppercase tracking-widest text-gold mb-1">
              Administrator
            </p>

            <h1 className="font-display text-3xl text-ink">
              Verification Register
            </h1>
          </div>

          <div className="w-10 h-10 rounded-full seal flex items-center justify-center">
            <span className="font-display text-sm">
              ✓
            </span>
          </div>
        </div>

        {analyticsError && (
          <p className="text-sm text-rust bg-rustlight border border-rust/20 rounded-lg p-4 mb-8">
            {analyticsError}
          </p>
        )}

        {analytics && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              label="Total records"
              value={analytics.total}
            />

            {(analytics.byStatus || []).map(
              (statusItem) => (
                <StatCard
                  key={statusItem.name}
                  label={statusItem.name}
                  value={statusItem.count}
                  tone={statusItem.name}
                />
              )
            )}
          </div>
        )}

        {analytics?.byCategory?.length > 0 && (
          <section className="bg-white border border-ink/10 rounded-lg p-5 mb-6">
            <h2 className="font-display text-base text-ink mb-4">
              Records by category
            </h2>

            <div className="space-y-2.5">
              {analytics.byCategory.map(
                (categoryItem) => {
                  const percentage =
                    analyticsTotal > 0
                      ? (categoryItem.count /
                          analyticsTotal) *
                        100
                      : 0;

                  return (
                    <div
                      key={categoryItem.name}
                      className="flex items-center gap-3"
                    >
                      <span className="text-xs font-mono uppercase tracking-wide text-slate2 w-28 shrink-0">
                        {categoryItem.name}
                      </span>

                      <div className="flex-1 h-2 bg-parchment2 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gold rounded-full"
                          style={{
                            width: `${percentage}%`,
                          }}
                        />
                      </div>

                      <span className="text-xs font-mono text-slate2 w-6 text-right">
                        {categoryItem.count}
                      </span>
                    </div>
                  );
                }
              )}
            </div>
          </section>
        )}

        {departmentEntries.length > 0 && (
          <section className="bg-white border border-ink/10 rounded-lg p-5 mb-6">
            <div className="flex items-baseline justify-between mb-4">
              <h2 className="font-display text-base text-ink">
                Records by department
              </h2>

              <span className="text-[11px] font-mono uppercase tracking-wide text-slate2/60">
                reflects active filters below
              </span>
            </div>

            <div className="space-y-2.5">
              {departmentEntries.map(
                ([department, count]) => {
                  const percentage =
                    maxDeptCount > 0
                      ? (count / maxDeptCount) * 100
                      : 0;

                  return (
                    <div
                      key={department}
                      className="flex items-center gap-3"
                    >
                      <span className="text-xs font-mono uppercase tracking-wide text-slate2 w-28 shrink-0 truncate">
                        {department}
                      </span>

                      <div className="flex-1 h-2 bg-parchment2 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-sage rounded-full"
                          style={{
                            width: `${percentage}%`,
                          }}
                        />
                      </div>

                      <span className="text-xs font-mono text-slate2 w-6 text-right">
                        {count}
                      </span>
                    </div>
                  );
                }
              )}
            </div>
          </section>
        )}

        {yearEntries.length > 0 && (
          <section className="bg-white border border-ink/10 rounded-lg p-5 mb-8">
            <div className="flex items-baseline justify-between mb-4">
              <h2 className="font-display text-base text-ink">
                Records by academic year
              </h2>

              <span className="text-[11px] font-mono uppercase tracking-wide text-slate2/60">
                reflects active filters below
              </span>
            </div>

            <div className="space-y-2.5">
              {yearEntries.map(
                ([year, count]) => {
                  const percentage =
                    maxYearCount > 0
                      ? (count / maxYearCount) * 100
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
                        {count}
                      </span>
                    </div>
                  );
                }
              )}
            </div>
          </section>
        )}

        <section className="bg-white border border-ink/10 rounded-lg p-5 mb-6">
          <div className="flex flex-wrap items-end gap-3">
            <FilterSelect
              label="Status"
              value={filters.status}
              onChange={(value) =>
                setFilters((previous) => ({
                  ...previous,
                  status: value,
                }))
              }
              options={[
                "pending",
                "approved",
                "rejected",
              ]}
            />

            <FilterSelect
              label="Category"
              value={filters.category}
              onChange={(value) =>
                setFilters((previous) => ({
                  ...previous,
                  category: value,
                }))
              }
              options={CATEGORIES}
            />

            <FilterSelect
              label="Role"
              value={filters.role}
              onChange={(value) =>
                setFilters((previous) => ({
                  ...previous,
                  role: value,
                }))
              }
              options={["student", "faculty"]}
            />

            <FilterSelect
              label="Academic Year"
              value={filters.academicYear}
              onChange={(value) =>
                setFilters((previous) => ({
                  ...previous,
                  academicYear: value,
                }))
              }
              options={academicYearOptions}
            />

            <div>
              <label className="block text-xs font-mono uppercase tracking-wide text-slate2 mb-1">
                Department
              </label>

              <input
                type="text"
                placeholder="e.g. CSE"
                className="border border-ink/15 rounded px-3 py-2 text-sm w-32 focus:outline-none focus:ring-2 focus:ring-gold/40"
                value={filters.department}
                onChange={(event) =>
                  setFilters((previous) => ({
                    ...previous,
                    department:
                      event.target.value,
                  }))
                }
              />
            </div>

            <div className="ml-auto flex gap-2">
              <button
                type="button"
                onClick={() => exportPDF(items)}
                disabled={items.length === 0}
                className="text-sm px-4 py-2 rounded border border-ink/15 text-ink hover:bg-ink hover:text-parchment transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Export PDF
              </button>

              <button
                type="button"
                onClick={() => exportExcel(items)}
                disabled={items.length === 0}
                className="text-sm px-4 py-2 rounded bg-gold text-white hover:bg-amber transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Export Excel
              </button>
            </div>
          </div>
        </section>

        {loading ? (
          <p className="text-sm text-slate2">
            Loading records…
          </p>
        ) : loadError ? (
          <p className="text-sm text-rust bg-rustlight border border-rust/20 rounded-lg p-4">
            {loadError}
          </p>
        ) : items.length === 0 ? (
          <p className="text-sm text-slate2 bg-white border border-ink/10 rounded-lg p-6 text-center">
            No records match these filters.
          </p>
        ) : (
          <div className="bg-white border border-ink/10 rounded-lg divide-y divide-ink/5">
            {items.map((item, index) => (
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
                    <p className="font-medium text-ink truncate">
                      {item.title}
                    </p>

                    <p className="text-xs text-slate2 mt-0.5 font-mono uppercase tracking-wide">
                      {item.submittedByName ||
                        "Unknown user"}{" "}
                      · {item.role || "Unknown role"} ·{" "}
                      {item.department ||
                        "Unspecified"}{" "}
                      ·{" "}
                      {item.category ||
                        "Uncategorized"}

                      {item.academicYear &&
                        ` · ${item.academicYear}`}
                    </p>

                    {item.proofUrl && (
                      <a
                        href={item.proofUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-gold hover:underline mt-1 inline-block font-medium"
                      >
                        View proof ↗
                      </a>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <StatusBadge
                    status={item.status}
                  />

                  {item.status === "pending" && (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={
                          reviewingId === item.id
                        }
                        onClick={() =>
                          handleReview(
                            item.id,
                            "approved"
                          )
                        }
                        className="text-xs px-3 py-1.5 rounded bg-sage text-white hover:bg-sage/90 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {reviewingId === item.id
                          ? "Processing..."
                          : "Approve"}
                      </button>

                      <button
                        type="button"
                        disabled={
                          reviewingId === item.id
                        }
                        onClick={() =>
                          handleReview(
                            item.id,
                            "rejected"
                          )
                        }
                        className="text-xs px-3 py-1.5 rounded bg-rust text-white hover:bg-rust/90 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {reviewingId === item.id
                          ? "Processing..."
                          : "Reject"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options = [],
}) {
  return (
    <div>
      <label className="block text-xs font-mono uppercase tracking-wide text-slate2 mb-1">
        {label}
      </label>

      <select
        className="border border-ink/15 rounded px-3 py-2 text-sm w-36 focus:outline-none focus:ring-2 focus:ring-gold/40"
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
      >
        <option value="">All</option>

        {options.map((option) => (
          <option
            key={option}
            value={option}
          >
            {option
              ? option[0].toUpperCase() +
                option.slice(1)
              : ""}
          </option>
        ))}
      </select>
    </div>
  );
}

function StatCard({ label, value, tone }) {
  const toneMap = {
    pending: "text-amber",
    approved: "text-sage",
    rejected: "text-rust",
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