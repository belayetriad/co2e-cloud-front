import AdminLayout from "@/components/admin/layout/AdminLayout";
import { useAuth } from "@/context/AuthContext";
import { BarChart3, PlayCircle, Users } from "lucide-react";

export default function AdminDashboardHome() {
  const { currentUser } = useAuth();

  return (
    <AdminLayout>
      <div className="grid md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500">Active Users</span>
            <Users className="h-4 w-4" />
          </div>
          <div className="mt-2 text-2xl font-semibold">1,248</div>
        </div>
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500">Users</span>
            <PlayCircle className="h-4 w-4" />
          </div>
          <div className="mt-2 text-2xl font-semibold">86</div>
        </div>
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500">Revenue (30d)</span>
            <BarChart3 className="h-4 w-4" />
          </div>
          <div className="mt-2 text-2xl font-semibold">$42,910</div>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 p-6">
        <h2 className="text-lg font-semibold">
          Welcome{currentUser ? `, ${currentUser.firstName}` : ""}
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Use the left navigation to manage users, courses, enrollments,
          payments, and reports.
        </p>
      </div>
    </AdminLayout>
  );
}
