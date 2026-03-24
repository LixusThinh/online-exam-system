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
import { BookOpen, ArrowLeft, PenTool, Loader2 } from "lucide-react";
import { createExam } from "@/lib/api";

const formSchema = z.object({
  title: z.string().min(5, {
    message: "Tên đề thi phải có ít nhất 5 ký tự.",
  }),
  time_limit: z.union([z.string(), z.number()]).refine((val) => Number(val) >= 1, {
    message: "Thời gian làm bài phải lớn hơn 0.",
  }),
});

export default function CreateExamPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const cookies = document.cookie.split("; ");
    const tokenCookie = cookies.find(row => row.startsWith("token="));
    if (tokenCookie) {
      setToken(tokenCookie.split("=")[1]);
    } else {
      router.push("/login");
    }
  }, [router]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      time_limit: 45,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!token) return;
    setError("");
    setLoading(true);
    try {
      const payload = {
        title: values.title,
        time_limit: Number(values.time_limit),
      };

      const newExam = await createExam(payload, token);
      router.push(`/teacher/exams/${newExam.id}/questions`);
    } catch (err: any) {
      setError(err.message || "Tạo đề thi thất bại");
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-teal-50/50 via-white to-white dark:from-teal-950/30 dark:via-zinc-950 dark:to-zinc-950 font-sans">

      {/* HEADER NAVBAR (Sticky Glass) */}
      <header className="sticky top-0 z-50 w-full border-b border-teal-100/50 dark:border-teal-900/50 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto flex h-16 items-center px-6 md:px-10 justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-slate-500 hover:text-teal-700 hover:bg-teal-50/50 -ml-2 transition-colors"
              onClick={() => router.push("/teacher/dashboard")}
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" /> Dashboard
            </Button>
            <div className="h-4 w-px bg-slate-200 dark:bg-zinc-800 mx-2"></div>
            <span className="font-semibold text-sm tracking-tight text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <PenTool className="w-4 h-4 text-teal-600" /> Tạo Mới
            </span>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-start justify-center p-6 md:p-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <Card className="w-full max-w-2xl shadow-xl shadow-teal-900/5 border-teal-100/60 dark:border-teal-900/40 relative overflow-hidden mt-4 md:mt-8">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
            <BookOpen className="w-64 h-64 text-teal-900" />
          </div>

          <CardHeader className="relative z-10 border-b border-teal-50 dark:border-zinc-800/80 bg-white/50 dark:bg-zinc-950/50 pb-8 pt-8 px-8">
            <CardTitle className="text-2xl md:text-3xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
              Khởi Tạo Đề Thi
            </CardTitle>
            <CardDescription className="text-base mt-2">
              Thiết lập thông tin cơ bản để bắt đầu xây dựng ngân hàng câu hỏi.
            </CardDescription>
          </CardHeader>

          <CardContent className="relative z-10 p-8 bg-white dark:bg-zinc-950/80">
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-medium border border-red-200 dark:border-red-800/50 flex items-center gap-2 animate-in slide-in-from-top-2">
                <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-red-500"></span>
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
      </main>
    </div>
  );
}
