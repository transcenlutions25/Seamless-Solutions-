import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export default async function HomePage() {
  // For now, redirect to dashboard
  // In a real app, you might want to show a landing page for unauthenticated users
  redirect('/dashboard')
}
