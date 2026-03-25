"use client";

import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar Layout */}
      <aside className="w-72 bg-slate-900 text-white flex flex-col shadow-2xl z-10">
        <div className="p-6 border-b border-slate-800/50">
          <h2 className="text-2xl font-bold tracking-tighter text-blue-400">SKY-EXAM</h2>
        </div>
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          <div className="px-4 py-3 bg-blue-600/10 text-blue-400 rounded-lg text-sm font-semibold shadow-inner border border-blue-500/20">
            Dashboard
          </div>
          <div className="px-4 py-3 hover:bg-slate-800/50 rounded-lg text-sm font-medium cursor-pointer transition-all hover:translate-x-1 duration-200">
            Quản lý Lớp học
          </div>
          <div className="px-4 py-3 hover:bg-slate-800/50 rounded-lg text-sm font-medium cursor-pointer transition-all hover:translate-x-1 duration-200">
            Ngân hàng Đề thi
          </div>
          <div className="px-4 py-3 hover:bg-slate-800/50 rounded-lg text-sm font-medium cursor-pointer transition-all hover:translate-x-1 duration-200">
            Kết quả của Học sinh
          </div>
        </nav>
        <div className="p-4 border-t border-slate-800/50">
          <div className="px-4 py-3 hover:bg-red-500/10 rounded-lg text-sm font-medium text-red-400 cursor-pointer transition-all hover:text-red-300">
            Đăng xuất
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center p-8 bg-white/50 relative overflow-hidden">
        {/* Abstract background blobs */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 opacity-40">
           <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-100 blur-3xl"></div>
           <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-50 blur-3xl"></div>
        </div>
        
        <div className="text-center space-y-6 max-w-3xl animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out">
          <h1 className="text-5xl md:text-6xl font-extrabold text-slate-800 tracking-tight leading-tight">
            Chào mừng giáo viên <br /> <span className="text-blue-600 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-500">quay trở lại!</span>
          </h1>
          <p className="text-slate-500 text-xl font-medium max-w-xl mx-auto leading-relaxed">
            Từ đây, bạn có thể thiết lập đề thi, kiểm tra kết quả và quản lý lớp học một cách trực quan và dễ dàng.
          </p>
          <div className="pt-6">
            <Button size="lg" className="rounded-full px-8 py-6 text-lg shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              Tạo đề thi mới ngay
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
