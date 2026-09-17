"use client";

import { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TiptapImage from "@tiptap/extension-image";
import { NodeSelection } from "@tiptap/pm/state";

interface BlogEditorProps {
  content: string;
  onChange: (html: string) => void;
  onUploadImage: (file: File) => Promise<string>;
}

// Rich-text editor for the blog admin panel, built on Tiptap. Replaces the
// old bare `contentEditable` + `document.execCommand` editor, which had no
// way to add links or insert images into the body and behaved
// inconsistently across browsers. This adds:
//   - working bold/italic/underline/headings/lists (same toolbar as before)
//   - links on selected text, addable/removable via the Link/Unlink buttons
//   - inline images inserted at the cursor (uploaded through the same
//     /api/admin/blog-images endpoint the featured-image picker already uses)
//   - clickable images: select an inserted image, then hit Link, to wrap it
//     in an <a> the same way a text link works (Image is configured
//     `inline: true` specifically so it can carry the Link mark)
export default function BlogEditor({ content, onChange, onUploadImage }: BlogEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        link: {
          openOnClick: false,
          autolink: true,
          HTMLAttributes: { rel: "noopener noreferrer nofollow" },
        },
      }),
      TiptapImage.configure({
        inline: true,
        HTMLAttributes: { class: "rounded-xl" },
      }),
    ],
    content,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class:
          "min-h-64 p-4 outline-none [&_a]:font-semibold [&_a]:text-blue-700 [&_a]:underline [&_blockquote]:border-l-4 [&_blockquote]:border-amber-400 [&_blockquote]:pl-4 [&_h2]:mt-6 [&_h2]:text-xl [&_h2]:font-black [&_h3]:mt-4 [&_h3]:text-lg [&_h3]:font-bold [&_img]:my-3 [&_img]:h-auto [&_img]:max-w-full [&_img]:rounded-xl [&_li]:ml-6 [&_ol]:list-decimal [&_p]:my-3 [&_ul]:list-disc",
      },
    },
  });

  // The parent swaps `content` wholesale when switching between "new post"
  // and "edit post" (or resetting the form). Tiptap only reads its
  // `content` option on first mount, so keep it in sync explicitly whenever
  // the parent's value changes out from under us.
  useEffect(() => {
    if (!editor) return;
    if (content !== editor.getHTML()) {
      editor.commands.setContent(content, { emitUpdate: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content, editor]);

  if (!editor) return null;

  function promptForLink() {
    if (!editor) return;
    const previousUrl = (editor.getAttributes("link").href as string | undefined) || "";
    const url = window.prompt("Link URL", previousUrl || "https://");
    if (url === null) return; // cancelled
    if (url.trim() === "") {
      editor.chain().focus().unsetLink().run();
      return;
    }
    const chain = editor.chain().focus();
    // extendMarkRange only makes sense for a text selection/cursor; for a
    // NodeSelection (e.g. a clicked-on image) just apply the mark directly.
    if (!(editor.state.selection instanceof NodeSelection)) {
      chain.extendMarkRange("link");
    }
    chain.setLink({ href: url.trim() }).run();
  }

  async function insertImage(file?: File) {
    if (!file || !editor) return;
    const url = await onUploadImage(file);
    if (url) editor.chain().focus().setImage({ src: url }).run();
  }

  const markButtons: { label: string; title: string; onClick: () => void; active: boolean }[] = [
    { label: "B", title: "Bold", onClick: () => editor.chain().focus().toggleBold().run(), active: editor.isActive("bold") },
    { label: "I", title: "Italic", onClick: () => editor.chain().focus().toggleItalic().run(), active: editor.isActive("italic") },
    { label: "U", title: "Underline", onClick: () => editor.chain().focus().toggleUnderline().run(), active: editor.isActive("underline") },
    { label: "H2", title: "Heading 2", onClick: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), active: editor.isActive("heading", { level: 2 }) },
    { label: "H3", title: "Heading 3", onClick: () => editor.chain().focus().toggleHeading({ level: 3 }).run(), active: editor.isActive("heading", { level: 3 }) },
    { label: "• List", title: "Bullet list", onClick: () => editor.chain().focus().toggleBulletList().run(), active: editor.isActive("bulletList") },
    { label: "1. List", title: "Numbered list", onClick: () => editor.chain().focus().toggleOrderedList().run(), active: editor.isActive("orderedList") },
  ];

  return (
    <div className="overflow-hidden rounded-xl border border-slate-300">
      <div className="flex flex-wrap items-center gap-1 border-b bg-slate-50 p-2">
        {markButtons.map((btn) => (
          <button
            key={btn.title}
            type="button"
            title={btn.title}
            onMouseDown={(e) => e.preventDefault()}
            onClick={btn.onClick}
            className={`rounded-lg border px-3 py-1.5 text-sm font-bold ${btn.active ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white"}`}
          >
            {btn.label}
          </button>
        ))}

        <span className="mx-1 h-6 w-px bg-slate-300" />

        <button
          type="button"
          title="Add or edit a link — select text, or click an image first"
          onMouseDown={(e) => e.preventDefault()}
          onClick={promptForLink}
          className={`rounded-lg border px-3 py-1.5 text-sm font-bold ${editor.isActive("link") ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white"}`}
        >
          Link
        </button>
        <button
          type="button"
          title="Remove link"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().unsetLink().run()}
          disabled={!editor.isActive("link")}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-40"
        >
          Unlink
        </button>

        <span className="mx-1 h-6 w-px bg-slate-300" />

        <label
          title="Insert an image at the cursor"
          className="cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-bold hover:border-amber-500"
        >
          Image
          <input
            hidden
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              void insertImage(file);
            }}
          />
        </label>

        <span className="mx-1 h-6 w-px bg-slate-300" />

        <button
          type="button"
          title="Undo"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().undo().run()}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-bold"
        >
          ↺
        </button>
        <button
          type="button"
          title="Redo"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().redo().run()}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-bold"
        >
          ↻
        </button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
