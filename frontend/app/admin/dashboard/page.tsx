"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShieldAlert, Users, BookOpen, Layers, Trash2, Shield, Settings, Server, Activity, Terminal } from "lucide-react";
import { getExams, getUsers, getClasses, deleteExam, deleteUser, deleteClass } from "@/lib/api";

export default function AdminDashboard() {
  const router = useRouter();
  const [exams, setExams] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [logs, setLogs] = useState<string[]>(["[SYS] Cấp quyền Super Admin...", "[SYS] Mở cổng kết nối Server..."]);

  const addLog = (msg: string) => {
    setLogs(prev => [msg, ...prev].slice(0, 5));
  };

  const fetchData = useCallback(async (token: string) => {
    try {
      addLog("[NET] Fetching toàn bộ Dữ liệu Trung Tâm...");
      const [examsData, usersData, classesData] = await Promise.all([
        getExams(token),
        getUsers(token),
        getClasses(token)
      ]);
      setExams(Array.isArray(examsData) ? examsData : []);
      setUsers(Array.isArray(usersData) ? usersData : []);
      setClasses(Array.isArray(classesData) ? classesData : []);
      addLog("[NET] Trích xuất Dữ liệu THÀNH CÔNG.");
    } catch (err: any) {
      setError("Bạn không có quyền truy cập hoặc có lỗi xảy ra.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const cookies = document.cookie.split("; ");
    const tokenCookie = cookies.find((row) => row.startsWith("token="));
    if (tokenCookie) {
      const t = tokenCookie.split("=")[1];
      fetchData(t);
    } else {
      router.push("/login");
    }
  }, [fetchData, router]);

  const getToken = () => document.cookie.split("; ").find(r => r.startsWith("token="))?.split("=")[1] || "";

  const handleDeleteExamAdmin = async (id: number) => {
    if (window.confirm("[CẢNH BÁO TỐI CAO] XÓA VĨNH VIỄN đề thi này khỏi Database?")) {
      addLog(`[WARN] Thực thi lệnh Xóa Đề Thi #${id}...`);
      try {
        await deleteExam(id, getToken());
        addLog(`[OK] Đề Thi #${id} đã bay màu.`);
        fetchData(getToken());
      } catch (err: any) {
        addLog(`[ERR] Lỗi xóa Đề Thi: ${err.message}`);
      }
    }
  };

  const handleDeleteUserAdmin = async (id: number, role: string) => {
    if (role === 'admin') {
      alert("Không thể xóa Admin tối cao!");
      return;
    }
    if (window.confirm(`[CẢNH BÁO TỐI CAO] XÓA VĨNH VIỄN User #${id}?`)) {
      addLog(`[WARN] Thực thi lệnh Xóa User #${id}...`);
      try {
        await deleteUser(id, getToken());
        addLog(`[OK] User #${id} đã bị thanh trừng.`);
        fetchData(getToken());
      } catch (err: any) {
        addLog(`[ERR] Lỗi xóa User: ${err.message}`);
      }
    }
  };

  const handleDeleteClassAdmin = async (id: number) => {
    if (window.confirm("[CẢNH BÁO TỐI CAO] Giải tán Lớp học này?")) {
      addLog(`[WARN] Thực thi lệnh Giải tán Lớp #${id}...`);
      try {
        await deleteClass(id, getToken());
        addLog(`[OK] Lớp #${id} đã bị giải tán.`);
        fetchData(getToken());
      } catch (err: any) {
        addLog(`[ERR] Lỗi xóa Lớp: ${err.message}`);
      }
    }
  };

  if (loading) return (
    <div className="flex flex-col h-screen items-center justify-center bg-black">
      <div className="h-16 w-16 mb-4 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent shadow-[0_0_30px_rgba(6,182,212,0.6)]"></div>
      <p className="text-cyan-400 font-mono text-sm tracking-widest animate-pulse">INITIATING GOD MODE...</p>
    </div>
  );

  if (error) return (
    <div className="flex flex-col h-screen items-center justify-center bg-black text-white">
      <ShieldAlert className="h-24 w-24 text-red-500 mb-6 drop-shadow-[0_0_20px_rgba(239,68,68,0.8)] animate-pulse" />
      <h1 className="text-4xl font-bold mb-2 font-mono text-red-500">ACCESS_DENIED</h1>
      <p className="text-zinc-400 mb-8 font-mono">{error}</p>
      <Button onClick={() => router.push("/login")} variant="outline" className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white font-mono rounded-none">
        [ RETURN_TO_LOGIN ]
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050505] text-cyan-50 font-sans selection:bg-cyan-500/30 overflow-x-hidden relative">
      {/* SCANLINE OVERLAY */}
      <div className="pointer-events-none absolute inset-0 z-50 h-full w-full bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] opacity-20"></div>
      
      {/* GRID BACKGROUND */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>

      {/* HEADER */}
      <header className="sticky top-0 z-40 w-full border-b border-cyan-900/50 bg-[#050505]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex h-16 items-center px-6 md:px-10 justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-cyan-950 p-2 rounded-none border border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              <Server className="h-5 w-5 text-cyan-400" />
            </div>
            <span className="font-bold text-xl tracking-widest font-mono text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]">
              SYSTEM<span className="text-cyan-400">_CORE</span>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs font-mono text-cyan-500 border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 animate-pulse">
              STATUS: ONLINE
            </span>
            <Button variant="ghost" className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-950/50 rounded-none border border-transparent hover:border-cyan-800" size="icon" onClick={() => router.push("/login")}>
              <Settings className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto w-full p-6 md:p-10 space-y-8 relative z-10">
        
        {/* TOP HACKER DASHBOARD */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600 mb-2 drop-shadow-[0_0_20px_rgba(6,182,212,0.3)] uppercase">
              God Mode Dashboard
            </h1>
            <p className="text-cyan-700 font-mono text-sm tracking-widest uppercase">/Root/Admin/Control_Panel_Access_Granted</p>
          </div>
          
          {/* TERMINAL LOGS */}
          <div className="bg-[#0a0a0a] border border-cyan-900/50 rounded-md p-3 font-mono text-xs overflow-hidden h-24 shadow-[inset_0_0_10px_rgba(0,0,0,1)] relative">
            <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent"></div>
            <div className="flex items-center mb-2 pb-1 border-b border-cyan-900/50 text-cyan-600">
              <Terminal className="h-3 w-3 mr-2" />
              <span>TERMINAL_STDOUT</span>
            </div>
            {logs.map((log, i) => (
              <div key={i} className={`truncate ${i === 0 ? 'text-cyan-400' : 'text-cyan-800'}`}>
                {log}
              </div>
            ))}
          </div>
        </div>

        {/* STATS HIGHLIGHT (NEON) */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="bg-[#0a0a0a] border-t-2 border-t-emerald-500 border-x-zinc-900 border-b-zinc-900 rounded-none shadow-[0_10px_30px_-10px_rgba(16,185,129,0.2)]">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-mono text-zinc-400 uppercase tracking-widest">Entities_Users</CardTitle>
              <Users className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-5xl font-bold text-emerald-400 font-mono drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]">{users.length}</div>
            </CardContent>
          </Card>
          
          <Card className="bg-[#0a0a0a] border-t-2 border-t-rose-500 border-x-zinc-900 border-b-zinc-900 rounded-none shadow-[0_10px_30px_-10px_rgba(244,63,94,0.2)]">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-mono text-zinc-400 uppercase tracking-widest">Active_Exams</CardTitle>
              <Activity className="h-4 w-4 text-rose-500" />
            </CardHeader>
            <CardContent>
              <div className="text-5xl font-bold text-rose-400 font-mono drop-shadow-[0_0_10px_rgba(244,63,94,0.5)]">{exams.length}</div>
            </CardContent>
          </Card>

          <Card className="bg-[#0a0a0a] border-t-2 border-t-indigo-500 border-x-zinc-900 border-b-zinc-900 rounded-none shadow-[0_10px_30px_-10px_rgba(99,102,241,0.2)]">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-mono text-zinc-400 uppercase tracking-widest">Live_Classes</CardTitle>
              <Layers className="h-4 w-4 text-indigo-500" />
            </CardHeader>
            <CardContent>
              <div className="text-5xl font-bold text-indigo-400 font-mono drop-shadow-[0_0_10px_rgba(99,102,241,0.5)]">{classes.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* DATA TABS (TECH STYLE) */}
        <Tabs defaultValue="users" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8 bg-[#0a0a0a] border border-cyan-900/50 rounded-none p-0 h-12">
            <TabsTrigger value="users" className="rounded-none h-full data-[state=active]:bg-cyan-950/50 data-[state=active]:text-cyan-400 data-[state=active]:border-b-2 data-[state=active]:border-cyan-400 font-mono uppercase tracking-widest text-xs">/Users</TabsTrigger>
            <TabsTrigger value="exams" className="rounded-none h-full data-[state=active]:bg-cyan-950/50 data-[state=active]:text-cyan-400 data-[state=active]:border-b-2 data-[state=active]:border-cyan-400 font-mono uppercase tracking-widest text-xs">/Exams</TabsTrigger>
            <TabsTrigger value="classes" className="rounded-none h-full data-[state=active]:bg-cyan-950/50 data-[state=active]:text-cyan-400 data-[state=active]:border-b-2 data-[state=active]:border-cyan-400 font-mono uppercase tracking-widest text-xs">/Classes</TabsTrigger>
          </TabsList>
          
          {/* USERS TAB */}
          <TabsContent value="users" className="animate-in fade-in duration-300">
            <div className="border border-cyan-900/40 bg-[#0a0a0a]/80 backdrop-blur-sm relative">
              <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-cyan-500"></div>
              <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-cyan-500"></div>
              <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-cyan-500"></div>
              <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-cyan-500"></div>
              
              <div className="p-4 border-b border-cyan-900/40 flex justify-between items-center bg-cyan-950/10">
                <h3 className="font-mono text-cyan-400 text-sm uppercase tracking-widest flex items-center"><Shield className="w-4 h-4 mr-2"/> User_Registry.db</h3>
              </div>
              
              <Table>
                <TableHeader className="bg-[#050505]">
                  <TableRow className="border-cyan-900/40 hover:bg-transparent">
                    <TableHead className="text-cyan-700 font-mono py-4 uppercase text-xs">UID</TableHead>
                    <TableHead className="text-cyan-700 font-mono py-4 uppercase text-xs">Auth_Tag</TableHead>
                    <TableHead className="text-cyan-700 font-mono py-4 uppercase text-xs">Display_Name</TableHead>
                    <TableHead className="text-cyan-700 font-mono py-4 uppercase text-xs">Clearance</TableHead>
                    <TableHead className="text-right text-cyan-700 font-mono py-4 uppercase text-xs">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id} className="border-cyan-900/20 hover:bg-cyan-950/20 transition-colors group">
                      <TableCell className="font-mono text-zinc-500">0x00{user.id}</TableCell>
                      <TableCell className="font-mono text-cyan-300">{user.username}</TableCell>
                      <TableCell className="text-zinc-300">{user.full_name}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-0.5 rounded-none font-mono text-[10px] uppercase border ${
                          user.role === 'admin' ? 'bg-rose-500/10 text-rose-400 border-rose-500/50' : 
                          user.role === 'teacher' ? 'bg-amber-500/10 text-amber-400 border-amber-500/50' : 
                          'bg-indigo-500/10 text-indigo-400 border-indigo-500/50'}`}>
                          [{user.role}]
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={user.role === 'admin'}
                          onClick={() => handleDeleteUserAdmin(user.id, user.role)}
                          className="h-7 px-2 bg-red-950/30 text-red-500 hover:bg-red-900 hover:text-white border border-red-900/50 rounded-none font-mono text-xs disabled:opacity-30"
                        >
                          PURGE
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* EXAMS TAB */}
          <TabsContent value="exams" className="animate-in fade-in duration-300">
            <div className="border border-cyan-900/40 bg-[#0a0a0a]/80 backdrop-blur-sm relative">
              <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-cyan-500"></div>
              <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-cyan-500"></div>
              <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-cyan-500"></div>
              <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-cyan-500"></div>
              
              <div className="p-4 border-b border-cyan-900/40 flex justify-between items-center bg-cyan-950/10">
                <h3 className="font-mono text-cyan-400 text-sm uppercase tracking-widest flex items-center"><BookOpen className="w-4 h-4 mr-2"/> Exam_Matrix.db</h3>
              </div>
              
              <Table>
                <TableHeader className="bg-[#050505]">
                  <TableRow className="border-cyan-900/40 hover:bg-transparent">
                    <TableHead className="text-cyan-700 font-mono py-4 uppercase text-xs">E_ID</TableHead>
                    <TableHead className="text-cyan-700 font-mono py-4 uppercase text-xs">Title</TableHead>
                    <TableHead className="text-cyan-700 font-mono py-4 uppercase text-xs">Duration</TableHead>
                    <TableHead className="text-right text-cyan-700 font-mono py-4 uppercase text-xs">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {exams.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center font-mono text-cyan-800 text-xs">NO_DATA_FOUND</TableCell>
                    </TableRow>
                  ) : (
                    exams.map((exam) => (
                      <TableRow key={exam.id} className="border-cyan-900/20 hover:bg-cyan-950/20 transition-colors">
                        <TableCell className="font-mono text-zinc-500">EX-{exam.id}</TableCell>
                        <TableCell className="font-mono text-cyan-200">{exam.title}</TableCell>
                        <TableCell className="font-mono text-zinc-400">{exam.time_limit} MIN</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteExamAdmin(exam.id)}
                            className="h-7 px-2 bg-red-950/30 text-red-500 hover:bg-red-900 hover:text-white border border-red-900/50 rounded-none font-mono text-xs"
                          >
                            PURGE
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* CLASSES TAB */}
          <TabsContent value="classes" className="animate-in fade-in duration-300">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {classes.map((cls) => (
                <div key={cls.id} className="p-5 border border-cyan-900/40 bg-[#0a0a0a]/80 flex flex-col justify-between relative group hover:border-cyan-500/50 transition-colors">
                  {/* Cyber corners */}
                  <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-transparent group-hover:border-cyan-500"></div>
                  <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-transparent group-hover:border-cyan-500"></div>
                  
                  <div>
                    <h3 className="text-lg font-mono font-bold text-indigo-300 mb-1 tracking-wider">{cls.name}</h3>
                    <p className="text-[10px] font-mono text-cyan-700 uppercase mb-2">Hash_Code:</p>
                    <div className="bg-black p-3 border border-cyan-900/50 text-center relative overflow-hidden">
                      <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(6,182,212,0.1)_50%)] bg-[length:100%_4px] pointer-events-none"></div>
                      <code className="text-xl font-black font-mono text-cyan-400 tracking-widest relative z-10 drop-shadow-[0_0_5px_rgba(6,182,212,0.5)]">
                        {cls.invite_code}
                      </code>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteClassAdmin(cls.id)}
                      className="h-7 px-3 bg-red-950/20 text-red-500 hover:bg-red-900 hover:text-white border border-red-900/30 rounded-none font-mono text-xs w-full"
                    >
                      TERMINATE_CLASS
                    </Button>
                  </div>
                </div>
              ))}
              {classes.length === 0 && (
                <div className="col-span-full text-center py-10 font-mono text-cyan-800 text-xs border border-cyan-900/20 bg-[#0a0a0a]/50">NO_CLASSES_INITIALIZED</div>
              )}
            </div>
          </TabsContent>

        </Tabs>
      </main>
    </div>
  );
}
