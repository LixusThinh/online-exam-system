"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { BookOpen, CheckCircle, Clock, CopyPlus, GraduationCap, Play, Settings, Trophy, AlertCircle } from "lucide-react";
import { getExams, getMySubmissions, joinClass } from "@/lib/api";

export default function StudentDashboard() {
  const router = useRouter();
  const [exams, setExams] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteCode, setInviteCode] = useState("");
  const [joinLoading, setJoinLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchData = useCallback(async (token: string) => {
    try {
      const [examsData, submissionsData] = await Promise.all([
        getExams(token),
        getMySubmissions(token)
      ]);
      setExams(Array.isArray(examsData) ? examsData : []);
      setSubmissions(Array.isArray(submissionsData) ? submissionsData : []);
    } catch (err: any) {
      setError("Không thể tải dữ liệu. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  }, []);

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

  const handleJoinClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;
    
    setJoinLoading(true);
    const cookies = document.cookie.split("; ");
    const tokenCookie = cookies.find((row) => row.startsWith("token="));
    if (!tokenCookie) return;
    const t = tokenCookie.split("=")[1];

    try {
      await joinClass(inviteCode, t);
      alert("Tham gia lớp học thành công!");
      setInviteCode("");
      fetchData(t); // Tải lại danh sách đề thi (bây giờ sẽ có đề mới từ lớp mới)
    } catch (err: any) {
      alert("Lỗi: " + err.message);
    } finally {
      setJoinLoading(false);
    }
  };

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-sky-50 dark:bg-sky-950">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-sky-500 border-t-transparent shadow-[0_0_15px_rgba(14,165,233,0.5)]"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-sky-50 dark:bg-sky-950/20 text-slate-800 dark:text-slate-100 font-sans">
      {/* HEADER NAVBAR (Sticky Glass) */}
      <header className="sticky top-0 z-50 w-full border-b border-sky-200 dark:border-sky-900/50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto flex h-16 items-center px-6 md:px-10 justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-sky-500 p-2 rounded-xl text-white shadow-md shadow-sky-500/20">
              <GraduationCap className="h-5 w-5" />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-800 dark:text-slate-200">Azota<span className="text-sky-500">Student</span></span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Học sinh</span>
            <div className="h-8 w-8 rounded-full bg-sky-100 flex items-center justify-center text-sky-700 font-bold text-sm border border-sky-200">
              S
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full p-6 md:p-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* WELCOME AREA & JOIN CLASS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-2 flex flex-col justify-center">
            <h1 className="text-3xl md:text-4xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-sky-600 to-indigo-500 dark:from-sky-400 dark:to-indigo-300">
              Sẵn sàng tỏa sáng chưa? ✨
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-lg">
              Tìm các bài thi mới nhất và theo dõi điểm số của bạn tại đây.
            </p>
          </div>
          
          <Card className="border-sky-200 dark:border-sky-800 shadow-lg shadow-sky-100 dark:shadow-none bg-white/50 dark:bg-slate-900/50 backdrop-blur overflow-hidden relative">
            <div className="absolute -right-4 -top-4 opacity-5">
              <CopyPlus className="w-32 h-32" />
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-sky-700 dark:text-sky-400">Vào Lớp Học Mới</CardTitle>
              <CardDescription>Nhập mã lớp để nhận đề thi</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleJoinClass} className="flex space-x-2">
                <Input 
                  placeholder="Mã Code (VD: LOP12A1)..." 
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  className="bg-white dark:bg-slate-900 border-sky-200 dark:border-sky-800 focus-visible:ring-sky-500 font-mono"
                />
                <Button type="submit" disabled={joinLoading || !inviteCode} className="bg-sky-500 hover:bg-sky-600 text-white shadow-md">
                  Vào
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* BÀI THI CỦA TÔI / MY EXAMS */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="h-6 w-6 text-indigo-500" />
            <h2 className="text-2xl font-bold">Bài Thi Của Bạn</h2>
          </div>
          
          {exams.length === 0 ? (
            <div className="p-8 border-2 border-dashed border-slate-300 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center text-center bg-white/30 dark:bg-slate-900/30">
              <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-full mb-4">
                <AlertCircle className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">Chưa có bài thi nào</h3>
              <p className="text-slate-500 dark:text-slate-400 max-w-sm mt-1">Hãy xin Giáo viên mã lớp và nhập vào ô "Vào Lớp Học Mới" ở phía trên để nhận đề.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {exams.map((exam) => {
                const isSubmitted = submissions.some(sub => sub.exam_id === exam.id);
                return (
                  <Card key={exam.id} className="group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
                    <div className={`h-2 w-full ${isSubmitted ? 'bg-emerald-500' : 'bg-gradient-to-r from-sky-400 to-indigo-500'}`} />
                    <CardHeader>
                      <div className="flex justify-between items-start mb-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${isSubmitted ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400'}`}>
                          {isSubmitted ? 'Đã Nộp' : 'Chưa Nộp'}
                        </span>
                        <span className="flex items-center text-slate-500 text-sm font-medium">
                          <Clock className="w-4 h-4 mr-1" /> {exam.time_limit} phút
                        </span>
                      </div>
                      <CardTitle className="text-xl line-clamp-2">{exam.title}</CardTitle>
                    </CardHeader>
                    <CardFooter className="pt-2 border-t border-slate-100 dark:border-slate-800 mt-2">
                      <Button 
                        disabled={isSubmitted} 
                        className={`w-full ${isSubmitted ? 'bg-slate-100 text-slate-400 dark:bg-slate-800' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-lg'}`}
                        onClick={() => !isSubmitted && router.push(`/student/exams/${exam.id}/take`)}
                      >
                        {isSubmitted ? (
                          <><CheckCircle className="mr-2 h-4 w-4" /> Hoàn thành</>
                        ) : (
                          <><Play className="mr-2 h-4 w-4" /> Vào thi ngay</>
                        )}
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* LỊCH SỬ NỘP BÀI / RECENT SUBMISSIONS */}
        <div className="mt-12">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="h-6 w-6 text-amber-500" />
            <h2 className="text-2xl font-bold">Lịch Sử Điểm Số</h2>
          </div>
          
          <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
                <TableRow>
                  <TableHead className="font-semibold text-slate-600 dark:text-slate-300">Bài Thi</TableHead>
                  <TableHead className="font-semibold text-slate-600 dark:text-slate-300">Thời Gian Nộp</TableHead>
                  <TableHead className="text-right font-semibold text-slate-600 dark:text-slate-300">Điểm Số</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8 text-slate-500">
                      Bạn chưa hoàn thành bài thi nào.
                    </TableCell>
                  </TableRow>
                ) : (
                  submissions.map((sub) => {
                    const exam = exams.find(e => e.id === sub.exam_id);
                    return (
                      <TableRow key={sub.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <TableCell className="font-medium text-slate-700 dark:text-slate-200">
                          {exam?.title || `Đề thi #${sub.exam_id}`}
                        </TableCell>
                        <TableCell className="text-slate-500">{new Date(sub.submitted_at).toLocaleString('vi-VN')}</TableCell>
                        <TableCell className="text-right">
                          <span className={`font-black text-lg ${
                            sub.score >= 8 ? 'text-emerald-500' : 
                            sub.score >= 5 ? 'text-amber-500' : 'text-rose-500'
                          }`}>
                            {sub.score?.toFixed(1) || '0.0'}
                          </span>
                          <span className="text-slate-400 text-sm ml-1">/ 10</span>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </Card>
        </div>

      </main>
    </div>
  );
}
