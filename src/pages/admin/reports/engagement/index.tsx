import AdminLayout from "@/components/admin/layout/AdminLayout";
import { Activity, Clock, PlayCircle, TrendingUp, Users } from "lucide-react";
import { useMemo, useState } from "react";

/* ===============================
   DEMO DATA (API-FRIENDLY SHAPE)
================================ */

const DEMO_ENGAGEMENT = {
  summary: {
    activeLearners: 124,
    avgProgressPct: 46,
    completionRatePct: 18,
    avgWatchTimeMin: 37,
  },
  byDay: [
    {
      date: "2025-12-10",
      activeLearners: 18,
      minutesWatched: 420,
      lessonsCompleted: 55,
    },
    {
      date: "2025-12-11",
      activeLearners: 24,
      minutesWatched: 510,
      lessonsCompleted: 63,
    },
    {
      date: "2025-12-12",
      activeLearners: 31,
      minutesWatched: 740,
      lessonsCompleted: 88,
    },
    {
      date: "2025-12-13",
      activeLearners: 28,
      minutesWatched: 620,
      lessonsCompleted: 74,
    },
    {
      date: "2025-12-14",
      activeLearners: 23,
      minutesWatched: 460,
      lessonsCompleted: 59,
    },
  ],
  topCourses: [
    {
      _id: "c1",
      title: "HTML CSS TailwindCSS Course",
      activeLearners: 42,
      avgProgressPct: 39,
      completionRatePct: 12,
      minutesWatched: 1320,
    },
    {
      _id: "c2",
      title: "Modern JavaScript Mastery",
      activeLearners: 36,
      avgProgressPct: 51,
      completionRatePct: 21,
      minutesWatched: 1185,
    },
    {
      _id: "c3",
      title: "React & TypeScript Fundamentals",
      activeLearners: 28,
      avgProgressPct: 58,
      completionRatePct: 25,
      minutesWatched: 990,
    },
  ],
  topStudents: [
    {
      _id: "u1",
      name: "Belayet Riad",
      email: "student@gmail.com",
      minutesWatched: 210,
      lessonsCompleted: 9,
      activeDays: 4,
    },
    {
      _id: "u2",
      name: "John Doe",
      email: "john@gmail.com",
      minutesWatched: 180,
      lessonsCompleted: 7,
      activeDays: 3,
    },
    {
      _id: "u3",
      name: "Emma Collins",
      email: "emma@gmail.com",
      minutesWatched: 165,
      lessonsCompleted: 6,
      activeDays: 3,
    },
  ],
};

/* ===============================
   HELPERS
================================ */

const pct = (n: number) => `${Math.max(0, Math.min(100, n))}%`;
const mins = (n: number) => `${n} min`;

/* ===============================
   PAGE
================================ */

