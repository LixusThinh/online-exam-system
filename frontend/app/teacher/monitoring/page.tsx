"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Activity, AlertTriangle, Eye, Shield, Wifi, WifiOff
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function TeacherMonitoringPage() {
  const router = useRouter();
  const { isAuthenticated, loading: isLoading, user } = useAuth();
  const [connected, setConnected] = useState(false);
  const [events, setEvents] = useState<{ id: number; message: string; type: string; time: string }[]>([]);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated || (user?.role !== "teacher" && user?.role !== "admin")) {
      router.push("/login");
      return;
    }

    const ws = new WebSocket(`ws://localhost:8000/ws/anti-cheat/global`);

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onerror = () => setConnected(false);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setEvents((prev) => [{
          id: Date.now(),
          message: data.message || JSON.stringify(data),
          type: data.type || "info",
          time: new Date().toLocaleTimeString("vi-VN"),
        }, ...prev].slice(0, 50));
      } catch {
        setEvents((prev) => [{
          id: Date.now(),
          message: event.data,
          type: event.data.includes("Cheat") ? "warning" : "info",
          time: new Date().toLocaleTimeString("vi-VN"),
        }, ...prev].slice(0, 50));
      }
    };

    return () => ws.close();
  }, [isAuthenticated, isLoading, user, router]);

  return (
    <div className="min-h-screen bg-slate-50/50 font-sans">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.push("/teacher/dashboard")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900">Giám Sát Trực Tuyến</h1>
              <p className="text-sm text-slate-500">Theo dõi hoạt động anti-cheat thời gian thực</p>
            </div>
          </div>
          <Badge
            variant={connected ? "default" : "destructive"}
            className={`gap-1.5 px-3 py-1.5 text-sm font-bold ${connected ? "bg-emerald-500/10 text-emerald-600 border-emerald-200" : ""}`}
          >
            {connected ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
            {connected ? "Đang kết nối" : "Mất kết nối"}
          </Badge>
        </div>

        {/* Status Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-slate-200 bg-white">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-50 rounded-xl">
                  <Activity className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-black text-slate-900">{events.length}</p>
                  <p className="text-xs font-bold text-slate-400 uppercase">Sự kiện ghi nhận</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-slate-200 bg-white">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-rose-50 rounded-xl">
                  <AlertTriangle className="h-6 w-6 text-rose-600" />
                </div>
                <div>
                  <p className="text-2xl font-black text-slate-900">
                    {events.filter((e) => e.type === "warning" || e.type === "blur").length}
                  </p>
                  <p className="text-xs font-bold text-slate-400 uppercase">Cảnh báo vi phạm</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-slate-200 bg-white">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-50 rounded-xl">
                  <Shield className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-black text-slate-900">
                    {connected ? "Active" : "Offline"}
                  </p>
                  <p className="text-xs font-bold text-slate-400 uppercase">Trạng thái hệ thống</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Live Event Feed */}
        <Card className="border-slate-200 shadow-lg bg-white rounded-2xl overflow-hidden">
          <CardHeader className="border-b border-slate-100">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg font-bold">Bảng sự kiện thời gian thực</CardTitle>
              {connected && (
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
              )}
            </div>
            <CardDescription>Các sự kiện từ tất cả các phòng thi được hiển thị tại đây.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {events.length === 0 ? (
              <div className="text-center py-20">
                <Eye className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-slate-500">Đang chờ sự kiện...</h3>
                <p className="text-slate-400 mt-1 text-sm">Khi học sinh làm bài và chuyển tab, sự kiện sẽ hiển thị ở đây.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
                {events.map((evt) => (
                  <div key={evt.id} className="flex items-start gap-4 px-6 py-4 hover:bg-slate-50 transition-colors">
                    <div className={`mt-0.5 p-2 rounded-full shrink-0 ${
                      evt.type === "warning" || evt.type === "blur"
                        ? "bg-rose-50 text-rose-500" : "bg-blue-50 text-blue-500"
                    }`}>
                      {evt.type === "warning" || evt.type === "blur"
                        ? <AlertTriangle className="h-4 w-4" />
                        : <Activity className="h-4 w-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-800 leading-tight">{evt.message}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">{evt.time}</p>
                    </div>
                    <Badge
                      variant={evt.type === "warning" || evt.type === "blur" ? "destructive" : "secondary"}
                      className="shrink-0 text-[10px]"
                    >
                      {evt.type}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
