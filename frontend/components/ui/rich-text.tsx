import { EditorContent, useEditor } from "@tiptap/react"
import { useMemo } from "react"
import StarterKit from "@tiptap/starter-kit"
import Typography from "@tiptap/extension-typography"
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight"
import { common, createLowlight } from "lowlight"
import { Bold, Italic, List, ListOrdered, Code, Quote } from "lucide-react"
import { Button } from "./button"

type RichTextProps = {
  value?: string
  onChange?: (val: string) => void
}

export function RichText({ value, onChange }: RichTextProps) {
  const lowlight = useMemo(() => createLowlight(common), [])
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
      }),
      Typography,
      CodeBlockLowlight.configure({ lowlight }),
    ],
    content: value || "",
    onUpdate: ({ editor }) => onChange?.(editor.getHTML()),
    immediatelyRender: false,
  })

  if (!editor) return null

  const toggle = (action: () => void) => () => action()

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1">
        <Button size="sm" variant="outline" type="button" onClick={toggle(() => editor.chain().focus().toggleBold().run())}>
          <Bold className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="outline" type="button" onClick={toggle(() => editor.chain().focus().toggleItalic().run())}>
          <Italic className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="outline" type="button" onClick={toggle(() => editor.chain().focus().toggleBulletList().run())}>
          <List className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="outline" type="button" onClick={toggle(() => editor.chain().focus().toggleOrderedList().run())}>
          <ListOrdered className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="outline" type="button" onClick={toggle(() => editor.chain().focus().toggleCodeBlock().run())}>
          <Code className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="outline" type="button" onClick={toggle(() => editor.chain().focus().toggleBlockquote().run())}>
          <Quote className="h-4 w-4" />
        </Button>
      </div>
      <div className="rounded-md border p-2">
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
