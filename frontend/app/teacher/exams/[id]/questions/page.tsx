"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, AlertCircle, PlusCircle, Layers } from "lucide-react";
import { createQuestions, getQuestionsForTeacher, deleteQuestion, getExam } from "@/lib/api";

type ChoiceType = { content: string; is_correct: boolean };

export default function QuestionsManagementPage() {
  const params = useParams();
  const router = useRouter();
  const examId = params.id as string;
  const [token, setToken] = useState<string | null>(null);

  // Form State
  const [content, setContent] = useState("");
  const [points, setPoints] = useState<number>(1);
  const [choices, setChoices] = useState<string[]>(["", "", "", ""]);
  const [correctIndex, setCorrectIndex] = useState<number>(0);

  // List State
  const [questions, setQuestions] = useState<any[]>([]);
  const [exam, setExam] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchQuestions = useCallback(async (t: string) => {
    try {
      const data = await getQuestionsForTeacher(examId, t);
      setQuestions(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError("Không thể tải danh sách câu hỏi.");
    }
  }, [examId]);

  const fetchExam = useCallback(async (t: string) => {
    try {
      const data = await getExam(examId, t);
      setExam(data);
    } catch (err) {
      console.log(err);
    }
  }, [examId]);

  useEffect(() => {
    const cookies = document.cookie.split("; ");
    const tokenCookie = cookies.find((row) => row.startsWith("token="));
    if (tokenCookie) {
      const t = tokenCookie.split("=")[1];
      setToken(t);
      fetchExam(t);
      fetchQuestions(t);
    } else {
      router.push("/login");
    }
  }, [fetchQuestions, fetchExam, router]);

  const handleChoiceChange = (index: number, val: string) => {
    const newChoices = [...choices];
    newChoices[index] = val;
    setChoices(newChoices);
  };

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setError("");
    setLoading(true);

    try {
      // Validate
      if (!content.trim()) throw new Error("Vui lòng nhập nội dung câu hỏi");
      if (points <= 0) throw new Error("Điểm phải lớn hơn 0");
      if (choices.some((c) => !c.trim())) throw new Error("Vui lòng nhập đầy đủ 4 đáp án");

      const formattedChoices: ChoiceType[] = choices.map((c, i) => ({
        content: c,
        is_correct: i === correctIndex,
      }));

      const payload = [
        {
          content,
          points,
          choices: formattedChoices,
        },
      ];

      await createQuestions(examId, payload, token);
      
      // Reset form
      setContent("");
      setChoices(["", "", "", ""]);
      setCorrectIndex(0);
      setPoints(1);
      
      // Refresh list
      await fetchQuestions(token);

    } catch (err: any) {
      setError(err.message || "Thêm câu hỏi thất bại");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (questionId: number) => {
    if (!token) return;
    if (!window.confirm("Bạn có chắc chắn muốn xóa câu hỏi này không?")) return;

    try {
      await deleteQuestion(questionId, token);
      await fetchQuestions(token);
    } catch (err: any) {
      alert("Xóa thất bại: " + err.message);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-zinc-950 p-6 md:p-10">
      <div className="max-w-5xl mx-auto w-full space-y-8">
        {/* HEADER INFORMATION */}
        {exam && (
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-zinc-800 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                {exam.title}
              </h1>
              <p className="text-slate-500 mt-1 flex items-center gap-2">
                <Layers className="w-4 h-4" /> Đang soạn thảo câu hỏi
              </p>
            </div>
            <Button variant="outline" onClick={() => router.push("/teacher/dashboard")}>
              Quay lại Dashboard
            </Button>
          </div>
        )}

        {/* TOP HALF: ADD QUESTION FORM */}
        <Card className="shadow-lg border-blue-100 dark:border-zinc-800">
          <CardHeader className="bg-blue-50/50 dark:bg-zinc-900/50">
            <CardTitle className="text-xl flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-blue-600" /> Thêm Câu Hỏi Mới
            </CardTitle>
            <CardDescription>Điền nội dung và 4 đáp án. Đừng quên chọn đáp án đúng.</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {error && (
              <div className="mb-6 p-4 rounded-md bg-red-50 text-red-600 outline outline-1 outline-red-200 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                {error}
              </div>
            )}
            <form onSubmit={handleAddQuestion} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="md:col-span-3 space-y-2">
                  <Label className="font-semibold text-base">Nội dung câu hỏi</Label>
                  <Input 
                    placeholder="VD: Thủ đô của Việt Nam là gì?" 
                    value={content} 
                    onChange={(e) => setContent(e.target.value)} 
                    className="h-12 text-base"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-semibold text-base">Điểm số</Label>
                  <Input 
                    type="number" 
                    step="0.5" 
                    min="0.5" 
                    value={points} 
                    onChange={(e) => setPoints(parseFloat(e.target.value))} 
                    className="h-12 text-base"
                  />
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-zinc-800">
                <Label className="font-semibold text-base">Các Lựa Chọn (Tick vào đáp án đúng)</Label>
                <RadioGroup 
                  value={correctIndex.toString()} 
                  onValueChange={(val) => setCorrectIndex(parseInt(val))}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  {choices.map((choice, i) => (
                    <div 
                      key={i} 
                      className={`flex items-center space-x-3 p-3 rounded-lg border-2 transition-all ${
                        correctIndex === i 
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" 
                          : "border-gray-200 dark:border-zinc-800 hover:border-gray-300"
                      }`}
                    >
                      <RadioGroupItem value={i.toString()} id={`rc_${i}`} className="w-5 h-5" />
                      <div className="flex-1">
                        <Input 
                          placeholder={`Đáp án ${String.fromCharCode(65 + i)}`} 
                          value={choice} 
                          onChange={(e) => handleChoiceChange(i, e.target.value)} 
                          className="border-none shadow-none focus-visible:ring-0 bg-transparent px-1 h-9 font-medium"
                        />
                      </div>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div className="flex justify-end pt-2">
                <Button type="submit" disabled={loading} className="px-8 h-11 text-base shadow-md">
                  {loading ? "Đang lưu..." : "Lưu Câu Hỏi"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* BOTTOM HALF: LIST QUESTIONS */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight">Danh Sách Câu Hỏi ({questions.length})</h2>
          {questions.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-zinc-900 rounded-xl border border-dashed border-gray-300 dark:border-zinc-800">
              <p className="text-gray-500">Chưa có câu hỏi nào trong đề thi này.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {questions.map((q, index) => (
                <div key={q.id} className="relative group">
                  <div className="absolute right-4 top-4 z-10 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      onClick={() => handleDelete(q.id)}
                      title="Xóa câu hỏi"
                      className="shadow-md"
                    >
                      <Trash2 className="w-4 h-4 mr-2" /> Xóa
                    </Button>
                  </div>
                  <Card className="overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    <div className="p-5">
                      <div className="space-y-2 pr-20">
                        <div className="flex items-center gap-3">
                          <span className="bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-slate-200 px-3 py-1 rounded-full text-xs font-bold">
                            Câu {index + 1}
                          </span>
                          <h3 className="font-semibold text-lg">{q.content}</h3>
                          <span className="text-sm font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded ml-2">
                            {q.points} điểm
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-4 pl-14">
                          {q.choices.map((c: any, i: number) => (
                            <div 
                              key={c.id} 
                              className={`px-3 py-2 rounded-md text-sm border ${
                                c.is_correct 
                                  ? "bg-green-50 border-green-200 text-green-800 font-medium" 
                                  : "bg-gray-50 border-transparent text-gray-600"
                              }`}
                            >
                              <span className="mr-2 opacity-50">{String.fromCharCode(65 + i)}.</span>
                              {c.content}
                              {c.is_correct && <span className="ml-2 text-green-600 font-bold">✓ Đúng</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
