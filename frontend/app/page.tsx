import Link from "next/link";
import { GraduationCap, ArrowRight, ShieldCheck, BookOpenCheck, Sparkles } from "lucide-react";

export default function Home() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#042F2E]">
      {/* Background effects */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-[#0D9488]/15 blur-[120px]" />
        <div className="absolute bottom-[-15%] right-[-10%] w-[500px] h-[500px] rounded-full bg-[#2DD4BF]/10 blur-[100px]" />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-8">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-[#0D9488] to-[#2DD4BF] shadow-2xl shadow-teal-500/30 ring-1 ring-white/10">
          <GraduationCap className="w-10 h-10 text-white" />
        </div>

        <div className="text-center space-y-3">
          <h1 className="text-5xl font-extrabold tracking-tight text-white font-mono">
            SKY<span className="text-[#2DD4BF]">-EXAM</span>
          </h1>
          <p className="text-[#99F6E4]/40 text-sm font-medium max-w-sm mx-auto">
            Hệ thống kiểm tra trực tuyến thế hệ mới — Bảo mật, chính xác, hiện đại.
          </p>
        </div>

        <Link href="/login">
          <button className="group relative flex items-center gap-2.5 px-8 py-4 rounded-2xl bg-gradient-to-r from-[#0D9488] to-[#0F766E] text-white font-bold text-base shadow-2xl shadow-teal-500/20 hover:shadow-teal-500/30 transition-all duration-300 cursor-pointer overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-[#2DD4BF]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <span className="relative z-10">Đăng nhập ngay</span>
            <ArrowRight className="relative z-10 w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
          </button>
        </Link>

        <div className="flex items-center gap-6 text-[10px] uppercase tracking-widest text-white/15 font-semibold mt-4">
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
    </main>
  );
}
