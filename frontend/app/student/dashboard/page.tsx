"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardFooter 
} from "@/components/ui/card";
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
import { Badge } from "@/components/ui/badge";
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
  LayoutDashboard,
  Search
} from "lucide-react";
import { getExams, getMySubmissions, joinClass, getClasses } from "@/lib/api";

export default function StudentDashboard() {
  const router = useRouter();
  const [exams, setExams] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteCode, setInviteCode] = useState("");
  const [joinLoading, setJoinLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchData = useCallback(async (token: string) => {
    try {
      setLoading(true);
      const [examsData, submissionsData, classesData] = await Promise.all([
        getExams(token),
        getMySubmissions(token),
        getClasses(token)
      ]);
      setExams(Array.isArray(examsData) ? examsData : []);
      setSubmissions(Array.isArray(submissionsData) ? submissionsData : []);
      setClasses(Array.isArray(classesData) ? classesData : []);
    } catch (err: any) {
      setError("Không thể kết nối máy chủ. Vui lòng kiểm tra lại đường truyền.");
      console.error(err);
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
      await joinClass(inviteCode.trim(), t);
      setInviteCode("");
      alert("Tham gia lớp học thành công!");
      fetchData(t);
    } catch (err: any) {
      alert(err.message || "Mã mời không chính xác hoặc bạn đã trong lớp này.");
    } finally {
      setJoinLoading(false);
    }
  };

  const logout = () => {
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT";
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent shadow-indigo-500/20 shadow-xl"></div>
          <p className="text-slate-500 font-medium animate-pulse text-sm">Đang tải dữ liệu học tập...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 selection:bg-indigo-100 selection:text-indigo-900 font-sans">
      
      {/* PROFESSIONAL NAVBAR */}
      <nav className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/70 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl flex h-16 items-center px-4 sm:px-6 lg:px-8 justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 shadow-lg shadow-indigo-200">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900 border-r border-slate-200 pr-4 mr-4 hidden sm:block">
              SKY<span className="text-indigo-600">-EXAM</span>
            </span>
            <div className="flex items-center gap-1 text-slate-500 text-sm font-medium">
              <LayoutDashboard className="h-4 w-4" />
              <span>Bảng điều khiển</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" className="text-slate-500 hover:text-slate-900 transition-colors" onClick={logout}>
              <LogOut className="h-4 w-4 mr-2" />
              Đăng xuất
            </Button>
            <div className="h-8 w-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-indigo-700 font-bold text-xs ring-2 ring-white">
              S
            </div>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-10">
        
        {/* HERO SECTION / QUICK JOIN */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-4">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900">
                Lớp học <span className="text-indigo-600">Trực tuyến</span> 
                <br/>Quản trị kiến thức 4.0
            </h1>
            <p className="max-w-xl text-lg text-slate-500 leading-relaxed font-medium">
                Tham gia các lớp học của giáo viên để nhận đề thi, theo dõi điểm số và rèn luyện kỹ năng mỗi ngày.
            </p>
          </div>
          
          <div className="lg:col-span-5">
            <Card className="border-none shadow-2xl shadow-indigo-200/50 bg-white overflow-hidden relative">
              <div className="absolute top-0 right-0 p-8 opacity-5 text-indigo-600 pointer-events-none">
                <PlusCircle className="w-32 h-32" />
              </div>
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-bold text-slate-900">Vào lớp học mới</CardTitle>
                <CardDescription>Nhập mã tham gia do giáo viên cung cấp</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleJoinClass} className="flex gap-2">
                  <div className="relative flex-1 group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    <Input 
                      placeholder="VD: LOP12-A1" 
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value)}
                      className="pl-10 h-12 bg-slate-50 border-slate-200 focus-visible:ring-indigo-600 rounded-xl font-medium tracking-wider"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    disabled={joinLoading || !inviteCode} 
                    className="h-12 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 rounded-xl px-6 font-bold"
                  >
                    {joinLoading ? "..." : "Tham gia"}
                  </Button>
                </form>
              </CardContent>
              <CardFooter className="bg-slate-50/50 border-t border-slate-100 py-3 flex justify-center">
                <p className="text-xs text-slate-400 font-medium italic">Không có mã mời? Liên hệ giáo viên chủ nhiệm của bạn.</p>
              </CardFooter>
            </Card>
          </div>
        </div>

        {/* STATS SECTION */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-slate-200 shadow-sm bg-white overflow-hidden hover:border-indigo-200 transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                    <CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Bài thi chưa nộp</CardTitle>
                    <div className="p-2 bg-amber-50 rounded-lg"><Clock className="h-4 w-4 text-amber-500" /></div>
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold text-slate-900">{exams.filter(e => !submissions.some(s => s.exam_id === e.id)).length}</div>
                </CardContent>
            </Card>
            <Card className="border-slate-200 shadow-sm bg-white overflow-hidden hover:border-indigo-200 transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                    <CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Bài thi đã hoàn thành</CardTitle>
                    <div className="p-2 bg-emerald-50 rounded-lg"><CheckCircle2 className="h-4 w-4 text-emerald-500" /></div>
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold text-slate-900">{submissions.length}</div>
                </CardContent>
            </Card>
            <Card className="border-slate-200 shadow-sm bg-white overflow-hidden hover:border-indigo-200 transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                    <CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Điểm trung bình</CardTitle>
                    <div className="p-2 bg-indigo-50 rounded-lg"><Trophy className="h-4 w-4 text-indigo-500" /></div>
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold text-indigo-600">
                        {submissions.length > 0 ? (submissions.reduce((acc, curr) => acc + curr.score, 0) / submissions.length).toFixed(1) : "0.0"}
                    </div>
                </CardContent>
            </Card>
        </div>

        {/* LIST SECTION: TABS STYLE */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            
            {/* EXAM LIST (MAIN) */}
            <div className="xl:col-span-2 space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <BookOpen className="h-6 w-6 text-indigo-600" />
                        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Kỳ thi Công Khai</h2>
                    </div>
                </div>

                {exams.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-slate-200 rounded-2xl bg-white/50 text-center">
                        <AlertCircle className="h-12 w-12 text-slate-300 mb-4" />
                        <h3 className="text-lg font-bold text-slate-800">Trống rỗng_</h3>
                        <p className="text-slate-500 max-w-xs mt-1">Bạn chưa tham gia lớp học nào hoặc giáo viên chưa giao đề thi mới.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {exams.map((exam) => {
                            const isSubmitted = submissions.some(s => s.exam_id === exam.id);
                            return (
                                <Card key={exam.id} className="group relative border-slate-200 hover:border-indigo-400 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300 cursor-pointer overflow-hidden rounded-2xl bg-white">
                                    <div className={`absolute top-0 right-0 h-1.5 w-full ${isSubmitted ? 'bg-emerald-500' : 'bg-indigo-500'}`} />
                                    <CardHeader className="pb-3">
                                        <div className="flex justify-between items-start mb-3">
                                            <Badge variant={isSubmitted ? "outline" : "default"} className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${isSubmitted ? 'border-emerald-200 text-emerald-600 bg-emerald-50' : 'bg-indigo-600 text-white'}`}>
                                                {isSubmitted ? "Đã Nộp" : "Live"}
                                            </Badge>
                                            <div className="flex items-center text-slate-400 text-xs font-semibold">
                                                <Clock className="h-3 w-3 mr-1" />
                                                <span>{exam.time_limit} phút</span>
                                            </div>
                                        </div>
                                        <CardTitle className="text-lg font-bold text-slate-800 line-clamp-2 leading-snug group-hover:text-indigo-600 transition-colors">
                                            {exam.title}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardFooter className="pt-2">
                                        <Button 
                                            disabled={isSubmitted} 
                                            variant={isSubmitted ? "secondary" : "default"}
                                            className={`w-full h-10 rounded-xl font-bold text-xs uppercase tracking-widest ${!isSubmitted ? 'bg-slate-900 border-none hover:bg-indigo-600 shadow-md transform group-hover:scale-[1.02] transition-all' : ''}`}
                                            onClick={() => !isSubmitted && router.push(`/student/exams/${exam.id}/take`)}
                                        >
                                            {isSubmitted ? (
                                                <><CheckCircle2 className="mr-2 h-4 w-4" /> Kết thúc</>
                                            ) : (
                                                <><PlayCircle className="mr-2 h-4 w-4" /> Bắt đầu ngay</>
                                            )}
                                        </Button>
                                    </CardFooter>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>
            
            {/* CLASSES LIST SECTION */}
            <div className="xl:col-span-2 space-y-6 pt-4 border-t border-slate-100 mt-8">
                <div className="flex items-center gap-2">
                    <GraduationCap className="h-6 w-6 text-emerald-600" />
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Lớp của tôi</h2>
                </div>
                
                {classes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-slate-200 rounded-2xl bg-white/50 text-center">
                        <AlertCircle className="h-12 w-12 text-slate-300 mb-4" />
                        <h3 className="text-lg font-bold text-slate-800">Chưa tham gia lớp nào</h3>
                        <p className="text-slate-500 max-w-xs mt-1">Gõ mã mời ở phía trên để tham gia các lớp học.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {classes.map((c: any) => (
                            <Card key={c.id} className="group relative border-slate-200 hover:border-emerald-400 hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-300 cursor-pointer overflow-hidden rounded-2xl bg-white" onClick={() => router.push(`/student/classes/${c.id}`)}>
                                <div className="absolute top-0 right-0 h-1.5 w-full bg-emerald-500" />
                                <CardHeader className="pb-4 pt-6">
                                    <Badge variant="outline" className="w-max rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border-emerald-200 text-emerald-600 bg-emerald-50 mb-3">
                                        Lớp Học #{c.id}
                                    </Badge>
                                    <CardTitle className="text-xl font-bold text-slate-800 line-clamp-2 leading-snug group-hover:text-emerald-600 transition-colors">
                                        {c.name}
                                    </CardTitle>
                                </CardHeader>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* SUBMISSION HISTORY (SIDEBAR) */}
            <div className="space-y-6">
                <div className="flex items-center gap-2">
                    <Trophy className="h-6 w-6 text-indigo-600" />
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Kết quả gần đây</h2>
                </div>
                
                <Card className="border-slate-200 shadow-sm bg-white overflow-hidden rounded-2xl">
                    <Table>
                        <TableHeader className="bg-slate-50/50">
                            <TableRow className="border-slate-100 hover:bg-transparent">
                                <TableHead className="font-bold text-slate-600 uppercase text-[10px] tracking-widest">Kỳ thi</TableHead>
                                <TableHead className="text-right font-bold text-slate-600 uppercase text-[10px] tracking-widest">Điểm</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {submissions.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={2} className="h-32 text-center text-slate-400 text-xs italic">Chưa có kết quả.</TableCell>
                                </TableRow>
                            ) : (
                                submissions.map((sub, i) => (
                                    <TableRow key={sub.id} className="border-slate-50 hover:bg-slate-50/50 transition-colors group">
                                        <TableCell>
                                            <div className="font-semibold text-slate-700 text-sm truncate max-w-[150px]">{sub.exam_id}</div>
                                            <div className="text-[10px] text-slate-400 mt-0.5">{new Date(sub.submitted_at).toLocaleDateString("vi-VN")}</div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className={`text-lg font-black ${
                                                sub.score >= 8 ? "text-emerald-500" : sub.score >= 5 ? "text-amber-500" : "text-rose-500"
                                            }`}>
                                                {sub.score?.toFixed(1) || "0.0"}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                    {submissions.length > 0 && (
                        <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex justify-center">
                             <Button variant="link" size="sm" className="text-xs text-indigo-600 font-bold uppercase tracking-widest decoration-2" onClick={() => router.push("/student/submissions")}>Xem tất cả</Button>
                        </div>
                    )}
                </Card>
            </div>

        </div>
      </main>

      <footer className="mx-auto max-w-7xl px-4 py-12 border-t border-slate-200 mt-12">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-slate-400 text-sm font-medium">
            <p>© 2026 SKY-EXAM Learning System.</p>
            <div className="flex gap-6 uppercase tracking-widest text-[10px]">
                <a href="#" className="hover:text-indigo-600 transition-colors">Điều khoản</a>
                <a href="#" className="hover:text-indigo-600 transition-colors">Bảo mật</a>
                <a href="#" className="hover:text-indigo-600 transition-colors">Hỗ trợ</a>
            </div>
        </div>
      </footer>

    </div>
  );
}
