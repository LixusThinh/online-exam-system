"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import {
  Eye,
  EyeOff,
  LogIn,
  Loader2,
  ShieldCheck,
  GraduationCap,
  BookOpenCheck,
  Sparkles,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login, user, loading: authLoading } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (user && !authLoading) {
      if (user.role === "admin") {
        router.push("/admin/dashboard");
      } else if (user.role === "teacher") {
        router.push("/teacher/dashboard");
      } else if (user.role === "student") {
        router.push("/student/dashboard");
      }
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(username, password);
    } catch (err: any) {
      setError(err.message || "Đã xảy ra lỗi khi đăng nhập.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#042F2E]">
      {/* Animated gradient background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-[#042F2E] via-[#0F766E] to-[#042F2E] animate-gradient-shift" />
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-[#0D9488]/20 blur-[120px] animate-float-slow" />
        <div className="absolute bottom-[-15%] right-[-10%] w-[500px] h-[500px] rounded-full bg-[#2DD4BF]/15 blur-[100px] animate-float-slower" />
        <div className="absolute top-[30%] right-[20%] w-[300px] h-[300px] rounded-full bg-[#F97316]/10 blur-[80px] animate-float-reverse" />
      </div>

      {/* Subtle grid overlay */}
      <div
        className="absolute inset-0 z-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Main content */}
      <div
        className={`relative z-10 w-full max-w-[460px] px-4 transition-all duration-700 ease-out ${
          mounted
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-8"
        }`}
      >
        {/* Brand header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0D9488] to-[#2DD4BF] shadow-2xl shadow-teal-500/30 mb-5 ring-1 ring-white/10">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white font-mono">
            SKY<span className="text-[#2DD4BF]">-EXAM</span>
          </h1>
          <p className="text-[#99F6E4]/60 text-sm mt-2 font-medium">
            Hệ thống kiểm tra trực tuyến thế hệ mới
          </p>
        </div>

        {/* Login card - Glassmorphism */}
        <div className="relative rounded-2xl border border-white/10 bg-white/[0.05] backdrop-blur-xl shadow-2xl shadow-black/20 overflow-hidden">
          {/* Top accent bar */}
          <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-[#2DD4BF] to-transparent" />

          <div className="p-8">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-white tracking-tight">
                Đăng Nhập
              </h2>
              <p className="text-[#99F6E4]/50 text-sm mt-1">
                Nhập thông tin tài khoản để tiếp tục
              </p>
            </div>

            {/* Error message */}
            {error && (
              <div className="mb-5 flex items-start gap-3 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm animate-shake">
                <ShieldCheck className="w-4 h-4 mt-0.5 shrink-0 text-red-400" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Username */}
              <div className="space-y-2">
                <label
                  htmlFor="login-username"
                  className="block text-xs font-semibold uppercase tracking-wider text-[#99F6E4]/70"
                >
                  Tên đăng nhập
                </label>
                <div className="relative group">
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#0D9488]/50 to-[#2DD4BF]/50 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 blur-sm -z-10" />
                  <input
                    id="login-username"
                    type="text"
                    placeholder="Ví dụ: student01"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="w-full h-12 px-4 rounded-xl bg-white/[0.06] border border-white/10 text-white placeholder-white/20 text-sm font-medium transition-all duration-200 focus:outline-none focus:border-[#2DD4BF]/50 focus:bg-white/[0.08] focus:ring-2 focus:ring-[#2DD4BF]/20"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label
                  htmlFor="login-password"
                  className="block text-xs font-semibold uppercase tracking-wider text-[#99F6E4]/70"
                >
                  Mật khẩu
                </label>
                <div className="relative group">
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#0D9488]/50 to-[#2DD4BF]/50 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 blur-sm -z-10" />
                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Nhập mật khẩu"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full h-12 px-4 pr-12 rounded-xl bg-white/[0.06] border border-white/10 text-white placeholder-white/20 text-sm font-medium transition-all duration-200 focus:outline-none focus:border-[#2DD4BF]/50 focus:bg-white/[0.08] focus:ring-2 focus:ring-[#2DD4BF]/20"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-white/30 hover:text-white/60 transition-colors cursor-pointer"
                    aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={loading || !username || !password}
                className="relative w-full h-12 mt-2 rounded-xl font-bold text-sm tracking-wide overflow-hidden cursor-pointer transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed group"
              >
                {/* Button gradient background */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#0D9488] to-[#0F766E] group-hover:from-[#0F766E] group-hover:to-[#0D9488] transition-all duration-300" />
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-[#2DD4BF]/20 to-transparent" />

                <span className="relative z-10 flex items-center justify-center gap-2 text-white">
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Đang xác thực...
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      Đăng nhập
                    </>
                  )}
                </span>
              </button>
            </form>
          </div>

          {/* Footer inside card */}
          <div className="px-8 py-4 border-t border-white/[0.05] bg-white/[0.02]">
            <div className="flex items-center justify-center gap-6 text-[10px] uppercase tracking-widest text-white/20 font-semibold">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3 h-3" />
                <span>Bảo mật</span>
              </div>
              <div className="w-1 h-1 rounded-full bg-white/10" />
              <div className="flex items-center gap-1.5">
                <BookOpenCheck className="w-3 h-3" />
                <span>Chính xác</span>
              </div>
              <div className="w-1 h-1 rounded-full bg-white/10" />
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3 h-3" />
                <span>Hiện đại</span>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <p className="text-center text-[10px] text-white/15 mt-6 font-medium tracking-wide">
          © 2026 SKY-EXAM Learning System — Developed with ❤ by Thịnh
        </p>
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes gradient-shift {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.8;
          }
        }
        @keyframes float-slow {
          0%,
          100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -30px) scale(1.05);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.95);
          }
        }
        @keyframes float-slower {
          0%,
          100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(-25px, 25px) scale(1.03);
          }
          66% {
            transform: translate(15px, -15px) scale(0.97);
          }
        }
        @keyframes float-reverse {
          0%,
          100% {
            transform: translate(0, 0) scale(1);
          }
          50% {
            transform: translate(20px, 15px) scale(1.08);
          }
        }
        @keyframes shake {
          0%,
          100% {
            transform: translateX(0);
          }
          10%,
          30%,
          50% {
            transform: translateX(-4px);
          }
          20%,
          40%,
          60% {
            transform: translateX(4px);
          }
          70% {
            transform: translateX(0);
          }
        }
        .animate-gradient-shift {
          animation: gradient-shift 8s ease-in-out infinite;
        }
        .animate-float-slow {
          animation: float-slow 15s ease-in-out infinite;
        }
        .animate-float-slower {
          animation: float-slower 20s ease-in-out infinite;
        }
        .animate-float-reverse {
          animation: float-reverse 12s ease-in-out infinite;
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }

        @media (prefers-reduced-motion: reduce) {
          .animate-gradient-shift,
          .animate-float-slow,
          .animate-float-slower,
          .animate-float-reverse,
          .animate-shake {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
