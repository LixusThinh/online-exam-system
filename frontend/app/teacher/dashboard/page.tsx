"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { PlusCircle, FileText, Settings, Loader2, Eye, Trash2 } from "lucide-react";
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
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-zinc-950 p-6 md:p-10">
      <div className="max-w-6xl mx-auto w-full space-y-8">
        
        {/* KHU VỰC CÔNG CỤ (QUICK ACTIONS) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                Teacher Dashboard
              </h1>
              <p className="text-slate-500 mt-1">Tổng quan và quản lý kho đề thi của bạn</p>
            </div>
            <Button 
              size="lg" 
              className="h-12 px-6 shadow-md bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => router.push("/teacher/exams/create")}
            >
              <PlusCircle className="mr-2 h-5 w-5" />
              Tạo Đề Thi Mới
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
            <Card className="shadow-sm border-blue-100 dark:border-zinc-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tổng số Đề Thi</CardTitle>
                <FileText className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{loading ? "-" : exams.length}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Đề thi được tạo trên hệ thống
                </p>
              </CardContent>
            </Card>
            <Card className="shadow-sm border-emerald-100 dark:border-zinc-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Lớp Học Đang Quản Lý</CardTitle>
                <Settings className="h-4 w-4 text-emerald-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">1</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Chức năng lớp học đang cập nhật
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* KHU VỰC KHO ĐỀ THI (QUẢN LÝ DANH SÁCH) */}
        <Card className="shadow-md border-gray-200 dark:border-zinc-800">
          <CardHeader className="bg-white dark:bg-zinc-900 border-b border-gray-100 dark:border-zinc-800 rounded-t-xl">
            <CardTitle className="text-xl">Danh sách Đề Thi</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
                <p className="text-gray-500">Đang tải danh sách đề thi...</p>
              </div>
            ) : error ? (
              <div className="text-center py-12 text-red-500">{error}</div>
            ) : exams.length === 0 ? (
              <div className="text-center py-16">
                <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Chưa có đề thi nào</h3>
                <p className="text-gray-500 mt-1 mb-6">Bạn chưa tạo đề thi nào trên hệ thống.</p>
                <Button onClick={() => router.push("/teacher/exams/create")}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Tạo ngay
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-50 dark:bg-zinc-900/50">
                    <TableRow>
                      <TableHead className="w-[50px] text-center">STT</TableHead>
                      <TableHead className="min-w-[200px]">Tên đề thi</TableHead>
                      <TableHead className="w-[150px] text-center">Thời gian thi</TableHead>
                      <TableHead className="w-[150px] text-center">Số lượng câu hỏi</TableHead>
                      <TableHead className="text-right w-[180px]">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {exams.map((exam, index) => (
                      <TableRow key={exam.id} className="hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors">
                        <TableCell className="text-center font-medium text-slate-500">{index + 1}</TableCell>
                        <TableCell>
                          <div className="font-semibold text-slate-900 dark:text-slate-100">{exam.title}</div>
                          <div className="text-xs text-slate-500 mt-1">
                            {exam.class_id ? `Lớp: ${exam.class_id}` : "Đề chung"} {exam.password ? "• Có mật khẩu" : ""}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700 ring-1 ring-inset ring-blue-700/10 dark:bg-blue-900/30 dark:text-blue-400 dark:ring-blue-400/20">
                            {exam.time_limit} Phút
                          </span>
                        </TableCell>
                        <TableCell className="text-center text-slate-600 dark:text-slate-300">
                          {exam.questions?.length || 0} câu
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end items-center gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              title="Xem Điểm"
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              onClick={() => router.push(`/teacher/exams/${exam.id}/submissions`)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>

                            <Button 
                              variant="secondary" 
                              size="sm"
                              title="Quản lý Câu hỏi"
                              className="bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-slate-100 shadow-sm"
                              onClick={() => router.push(`/teacher/exams/${exam.id}/questions`)}
                            >
                              <Settings className="mr-1.5 h-4 w-4" />
                              Câu hỏi
                            </Button>

                            <Button 
                              variant="ghost" 
                              size="sm"
                              title="Xóa Đề Thi"
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
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
      </div>
    </div>
  );
}
