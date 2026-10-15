import { useState, type ReactNode } from 'react'
import { UploadContext } from '@/lib/contexts'

export function UploadProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState(0)
  const begin = () => {
    setPending(count => count + 1)
    let finished = false
    return () => { if (!finished) { finished = true; setPending(count => Math.max(0, count - 1)) } }
  }
  return <UploadContext.Provider value={{ pending, begin }}>{children}</UploadContext.Provider>
}
