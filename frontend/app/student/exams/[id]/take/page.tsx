"use client";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  Send,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ShieldCheck
} from "lucide-react";
import { getExam, submitExam } from "@/lib/api";

export default function TakeExamPage() {
  const router = useRouter();
  const { id } = useParams();
  const [exam, setExam] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [result, setResult] = useState<any>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchExamData = useCallback(async (token: string) => {
    try {
      const data = await getExam(Number(id), token);
      if (data.detail) throw new Error(data.detail);
      setExam(data);
      if (data.time_limit) {
        setTimeLeft(data.time_limit * 60);
      }
    } catch (err: any) {
      setError(err.message || "Không thể tải đề thi.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    const cookies = document.cookie.split("; ");
    const tokenCookie = cookies.find((row) => row.startsWith("token="));
    if (tokenCookie) {
      const t = tokenCookie.split("=")[1];
      fetchExamData(t);
    } else {
      router.push("/login");
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [fetchExamData, router]);

  useEffect(() => {
    if (timeLeft !== null && timeLeft > 0 && !isFinished) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => (prev !== null ? prev - 1 : null));
      }, 1000);
    } else if (timeLeft === 0 && !isFinished) {
      handleSubmit(); // Tự động nộp bài khi hết giờ
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timeLeft, isFinished]);

  const handleSelectAnswer = (questionId: number, choiceId: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: Number(choiceId),
    }));
  };

  const handleSubmit = async () => {
    if (isSubmitting || isFinished) return;

    // Validate if all questions are answered (optional, but good for UX)
    const answeredCount = Object.keys(answers).length;
    const totalCount = exam?.questions?.length || 0;

    if (timeLeft !== 0 && answeredCount < totalCount) {
      if (!window.confirm(`Bạn mới trả lời ${answeredCount}/${totalCount} câu hỏi. Bạn vẫn muốn nộp bài chứ?`)) {
        return;
      }
    }

    setIsSubmitting(true);
    const cookies = document.cookie.split("; ");
    const tokenCookie = cookies.find((row) => row.startsWith("token="));
    if (!tokenCookie) return;
    const t = tokenCookie.split("=")[1];

    try {
      const submissionData = Object.entries(answers).map(([qId, cId]) => ({
        question_id: Number(qId),
        choice_id: cId,
      }));

      const res = await submitExam(Number(id), submissionData, t);
      setResult(res);
      setIsFinished(true);
      if (timerRef.current) clearInterval(timerRef.current);
    } catch (err: any) {
      alert("Lỗi nộp bài: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent shadow-xl"></div>
          <p className="text-slate-500 font-medium animate-pulse text-sm">Đang bảo mật đề thi...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4">
        <XCircle className="h-16 w-16 text-rose-500 mb-4" />
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Lỗi truy cập hệ thống</h1>
        <p className="text-slate-500 mb-6 text-center max-w-md">{error}</p>
        <Button onClick={() => router.push("/student/dashboard")} className="bg-indigo-600">Quay lại Bảng điều khiển</Button>
      </div>
    );
  }

  if (isFinished) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 font-sans">
        <Card className="w-full max-w-lg border-none shadow-2xl shadow-indigo-200/50 bg-white p-8 text-center space-y-6 animate-in zoom-in duration-300">
          <div className="mx-auto w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-2">
            <CheckCircle2 className="w-12 h-12 text-emerald-500" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-black text-slate-900">Nộp bài thành công!</h1>
            <p className="text-slate-500 font-medium leading-relaxed">Kết quả nháp đã được lưu trữ an toàn trên máy chủ đám mây.</p>
          </div>

          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 mb-4">
            <div className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Điểm số ước tính</div>
            <div className="text-6xl font-black text-indigo-600">{result?.score?.toFixed(1) || "0.0"}</div>
            <div className="text-slate-400 font-medium text-sm mt-2">Tổng điểm tối đa: {result?.total_points || "10"}</div>
          </div>

          <Button onClick={() => router.push("/student/dashboard")} className="w-full h-12 bg-slate-900 hover:bg-indigo-600 text-white font-bold rounded-xl shadow-lg transition-all">
            Quay lại Bảng điều khiển
          </Button>
        </Card>
      </div>
    );
  }

  const currentQuestion = exam?.questions?.[currentIndex];
  const progress = ((currentIndex + 1) / (exam?.questions?.length || 1)) * 100;

  return (
    <div className="min-h-screen bg-slate-50/50 font-sans pb-10">

      {/* EXAM HEADER / STATUS BAR */}
      <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="mx-auto max-w-6xl px-4 flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              className="text-slate-500 hover:text-slate-900 -ml-2"
              onClick={() => {
                if (window.confirm("Bạn muốn thoát bài thi? Các câu trả lời chưa nộp sẽ bị mất!")) {
                  router.push("/student/dashboard");
                }
              }}
            >
              <ChevronLeft className="h-5 w-5 mr-1" />
              Thoát
            </Button>
            <div className="h-8 w-px bg-slate-100 mx-2 hidden sm:block"></div>
            <div className="hidden sm:block">
              <h2 className="text-sm font-bold text-slate-900 truncate max-w-[200px] md:max-w-md">{exam?.title}</h2>
              <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                <ShieldCheck className="h-3 w-3 text-emerald-500" />
                <span>Hệ thống giám sát bật</span>
              </div>
            </div>
          </div>

          <div className={`flex items-center gap-3 px-4 py-1.5 rounded-full border ${timeLeft !== null && timeLeft < 60 ? 'bg-rose-50 border-rose-200 animate-pulse' : 'bg-slate-50 border-slate-200'
            }`}>
            <Clock className={`h-4 w-4 ${timeLeft !== null && timeLeft < 60 ? 'text-rose-500' : 'text-slate-500'}`} />
            <span className={`text-lg font-black font-mono tracking-tighter ${timeLeft !== null && timeLeft < 60 ? 'text-rose-600' : 'text-slate-700'
              }`}>
              {timeLeft !== null ? formatTime(timeLeft) : "--:--"}
            </span>
          </div>

          <Button
            variant="default"
            size="sm"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg px-4 shadow-md shadow-indigo-100 transition-all"
          >
            <Send className="h-4 w-4 mr-2" />
            Nộp bài
          </Button>
        </div>

        {/* PROGRESS BAR */}
        <div className="w-full h-1 bg-slate-100 overflow-hidden">
          <div
            className="h-full bg-indigo-500 transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8 md:py-12 flex flex-col items-center">

        {/* QUESTION CARD */}
        <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black uppercase tracking-widest text-slate-400">Câu hỏi {currentIndex + 1} / {exam?.questions?.length || 0}</span>
            <Badge variant="secondary" className="bg-slate-100 text-slate-600 rounded-none px-2 font-mono">ID: {currentQuestion?.id}</Badge>
          </div>

          <Card className="border-slate-200 shadow-xl shadow-slate-200/20 bg-white rounded-3xl overflow-hidden min-h-[400px] flex flex-col">
            <CardHeader className="bg-slate-50/50 p-8 border-b border-slate-100">
              <CardTitle className="text-xl md:text-2xl font-bold text-slate-900 leading-snug">
                {currentQuestion?.content}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-8">
              <RadioGroup
                value={String(answers[currentQuestion?.id] || "")}
                onValueChange={(val) => handleSelectAnswer(currentQuestion?.id, val)}
                className="space-y-4"
              >
                {currentQuestion?.choices?.map((choice: any, index: number) => (
                  <label
                    key={choice.id}
                    className={`flex items-center justify-between p-5 rounded-2xl border-2 transition-all cursor-pointer group hover:border-indigo-200 ${answers[currentQuestion?.id] === choice.id
                        ? 'bg-indigo-50/50 border-indigo-500 ring-2 ring-indigo-50'
                        : 'bg-white border-slate-100 hover:bg-slate-50'
                      }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`h-8 w-8 rounded-full border-2 flex items-center justify-center font-bold text-sm transition-colors ${answers[currentQuestion?.id] === choice.id
                          ? 'bg-indigo-600 border-indigo-600 text-white'
                          : 'bg-white border-slate-200 text-slate-400 group-hover:border-indigo-400'
                        }`}>
                        {String.fromCharCode(65 + index)}
                      </div>
                      <span className={`text-base font-semibold ${answers[currentQuestion?.id] === choice.id ? 'text-indigo-900' : 'text-slate-700'
                        }`}>{choice.content}</span>
                    </div>
                    <RadioGroupItem value={String(choice.id)} className="sr-only" />
                  </label>
                ))}
              </RadioGroup>
            </CardContent>
            <CardFooter className="bg-slate-50 p-4 flex justify-between items-center border-t border-slate-100">
              <Button
                variant="ghost"
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex(prev => prev - 1)}
                className="rounded-xl font-bold text-slate-500 hover:text-indigo-600"
              >
                <ChevronLeft className="h-5 w-5 mr-1" />
                Quay lại
              </Button>

              <div className="flex gap-2">
                {exam?.questions.map((_: any, idx: number) => (
                  <div
                    key={idx}
                    className={`h-1.5 w-1.5 rounded-full transition-all duration-300 ${idx === currentIndex ? 'w-6 bg-indigo-600' : answers[exam?.questions[idx]?.id] ? 'bg-indigo-300' : 'bg-slate-200'
                      }`}
                  />
                ))}
              </div>

              <Button
                variant="ghost"
                disabled={currentIndex === (exam?.questions?.length || 1) - 1}
                onClick={() => setCurrentIndex(prev => prev + 1)}
                className="rounded-xl font-bold text-slate-500 hover:text-indigo-600"
              >
                Tiếp theo
                <ChevronRight className="h-5 w-5 ml-1" />
              </Button>
            </CardFooter>
          </Card>

          {/* QUICK NAVIGATION */}
          <div className="w-full bg-white p-6 rounded-2xl border border-slate-100 shadow-lg shadow-slate-100">
            <div className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
              <HelpCircle className="h-3 w-3" />
              Danh sách câu hỏi
            </div>
            <div className="flex flex-wrap gap-2">
              {exam?.questions.map((q: any, idx: number) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-9 w-10 rounded-lg text-xs font-bold transition-all border ${currentIndex === idx
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200'
                      : answers[q.id]
                        ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                        : 'bg-white border-slate-200 text-slate-400 hover:border-indigo-400 hover:text-indigo-400'
                    }`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
          </div>

          {/* ADVISORY SECTION */}
          <div className="flex items-center gap-4 p-4 rounded-xl bg-amber-50 border border-amber-100 border-dashed">
            <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
            <p className="text-xs text-amber-700 font-medium leading-relaxed">
              Hệ thống sẽ tự động nộp bài khi thời gian đếm ngược kết thúc. Vui lòng không làm mới trình duyệt (F5) trong quá trình làm bài.
            </p>
          </div>

        </div>

      </main>
    </div>
  );
}
