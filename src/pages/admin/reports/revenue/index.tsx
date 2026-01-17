import AdminLayout from "@/components/admin/layout/AdminLayout";
import { CreditCard, DollarSign, RefreshCcw, TrendingUp } from "lucide-react";
import { useMemo, useState } from "react";

/* ===============================
   DEMO DATA (API-FRIENDLY SHAPE)
================================ */

const DEMO_REVENUE = {
  summary: {
    gross: 5200,
    net: 4800,
    refunds: 400,
    transactions: 38,
  },
  byCourse: [
    {
      _id: "c1",
      title: "HTML CSS TailwindCSS Course",
      revenue: 3200,
      sales: 16,
    },
    {
      _id: "c2",
      title: "Modern JavaScript Mastery",
      revenue: 2000,
      sales: 22,
    },
  ],
  byDay: [
    { date: "2025-12-10", amount: 1200 },
    { date: "2025-12-11", amount: 900 },
    { date: "2025-12-12", amount: 1600 },
    { date: "2025-12-13", amount: 900 },
    { date: "2025-12-14", amount: 600 },
  ],
};

/* ===============================
   HELPERS
================================ */

const money = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(n);

/* ===============================
   PAGE
================================ */

export default function RevenuePage() {
  const [range, setRange] = useState<"7d" | "30d" | "90d">("30d");

  // later replace this with API response
  const data = useMemo(() => DEMO_REVENUE, [range]);

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold">Revenue</h1>
          <p className="text-sm text-gray-500">
            Financial performance and monetization overview.
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

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <KPI
          title="Gross Revenue"
          value={money(data.summary.gross)}
          icon={<DollarSign />}
        />
        <KPI
          title="Net Revenue"
          value={money(data.summary.net)}
          icon={<CreditCard />}
        />
        <KPI
          title="Refunds"
          value={money(data.summary.refunds)}
          icon={<RefreshCcw />}
        />
        <KPI
          title="Transactions"
          value={data.summary.transactions.toString()}
          icon={<TrendingUp />}
        />
      </div>

      {/* Revenue by Course */}
      <div className="rounded-xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 mb-6">
        <div className="p-4 border-b border-gray-100 dark:border-neutral-800 font-medium">
          Revenue by Course
        </div>

        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-neutral-900 text-gray-500">
            <tr>
              <th className="text-left p-3">Course</th>
              <th className="text-right p-3">Sales</th>
              <th className="text-right p-3">Revenue</th>
            </tr>
          </thead>
          <tbody>
            {data.byCourse.map((c) => (
              <tr
                key={c._id}
                className="border-t border-gray-100 dark:border-neutral-800"
              >
                <td className="p-3 font-medium">{c.title}</td>
                <td className="p-3 text-right">{c.sales}</td>
                <td className="p-3 text-right font-semibold">
                  {money(c.revenue)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Daily Revenue */}
      <div className="rounded-xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
        <div className="p-4 border-b border-gray-100 dark:border-neutral-800 font-medium">
          Daily Revenue
        </div>

        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-neutral-900 text-gray-500">
            <tr>
              <th className="text-left p-3">Date</th>
              <th className="text-right p-3">Revenue</th>
            </tr>
          </thead>
          <tbody>
            {data.byDay.map((d) => (
              <tr
                key={d.date}
                className="border-t border-gray-100 dark:border-neutral-800"
              >
                <td className="p-3">{d.date}</td>
                <td className="p-3 text-right font-semibold">
                  {money(d.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
