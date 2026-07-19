'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Link from '@tiptap/extension-link';
import Highlight from '@tiptap/extension-highlight';
import Image from '@tiptap/extension-image';
// In Tiptap v3, all table components live in @tiptap/extension-table
import { Table, TableRow, TableHeader, TableCell } from '@tiptap/extension-table';
import { useRef } from 'react';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Highlighter,
  Link as LinkIcon,
  Link2Off,
  Image as ImageIcon,
  Table as TableIcon,
  Undo,
  Redo,
  ChevronDown,
} from 'lucide-react';

interface TiptapEditorProps {
  content: string;
  onChange: (richHtml: string) => void;
}

export default function TiptapEditor({ content, onChange }: TiptapEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        alignments: ['left', 'center', 'right', 'justify'],
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline cursor-pointer',
        },
      }),
      Highlight.configure({ multicolor: false }),
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto mx-auto my-4 block',
        },
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  if (!editor) {
    return null;
  }

  // Image Upload handler — routes through /api/upload for auth + validation
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const json = await res.json();

      if (!res.ok) throw new Error(json.error || 'Upload gagal.');

      editor?.chain().focus().setImage({ src: json.url }).run();
    } catch (error) {
      console.warn('Upload failed, using local base64 fallback:', error);

      // Fallback: base64 untuk preview lokal
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          editor?.chain().focus().setImage({ src: reader.result }).run();
        }
      };
      reader.readAsDataURL(file);
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const addLink = () => {
    const url = window.prompt('Masukkan URL tautan:');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  return (
    <div className="border border-border flex flex-col bg-card">
      {/* Hidden file input for editor images */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageFileChange}
        accept="image/*"
        className="hidden"
      />

      {/* MS Word style Toolbar */}
      <div className="flex flex-wrap items-center gap-1.5 p-2 bg-secondary/40 border-b border-border text-foreground select-none">
        {/* Undo / Redo */}
        <div className="flex items-center gap-0.5 border-r border-border pr-1.5">
          <button
            type="button"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            className="p-1.5 hover:bg-secondary rounded-none disabled:opacity-40 transition-colors"
            title="Undo"
          >
            <Undo className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            className="p-1.5 hover:bg-secondary rounded-none disabled:opacity-40 transition-colors"
            title="Redo"
          >
            <Redo className="w-4 h-4" />
          </button>
        </div>

        {/* Headings */}
        <div className="flex items-center gap-0.5 border-r border-border pr-1.5">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={`p-1.5 rounded-none transition-colors ${
              editor.isActive('heading', { level: 1 }) ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'
            }`}
            title="Heading 1"
          >
            <Heading1 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`p-1.5 rounded-none transition-colors ${
              editor.isActive('heading', { level: 2 }) ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'
            }`}
            title="Heading 2"
          >
            <Heading2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={`p-1.5 rounded-none transition-colors ${
              editor.isActive('heading', { level: 3 }) ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'
            }`}
            title="Heading 3"
          >
            <Heading3 className="w-4 h-4" />
          </button>
        </div>

        {/* Text Formats */}
        <div className="flex items-center gap-0.5 border-r border-border pr-1.5">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-1.5 rounded-none transition-colors ${
              editor.isActive('bold') ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'
            }`}
            title="Tebal (Ctrl+B)"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-1.5 rounded-none transition-colors ${
              editor.isActive('italic') ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'
            }`}
            title="Miring (Ctrl+I)"
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`p-1.5 rounded-none transition-colors ${
              editor.isActive('underline') ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'
            }`}
            title="Garis Bawah (Ctrl+U)"
          >
            <UnderlineIcon className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`p-1.5 rounded-none transition-colors ${
              editor.isActive('strike') ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'
            }`}
            title="Coret"
          >
            <Strikethrough className="w-4 h-4" />
          </button>
        </div>

        {/* Alignment */}
        <div className="flex items-center gap-0.5 border-r border-border pr-1.5">
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            className={`p-1.5 rounded-none transition-colors ${
              editor.isActive({ textAlign: 'left' }) ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'
            }`}
            title="Rata Kiri"
          >
            <AlignLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            className={`p-1.5 rounded-none transition-colors ${
              editor.isActive({ textAlign: 'center' }) ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'
            }`}
            title="Rata Tengah"
          >
            <AlignCenter className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            className={`p-1.5 rounded-none transition-colors ${
              editor.isActive({ textAlign: 'right' }) ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'
            }`}
            title="Rata Kanan"
          >
            <AlignRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign('justify').run()}
            className={`p-1.5 rounded-none transition-colors ${
              editor.isActive({ textAlign: 'justify' }) ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'
            }`}
            title="Rata Kiri Kanan"
          >
            <AlignJustify className="w-4 h-4" />
          </button>
        </div>

        {/* Lists & Quotes */}
        <div className="flex items-center gap-0.5 border-r border-border pr-1.5">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-1.5 rounded-none transition-colors ${
              editor.isActive('bulletList') ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'
            }`}
            title="Daftar Simbol"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`p-1.5 rounded-none transition-colors ${
              editor.isActive('orderedList') ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'
            }`}
            title="Daftar Angka"
          >
            <ListOrdered className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`p-1.5 rounded-none transition-colors ${
              editor.isActive('blockquote') ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'
            }`}
            title="Kutipan"
          >
            <Quote className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHighlight().run()}
            className={`p-1.5 rounded-none transition-colors ${
              editor.isActive('highlight') ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'
            }`}
            title="Stabilo / Highlight"
          >
            <Highlighter className="w-4 h-4" />
          </button>
        </div>

        {/* Hyperlink / Image */}
        <div className="flex items-center gap-0.5 border-r border-border pr-1.5">
          <button
            type="button"
            onClick={addLink}
            className={`p-1.5 rounded-none transition-colors ${
              editor.isActive('link') ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'
            }`}
            title="Tambah Link"
          >
            <LinkIcon className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().unsetLink().run()}
            disabled={!editor.isActive('link')}
            className="p-1.5 hover:bg-secondary rounded-none disabled:opacity-40 transition-colors"
            title="Hapus Link"
          >
            <Link2Off className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-1.5 hover:bg-secondary rounded-none transition-colors"
            title="Sisipkan Foto"
          >
            <ImageIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Table Management */}
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
            className="p-1.5 hover:bg-secondary rounded-none transition-colors"
            title="Sisipkan Tabel (3x3)"
          >
            <TableIcon className="w-4 h-4" />
          </button>
          {editor.isActive('table') && (
            <div className="flex items-center gap-0.5 animate-in fade-in duration-200">
              <button
                type="button"
                onClick={() => editor.chain().focus().addColumnBefore().run()}
                className="px-1.5 py-1 text-[10px] font-bold uppercase bg-secondary hover:bg-secondary-foreground hover:text-secondary transition-colors"
              >
                + Kolom
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().addRowBefore().run()}
                className="px-1.5 py-1 text-[10px] font-bold uppercase bg-secondary hover:bg-secondary-foreground hover:text-secondary transition-colors"
              >
                + Baris
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().deleteTable().run()}
                className="px-1.5 py-1 text-[10px] font-bold uppercase bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
              >
                Hapus Tabel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Editor Content Area */}
      <div className="bg-card min-h-[400px] border-t border-border focus-within:ring-1 focus-within:ring-primary">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
