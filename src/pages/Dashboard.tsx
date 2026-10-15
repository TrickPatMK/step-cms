import { useQueries } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { contentApi, contentKey, contentMeta, entities } from '@/lib/content'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ErrorState } from '@/components/feedback'
import { errorMessage } from '@/lib/errors'

export default function Dashboard() {
  const results = useQueries({ queries: entities.map(entity => ({ queryKey: contentKey(entity), queryFn: ({ signal }: { signal: AbortSignal }) => contentApi.list(entity, signal) })) })
  return <div className="space-y-8">
    <div><h1 className="text-3xl font-extrabold text-slate-900">Dashboard Utama</h1><p className="mt-2 text-slate-500">Ringkasan konten portal STEP Foundation.</p></div>
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
      {entities.map((entity, index) => {
        const result = results[index]
        return <Card key={entity} className="rounded-2xl border-slate-200 shadow-sm">
          <CardHeader><CardTitle className="text-base">Total {contentMeta[entity].label}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {result.isPending ? <p role="status">Memuat...</p> : result.isError ? <ErrorState message={errorMessage(result.error)} retry={() => { void result.refetch() }} /> : <p className="text-5xl font-black text-slate-800">{result.data.length}</p>}
            <Link className="inline-block font-semibold text-indigo-600 hover:underline" to={`/${entity}`}>Kelola {contentMeta[entity].label}</Link>
          </CardContent>
        </Card>
      })}
    </div>
  </div>
}
