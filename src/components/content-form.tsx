import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { contentApi, contentKey, contentMeta, detailKey, type Entity } from '@/lib/content'
import { editorDefaults, editorPayload, editorSchema, type EditorField, type EditorValues } from '@/lib/editor'
import { errorMessage } from '@/lib/errors'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { Select } from './ui/select'
import { ImageUpload } from './ui/image-upload'
import { RichTextEditor } from './ui/rich-text-editor'
import { Card, CardContent } from './ui/card'
import { ErrorState, LoadingState } from './feedback'
import { UploadProvider } from './upload-provider'
import { useNotice, useUploads } from '@/lib/contexts'

interface Field { name: EditorField; label: string; type?: 'textarea' | 'number' | 'email' | 'datetime-local' }
const fields: Record<Entity, Field[]> = {
  news: [{ name: 'title', label: 'Judul Berita' }, { name: 'category', label: 'Kategori' }, { name: 'tags', label: 'Tags (pisahkan dengan koma)' }],
  events: [{ name: 'title', label: 'Judul Event' }, { name: 'description', label: 'Deskripsi', type: 'textarea' }, { name: 'dateStart', label: 'Tanggal dan jam mulai', type: 'datetime-local' }, { name: 'dateEnd', label: 'Tanggal dan jam akhir (opsional)', type: 'datetime-local' }, { name: 'location', label: 'Lokasi' }],
  faculty: [{ name: 'name', label: 'Nama' }, { name: 'role', label: 'Jabatan' }, { name: 'department', label: 'Departemen / Program Studi' }, { name: 'email', label: 'Email (opsional)', type: 'email' }, { name: 'bio', label: 'Biografi (opsional)', type: 'textarea' }, { name: 'order', label: 'Urutan tampil', type: 'number' }],
  facilities: [{ name: 'name', label: 'Nama Fasilitas' }, { name: 'description', label: 'Deskripsi', type: 'textarea' }, { name: 'category', label: 'Kategori' }, { name: 'location', label: 'Lokasi (opsional)' }],
}

function EditorForm({ entity }: { entity: Entity }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const notice = useNotice()
  const uploads = useUploads()
  const meta = contentMeta[entity]
  const form = useForm<EditorValues>({ resolver: zodResolver(editorSchema(entity)), defaultValues: editorDefaults(entity) })
  const detail = useQuery({ queryKey: detailKey(entity, id || ''), enabled: !!id, queryFn: ({ signal }) => contentApi.detail(entity, id!, signal) })
  useEffect(() => { form.reset(editorDefaults(entity, detail.data)) }, [detail.data, entity, id, form])
  const save = useMutation({
    mutationFn: (values: EditorValues) => contentApi.save(entity, editorPayload(entity, values), id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: contentKey(entity) })
      notice(`${meta.label} berhasil ${id ? 'diperbarui' : 'ditambahkan'}.`)
      navigate(`/${entity}`)
    },
    onError: error => notice(errorMessage(error), 'error'),
  })
  if (id && detail.isPending) return <LoadingState message="Memuat formulir..." />
  if (id && detail.isError) return <ErrorState message={errorMessage(detail.error)} retry={() => { void detail.refetch() }} />
  const disabled = save.isPending || uploads.pending > 0
  return <div className="mx-auto max-w-5xl space-y-6">
    <div className="flex flex-wrap items-center gap-4"><Link to={`/${entity}`} className="text-indigo-600 hover:underline">Kembali ke daftar</Link><h1 className="text-3xl font-bold">{id ? 'Edit' : 'Tambah'} {meta.label}</h1></div>
    <Card className="rounded-2xl"><CardContent className="p-6">
      <form noValidate onSubmit={form.handleSubmit(values => { if (!uploads.pending && !save.isPending) save.mutate(values) })} className="space-y-6">
        <fieldset disabled={save.isPending} className="grid min-w-0 gap-5 sm:grid-cols-2">
          {fields[entity].map(field => <div key={field.name} className={field.type === 'textarea' ? 'space-y-2 sm:col-span-2' : 'space-y-2'}>
            <label htmlFor={field.name} className="block text-sm font-semibold">{field.label}</label>
            {field.type === 'textarea' ? <Textarea id={field.name} rows={5} aria-invalid={!!form.formState.errors[field.name]} aria-describedby={`${field.name}-error`} {...form.register(field.name)} /> : <Input id={field.name} type={field.type || 'text'} step={field.type === 'number' ? 1 : undefined} min={field.type === 'number' ? 0 : undefined} aria-invalid={!!form.formState.errors[field.name]} aria-describedby={`${field.name}-error`} {...form.register(field.name)} />}
            {form.formState.errors[field.name] && <p id={`${field.name}-error`} role="alert" className="text-sm text-red-600">{form.formState.errors[field.name]?.message}</p>}
          </div>)}
          {(entity === 'events' || entity === 'facilities') && <div className="space-y-2"><label htmlFor="status" className="block text-sm font-semibold">Status</label><Select id="status" {...form.register('status')}>
            {(entity === 'events' ? ['draft', 'published', 'archived'] : ['available', 'maintenance', 'closed']).map(status => <option key={status} value={status}>{status}</option>)}
          </Select>{form.formState.errors.status && <p role="alert" className="text-sm text-red-600">{form.formState.errors.status.message}</p>}</div>}
          {entity === 'news' && <div className="space-y-2 sm:col-span-2"><label className="block text-sm font-semibold">Konten Berita</label><Controller control={form.control} name="content" render={({ field }) => <RichTextEditor value={field.value} onChange={field.onChange} />} />{form.formState.errors.content && <p role="alert" className="text-sm text-red-600">{form.formState.errors.content.message}</p>}</div>}
          <div className="space-y-2 sm:col-span-2"><p className="text-sm font-semibold">{entity === 'faculty' ? 'Foto profil' : entity === 'events' ? 'Flyer' : 'Gambar'}</p><Controller control={form.control} name={meta.image} render={({ field }) => <ImageUpload value={field.value} onChange={field.onChange} />} /></div>
        </fieldset>
        {save.isError && <p role="alert" className="text-red-600">{errorMessage(save.error)}</p>}
        <Button className="bg-indigo-600 hover:bg-indigo-700" type="submit" disabled={disabled}>{uploads.pending ? 'Menunggu upload...' : save.isPending ? 'Menyimpan...' : 'Simpan'}</Button>
      </form>
    </CardContent></Card>
  </div>
}

export function ContentForm({ entity }: { entity: Entity }) { return <UploadProvider><EditorForm entity={entity} /></UploadProvider> }
