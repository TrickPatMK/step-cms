import { useParams, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export default function EventsForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = !!id

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">
          {isEdit ? 'Edit Event' : 'Tambah Event Baru'}
        </h1>
        <Button variant="outline" onClick={() => navigate('/events')}>
          Batal
        </Button>
      </div>
      
      <div className="bg-white p-6 rounded-md shadow-sm border">
        Form event akan dibuat di sini (berisi Title, Date, Content, dan Image upload).
      </div>
    </div>
  )
}
