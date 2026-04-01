"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import confetti from "canvas-confetti";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  HelpCircle,
  Send,
  ShieldCheck,
  XCircle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import ExamSecurityGuard, {
  type ExamViolationEvent,
} from "@/components/security/ExamSecurityGuard";
import { getExam, logSecurityViolation, submitExam } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

const SOFT_VIOLATION_LIMIT = 5;
const REDIRECT_DELAY_MS = 700;

function getViolationLabel(source: string | null): string {
  switch (source) {
    case "devtools":
      return "DevTools";
    case "extension":
      return "Extension";
    case "contextmenu":
      return "Chuot phai";
    case "shortcut":
      return "Phim tat bi cam";
    case "copy":
      return "Copy";
    case "cut":
      return "Cut";
    case "paste":
      return "Paste";
    case "selectstart":
      return "Select text";
    default:
      return "Vi pham khong hop le";
  }
}

function toWsBaseUrl(apiBaseUrl: string): string {
  return apiBaseUrl.replace(/^http/i, "ws");
}

export default function TakeExamPage() {
  const router = useRouter();
  const params = useParams();
  const examId = Number(params.id);
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  const [exam, setExam] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [softViolationCount, setSoftViolationCount] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const [latestViolationSource, setLatestViolationSource] = useState<string | null>(
    null
  );
  const [securityLocked, setSecurityLocked] = useState(false);
  const [securityMessage, setSecurityMessage] = useState("");

  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null);
  const redirectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const socketRef = useRef<WebSocket | null>(null);

  const fetchExam = useCallback(async () => {
    try {
      const examData = await getExam(examId);
      if (examData.detail) throw new Error(examData.detail);

      setExam(examData);
      if (examData.time_limit) {
        setTimeLeft(examData.time_limit * 60);
      }
    } catch (err: any) {
      setError(err.message || "Khong the tai de thi.");
    } finally {
      setLoading(false);
    }
  }, [examId]);

  const connectStudentSocket = useCallback(() => {
    if (!user?.id || Number.isNaN(examId) || socketRef.current) return;

    const apiBaseUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
    const wsUrl = `${toWsBaseUrl(apiBaseUrl)}/ws/exams/${examId}/student`;

    try {
      // Browser WebSocket automatically sends cookies for the target backend host.
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.info("[ANTI-CHEAT] Student WebSocket connected");
        ws.send(
          JSON.stringify({
            type: "join",
            examId,
            userId: user.id,
          })
        );
      };

      ws.onmessage = (event) => {
        console.debug("[ANTI-CHEAT] WS message:", event.data);
      };

      ws.onerror = () => {
        console.warn("[ANTI-CHEAT] Student WebSocket error");
      };

      ws.onclose = (event) => {
        if (event.code === 4001 || event.code === 4003) {
          console.warn(
            `[ANTI-CHEAT] Student WebSocket rejected (${event.code}) - continuing without realtime socket`
          );
        } else {
          console.info(
            `[ANTI-CHEAT] Student WebSocket closed (${event.code})`
          );
        }

        if (socketRef.current === ws) {
          socketRef.current = null;
        }
      };

      socketRef.current = ws;
    } catch (socketError) {
      console.warn("[ANTI-CHEAT] Failed to initialize student WebSocket", socketError);
    }
  }, [examId, user?.id]);

  const sendSocketEvent = useCallback(
    (payload: Record<string, unknown>) => {
      const socket = socketRef.current;
      if (!socket || socket.readyState !== WebSocket.OPEN || !user?.id) return;

      socket.send(
        JSON.stringify({
          examId,
          userId: user.id,
          ...payload,
        })
      );
    },
    [examId, user?.id]
  );

  const lockExam = useCallback(
    async (
      source: string,
      message: string,
      metadata?: Record<string, unknown>,
      finalSoftCount?: number
    ) => {
      if (securityLocked || isFinished) return;

      setSecurityLocked(true);
      setSecurityMessage(message);
      setLatestViolationSource(source);
      setShowWarning(false);

      if (typeof finalSoftCount === "number") {
        setSoftViolationCount(finalSoftCount);
      }

      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
      if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current);

      sendSocketEvent({
        type: "violation_lock",
        source,
      });

      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }

      try {
        await logSecurityViolation({
          exam_id: examId,
          violation_type: source,
          detected_at: new Date().toISOString(),
          metadata: {
            ...metadata,
            final_soft_violation_count: finalSoftCount ?? softViolationCount,
            user_id: user?.id ?? null,
            user_role: user?.role ?? null,
          },
        });
      } catch (logError) {
        console.error("[ANTI-CHEAT] Failed to log lock violation", logError);
      }

      redirectTimerRef.current = setTimeout(() => {
        router.replace(`/exam-violation?reason=${encodeURIComponent(source)}`);
      }, REDIRECT_DELAY_MS);
    },
    [
      examId,
      isFinished,
      router,
      securityLocked,
      sendSocketEvent,
      softViolationCount,
      user?.id,
      user?.role,
    ]
  );

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated || user?.role !== "student") {
      router.push("/login");
      return;
    }

    fetchExam();
    connectStudentSocket();

    return () => {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
      if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current);
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, [
    authLoading,
    connectStudentSocket,
    fetchExam,
    isAuthenticated,
    router,
    user?.role,
  ]);

  useEffect(() => {
    if (isFinished || securityLocked) return;

    const handleVisibilityChange = () => {
      sendSocketEvent({
        type: document.hidden ? "blur" : "focus",
      });
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [isFinished, securityLocked, sendSocketEvent]);

  useEffect(() => {
    if (timeLeft === null || isFinished || securityLocked) return;

    if (timeLeft <= 0) {
      void handleSubmit();
      return;
    }

    countdownTimerRef.current = setInterval(() => {
      setTimeLeft((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, [isFinished, securityLocked, timeLeft]);

  const handleSecurityViolation = useCallback(
    async ({ source, severity, metadata }: ExamViolationEvent) => {
      if (securityLocked || isFinished) return;

      setLatestViolationSource(source);

      if (severity === "hard") {
        await lockExam(
          source,
          "Phat hien hard violation. Bai thi bi khoa ngay lap tuc!",
          metadata,
          softViolationCount
        );
        return;
      }

      const nextCount = softViolationCount + 1;
      setSoftViolationCount(nextCount);
      setShowWarning(true);

      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
      warningTimerRef.current = setTimeout(() => {
        setShowWarning(false);
      }, 2500);

      try {
        await logSecurityViolation({
          exam_id: examId,
          violation_type: source,
          detected_at: new Date().toISOString(),
          metadata: {
            ...metadata,
            severity,
            soft_violation_count: nextCount,
            remaining_before_lock: Math.max(SOFT_VIOLATION_LIMIT - nextCount, 0),
            user_id: user?.id ?? null,
            user_role: user?.role ?? null,
          },
        });
      } catch (logError) {
        console.error("[ANTI-CHEAT] Failed to log soft violation", logError);
      }

      if (nextCount >= SOFT_VIOLATION_LIMIT) {
        await lockExam(
          source,
          `Ban da vi pham ${SOFT_VIOLATION_LIMIT} lan. Bai thi bi khoa!`,
          {
            ...metadata,
            threshold: SOFT_VIOLATION_LIMIT,
          },
          nextCount
        );
      }
    },
    [
      examId,
      isFinished,
      lockExam,
      securityLocked,
      softViolationCount,
      user?.id,
      user?.role,
    ]
  );

  const handleSelectAnswer = (questionId: number, choiceId: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: Number(choiceId),
    }));
  };

  const handleSubmit = useCallback(async () => {
    if (isSubmitting || isFinished || securityLocked) return;

    const answeredCount = Object.keys(answers).length;
    const totalCount = exam?.questions?.length || 0;

    if (timeLeft !== 0 && answeredCount < totalCount) {
      const shouldSubmit = window.confirm(
        `Ban moi tra loi ${answeredCount}/${totalCount} cau hoi. Ban van muon nop bai chu?`
      );

      if (!shouldSubmit) return;
    }

    setIsSubmitting(true);

    try {
      const submissionData = Object.entries(answers).map(([questionId, choiceId]) => ({
        question_id: Number(questionId),
        choice_id: choiceId,
      }));

      sendSocketEvent({ type: "submit" });

      const response = await submitExam(examId, submissionData, softViolationCount);
      setResult(response);
      setIsFinished(true);

      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#ef4444", "#f97316", "#0f172a"],
      });

      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    } catch (submitError: any) {
      alert(`Loi nop bai: ${submitError.message}`);
    } finally {
      setIsSubmitting(false);
    }
  }, [
    answers,
    exam?.questions?.length,
    examId,
    isFinished,
    isSubmitting,
    securityLocked,
    sendSocketEvent,
    softViolationCount,
    timeLeft,
  ]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`;
  };

  if (loading || authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-rose-600 border-t-transparent shadow-xl" />
          <p className="text-sm font-medium text-slate-500">Dang tai de thi...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4">
        <XCircle className="mb-4 h-16 w-16 text-rose-500" />
        <h1 className="mb-2 text-2xl font-bold text-slate-900">
          Loi truy cap he thong
        </h1>
        <p className="mb-6 max-w-md text-center text-slate-500">{error}</p>
        <Button
          onClick={() => router.push("/student/dashboard")}
          className="bg-rose-600 hover:bg-rose-700"
        >
          Quay lai bang dieu khien
        </Button>
      </div>
    );
  }

  if (securityLocked) {
    return (
      <div className="fixed inset-0 z-[200] flex min-h-screen items-center justify-center bg-red-950 p-4">
        <div className="w-full max-w-xl rounded-3xl border border-red-400/30 bg-red-900/90 p-8 text-center shadow-2xl shadow-red-950/60">
          <AlertTriangle className="mx-auto mb-5 h-16 w-16 text-red-200" />
          <h1 className="mb-3 text-3xl font-black text-white">BAI THI BI KHOA</h1>
          <p className="text-sm font-semibold leading-relaxed text-red-50">
            {securityMessage}
          </p>
          {latestViolationSource && (
            <p className="mt-4 text-xs font-bold uppercase tracking-[0.2em] text-red-200/80">
              Ly do: {getViolationLabel(latestViolationSource)}
            </p>
          )}
        </div>
      </div>
    );
  }

  if (isFinished) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <Card className="w-full max-w-lg border-none bg-white p-8 text-center shadow-2xl shadow-slate-200/60">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50">
            <CheckCircle2 className="h-12 w-12 text-emerald-500" />
          </div>
          <h1 className="text-3xl font-black text-slate-900">Nop bai thanh cong!</h1>
          <p className="mt-2 text-sm font-medium text-slate-500">
            Ket qua da duoc ghi nhan vao he thong.
          </p>
          <div className="mt-6 rounded-2xl border border-slate-100 bg-slate-50 p-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Diem so
                </p>
                <p className="mt-1 text-4xl font-black text-slate-900">
                  {result?.score?.toFixed?.(1) ?? "0.0"}
                </p>
              </div>
              <div className="border-l border-slate-200">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Soft violation
                </p>
                <p className="mt-1 text-4xl font-black text-amber-500">
                  {softViolationCount}
                </p>
              </div>
            </div>
          </div>
          <Button
            onClick={() => router.push("/student/dashboard")}
            className="mt-6 h-12 w-full bg-slate-900 font-bold text-white hover:bg-slate-800"
          >
            Quay lai bang dieu khien
          </Button>
        </Card>
      </div>
    );
  }

  const currentQuestion = exam?.questions?.[currentIndex];
  const progress = ((currentIndex + 1) / (exam?.questions?.length || 1)) * 100;

  return (
    <div className="min-h-screen select-none bg-slate-50/60 pb-10">
      <ExamSecurityGuard
        enabled={!loading && !isFinished && !securityLocked}
        onViolation={handleSecurityViolation}
      />

      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              className="-ml-2 text-slate-500 hover:text-slate-900"
              onClick={() => {
                const shouldLeave = window.confirm(
                  "Ban muon thoat bai thi? Cac cau tra loi chua nop se bi mat!"
                );
                if (shouldLeave) router.push("/student/dashboard");
              }}
            >
              <ChevronLeft className="mr-1 h-5 w-5" />
              Thoat
            </Button>
            <div className="hidden h-8 w-px bg-slate-100 sm:block" />
            <div className="hidden sm:block">
              <p className="text-sm font-bold text-slate-900">{exam?.title}</p>
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <ShieldCheck className="h-3 w-3 text-rose-500" />
                <span>Anti-cheat active</span>
              </div>
            </div>
          </div>

          <div
            className={`flex items-center gap-3 rounded-full border px-4 py-1.5 ${
              timeLeft !== null && timeLeft < 60
                ? "animate-pulse border-red-200 bg-red-50"
                : "border-slate-200 bg-slate-50"
            }`}
          >
            <Clock
              className={`h-4 w-4 ${
                timeLeft !== null && timeLeft < 60
                  ? "text-red-500"
                  : "text-slate-500"
              }`}
            />
            <span
              className={`font-mono text-lg font-black ${
                timeLeft !== null && timeLeft < 60
                  ? "text-red-600"
                  : "text-slate-700"
              }`}
            >
              {timeLeft !== null ? formatTime(timeLeft) : "--:--"}
            </span>
          </div>

          <Button
            onClick={() => void handleSubmit()}
            disabled={isSubmitting}
            className="bg-rose-600 font-bold text-white hover:bg-rose-700"
          >
            <Send className="mr-2 h-4 w-4" />
            Nop bai
          </Button>
        </div>
        <div className="h-1 w-full bg-slate-100">
          <div
            className="h-full bg-rose-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-black uppercase tracking-widest text-slate-400">
            Cau hoi {currentIndex + 1} / {exam?.questions?.length || 0}
          </span>
          <Badge variant="secondary" className="rounded-none bg-slate-100 px-2 font-mono">
            ID: {currentQuestion?.id}
          </Badge>
        </div>

        <Card className="overflow-hidden rounded-3xl border-slate-200 bg-white shadow-xl shadow-slate-200/30">
          <CardHeader className="border-b border-slate-100 bg-slate-50/60 p-8">
            <CardTitle className="text-xl font-bold leading-snug text-slate-900 md:text-2xl">
              {currentQuestion?.content}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <RadioGroup
              value={String(answers[currentQuestion?.id] || "")}
              onValueChange={(value) =>
                handleSelectAnswer(currentQuestion?.id, value)
              }
              className="space-y-4"
            >
              {currentQuestion?.choices?.map((choice: any, index: number) => (
                <label
                  key={choice.id}
                  className={`flex cursor-pointer items-center justify-between rounded-2xl border-2 p-5 transition-all ${
                    answers[currentQuestion?.id] === choice.id
                      ? "border-rose-500 bg-rose-50/60 ring-2 ring-rose-100"
                      : "border-slate-100 bg-white hover:border-rose-200 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-bold ${
                        answers[currentQuestion?.id] === choice.id
                          ? "border-rose-600 bg-rose-600 text-white"
                          : "border-slate-200 bg-white text-slate-400"
                      }`}
                    >
                      {String.fromCharCode(65 + index)}
                    </div>
                    <span className="text-base font-semibold text-slate-700">
                      {choice.content}
                    </span>
                  </div>
                  <RadioGroupItem value={String(choice.id)} className="sr-only" />
                </label>
              ))}
            </RadioGroup>
          </CardContent>
          <CardFooter className="flex items-center justify-between border-t border-slate-100 bg-slate-50 p-4">
            <Button
              variant="ghost"
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex((prev) => prev - 1)}
            >
              <ChevronLeft className="mr-1 h-5 w-5" />
              Quay lai
            </Button>

            <div className="flex gap-2">
              {exam?.questions?.map((_: any, idx: number) => (
                <div
                  key={idx}
                  className={`h-1.5 w-1.5 rounded-full transition-all duration-300 ${
                    idx === currentIndex
                      ? "w-6 bg-rose-600"
                      : answers[exam?.questions[idx]?.id]
                        ? "bg-rose-300"
                        : "bg-slate-200"
                  }`}
                />
              ))}
            </div>

            <Button
              variant="ghost"
              disabled={currentIndex === (exam?.questions?.length || 1) - 1}
              onClick={() => setCurrentIndex((prev) => prev + 1)}
            >
              Tiep theo
              <ChevronRight className="ml-1 h-5 w-5" />
            </Button>
          </CardFooter>
        </Card>

        <div className="mt-6 rounded-2xl border border-slate-100 bg-white p-6 shadow-lg shadow-slate-100/60">
          <div className="mb-4 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
            <HelpCircle className="h-3 w-3" />
            Danh sach cau hoi
          </div>
          <div className="flex flex-wrap gap-2">
            {exam?.questions?.map((question: any, idx: number) => (
              <button
                key={question.id}
                onClick={() => setCurrentIndex(idx)}
                className={`h-9 w-10 rounded-lg border text-xs font-bold transition-all ${
                  currentIndex === idx
                    ? "border-rose-600 bg-rose-600 text-white"
                    : answers[question.id]
                      ? "border-rose-200 bg-rose-50 text-rose-700"
                      : "border-slate-200 bg-white text-slate-400 hover:border-rose-400 hover:text-rose-500"
                }`}
              >
                {idx + 1}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 flex items-center gap-4 rounded-xl border border-amber-100 border-dashed bg-amber-50 p-4">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500" />
          <p className="text-xs font-medium leading-relaxed text-amber-700">
            Hard: DevTools that bi khoa ngay. Soft: extension cheat, chuot phai,
            copy/cut/paste, select text, phim tat cam se bi khoa khi dat 5 lan.
          </p>
        </div>
      </main>

      {showWarning && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-red-600/15 backdrop-blur-sm">
          <div className="mx-4 max-w-sm rounded-3xl border-4 border-red-500 bg-white p-8 text-center shadow-2xl">
            <AlertTriangle className="mx-auto mb-4 h-16 w-16 animate-bounce text-red-500" />
            <h2 className="mb-2 text-2xl font-black text-slate-900">
              CANH BAO VI PHAM
            </h2>
            <p className="mb-4 font-bold text-red-600">
              Soft violation da duoc ghi nhan.
            </p>
            <div className="rounded-xl border border-red-100 bg-red-50 p-3 text-xs font-medium text-red-700">
              So lan vi pham:{" "}
              <span className="text-lg font-black">{softViolationCount}</span>
            </div>
            <p className="mt-3 text-xs font-semibold text-slate-600">
              Con lai {Math.max(SOFT_VIOLATION_LIMIT - softViolationCount, 0)} lan truoc khi khoa bai.
            </p>
            {latestViolationSource && (
              <p className="mt-2 text-[11px] font-bold uppercase tracking-wider text-red-500">
                Vi pham: {getViolationLabel(latestViolationSource)}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
