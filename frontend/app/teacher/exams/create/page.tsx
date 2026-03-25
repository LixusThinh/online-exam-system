"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createExam, getClasses } from "@/lib/api";

const formSchema = z.object({
  title: z.string().min(5, {
    message: "Tên đề thi phải có ít nhất 5 ký tự.",
  }),
  time_limit: z.coerce.number().min(1, {
    message: "Thời gian làm bài phải lớn hơn 0.",
  }),
  class_id: z.string().optional(),
});

export default function CreateExamPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [classes, setClasses] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Basic cookie parsing to find token
    const cookies = document.cookie.split("; ");
    const tokenCookie = cookies.find(row => row.startsWith("token="));
    if (tokenCookie) {
      const t = tokenCookie.split("=")[1];
      setToken(t);
      getClasses(t).then(data => {
        if (Array.isArray(data)) setClasses(data);
      }).catch(console.error);
    } else {
      router.push("/login");
    }
  }, [router]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema) as any, // <--- ĐẬP CÁI "as any" VÀO ĐÂY ĐỂ NÓ CÂM MÕM!
    defaultValues: {
      title: "",
      time_limit: 45,
      class_id: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!token) return;
    setError("");
    setLoading(true);
    try {
      // API expects class_id, but the form doesn't have it yet. 
      // Lão đại didn't mention it, let's pass null or 1 temporarily or omit it.
      // Depending on schemas.py, class_id is Optional[int] = None.
      const payload = {
        title: values.title,
        time_limit: values.time_limit,
        class_id: values.class_id ? parseInt(values.class_id) : null,
      };

      const newExam = await createExam(payload, token);
      // Redirect to questions management page
      router.push(`/teacher/exams/${newExam.id}/questions`);
    } catch (err: any) {
      setError(err.message || "Tạo đề thi thất bại");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen p-8 bg-gray-50 dark:bg-zinc-950 justify-center items-start">
      <Card className="w-full max-w-2xl shadow-xl mt-10">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Tạo Đề Thi Mới</CardTitle>
          <CardDescription>Điền thông tin cơ bản để khởi tạo đề thi</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-6 p-4 rounded-md bg-red-50 text-red-600 text-sm font-medium border border-red-200">
              {error}
            </div>
          )}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-semibold">Tên đề thi *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ví dụ: Kiểm tra 15 phút Toán Hình" className="h-12" {...field} />
                    </FormControl>
                    <FormDescription>
                      Nhập tên hoặc mô tả ngắn gọn cho đề thi.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="time_limit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-semibold">Thời gian làm bài (Phút) *</FormLabel>
                    <FormControl>
                      <Input type="number" className="h-12" {...field} />
                    </FormControl>
                    <FormDescription>
                      Thời gian tính bằng phút đếm ngược cho thí sinh.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="class_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-semibold">Giao cho Lớp học (Tùy chọn)</FormLabel>
                    <FormControl>
                      <select 
                        className="flex h-12 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        {...field}
                      >
                        <option value="">-- Tất cả học sinh (Công khai) --</option>
                        {classes.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </FormControl>
                    <FormDescription>
                      Nếu chọn lớp, chỉ học sinh lớp này mới thấy đề thi.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/teacher/dashboard")}
                  className="h-12 px-6"
                >
                  Hủy
                </Button>
                <Button type="submit" className="h-12 px-8" disabled={loading}>
                  {loading ? "Đang xử lý..." : "Lưu & Tiếp tục"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
