"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Trophy,
  Clock,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { getMySubmissions } from "@/lib/api";

export default function StudentSubmissionsPage() {
  const router = useRouter();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("token="))
      ?.split("=")[1];

    if (!token) {
      router.push("/login");
      return;
    }

    getMySubmissions(token)
      .then((data) => {
        setSubmissions(Array.isArray(data) ? data : []);
      })
      .catch(() => setSubmissions([]))
      .finally(() => setLoading(false));
  }, [router]);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/student/dashboard")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Lịch Sử Nộp Bài
            </h1>
            <p className="text-sm text-muted-foreground">
              Tổng cộng {submissions.length} bài đã nộp
            </p>
          </div>
        </div>

        {/* Content */}
        {submissions.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Trophy className="h-16 w-16 text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-semibold">Chưa có bài nộp nào</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Hãy tham gia lớp học và làm bài thi để xem kết quả tại đây.
              </p>
              <Button
                className="mt-4"
                onClick={() => router.push("/student/dashboard")}
              >
                Quay lại Dashboard
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Danh sách bài nộp</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">#</TableHead>
                    <TableHead>Bài thi (ID)</TableHead>
                    <TableHead>Điểm</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Gian lận</TableHead>
                    <TableHead>Thời gian bắt đầu</TableHead>
                    <TableHead>Thời gian nộp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submissions.map((sub, index) => (
                    <TableRow key={sub.id}>
                      <TableCell className="font-medium">
                        {index + 1}
                      </TableCell>
                      <TableCell>Bài thi #{sub.quiz_id}</TableCell>
                      <TableCell>
                        <span className="font-bold text-lg">
                          {sub.score != null ? sub.score : "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        {sub.status === "submitted" ||
                        sub.status === "SUBMITTED" ? (
                          <Badge
                            variant="default"
                            className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                          >
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Đã nộp
                          </Badge>
                        ) : (
                          <Badge
                            variant="secondary"
                            className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20"
                          >
                            <Clock className="h-3 w-3 mr-1" />
                            Đang làm
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {sub.cheat_count > 0 ? (
                          <Badge variant="destructive" className="gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            {sub.cheat_count} lần
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            0
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDate(sub.started_at)}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDate(sub.finished_at)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
