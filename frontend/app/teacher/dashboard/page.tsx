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
  Clock,
  Activity,
  Bell,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";
import { getExams, deleteExam, getClasses, createClass } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

export default function TeacherDashboard() {
  const router = useRouter();
  const { logout, user, loading: authLoading } = useAuth();
  const [exams, setExams] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newClassName, setNewClassName] = useState("");
  const [isCreatingClass, setIsCreatingClass] = useState(false);
  const [error, setError] = useState("");
  const [liveEvents, setLiveEvents] = useState<{ id: number, message: string, type: string }[]>([]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [examsData, classesData] = await Promise.all([
        getExams(),
        getClasses()
      ]);
      setExams(Array.isArray(examsData) ? examsData : []);
      setClasses(Array.isArray(classesData) ? classesData : []);
    } catch (err: any) {
      setError("Không thể tải dữ liệu. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login");
      } else if (user.role !== "teacher" && user.role !== "admin") {
        router.push("/login");
      } else {
        fetchData();
      }
    }
  }, [user, authLoading, fetchData, router]);

  // LIVE MONITORING WEBSOCKET (Anti-Cheat integration)
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!isAuthenticated || !user) return;

    const wsUrl = `ws://localhost:8000/ws/anti-cheat/global`;
    const ws = new WebSocket(wsUrl);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const msg = data.message || "Phát hiện hoạt động mới!";
        setLiveEvents(prev => [{
          id: Date.now(),
          message: msg,
          type: data.type || "info"
        }, ...prev].slice(0, 5));
      } catch (e) {
        if (event.data.includes("Cheat")) {
          setLiveEvents(prev => [{
            id: Date.now(),
            message: "⚠️ " + event.data,
            type: "warning"
          }, ...prev].slice(0, 5));
        }
      }
    };

    ws.onerror = () => {
      console.warn("[WS] Global monitoring connection failed");
    };

    return () => ws.close();
  }, []);

  const handleCreateClass = async () => {
    if (!newClassName.trim()) return;

    try {
      setIsCreatingClass(true);
      await createClass({ name: newClassName.trim() });
      setNewClassName("");
      fetchData();
    } catch (err: any) {
      alert("Tạo lớp thất bại: " + err.message);
    } finally {
      setIsCreatingClass(false);
    }
  };

  const handleDeleteExam = async (id: number) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa đề thi này không? Toàn bộ câu hỏi và kết quả cũng sẽ bị xóa vĩnh viễn!")) {
      try {
        await deleteExam(id);
        fetchData();
      } catch (err: any) {
        alert("Xóa thất bại: " + err.message);
      }
    }
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
              SKY<span className="text-blue-600">-EXAM</span>
            </span>
            <div className="flex items-center gap-1 text-slate-500 text-sm font-medium">
              <LayoutDashboard className="h-4 w-4" />
              <span>Bảng Điều Khiển Giáo Viên</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" className="text-slate-500 hover:text-rose-600 transition-colors" onClick={() => logout()}>
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

        {/* STATS SECTION - ĐÃ SỬA */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* 1. Tổng số đề thi */}
          <Card
            className="border-slate-200 shadow-sm bg-white hover:border-blue-300 hover:shadow-md transition-all duration-300 cursor-pointer group"
            onClick={() => router.push("/teacher/exams")}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tổng số Đề Thi</CardTitle>
              <div className="p-2 bg-blue-50 rounded-lg group-hover:scale-110 transition-transform">
                <FileText className="h-4 w-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-slate-900">{loading ? "..." : exams.length}</div>
              <div className="mt-2 flex items-center text-[10px] font-bold text-blue-600 tracking-tighter uppercase">
                <span>Lưu trữ hệ thống</span>
                <ChevronRight className="h-3 w-3 ml-1 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </CardContent>
          </Card>

          {/* 2. Lớp học đang quản lý */}
          <Card
            className="border-slate-200 shadow-sm bg-white hover:border-emerald-300 hover:shadow-md transition-all duration-300 cursor-pointer group"
            onClick={() => router.push("/teacher/classes")}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-widest">Lớp Học Đang Quản Lý</CardTitle>
              <div className="p-2 bg-emerald-50 rounded-lg group-hover:scale-110 transition-transform">
                <Users className="h-4 w-4 text-emerald-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-slate-900">{loading ? "..." : classes.length}</div>
              <div className="mt-2 flex items-center text-[10px] font-bold text-emerald-600 tracking-tighter uppercase">
                <span>Đang hoạt động</span>
                <ChevronRight className="h-3 w-3 ml-1 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </CardContent>
          </Card>

          {/* 3. Giám sát trực tuyến */}
          <Card
            className="border-slate-200 shadow-sm bg-white hover:border-amber-300 hover:shadow-md transition-all duration-300 cursor-pointer group"
            onClick={() => router.push("/teacher/monitoring")}   // Bạn có thể đổi route này sau
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-widest">Giám Sát Trực Tuyến</CardTitle>
              <div className="p-2 bg-amber-50 rounded-lg group-hover:scale-110 transition-transform">
                <Activity className="h-4 w-4 text-amber-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-amber-600 flex items-center gap-2">
                Live
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                </span>
              </div>
              <div className="mt-2 flex items-center text-[10px] font-bold text-amber-600 tracking-tighter uppercase">
                <span>{liveEvents.length > 0 ? "Phát hiện hoạt động mới" : "Chưa có vi phạm mới"}</span>
                <ChevronRight className="h-3 w-3 ml-1 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* CLASS MANAGEMENT SECTION */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          <div className="xl:col-span-4">
            <Card className="border-slate-200 shadow-xl shadow-slate-200/20 bg-white rounded-3xl overflow-hidden h-full">
              <CardHeader className="bg-slate-50/50 p-6 border-b border-slate-100">
                <CardTitle className="text-xl font-bold text-slate-900">Tạo Lớp Mới</CardTitle>
                <CardDescription>Mã mời sẽ tự động được sinh ra.</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tên Lớp Học</label>
                  <input
                    type="text"
                    placeholder="VD: Lớp 12A1 - Toán Học"
                    value={newClassName}
                    onChange={(e) => setNewClassName(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl border border-slate-100 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-700"
                  />
                </div>
                <Button
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-100 transition-all"
                  onClick={handleCreateClass}
                  disabled={isCreatingClass || !newClassName.trim()}
                >
                  {isCreatingClass ? "Đang tạo..." : "Xác nhận tạo lớp"}
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="xl:col-span-8">
            <Card className="border-slate-200 shadow-xl shadow-slate-200/20 bg-white rounded-3xl overflow-hidden">
              <CardHeader className="bg-white p-6 border-b border-slate-100">
                <CardTitle className="text-xl font-bold text-slate-900">Danh Sách Lớp Học</CardTitle>
                <CardDescription>Cung cấp mã mời này cho học sinh để tham gia.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-slate-50/50">
                    <TableRow className="border-slate-100 hover:bg-transparent">
                      <TableHead className="w-[100px] text-center font-black uppercase text-[10px] tracking-widest text-slate-400">ID</TableHead>
                      <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-400">Tên Lớp</TableHead>
                      <TableHead className="w-[200px] text-center font-black uppercase text-[10px] tracking-widest text-slate-400">Mã Mời (Invite Code)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {classes.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="h-32 text-center text-slate-400 font-medium italic">Chưa có lớp học nào được tạo.</TableCell>
                      </TableRow>
                    ) : (
                      classes.map((c) => (
                        <TableRow key={c.id} className="border-slate-50 hover:bg-emerald-50/30 transition-colors group">
                          <TableCell className="text-center font-bold text-slate-300">#{c.id}</TableCell>
                          <TableCell className="font-bold text-slate-800">{c.name}</TableCell>
                          <TableCell className="text-center">
                            <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-600 px-3 py-1 rounded-lg border border-emerald-100 font-mono font-black text-sm group-hover:bg-emerald-600 group-hover:text-white transition-all cursor-copy" onClick={() => {
                              navigator.clipboard.writeText(c.invite_code);
                              alert("Đã copy mã mời: " + c.invite_code);
                            }}>
                              {c.invite_code}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
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
                              title="Xem kết quả thi"
                              className="h-9 px-3 gap-1 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white border-none shadow-none rounded-lg font-bold"
                              onClick={() => router.push(`/teacher/exams/${exam.id}/submissions`)}
                            >
                              <Eye className="h-4 w-4" />
                              <span className="hidden sm:inline">Xem kết quả thi</span>
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
            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em]">SKY-EXAM Giáo Viên Ecosystem • 2026</p>
          </CardFooter>
        </Card>
      </main>

      {/* FLOATING LIVE FEED (Anti-Cheat) */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
        {liveEvents.map((evt) => (
          <div
            key={evt.id}
            className={`shadow-2xl rounded-2xl px-5 py-4 min-w-[350px] max-w-sm pointer-events-auto animate-in slide-in-from-right duration-300 flex items-start gap-4 border-l-4 ${evt.type === 'warning'
              ? 'bg-white border-rose-500 text-slate-900 shadow-rose-100'
              : 'bg-white border-blue-500 text-slate-900 shadow-blue-100'
              }`}
          >
            <div className={`mt-0.5 p-2 rounded-full ${evt.type === 'warning' ? 'bg-rose-50 text-rose-500' : 'bg-blue-50 text-blue-500'}`}>
              {evt.type === 'warning' ? <AlertTriangle className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Cảnh báo hệ thống</p>
              <p className="text-sm font-bold leading-tight">{evt.message}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
