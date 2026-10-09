import { LocalVideo } from "./LocalVideo";
import { useEditor, EditorContent, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import { TableKit } from "@tiptap/extension-table";
import Mathematics from "@tiptap/extension-mathematics";
import { useEffect } from "react";
import {
  Bold,
  Italic,
  Underline,
  Heading2,
  List,
  ListOrdered,
  IndentIncrease,
  IndentDecrease,
  Plus,
  Undo2,
  Redo2,
  FileText,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useStore } from "../../state/store";
import { useUI, promptText, pickFile } from "../../state/ui";
import { fileData } from "../../utils/transfer";
import { uid, type Cell } from "../../types";
import { Button } from "../toolbars/Button";
import "katex/dist/katex.min.css";
export function CellEditor({
  cell,
  onFocus,
  onBlur,
}: {
  cell: Cell;
  onFocus: () => void;
  onBlur: () => void;
}) {
  const revision = useStore((s) => s.revision);
  const boardId = useStore((s) => s.board.id);
  const page = cell.pages[cell.page];
  const presentation = useStore((s) => s.presentation);
  const editor = useEditor(
    {
      extensions: [
        LocalVideo,
        StarterKit.configure({
          link: { openOnClick: false, protocols: ["https", "http"] },
        }),
        Image.configure({ allowBase64: true }),
        TableKit.configure({ table: { resizable: false } }),
        Mathematics.configure({
          katexOptions: { throwOnError: false, trust: false },
        }),
      ],
      content: page.content,
      editable: !presentation,
      editorProps: {
        attributes: {
          class: "rich-editor nodrag nopan nowheel",
          "aria-label": "Cell content",
          role: "textbox",
          "aria-multiline": "true",
        },
      },
      onFocus: () => {
        useStore.getState().checkpoint();
        onFocus();
      },
      onBlur,
      onUpdate: ({ editor }) => {
        const s = useStore.getState();
        const c = s.board.cells.find((c) => c.id === cell.id);
        if (!c) return;
        const pages = c.pages.map((p) =>
          p.id === page.id ? { ...p, content: editor.getJSON() } : p,
        );
        s.updateCell(cell.id, { pages }, false);
      },
    },
    [boardId, cell.id, page.id],
  );
  useEffect(() => {
    const current = useStore
      .getState()
      .board.cells.find((c) => c.id === cell.id)
      ?.pages.find((p) => p.id === page.id)?.content;
    if (
      editor &&
      current &&
      JSON.stringify(editor.getJSON()) !== JSON.stringify(current)
    )
      editor.commands.setContent(current, { emitUpdate: false });
  }, [editor, revision, boardId, cell.id, page.id]);
  useEffect(() => {
    editor?.setEditable(!presentation);
  }, [editor, presentation]);
  const format = useEditorState({
    editor,
    selector: ({ editor }) => ({
      textSelected: !editor?.state.selection.empty,
      bold: editor?.isActive("bold"),
      italic: editor?.isActive("italic"),
      underline: editor?.isActive("underline"),
      heading: editor?.isActive("heading"),
      bullet: editor?.isActive("bulletList"),
      numbered: editor?.isActive("orderedList"),
      undo: editor?.can().undo(),
      redo: editor?.can().redo(),
    }),
  });
  if (!editor) return null;

  const chain = () => {
    editor.view.focus();
    return editor.chain();
  };
  const failed = (message: string) => {
    void useUI
      .getState()
      .ask({ kind: "info", title: "Could not insert", description: message });
  };
  const image = async () => {
    const f = await pickFile(
      "Insert image",
      "image/png,image/jpeg,image/webp,image/gif",
    );
    if (!f) return;
    try {
      if (f.size > 10 * 1024 * 1024)
        throw new Error("Images must be under 10 MB.");
      if (
        !["image/png", "image/jpeg", "image/webp", "image/gif"].includes(f.type)
      )
        throw new Error("Choose a PNG, JPEG, WebP or GIF.");
      chain()
        .setImage({ src: await fileData(f), alt: f.name })
        .run();
    } catch (e) {
      failed(String(e));
    }
  };
  const video = async () => {
    const f = await pickFile("Insert video", "video/mp4,video/webm");
    if (!f) return;
    try {
      if (
        f.size > 10 * 1024 * 1024 ||
        !["video/mp4", "video/webm"].includes(f.type)
      )
        throw new Error("Choose an MP4 or WebM smaller than 10 MB.");
      chain()
        .insertContent({
          type: "localVideo",
          attrs: { src: await fileData(f), title: f.name },
        })
        .run();
    } catch (e) {
      failed(String(e));
    }
  };
  const attachment = async () => {
    const f = await pickFile("Attach PDF", "application/pdf");
    if (!f) return;
    try {
      if (f.type !== "application/pdf" || f.size > 20 * 1024 * 1024)
        throw new Error("Choose a PDF smaller than 20 MB.");
      const data = await fileData(f);
      const current = useStore
        .getState()
        .board.cells.find((c) => c.id === cell.id)!;
      useStore.getState().updateCell(cell.id, {
        pages: current.pages.map((p) =>
          p.id === page.id
            ? {
                ...p,
                attachments: [
                  ...p.attachments,
                  { id: uid(), name: f.name, type: f.type, data },
                ],
              }
            : p,
        ),
      });
    } catch (e) {
      failed(String(e));
    }
  };
  const insert = (e: HTMLElement) => {
    const r = e.getBoundingClientRect();
    useUI.getState().menuAt(r.left, r.bottom + 8, [
      {
        label: "Link",
        action: () => {
          void (async () => {
            const href = await promptText(
              "Insert link",
              "https://",
              "Use an http or https address.",
            );
            if (href === null) return;
            if (!/^https?:\/\//i.test(href)) {
              failed("Use an http or https address.");
              return;
            }
            if (editor.state.selection.empty)
              chain()
                .insertContent({
                  type: "text",
                  text: href,
                  marks: [
                    {
                      type: "link",
                      attrs: {
                        href,
                        target: "_blank",
                        rel: "noopener noreferrer",
                      },
                    },
                  ],
                })
                .run();
            else chain().setLink({ href }).run();
          })();
        },
      },
      {
        label: "Remove link",
        action: () => {
          chain().unsetLink().run();
        },
      },
      {
        label: "Image",
        action: () => {
          void image();
        },
      },
      {
        label: "Video",
        action: () => {
          void video();
        },
      },
      {
        label: "PDF attachment",
        action: () => {
          void attachment();
        },
      },
      {
        label: "Table",
        action: () => {
          chain().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
        },
      },
      {
        label: "Add table row",
        disabled: !editor.isActive("table"),
        action: () => {
          chain().addRowAfter().run();
        },
      },
      {
        label: "Delete table",
        disabled: !editor.isActive("table"),
        action: () => {
          chain().deleteTable().run();
        },
      },
      {
        label: "Mathematical expression",
        action: () => {
          void (async () => {
            const latex = await promptText(
              "Mathematical expression",
              "x^2 + y^2 = z^2",
              "Enter a LaTeX expression.",
            );
            if (latex) chain().insertInlineMath({ latex }).run();
          })();
        },
      },
      {
        label: "Bold",
        action: () => {
          chain().toggleBold().run();
        },
      },
      {
        label: "Italic",
        action: () => {
          chain().toggleItalic().run();
        },
      },
      {
        label: "Underline",
        action: () => {
          chain().toggleUnderline().run();
        },
      },
      {
        label: "Code block",
        action: () => {
          chain().toggleCodeBlock().run();
        },
      },
      {
        label: "Inline code",
        action: () => {
          chain().toggleCode().run();
        },
      },
    ]);
  };
  return (
    <>
      <div className="editor-body nodrag nopan nowheel">
        <EditorContent editor={editor} />
        {page.attachments.map((a) => (
          <div className="attachment" key={a.id}>
            <FileText size={16} />
            <a href={a.data} download={a.name}>
              {a.name}
            </a>
            {!presentation && (
              <Button
                label={`Remove ${a.name}`}
                onClick={() =>
                  useStore.getState().updateCell(cell.id, {
                    pages: cell.pages.map((p) =>
                      p.id === page.id
                        ? {
                            ...p,
                            attachments: p.attachments.filter(
                              (x) => x.id !== a.id,
                            ),
                          }
                        : p,
                    ),
                  })
                }
              >
                <Trash2 size={14} />
              </Button>
            )}
          </div>
        ))}
      </div>
      {cell.pages.length > 1 && (
        <div className="page-navigation nodrag nopan">
          <Button
            label="Previous page"
            disabled={cell.page === 0}
            onClick={() =>
              useStore.getState().updateCell(cell.id, { page: cell.page - 1 })
            }
          >
            <ChevronLeft size={16} />
          </Button>
          <span>
            Page {cell.page + 1} / {cell.pages.length}
          </span>
          <Button
            label="Next page"
            disabled={cell.page === cell.pages.length - 1}
            onClick={() =>
              useStore.getState().updateCell(cell.id, { page: cell.page + 1 })
            }
          >
            <ChevronRight size={16} />
          </Button>
        </div>
      )}
      {!presentation && (
        <div
          className="format-toolbar toolbar nodrag nopan"
          role="toolbar"
          aria-label="Text formatting"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <Button
            label="Undo text"
            disabled={!format?.undo}
            onClick={() => {
              chain().undo().run();
            }}
          >
            <Undo2 />
          </Button>
          <Button
            label="Redo text"
            disabled={!format?.redo}
            onClick={() => {
              chain().redo().run();
            }}
          >
            <Redo2 />
          </Button>
          <span className="toolbar-divider" />
          {format?.textSelected && (
            <>
              <Button
                label="Bold"
                active={format?.bold}
                onClick={() => {
                  chain().toggleBold().run();
                }}
              >
                <Bold />
              </Button>
              <Button
                label="Italic"
                active={format?.italic}
                onClick={() => {
                  chain().toggleItalic().run();
                }}
              >
                <Italic />
              </Button>
              <Button
                label="Underline"
                active={format?.underline}
                onClick={() => {
                  chain().toggleUnderline().run();
                }}
              >
                <Underline />
              </Button>
            </>
          )}
          <Button
            label="Heading"
            active={format?.heading}
            onClick={() => {
              chain().toggleHeading({ level: 2 }).run();
            }}
          >
            <Heading2 />
          </Button>
          <Button
            label="Bullet list"
            active={format?.bullet}
            onClick={() => {
              chain().toggleBulletList().run();
            }}
          >
            <List />
          </Button>
          <Button
            label="Numbered list"
            active={format?.numbered}
            onClick={() => {
              chain().toggleOrderedList().run();
            }}
          >
            <ListOrdered />
          </Button>
          <Button
            label="Outdent"
            disabled={!editor.can().liftListItem("listItem")}
            onClick={() => {
              chain().liftListItem("listItem").run();
            }}
          >
            <IndentDecrease />
          </Button>
          <Button
            label="Indent"
            disabled={!editor.can().sinkListItem("listItem")}
            onClick={() => {
              chain().sinkListItem("listItem").run();
            }}
          >
            <IndentIncrease />
          </Button>
          <button
            className="icon-button insert-button"
            aria-label="Insert content"
            title="Insert content"
            onMouseDown={(e) => e.preventDefault()}
            onClick={(e) => insert(e.currentTarget)}
          >
            <Plus />
          </button>
        </div>
      )}
    </>
  );
}
