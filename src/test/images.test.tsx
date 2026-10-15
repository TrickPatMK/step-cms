import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { api } from '@/lib/api'
import { uploadImage } from '@/lib/images'
import { ImageUpload } from '@/components/ui/image-upload'
import { RichTextEditor } from '@/components/ui/rich-text-editor'
import { UploadProvider } from '@/components/upload-provider'
import { useUploads } from '@/lib/contexts'
import { NoticeProvider } from '@/components/feedback'

vi.mock('browser-image-compression', () => ({ default: vi.fn(async file => file) }))
const file = () => new File(['image'], 'image.png', { type: 'image/png' })

function Save() { const { pending } = useUploads(); return <button disabled={pending > 0}>Simpan</button> }

it('validates image formats before upload and rejects transient response URLs', async () => {
  const post = vi.spyOn(api, 'post').mockResolvedValue({ data: { url: 'blob:temporary' } })
  await expect(uploadImage(new File(['svg'], 'a.svg', { type: 'image/svg+xml' }))).rejects.toThrow('JPEG')
  expect(post).not.toHaveBeenCalled()
  await expect(uploadImage(file())).rejects.toThrow('permanen')
})

it('blocks save during an upload, then uses the permanent backend URL', async () => {
  const onChange = vi.fn()
  let resolve!: (data: { data: { url: string } }) => void
  vi.spyOn(api, 'post').mockReturnValue(new Promise(done => { resolve = done }))
  render(<NoticeProvider><UploadProvider><ImageUpload onChange={onChange} /><Save /></UploadProvider></NoticeProvider>)
  fireEvent.change(screen.getByLabelText('Pilih gambar'), { target: { files: [file()] } })
  await waitFor(() => expect(api.post).toHaveBeenCalledOnce())
  expect(screen.getByRole('button', { name: 'Simpan' })).toBeDisabled()
  resolve({ data: { url: '/uploads/permanent.png' } })
  await waitFor(() => expect(onChange).toHaveBeenCalledWith('/uploads/permanent.png'))
  expect(screen.getByRole('button', { name: 'Simpan' })).toBeEnabled()
})

it('keeps the previous image when upload fails and displays an error', async () => {
  vi.spyOn(api, 'post').mockRejectedValue(new Error('Upload failed'))
  const onChange = vi.fn()
  render(<NoticeProvider><UploadProvider><ImageUpload value="/uploads/previous.png" onChange={onChange} /><Save /></UploadProvider></NoticeProvider>)
  fireEvent.change(screen.getByLabelText('Pilih gambar'), { target: { files: [file()] } })
  expect(await screen.findByText('Upload failed')).toBeInTheDocument()
  expect(onChange).not.toHaveBeenCalled()
  expect(screen.getByAltText('Pratinjau gambar')).toHaveAttribute('src', '/uploads/previous.png')
  expect(screen.getByRole('button', { name: 'Simpan' })).toBeEnabled()
})

it('renders an uploaded image after remount from persisted form data', () => {
  const { unmount } = render(<ImageUpload value="/uploads/persisted.webp" onChange={vi.fn()} />)
  unmount()
  render(<ImageUpload value="/uploads/persisted.webp" onChange={vi.fn()} />)
  expect(screen.getByAltText('Pratinjau gambar')).toHaveAttribute('src', '/uploads/persisted.webp')
})

it('the real editor reloads formatted HTML without duplicate extensions or a change loop', async () => {
  const warn = vi.spyOn(console, 'warn')
  const onChange = vi.fn()
  const { rerender } = render(<RichTextEditor value="<p>Konten awal panjang</p>" onChange={onChange} />)
  await screen.findByRole('textbox', { name: 'Konten Berita' })
  rerender(<RichTextEditor value={'<h2>Judul</h2><p style="text-align:center"><u>Konten baru panjang</u><img src="/uploads/a.png"></p>'} onChange={onChange} />)
  await waitFor(() => expect(screen.getByRole('textbox', { name: 'Konten Berita' }).querySelector('u')).toHaveTextContent('Konten baru panjang'))
  expect(screen.getByRole('textbox', { name: 'Konten Berita' }).querySelector('img')).toHaveAttribute('src', '/uploads/a.png')
  expect(onChange).not.toHaveBeenCalled()
  expect(warn.mock.calls.flat().join(' ')).not.toContain('Duplicate extension')
})

it('the real editor does not insert a local blob when uploading fails', async () => {
  vi.spyOn(api, 'post').mockRejectedValue(new Error('Editor upload failed'))
  const onChange = vi.fn()
  const { container } = render(<NoticeProvider><UploadProvider><RichTextEditor value="<p>Konten berita panjang</p>" onChange={onChange} /><Save /></UploadProvider></NoticeProvider>)
  await screen.findByRole('textbox', { name: 'Konten Berita' })
  fireEvent.change(container.querySelector('input[type=file]')!, { target: { files: [file()] } })
  expect(await screen.findByText('Editor upload failed')).toBeInTheDocument()
  expect(screen.getByRole('textbox', { name: 'Konten Berita' }).querySelector('img')).toBeNull()
  expect(onChange).not.toHaveBeenCalled()
  expect(screen.getByRole('button', { name: 'Simpan' })).toBeEnabled()
})
