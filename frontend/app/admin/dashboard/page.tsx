"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Users, 
  BookOpen, 
  Layers, 
  Trash2, 
  ShieldAlert, 
  Database, 
  Terminal, 
  Activity, 
  Search,
  LogOut,
  RefreshCw,
  Lock,
  Zap
} from "lucide-react";
import { 
    getUsers, 
    getClasses, 
    getExams, 
    deleteUser, 
    deleteClass, 
    deleteExam 
} from "@/lib/api";

export default function AdminDashboard() {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    setLogs(prev => [`[${time}] ${msg}`, ...prev].slice(0, 50));
  };

  const fetchData = useCallback(async (token: string) => {
    try {
      setLoading(true);
      addLog("Initializing system diagnostic...");
      const [u, c, e] = await Promise.all([
        getUsers(token),
        getClasses(token),
        getExams(token)
      ]);
      setUsers(Array.isArray(u) ? u : []);
      setClasses(Array.isArray(c) ? c : []);
      setExams(Array.isArray(e) ? e : []);
      addLog("System data synchronized successfully.");
    } catch (err: any) {
      addLog(`CRITICAL ERROR: ${err.message}`);
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

  const handleDeleteUser = async (id: number, name: string) => {
    if (!window.confirm(`XÁC NHẬN TRUY CẬP: Xóa người dùng ${name}? Hành động này không thể hoàn tác!`)) return;
    
    const cookies = document.cookie.split("; ");
    const tokenCookie = cookies.find((row) => row.startsWith("token="));
    if (!tokenCookie) return;
    const t = tokenCookie.split("=")[1];

    try {
      addLog(`Initiating user termination protocol: ID ${id}...`);
      await deleteUser(id, t);
      addLog(`User ${name} wiped from database.`);
      fetchData(t);
    } catch (err: any) {
      addLog(`TERMINATION FAILED: ${err.message}`);
    }
  };

  const handleDeleteClass = async (id: number, name: string) => {
    if (!window.confirm(`XÁC NHẬN TRUY CẬP: Xóa lớp học ${name}?`)) return;
    
    const cookies = document.cookie.split("; ");
    const tokenCookie = cookies.find((row) => row.startsWith("token="));
    if (!tokenCookie) return;
    const t = tokenCookie.split("=")[1];

    try {
      addLog(`Commencing class dissolution: ${name}...`);
      await deleteClass(id, t);
      addLog(`Class ${name} metadata purged.`);
      fetchData(t);
    } catch (err: any) {
      addLog(`DISSOLUTION FAILED: ${err.message}`);
    }
  };

  const logout = () => {
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT";
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[#00ff9f] font-mono selection:bg-[#00ff9f] selection:text-black">
      
      {/* GOD MODE HEADER */}
      <header className="border-b border-[#00ff9f]/20 bg-black/80 backdrop-blur-md sticky top-0 z-50">
        <div className="mx-auto max-w-[1600px] flex h-16 items-center px-6 justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded bg-[#00ff9f] shadow-[0_0_15px_rgba(0,255,159,0.5)]">
              <ShieldAlert className="h-6 w-6 text-black" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black tracking-[0.2em] text-[#00ff9f]">ADM-OS <span className="text-white opacity-50">v4.0</span></span>
              <span className="text-[10px] font-bold text-[#00ff9f]/60 animate-pulse underline decoration-double">GOD MODE ENABLED</span>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="hidden lg:flex items-center gap-6 text-[10px] font-bold tracking-widest text-[#00ff9f]/40">
                <div className="flex items-center gap-2"><Activity className="h-3 w-3" /> LATENCY: 2ms</div>
                <div className="flex items-center gap-2"><Database className="h-3 w-3" /> BUFFER: 100%</div>
            </div>
            <Button 
                variant="outline" 
                size="sm" 
                className="border-[#00ff9f]/30 hover:bg-[#00ff9f] hover:text-black transition-all text-[10px] font-black tracking-widest h-8"
                onClick={logout}
            >
              <LogOut className="h-3 w-3 mr-2" />
              TERMINATE_SESSION
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] p-6 space-y-8">
        
        {/* TOP METRICS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: "NEURAL USERS", val: users.length, icon: Users, color: "0, 255, 159" },
            { label: "VIRTUAL CLASSES", val: classes.length, icon: Layers, color: "0, 191, 255" },
            { label: "EXAM PROTOCOLS", val: exams.length, icon: BookOpen, color: "255, 0, 255" },
            { label: "SYS HEALTH", val: "99.9%", icon: Zap, color: "255, 255, 0" },
          ].map((stat, i) => (
             <Card key={i} className="bg-black border border-[#00ff9f]/20 shadow-[0_0_20px_rgba(0,0,0,0.5)] group hover:border-[#00ff9f]/60 transition-all overflow-hidden relative">
                <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <stat.icon className="w-24 h-24" style={{ color: `rgb(${stat.color})` }} />
                </div>
                <CardHeader className="pb-2">
                    <CardTitle className="text-[10px] font-black tracking-[0.3em] opacity-40 uppercase">{stat.label}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-4xl font-black tracking-tighter" style={{ color: `rgb(${stat.color})` }}>
                        {loading ? "---" : stat.val}
                    </div>
                </CardContent>
                <div className="h-1 w-full opacity-20" style={{ background: `linear-gradient(90deg, transparent, rgb(${stat.color}), transparent)` }} />
             </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          
          {/* USER & SYSTEM TABLES */}
          <div className="xl:col-span-8 space-y-8">
            
            {/* USER MANAGEMENT */}
            <Card className="bg-black border border-[#00ff9f]/20 rounded-none overflow-hidden h-fit">
              <CardHeader className="border-b border-[#00ff9f]/10 flex flex-row items-center justify-between p-4 bg-[#00ff9f]/5">
                <div>
                    <CardTitle className="text-sm font-black tracking-widest flex items-center gap-2">
                        <Users className="h-4 w-4" /> USER_DATABASE
                    </CardTitle>
                </div>
                <Button size="icon" variant="ghost" className="h-8 w-8 text-[#00ff9f]/40 hover:text-[#00ff9f]" onClick={() => fetchData(document.cookie.split("token=")[1].split(";")[0])}>
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-black">
                            <TableRow className="border-[#00ff9f]/10 hover:bg-transparent">
                                <TableHead className="text-[#00ff9f]/40 text-[10px] uppercase font-black tracking-widest">ID</TableHead>
                                <TableHead className="text-[#00ff9f]/40 text-[10px] uppercase font-black tracking-widest font-mono">USERNAME</TableHead>
                                <TableHead className="text-[#00ff9f]/40 text-[10px] uppercase font-black tracking-widest">ROLE</TableHead>
                                <TableHead className="text-right text-[#00ff9f]/40 text-[10px] uppercase font-black tracking-widest px-6">CMD</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.map((user) => (
                                <TableRow key={user.id} className="border-[#00ff9f]/5 hover:bg-[#00ff9f]/5 transition-colors group">
                                    <TableCell className="text-[#00ff9f]/30 font-bold text-xs">#{user.id}</TableCell>
                                    <TableCell className="font-bold text-sm text-white">{user.username}</TableCell>
                                    <TableCell>
                                        <span className={`text-[10px] px-2 py-0.5 font-black uppercase tracking-widest border border-current ${
                                            user.role === 'admin' ? 'text-rose-500' : user.role === 'teacher' ? 'text-blue-500' : 'text-emerald-500'
                                        }`}>
                                            {user.role}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right px-6">
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-8 w-8 text-rose-500/30 hover:text-rose-500 hover:bg-rose-500/10"
                                            onClick={() => handleDeleteUser(user.id, user.username)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
              </CardContent>
            </Card>

            {/* CLASS MANAGEMENT */}
            <Card className="bg-black border border-[#00ff9f]/20 rounded-none overflow-hidden">
               <CardHeader className="border-b border-[#00ff9f]/10 p-4 bg-[#00ff9f]/5">
                    <CardTitle className="text-sm font-black tracking-widest flex items-center gap-2 uppercase">
                        <Layers className="h-4 w-4" /> Class_Dissolution_Control
                    </CardTitle>
               </CardHeader>
               <CardContent className="p-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-[#00ff9f]/10">
                        {classes.map(c => (
                            <div key={c.id} className="bg-black p-4 flex items-center justify-between group hover:bg-[#00ff9f]/5 transition-colors">
                                <div className="space-y-1">
                                    <div className="text-sm font-black text-white">{c.name}</div>
                                    <div className="text-[10px] font-bold text-[#00ff9f]/40 flex items-center gap-2 uppercase">
                                        <Lock className="h-3 w-3" /> Code: <span className="text-white">{c.invite_code}</span>
                                    </div>
                                </div>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8 text-rose-500/40 hover:text-rose-500 hover:bg-rose-500/10"
                                    onClick={() => handleDeleteClass(c.id, c.name)}
                                >
                                    <Trash2 className="h-3 w-3" />
                                </Button>
                            </div>
                        ))}
                    </div>
               </CardContent>
            </Card>

          </div>

          {/* SIDEBAR: SYSTEM LOGS */}
          <div className="xl:col-span-4 h-full">
            <Card className="bg-black border border-[#00ff9f]/20 rounded-none h-full flex flex-col shadow-[0_0_40px_rgba(0,0,0,0.8)]">
                <CardHeader className="border-b border-[#00ff9f]/10 p-4 shrink-0 flex flex-row items-center justify-between">
                    <CardTitle className="text-sm font-black tracking-widest flex items-center gap-2">
                        <Terminal className="h-4 w-4" /> SYSTEM_LOGS
                    </CardTitle>
                    <div className="h-2 w-2 rounded-full bg-[#00ff9f] animate-ping" />
                </CardHeader>
                <CardContent className="flex-1 p-4 font-mono text-[11px] overflow-y-auto space-y-2 scrollbar-hide">
                    {logs.map((log, i) => (
                        <div key={i} className={`flex gap-3 leading-relaxed ${log.includes("CRITICAL") ? 'text-rose-500' : 'text-[#00ff9f]/60'}`}>
                            <span className="opacity-30 shrink-0">{logs.length - i}</span>
                            <span className="break-all">{log}</span>
                        </div>
                    ))}
                    {logs.length === 0 && <div className="text-[#00ff9f]/20 animate-pulse italic">Awaiting input...</div>}
                </CardContent>
                <CardFooter className="border-t border-[#00ff9f]/10 p-3 bg-black flex items-center gap-2 overflow-hidden">
                    <span className="text-[#00ff9f] animate-bounce">&gt;_</span>
                    <div className="h-3 w-[200px] bg-[#00ff9f]/10 relative overflow-hidden">
                        <div className="absolute inset-0 bg-[#00ff9f]/40 animate-[shimmer_2s_infinite]" />
                    </div>
                </CardFooter>
            </Card>
          </div>

        </div>
      </main>

      {/* FOOTER SCANLINE */}
      <footer className="fixed bottom-0 left-0 right-0 h-1 bg-[#00ff9f]/20 pointer-events-none z-50 overflow-hidden">
        <div className="h-full w-24 bg-[#00ff9f] shadow-[0_0_20px_#00ff9f] animate-[scan_3s_linear_infinite]" />
      </footer>

      <style jsx global>{`
        @keyframes scan {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(1600%); }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        ::-webkit-scrollbar {
          width: 4px;
        }
        ::-webkit-scrollbar-track {
          background: #000;
        }
        ::-webkit-scrollbar-thumb {
          background: #00ff9f44;
        }
      `}</style>

    </div>
  );
}
