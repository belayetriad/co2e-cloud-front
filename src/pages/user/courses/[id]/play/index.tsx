// pages/user/courses/[id].tsx
import UserLayout from "@/components/user/layout/UserLayout";
import apiRequest from "@/lib/axios";
import { getCurrentUser } from "@/utils/token";
import {
  Award,
  BookOpen,
  CheckCircle2,
  Clock,
  FileText,
  PlayCircle,
  Video,
} from "lucide-react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useMemo, useRef, useState } from "react";

type QuizMeta = {
  _id?: string;
  title: string;
  instructions?: string;
  courseId?: string;
  moduleId?: string;
  timeLimitSeconds?: number;
  attemptsAllowed?: number;
  passMarkPercent?: number;
  shuffleQuestions?: boolean;
  shuffleOptions?: boolean;
  status?: "draft" | "published" | "archived" | string;
  availableFrom?: string;
  availableUntil?: string;
};

type Lesson = {
  _id: string;
  title: string;
  durationMinutes?: number;
  isPreview?: boolean;
  isCompleted?: boolean;
  video?: { durationSeconds: number; transcript: string; url: string };
  type?: string; // "quiz" | "lesson"
  quiz?: QuizMeta;
  position?: number;

  moduleId?: any;
  createdAt?: string;
};

type Module = {
  _id: string;
  title: string;
  position: number;
  lessons: Lesson[];
};

type CourseDetail = {
  _id: string;
  title: string;
  category: string;
  level: string;
  instructor: string;
  totalHours: number;
  progress: number;
  description: string;
  modules: Module[];
};

type ApiCourse = {
  _id: string;
  title: string;
  description?: string;
  categoryId?:
    | { _id: string; title: string; slug: string; subtitle?: string }
    | string;
  level?: string;
  durationMinutes?: number;
  instructorId?:
    | { _id: string; firstName?: string; lastName?: string; email?: string }
    | string;
};

type ApiModule = {
  _id: string;
  title: string;
  position?: number;
};

type ApiLesson = {
  _id: string;
  title: string;
  createdAt: string;
  moduleId: any;
  type: string;
  quiz?: QuizMeta;
  durationMinutes?: number;
  isPreview?: boolean;
  position?: number;
  video?: { url: string; durationSeconds: number; transcript: string };
};

// --- Certificates ---
type Certificate = {
  _id?: string;
  userId: string;
  courseId: string;
  certificateNumber?: string;
  issuedAt?: string;
  metadata?: any;
};

// Quiz rule: if expired => expired; else eligible anytime (if published)
function getQuizAvailability(
  quiz?: QuizMeta
): "eligible" | "expired" | "unavailable" {
  if (!quiz) return "unavailable";
  if (quiz.status && quiz.status !== "published") return "unavailable";

  if (quiz.availableUntil) {
    const now = new Date();
    const until = new Date(quiz.availableUntil);
    if (now > until) return "expired";
  }

  return "eligible";
}

