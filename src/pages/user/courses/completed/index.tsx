// pages/user/courses/completed.tsx
import UserLayout from "@/components/user/layout/UserLayout";
import apiRequest from "@/lib/axios";
import { getCurrentUser } from "@/utils/token";
import {
  Award,
  CalendarCheck,
  CheckCircle2,
  Clock3,
  Search,
  TrendingUp,
} from "lucide-react";
import Head from "next/head";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type CompletedCourse = {
  id: string;
  title: string;
  category: string;
  level: string;
  instructor: string;
  thumbnailUrl?: string;
  totalHours: number;
  completedHours: number;
  completionRate: number;
  completedAt: string; // ISO date
  nextAction?: string;
};

// --- enrollments response (based on your enrollment sample) ---
type ApiEnrollment = {
  _id: string;
  userId: any;
  courseId:
    | {
        _id: string;
        title?: string;
        thumbnailUrl?: string;
        categoryId?: any;
        level?: string;
        durationMinutes?: number;
        instructorId?: any;
      }
    | string;

  progress?: number; // 0-100
  completionDate?: string | null; // ISO
  status?: string;
  createdAt?: string;
  updatedAt?: string;
};

function formatDate(val: string) {
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return val;
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function safeNumber(n: unknown, fallback = 0) {
  const v = typeof n === "number" ? n : Number(n);
  return Number.isFinite(v) ? v : fallback;
}

function pickCategoryTitleFromCourse(course: any) {
  const cat = course?.categoryId;
  if (!cat) return "Uncategorized";
  if (typeof cat === "object" && cat?.title) return cat.title;
  return "Uncategorized";
}

function pickInstructorNameFromCourse(course: any) {
  const ins = course?.instructorId;
  if (!ins) return "Unknown Instructor";

  // if populated object
  if (typeof ins === "object") {
    const name = `${ins.firstName ?? ""} ${ins.lastName ?? ""}`.trim();
    return name || ins.email || "Unknown Instructor";
  }

  return "Unknown Instructor";
}

function mapEnrollmentToCompletedCourse(
  e: ApiEnrollment
): CompletedCourse | null {
  const course =
    typeof e.courseId === "object" && e.courseId ? (e.courseId as any) : null;

  if (!course?._id) return null;

  const totalHours = course.durationMinutes
    ? Math.max(1, Math.round(safeNumber(course.durationMinutes) / 60))
    : 0;

  const completionRate = Math.min(100, Math.max(0, safeNumber(e.progress, 0)));

  // completedHours = totalHours when completed (no minutes tracked here)
  const completedHours = completionRate >= 100 ? totalHours : 0;

  const completedAt =
    e.completionDate || e.updatedAt || e.createdAt || new Date().toISOString();

  return {
    id: course._id,
    title: course.title || "Untitled Course",
    category: pickCategoryTitleFromCourse(course),
    level: course.level || "Beginner",
    instructor: pickInstructorNameFromCourse(course),
    thumbnailUrl: course.thumbnailUrl,
    totalHours,
    completedHours,
    completionRate,
    completedAt,
  };
}

export default function CompletedCoursesPage() {
  const currentUser = getCurrentUser();

  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<
    "recent" | "oldest" | "hours-high" | "hours-low"
  >("recent");

  const [courses, setCourses] = useState<CompletedCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCompleted = async () => {
      try {
        setLoading(true);
        setError(null);

        const userId = currentUser?.id;
        if (!userId) {
          setCourses([]);
          setError("User not found. Please login again.");
          return;
        }

        // ✅ get enrollments for this user (your new requirement)
        const res = await apiRequest.get(`/enrollments/user/${userId}`);

        const raw = res.data;

        // allow either array or { items: [] }
        const enrollments: ApiEnrollment[] = Array.isArray(raw)
          ? raw
          : Array.isArray(raw?.items)
          ? raw.items
          : [];

        const mapped = enrollments
          .map(mapEnrollmentToCompletedCourse)
          .filter(Boolean)
          .map((x) => x as CompletedCourse)
          // ✅ ONLY completed
          .filter((c) => c.completionRate >= 100);

        setCourses(mapped);
      } catch (err: any) {
        console.error("Failed to load completed courses", err);
        const status = err?.response?.status;

        if (status === 404) {
          setCourses([]);
          setError(
            "Enrollments endpoint is not available yet. Please enable GET /enrollments/user/:userId."
          );
          return;
        }

        setError("Failed to load completed courses. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchCompleted();
  }, []);

  const filtered = useMemo(() => {
    let list = [...courses];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q) ||
          c.instructor.toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => {
      switch (sort) {
        case "oldest":
          return (
            new Date(a.completedAt).getTime() -
            new Date(b.completedAt).getTime()
          );
        case "hours-high":
          return b.totalHours - a.totalHours;
        case "hours-low":
          return a.totalHours - b.totalHours;
        case "recent":
        default:
          return (
            new Date(b.completedAt).getTime() -
            new Date(a.completedAt).getTime()
          );
      }
    });

    return list;
  }, [courses, search, sort]);

  const totalCourses = courses.length;
  const totalHours = courses.reduce((sum, c) => sum + c.totalHours, 0);

  const avgCompletion =
    courses.length === 0
      ? 0
      : Math.round(
          courses.reduce((sum, c) => sum + c.completionRate, 0) / courses.length
        );

  return (
    <>
      <Head>
        <title>Completed Courses · Student</title>
      </Head>

      <UserLayout>
        <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">
                Completed Courses
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Review your completed courses, access certificates, and plan
                your next steps.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search completed courses..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full sm:w-72 pl-9 pr-3 py-2 rounded-lg border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-300"
                />
              </div>

              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as typeof sort)}
                className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-300"
              >
                <option value="recent">Sort by: Recently completed</option>
                <option value="oldest">Sort by: Oldest completed</option>
                <option value="hours-high">Sort by: Hours (high to low)</option>
                <option value="hours-low">Sort by: Hours (low to high)</option>
              </select>
            </div>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">Completed Courses</p>
                <p className="mt-1 text-xl font-semibold">{totalCourses}</p>
              </div>
              <CheckCircle2 className="h-6 w-6 text-slate-400" />
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">Hours Studied</p>
                <p className="mt-1 text-xl font-semibold">{totalHours} hrs</p>
              </div>
              <Clock3 className="h-6 w-6 text-slate-400" />
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">Avg. Completion</p>
                <p className="mt-1 text-xl font-semibold">{avgCompletion}%</p>
              </div>
              <TrendingUp className="h-6 w-6 text-slate-400" />
            </div>
          </div>

          {/* Content State */}
          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white py-10 text-center text-sm text-slate-500">
              Loading completed courses...
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 py-10 text-center text-sm text-red-600">
              {error}
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-white py-10 text-center text-sm text-slate-500">
                  No completed courses found for your current filters.
                </div>
              ) : (
                filtered.map((course) => (
                  <div
                    key={course.id}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-4 md:px-6 md:py-5 flex flex-col gap-4 md:flex-row md:items-stretch"
                  >
                    {/* Thumbnail */}
                    <div className="w-full md:w-40 lg:w-48 flex-shrink-0">
                      <div className="relative overflow-hidden rounded-xl bg-slate-100 h-24 md:h-full flex items-center justify-center">
                        {course.thumbnailUrl ? (
                          <img
                            src={course.thumbnailUrl}
                            alt={course.title}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="text-[11px] text-slate-400">
                            Course thumbnail
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Main content */}
                    <div className="flex-1 flex flex-col justify-between gap-3">
                      <div>
                        <p className="text-[11px] text-slate-500 mb-1">
                          {course.category} · {course.level}
                        </p>
                        <h2 className="text-sm md:text-[15px] font-semibold text-slate-900">
                          {course.title}
                        </h2>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Instructor: {course.instructor}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span>Progress</span>
                          <span>{course.completionRate}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full bg-slate-900 rounded-full"
                            style={{ width: `${course.completionRate}%` }}
                          />
                        </div>

                        <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 mt-1 gap-1">
                          <span>
                            {course.completedHours} / {course.totalHours} hrs
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <CalendarCheck className="h-3 w-3" />
                            Completed on {formatDate(course.completedAt)}
                          </span>
                        </div>

                        {course.nextAction && (
                          <p className="text-[11px] text-slate-500 mt-1">
                            Next:{" "}
                            <span className="font-medium text-slate-800">
                              {course.nextAction}
                            </span>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="w-full md:w-48 flex flex-col justify-between gap-3">
                      <div className="flex md:flex-col gap-2">
                        <Link
                          href={`/user/courses/${course.id}/paly`}
                          className="inline-flex flex-1 md:flex-none items-center justify-center gap-2 px-3 py-2 rounded-lg bg-slate-900 text-white text-xs font-medium hover:bg-slate-800"
                        >
                          View Course
                        </Link>

                        <Link
                          href={`/user/courses/${course.id}/certificate`}
                          className="inline-flex flex-1 md:flex-none items-center justify-center gap-2 px-3 py-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-800 hover:bg-slate-50"
                        >
                          <Award className="h-4 w-4" />
                          View Certificate
                        </Link>
                      </div>

                      <button
                        type="button"
                        className="hidden md:inline-flex items-center justify-center text-[11px] text-slate-500 hover:text-slate-800"
                      >
                        Download course resources
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </UserLayout>
    </>
  );
}
