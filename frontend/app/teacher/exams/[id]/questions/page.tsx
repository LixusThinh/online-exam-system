"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, AlertCircle, PlusCircle, Layers, ArrowLeft, CheckCircle2, Bookmark, FileText } from "lucide-react";
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
  const [isSaving, setIsSaving] = useState(false);
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
      
      setContent("");
      setChoices(["", "", "", ""]);
      setCorrectIndex(0);
      setPoints(1);
      
      await fetchQuestions(token);

    } catch (err: any) {
      setError(err.message || "Thêm câu hỏi thất bại");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveQuestions = async () => {
    if (!token) return;
    setIsSaving(true);
    try {
      // Data đã được save từng câu mỗi khi Add (để sinh ra DB ID phục vụ cho việc Delete)
      // Call createQuestions với mảng rỗng để không bị trùng lặp dữ liệu nhưng vẫn đảm bảo flow
      const questionsData: any[] = [];
      await createQuestions(examId, questionsData, token);
      router.push('/teacher/dashboard');
    } catch (err: any) {
      alert("Quá trình lưu thất bại: " + err.message);
    } finally {
      setIsSaving(false);
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
              <Layers className="w-4 h-4 text-teal-600" /> Ngân Hàng Câu Hỏi
            </span>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full p-6 md:p-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* HEADER INFORMATION */}
        {exam && (
          <div className="bg-white dark:bg-zinc-900 p-8 rounded-2xl shadow-sm border border-teal-100/60 dark:border-teal-900/40 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
              <Layers className="w-48 h-48 text-teal-900" />
            </div>
            <div className="relative z-10">
              <p className="text-teal-600 dark:text-teal-400 font-semibold text-sm uppercase tracking-wider mb-2 flex items-center gap-2">
                <Bookmark className="w-4 h-4" /> Đang soạn thảo đề thi
              </p>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 mb-2">
                {exam.title}
              </h1>
              <p className="text-slate-500 flex items-center gap-2 text-sm font-medium">
                <FileText className="w-4 h-4" /> Đã tạo {questions.length} câu hỏi
              </p>
            </div>
          </div>
        )}

        {/* TOP HALF: ADD QUESTION FORM */}
        <Card className="shadow-lg shadow-teal-900/5 border-teal-100/60 dark:border-teal-900/40 relative overflow-hidden">
          <CardHeader className="bg-teal-50/50 dark:bg-zinc-900/80 border-b border-teal-50 dark:border-zinc-800/80 px-8 py-6">
            <CardTitle className="text-xl flex items-center gap-2 text-slate-800 dark:text-slate-100">
              <PlusCircle className="w-5 h-5 text-teal-600 dark:text-teal-400" /> Thêm Câu Hỏi Mới
            </CardTitle>
            <CardDescription className="text-slate-500 mt-1">
              Điền nội dung và 4 đáp án. Hãy nhấp chọn đáp án đúng nhất để hệ thống tự động chấm điểm.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8 bg-white dark:bg-zinc-950/50">
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-medium border border-red-200 dark:border-red-800/50 flex items-center gap-2 animate-in slide-in-from-top-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                {error}
              </div>
            )}
            <form onSubmit={handleAddQuestion} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="md:col-span-3 space-y-3">
                  <Label className="font-semibold text-base text-slate-700 dark:text-slate-300">Nội dung câu hỏi <span className="text-orange-500">*</span></Label>
                  <Input 
                    placeholder="VD: Thủ đô của Việt Nam là gì?" 
                    value={content} 
                    onChange={(e) => setContent(e.target.value)} 
                    className="h-12 text-base border-teal-100 focus-visible:ring-teal-500 bg-teal-50/30 dark:bg-teal-950/20 transition-colors"
                  />
                </div>
                <div className="space-y-3">
                  <Label className="font-semibold text-base text-slate-700 dark:text-slate-300">Điểm số <span className="text-orange-500">*</span></Label>
                  <Input 
                    type="number" 
                    step="0.5" 
                    min="0.5" 
                    value={points} 
                    onChange={(e) => setPoints(parseFloat(e.target.value))} 
                    className="h-12 text-base font-mono border-teal-100 focus-visible:ring-teal-500 bg-teal-50/30 dark:bg-teal-950/20 transition-colors text-center"
                  />
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-teal-50 dark:border-zinc-800">
                <Label className="font-semibold text-base text-slate-700 dark:text-slate-300">Các Lựa Chọn (Tick vào đáp án đúng) <span className="text-orange-500">*</span></Label>
                <RadioGroup 
                  value={correctIndex.toString()} 
                  onValueChange={(val) => setCorrectIndex(parseInt(val))}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  {choices.map((choice, i) => (
                    <div 
                      key={i} 
                      className={`flex items-center space-x-3 p-3 rounded-xl border-2 transition-all ${
                        correctIndex === i 
                          ? "border-teal-500 bg-teal-50/50 dark:bg-teal-900/20 shadow-sm" 
                          : "border-teal-100 dark:border-zinc-800 hover:border-teal-300 dark:hover:border-zinc-700"
                      }`}
                    >
                      <RadioGroupItem value={i.toString()} id={`rc_${i}`} className="w-5 h-5 text-teal-600 border-teal-300" />
                      <div className="flex-1 w-full">
                        <Input 
                          placeholder={`Đáp án ${String.fromCharCode(65 + i)}`} 
                          value={choice} 
                          onChange={(e) => handleChoiceChange(i, e.target.value)} 
                          className="border-none shadow-none focus-visible:ring-0 bg-transparent px-1 h-10 font-medium text-slate-800 dark:text-slate-200"
                        />
                      </div>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div className="flex justify-end pt-4 border-t border-teal-50 dark:border-zinc-800">
                <Button type="submit" disabled={loading} className="px-8 h-11 text-base rounded-full bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 hover:-translate-y-0.5 transition-all font-semibold">
                  {loading ? "Đang xử lý..." : "Lưu Câu Hỏi"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* BOTTOM HALF: LIST QUESTIONS */}
        <div className="space-y-6 pt-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100 flex items-center gap-2">
              Danh Sách Câu Hỏi <span className="bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-400 font-mono px-2 py-0.5 rounded-md text-sm">{questions.length}</span>
            </h2>
          </div>
          
          {questions.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-zinc-950/50 rounded-2xl border-2 border-dashed border-teal-100 dark:border-teal-900/40 flex flex-col items-center justify-center">
              <FileText className="w-12 h-12 text-teal-200 dark:text-teal-900/50 mb-4" />
              <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">Chưa có câu hỏi nào</h3>
              <p className="text-slate-500 max-w-sm mt-1">Bắt đầu nhập câu hỏi ở form phía trên để xây dựng nội dung cho đề thi này.</p>
            </div>
          ) : (
            <div className="grid gap-6">
              {questions.map((q, index) => (
                <div key={q.id} className="relative group">
                  <div className="absolute right-4 top-4 z-10 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleDelete(q.id)}
                      title="Xóa câu hỏi"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                    >
                      <Trash2 className="w-4 h-4 mr-1.5" /> Xóa
                    </Button>
                  </div>
                  <Card className="overflow-hidden shadow-sm border-teal-100/60 dark:border-teal-900/40 hover:shadow-md hover:border-teal-200 transition-all duration-300">
                    <div className="p-6 md:p-8 relative">
                      <div className="space-y-3 pr-20 md:pr-24">
                        <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-3">
                          <div className="flex-shrink-0">
                            <span className="bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ring-1 ring-teal-600/20">
                              Câu {index + 1}
                            </span>
                          </div>
                          <h3 className="font-semibold text-lg text-slate-800 dark:text-slate-100">{q.content}</h3>
                          <div className="flex-shrink-0 hidden sm:block">
                            <span className="text-xs font-semibold font-mono text-orange-600 bg-orange-50 dark:bg-orange-900/20 ring-1 ring-orange-500/20 px-2 py-0.5 rounded-md ml-1">
                              {q.points} đ
                            </span>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-zinc-800">
                          {q.choices.map((c: any, i: number) => (
                            <div 
                              key={c.id} 
                              className={`px-4 py-3 rounded-xl text-sm border-2 transition-colors flex items-center justify-between ${
                                c.is_correct 
                                  ? "bg-emerald-50/50 border-emerald-200 text-emerald-900 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-100 font-medium shadow-sm" 
                                  : "bg-slate-50/50 border-transparent text-slate-600 dark:bg-zinc-900/50 dark:text-slate-400"
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <span className={`font-mono font-bold ${c.is_correct ? "text-emerald-600" : "text-slate-400"}`}>
                                  {String.fromCharCode(65 + i)}.
                                </span>
                                <span>{c.content}</span>
                              </div>
                              {c.is_correct && <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />}
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

        {/* TOOLBAR NÚT LƯU & HOÀN TẤT */}
        <div className="flex justify-end pt-8 pb-4">
          <Button 
            size="lg" 
            onClick={handleSaveQuestions} 
            disabled={isSaving}
            className="h-14 px-10 text-lg font-bold bg-green-600 hover:bg-green-700 text-white shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all rounded-xl"
          >
            {isSaving ? "Đang lưu..." : "💾 Lưu & Hoàn tất đề thi"}
          </Button>
        </div>
      </div>
    </div>
  );
}
