import AdminLayout from "@/components/admin/layout/AdminLayout";
import { BarChart3, BookOpen, Star, TrendingUp, Users } from "lucide-react";
import { useMemo, useState } from "react";

/* ===============================
   DEMO DATA (API-FRIENDLY SHAPE)
================================ */

const DEMO_COURSE_PERFORMANCE = {
  summary: {
    totalEnrollments: 312,
    totalCompletions: 58,
    completionRatePct: 19,
    avgRating: 4.4,
  },
  courses: [
    {
      _id: "c1",
      title: "HTML CSS TailwindCSS Course",
      category: "Development",
      level: "beginner",
      language: "en",
      isPublished: true,

      enrollments: 148,
      activeLearners: 63,
      completions: 21,
      completionRatePct: 14,

      revenue: 3200,
      currency: "USD",

      rating: 4.6,
      ratingCount: 44,
      lastActivityAt: "2025-12-14T01:26:47.000Z",
    },
    {
      _id: "c2",
      title: "Modern JavaScript Mastery",
      category: "Development",
      level: "intermediate",
      language: "en",
      isPublished: true,

      enrollments: 104,
      activeLearners: 41,
      completions: 26,
      completionRatePct: 25,

      revenue: 2000,
      currency: "USD",

      rating: 4.3,
      ratingCount: 31,
      lastActivityAt: "2025-12-13T22:11:10.000Z",
    },
    {
      _id: "c3",
      title: "React & TypeScript Fundamentals",
      category: "Development",
      level: "intermediate",
      language: "en",
      isPublished: false,

      enrollments: 60,
      activeLearners: 19,
      completions: 11,
      completionRatePct: 18,

      revenue: 0,
      currency: "USD",

      rating: 4.1,
      ratingCount: 12,
      lastActivityAt: "2025-12-12T18:40:00.000Z",
    },
  ],
};

/* ===============================
   HELPERS
================================ */

function pct(n?: number) {
  const v = typeof n === "number" ? Math.max(0, Math.min(100, n)) : 0;
  return `${v}%`;
}

function fmt(dt?: string) {
  if (!dt) return "-";
  try {
    return new Date(dt).toLocaleString();
  } catch {
    return "-";
  }
}

function money(n?: number, currency?: string) {
  const amount = typeof n === "number" ? n : 0;
  const cur = (currency || "USD").toUpperCase();
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: cur,
    }).format(amount);
  } catch {
    return `${cur} ${amount.toFixed(2)}`;
  }
}

/* ===============================
   PAGE
================================ */

