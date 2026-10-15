import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { contentApi, contentKey, contentMeta, type ContentRecord, type Entity } from '@/lib/content'
import { imageUrl } from '@/lib/images'
import { errorMessage } from '@/lib/errors'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Select } from './ui/select'
import { Card, CardContent } from './ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog'
import { ErrorState, LoadingState } from './feedback'
import { useNotice } from '@/lib/contexts'

function label(item: ContentRecord) { return item.title || item.name || item.id }

export function ContentList({ entity }: { entity: Entity }) {
  const meta = contentMeta[entity]
  const notice = useNotice()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('')
  const [target, setTarget] = useState<ContentRecord | null>(null)
  const query = useQuery({ queryKey: contentKey(entity), queryFn: ({ signal }) => contentApi.list(entity, signal) })
  const remove = useMutation({
    mutationFn: (id: string) => contentApi.remove(entity, id),
    onSuccess: async () => {
      setTarget(null)
      await queryClient.invalidateQueries({ queryKey: contentKey(entity) })
      notice(`${meta.label} berhasil dihapus.`)
    },
    onError: error => notice(errorMessage(error), 'error'),
  })
  const options = [...new Set((query.data || []).map(item => item[meta.filters]).filter((value): value is string => !!value))].sort()
  const term = search.trim().toLocaleLowerCase('id-ID')
  const items = (query.data || []).filter(item => {
    const haystack = entity === 'news' ? item.title : [item.title, item.name, item.location, item.role, item.department, item.category, item.description].filter(Boolean).join(' ')
    return (haystack || '').toLocaleLowerCase('id-ID').includes(term) && (!filter || item[meta.filters] === filter)
  })
  return <div className="space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-4"><div><h1 className="text-3xl font-extrabold text-slate-900">Manajemen {meta.label}</h1><p className="mt-2 text-slate-500">Kelola konten portal STEP Foundation.</p></div><Link to={`/${entity}/create`} className="rounded-full bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-700">Tambah {meta.label}</Link></div>
    <Card className="overflow-hidden rounded-2xl border-slate-200 shadow-sm"><CardContent className="p-0">
      <div className="flex flex-wrap gap-3 border-b bg-slate-50 p-5"><Input aria-label={`Cari ${meta.label}`} placeholder={entity === 'news' ? 'Cari judul berita...' : 'Cari data...'} value={search} onChange={event => setSearch(event.target.value)} className="max-w-sm" /><Select aria-label={`Filter ${meta.filters}`} value={filter} onChange={event => setFilter(event.target.value)} className="max-w-xs"><option value="">Semua {meta.filters === 'status' ? 'status' : meta.filters === 'department' ? 'departemen' : 'kategori'}</option>{options.map(option => <option key={option} value={option}>{option}</option>)}</Select></div>
      {query.isPending ? <LoadingState /> : query.isError ? <ErrorState message={errorMessage(query.error)} retry={() => { void query.refetch() }} /> : !items.length ? <p className="p-12 text-center text-slate-500">{search || filter ? 'Tidak ada hasil yang cocok.' : `Belum ada data ${meta.label}.`}</p> : <div className="overflow-x-auto"><Table>
        <TableHeader><TableRow><TableHead>Informasi</TableHead><TableHead>{entity === 'faculty' ? 'Jabatan / Departemen' : 'Kategori / Lokasi'}</TableHead><TableHead>{entity === 'faculty' ? 'Urutan' : entity === 'news' ? 'Tanggal terbit' : 'Status'}</TableHead><TableHead className="text-right">Tindakan</TableHead></TableRow></TableHeader>
        <TableBody>{items.map(item => <TableRow key={item.id}>
          <TableCell><div className="flex items-center gap-3">{imageUrl(item[meta.image]) && <img src={imageUrl(item[meta.image])} alt="" className="h-12 w-16 rounded-lg object-cover" />}<div><p className="font-semibold">{label(item)}</p>{entity === 'events' && item.dateStart && <p className="text-sm text-slate-500">{new Date(item.dateStart).toLocaleString('id-ID')}</p>}{entity === 'faculty' && item.email && <p className="text-sm text-slate-500">{item.email}</p>}</div></div></TableCell>
          <TableCell>{entity === 'faculty' ? `${item.role} / ${item.department}` : item.category || item.location || '—'}</TableCell>
          <TableCell>{entity === 'faculty' ? item.order : entity === 'news' ? item.publishedAt ? new Date(item.publishedAt).toLocaleDateString('id-ID') : '—' : item.status}</TableCell>
          <TableCell><div className="flex justify-end gap-2"><Link className="rounded-lg border px-3 py-2 text-sm font-medium hover:bg-slate-50" to={`/${entity}/edit/${item.id}`}>Edit</Link><Button variant="outline" className="text-red-600" disabled={remove.isPending} onClick={() => { remove.reset(); setTarget(item) }}>Hapus</Button></div></TableCell>
        </TableRow>)}</TableBody>
      </Table></div>}
    </CardContent></Card>
    <Dialog open={!!target} onOpenChange={open => { if (!open && !remove.isPending) setTarget(null) }}><DialogContent onEscapeKeyDown={event => { if (remove.isPending) event.preventDefault() }} onPointerDownOutside={event => { if (remove.isPending) event.preventDefault() }}><DialogHeader><DialogTitle>Hapus {meta.label}?</DialogTitle><DialogDescription>Data "{target ? label(target) : ''}" akan dihapus permanen.{entity === 'news' ? ' Komentar dan interaksi artikel juga akan dihapus.' : ''}</DialogDescription></DialogHeader>
      {remove.isError && <p role="alert" className="text-red-600">{errorMessage(remove.error)}</p>}
      <DialogFooter><Button variant="outline" disabled={remove.isPending} onClick={() => setTarget(null)}>Batal</Button><Button variant="destructive" disabled={remove.isPending} onClick={() => { if (target && !remove.isPending) remove.mutate(target.id) }}>{remove.isPending ? 'Menghapus...' : 'Konfirmasi hapus'}</Button></DialogFooter>
    </DialogContent></Dialog>
  </div>
}
