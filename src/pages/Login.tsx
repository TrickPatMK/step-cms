import { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { GraduationCap, Loader2 } from 'lucide-react'
import { useAuth } from '@/lib/contexts'
import { errorMessage } from '@/lib/errors'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'

export default function Login() {
  const navigate = useNavigate()
  const auth = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      await auth.login(email, password)
      navigate('/', { replace: true })
    } catch (err: unknown) {
      setError(errorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  if (auth.user) return <Navigate to="/" replace />
  return (
    <div className="flex min-h-screen items-center justify-center bg-navy-50/70 p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-navy-950 text-gold-400 shadow-sm">
            <GraduationCap size={26} />
          </div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gold-700">STEP Semarang</p>
        </div>

        <Card className="w-full rounded-xl border-slate-200 shadow-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-navy-950">Masuk ke STEP CMS</CardTitle>
            <CardDescription className="text-slate-600">Masukkan email dan kata sandi Anda</CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              {error && (
                <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-600">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-navy-950 font-semibold">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="nama@stepsmg.ac.id"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-navy-950 font-semibold">Kata Sandi</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Masukkan kata sandi"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" variant="gold" className="w-full font-semibold" disabled={loading}>
                {loading && <Loader2 className="animate-spin" size={16} />}
                {loading ? 'Memproses...' : 'Masuk'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
