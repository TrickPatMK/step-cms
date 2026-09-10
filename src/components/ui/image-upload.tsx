import { useState } from 'react'
import { Button } from './button'
import { UploadCloud, X, Loader2 } from 'lucide-react'
import imageCompression from 'browser-image-compression'
import { api } from '@/lib/api'

interface ImageUploadProps {
  value?: string
  onChange: (url: string) => void
}

export function ImageUpload({ value, onChange }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [localUrl, setLocalUrl] = useState<string | null>(null)

  const preview = localUrl !== null ? localUrl : (value || null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setIsUploading(true)

      // Compress image
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      }
      const compressedFile = await imageCompression(file, options)

      // Real API upload call
      const formData = new FormData()
      formData.append('file', compressedFile)
      
      const res = await api.post('/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      
      const imageUrl = res.data?.url || ''
      setLocalUrl(imageUrl)
      onChange(imageUrl)
    } catch (error: any) {
      console.error('Error uploading image:', error)
      const message = error.response?.data?.message || 'Gagal mengupload gambar'
      alert(message)
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemove = () => {
    setLocalUrl('')
    onChange('')
  }

  const displayUrl = preview
    ? (preview.startsWith('blob:') || preview.startsWith('http') || preview.startsWith('data:')
        ? preview
        : `http://localhost:8000${preview.startsWith('/') ? '' : '/'}${preview}`)
    : ''

  return (
    <div className="space-y-4 w-full">
      {preview ? (
        <div className="relative rounded-md overflow-hidden border aspect-video max-w-sm">
          <img src={displayUrl} alt="Upload preview" className="object-cover w-full h-full" />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2"
            onClick={handleRemove}
          >
            <X size={16} />
          </Button>
        </div>
      ) : (
        <div className="border-2 border-dashed rounded-md p-8 flex flex-col items-center justify-center text-slate-500 bg-slate-50 max-w-sm hover:bg-slate-100 transition-colors">
          <UploadCloud size={40} className="mb-2 text-slate-400" />
          <p className="text-sm font-medium mb-1">Upload Gambar</p>
          <p className="text-xs text-slate-400 mb-4">PNG, JPG up to 1MB</p>
          <div className="relative">
            <Button type="button" variant="outline" disabled={isUploading}>
              {isUploading ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
              Pilih File
            </Button>
            <input
              type="file"
              accept="image/*"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={handleFileChange}
              disabled={isUploading}
            />
          </div>
        </div>
      )}
    </div>
  )
}
