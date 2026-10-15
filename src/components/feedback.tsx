import { useState, type ReactNode } from 'react'
import { Button } from './ui/button'
import { NoticeContext } from '@/lib/contexts'

export function NoticeProvider({ children }: { children: ReactNode }) {
  const [notice, setNotice] = useState<{ message: string; kind: 'success' | 'error' } | null>(null)
  return <NoticeContext.Provider value={(message, kind = 'success') => setNotice({ message, kind })}>
    {children}
    {notice && <div role={notice.kind === 'error' ? 'alert' : 'status'} className={`fixed bottom-5 right-5 z-[100] max-w-md rounded-xl border p-4 shadow-lg ${notice.kind === 'error' ? 'bg-red-50 text-red-800' : 'bg-emerald-50 text-emerald-800'}`}>
      <p>{notice.message}</p><Button variant="ghost" size="sm" onClick={() => setNotice(null)}>Tutup</Button>
    </div>}
  </NoticeContext.Provider>
}

export function LoadingState({ message = 'Memuat data...' }: { message?: string }) {
  return <p role="status" className="p-10 text-center text-slate-500">{message}</p>
}

export function ErrorState({ message, retry }: { message: string; retry: () => void }) {
  return <div role="alert" className="space-y-3 rounded-xl border border-red-200 bg-red-50 p-6 text-red-800">
    <p>{message}</p><Button type="button" variant="outline" onClick={retry}>Coba lagi</Button>
  </div>
}
