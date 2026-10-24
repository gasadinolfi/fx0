import { Suspense } from 'react'
import { connection } from 'next/server'
import { redirect } from 'next/navigation'
import { requireUserSession } from '@/lib/auth'
import { AuthError } from '@/lib/accounts'
import ChatPage from '@/components/chat-page'
import { Skeleton } from '@/components/ui/skeleton'

export const metadata = { title: 'GB · Mesa de trabajo', description: 'Diseño y comunicación de Bengochea' }
async function PrivateWorkbench({ searchParams }: { searchParams: Promise<{ s?: string | string[] }> }) {
  await connection()
  try { await requireUserSession() } catch (error) {
    if (error instanceof AuthError && error.status === 401) redirect('/login')
    throw error
  }
  return <ChatPage searchParams={searchParams} gb />
}
export default function GbPage({ searchParams }: { searchParams: Promise<{ s?: string | string[] }> }) {
  return <Suspense fallback={<main className="flex h-dvh items-center justify-center bg-background"><Skeleton className="h-12 w-64" /><span className="sr-only">Abriendo la mesa de GB…</span></main>}><PrivateWorkbench searchParams={searchParams} /></Suspense>
}
