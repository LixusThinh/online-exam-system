import { cookies } from 'next/headers'
import LogoutButton from '@/components/LogoutButton'
import { Button } from '@/components/ui/button'
import { redirect } from 'next/navigation'
import * as jwt from 'jsonwebtoken'

export const dynamic = 'force-dynamic'

// 1. Phải thêm chữ 'async' vào đây
async function getCurrentUser() {
  // 2. Phải thêm chữ 'await' ở đây
  const cookieStore = await cookies()
  const token = cookieStore.get('access_token')?.value

  // For testing when the token might be named differently in the dummy login
  const dummyToken = cookieStore.get('token')?.value

  if (!token && !dummyToken) return null

  // Try to decode real token or fallback to a dummy user
  if (token) {
    try {
      const decoded = jwt.decode(token) as { role: string; sub: string }
      return { username: decoded.sub, role: decoded.role }
    } catch (error) {
      return null
    }
  }

  // Fallback for UI if real token doesn't exist yet but user is "logged in" with a dummy token
  return { username: "teacher123", role: "teacher" } // Dùng cho testing
}

// 3. Component chính cũng phải là 'async'
export default async function DashboardPage() {
  // 4. Phải 'await' cái hàm lấy user
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  const isStudent = user.role === "student"

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar Layout */}
      <aside className="w-72 bg-slate-900 text-white flex flex-col shadow-2xl z-10">
        <div className="p-6 border-b border-slate-800/50">
          <h2 className="text-2xl font-bold tracking-tighter text-blue-400">Azota Clone</h2>
        </div>
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          <div className="px-4 py-3 bg-blue-600/10 text-blue-400 rounded-lg text-sm font-semibold shadow-inner border border-blue-500/20">
            Dashboard
          </div>
          <div className="px-4 py-3 hover:bg-slate-800/50 rounded-lg text-sm font-medium cursor-pointer transition-all hover:translate-x-1 duration-200">
            Ngân hàng Đề thi
          </div>
          <div className="px-4 py-3 hover:bg-slate-800/50 rounded-lg text-sm font-medium cursor-pointer transition-all hover:translate-x-1 duration-200">
            Kết quả của Học sinh
          </div>
        </nav>
        <div className="p-4 border-t border-slate-800/50">
          <LogoutButton />
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center justify-center p-8 bg-white/50 relative overflow-hidden overflow-y-auto">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 opacity-40 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-100 blur-3xl"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-50 blur-3xl"></div>
        </div>

        <div className="text-center space-y-6 max-w-3xl animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out mb-12">
          <h1 className="text-5xl md:text-6xl font-extrabold text-slate-800 tracking-tight leading-tight">
            Chào mừng {isStudent ? "học sinh " : "giáo viên "} <br />
            <span className="text-blue-600 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-500">
              {user.username}!
            </span>
          </h1>
          <p className="text-slate-500 text-xl font-medium max-w-xl mx-auto leading-relaxed">
            Role hiện tại của bạn: <span className="font-bold text-indigo-600">{user.role}</span>
          </p>
        </div>

        <div className="grid gap-6 w-full max-w-4xl grid-cols-1 md:grid-cols-2">
          {/* Nút này sẽ KHÔNG HIỂN THỊ nếu user là student */}
          {!isStudent && (
            <div className="p-6 border rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow">
              <h2 className="text-xl font-semibold mb-2">Quản lý lớp học</h2>
              <p className="text-slate-500 mb-6 text-sm">
                Khu vực dành riêng cho Giáo viên và Quản trị viên. Quản lý danh sách học sinh.
              </p>
              <Button>+ Tạo Profile Học Sinh Mới</Button>
            </div>
          )}

          {/* Khu vực chung ai cũng thấy */}
          <div className="p-6 border rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow">
            <h2 className="text-xl font-semibold mb-2">Bài tập của tôi</h2>
            <p className="text-slate-500 text-sm mb-6">
              Danh sách bài tập và đề thi online. Tham gia và xem kết quả.
            </p>
            <Button variant="outline">Xem danh sách đề thi</Button>
          </div>
        </div>
      </main>
    </div>
  )
}