import { useState } from 'react'
import { Button } from './button'
import { UploadCloud } from 'lucide-react'
import { IMAGE_ACCEPT, imageUrl, uploadImage } from '@/lib/images'
import { useNotice, useUploads } from '@/lib/contexts'
import { errorMessage } from '@/lib/errors'

interface ImageUploadProps { value?: string; onChange: (url: string) => void }

export function ImageUpload({ value, onChange }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const notice = useNotice()
  const uploads = useUploads()
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget
    const file = input.files?.[0]
    if (!file) return
    const finish = uploads.begin()
    setIsUploading(true)
    try { onChange(await uploadImage(file)) }
    catch (error) { notice(errorMessage(error), 'error') }
    finally { finish(); setIsUploading(false); input.value = '' }
  }
  return <div className="space-y-3">
    {value && imageUrl(value) && <img className="aspect-video w-full max-w-sm rounded-xl border object-cover" src={imageUrl(value)} alt="Pratinjau gambar" />}
    <div className="rounded-xl border-2 border-dashed bg-slate-50 p-5">
      <UploadCloud className="mb-2 text-slate-400" size={28} />
      <label className="block space-y-2 text-sm font-medium"><span>{isUploading ? 'Mengunggah gambar...' : 'Pilih gambar (JPEG, PNG, WebP; dikompres hingga 1 MB)'}</span><input aria-label="Pilih gambar" type="file" accept={IMAGE_ACCEPT} onChange={handleFileChange} disabled={isUploading} className="block max-w-full text-sm" /></label>
    </div>
    {value && <Button type="button" variant="outline" disabled={isUploading} onClick={() => onChange('')}>Hapus gambar</Button>}
  </div>
}
