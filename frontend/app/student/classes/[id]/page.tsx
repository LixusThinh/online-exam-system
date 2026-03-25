"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle2, PlayCircle, AlertCircle, ArrowLeft, GraduationCap } from "lucide-react";
import { getClassExams, getMySubmissions } from "@/lib/api";

export default function StudentClassPage() {
  const router = useRouter();
  const params = useParams();
  const classId = params.id as string;
  const [exams, setExams] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = useCallback(async (token: string) => {
    try {
      setLoading(true);
      const [examsData, submissionsData] = await Promise.all([
        getClassExams(classId, token),
        getMySubmissions(token)
      ]);
      setExams(Array.isArray(examsData) ? examsData : []);
      setSubmissions(Array.isArray(submissionsData) ? submissionsData : []);
    } catch (err: any) {
      setError("Không thể kết nối máy chủ. Bạn đã tham gia lớp chưa?");
    } finally {
      setLoading(false);
    }
  }, [classId]);

  useEffect(() => {
    const cookies = document.cookie.split("; ");
    const tokenCookie = cookies.find((row) => row.startsWith("token="));
    if (tokenCookie) {
      fetchData(tokenCookie.split("=")[1]);
    } else {
      router.push("/login");
    }
  }, [fetchData, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent shadow-xl"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 md:p-12">
      <div className="max-w-5xl mx-auto space-y-8">
        
        <div className="flex items-center justify-between">
          <Button variant="ghost" className="gap-2" onClick={() => router.push("/student/dashboard")}>
            <ArrowLeft className="h-4 w-4" /> Quay lại Bảng điều khiển
          </Button>
          <div className="flex items-center gap-2 bg-emerald-100 text-emerald-800 px-4 py-2 rounded-full font-bold shadow-sm">
            <GraduationCap className="h-5 w-5" />
            Lớp học #{classId}
          </div>
        </div>

        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Nhiệm vụ & Bài tập
          </h1>
          <p className="text-slate-500 mt-2 text-lg">Hoàn thành các bài kiểm tra được giao trong lớp này.</p>
        </div>

        {error ? (
           <div className="p-4 bg-red-50 text-red-600 rounded-xl font-medium border border-red-200">
             {error}
           </div>
        ) : exams.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-slate-200 rounded-2xl bg-white text-center">
            <AlertCircle className="h-12 w-12 text-slate-300 mb-4" />
            <h3 className="text-xl font-bold text-slate-800">Chưa có bài tập nào</h3>
            <p className="text-slate-500 max-w-sm mt-1">Giáo viên chưa giao bài tập cho lớp học này. Vui lòng quay lại sau.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {exams.map((exam) => {
              const isSubmitted = submissions.some(s => s.exam_id === exam.id);
              return (
                <Card key={exam.id} className="group relative border-slate-200 hover:border-indigo-400 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden rounded-3xl bg-white shadow-sm flex flex-col">
                  <div className={`absolute top-0 right-0 h-2 w-full ${isSubmitted ? 'bg-emerald-500' : 'bg-indigo-500'}`} />
                  <CardHeader className="flex-1 pt-6 pb-2">
                    <div className="flex justify-between items-start mb-3">
                      <Badge variant={isSubmitted ? "outline" : "default"} className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${isSubmitted ? 'border-emerald-200 text-emerald-600 bg-emerald-50' : 'bg-indigo-600 text-white shadow-md shadow-indigo-200'}`}>
                        {isSubmitted ? "Đã Nộp" : "Live"}
                      </Badge>
                      <div className="flex items-center text-slate-400 text-xs font-semibold bg-slate-50 px-2 py-1 rounded-full border border-slate-100">
                        <Clock className="h-3 w-3 mr-1" />
                        <span>{exam.time_limit} phút</span>
                      </div>
                    </div>
                    <CardTitle className="text-xl font-extrabold text-slate-800 line-clamp-3 leading-snug group-hover:text-indigo-600 transition-colors pt-2">
                       {exam.title}
                    </CardTitle>
                  </CardHeader>
                  <CardFooter className="pt-4 border-t border-slate-50 bg-slate-50/50">
                    <Button 
                      disabled={isSubmitted} 
                      variant={isSubmitted ? "secondary" : "default"}
                      className={`w-full h-11 rounded-xl font-bold text-sm uppercase tracking-widest ${!isSubmitted ? 'bg-slate-900 border-none hover:bg-indigo-600 shadow-md transform group-hover:scale-[1.02] transition-all text-white' : ''}`}
                      onClick={() => !isSubmitted && router.push(`/student/exams/${exam.id}/take`)}
                    >
                      {isSubmitted ? (
                         <><CheckCircle2 className="mr-2 h-4 w-4" /> Đã hoàn tất</>
                      ) : (
                         <><PlayCircle className="mr-2 h-4 w-4" /> Bắt đầu ngay</>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
