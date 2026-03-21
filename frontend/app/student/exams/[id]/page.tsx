"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getExam, submitExam } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function ExamTakingPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  
  const examId = params.id as string;
  const [exam, setExam] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadExam() {
      try {
        const data = await getExam(examId);
        setExam(data);
      } catch (err: any) {
        toast({
          title: "Lỗi tải đề thi",
          description: err.message,
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    }
    loadExam();
  }, [examId, toast]);

  const handleSelectAnswer = (questionId: number, choiceId: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: parseInt(choiceId) }));
  };

  const handleSubmit = async () => {
    if (!exam || !exam.questions) return;
    
    // Validate
    if (Object.keys(answers).length < exam.questions.length) {
      toast({
        title: "Chưa hoàn thành",
        description: "Bạn chưa chọn đáp án cho tất cả câu hỏi. Vui lòng kiểm tra lại!",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        answers: Object.entries(answers).map(([qId, cId]) => ({
          question_id: parseInt(qId),
          choice_id: cId
        }))
      };

      const result = await submitExam(examId, payload);
      
      toast({
        title: "Nộp bài thành công!",
        description: `Bạn đạt ${result.score} / ${result.total_points} điểm.`,
      });

      // Redirect sau 2 giây
      setTimeout(() => {
        router.push("/student/submissions");
      }, 2000);
      
    } catch (err: any) {
      toast({
        title: "Lỗi nộp bài",
        description: err.message,
        variant: "destructive"
      });
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Đang tải đề thi...</div>;
  }

  if (!exam) {
    return <div className="flex justify-center items-center h-screen">Không tìm thấy đề thi.</div>;
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4 space-y-8">
      <Card className="border-t-4 border-t-blue-600 shadow-md">
        <CardHeader>
          <CardTitle className="text-3xl font-bold">{exam.title}</CardTitle>
          <CardDescription className="text-lg">Thời gian: {exam.time_limit} phút</CardDescription>
        </CardHeader>
      </Card>

      <div className="space-y-6">
        {exam.questions?.map((q: any, index: number) => (
          <Card key={q.id} className="shadow-sm">
            <CardHeader className="pb-3 border-b bg-gray-50/50">
              <CardTitle className="text-lg font-medium">
                <span className="text-blue-600 mr-2">Câu {index + 1}:</span>
                {q.content}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <RadioGroup 
                value={answers[q.id]?.toString() || ""}
                onValueChange={(val) => handleSelectAnswer(q.id, val)}
                className="space-y-3"
              >
                {q.choices?.map((c: any) => (
                  <div key={c.id} className="flex items-center space-x-3 rounded-md border p-3 hover:bg-gray-50 transition-colors">
                    <RadioGroupItem value={c.id.toString()} id={`choice-${c.id}`} />
                    <Label htmlFor={`choice-${c.id}`} className="flex-1 cursor-pointer font-normal text-base">
                      {c.content}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-end pt-4 border-t">
        <Button 
          size="lg" 
          onClick={handleSubmit} 
          disabled={submitting}
          className="px-8 text-lg"
        >
          {submitting ? "Đang xử lý..." : "Nộp bài ngay"}
        </Button>
      </div>
    </div>
  );
}
