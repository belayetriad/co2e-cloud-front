// pages/user/quizzes/[id].tsx
import UserLayout from "@/components/user/layout/UserLayout";
import apiRequest from "@/lib/axios";
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
} from "lucide-react";
import Head from "next/head";
import { useRouter } from "next/router";
import { FormEvent, useEffect, useMemo, useState } from "react";

type QuestionType =
  | "single_choice"
  | "multiple_choice"
  | "true_false"
  | "short_answer";

type QuizQuestionOption = {
  id: string;
  text: string;
};

type QuizQuestion = {
  id: string;
  type: QuestionType;
  text: string;
  options?: QuizQuestionOption[];
  points?: number;
};

type QuizDetail = {
  id: string;
  title: string;
  instructions?: string;
  timeLimitSeconds?: number;
  attemptsAllowed?: number;
  passMarkPercent?: number;
};

type QuestionAnswer = {
  selectedOptionIds?: string[];
  answerText?: string;
};

type AnswersState = Record<string, QuestionAnswer>;

export default function TakeQuizPage() {
  const router = useRouter();
  const { quizId } = router.query; // quizId

  const [quiz, setQuiz] = useState<QuizDetail | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = useState<AnswersState>({});
  const [currentIndex, setCurrentIndex] = useState(0);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);

  // Timer
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);

  // Fetch quiz + questions
  useEffect(() => {
    if (!router.isReady || !quizId) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        setSubmitMessage(null);

        const [quizRes, questionsRes] = await Promise.all([
          apiRequest.get(`/quizzes/${quizId}`),
          apiRequest.get(`/quizzes/${quizId}/questions`),
        ]);

        // Quiz
        const q = quizRes.data;
        const quizDetail: QuizDetail = {
          id: q._id ?? q.id ?? quizId,
          title: q.title,
          instructions: q.instructions,
          timeLimitSeconds: q.timeLimitSeconds ?? 0,
          attemptsAllowed: q.attemptsAllowed ?? 1,
          passMarkPercent: q.passMarkPercent ?? 70,
        };
        setQuiz(quizDetail);

        // Questions – your service returns { list: Question[] }
        const rawQuestions = Array.isArray(questionsRes.data?.items)
          ? questionsRes.data.items
          : [];

        const mappedQuestions: QuizQuestion[] = rawQuestions.map(
          (item: any) => {
            const id = item._id ?? item.id;
            const type: QuestionType =
              item.type &&
              [
                "single_choice",
                "multiple_choice",
                "true_false",
                "short_answer",
              ].includes(item.type)
                ? item.type
                : "single_choice";

            // Options: map _id/id + text, ignore isCorrect, explanation for student
            let options: QuizQuestionOption[] | undefined;
            if (Array.isArray(item.options)) {
              options = item.options.map((op: any) => ({
                id: op._id ?? op.id ?? op.text,
                text: op.text,
              }));
            } else if (type === "true_false") {
              options = [
                { id: "true", text: "True" },
                { id: "false", text: "False" },
              ];
            }

            return {
              id,
              type,
              text: item.text,
              options,
              points: item.points,
            };
          }
        );

        setQuestions(mappedQuestions);

        // Init timer
        if (quizDetail.timeLimitSeconds && quizDetail.timeLimitSeconds > 0) {
          setRemainingSeconds(quizDetail.timeLimitSeconds);
        } else {
          setRemainingSeconds(null);
        }

        // Reset index/answers
        setCurrentIndex(0);
        setAnswers({});
      } catch (err) {
        console.error("Failed to load quiz", err);
        setError("Failed to load quiz. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [quizId, router.isReady]);

  // Timer countdown
  useEffect(() => {
    if (remainingSeconds === null) return;
    if (remainingSeconds <= 0) return;

    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          clearInterval(interval);
          // TODO: auto-submit when time is up if you want
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [remainingSeconds]);

  const currentQuestion = questions[currentIndex];

  const totalQuestions = questions.length;

  const progressPercent = useMemo(() => {
    if (!totalQuestions) return 0;
    const answeredCount = questions.filter((q) => {
      const a = answers[q.id];
      if (!a) return false;
      if (q.type === "short_answer") {
        return !!a.answerText?.trim();
      }
      return !!a.selectedOptionIds && a.selectedOptionIds.length > 0;
    }).length;

    return Math.round((answeredCount / totalQuestions) * 100);
  }, [questions, answers, totalQuestions]);

  const formatTime = (sec: number | null) => {
    if (sec === null) return "";
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const updateSingleChoice = (questionId: string, optionId: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: {
        ...(prev[questionId] ?? {}),
        selectedOptionIds: [optionId],
      },
    }));
  };

  const toggleMultipleChoice = (questionId: string, optionId: string) => {
    setAnswers((prev) => {
      const existing = prev[questionId]?.selectedOptionIds ?? [];
      const exists = existing.includes(optionId);
      const next = exists
        ? existing.filter((id) => id !== optionId)
        : [...existing, optionId];

      return {
        ...prev,
        [questionId]: {
          ...(prev[questionId] ?? {}),
          selectedOptionIds: next,
        },
      };
    });
  };

  const updateShortAnswer = (questionId: string, value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: {
        ...(prev[questionId] ?? {}),
        answerText: value,
      },
    }));
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) =>
      Math.min(totalQuestions - 1, Math.max(0, prev + 1))
    );
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!quiz) return;
    if (!quizId) return;

    try {
      setSubmitting(true);
      setSubmitMessage(null);
      setError(null);

      // Payload shape – adjust to match your backend
      const payload = {
        quizId,
        answers: Object.entries(answers).map(([questionId, value]) => ({
          questionId,
          selectedOptionIds: value.selectedOptionIds ?? [],
          answerText: value.answerText ?? "",
        })),
      };

      // TODO: point to your real submit endpoint
      // Example:
      // const res = await apiRequest.post(`/user/quizzes/${quizId}/submit`, payload);
      // For now, just simulate:
      console.log("Submitting quiz payload", payload);
      // const { scorePercent, passed } = res.data;

      setSubmitMessage(
        "Quiz submitted successfully. (Wire this to your real submit endpoint.)"
      );
      // Optionally redirect or show score
    } catch (err) {
      console.error("Submit quiz failed", err);
      setError("Failed to submit quiz. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Head>
        <title>{quiz ? `${quiz.title} · Quiz` : "Take Quiz"}</title>
      </Head>
      <UserLayout>
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
          {loading ? (
            <div className="rounded-xl border border-slate-200 bg-white py-10 text-center text-sm text-slate-500 flex flex-col items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
              Loading quiz…
            </div>
          ) : error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex items-start gap-2 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 mt-0.5" />
              <span>{error}</span>
            </div>
          ) : !quiz || !currentQuestion ? (
            <div className="rounded-xl border border-slate-200 bg-white py-10 text-center text-sm text-slate-500">
              Quiz not found.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Header */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <button
                    type="button"
                    onClick={() => router.back()}
                    className="text-xs text-slate-500 hover:text-slate-800"
                  >
                    ← Back
                  </button>
                  <h1 className="mt-1 text-xl font-semibold text-slate-900">
                    {quiz.title}
                  </h1>
                  {quiz.instructions && (
                    <p className="mt-1 text-xs text-slate-600 whitespace-pre-line">
                      {quiz.instructions}
                    </p>
                  )}
                </div>

                <div className="flex flex-col items-end gap-2">
                  {/* Timer */}
                  {quiz.timeLimitSeconds && quiz.timeLimitSeconds > 0 && (
                    <div className="inline-flex items-center gap-2 rounded-full bg-slate-900 text-white px-3 py-1 text-xs">
                      <Clock className="h-3 w-3" />
                      <span>
                        Time left:{" "}
                        {remainingSeconds !== null
                          ? formatTime(remainingSeconds)
                          : formatTime(quiz.timeLimitSeconds)}
                      </span>
                    </div>
                  )}

                  {/* Progress */}
                  <div className="w-48">
                    <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                      <span>Progress</span>
                      <span>{progressPercent}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full bg-slate-900 rounded-full"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Question Card */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-[11px] text-slate-500">
                    Question {currentIndex + 1} of {totalQuestions}
                  </div>
                  {currentQuestion.points !== undefined && (
                    <div className="text-[11px] text-slate-500">
                      {currentQuestion.points} pts
                    </div>
                  )}
                </div>

                <h2 className="text-sm sm:text-base font-semibold text-slate-900">
                  {currentQuestion.text}
                </h2>

                {/* Options / Input */}
                <div className="mt-2 space-y-3 text-sm">
                  {currentQuestion.type === "single_choice" &&
                    currentQuestion.options &&
                    currentQuestion.options.map((op) => {
                      const checked =
                        answers[currentQuestion.id]?.selectedOptionIds?.[0] ===
                        op.id;
                      return (
                        <label
                          key={op.id}
                          className="flex items-start gap-2 rounded-lg border border-slate-200 px-3 py-2 hover:bg-slate-50 cursor-pointer"
                        >
                          <input
                            type="radio"
                            name={`q-${currentQuestion.id}`}
                            className="mt-0.5 h-3 w-3"
                            checked={checked}
                            onChange={() =>
                              updateSingleChoice(currentQuestion.id, op.id)
                            }
                          />
                          <span className="text-slate-800">{op.text}</span>
                        </label>
                      );
                    })}

                  {currentQuestion.type === "multiple_choice" &&
                    currentQuestion.options &&
                    currentQuestion.options.map((op) => {
                      const selected =
                        answers[
                          currentQuestion.id
                        ]?.selectedOptionIds?.includes(op.id) ?? false;
                      return (
                        <label
                          key={op.id}
                          className="flex items-start gap-2 rounded-lg border border-slate-200 px-3 py-2 hover:bg-slate-50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            className="mt-0.5 h-3 w-3"
                            checked={selected}
                            onChange={() =>
                              toggleMultipleChoice(currentQuestion.id, op.id)
                            }
                          />
                          <span className="text-slate-800">{op.text}</span>
                        </label>
                      );
                    })}

                  {currentQuestion.type === "true_false" &&
                    currentQuestion.options &&
                    currentQuestion.options.map((op) => {
                      const checked =
                        answers[currentQuestion.id]?.selectedOptionIds?.[0] ===
                        op.id;
                      return (
                        <label
                          key={op.id}
                          className="flex items-start gap-2 rounded-lg border border-slate-200 px-3 py-2 hover:bg-slate-50 cursor-pointer"
                        >
                          <input
                            type="radio"
                            name={`q-${currentQuestion.id}`}
                            className="mt-0.5 h-3 w-3"
                            checked={checked}
                            onChange={() =>
                              updateSingleChoice(currentQuestion.id, op.id)
                            }
                          />
                          <span className="text-slate-800">{op.text}</span>
                        </label>
                      );
                    })}

                  {currentQuestion.type === "short_answer" && (
                    <textarea
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-slate-900/10"
                      rows={4}
                      placeholder="Type your answer here..."
                      value={answers[currentQuestion.id]?.answerText ?? ""}
                      onChange={(e) =>
                        updateShortAnswer(currentQuestion.id, e.target.value)
                      }
                    />
                  )}
                </div>
              </div>

              {/* Question navigation + Submit */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handlePrev}
                    disabled={currentIndex === 0}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-3 w-3" />
                    Previous
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={currentIndex === totalQuestions - 1}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                    <ChevronRight className="h-3 w-3" />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {submitMessage && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600">
                      <CheckCircle2 className="h-3 w-3" />
                      {submitMessage}
                    </span>
                  )}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        Submit Quiz
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </UserLayout>
    </>
  );
}
