"use client";

import { useEffect, useState } from "react";
import { getMySubmissions } from "@/lib/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function SubmissionsPage() {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getMySubmissions();
        setSubmissions(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="container max-w-5xl mx-auto py-8 px-4 space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Lịch sử Bài làm</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center text-gray-500">Đang tải dữ liệu...</div>
          ) : submissions.length === 0 ? (
            <div className="py-8 text-center text-gray-500">Bạn chưa có bài nộp nào.</div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead>Mã Đề Thi</TableHead>
                    <TableHead>Ngày Nộp</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="text-right">Điểm Số</TableHead>
                    <TableHead className="text-center">Hành động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submissions.map((sub: any) => (
                    <TableRow key={sub.id}>
                      <TableCell className="font-medium">#{sub.quiz_id}</TableCell>
                      <TableCell>
                        {new Date(sub.finished_at).toLocaleString('vi-VN')}
                      </TableCell>
                      <TableCell>
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                          {sub.status || "Đã nộp"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-bold text-blue-600">
                        {sub.score}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button variant="outline" size="sm" className="text-xs">
                          Xem chi tiết
                        </Button>
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
  );
}
