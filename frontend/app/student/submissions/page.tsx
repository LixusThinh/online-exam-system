"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getMySubmissions } from "@/lib/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Submission {
  id: number;
  quiz_id: number;
  score: number;
  status: string;
  started_at: string;
  finished_at: string;
  quiz?: {
    title: string;
    time_limit: number;
  };
}

const getToken = () => {
  const match = document.cookie.match(/(^| )token=([^;]+)/);
  return match ? match[2] : null;
};

export default function SubmissionsPage() {
  const router = useRouter();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const token = getToken();
        if (!token) {
          router.push("/login");
          return;
        }

        const data = await getMySubmissions(token);
        setSubmissions(data);
      } catch (err: any) {
        setError(err.message || "Không thể tải lịch sử làm bài.");
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Lịch sử Làm bài</h1>
            <p className="text-slate-500 mt-2 font-medium">Danh sách các bài thi bạn đã hoàn thành.</p>
          </div>
          <Button variant="outline" onClick={() => router.push("/student")} className="shadow-sm">
            Về trang chủ
          </Button>
        </div>

        <Card className="shadow-md border-0">
          <CardHeader className="bg-white border-b border-slate-100 rounded-t-xl pb-4">
            <CardTitle>Bảng Điểm Của Tôi</CardTitle>
            <CardDescription>Xem chi tiết điểm số và thời gian nộp bài của từng đề thi</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-10 text-center text-blue-600 font-medium animate-pulse">
                Đang tải dữ liệu...
              </div>
            ) : error ? (
              <div className="p-10 text-center text-red-500 font-medium">
                {error}
              </div>
            ) : submissions.length === 0 ? (
              <div className="p-10 text-center text-slate-500">
                Bạn chưa tham gia bài thi nào.
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="font-semibold text-slate-700 w-16 text-center">STT</TableHead>
                    <TableHead className="font-semibold text-slate-700">Mã Đề Thi</TableHead>
                    <TableHead className="font-semibold text-slate-700">Trạng Thái</TableHead>
                    <TableHead className="font-semibold text-slate-700 text-right">Điểm Số</TableHead>
                    <TableHead className="font-semibold text-slate-700 text-right">Ngày Nộp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submissions.map((sub, idx) => (
                    <TableRow key={sub.id} className="hover:bg-blue-50/50 transition-colors">
                      <TableCell className="font-medium text-center text-slate-500">{idx + 1}</TableCell>
                      <TableCell className="font-bold text-slate-900">Đề số #{sub.quiz_id}</TableCell>
                      <TableCell>
                        <span className={`px-3 py-1 text-xs font-bold rounded-full ${sub.status === "SUBMITTED"
                          ? "bg-green-100 text-green-700"
                          : "bg-amber-100 text-amber-700"
                          }`}>
                          {sub.status === "SUBMITTED" ? "Đã Nộp" : "Đang Làm"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-lg font-extrabold text-blue-600">{sub.score}</span> điểm
                      </TableCell>
                      <TableCell className="text-right text-slate-500 font-medium">
                        {sub.finished_at ? new Date(sub.finished_at).toLocaleString('vi-VN') : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
