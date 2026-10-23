import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
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
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold text-navy-950">Manajemen {meta.label}</h1>
        <p className="mt-1.5 text-sm text-slate-600">Kelola konten portal STEP Foundation.</p>
      </div>
      <Link to={`/${entity}/create`} className="inline-flex h-11 items-center gap-2 rounded-lg bg-gold-500 px-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-gold-600">
        <Plus size={18} />
        Tambah {meta.label}
      </Link>
    </div>
    <Card className="overflow-hidden rounded-xl border-slate-200 shadow-sm"><CardContent className="p-0">
      <div className="flex flex-wrap gap-3 border-b border-slate-200 bg-navy-50/40 p-5">
        <Input aria-label={`Cari ${meta.label}`} placeholder={entity === 'news' ? 'Cari judul berita...' : 'Cari data...'} value={search} onChange={event => setSearch(event.target.value)} className="max-w-sm" />
        <Select aria-label={`Filter ${meta.filters}`} value={filter} onChange={event => setFilter(event.target.value)} className="max-w-xs">
          <option value="">Semua {meta.filters === 'status' ? 'status' : meta.filters === 'department' ? 'departemen' : 'kategori'}</option>
          {options.map(option => <option key={option} value={option}>{option}</option>)}
        </Select>
      </div>
      {query.isPending ? <LoadingState /> : query.isError ? <div className="p-6"><ErrorState message={errorMessage(query.error)} retry={() => { void query.refetch() }} /></div> : !items.length ? <p className="p-12 text-center text-slate-600">{search || filter ? 'Tidak ada hasil yang cocok.' : `Belum ada data ${meta.label}.`}</p> : <div className="overflow-x-auto"><Table>
        <TableHeader><TableRow className="bg-slate-50/60"><TableHead className="text-slate-700 font-semibold">Informasi</TableHead><TableHead className="text-slate-700 font-semibold">{entity === 'faculty' ? 'Jabatan / Departemen' : 'Kategori / Lokasi'}</TableHead><TableHead className="text-slate-700 font-semibold">{entity === 'faculty' ? 'Urutan' : entity === 'news' ? 'Tanggal terbit' : 'Status'}</TableHead><TableHead className="text-right text-slate-700 font-semibold">Tindakan</TableHead></TableRow></TableHeader>
        <TableBody>{items.map(item => <TableRow key={item.id}>
          <TableCell><div className="flex items-center gap-3">{imageUrl(item[meta.image]) && <img src={imageUrl(item[meta.image])} alt="" className="h-12 w-16 rounded-lg object-cover border border-slate-200" />}<div><p className="font-semibold text-navy-950">{label(item)}</p>{entity === 'events' && item.dateStart && <p className="text-sm text-slate-600">{new Date(item.dateStart).toLocaleString('id-ID')}</p>}{entity === 'faculty' && item.email && <p className="text-sm text-slate-600">{item.email}</p>}</div></div></TableCell>
          <TableCell className="text-slate-700">{entity === 'faculty' ? `${item.role} / ${item.department}` : item.category || item.location || '—'}</TableCell>
          <TableCell className="text-slate-700">{entity === 'faculty' ? item.order : entity === 'news' ? item.publishedAt ? new Date(item.publishedAt).toLocaleDateString('id-ID') : '—' : <span className="inline-block rounded-full border border-navy-200 bg-navy-50 px-2.5 py-0.5 text-xs font-semibold text-navy-800">{item.status}</span>}</TableCell>
          <TableCell><div className="flex justify-end gap-2"><Link className="inline-flex h-9 items-center rounded-lg border border-slate-300 bg-white px-3.5 text-xs font-semibold text-navy-950 transition-colors hover:border-gold-500 hover:bg-gold-50/40 hover:text-gold-700" to={`/${entity}/edit/${item.id}`}>Edit</Link><Button variant="outline" size="sm" className="text-red-600 hover:border-red-300 hover:bg-red-50 hover:text-red-700" disabled={remove.isPending} onClick={() => { remove.reset(); setTarget(item) }}>Hapus</Button></div></TableCell>
        </TableRow>)}</TableBody>
      </Table></div>}
    </CardContent></Card>
    <Dialog open={!!target} onOpenChange={open => { if (!open && !remove.isPending) setTarget(null) }}><DialogContent onEscapeKeyDown={event => { if (remove.isPending) event.preventDefault() }} onPointerDownOutside={event => { if (remove.isPending) event.preventDefault() }}><DialogHeader><DialogTitle>Hapus {meta.label}?</DialogTitle><DialogDescription>Data "{target ? label(target) : ''}" akan dihapus permanen.{entity === 'news' ? ' Komentar dan interaksi artikel juga akan dihapus.' : ''}</DialogDescription></DialogHeader>
      {remove.isError && <p role="alert" className="text-red-600">{errorMessage(remove.error)}</p>}
      <DialogFooter><Button variant="outline" disabled={remove.isPending} onClick={() => setTarget(null)}>Batal</Button><Button variant="destructive" disabled={remove.isPending} onClick={() => { if (target && !remove.isPending) remove.mutate(target.id) }}>{remove.isPending ? 'Menghapus...' : 'Konfirmasi hapus'}</Button></DialogFooter>
    </DialogContent></Dialog>
  </div>
}
