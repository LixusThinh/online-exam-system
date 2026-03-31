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
import { Loader2 } from "lucide-react";
import { createExam, getClasses } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

const formSchema = z.object({
  title: z.string().min(5, {
    message: "Tên đề thi phải có ít nhất 5 ký tự.",
  }),
  time_limit: z.union([z.string(), z.number()]).refine((val) => Number(val) >= 1, {
    message: "Thời gian làm bài phải lớn hơn 0.",
  }),
  class_id: z.string().optional(),
});

export default function CreateExamPage() {
  const router = useRouter();
  const { isAuthenticated, loading: isLoading, user } = useAuth();
  const [classes, setClasses] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated || (user?.role !== "teacher" && user?.role !== "admin")) {
      router.push("/login");
      return;
    }
    getClasses().then(data => {
      if (Array.isArray(data)) setClasses(data);
    }).catch(console.error);
  }, [isAuthenticated, isLoading, user, router]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      title: "",
      time_limit: 45,
      class_id: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setError("");
    setLoading(true);
    try {
      const payload = {
        title: values.title,
        time_limit: values.time_limit,
        class_id: values.class_id ? parseInt(values.class_id) : null,
      };

      const newExam = await createExam(payload);
      router.push(`/teacher/exams/${newExam.id}/questions`);
    } catch (err: any) {
      setError(err.message || "Tạo đề thi thất bại");
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
                    <FormLabel className="text-base font-semibold text-slate-700 dark:text-slate-300">Tên đề thi <span className="text-orange-500">*</span></FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ví dụ: Kiểm tra 15 phút Toán Hình"
                        className="h-12 border-teal-100 focus-visible:ring-teal-500 bg-teal-50/30 dark:bg-teal-950/20 dark:border-teal-900/50 transition-colors"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className="text-slate-500">
                      Nên đặt tên ngắn gọn, rõ ràng theo môn học hoặc theo lớp.
                    </FormDescription>
                    <FormMessage className="text-red-500" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="time_limit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-semibold text-slate-700 dark:text-slate-300">Thời lượng (Phút) <span className="text-orange-500">*</span></FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        className="h-12 border-teal-100 focus-visible:ring-teal-500 bg-teal-50/30 dark:bg-teal-950/20 dark:border-teal-900/50 transition-colors font-mono text-lg"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className="text-slate-500">
                      Hệ thống sẽ tự động thu bài khi hết số phút này tính từ lúc sinh viên bắt đầu.
                    </FormDescription>
                    <FormMessage className="text-red-500" />
                  </FormItem>
                )}
              />

              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-teal-50 dark:border-zinc-800 mt-8">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/teacher/dashboard")}
                  className="h-11 px-6 rounded-full border-teal-200 text-teal-800 hover:bg-teal-50 dark:border-teal-800 dark:text-teal-300 dark:hover:bg-teal-900/30"
                >
                  Hủy bỏ
                </Button>
                <Button
                  type="submit"
                  className="h-11 px-8 rounded-full bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 hover:-translate-y-0.5 transition-all font-semibold"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Đang khởi tạo...
                    </>
                  ) : (
                    "Tiếp tục Soạn câu hỏi"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
