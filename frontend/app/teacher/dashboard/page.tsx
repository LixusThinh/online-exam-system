"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
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
import { PlusCircle, FileText, Settings, Loader2, Eye, Trash2, Clock, HelpCircle, BookOpen } from "lucide-react";
import { getExams, deleteExam } from "@/lib/api";

export default function TeacherDashboard() {
  const router = useRouter();
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchExams = useCallback(async (token: string) => {
    try {
      const data = await getExams(token);
      setExams(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError("Không thể tải danh sách đề thi. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const cookies = document.cookie.split("; ");
    const tokenCookie = cookies.find((row) => row.startsWith("token="));
    if (tokenCookie) {
      const t = tokenCookie.split("=")[1];
      fetchExams(t);
    } else {
      router.push("/login");
    }
  }, [fetchExams, router]);

  const handleDeleteExam = async (id: number) => {
    const cookies = document.cookie.split("; ");
    const tokenCookie = cookies.find((row) => row.startsWith("token="));
    if (!tokenCookie) return;
    const t = tokenCookie.split("=")[1];
    
    if (window.confirm("Bạn có chắc chắn muốn xóa đề thi này không? Toàn bộ câu hỏi và kết quả cũng sẽ bị xóa vĩnh viễn!")) {
      try {
        await deleteExam(id, t);
        fetchExams(t); // Refresh list
      } catch (err: any) {
        alert("Xóa thất bại: " + err.message);
      }
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-teal-50/50 via-white to-white dark:from-teal-950/30 dark:via-zinc-950 dark:to-zinc-950 font-sans">
      
      {/* HEADER NAVBAR (Sticky Glass) */}
      <header className="sticky top-0 z-50 w-full border-b border-teal-100/50 dark:border-teal-900/50 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto flex h-16 items-center px-6 md:px-10 justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-teal-600 p-1.5 rounded-lg text-white shadow-sm">
              <BookOpen className="h-5 w-5" />
            </div>
            <span className="font-bold text-lg tracking-tight text-slate-800 dark:text-slate-200">Azota<span className="text-teal-600">Pro</span></span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-slate-500">Giáo viên</span>
            <div className="h-8 w-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold text-sm border border-teal-200">
              T
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full p-6 md:p-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* KHU VỰC CÔNG CỤ (QUICK ACTIONS) */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-teal-800 to-teal-500 dark:from-teal-400 dark:to-teal-200 mb-1">
                Bảng điều khiển
              </h1>
              <p className="text-slate-500 dark:text-slate-400">Quản lý kho đề thi và kết quả học tập của sinh viên.</p>
            </div>
            <Button 
              size="lg" 
              className="h-11 px-6 bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 hover:-translate-y-0.5 transition-all duration-300 rounded-full font-semibold"
              onClick={() => router.push("/teacher/exams/create")}
            >
              <PlusCircle className="mr-2 h-5 w-5" />
              Tạo Đề Thi Mới
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-teal-100/60 dark:border-teal-900/50 shadow-sm hover:shadow-md hover:border-teal-200 dark:hover:border-teal-800 transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide">Kho Đề Thi</CardTitle>
                <div className="p-2 bg-teal-100/50 dark:bg-teal-900/40 rounded-lg text-teal-600 dark:text-teal-400">
                  <FileText className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold font-mono text-slate-800 dark:text-slate-100">{loading ? "-" : exams.length}</div>
                <p className="text-xs text-slate-500 mt-1">Đề thi đang hoạt động</p>
              </CardContent>
            </Card>

            <Card className="border-teal-100/60 dark:border-teal-900/50 shadow-sm hover:shadow-md hover:border-teal-200 dark:hover:border-teal-800 transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide">Lớp Học</CardTitle>
                <div className="p-2 bg-emerald-100/50 dark:bg-emerald-900/40 rounded-lg text-emerald-600 dark:text-emerald-400">
                  <BookOpen className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold font-mono text-slate-800 dark:text-slate-100">1</div>
                <p className="text-xs text-slate-500 mt-1">Sĩ số: 45 học sinh</p>
              </CardContent>
            </Card>
            
            <Card className="border-teal-100/60 dark:border-teal-900/50 shadow-sm hover:shadow-md hover:border-teal-200 dark:hover:border-teal-800 transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide">Lượt Nộp Bài</CardTitle>
                <div className="p-2 bg-blue-100/50 dark:bg-blue-900/40 rounded-lg text-blue-600 dark:text-blue-400">
                  <Settings className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold font-mono text-slate-800 dark:text-slate-100">--</div>
                <p className="text-xs text-slate-500 mt-1">Hệ thống đang tổng hợp</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* KHU VỰC KHO ĐỀ THI (QUẢN LÝ DANH SÁCH) */}
        <Card className="shadow-md shadow-teal-900/5 border-teal-100/60 dark:border-teal-900/40 overflow-hidden ring-1 ring-black/5 dark:ring-white/5">
          <CardHeader className="bg-white dark:bg-zinc-900 border-b border-teal-50 dark:border-zinc-800/80 px-6 py-5">
            <CardTitle className="text-lg text-slate-800 dark:text-slate-100 flex items-center gap-2">
              Danh sách đề thi gần đây
            </CardTitle>
            <CardDescription>Click vào Xem Điểm để theo dõi tiến độ của học sinh trực tiếp.</CardDescription>
          </CardHeader>
          <CardContent className="p-0 bg-white dark:bg-zinc-950/50">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-24">
                <Loader2 className="h-10 w-10 animate-spin text-teal-600 mb-4" />
                <p className="text-teal-600/80 font-medium">Đang tải dữ liệu từ máy chủ...</p>
              </div>
            ) : error ? (
              <div className="text-center py-16 px-4">
                <div className="inline-flex items-center justify-center p-3 bg-red-100 rounded-full mb-4">
                  <Settings className="h-6 w-6 text-red-600" />
                </div>
                <p className="text-red-500 font-medium">{error}</p>
              </div>
            ) : exams.length === 0 ? (
              <div className="text-center py-24 px-4 border-2 border-dashed border-teal-100 dark:border-teal-900/50 m-6 rounded-2xl bg-teal-50/30 dark:bg-teal-950/20">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white dark:bg-zinc-900 shadow-sm border border-teal-100 dark:border-teal-800 mb-6">
                  <FileText className="h-8 w-8 text-teal-400" />
                </div>
                <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200">Kho đề thi trống</h3>
                <p className="text-slate-500 mt-2 mb-8 max-w-sm mx-auto">Bạn chưa tạo bất kỳ đề thi nào. Hãy bắt đầu xây dựng ngân hàng câu hỏi của riêng bạn.</p>
                <Button 
                  onClick={() => router.push("/teacher/exams/create")}
                  className="bg-teal-600 hover:bg-teal-700 text-white rounded-full px-6 shadow-md shadow-teal-600/20 hover:shadow-teal-600/40 hover:-translate-y-0.5 transition-all"
                >
                  <PlusCircle className="mr-2 h-4 w-4" /> Bắt đầu tạo mới
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-teal-50/50 dark:bg-zinc-900/80">
                    <TableRow className="hover:bg-transparent border-b-teal-100 dark:border-zinc-800">
                      <TableHead className="w-[60px] text-center font-semibold text-teal-800 dark:text-teal-400 text-xs uppercase tracking-wider">STT</TableHead>
                      <TableHead className="min-w-[250px] font-semibold text-teal-800 dark:text-teal-400 text-xs uppercase tracking-wider">Thông tin đề thi</TableHead>
                      <TableHead className="w-[160px] text-center font-semibold text-teal-800 dark:text-teal-400 text-xs uppercase tracking-wider">Thời lượng</TableHead>
                      <TableHead className="w-[140px] text-center font-semibold text-teal-800 dark:text-teal-400 text-xs uppercase tracking-wider">Câu hỏi</TableHead>
                      <TableHead className="text-right w-[180px] pr-6 font-semibold text-teal-800 dark:text-teal-400 text-xs uppercase tracking-wider">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {exams.map((exam, index) => (
                      <TableRow key={exam.id} className="hover:bg-teal-50/40 dark:hover:bg-teal-900/20 transition-colors border-b-slate-100 dark:border-zinc-800 group">
                        <TableCell className="text-center font-mono text-slate-400 dark:text-slate-500">
                          {(index + 1).toString().padStart(2, '0')}
                        </TableCell>
                        <TableCell>
                          <div className="font-semibold text-slate-800 dark:text-slate-200 group-hover:text-teal-700 dark:group-hover:text-teal-400 transition-colors">
                            {exam.title}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-slate-500 mt-1.5">
                            <span className="flex items-center gap-1">
                              <BookOpen className="w-3 h-3" />
                              {exam.class_id ? `Lớp ${exam.class_id}` : "Dùng chung"}
                            </span>
                            {exam.password && (
                              <span className="flex items-center gap-1 text-orange-600 bg-orange-50 px-1.5 rounded">
                                <HelpCircle className="w-3 h-3" /> Có Pass
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 dark:bg-teal-900/30 px-2.5 py-1 text-xs font-semibold text-teal-700 dark:text-teal-400 ring-1 ring-inset ring-teal-600/20">
                            <Clock className="w-3.5 h-3.5 opacity-70" />
                            {exam.time_limit} Phút
                          </span>
                        </TableCell>
                        <TableCell className="text-center font-mono text-slate-600 dark:text-slate-300">
                          {exam.questions?.length || 0}
                        </TableCell>
                        <TableCell className="text-right pr-6">
                          <div className="flex justify-end items-center gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                            <Button 
                              variant="outline" 
                              size="sm"
                              title="Xem Điểm"
                              className="text-blue-600 border-blue-200 hover:text-blue-700 hover:bg-blue-50 hover:border-blue-300 shadow-sm transition-all"
                              onClick={() => router.push(`/teacher/exams/${exam.id}/submissions`)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>

                            <Button 
                              variant="secondary" 
                              size="sm"
                              title="Quản lý Câu hỏi"
                              className="bg-teal-100 hover:bg-teal-200 text-teal-800 dark:bg-teal-900 dark:hover:bg-teal-800 dark:text-teal-100 shadow-sm transition-all font-medium"
                              onClick={() => router.push(`/teacher/exams/${exam.id}/questions`)}
                            >
                              <Settings className="mr-1.5 h-4 w-4" />
                              Câu hỏi
                            </Button>

                            <Button 
                              variant="ghost" 
                              size="sm"
                              title="Xóa Đề Thi"
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors"
                              onClick={() => handleDeleteExam(exam.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
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
    </div>
  );
}