function clampPercent(n: number) {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

// lightweight uniq id for cert number fallback (backend should ideally generate)
function genCertNumber(courseId: string, userId: string) {
  const stamp = new Date()
    .toISOString()
    .replace(/[-:.TZ]/g, "")
    .slice(0, 14);
  const c = (courseId || "").slice(-6);
  const u = (userId || "").slice(-6);
  return `CERT-${stamp}-${c}-${u}`.toUpperCase();
}

export default function StudentCourseDetailPage() {
  const router = useRouter();
  const currentUser = getCurrentUser();
  const { id } = router.query;

  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [enrollment, setEnrollment] = useState<any>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentLessonId, setCurrentLessonId] = useState<string | null>(null);
  const [preferredLessonId, setPreferredLessonId] = useState<string | null>(
    null
  );

  // local completion tracking (video ended)
  const [completedByUser, setCompletedByUser] = useState<Set<string>>(
    () => new Set()
  );

  // certificate UX state
  const [certLoading, setCertLoading] = useState(false);
  const [certError, setCertError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Fetch course + modules + lessons + enrollment
  useEffect(() => {
    if (!router.isReady || !id) return;
    if (Array.isArray(id)) return;

    const courseId = id as string;

    apiRequest
      .post(`/enrollments/`, { courseId, userId: currentUser?.id })
      .then((res) => {
        setEnrollment(res?.data);
        const lastLessonId = res?.data?.currentLesson?._id;
        if (lastLessonId) setPreferredLessonId(lastLessonId);
      })
      .catch((err) => console.log(err));

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [courseRes, modulesRes, lessonsRes] = await Promise.all([
          apiRequest.get(`/courses/${courseId}`),
          apiRequest.get("/modules", { params: { courseId } }),
          apiRequest.get("/lessons/with-quiz", { params: { courseId } }),
        ]);

        const apiCourse: ApiCourse = courseRes.data;
        const apiModules: ApiModule[] = Array.isArray(modulesRes.data.items)
          ? modulesRes.data.items
          : [];
        const apiLessons: ApiLesson[] = Array.isArray(lessonsRes.data?.items)
          ? lessonsRes.data.items
          : [];

        const lessonsByModule = new Map<string, Lesson[]>();
        for (const l of apiLessons) {
          const moduleId = l.moduleId?._id;
          if (!moduleId) continue;

          const existing = lessonsByModule.get(moduleId) ?? [];
          existing.push({
            ...(l as any),
            moduleId: l.moduleId,
            createdAt: l.createdAt,
          } as Lesson);
          lessonsByModule.set(moduleId, existing);
        }

        const modules: Module[] = apiModules.map((m) => {
          const rawLessons = lessonsByModule.get(m._id) ?? [];
          const orderedLessons = rawLessons.slice().sort((a: any, b: any) => {
            const ap = a?.position ?? 0;
            const bp = b?.position ?? 0;
            if (ap !== bp) return ap - bp;

            const ad = a?.createdAt ? new Date(a.createdAt) : null;
            const bd = b?.createdAt ? new Date(b.createdAt) : null;
            if (ad && bd) return ad.getTime() - bd.getTime();
            return 0;
          });

          return {
            _id: m._id,
            title: m.title,
            position: m.position ?? 0,
            lessons: orderedLessons,
          };
        });

        const categoryTitle =
          typeof apiCourse.categoryId === "object" && apiCourse.categoryId
            ? apiCourse.categoryId.title
            : "Uncategorized";

        let instructorName = "Unknown Instructor";
        if (
          apiCourse.instructorId &&
          typeof apiCourse.instructorId === "object"
        ) {
          const first = apiCourse.instructorId.firstName ?? "";
          const last = apiCourse.instructorId.lastName ?? "";
          const full = `${first} ${last}`.trim();
          instructorName =
            full || apiCourse.instructorId.email || "Unknown Instructor";
        }

        const totalMinutes = apiCourse.durationMinutes ?? 0;
        const totalHours =
          totalMinutes > 0 ? Math.max(1, Math.round(totalMinutes / 60)) : 0;

        setCourse({
          _id: apiCourse._id,
          title: apiCourse.title,
          category: categoryTitle,
          level: apiCourse.level ?? "Beginner",
          instructor: instructorName,
          totalHours,
          progress: 0,
          description: apiCourse.description ?? "",
          modules,
        });
      } catch (err) {
        console.error("Failed to load course detail", err);
        setError("Failed to load course. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, router.isReady]);

  const flatLessons: Lesson[] = useMemo(() => {
    if (!course) return [];
    const sortedMods = course.modules
      .slice()
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

    return sortedMods.flatMap((m) => {
      const orderedLessons = (m.lessons ?? [])
        .slice()
        .sort((a: any, b: any) => {
          const ap = a?.position ?? 0;
          const bp = b?.position ?? 0;
          if (ap !== bp) return ap - bp;

          const ad = a?.createdAt ? new Date(a.createdAt) : null;
          const bd = b?.createdAt ? new Date(b.createdAt) : null;
          if (ad && bd) return ad.getTime() - bd.getTime();
          return 0;
        });

      return orderedLessons;
    });
  }, [course]);

  // ✅ Course completion is a hard stop: once complete, no updates allowed.
  const isCourseCompleted = useMemo(() => {
    const progress = Number(enrollment?.progress ?? 0);
    const hasCompletionDate = Boolean(enrollment?.completionDate);
    return hasCompletionDate || progress >= 100;
  }, [enrollment?.progress, enrollment?.completionDate]);

  // Initialize current lesson: prefer enrollment.currentLesson
  useEffect(() => {
    if (flatLessons.length === 0) return;

    if (currentLessonId && flatLessons.some((l) => l._id === currentLessonId))
      return;

    if (
      preferredLessonId &&
      flatLessons.some((l) => l._id === preferredLessonId)
    ) {
      setCurrentLessonId(preferredLessonId);
      return;
    }

    if (!currentLessonId) setCurrentLessonId(flatLessons[0]._id);
  }, [flatLessons, currentLessonId, preferredLessonId]);

  const currentLesson =
    flatLessons.find((l) => l._id === currentLessonId) ?? flatLessons[0];

  const currentIndex = useMemo(() => {
    if (!currentLessonId) return -1;
    return flatLessons.findIndex((l) => l._id === currentLessonId);
  }, [flatLessons, currentLessonId]);

  // previous = completed (for bold UI)
  const completedLessonIds = useMemo(() => {
    if (currentIndex <= 0) return new Set<string>();
    return new Set(flatLessons.slice(0, currentIndex).map((l) => l._id));
  }, [flatLessons, currentIndex]);

  const completedModuleIds = useMemo(() => {
    if (!course || currentIndex < 0) return new Set<string>();
    const sortedMods = course.modules
      .slice()
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

    const set = new Set<string>();
    let runningIndex = 0;

    for (const mod of sortedMods) {
      const lessons = (mod.lessons ?? []).slice().sort((a: any, b: any) => {
        const ap = a?.position ?? 0;
        const bp = b?.position ?? 0;
        if (ap !== bp) return ap - bp;

        const ad = a?.createdAt ? new Date(a.createdAt) : null;
        const bd = b?.createdAt ? new Date(b.createdAt) : null;
        if (ad && bd) return ad.getTime() - bd.getTime();
        return 0;
      });

      const moduleEndExclusive = runningIndex + lessons.length;

      if (lessons.length > 0 && moduleEndExclusive <= currentIndex) {
        set.add(mod._id);
      }

      runningIndex = moduleEndExclusive;
    }

    return set;
  }, [course, currentIndex]);

  // Progress = enrollment.progress if completed (locked), else computed
  const computedProgressPercent = useMemo(() => {
    const total = flatLessons.length;
    if (total === 0) return 0;

    const union = new Set<string>([
      ...Array.from(completedLessonIds),
      ...Array.from(completedByUser),
    ]);

    return clampPercent((union.size / total) * 100);
  }, [flatLessons.length, completedLessonIds, completedByUser]);

  const progressPercent = useMemo(() => {
    if (isCourseCompleted) return 100;
    const backendProgress = enrollment?.progress;
    if (typeof backendProgress === "number" && backendProgress > 0) {
      return clampPercent(backendProgress);
    }
    return computedProgressPercent;
  }, [isCourseCompleted, enrollment?.progress, computedProgressPercent]);

  // Autoplay when lesson changes (video)
  useEffect(() => {
    if (
      currentLesson?.video?.url &&
      currentLesson?.type === "lesson" &&
      videoRef.current
    ) {
      videoRef.current.load();
      const playPromise = videoRef.current.play();

      if (playPromise !== undefined) {
        playPromise.catch(() => {
          if (!videoRef.current) return;
          videoRef.current.muted = true;
          videoRef.current.play().catch(() => {});
        });
      }
    }
  }, [currentLessonId, currentLesson?.video?.url, currentLesson?.type]);

  // ✅ Persist currentLesson/currentModule/progress ONLY if NOT completed
  useEffect(() => {
    if (isCourseCompleted) return;
    if (!currentLessonId) return;
    if (!enrollment?._id) return;

    const moduleId =
      currentLesson?.moduleId?._id || currentLesson?.moduleId || null;

    apiRequest
      .put(`/enrollments/${enrollment?._id}`, {
        currentLesson: currentLessonId,
        currentModule: moduleId,
        progress: progressPercent,
      })
      .then((res) => {
        if (res?.data) setEnrollment(res.data);
      })
      .catch((err) => console.log(err));
  }, [
    isCourseCompleted,
    currentLessonId,
    enrollment?._id,
    currentLesson?.moduleId,
    progressPercent,
  ]);

  // ✅ Mark lesson completed when video ends; if ALL lessons complete => set completionDate
  const handleVideoEnded = async () => {
    if (isCourseCompleted) return;
    if (!currentLessonId) return;

    setCompletedByUser((prev) => {
      const next = new Set(prev);
      next.add(currentLessonId);
      return next;
    });

    const total = flatLessons.length;
    if (total === 0) return;

    const union = new Set<string>([
      ...Array.from(completedLessonIds),
      ...Array.from(completedByUser),
      currentLessonId,
    ]);

    const allCompleted = union.size >= total;

    if (allCompleted && enrollment?._id) {
      const moduleId =
        currentLesson?.moduleId?._id || currentLesson?.moduleId || null;

      try {
        const res = await apiRequest.put(`/enrollments/${enrollment?._id}`, {
          currentLesson: currentLessonId,
          currentModule: moduleId,
          progress: 100,
          completionDate: new Date().toISOString(),
        });
        if (res?.data) setEnrollment(res.data);
      } catch (err) {
        console.log(err);
      }
    }
  };

  const handleLessonClick = (lessonId: string) => {
    setCurrentLessonId(lessonId);
  };

  const isCurrentLessonQuiz = currentLesson?.type === "quiz";
  const currentQuizStatus = isCurrentLessonQuiz
    ? getQuizAvailability(currentLesson.quiz)
    : "unavailable";

  // ✅ Create certificate (POST /certificates) then route user to certificate page
  const handleViewCertificate = async () => {
    if (!course?._id) return;
    const userId = currentUser?.id;

    if (!userId) {
      setCertError("User not found. Please login again.");
      return;
    }

    setCertLoading(true);
    setCertError(null);

    try {
      const payload: Certificate = {
        userId,
        courseId: course._id,
        certificateNumber: genCertNumber(course._id, userId),
        issuedAt: new Date().toISOString(),
        metadata: {
          enrollmentId: enrollment?._id,
        },
      };

      // If backend already prevents duplicates, this is idempotent.
      // If not, backend should ideally upsert/unique on (userId, courseId).
      const response = await apiRequest.post("/certificates", payload);
      router.push(`/user/certificates/${response.data._id}/`);
    } catch (err: any) {
      console.log(err);
      setCertError(
        err?.response?.data?.message ||
          "Failed to create certificate. Please try again."
      );
    } finally {
      setCertLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>
          {course ? `${course.title} · Continue Course` : "Course · Continue"}
        </title>
      </Head>

      <UserLayout>
        <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
          {loading ? (
            <div className="rounded-xl border border-slate-200 bg-white py-10 text-center text-sm text-slate-500">
              Loading course…
            </div>
          ) : error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 py-10 text-center text-sm text-red-600">
              {error}
            </div>
          ) : !course ? (
            <div className="rounded-xl border border-slate-200 bg-white py-10 text-center text-sm text-slate-500">
              Course not found.
            </div>
          ) : (
            <>
              {/* Breadcrumb + heading */}
              <div className="space-y-1">
                <button
                  onClick={() => router.push("/user/courses/active")}
                  className="text-xs text-slate-500 hover:text-slate-800"
                >
                  ← Back to Active Courses
                </button>

                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h1 className="text-2xl font-semibold text-slate-900">
                      {course.title}
                    </h1>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1">
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5">
                        <BookOpen className="h-3 w-3 mr-1" />
                        {course.category}
                      </span>
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5">
                        {course.level}
                      </span>
                      <span>Instructor: {course.instructor}</span>
                      <span>• {course.totalHours} hrs total</span>
                      {isCourseCompleted && (
                        <span className="inline-flex items-center rounded-full bg-emerald-100 text-emerald-700 px-2 py-0.5">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Completed
                        </span>
                      )}
                    </div>
                  </div>

                  {/* ✅ View Certificate (creates certificate first) */}
                  {isCourseCompleted && (
                    <div className="shrink-0 flex flex-col items-end gap-2">
                      <button
                        type="button"
                        onClick={handleViewCertificate}
                        disabled={certLoading}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold ${
                          certLoading
                            ? "bg-emerald-200 text-emerald-900 cursor-wait"
                            : "bg-emerald-600 text-white hover:bg-emerald-500"
                        }`}
                      >
                        <Award className="h-4 w-4" />
                        {certLoading
                          ? "Preparing Certificate..."
                          : "View Certificate"}
                      </button>

                      {certError && (
                        <p className="text-[11px] text-red-600">{certError}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Main layout */}
              <div className="grid lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] gap-6">
                {/* LEFT */}
                <div className="space-y-4">
                  <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
                    <div className="aspect-video bg-slate-900 flex items-center justify-center">
                      {currentLesson?.video?.url &&
                      currentLesson?.type === "lesson" ? (
                        <video
                          ref={videoRef}
                          key={currentLesson._id}
                          src={currentLesson.video?.url}
                          controls
                          onEnded={handleVideoEnded}
                          className="w-full h-full"
                        />
                      ) : (
                        <div className="flex flex-col items-center text-slate-100 gap-2">
                          <Video className="h-10 w-10" />
                          <span className="text-xs text-slate-300 text-center px-6">
                            {currentLesson?.type === "quiz"
                              ? currentQuizStatus === "expired"
                                ? "This quiz has expired."
                                : "This is a quiz lesson. Start the quiz from below."
                              : "No video available for this lesson"}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="p-4 border-t border-slate-100 space-y-2">
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                        Current lesson
                      </p>
                      <h2 className="text-sm font-semibold text-slate-900">
                        {currentLesson?.title ?? "Select a lesson"}
                      </h2>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                        {currentLesson?.durationMinutes !== undefined && (
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {currentLesson.durationMinutes} min
                          </span>
                        )}
                        {currentLesson?.isPreview && (
                          <span className="inline-flex items-center rounded-full bg-amber-100 text-amber-700 px-2 py-0.5 text-[10px]">
                            Preview
                          </span>
                        )}
                        {(completedLessonIds.has(currentLesson?._id || "") ||
                          completedByUser.has(currentLesson?._id || "") ||
                          currentLesson?.isCompleted ||
                          isCourseCompleted) && (
                          <span className="inline-flex items-center gap-1 text-emerald-600">
                            <CheckCircle2 className="h-3 w-3" />
                            Completed
                          </span>
                        )}
                      </div>

                      <div className="mt-3 space-y-2">
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span>Course progress</span>
                          <span>{progressPercent}%</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-slate-900"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      </div>

                      <div className="mt-3 flex items-center gap-2">
                        {isCourseCompleted ? (
                          <button
                            disabled
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 text-slate-400 text-xs font-medium cursor-not-allowed"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                            Course Completed
                          </button>
                        ) : isCurrentLessonQuiz ? (
                          currentQuizStatus === "eligible" ? (
                            <Link
                              href={`/user/courses/${course._id}/quiz/${currentLesson._id}`}
                              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-medium hover:bg-slate-800"
                            >
                              <FileText className="h-4 w-4" />
                              Take Quiz
                            </Link>
                          ) : currentQuizStatus === "expired" ? (
                            <button
                              disabled
                              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-100 text-red-600 text-xs font-medium cursor-not-allowed"
                            >
                              <FileText className="h-4 w-4" />
                              Quiz Expired
                            </button>
                          ) : (
                            <button
                              disabled
                              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 text-slate-400 text-xs font-medium cursor-not-allowed"
                            >
                              <FileText className="h-4 w-4" />
                              Quiz Unavailable
                            </button>
                          )
                        ) : (
                          <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-medium hover:bg-slate-800">
                            <PlayCircle className="h-4 w-4" />
                            Continue Lesson
                          </button>
                        )}

                        <button className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900">
                          <FileText className="h-3 w-3" />
                          View Resources
                        </button>

                        {/* duplicate CTA in body (optional) */}
                        {isCourseCompleted && (
                          <button
                            type="button"
                            onClick={handleViewCertificate}
                            disabled={certLoading}
                            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold ${
                              certLoading
                                ? "bg-emerald-200 text-emerald-900 cursor-wait"
                                : "bg-emerald-600 text-white hover:bg-emerald-500"
                            }`}
                          >
                            <Award className="h-4 w-4" />
                            {certLoading ? "Preparing..." : "View Certificate"}
                          </button>
                        )}
                      </div>

                      {certError && (
                        <p className="text-[11px] text-red-600 mt-2">
                          {certError}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <h3 className="text-sm font-semibold text-slate-900 mb-1">
                      Course Overview
                    </h3>
                    <p className="text-sm text-slate-600 whitespace-pre-line">
                      {course.description || "No description available."}
                    </p>
                  </div>
                </div>

                {/* RIGHT */}
                <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3 max-h-[700px] overflow-y-auto">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm font-semibold text-slate-900">
                      Course Content
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      {course.modules.length} modules • {flatLessons.length}{" "}
                      lessons
                    </p>
                  </div>

                  <div className="space-y-3">
                    {course.modules
                      .slice()
                      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
                      .map((mod) => {
                        const moduleCompleted =
                          isCourseCompleted || completedModuleIds.has(mod._id);

                        return (
                          <div
                            key={mod._id}
                            className="rounded-xl border border-slate-100 bg-slate-50/60"
                          >
                            <div className="px-3 py-2.5 flex items-center justify-between">
                              <div className="flex flex-col">
                                <span className="text-[11px] uppercase tracking-wide text-slate-400">
                                  Module {mod.position}
                                </span>
                                <span
                                  className={`text-xs text-slate-900 ${
                                    moduleCompleted
                                      ? "font-bold"
                                      : "font-semibold"
                                  }`}
                                >
                                  {mod.title}
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-400">
                                {mod.lessons.length} lessons
                              </span>
                            </div>

                            <div className="border-t border-slate-100 divide-y divide-slate-100">
                              {mod.lessons.map((lesson, index) => {
                                const isActive = lesson._id === currentLessonId;
                                const isQuiz = lesson.type === "quiz";
                                const quizStatus = getQuizAvailability(
                                  lesson.quiz
                                );

                                const derivedCompleted = completedLessonIds.has(
                                  lesson._id
                                );
                                const userCompleted = completedByUser.has(
                                  lesson._id
                                );

                                const isLessonCompleted =
                                  isCourseCompleted ||
                                  Boolean(lesson.isCompleted) ||
                                  derivedCompleted ||
                                  userCompleted;

                                return (
                                  <button
                                    key={lesson._id}
                                    type="button"
                                    onClick={() =>
                                      handleLessonClick(lesson._id)
                                    }
                                    className={`w-full px-3 py-2 flex items-center justify-between text-left text-xs ${
                                      isActive
                                        ? "bg-white"
                                        : "bg-transparent hover:bg-white/70"
                                    }`}
                                  >
                                    <div className="flex items-start gap-2">
                                      <div className="mt-0.5 text-[10px] text-slate-400 w-4 text-right">
                                        {index + 1}.
                                      </div>

                                      <div>
                                        <div
                                          className={`flex items-center gap-2 ${
                                            isActive
                                              ? "text-slate-900 font-semibold"
                                              : isLessonCompleted
                                              ? "text-slate-900 font-bold"
                                              : "text-slate-700"
                                          }`}
                                        >
                                          <span className="line-clamp-2">
                                            {lesson.title}
                                          </span>
                                          {lesson.isPreview && (
                                            <span className="inline-flex items-center rounded-full bg-amber-100 text-amber-700 px-1.5 py-0.5 text-[9px]">
                                              Preview
                                            </span>
                                          )}
                                        </div>

                                        <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-slate-500">
                                          {lesson.durationMinutes !==
                                            undefined && (
                                            <span>
                                              {lesson.durationMinutes} min
                                            </span>
                                          )}
                                          {isLessonCompleted && (
                                            <span className="inline-flex items-center gap-1 text-emerald-600">
                                              <CheckCircle2 className="h-3 w-3" />
                                              Done
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>

                                    <div className="ml-3 flex items-center">
                                      {isQuiz ? (
                                        quizStatus === "eligible" &&
                                        !isCourseCompleted ? (
                                          <Link
                                            href={`/user/courses/${course._id}/quiz/${lesson._id}`}
                                            className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-slate-900 text-white text-[11px]"
                                          >
                                            <FileText className="h-3 w-3" />
                                            Take Quiz
                                          </Link>
                                        ) : quizStatus === "expired" ? (
                                          <span className="text-[10px] font-semibold text-red-600">
                                            Expired
                                          </span>
                                        ) : (
                                          <span className="text-[10px] text-slate-400">
                                            {isCourseCompleted
                                              ? "Completed"
                                              : "Unavailable"}
                                          </span>
                                        )
                                      ) : isActive ? (
                                        <PlayCircle className="h-4 w-4 text-slate-900" />
                                      ) : isLessonCompleted ? (
                                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                      ) : (
                                        <PlayCircle className="h-4 w-4 text-slate-400" />
                                      )}
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </UserLayout>
    </>
  );
}
