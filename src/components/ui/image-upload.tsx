import { useState } from 'react'
import { Button } from './button'
import { UploadCloud, X, Loader2 } from 'lucide-react'
import imageCompression from 'browser-image-compression'

interface ImageUploadProps {
  value?: string
  onChange: (url: string) => void
}

export function ImageUpload({ value, onChange }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(value || null)

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

      // Upload logic (simulated for now, replace with actual API endpoint)
      const formData = new FormData()
      formData.append('file', compressedFile)
      
      // Simulate API call
      // const res = await api.post('/upload', formData)
      // const imageUrl = res.data.url
      
      // Temporary simulated URL using object URL
      const temporaryUrl = URL.createObjectURL(compressedFile)
      setPreview(temporaryUrl)
      onChange(temporaryUrl) // Should be imageUrl from API
      
    } catch (error) {
      console.error('Error uploading image:', error)
      alert('Gagal mengupload gambar')
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemove = () => {
    setPreview(null)
    onChange('')
  }

  return (
    <div className="space-y-4 w-full">
      {preview ? (
        <div className="relative rounded-md overflow-hidden border aspect-video max-w-sm">
          <img src={preview} alt="Upload preview" className="object-cover w-full h-full" />
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
