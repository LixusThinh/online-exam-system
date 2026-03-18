'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function logoutAction() {
  // Option to call the backend to invalidate session (if backend stateful)
  // await fetch('http://localhost:8000/auth/logout', { method: 'POST' });

  // Delete the cookie
  const cookieStore = await cookies()
  cookieStore.delete('access_token')

  redirect('/login')
}
