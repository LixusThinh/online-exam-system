"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { ArrowLeft, Users, PlusCircle, Copy, CheckCircle2 } from "lucide-react";
import { getClasses, createClass } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

export default function TeacherClassesPage() {
  const router = useRouter();
  const { isAuthenticated, loading: isLoading, user } = useAuth();
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newClassName, setNewClassName] = useState("");
  const [creating, setCreating] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const fetchClasses = async () => {
    try {
      const data = await getClasses();
      setClasses(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated || (user?.role !== "teacher" && user?.role !== "admin")) {
      router.push("/login");
      return;
    }
    fetchClasses();
  }, [isAuthenticated, isLoading, user, router]);

  const handleCreate = async () => {
    if (!newClassName.trim()) return;
    setCreating(true);
    try {
      await createClass({ name: newClassName.trim() });
      setNewClassName("");
      fetchClasses();
    } catch (err: any) {
      alert("Tạo lớp thất bại: " + err.message);
    } finally {
      setCreating(false);
    }
  };

  const copyCode = (id: number, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50/50 font-sans">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push("/teacher/dashboard")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">Quản Lý Lớp Học</h1>
            <p className="text-sm text-slate-500">Tổng cộng {classes.length} lớp đang hoạt động</p>
          </div>
        </div>

        {/* Create Class */}
        <Card className="border-slate-200 shadow-lg bg-white rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Tạo Lớp Mới</CardTitle>
            <CardDescription>Mã mời sẽ tự động được sinh ra khi tạo lớp.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="VD: Lớp 12A1 - Toán Học"
                value={newClassName}
                onChange={(e) => setNewClassName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                className="flex-1 h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-700"
              />
              <Button
                className="h-12 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-100"
                onClick={handleCreate}
                disabled={creating || !newClassName.trim()}
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                {creating ? "Đang tạo..." : "Tạo lớp"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Classes List */}
        <Card className="border-slate-200 shadow-lg bg-white rounded-2xl overflow-hidden">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Danh Sách Lớp Học</CardTitle>
            <CardDescription>Chia sẻ mã mời cho học sinh để tham gia lớp.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="text-center py-16 text-slate-400">Đang tải...</div>
            ) : classes.length === 0 ? (
              <div className="text-center py-16">
                <Users className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-slate-600">Chưa có lớp học nào</h3>
                <p className="text-slate-400 mt-1">Tạo lớp đầu tiên ở phía trên.</p>
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="w-[80px] text-center text-[10px] font-black uppercase tracking-widest text-slate-400">ID</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tên Lớp</TableHead>
                    <TableHead className="w-[250px] text-center text-[10px] font-black uppercase tracking-widest text-slate-400">Mã Mời</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {classes.map((c) => (
                    <TableRow key={c.id} className="hover:bg-emerald-50/30 transition-colors group">
                      <TableCell className="text-center font-bold text-slate-300">#{c.id}</TableCell>
                      <TableCell className="font-bold text-slate-800">{c.name}</TableCell>
                      <TableCell className="text-center">
                        <button
                          onClick={() => copyCode(c.id, c.invite_code)}
                          className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-600 px-4 py-2 rounded-lg border border-emerald-100 font-mono font-black text-sm hover:bg-emerald-600 hover:text-white transition-all cursor-pointer"
                        >
                          {copiedId === c.id ? (
                            <><CheckCircle2 className="h-4 w-4" />Đã copy!</>
                          ) : (
                            <><Copy className="h-4 w-4" />{c.invite_code}</>
                          )}
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