export default function CoursePerformancePage() {
  const [range, setRange] = useState<"7d" | "30d" | "90d">("30d");
  const [sortBy, setSortBy] = useState<
    "enrollments" | "completionRate" | "revenue" | "rating" | "activeLearners"
  >("enrollments");

  // Later: replace with API response using range.
  const data = useMemo(() => DEMO_COURSE_PERFORMANCE, [range]);

  const rows = useMemo(() => {
    const copy = [...data.courses];

    copy.sort((a, b) => {
      if (sortBy === "enrollments")
        return (b.enrollments || 0) - (a.enrollments || 0);
      if (sortBy === "activeLearners")
        return (b.activeLearners || 0) - (a.activeLearners || 0);
      if (sortBy === "completionRate")
        return (b.completionRatePct || 0) - (a.completionRatePct || 0);
      if (sortBy === "revenue") return (b.revenue || 0) - (a.revenue || 0);
      if (sortBy === "rating") return (b.rating || 0) - (a.rating || 0);
      return 0;
    });

    return copy;
  }, [data.courses, sortBy]);

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold">Course Performance</h1>
          <p className="text-sm text-gray-500">
            Course-level KPIs across enrollments, engagement, completion, and
            revenue.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={range}
            onChange={(e) => setRange(e.target.value as any)}
            className="px-3 py-2 rounded-lg border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-sm"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 rounded-lg border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-sm"
          >
            <option value="enrollments">Sort: Enrollments</option>
            <option value="activeLearners">Sort: Active Learners</option>
            <option value="completionRate">Sort: Completion Rate</option>
            <option value="revenue">Sort: Revenue</option>
            <option value="rating">Sort: Rating</option>
          </select>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <KPI
          title="Total Enrollments"
          value={data.summary.totalEnrollments.toString()}
          icon={<Users />}
        />
        <KPI
          title="Total Completions"
          value={data.summary.totalCompletions.toString()}
          icon={<TrendingUp />}
        />
        <KPI
          title="Completion Rate"
          value={pct(data.summary.completionRatePct)}
          icon={<BarChart3 />}
        />
        <KPI
          title="Avg Rating"
          value={data.summary.avgRating.toFixed(1)}
          icon={<Star />}
        />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-neutral-800 font-medium">
          Courses
        </div>

        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-neutral-900 text-gray-500">
            <tr>
              <th className="text-left p-3">Course</th>
              <th className="text-right p-3">Enrollments</th>
              <th className="text-right p-3">Active</th>
              <th className="text-right p-3">Completions</th>
              <th className="text-right p-3">Completion</th>
              <th className="text-right p-3">Revenue</th>
              <th className="text-right p-3">Rating</th>
              <th className="text-right p-3">Last Activity</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((c, idx) => {
              const top = idx === 0;
              const statusCls = c.isPublished
                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300";

              return (
                <tr
                  key={c._id}
                  className="border-t border-gray-100 dark:border-neutral-800"
                >
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-neutral-800 flex items-center justify-center">
                        <BookOpen className="h-4 w-4 text-gray-500" />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="font-medium text-gray-900 dark:text-neutral-100 truncate">
                            {c.title}
                          </div>

                          <span
                            className={`px-2 py-1 rounded text-[11px] ${statusCls}`}
                          >
                            {c.isPublished ? "published" : "draft"}
                          </span>

                          {top ? (
                            <span className="px-2 py-1 rounded text-[11px] bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                              top
                            </span>
                          ) : null}
                        </div>

                        <div className="text-xs text-gray-500 mt-1">
                          {c.category} · {c.level} · {c.language?.toUpperCase()}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="p-3 text-right font-medium">
                    {c.enrollments}
                  </td>
                  <td className="p-3 text-right">{c.activeLearners}</td>
                  <td className="p-3 text-right">{c.completions}</td>

                  <td className="p-3 text-right">
                    <div className="inline-flex items-center gap-2 justify-end">
                      <div className="w-20 h-2 rounded-full bg-gray-100 dark:bg-neutral-800 overflow-hidden">
                        <div
                          className="h-full bg-neutral-900 dark:bg-white"
                          style={{
                            width: `${Math.max(
                              0,
                              Math.min(100, c.completionRatePct)
                            )}%`,
                          }}
                        />
                      </div>
                      <span className="text-gray-700 dark:text-neutral-200 font-medium">
                        {pct(c.completionRatePct)}
                      </span>
                    </div>
                  </td>

                  <td className="p-3 text-right font-medium">
                    {money(c.revenue, c.currency)}
                  </td>

                  <td className="p-3 text-right">
                    <div className="inline-flex items-center gap-1 justify-end">
                      <Star className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">{c.rating.toFixed(1)}</span>
                      <span className="text-gray-500 text-xs">
                        ({c.ratingCount})
                      </span>
                    </div>
                  </td>

                  <td className="p-3 text-right text-gray-600 dark:text-neutral-300">
                    {fmt(c.lastActivityAt)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* API note */}
      <div className="mt-4 text-xs text-gray-500">
        API-friendly: later fetch from{" "}
        <span className="font-mono">
          GET /reports/course-performance?range=
        </span>
        and replace demo data without touching UI.
      </div>
    </AdminLayout>
  );
}

/* ===============================
   KPI COMPONENT
================================ */

function KPI({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-gray-500">{title}</div>
          <div className="text-xl font-semibold mt-1">{value}</div>
        </div>
        <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-neutral-800 flex items-center justify-center text-gray-600">
          {icon}
        </div>
      </div>
    </div>
  );
}
