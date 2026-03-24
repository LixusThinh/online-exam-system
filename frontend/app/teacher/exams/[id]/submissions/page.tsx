"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Loader2, ArrowLeft, Trophy, Clock, FileText, CheckCircle2, UserCircle2, ArrowRight } from "lucide-react";
import { getExamSubmissions, getExam } from "@/lib/api";

export default function SubmissionsPage() {
  const params = useParams();
  const router = useRouter();
  const examId = params.id as string;
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [exam, setExam] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [liveEvents, setLiveEvents] = useState<{id: number, message: string, type: string}[]>([]);

  const fetchData = useCallback(async (token: string) => {
    try {
      const [examData, submissionsData] = await Promise.all([
        getExam(examId, token),
        getExamSubmissions(examId, token)
      ]);
      setExam(examData);
      setSubmissions(Array.isArray(submissionsData) ? submissionsData : []);
    } catch (err: any) {
      setError("Không thể tải dữ liệu điểm. Vui lòng kiểm tra lại.");
    } finally {
      setLoading(false);
    }
  }, [examId]);

  useEffect(() => {
    const cookies = document.cookie.split("; ");
    const tokenCookie = cookies.find((row) => row.startsWith("token="));
    if (tokenCookie) {
      const t = tokenCookie.split("=")[1];
      fetchData(t);
    } else {
      router.push("/login");
    }
  }, [fetchData, router]);

  useEffect(() => {
    if (!examId) return;
    const ws = new WebSocket(`ws://localhost:8000/ws/exams/${examId}/teacher`);
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "blur") {
          const msg = `⚠️ Thí sinh ${data.student_name || data.student_id} vừa thoát cửa sổ làm bài!`;
          setLiveEvents(prev => [{id: Date.now(), message: msg, type: "warning"}, ...prev].slice(0, 5));
        } else if (data.type === "submit") {
          const msg = `✅ Thí sinh ${data.student_name || data.student_id} vừa nộp bài!`;
          setLiveEvents(prev => [{id: Date.now(), message: msg, type: "success"}, ...prev].slice(0, 5));
          
          // Refetch data
          const tokenCookie = document.cookie.split("; ").find((row) => row.startsWith("token="));
          if (tokenCookie) fetchData(tokenCookie.split("=")[1]);
        }
      } catch (e) {}
    };

    return () => {
      ws.close();
    };
  }, [examId, fetchData]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat("vi-VN", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(d);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-teal-50/50 via-white to-white dark:from-teal-950/30 dark:via-zinc-950 dark:to-zinc-950 font-sans">
      
      {/* HEADER NAVBAR (Sticky Glass) */}
      <header className="sticky top-0 z-50 w-full border-b border-teal-100/50 dark:border-teal-900/50 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto flex h-16 items-center px-6 md:px-10 justify-between">
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-slate-500 hover:text-teal-700 hover:bg-teal-50/50 -ml-2"
              onClick={() => router.push("/teacher/dashboard")}
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" /> Dashboard
            </Button>
            <div className="h-4 w-px bg-slate-200 dark:bg-zinc-800 mx-2"></div>
            <span className="font-semibold text-sm tracking-tight text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-orange-500" /> Bảng Điểm
            </span>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full p-6 md:p-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* HEADER INFORMATION */}
        {exam && (
          <div className="bg-white dark:bg-zinc-900 p-8 rounded-2xl shadow-sm border border-teal-100/60 dark:border-teal-900/40 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
              <Trophy className="w-48 h-48 text-teal-600" />
            </div>
            <div className="relative z-10 flex flex-col md:flex-row md:justify-between md:items-end gap-6">
              <div>
                <p className="text-teal-600 dark:text-teal-400 font-semibold text-sm uppercase tracking-wider mb-2 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> Đề thi được chọn
                </p>
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-50 mb-2">
                  {exam.title}
                </h1>
                <p className="text-slate-500 flex items-center gap-3 text-sm font-medium">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    Thời gian: {exam.time_limit} Phút
                  </span>
                  <span>•</span>
                  <span>Tổng số thí sinh: {submissions.length}</span>
                </p>
              </div>
              <Button 
                className="bg-teal-600 hover:bg-teal-700 text-white rounded-full px-6 shadow-md shadow-teal-600/20 hover:shadow-teal-600/40 hover:-translate-y-0.5 transition-all w-full md:w-auto"
                onClick={() => window.print()}
              >
                In bảng điểm
              </Button>
            </div>
          </div>
        )}

        {/* LIST SUBMISSIONS */}
        <Card className="shadow-md shadow-teal-900/5 border-teal-100/60 dark:border-teal-900/40 overflow-hidden ring-1 ring-black/5 dark:ring-white/5">
          <CardHeader className="bg-white dark:bg-zinc-900 border-b border-teal-50 dark:border-zinc-800/80 px-6 py-5">
            <CardTitle className="text-lg text-slate-800 dark:text-slate-100 flex items-center gap-2">
              Lượt nộp bài chi tiết
            </CardTitle>
            <CardDescription>Theo dõi và đánh giá kết quả trực tiếp từ sinh viên.</CardDescription>
          </CardHeader>
          <CardContent className="p-0 bg-white dark:bg-zinc-950/50">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-24">
                <Loader2 className="h-10 w-10 animate-spin text-teal-600 mb-4" />
                <p className="text-teal-600/80 font-medium">Đang trích xuất bảng điểm...</p>
              </div>
            ) : error ? (
              <div className="text-center py-16 px-4">
                <div className="inline-flex items-center justify-center p-3 bg-red-100 rounded-full mb-4">
                  <Trophy className="h-6 w-6 text-red-600" />
                </div>
                <p className="text-red-500 font-medium">{error}</p>
              </div>
            ) : submissions.length === 0 ? (
              <div className="text-center py-24 px-4 border-2 border-dashed border-teal-100 dark:border-teal-900/50 m-6 rounded-2xl bg-teal-50/30 dark:bg-teal-950/20">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white dark:bg-zinc-900 shadow-sm border border-teal-100 dark:border-teal-800 mb-6 group hover:scale-105 transition-transform">
                  <UserCircle2 className="h-8 w-8 text-teal-400 group-hover:text-teal-500 transition-colors" />
                </div>
                <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200">Chưa có dữ liệu thi</h3>
                <p className="text-slate-500 mt-2 mb-2 max-w-sm mx-auto">Hiện tại chưa có sinh viên nào tham gia làm bài hoặc hoàn thành đề thi này.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-teal-50/50 dark:bg-zinc-900/80">
                    <TableRow className="hover:bg-transparent border-b-teal-100 dark:border-zinc-800">
                      <TableHead className="w-[60px] text-center font-semibold text-teal-800 dark:text-teal-400 text-xs uppercase tracking-wider">STT</TableHead>
                      <TableHead className="min-w-[250px] font-semibold text-teal-800 dark:text-teal-400 text-xs uppercase tracking-wider">Tên Học Sinh</TableHead>
                      <TableHead className="w-[200px] text-center font-semibold text-teal-800 dark:text-teal-400 text-xs uppercase tracking-wider">Thời Gian Nộp</TableHead>
                      <TableHead className="w-[150px] text-center font-semibold text-teal-800 dark:text-teal-400 text-xs uppercase tracking-wider">Trạng Thái</TableHead>
                      <TableHead className="text-right w-[150px] pr-8 font-semibold text-teal-800 dark:text-teal-400 text-xs uppercase tracking-wider">Điểm Số</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {submissions.map((sub, index) => (
                      <TableRow key={sub.id} className="hover:bg-teal-50/40 dark:hover:bg-teal-900/20 transition-colors border-b-slate-100 dark:border-zinc-800 group">
                        <TableCell className="text-center font-mono text-slate-400 dark:text-slate-500">
                          {(index + 1).toString().padStart(2, '0')}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-teal-100 dark:bg-teal-900/50 flex items-center justify-center text-teal-700 dark:text-teal-400 font-bold text-xs ring-1 ring-teal-200/50">
                              {(sub.student?.full_name || sub.student?.username || "A").charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-semibold text-slate-800 dark:text-slate-200 group-hover:text-teal-700 dark:group-hover:text-teal-400 transition-colors">
                                {sub.student?.full_name || sub.student?.username || "Ẩn danh"}
                              </div>
                              <div className="text-xs font-mono text-slate-400 mt-0.5">
                                UID: {sub.student?.id || "N/A"}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center text-sm font-medium text-slate-600 dark:text-slate-300">
                            <Clock className="w-3.5 h-3.5 mr-1.5 opacity-50" />
                            {formatDate(sub.finished_at)}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          {sub.status === "submitted" ? (
                            <span className="inline-flex items-center rounded-full bg-emerald-50 dark:bg-emerald-900/30 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 ring-1 ring-inset ring-emerald-600/20">
                              Đã nộp bài
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-orange-50 dark:bg-orange-900/30 px-2.5 py-1 text-xs font-semibold text-orange-700 dark:text-orange-400 ring-1 ring-inset ring-orange-600/20">
                              Đang làm
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right pr-8">
                          {sub.status === "submitted" ? (
                            <div className="inline-flex items-center gap-1.5 bg-gradient-to-r from-teal-600 to-teal-500 bg-clip-text text-transparent drop-shadow-sm">
                              <span className="text-2xl font-bold font-mono">
                                {sub.score !== null ? sub.score : "?"}
                              </span>
                              <span className="text-sm font-semibold text-teal-600/70">/ 10</span>
                            </div>
                          ) : (
                            <span className="text-slate-300 font-mono">- -</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* FLOATING NOTIFICATIONS (WebSockets Anti-Cheat) */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
        {liveEvents.map((evt) => (
          <div 
            key={evt.id} 
            className={`shadow-lg rounded-xl px-4 py-3 min-w-[320px] max-w-sm pointer-events-auto transition-transform ${
              evt.type === 'warning' ? 'bg-red-500 text-white' : 'bg-teal-600 text-white'
            }`}
          >
            <p className="text-sm font-medium">{evt.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
