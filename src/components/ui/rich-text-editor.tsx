import { useEffect, useRef, useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import TextAlign from '@tiptap/extension-text-align'
import { Button } from './button'
import { 
  Bold, Italic, Underline as UnderlineIcon, List, ListOrdered, 
  Heading2, Heading3, Link as LinkIcon, Image as ImageIcon, 
  Quote, AlignLeft, AlignCenter, AlignRight, AlignJustify
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { IMAGE_ACCEPT, imageUrl, uploadImage, editorImageUrls } from '@/lib/images'
import { useUploads, useNotice } from '@/lib/contexts'
import { errorMessage } from '@/lib/errors'

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
}

export function RichTextEditor({ value, onChange }: RichTextEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const uploads = useUploads()
  const notice = useNotice()

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ link: { openOnClick: false } }),
      Image.configure({
        inline: true,
        allowBase64: false,
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
    ],
    content: editorImageUrls(value),
    editorProps: {
      attributes: {
        role: 'textbox',
        'aria-label': 'Konten Berita',
        'aria-multiline': 'true',
        class: 'prose prose-sm sm:prose lg:prose-lg mx-auto focus:outline-none min-h-[300px] p-4 max-w-none',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
  })

  useEffect(() => {
    const html = editorImageUrls(value)
    if (editor && html !== editor.getHTML()) {
      editor.commands.setContent(html, { emitUpdate: false })
    }
  }, [value, editor])

  if (!editor) {
    return null
  }

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href
    const url = window.prompt('URL', previousUrl)
    if (url === null) return
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.currentTarget
    const file = input.files?.[0]
    if (!file) return
    const finish = uploads.begin()
    setIsUploading(true)
    try {
      const targetUrl = imageUrl(await uploadImage(file))
      if (!editor.isDestroyed) editor.chain().focus().setImage({ src: targetUrl }).run()
    } catch (error) {
      notice(errorMessage(error), 'error')
    } finally {
      finish()
      setIsUploading(false)
      input.value = ''
    }
  }

  return (
    <div className="border rounded-md shadow-sm overflow-hidden bg-white">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 border-b p-2 bg-slate-50">
        <Button
          type="button" variant="ghost" size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={cn(editor.isActive('bold') ? 'bg-slate-200' : '')}
          title="Bold"
        >
          <Bold size={16} />
        </Button>
        <Button
          type="button" variant="ghost" size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={cn(editor.isActive('italic') ? 'bg-slate-200' : '')}
          title="Italic"
        >
          <Italic size={16} />
        </Button>
        <Button
          type="button" variant="ghost" size="sm"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={cn(editor.isActive('underline') ? 'bg-slate-200' : '')}
          title="Underline"
        >
          <UnderlineIcon size={16} />
        </Button>
        
        <div className="w-px h-6 bg-slate-300 mx-1" />

        <Button
          type="button" variant="ghost" size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={cn(editor.isActive('heading', { level: 2 }) ? 'bg-slate-200' : '')}
          title="Heading 2"
        >
          <Heading2 size={16} />
        </Button>
        <Button
          type="button" variant="ghost" size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={cn(editor.isActive('heading', { level: 3 }) ? 'bg-slate-200' : '')}
          title="Heading 3"
        >
          <Heading3 size={16} />
        </Button>

        <div className="w-px h-6 bg-slate-300 mx-1" />

        <Button
          type="button" variant="ghost" size="sm"
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          className={cn(editor.isActive({ textAlign: 'left' }) ? 'bg-slate-200' : '')}
          title="Align Left"
        >
          <AlignLeft size={16} />
        </Button>
        <Button
          type="button" variant="ghost" size="sm"
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          className={cn(editor.isActive({ textAlign: 'center' }) ? 'bg-slate-200' : '')}
          title="Align Center"
        >
          <AlignCenter size={16} />
        </Button>
        <Button
          type="button" variant="ghost" size="sm"
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          className={cn(editor.isActive({ textAlign: 'right' }) ? 'bg-slate-200' : '')}
          title="Align Right"
        >
          <AlignRight size={16} />
        </Button>
        <Button
          type="button" variant="ghost" size="sm"
          onClick={() => editor.chain().focus().setTextAlign('justify').run()}
          className={cn(editor.isActive({ textAlign: 'justify' }) ? 'bg-slate-200' : '')}
          title="Align Justify"
        >
          <AlignJustify size={16} />
        </Button>

        <div className="w-px h-6 bg-slate-300 mx-1" />

        <Button
          type="button" variant="ghost" size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={cn(editor.isActive('bulletList') ? 'bg-slate-200' : '')}
          title="Bullet List"
        >
          <List size={16} />
        </Button>
        <Button
          type="button" variant="ghost" size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={cn(editor.isActive('orderedList') ? 'bg-slate-200' : '')}
          title="Numbered List"
        >
          <ListOrdered size={16} />
        </Button>

        <div className="w-px h-6 bg-slate-300 mx-1" />

        <Button
          type="button" variant="ghost" size="sm"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={cn(editor.isActive('blockquote') ? 'bg-slate-200' : '')}
          title="Quote"
        >
          <Quote size={16} />
        </Button>
        <Button
          type="button" variant="ghost" size="sm"
          onClick={setLink}
          className={cn(editor.isActive('link') ? 'bg-slate-200' : '')}
          title="Insert Link"
        >
          <LinkIcon size={16} />
        </Button>

        {/* Tombol Upload Gambar Dalam Konten */}
        <div className="relative">
          <Button
            type="button" variant="ghost" size="sm"
            onClick={() => fileInputRef.current?.click()}
            title="Insert Image"
            disabled={isUploading}
            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
          >
            <ImageIcon size={16} />
          </Button>
          <input
            type="file"
            accept={IMAGE_ACCEPT}
            disabled={isUploading}
            ref={fileInputRef}
            onChange={handleImageUpload}
            className="hidden"
          />
        </div>

      </div>
      
      {/* Area Mengetik */}
      <EditorContent editor={editor} />
    </div>
  )
}
