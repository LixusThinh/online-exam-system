"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
  PlusCircle, FileText, Settings, Loader2, Eye, Trash2,
  ArrowLeft, Clock, Search
} from "lucide-react";
import { getExams, deleteExam } from "@/lib/api";

export default function TeacherExamsPage() {
  const router = useRouter();
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const getToken = () => {
    const c = document.cookie.split("; ").find((r) => r.startsWith("token="));
    return c ? c.split("=")[1] : null;
  };

  useEffect(() => {
    const token = getToken();
    if (!token) { router.push("/login"); return; }
    getExams(token).then((d) => setExams(Array.isArray(d) ? d : [])).finally(() => setLoading(false));
  }, [router]);

  const handleDelete = async (id: number) => {
    const token = getToken();
    if (!token) return;
    if (window.confirm("Xóa đề thi này? Toàn bộ câu hỏi và kết quả sẽ bị xóa vĩnh viễn!")) {
      await deleteExam(id, token);
      setExams((prev) => prev.filter((e) => e.id !== id));
    }
  };

  const filtered = exams.filter((e) =>
    e.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50/50 font-sans">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.push("/teacher/dashboard")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900">Quản Lý Đề Thi</h1>
              <p className="text-sm text-slate-500">Tổng cộng {exams.length} đề thi</p>
            </div>
          </div>
          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-100"
            onClick={() => router.push("/teacher/exams/create")}
          >
            <PlusCircle className="mr-2 h-4 w-4" /> Tạo Đề Thi Mới
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm kiếm đề thi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-700"
          />
        </div>

        {/* Table */}
        <Card className="border-slate-200 shadow-lg bg-white rounded-2xl overflow-hidden">
          <CardContent className="p-0">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="h-10 w-10 animate-spin text-blue-600 mb-4" />
                <p className="text-slate-400 font-medium">Đang tải...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-20">
                <FileText className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-slate-600">Không tìm thấy đề thi</h3>
                <p className="text-slate-400 mt-1">{search ? "Thử từ khóa khác." : "Bắt đầu bằng việc tạo đề thi mới."}</p>
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="w-[60px] text-center text-[10px] font-black uppercase tracking-widest text-slate-400">STT</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tên đề thi</TableHead>
                    <TableHead className="w-[120px] text-center text-[10px] font-black uppercase tracking-widest text-slate-400">Thời lượng</TableHead>
                    <TableHead className="w-[120px] text-center text-[10px] font-black uppercase tracking-widest text-slate-400">Câu hỏi</TableHead>
                    <TableHead className="w-[220px] text-right pr-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Hành động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((exam, i) => (
                    <TableRow key={exam.id} className="hover:bg-blue-50/30 transition-colors group">
                      <TableCell className="text-center font-bold text-slate-400">{i + 1}</TableCell>
                      <TableCell>
                        <div className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors cursor-pointer"
                          onClick={() => router.push(`/teacher/exams/${exam.id}/questions`)}>{exam.title}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded font-black text-slate-400 uppercase">
                            {exam.class_id ? `Lớp: ${exam.class_id}` : "Toàn trường"}
                          </span>
                          {exam.password && <span className="text-[10px] bg-amber-50 text-amber-500 px-1.5 py-0.5 rounded font-black border border-amber-100">Mật khẩu</span>}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                          <Clock className="h-3 w-3" />{exam.time_limit} Phút
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-bold text-slate-500">{exam.questions?.length || 0}</TableCell>
                      <TableCell className="text-right pr-6">
                        <div className="flex justify-end items-center gap-2">
                          <Button variant="secondary" size="sm" className="h-8 px-3 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg font-bold"
                            onClick={() => router.push(`/teacher/exams/${exam.id}/submissions`)}><Eye className="h-3.5 w-3.5 mr-1" />Kết quả</Button>
                          <Button variant="secondary" size="sm" className="h-8 w-8 p-0 bg-slate-100 text-slate-600 hover:bg-slate-900 hover:text-white rounded-lg"
                            onClick={() => router.push(`/teacher/exams/${exam.id}/questions`)}><Settings className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                            onClick={() => handleDelete(exam.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
          <CardFooter className="bg-slate-50/50 p-3 border-t border-slate-100 flex justify-center">
            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em]">SKY-EXAM • Quản lý Đề Thi</p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
