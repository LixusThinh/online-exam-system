"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { getExams, submitExam } from "@/lib/api";
import { useAdvancedAntiCheat } from "@/hooks/useAdvancedAntiCheat";

export default function TakeExamPage() {
  const { id } = useParams();
  const router = useRouter();
  const [exam, setExam] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitting, setSubmitting] = useState(false);

  // Gắn Anti-Cheat
  useAdvancedAntiCheat(exam?.title || "Đề thi");

  useEffect(() => {
    const fetchExam = async () => {
      const cookies = document.cookie.split("; ");
      const tokenCookie = cookies.find((row) => row.startsWith("token="));
      if (!tokenCookie) {
        router.push("/login");
        return;
      }
      const token = tokenCookie.split("=")[1];

      try {
        const exams = await getExams(token);
        const currentExam = exams.find((e: any) => e.id === Number(id));
        setExam(currentExam);
      } catch (error) {
        console.error("Lỗi khi tải đề thi:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchExam();
  }, [id, router]);

  const handleSubmit = async () => {
    if (!window.confirm("Bạn có chắc chắn muốn nộp bài?")) return;

    setSubmitting(true);
    const cookies = document.cookie.split("; ");
    const tokenCookie = cookies.find((row) => row.startsWith("token="));
    if (!tokenCookie) return;
    const token = tokenCookie.split("=")[1];

    try {
      await submitExam(Number(id), answers, token);
      alert("Nộp bài thành công!");
      router.push("/student/dashboard");
    } catch (error) {
      alert("Lỗi khi nộp bài. Vui lòng thử lại!");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-10 text-center">Đang tải đề thi...</div>;
  if (!exam) return <div className="p-10 text-center">Không tìm thấy đề thi!</div>;

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-slate-900">{exam.title}</h1>
        <Button onClick={handleSubmit} disabled={submitting} className="bg-indigo-600 hover:bg-indigo-700">
          {submitting ? "Đang nộp..." : "Nộp bài"}
        </Button>
      </div>

      <div className="space-y-6">
        {exam.questions?.map((q: any, index: number) => (
          <Card key={q.id}>
            <CardHeader>
              <CardTitle className="text-lg">
                Câu {index + 1}: {q.content}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup
                onValueChange={(val) => setAnswers({ ...answers, [q.id]: Number(val) })}
                className="space-y-3"
              >
                {q.choices?.map((choice: any) => (
                  <div key={choice.id} className="flex items-center space-x-2">
                    <RadioGroupItem value={choice.id.toString()} id={`c-${choice.id}`} />
                    <Label htmlFor={`c-${choice.id}`}>{choice.content}</Label>
                  </div>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-10 flex justify-center">
        <Button size="lg" onClick={handleSubmit} disabled={submitting} className="w-full max-w-sm bg-indigo-600 hover:bg-indigo-700 h-14 text-lg font-bold">
          {submitting ? "Đang nộp bài..." : "KẾT THÚC BÀI THI"}
        </Button>
      </div>
    </div>
  );
}
