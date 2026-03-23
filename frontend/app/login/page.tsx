"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { loginApi } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await loginApi({ username, password });

      // Save token to cookie
      if (response.access_token) {
        document.cookie = `token=${response.access_token}; path=/; max-age=86400`;
      }

      const role = response.user?.role;

      if (role === "admin" || role === "teacher") {
        router.push("/teacher/dashboard");
      } else if (role === "student") {
        router.push("/student");
      } else {
        throw new Error("Không xác định được quyền truy cập. Vui lòng liên hệ quản trị viên.");
      }
    } catch (err: any) {
      setError(err.message || "Đã xảy ra lỗi khi đăng nhập.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gray-50 dark:bg-zinc-950">
      <Card className="w-full max-w-md shadow-xl border-gray-200 dark:border-zinc-800">
        <CardHeader className="space-y-2 text-center pb-6">
          <CardTitle className="text-3xl font-extrabold tracking-tight">Đăng Nhập</CardTitle>
          <CardDescription className="text-base">
            Vui lòng đăng nhập để vào hệ thống
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 rounded-md bg-red-50 text-red-600 text-sm font-medium border border-red-200">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-semibold">Tên đăng nhập</Label>
              <Input
                id="username"
                type="text"
                placeholder="Ví dụ: teacher123"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="h-12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-semibold">Mật khẩu</Label>
              <Input
                id="password"
                type="password"
                placeholder="Nhập mật khẩu"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-12"
              />
            </div>
            <Button type="submit" className="w-full h-12 text-md font-medium mt-4" disabled={loading}>
              {loading ? "Đang xử lý..." : "Đăng nhập"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
