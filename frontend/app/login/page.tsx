"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Login submitted:", { username, password });
    
    // Set a dummy cookie so that middleware doesn't redirect back
    document.cookie = "token=dummy-token; path=/";
    
    router.push("/dashboard");
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
            <Button type="submit" className="w-full h-12 text-md font-medium mt-4">
              Đăng nhập
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
