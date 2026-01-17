// pages/user/courses/all.tsx
import UserLayout from "@/components/user/layout/UserLayout";
import apiRequest from "@/lib/axios";
import { CheckCircle2, Clock3, PlayCircle, Search } from "lucide-react";
import Head from "next/head";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type CourseStatus = "active" | "completed" | "not-started";

type AllCourse = {
  id: string;
  title: string;
  category: string;
  level: string;
  instructor: string;
  thumbnailUrl?: string;
  totalHours: number;
  completedHours: number;
  completionRate: number;
  status: CourseStatus;
  nextLesson?: string;
};

type ApiCourse = {
  _id: string;
  title: string;
  categoryId?:
    | {
        _id: string;
        title: string;
      }
    | string;
  level?: string;
  instructorId?: {
    firstName?: string;
    lastName?: string;
    email?: string;
  };
  thumbnailUrl?: string;
  durationMinutes?: number;
  // other fields are present but we don't need them here
};

export default function AllCoursesPage() {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<
    "recent" | "oldest" | "a-z" | "z-a" | "hours-high" | "hours-low"
  >("recent");
  const [category, setCategory] = useState("all");

  const [courses, setCourses] = useState<AllCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch from API
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await apiRequest.get("/courses");
        const raw = res.data;

        // Handle both array and {items: []} style responses
        const apiCourses: ApiCourse[] = Array.isArray(raw)
          ? raw
          : Array.isArray(raw?.items)
          ? raw.items
          : [];

        const mapped: AllCourse[] = apiCourses.map((c) => {
          const categoryTitle =
            typeof c.categoryId === "object" && c.categoryId
              ? c.categoryId.title
              : "Uncategorized";

          const instructorName =
            c.instructorId &&
            (c.instructorId.firstName || c.instructorId.lastName)
              ? `${c.instructorId.firstName ?? ""} ${
                  c.instructorId.lastName ?? ""
                }`.trim()
              : c.instructorId?.email ?? "Unknown Instructor";

          const totalHours = c.durationMinutes
            ? Math.max(1, Math.round(c.durationMinutes / 60))
            : 0;

          // Until you wire real progress data, treat everything as "not-started"
          return {
            id: c._id,
            title: c.title,
            category: categoryTitle,
            level: c.level || "Beginner",
            instructor: instructorName,
            thumbnailUrl: c.thumbnailUrl,
            totalHours,
            completedHours: 0,
            completionRate: 0,
            status: "not-started",
            nextLesson: undefined,
          };
        });

        setCourses(mapped);
      } catch (err) {
        console.error("Failed to load courses", err);
        setError("Failed to load courses. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  // Build category filter list from API data
  const categories = useMemo(() => {
    const set = new Set<string>();
    courses.forEach((c) => set.add(c.category));
    return ["all", ...Array.from(set)];
  }, [courses]);

  // Filter + sort
  const filtered = useMemo(() => {
    let list = [...courses];

    if (category !== "all") {
      list = list.filter((c) => c.category === category);
    }

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
        case "a-z":
          return a.title.localeCompare(b.title);
        case "z-a":
          return b.title.localeCompare(a.title);
        case "hours-high":
          return b.totalHours - a.totalHours;
        case "hours-low":
          return a.totalHours - b.totalHours;
        case "oldest":
        case "recent":
        default:
          // No createdAt in AllCourse yet – once you expose it from API,
          // you can add date-based sorting here.
          return 0;
      }
    });

    return list;
  }, [courses, search, sort, category]);

  return (
    <>
      <Head>
        <title>All Courses · Student</title>
      </Head>
      <UserLayout>
        <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">
                All Courses
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Browse all courses you are enrolled in. Continue learning or
                explore what you’ve completed.
              </p>
            </div>

            {/* Search + Sorting */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search courses..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full sm:w-72 pl-9 pr-3 py-2 rounded-lg border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-slate-900/5"
                />
              </div>

              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as typeof sort)}
                className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-slate-900/5"
              >
                <option value="recent">Recently Added</option>
                <option value="a-z">A → Z</option>
                <option value="z-a">Z → A</option>
                <option value="hours-high">Hours (high → low)</option>
                <option value="hours-low">Hours (low → high)</option>
              </select>
            </div>
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-2 text-xs overflow-auto pb-1">
            {categories.map((cat) => {
              const active = category === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`px-4 py-1.5 whitespace-nowrap rounded-full border text-xs font-medium ${
                    active
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {cat === "all" ? "All Categories" : cat}
                </button>
              );
            })}
          </div>

          {/* Content State */}
          {loading ? (
            <div className="rounded-xl border border-slate-200 bg-white py-10 text-center text-sm text-slate-500">
              Loading courses...
            </div>
          ) : error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 py-10 text-center text-sm text-red-600">
              {error}
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.length === 0 ? (
                <div className="rounded-xl border border-slate-200 bg-white py-10 text-center text-sm text-slate-500">
                  No courses match your filters.
                </div>
              ) : (
                filtered.map((course) => (
                  <div
                    key={course.id}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-4 md:px-6 md:py-5 flex flex-col gap-4 md:flex-row"
                  >
                    {/* Thumbnail */}
                    <div className="w-full md:w-40 lg:w-48 flex-shrink-0">
                      <div className="relative overflow-hidden rounded-xl bg-slate-100 h-24 md:h-full flex items-center justify-center">
                        {course.thumbnailUrl ? (
                          // You can switch to next/image if you prefer
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

                    {/* Main */}
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

                      {/* Progress */}
                      {course.status !== "not-started" && (
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

                          {course.nextLesson && (
                            <div className="text-[11px] text-slate-500">
                              Next:{" "}
                              <span className="text-slate-800 font-medium">
                                {course.nextLesson}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="w-full md:w-48 flex flex-col justify-between gap-3">
                      {course.status === "active" && (
                        <Link
                          href={`/user/courses/${course.id}/play/`}
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900 text-white text-xs font-medium hover:bg-slate-800"
                        >
                          <PlayCircle className="h-4 w-4" />
                          Continue Course
                        </Link>
                      )}

                      {course.status === "completed" && (
                        <button
                          type="button"
                          className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50"
                        >
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          Completed
                        </button>
                      )}

                      {course.status === "not-started" && (
                        <Link
                          href={`/user/courses/${course.id}/play/`}
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900 text-white text-xs font-medium hover:bg-slate-800"
                        >
                          <PlayCircle className="h-4 w-4" />
                          Start Course
                        </Link>
                      )}

                      <div className="flex items-center gap-1 text-[11px] text-slate-500">
                        <Clock3 className="h-3 w-3" />
                        {course.totalHours} hours total
                      </div>
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
