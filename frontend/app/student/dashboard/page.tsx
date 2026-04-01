"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  CheckCircle2,
  Clock,
  PlusCircle,
  GraduationCap,
  PlayCircle,
  Trophy,
  AlertCircle,
  LogOut,
  Search,
  TrendingUp,
  Users,
  Sparkles,
  ArrowRight,
  ChevronRight,
  Zap,
  CalendarDays,
  Target,
} from "lucide-react";
import { getExams, getMySubmissions, joinClass, getClasses } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

interface ExamQuestion {
  points?: number | null;
}

interface ExamItem {
  id: number;
  title?: string;
  questions?: ExamQuestion[];
}

interface SubmissionItem {
  id: number;
  quiz_id?: number;
  exam_id?: number;
  score?: number | null;
  finished_at?: string | null;
  started_at?: string | null;
  submitted_at?: string | null;
}

const RECENT_RESULTS_DATE_FORMATTER = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function parseApiDate(value?: string | null): Date | null {
  if (!value) return null;

  const parsedDate = new Date(value);
  if (!Number.isNaN(parsedDate.getTime())) {
    return parsedDate;
  }

  const normalizedValue = value.includes(" ") ? value.replace(" ", "T") : value;
  const fallbackDate = new Date(normalizedValue);
  if (!Number.isNaN(fallbackDate.getTime())) {
    return fallbackDate;
  }

  return null;
}

function formatSubmissionDate(submission: SubmissionItem): string {
  const rawDate =
    submission.finished_at ?? submission.submitted_at ?? submission.started_at;
  const parsedDate = parseApiDate(rawDate);

  return parsedDate ? RECENT_RESULTS_DATE_FORMATTER.format(parsedDate) : "Chưa có ngày";
}

function getSubmissionExamId(submission: SubmissionItem): number | null {
  return submission.quiz_id ?? submission.exam_id ?? null;
}

function getExamTotalPoints(exam?: ExamItem): number | null {
  if (!exam?.questions?.length) return null;

  const totalPoints = exam.questions.reduce(
    (sum, question) => sum + (Number(question.points) || 0),
    0
  );

  return totalPoints > 0 ? totalPoints : null;
}

function getDisplayScore(submission: SubmissionItem, exam?: ExamItem): number {
  const rawScore = Number(submission.score);
  if (!Number.isFinite(rawScore) || rawScore < 0) {
    return 0;
  }

  const totalPoints = getExamTotalPoints(exam);
  if (!totalPoints) {
    return Number(rawScore.toFixed(1));
  }

  return Number(Math.min((rawScore / totalPoints) * 10, 10).toFixed(1));
}

