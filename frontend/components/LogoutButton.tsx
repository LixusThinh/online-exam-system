'use client'

import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'
import { logoutAction } from '@/actions/auth'

export default function LogoutButton() {
  const [isPending, startTransition] = useTransition()

  const handleLogout = () => {
    startTransition(async () => {
      await logoutAction()
    })
  }

  return (
    <Button 
      variant="destructive" 
      onClick={handleLogout} 
      disabled={isPending}
      className="flex items-center gap-2"
    >
      <LogOut className="w-4 h-4" />
      {isPending ? "Đang đăng xuất..." : "Đăng xuất"}
    </Button>
  )
}