export default function EngagementPage() {
  const [range, setRange] = useState<"7d" | "30d" | "90d">("30d");

  // Later: replace with API response using range
  const data = useMemo(() => DEMO_ENGAGEMENT, [range]);

  const totals = useMemo(() => {
    const totalMinutes = data.byDay.reduce((s, x) => s + x.minutesWatched, 0);
    const totalLessons = data.byDay.reduce((s, x) => s + x.lessonsCompleted, 0);
    const avgDailyActive = Math.round(
      data.byDay.reduce((s, x) => s + x.activeLearners, 0) /
        Math.max(1, data.byDay.length)
    );

    return { totalMinutes, totalLessons, avgDailyActive };
  }, [data.byDay]);

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold">Engagement</h1>
          <p className="text-sm text-gray-500">
            Learner activity, consumption, and completion signals.
          </p>
        </div>

        <select
          value={range}
          onChange={(e) => setRange(e.target.value as any)}
          className="px-3 py-2 rounded-lg border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-sm"
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
        </select>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <KPI
          title="Active Learners"
          value={data.summary.activeLearners.toString()}
          icon={<Users />}
        />
        <KPI
          title="Avg Progress"
          value={pct(data.summary.avgProgressPct)}
          icon={<TrendingUp />}
        />
        <KPI
          title="Completion Rate"
          value={pct(data.summary.completionRatePct)}
          icon={<Activity />}
        />
        <KPI
          title="Avg Watch Time"
          value={mins(data.summary.avgWatchTimeMin)}
          icon={<Clock />}
        />
      </div>

      {/* Trend + Totals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2 rounded-xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
          <div className="p-4 border-b border-gray-100 dark:border-neutral-800 font-medium">
            Engagement Trend (Daily)
          </div>

          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-neutral-900 text-gray-500">
              <tr>
                <th className="text-left p-3">Date</th>
                <th className="text-right p-3">Active</th>
                <th className="text-right p-3">Minutes Watched</th>
                <th className="text-right p-3">Lessons Completed</th>
              </tr>
            </thead>
            <tbody>
              {data.byDay.map((d) => (
                <tr
                  key={d.date}
                  className="border-t border-gray-100 dark:border-neutral-800"
                >
                  <td className="p-3">{d.date}</td>
                  <td className="p-3 text-right font-medium">
                    {d.activeLearners}
                  </td>
                  <td className="p-3 text-right">{d.minutesWatched}</td>
                  <td className="p-3 text-right">{d.lessonsCompleted}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="rounded-xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 p-4">
          <div className="font-medium mb-3">Rollup (This Range)</div>

          <div className="space-y-3 text-sm">
            <Row
              label="Total Minutes Watched"
              value={mins(totals.totalMinutes)}
            />
            <Row
              label="Total Lessons Completed"
              value={totals.totalLessons.toString()}
            />
            <Row
              label="Avg Daily Active Learners"
              value={totals.avgDailyActive.toString()}
            />
          </div>

          <div className="mt-4 rounded-lg border border-gray-200 dark:border-neutral-800 p-3 text-xs text-gray-500">
            API note: this rollup can be computed server-side or derived
            client-side.
          </div>
        </div>
      </div>

      {/* Top Courses */}
      <div className="rounded-xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 mb-6">
        <div className="p-4 border-b border-gray-100 dark:border-neutral-800 font-medium">
          Most Engaged Courses
        </div>

        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-neutral-900 text-gray-500">
            <tr>
              <th className="text-left p-3">Course</th>
              <th className="text-right p-3">Active Learners</th>
              <th className="text-right p-3">Avg Progress</th>
              <th className="text-right p-3">Completion Rate</th>
              <th className="text-right p-3">Minutes Watched</th>
            </tr>
          </thead>
          <tbody>
            {data.topCourses.map((c) => (
              <tr
                key={c._id}
                className="border-t border-gray-100 dark:border-neutral-800"
              >
                <td className="p-3 font-medium">{c.title}</td>
                <td className="p-3 text-right">{c.activeLearners}</td>
                <td className="p-3 text-right">{pct(c.avgProgressPct)}</td>
                <td className="p-3 text-right">{pct(c.completionRatePct)}</td>
                <td className="p-3 text-right">{c.minutesWatched}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Top Students */}
      <div className="rounded-xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
        <div className="p-4 border-b border-gray-100 dark:border-neutral-800 font-medium">
          Top Active Students
        </div>

        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-neutral-900 text-gray-500">
            <tr>
              <th className="text-left p-3">Student</th>
              <th className="text-right p-3">Minutes Watched</th>
              <th className="text-right p-3">Lessons Completed</th>
              <th className="text-right p-3">Active Days</th>
            </tr>
          </thead>
          <tbody>
            {data.topStudents.map((s) => (
              <tr
                key={s._id}
                className="border-t border-gray-100 dark:border-neutral-800"
              >
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-neutral-800 flex items-center justify-center">
                      <PlayCircle className="h-4 w-4 text-gray-500" />
                    </div>
                    <div>
                      <div className="font-medium">{s.name}</div>
                      <div className="text-xs text-gray-500">{s.email}</div>
                    </div>
                  </div>
                </td>
                <td className="p-3 text-right font-medium">
                  {s.minutesWatched}
                </td>
                <td className="p-3 text-right">{s.lessonsCompleted}</td>
                <td className="p-3 text-right">{s.activeDays}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}

/* ===============================
   UI COMPONENTS
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

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="text-gray-500">{label}</div>
      <div className="font-medium text-gray-900 dark:text-neutral-100">
        {value}
      </div>
    </div>
  );
}
