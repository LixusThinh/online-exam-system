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
import { Loader2, ArrowLeft, Trophy, Clock, XCircle, FileText } from "lucide-react";
import { getExamSubmissions, getExam } from "@/lib/api";

export default function SubmissionsPage() {
  const params = useParams();
  const router = useRouter();
  const examId = params.id as string;
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [exam, setExam] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat("vi-VN", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(d);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-zinc-950 p-6 md:p-10">
      <div className="max-w-6xl mx-auto w-full space-y-8">
        
        {/* HEADER INFORMATION */}
        {exam && (
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-zinc-800 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                Thống kê điểm: {exam.title}
              </h1>
              <p className="text-slate-500 mt-1 flex items-center gap-2">
                <Trophy className="w-4 h-4" /> Danh sách sinh viên đã nộp bài
              </p>
            </div>
            <Button variant="outline" onClick={() => router.push("/teacher/dashboard")}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Quay lại Dashboard
            </Button>
          </div>
        )}

        {/* LIST SUBMISSIONS */}
        <Card className="shadow-md border-gray-200 dark:border-zinc-800">
          <CardHeader className="bg-white dark:bg-zinc-900 border-b border-gray-100 dark:border-zinc-800 rounded-t-xl">
            <CardTitle className="text-xl">Kết quả thi</CardTitle>
            <CardDescription>Danh sách bài kiểm tra đã được chấm tự động trên hệ thống</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
                <p className="text-gray-500">Đang tải danh sách điểm số...</p>
              </div>
            ) : error ? (
              <div className="text-center py-12 text-red-500">{error}</div>
            ) : submissions.length === 0 ? (
              <div className="text-center py-16">
                <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Chưa có ai nộp bài</h3>
                <p className="text-gray-500 mt-1 mb-6">Hiện tại chưa có sinh viên nào hoàn thành đề thi này.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-50 dark:bg-zinc-900/50">
                    <TableRow>
                      <TableHead className="w-[50px] text-center">STT</TableHead>
                      <TableHead className="min-w-[200px]">Tên Học Sinh</TableHead>
                      <TableHead className="w-[200px] text-center">Ngày Nộp</TableHead>
                      <TableHead className="w-[120px] text-center font-black uppercase text-[10px] tracking-widest text-slate-400">Vi phạm (Cheat)</TableHead>
                      <TableHead className="text-right w-[150px] font-black uppercase text-[10px] tracking-widest text-slate-400">Điểm Số</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {submissions.map((sub, index) => (
                      <TableRow key={sub.id} className="hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-colors">
                        <TableCell className="text-center font-medium text-slate-500">{index + 1}</TableCell>
                        <TableCell>
                          <div className="font-semibold text-slate-900 dark:text-slate-100">
                            {sub.student?.full_name || sub.student?.username || "Ẩn danh"}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center text-sm text-slate-600 dark:text-slate-300">
                            <Clock className="w-4 h-4 mr-1.5 opacity-50" />
                            {formatDate(sub.finished_at)}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          {sub.status === "submitted" ? (
                            <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-semibold text-green-700 ring-1 ring-inset ring-green-600/20">
                              Đã nộp bài
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-yellow-50 px-2 py-1 text-xs font-semibold text-yellow-700 ring-1 ring-inset ring-yellow-600/20">
                              Đang làm
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <span className={`font-black text-lg ${sub.cheat_count > 0 ? 'text-rose-500 animate-pulse' : 'text-emerald-500'}`}>
                            {sub.cheat_count || 0}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          {sub.status === "submitted" ? (
                            <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                              {sub.score !== null ? sub.score : "?"} điểm
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
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
      </div>
    </div>
  );
}