export default function StudentDashboard() {
  const router = useRouter();
  const { logout, user, loading: authLoading } = useAuth();
  const [exams, setExams] = useState<ExamItem[]>([]);
  const [submissions, setSubmissions] = useState<SubmissionItem[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteCode, setInviteCode] = useState("");
  const [joinLoading, setJoinLoading] = useState(false);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [examsData, submissionsData, classesData] = await Promise.all([
        getExams(),
        getMySubmissions(),
        getClasses(),
      ]);
      setExams(Array.isArray(examsData) ? examsData : []);
      setSubmissions(Array.isArray(submissionsData) ? submissionsData : []);
      setClasses(Array.isArray(classesData) ? classesData : []);
    } catch (err: any) {
      setError(
        "Không thể kết nối máy chủ. Vui lòng kiểm tra lại đường truyền."
      );
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login");
      } else {
        fetchData();
      }
    }
  }, [user, authLoading, fetchData, router]);

  const handleJoinClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;

    setJoinLoading(true);

    try {
      await joinClass(inviteCode.trim());
      setInviteCode("");
      alert("Tham gia lớp học thành công!");
      fetchData();
    } catch (err: any) {
      alert(
        err.message || "Mã mời không chính xác hoặc bạn đã trong lớp này."
      );
    } finally {
      setJoinLoading(false);
    }
  };

  const pendingExams = exams.filter(
    (exam) =>
      !submissions.some(
        (submission) => getSubmissionExamId(submission) === exam.id
      )
  );
  const avgScore =
    submissions.length > 0
      ? (
          submissions.reduce((acc, curr) => {
            const relatedExam = exams.find(
              (exam) => exam.id === getSubmissionExamId(curr)
            );
            return acc + getDisplayScore(curr, relatedExam);
          }, 0) /
          submissions.length
        ).toFixed(1)
      : "0.0";

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#042F2E]">
        <div className="flex flex-col items-center gap-5">
          <div className="relative">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-[#0D9488] to-[#2DD4BF] flex items-center justify-center shadow-2xl shadow-teal-500/30">
              <GraduationCap className="w-7 h-7 text-white animate-pulse" />
            </div>
            <div className="absolute -inset-2 rounded-2xl border border-[#2DD4BF]/20 animate-ping" />
          </div>
          <div className="space-y-2 text-center">
            <p className="text-[#99F6E4] font-semibold text-sm">
              Đang tải dữ liệu học tập...
            </p>
            <div className="flex gap-1 justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-[#2DD4BF] animate-bounce [animation-delay:0ms]" />
              <div className="w-1.5 h-1.5 rounded-full bg-[#2DD4BF] animate-bounce [animation-delay:150ms]" />
              <div className="w-1.5 h-1.5 rounded-full bg-[#2DD4BF] animate-bounce [animation-delay:300ms]" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#042F2E] font-sans">
      {/* Background effects */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-[#0D9488]/8 blur-[120px]" />
        <div className="absolute bottom-[-15%] right-[-5%] w-[500px] h-[500px] rounded-full bg-[#2DD4BF]/6 blur-[100px]" />
        <div className="absolute top-[40%] right-[10%] w-[300px] h-[300px] rounded-full bg-[#F97316]/4 blur-[80px]" />
      </div>

      {/* Navbar */}
      <nav className="sticky top-0 z-50 w-full border-b border-white/[0.06] bg-[#042F2E]/80 backdrop-blur-2xl">
        <div className="mx-auto max-w-7xl flex h-16 items-center px-4 sm:px-6 lg:px-8 justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#0D9488] to-[#2DD4BF] shadow-lg shadow-teal-500/20">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-white hidden sm:block font-mono">
              SKY<span className="text-[#2DD4BF]">-EXAM</span>
            </span>
            <div className="hidden sm:block w-px h-6 bg-white/10 mx-1" />
            <span className="hidden sm:flex items-center gap-1.5 text-[#99F6E4]/40 text-xs font-semibold uppercase tracking-widest">
              <Sparkles className="w-3 h-3" />
              Student Portal
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => logout()}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-[#99F6E4]/50 hover:text-white hover:bg-white/[0.06] transition-all duration-200 text-xs font-semibold cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Đăng xuất</span>
            </button>
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-[#0D9488]/30 to-[#2DD4BF]/30 border border-white/10 flex items-center justify-center text-[#2DD4BF] font-bold text-xs">
              S
            </div>
          </div>
        </div>
      </nav>

      <main
        className={`relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 md:py-10 space-y-8 transition-all duration-700 ease-out ${
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
        }`}
      >
        {/* Hero + Join Class */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-stretch">
          {/* Hero text */}
          <div className="lg:col-span-3 flex flex-col justify-center space-y-5">
            <div>
              <p className="text-[#2DD4BF] text-xs font-bold uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                <Zap className="w-3.5 h-3.5" />
                Chào mừng trở lại
              </p>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white leading-[1.15]">
                Quản trị kiến thức
                <br />
                <span className="bg-gradient-to-r from-[#2DD4BF] to-[#0D9488] bg-clip-text text-transparent">
                  Trực tuyến 4.0
                </span>
              </h1>
            </div>
            <p className="text-[#99F6E4]/40 text-sm leading-relaxed font-medium max-w-md">
              Tham gia lớp học, hoàn thành bài thi và theo dõi kết quả học tập
              trong thời gian thực.
            </p>

            {/* Quick stats inline */}
            <div className="flex gap-3 pt-2">
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-xs font-semibold text-white/70">
                  {pendingExams.length} chưa nộp
                </span>
              </div>
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-xs font-semibold text-white/70">
                  {submissions.length} đã hoàn thành
                </span>
              </div>
            </div>
          </div>

          {/* Join class card */}
          <div className="lg:col-span-2">
            <div className="relative h-full rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl overflow-hidden group">
              <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-[#F97316] to-transparent" />
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#F97316]/10 border border-[#F97316]/20 flex items-center justify-center">
                    <PlusCircle className="w-5 h-5 text-[#F97316]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      Vào lớp học mới
                    </h3>
                    <p className="text-[10px] text-white/30 font-medium">
                      Nhập mã do giáo viên cung cấp
                    </p>
                  </div>
                </div>
                <form onSubmit={handleJoinClass} className="flex gap-2">
                  <div className="relative flex-1 group/input">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/20 group-focus-within/input:text-[#F97316] transition-colors" />
                    <input
                      id="join-class-code"
                      placeholder="VD: LOP12-A1"
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value)}
                      className="w-full h-11 pl-9 pr-4 rounded-xl bg-white/[0.05] border border-white/[0.08] text-white placeholder-white/15 text-sm font-mono font-medium tracking-wider transition-all duration-200 focus:outline-none focus:border-[#F97316]/40 focus:ring-2 focus:ring-[#F97316]/10"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={joinLoading || !inviteCode}
                    className="h-11 px-5 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-white font-bold text-sm shadow-lg shadow-orange-500/20 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1.5"
                  >
                    {joinLoading ? (
                      "..."
                    ) : (
                      <>
                        <ArrowRight className="w-4 h-4" />
                        <span className="hidden sm:inline">Tham gia</span>
                      </>
                    )}
                  </button>
                </form>
                <p className="text-[10px] text-white/15 font-medium text-center italic">
                  Không có mã mời? Liên hệ giáo viên chủ nhiệm.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              label: "Bài thi chưa nộp",
              value: pendingExams.length,
              icon: Clock,
              color: "amber",
              gradient: "from-amber-500/10 to-amber-500/5",
              iconBg: "bg-amber-500/10 border-amber-500/20",
              iconColor: "text-amber-400",
              valueColor: "text-amber-300",
            },
            {
              label: "Đã hoàn thành",
              value: submissions.length,
              icon: CheckCircle2,
              color: "emerald",
              gradient: "from-emerald-500/10 to-emerald-500/5",
              iconBg: "bg-emerald-500/10 border-emerald-500/20",
              iconColor: "text-emerald-400",
              valueColor: "text-emerald-300",
            },
            {
              label: "Điểm trung bình",
              value: avgScore,
              icon: Trophy,
              color: "teal",
              gradient: "from-[#2DD4BF]/10 to-[#2DD4BF]/5",
              iconBg: "bg-[#2DD4BF]/10 border-[#2DD4BF]/20",
              iconColor: "text-[#2DD4BF]",
              valueColor: "text-[#2DD4BF]",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="relative rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-sm overflow-hidden hover:border-white/[0.12] transition-all duration-300 group cursor-default"
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
              />
              <div className="relative p-5 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/30">
                    {stat.label}
                  </p>
                  <p className={`text-3xl font-black ${stat.valueColor}`}>
                    {stat.value}
                  </p>
                </div>
                <div
                  className={`w-11 h-11 rounded-xl ${stat.iconBg} border flex items-center justify-center`}
                >
                  <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Exams list */}
          <div className="xl:col-span-2 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#0D9488]/10 border border-[#0D9488]/20 flex items-center justify-center">
                  <BookOpen className="w-4 h-4 text-[#2DD4BF]" />
                </div>
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Kỳ thi Công Khai
                </h2>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/20">
                {exams.length} đề
              </span>
            </div>

            {exams.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-14 border border-dashed border-white/[0.08] rounded-2xl bg-white/[0.02] text-center">
                <div className="w-14 h-14 rounded-2xl bg-white/[0.04] flex items-center justify-center mb-4">
                  <AlertCircle className="h-7 w-7 text-white/15" />
                </div>
                <h3 className="text-sm font-bold text-white/50">
                  Chưa có đề thi
                </h3>
                <p className="text-white/20 text-xs max-w-xs mt-1.5 leading-relaxed">
                  Bạn chưa tham gia lớp học nào hoặc giáo viên chưa giao đề thi
                  mới.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {exams.map((exam) => {
                  const isSubmitted = submissions.some(
                    (submission) => getSubmissionExamId(submission) === exam.id
                  );
                  return (
                    <div
                      key={exam.id}
                      className="group relative rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-sm overflow-hidden hover:border-white/[0.12] transition-all duration-300 cursor-pointer"
                      onClick={() =>
                        !isSubmitted &&
                        router.push(`/student/exams/${exam.id}/take`)
                      }
                    >
                      {/* Top accent */}
                      <div
                        className={`h-[2px] w-full ${
                          isSubmitted
                            ? "bg-gradient-to-r from-transparent via-emerald-400 to-transparent"
                            : "bg-gradient-to-r from-transparent via-[#2DD4BF] to-transparent"
                        }`}
                      />

                      <div className="p-5 space-y-4">
                        <div className="flex justify-between items-start">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                              isSubmitted
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : "bg-[#2DD4BF]/10 text-[#2DD4BF] border border-[#2DD4BF]/20"
                            }`}
                          >
                            {isSubmitted ? (
                              <>
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Đã Nộp
                              </>
                            ) : (
                              <>
                                <Zap className="w-3 h-3 mr-1" />
                                Live
                              </>
                            )}
                          </span>
                          <div className="flex items-center gap-1 text-white/25 text-[11px] font-semibold">
                            <Clock className="h-3 w-3" />
                            <span>{exam.time_limit} phút</span>
                          </div>
                        </div>

                        <h3 className="text-sm font-bold text-white/80 line-clamp-2 leading-snug group-hover:text-white transition-colors duration-200">
                          {exam.title}
                        </h3>

                        <button
                          disabled={isSubmitted}
                          className={`w-full h-10 rounded-xl text-xs font-bold uppercase tracking-widest transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
                            isSubmitted
                              ? "bg-white/[0.04] text-white/20 cursor-not-allowed"
                              : "bg-gradient-to-r from-[#0D9488] to-[#0F766E] text-white hover:from-[#0F766E] hover:to-[#0D9488] shadow-lg shadow-teal-500/10 group-hover:shadow-teal-500/20"
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!isSubmitted)
                              router.push(`/student/exams/${exam.id}/take`);
                          }}
                        >
                          {isSubmitted ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" /> Kết thúc
                            </>
                          ) : (
                            <>
                              <PlayCircle className="w-3.5 h-3.5" /> Bắt đầu
                              ngay
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Classes section */}
            <div className="pt-6 space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <Users className="w-4 h-4 text-emerald-400" />
                  </div>
                  <h2 className="text-lg font-bold text-white tracking-tight">
                    Lớp của tôi
                  </h2>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/20">
                  {classes.length} lớp
                </span>
              </div>

              {classes.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-10 border border-dashed border-white/[0.08] rounded-2xl bg-white/[0.02] text-center">
                  <div className="w-14 h-14 rounded-2xl bg-white/[0.04] flex items-center justify-center mb-4">
                    <Users className="h-7 w-7 text-white/15" />
                  </div>
                  <h3 className="text-sm font-bold text-white/50">
                    Chưa tham gia lớp nào
                  </h3>
                  <p className="text-white/20 text-xs max-w-xs mt-1.5">
                    Gõ mã mời ở phía trên để tham gia các lớp học.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {classes.map((c: any) => (
                    <div
                      key={c.id}
                      className="group relative rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-sm overflow-hidden hover:border-emerald-500/20 transition-all duration-300 cursor-pointer"
                      onClick={() => router.push(`/student/classes/${c.id}`)}
                    >
                      <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-emerald-400 to-transparent" />
                      <div className="p-5 flex items-center justify-between">
                        <div className="space-y-1.5">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Lớp #{c.id}
                          </span>
                          <h3 className="text-sm font-bold text-white/80 group-hover:text-white transition-colors">
                            {c.name}
                          </h3>
                        </div>
                        <ChevronRight className="w-4 h-4 text-white/10 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all duration-200" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar - Recent results */}
          <div className="space-y-5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#F97316]/10 border border-[#F97316]/20 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-[#F97316]" />
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Kết quả gần đây
              </h2>
            </div>

            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-sm overflow-hidden">
              {submissions.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-10 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-white/[0.04] flex items-center justify-center mb-3">
                    <Target className="h-6 w-6 text-white/15" />
                  </div>
                  <p className="text-white/25 text-xs italic font-medium">
                    Chưa có kết quả nào.
                  </p>
                </div>
              ) : (
                <>
                  <div className="divide-y divide-white/[0.04]">
                    {submissions.slice(0, 8).map((submission) => {
                      const examId = getSubmissionExamId(submission);
                      const relatedExam = exams.find((exam) => exam.id === examId);
                      const displayScore = getDisplayScore(submission, relatedExam);

                      return (
                      <div
                        key={submission.id}
                        className="flex items-center justify-between px-5 py-3.5 hover:bg-white/[0.02] transition-colors duration-150 group"
                      >
                        <div className="space-y-0.5 min-w-0 flex-1">
                          <p className="text-sm font-semibold text-white/60 truncate group-hover:text-white/80 transition-colors">
                            {relatedExam?.title || (examId ? `Kỳ thi #${examId}` : "Kỳ thi chưa xác định")}
                          </p>
                          <div className="flex items-center gap-1.5 text-[10px] text-white/20 font-medium">
                            <CalendarDays className="w-3 h-3" />
                            <span>
                              {formatSubmissionDate(submission)}
                            </span>
                          </div>
                        </div>
                        <div
                          className={`text-xl font-black font-mono tabular-nums ${
                            displayScore >= 8
                              ? "text-emerald-400"
                              : displayScore >= 5
                              ? "text-amber-400"
                              : "text-rose-400"
                          }`}
                        >
                          {displayScore.toFixed(1)}
                        </div>
                      </div>
                    )})}
                  </div>
                  {submissions.length > 0 && (
                    <div className="p-4 border-t border-white/[0.04] flex justify-center">
                      <button
                        className="text-[10px] font-bold uppercase tracking-widest text-[#2DD4BF]/60 hover:text-[#2DD4BF] transition-colors cursor-pointer flex items-center gap-1.5"
                        onClick={() => router.push("/student/submissions")}
                      >
                        Xem tất cả
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Average score highlight card */}
            {submissions.length > 0 && (
              <div className="rounded-2xl border border-[#2DD4BF]/10 bg-gradient-to-br from-[#0D9488]/10 to-[#2DD4BF]/5 backdrop-blur-sm overflow-hidden">
                <div className="p-5 text-center space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#99F6E4]/40">
                    Điểm tổng kết
                  </p>
                  <p className="text-4xl font-black text-[#2DD4BF] font-mono tabular-nums">
                    {avgScore}
                  </p>
                  <p className="text-[10px] text-white/20 font-medium">
                    Trung bình từ {submissions.length} bài thi
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 mx-auto max-w-7xl px-4 py-10 border-t border-white/[0.04] mt-10">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-white/15 text-xs font-medium">
          <p>© 2026 SKY-EXAM Learning System.</p>
          <div className="flex gap-6 uppercase tracking-widest text-[10px] font-semibold">
            <a
              href="#"
              className="hover:text-[#2DD4BF] transition-colors cursor-pointer"
            >
              Điều khoản
            </a>
            <a
              href="#"
              className="hover:text-[#2DD4BF] transition-colors cursor-pointer"
            >
              Bảo mật
            </a>
            <a
              href="#"
              className="hover:text-[#2DD4BF] transition-colors cursor-pointer"
            >
              Hỗ trợ
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
