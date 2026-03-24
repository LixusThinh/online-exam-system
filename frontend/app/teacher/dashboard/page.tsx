"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  PlusCircle, 
  FileText, 
  Settings, 
  Loader2, 
  Eye, 
  Trash2, 
  LayoutDashboard, 
  LogOut, 
  GraduationCap,
  Users,
  Award,
  ChevronRight,
  Clock
} from "lucide-react";
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

  const logout = () => {
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT";
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-slate-50/50 selection:bg-blue-100 selection:text-blue-900 font-sans">
      
      {/* PROFESSIONAL NAVBAR */}
      <nav className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/70 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl flex h-16 items-center px-4 sm:px-6 lg:px-8 justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 shadow-lg shadow-blue-200">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900 border-r border-slate-200 pr-4 mr-4 hidden sm:block">
              Azota<span className="text-blue-600">Pro</span>
            </span>
            <div className="flex items-center gap-1 text-slate-500 text-sm font-medium">
              <LayoutDashboard className="h-4 w-4" />
              <span>Bảng Điều Khiển Giáo Viên</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" className="text-slate-500 hover:text-rose-600 transition-colors" onClick={logout}>
              <LogOut className="h-4 w-4 mr-2" />
              Đăng xuất
            </Button>
            <div className="h-8 w-8 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-700 font-bold text-xs ring-2 ring-white">
              G
            </div>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-10">
        
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-black tracking-tight text-slate-900">
                Quản Lý <span className="text-blue-600">Đề Thi</span>
            </h1>
            <p className="text-slate-500 font-medium tracking-tight">Cổng thông tin dành cho giáo viên điều hành bài kiểm tra.</p>
          </div>
          <Button 
            size="lg" 
            className="h-12 px-8 shadow-xl shadow-blue-100 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all hover:scale-[1.02]"
            onClick={() => router.push("/teacher/exams/create")}
          >
            <PlusCircle className="mr-2 h-5 w-5" />
            Tạo Đề Thi Mới
          </Button>
        </div>

        {/* STATS SECTION */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-slate-200 shadow-sm bg-white hover:border-blue-200 transition-all duration-300 group">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                    <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tổng số Đề Thi</CardTitle>
                    <div className="p-2 bg-blue-50 rounded-lg group-hover:scale-110 transition-transform"><FileText className="h-4 w-4 text-blue-600" /></div>
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-black text-slate-900">{loading ? "..." : exams.length}</div>
                    <div className="mt-2 flex items-center text-[10px] font-bold text-blue-600 tracking-tighter uppercase">
                        <span>Lưu trữ hệ thống</span>
                        <ChevronRight className="h-3 w-3" />
                    </div>
                </CardContent>
            </Card>
            <Card className="border-slate-200 shadow-sm bg-white hover:border-emerald-200 transition-all duration-300 group">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                    <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-widest">Lớp Học Đang Quản Lý</CardTitle>
                    <div className="p-2 bg-emerald-50 rounded-lg group-hover:scale-110 transition-transform"><Users className="h-4 w-4 text-emerald-600" /></div>
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-black text-slate-900">1</div>
                    <div className="mt-2 flex items-center text-[10px] font-bold text-emerald-600 tracking-tighter uppercase">
                        <span>Đang hoạt động</span>
                        <ChevronRight className="h-3 w-3" />
                    </div>
                </CardContent>
            </Card>
            <Card className="border-slate-200 shadow-sm bg-white hover:border-amber-200 transition-all duration-300 group">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                    <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tỷ lệ nộp bài</CardTitle>
                    <div className="p-2 bg-amber-50 rounded-lg group-hover:scale-110 transition-transform"><Award className="h-4 w-4 text-amber-600" /></div>
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-black text-slate-900">45%</div>
                    <div className="mt-2 flex items-center text-[10px] font-bold text-amber-600 tracking-tighter uppercase">
                        <span>Tầm nhìn 24h</span>
                        <ChevronRight className="h-3 w-3" />
                    </div>
                </CardContent>
            </Card>
        </div>

        {/* LIST SECTION */}
        <Card className="border-slate-200 shadow-xl shadow-slate-200/20 bg-white rounded-3xl overflow-hidden">
            <CardHeader className="bg-white border-b border-slate-100 p-6 flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="text-xl font-bold text-slate-900">Danh Sách Đề Thi</CardTitle>
                    <CardDescription>Quản lý các bài thi đã xuất bản trên hệ thống.</CardDescription>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 p-8">
                        <Loader2 className="h-10 w-10 animate-spin text-blue-600 mb-4" />
                        <p className="text-slate-400 font-medium">Đang truy xuất dữ liệu từ đám mây...</p>
                    </div>
                ) : error ? (
                    <div className="text-center py-12 text-rose-500 font-bold p-8 bg-rose-50">{error}</div>
                ) : exams.length === 0 ? (
                    <div className="text-center py-24 p-8">
                        <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <FileText className="h-10 w-10 text-slate-200" />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 uppercase tracking-widest">Trống rỗng_</h3>
                        <p className="text-slate-400 mt-2 mb-8 font-medium">Bắt đầu bằng việc tạo một đề thi mới ngay bây giờ.</p>
                        <Button 
                            className="bg-blue-600 hover:bg-blue-700 font-bold rounded-xl"
                            onClick={() => router.push("/teacher/exams/create")}
                        >
                            <PlusCircle className="mr-2 h-4 w-4" /> Tạo ngay
                        </Button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-slate-50/50">
                                <TableRow className="border-slate-100 hover:bg-transparent">
                                    <TableHead className="w-[80px] text-center font-black uppercase text-[10px] tracking-widest text-slate-400">STT</TableHead>
                                    <TableHead className="min-w-[300px] font-black uppercase text-[10px] tracking-widest text-slate-400">Thông tin đề thi</TableHead>
                                    <TableHead className="w-[150px] text-center font-black uppercase text-[10px] tracking-widest text-slate-400">Thời lượng</TableHead>
                                    <TableHead className="w-[150px] text-center font-black uppercase text-[10px] tracking-widest text-slate-400">Số lượng</TableHead>
                                    <TableHead className="text-right w-[200px] px-6 font-black uppercase text-[10px] tracking-widest text-slate-400">Hành động</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {exams.map((exam, index) => (
                                    <TableRow key={exam.id} className="border-slate-50 hover:bg-blue-50/30 transition-colors group">
                                        <TableCell className="text-center font-bold text-slate-400">{index + 1}</TableCell>
                                        <TableCell>
                                            <div className="font-bold text-slate-800 text-base leading-tight group-hover:text-blue-600 transition-colors cursor-pointer" onClick={() => router.push(`/teacher/exams/${exam.id}/questions`)}>
                                                {exam.title}
                                            </div>
                                            <div className="flex items-center gap-2 mt-2">
                                                <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded font-black text-slate-400 uppercase tracking-tighter">
                                                    {exam.class_id ? `Lớp: ${exam.class_id}` : "Toàn trường"}
                                                </span>
                                                {exam.password && (
                                                    <span className="text-[10px] bg-amber-50 text-amber-500 px-1.5 py-0.5 rounded font-black uppercase tracking-tighter border border-amber-100">
                                                        Mật khẩu
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 ring-1 ring-inset ring-slate-200">
                                                <Clock className="h-3 w-3" />
                                                {exam.time_limit} Phút
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center font-bold text-slate-500">
                                            {exam.questions?.length || 0} câu hỏi
                                        </TableCell>
                                        <TableCell className="text-right px-6">
                                            <div className="flex justify-end items-center gap-2">
                                                <Button 
                                                    variant="secondary" 
                                                    size="sm"
                                                    title="Chấm Điểm & Nộp Bài"
                                                    className="h-9 w-9 p-0 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white border-none shadow-none rounded-lg"
                                                    onClick={() => router.push(`/teacher/exams/${exam.id}/submissions`)}
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>

                                                <Button 
                                                    variant="secondary" 
                                                    size="sm"
                                                    title="Quản lý câu hỏi"
                                                    className="h-9 w-9 p-0 bg-slate-100 text-slate-600 hover:bg-slate-900 hover:text-white border-none shadow-none rounded-lg"
                                                    onClick={() => router.push(`/teacher/exams/${exam.id}/questions`)}
                                                >
                                                    <Settings className="h-4 w-4" />
                                                </Button>

                                                <Button 
                                                    variant="ghost" 
                                                    size="sm"
                                                    title="Xóa Đề Thi"
                                                    className="h-9 w-9 p-0 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
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
            <CardFooter className="bg-slate-50/50 p-4 border-t border-slate-100 flex justify-center">
                <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em]">AzotaPro Giáo Viên Ecosystem • 2026</p>
            </CardFooter>
        </Card>
      </main>
    </div>
  );
}
