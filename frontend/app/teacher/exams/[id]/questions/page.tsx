"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createQuestions } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, Trash2, Save } from "lucide-react";

type ChoiceType = { content: string; is_correct: boolean };
type QuestionType = { content: string; points: number; choices: ChoiceType[] };

export default function ManageQuestionsPage() {
  const { id } = useParams();
  const examId = id as string;
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<QuestionType[]>([
    {
      content: "",
      points: 10,
      choices: [
        { content: "", is_correct: true },
        { content: "", is_correct: false },
        { content: "", is_correct: false },
        { content: "", is_correct: false },
      ],
    },
  ]);

  const handleAddQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      {
        content: "",
        points: 10,
        choices: [
          { content: "", is_correct: true },
          { content: "", is_correct: false },
          { content: "", is_correct: false },
          { content: "", is_correct: false },
        ],
      },
    ]);
  };

  const handleRemoveQuestion = (index: number) => {
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const updateQuestionContent = (idx: number, val: string) => {
    const newQ = [...questions];
    newQ[idx].content = val;
    setQuestions(newQ);
  };

  const updateQuestionPoints = (idx: number, val: string) => {
    const newQ = [...questions];
    newQ[idx].points = Number(val) || 0;
    setQuestions(newQ);
  };

  const updateChoiceContent = (qIdx: number, cIdx: number, val: string) => {
    const newQ = [...questions];
    newQ[qIdx].choices[cIdx].content = val;
    setQuestions(newQ);
  };

  const setCorrectChoice = (qIdx: number, correctCIdx: number) => {
    const newQ = [...questions];
    newQ[qIdx].choices = newQ[qIdx].choices.map((c, i) => ({
      ...c,
      is_correct: i === correctCIdx,
    }));
    setQuestions(newQ);
  };

  const handleSave = async () => {
    // Validate empty fields
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.content.trim()) {
        toast({ title: `Câu hỏi ${i + 1} đang trống nội dung`, variant: "destructive" });
        return;
      }
      for (let j = 0; j < q.choices.length; j++) {
        if (!q.choices[j].content.trim()) {
          toast({ title: `Câu hỏi ${i + 1} - Đáp án ${j + 1} đang trống`, variant: "destructive" });
          return;
        }
      }
    }

    setLoading(true);
    try {
      await createQuestions(examId, questions);
      toast({
        title: "Lưu thành công",
        description: `Đã thêm ${questions.length} câu hỏi vào đề thi.`,
      });
      router.push("/teacher/manage-exams");
    } catch (err: any) {
      toast({
        title: "Lỗi",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b pb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Quản lý câu hỏi</h1>
          <p className="text-slate-500 mt-1">
            Thêm danh sách câu hỏi trắc nghiệm cho đề thi #{examId}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleAddQuestion}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Thêm câu hỏi
          </Button>
          <Button onClick={handleSave} disabled={loading} className="px-6">
            {loading ? "Đang lưu..." : (
              <>
                <Save className="mr-2 h-4 w-4" /> Lưu tất cả
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="space-y-8">
        {questions.length === 0 && (
          <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-lg dashed-border border-2 border-slate-200">
            Chưa có câu hỏi nào. Nhấn "Thêm câu hỏi" để bắt đầu.
          </div>
        )}

        {questions.map((q, qIndex) => {
          // Identify the correctly selected index
          const correctIndex = q.choices.findIndex(c => c.is_correct);

          return (
            <Card key={qIndex} className="relative shadow-sm border-slate-200 overflow-visible transition-all hover:shadow-md">
              <Button 
                variant="destructive" 
                size="icon" 
                className="absolute -top-3 -right-3 h-8 w-8 rounded-full shadow-md z-10"
                onClick={() => handleRemoveQuestion(qIndex)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              
              <CardHeader className="bg-slate-50/50 border-b pb-4">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1 space-y-2">
                    <Label className="text-base font-semibold text-slate-900 flex items-center gap-2">
                      <span className="bg-blue-600 text-white rounded-md px-2.5 py-0.5 text-sm">Câu {qIndex + 1}</span>
                      Nội dung câu hỏi
                    </Label>
                    <Textarea
                      placeholder="Nhập nội dung câu hỏi..."
                      value={q.content}
                      onChange={(e) => updateQuestionContent(qIndex, e.target.value)}
                      className="min-h-[100px] bg-white text-base resize-y"
                    />
                  </div>
                  <div className="w-24 space-y-2">
                    <Label className="text-sm font-semibold whitespace-nowrap text-slate-700">Điểm số</Label>
                    <Input
                      type="number"
                      min="1"
                      value={q.points}
                      onChange={(e) => updateQuestionPoints(qIndex, e.target.value)}
                      className="bg-white text-center font-bold"
                    />
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-6">
                <Label className="text-sm font-semibold text-slate-700 mb-3 block">Phương án trả lời (Chọn 1 đáp án đúng):</Label>
                <RadioGroup 
                  value={correctIndex >= 0 ? correctIndex.toString() : undefined} 
                  onValueChange={(val) => setCorrectChoice(qIndex, parseInt(val))}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  {q.choices.map((choice, cIndex) => {
                    const isCorrect = correctIndex === cIndex;
                    const choiceLabels = ["A", "B", "C", "D"];
                    return (
                      <div 
                        key={cIndex} 
                        className={`flex items-start space-x-3 rounded-xl border-2 p-3 transition-colors ${
                          isCorrect ? "border-green-500 bg-green-50/30 shadow-sm" : "border-slate-100 bg-slate-50/50 hover:bg-slate-100/50"
                        }`}
                      >
                        <div className="flex h-10 items-center justify-center">
                          <RadioGroupItem value={cIndex.toString()} id={`q${qIndex}-c${cIndex}`} className={isCorrect ? "border-green-600 text-green-600" : ""} />
                        </div>
                        <div className="flex-1 flex flex-col gap-1.5">
                          <Label 
                            htmlFor={`q${qIndex}-c${cIndex}`} 
                            className={`font-semibold cursor-pointer ${isCorrect ? "text-green-700" : "text-slate-600"}`}
                          >
                            ĐÁP ÁN {choiceLabels[cIndex]} {isCorrect && <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded-full ml-2">Đúng</span>}
                          </Label>
                          <Input
                            placeholder={`Nhập đáp án ${choiceLabels[cIndex]}...`}
                            value={choice.content}
                            onChange={(e) => updateChoiceContent(qIndex, cIndex, e.target.value)}
                            className={`h-9 shadow-none ${isCorrect ? "border-green-300 focus-visible:ring-green-400" : "border-slate-200"}`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </RadioGroup>
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      {questions.length > 0 && (
        <div className="flex justify-end pt-4">
          <Button onClick={handleSave} disabled={loading} size="lg" className="px-8 shadow-md">
             {loading ? "Đang lưu..." : "Lưu tất cả vào cơ sở dữ liệu"}
          </Button>
        </div>
      )}
    </div>
  );
}
