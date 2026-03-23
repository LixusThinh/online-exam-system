"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { getExam, submitExam } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface Choice {
  id: number;
  content: string;
}

interface Question {
  id: number;
  content: string;
  points: number;
  choices: Choice[];
}

interface Exam {
  id: number;
  title: string;
  time_limit: number;
  questions: Question[];
}

const getToken = () => {
    const match = document.cookie.match(/(^| )token=([^;]+)/);
    return match ? match[2] : null;
};

export default function ExamPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);

  const [exam, setExam] = useState<Exam | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Format: answers[question_id] = choice_id
  const [answers, setAnswers] = useState<Record<number, number>>({});

  useEffect(() => {
    const fetchExam = async () => {
      try {
        const token = getToken();
        if (!token) {
          router.push("/login");
          return;
        }
        
        const data = await getExam(id, token);
        setExam(data);
      } catch (err: any) {
        setError(err.message || "Không thể tải đề thi");
      } finally {
        setLoading(false);
      }
    };

    fetchExam();
  }, [id, router]);

  const handleAnswerSelect = (questionId: number, choiceId: number) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: choiceId,
    }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const token = getToken();
      if (!token) throw new Error("Vui lòng đăng nhập lại.");

      // Format payload to expected array
      const formattedAnswers = Object.entries(answers).map(([qId, cId]) => ({
        question_id: parseInt(qId),
        choice_id: cId,
      }));

      const res = await submitExam(id, formattedAnswers, token);
      
      // Dialog / Alert as requested
      alert(`Bài làm của bạn đã được nộp!\n\nSố điểm đạt được: ${res.score} / ${res.total_points}\nTrạng thái: ${res.status}`);
      
      // Redirect to submission history
      router.push("/student/submissions");

    } catch (err: any) {
      alert("Lỗi khi nộp bài: " + (err.message || "Vui lòng thử lại."));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="text-xl font-medium animate-pulse text-blue-600">Đang tải đề thi...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-gray-50 p-4">
        <div className="bg-red-50 text-red-600 p-6 rounded-lg max-w-lg shadow-sm border border-red-200">
          <h2 className="text-xl font-bold mb-2">Đã xảy ra lỗi</h2>
          <p>{error}</p>
          <Button onClick={() => router.push("/student")} className="mt-4" variant="outline">
            Quay lại trang chủ
          </Button>
        </div>
      </div>
    );
  }

  if (!exam) return null;

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header Đề thi */}
        <Card className="border-t-4 border-t-blue-600 shadow-lg">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {exam.title}
            </CardTitle>
            <CardDescription className="text-lg mt-2 text-slate-600 font-medium">
              Thời gian làm bài: <span className="text-blue-600 font-bold">{exam.time_limit} phút</span>
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Danh sách câu hỏi */}
        <div className="space-y-6">
          {exam.questions?.map((question, index) => (
            <Card key={question.id} className="shadow-sm border-slate-200 hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start gap-4 mb-6">
                  <div className="flex-shrink-0 bg-blue-100 text-blue-700 font-bold w-10 h-10 rounded-full flex items-center justify-center text-lg">
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-slate-900 leading-relaxed">
                      {question.content}
                    </h3>
                    <p className="text-sm text-slate-500 font-medium mt-1">({question.points} điểm)</p>
                  </div>
                </div>

                <div className="pl-14">
                  <RadioGroup
                    value={answers[question.id]?.toString()}
                    onValueChange={(val) => handleAnswerSelect(question.id, parseInt(val))}
                    className="space-y-3"
                  >
                    {question.choices?.map((choice) => (
                      <div 
                        key={choice.id} 
                        className={`flex items-center space-x-3 p-3 rounded-lg border transition-all ${
                          answers[question.id] === choice.id 
                            ? "bg-blue-50 border-blue-200 shadow-sm" 
                            : "bg-white border-transparent hover:bg-slate-50"
                        }`}
                      >
                        <RadioGroupItem value={choice.id.toString()} id={`q${question.id}-c${choice.id}`} className="w-5 h-5 text-blue-600" />
                        <Label 
                          htmlFor={`q${question.id}-c${choice.id}`} 
                          className="flex-1 cursor-pointer text-base text-slate-700 font-medium select-none"
                        >
                          {choice.content}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {exam.questions?.length === 0 && (
            <div className="text-center p-10 bg-white shadow rounded-lg text-slate-500">
              Đề thi này chưa có câu hỏi nào.
            </div>
          )}
        </div>

        {/* Bấm nộp bài */}
        {exam.questions && exam.questions.length > 0 && (
          <div className="flex justify-center pt-6 pb-20">
            <Button 
              size="lg" 
              onClick={handleSubmit} 
              disabled={isSubmitting}
              className="px-12 py-6 text-lg font-bold rounded-full shadow-xl hover:shadow-2xl transition-all"
            >
              {isSubmitting ? "Đang chấm điểm..." : "Nộp bài ngay"}
            </Button>
          </div>
        )}

      </div>
    </div>
  );
}
