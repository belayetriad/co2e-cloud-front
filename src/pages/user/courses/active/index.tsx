// pages/user/courses/active.tsx
import UserLayout from "@/components/user/layout/UserLayout";
import apiRequest from "@/lib/axios";
import { getCurrentUser } from "@/utils/token";
import { BookOpen, Clock, PlayCircle, Search, TrendingUp } from "lucide-react";
import Head from "next/head";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type ActiveCourse = {
  id: string; // courseId
  enrollmentId: string;
  title: string;
  category: string;
  instructor: string;
  progress: number; // 1–99
  hoursStudied: number;
  totalHours: number;
  nextLessonTitle: string;
  thumbnailUrl?: string;
};

type ApiEnrollment = {
  _id: string;
  progress?: number; // 0-100
  completionDate?: string | null;
  currentLesson?: { _id: string; title?: string } | null;
  courseId:
    | {
        _id: string;
        title?: string;
        thumbnailUrl?: string;
        level?: string;
        durationMinutes?: number;
        categoryId?: any; // maybe populated
        instructorId?: any; // maybe populated
      }
    | string;
};

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
  if (typeof ins === "object") {
    const name = `${ins.firstName ?? ""} ${ins.lastName ?? ""}`.trim();
    return name || ins.email || "Unknown Instructor";
  }
  return "Unknown Instructor";
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function mapEnrollmentToActiveCourse(e: ApiEnrollment): ActiveCourse | null {
  const course =
    typeof e.courseId === "object" && e.courseId ? (e.courseId as any) : null;

  if (!course?._id) return null;

  const totalMinutes = safeNumber(course.durationMinutes, 0);
  const totalHours =
    totalMinutes > 0 ? Math.max(1, Math.round(totalMinutes / 60)) : 0;

  // you currently don't have tracked minutes, so hoursStudied is approximated from progress
  const rawProgress = safeNumber(e.progress, 0);
  const progress = clamp(Math.round(rawProgress), 0, 100);

  const hoursStudied =
    totalHours > 0 ? Math.round((progress / 100) * totalHours) : 0;

  const nextLessonTitle = e.currentLesson?.title
    ? `Continue: ${e.currentLesson.title}`
    : "Continue where you left off";

  return {
    id: course._id,
    enrollmentId: e._id,
    title: course.title || "Untitled Course",
    category: `${pickCategoryTitleFromCourse(course)} · ${
      course.level || "Beginner"
    }`,
    instructor: pickInstructorNameFromCourse(course),
    progress: clamp(progress, 1, 99), // ✅ active is 1–99
    hoursStudied,
    totalHours,
    nextLessonTitle,
    thumbnailUrl: course.thumbnailUrl,
  };
}

export default function StudentActiveCoursesPage() {
  const currentUser = getCurrentUser();

  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"recent" | "progress">("recent");

  const [courses, setCourses] = useState<ActiveCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchActive = async () => {
      try {
        setLoading(true);
        setError(null);

        const userId = currentUser?.id;
        if (!userId) {
          setCourses([]);
          setError("User not found. Please login again.");
          return;
        }

        // ✅ enrolled list
        const res = await apiRequest.get(`/enrollments/user/${userId}`);
        const raw = res.data;

        const enrollments: ApiEnrollment[] = Array.isArray(raw)
          ? raw
          : Array.isArray(raw?.items)
          ? raw.items
          : [];

        // ✅ active courses: progress 1-99 and NOT completed
        const mapped = enrollments
          .map(mapEnrollmentToActiveCourse)
          .filter(Boolean)
          .map((x) => x as ActiveCourse)
          .filter((c) => c.progress >= 1 && c.progress <= 99);

        // sort: "recent" uses enrollmentId order (or could use updatedAt if you add it)
        const sorted =
          sort === "progress"
            ? mapped.slice().sort((a, b) => b.progress - a.progress)
            : mapped;

        setCourses(sorted);
      } catch (err: any) {
        console.error("Failed to load active courses", err);
        const status = err?.response?.status;

        if (status === 404) {
          setCourses([]);
          setError(
            "Enrollments endpoint is not available yet. Please enable GET /enrollments/user/:userId."
          );
          return;
        }

        setError("Failed to load active courses. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchActive();
  }, [sort]);

  const filteredCourses = useMemo(() => {
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

    if (sort === "progress") {
      list.sort((a, b) => b.progress - a.progress);
    }

    return list;
  }, [courses, search, sort]);

  const totalCourses = courses.length;
  const totalHours = courses.reduce((sum, c) => sum + c.totalHours, 0);
  const totalStudied = courses.reduce((sum, c) => sum + c.hoursStudied, 0);
  const avgCompletion =
    courses.length === 0
      ? 0
      : Math.round(
          courses.reduce((sum, c) => sum + c.progress, 0) / courses.length
        );

  return (
    <>
      <Head>
        <title>Active Courses · Student</title>
      </Head>

      <UserLayout>
        <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">
                Active Courses
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Continue learning from your enrolled courses and track your
                progress in real time.
              </p>
            </div>

            {/* Search + Sort */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search courses..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full sm:w-64 pl-9 pr-3 py-2 rounded-lg border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-300"
                />
              </div>

              <select
                value={sort}
                onChange={(e) =>
                  setSort(e.target.value as "recent" | "progress")
                }
                className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-300"
              >
                <option value="recent">Sort by: Recently started</option>
                <option value="progress">Sort by: Highest progress</option>
              </select>
            </div>
          </div>

          {/* Summary strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">Active Courses</p>
                <p className="mt-1 text-xl font-semibold">{totalCourses}</p>
              </div>
              <BookOpen className="h-6 w-6 text-slate-400" />
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">Hours Studied</p>
                <p className="mt-1 text-xl font-semibold">{totalStudied} hrs</p>
              </div>
              <Clock className="h-6 w-6 text-slate-400" />
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
              Loading active courses...
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 py-10 text-center text-sm text-red-600">
              {error}
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5">
              {filteredCourses.length === 0 ? (
                <div className="py-10 text-center text-sm text-slate-500">
                  No active courses match your search.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredCourses.map((course) => (
                    <div
                      key={course.id}
                      className="rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-slate-50 transition-colors p-4 flex flex-col gap-3"
                    >
                      <div className="flex gap-3">
                        {course.thumbnailUrl && (
                          <div className="hidden sm:block w-20 h-20 rounded-lg overflow-hidden bg-slate-200 flex-shrink-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={course.thumbnailUrl}
                              alt={course.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="flex-1">
                          <p className="text-xs font-medium text-slate-500">
                            {course.category}
                          </p>
                          <h2 className="mt-1 text-sm font-semibold text-slate-900 line-clamp-2">
                            {course.title}
                          </h2>
                          <p className="mt-1 text-xs text-slate-500">
                            Instructor:{" "}
                            <span className="font-medium">
                              {course.instructor}
                            </span>
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span>Progress</span>
                          <span>{course.progress}%</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-slate-900/90"
                            style={{ width: `${course.progress}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span>
                            {course.hoursStudied} / {course.totalHours} hrs
                          </span>
                          <span className="truncate">
                            Next: {course.nextLessonTitle}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-1">
                        <Link
                          href={`/user/courses/${course.id}/play`}
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900 text-white text-xs font-medium hover:bg-slate-800"
                        >
                          <PlayCircle className="h-4 w-4" />
                          Continue Course
                        </Link>

                        <Link
                          href={`/user/courses/${course.id}/play`}
                          className="text-xs text-slate-600 hover:text-slate-900 underline-offset-2 hover:underline"
                        >
                          View Details
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </UserLayout>
    </>
  );
}
