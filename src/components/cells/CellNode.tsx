import { useEffect, useRef, useState } from "react";
import {
  Handle,
  Position,
  NodeResizer,
  type NodeProps,
  type Node,
} from "@xyflow/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  MousePointer2,
  ChevronsDownUp,
  Trash2,
  FilePlus2,
  Plus,
  Link2,
} from "lucide-react";
import { useStore } from "../../state/store";
import { useUI, promptText, confirmAction } from "../../state/ui";
import { textContent, type Cell, type CellPhase } from "../../types";
import { canTransition } from "../../animations/cell";
import { ColorPalette } from "../popups/ColorPalette";
import { Button } from "../toolbars/Button";
import { CellEditor } from "../editor/CellEditor";
export type CanvasNode = Node<{ cell: Cell }, "cell">;
export const removeCell = async (id: string) => {
  if (
    await confirmAction(
      "Delete cell?",
      "The cell and its connections will be removed. You can undo this action.",
    )
  )
    useStore.getState().deleteCell(id);
};
export const renameCell = async (id: string) => {
  const c = useStore.getState().board.cells.find((c) => c.id === id);
  if (!c) return;
  const title = await promptText("Cell title", c.title);
  if (title !== null) useStore.getState().updateCell(id, { title });
};
export function cellMenu(id: string, x: number, y: number) {
  const s = useStore.getState();
  const c = s.board.cells.find((c) => c.id === id)!;
  s.select(id);
  useUI.getState().menuAt(x, y, [
    {
      label: c.opened ? "Close cell" : "Open cell",
      action: () => s.updateCell(id, { opened: !c.opened }),
    },
    {
      label: "Rename",
      action: () => {
        void renameCell(id);
      },
    },
    {
      label: "Change color",
      action: () => useUI.getState().panelAt(x, y, <ColorPalette id={id} />),
    },
    {
      label: "Connect to cell",
      action: () => useStore.setState({ connectSource: id }),
    },
    { label: "Duplicate", action: () => s.duplicate(id) },
    { label: "Add content page", action: () => s.addPage(id) },
    {
      label: "Delete",
      danger: true,
      action: () => {
        void removeCell(id);
      },
    },
  ]);
}
export function CellNode({ data, selected, dragging }: NodeProps<CanvasNode>) {
  const { cell } = data;
  const boardId = useStore((s) => s.board.id);
  const reduced = useReducedMotion();
  const presentation = useStore((s) => s.presentation);
  const source = useStore((s) => s.connectSource);
  const [hover, setHover] = useState(false);
  const [phase, setPhase] = useState<CellPhase>(cell.opened ? "OPEN" : "IDLE");
  const phaseRef = useRef(phase);
  const desired = useRef(cell.opened);
  desired.current = cell.opened;
  const transition = (next: CellPhase) => {
    if (canTransition(phaseRef.current, next)) {
      phaseRef.current = next;
      setPhase(next);
    }
  };
  useEffect(() => {
    if (dragging) {
      transition("DRAGGING");
      return;
    }
    if (phaseRef.current === "DRAGGING") {
      transition(cell.opened ? "OPEN" : "SELECTED");
      return;
    }
    if (cell.opened) {
      if (["IDLE", "HOVERED", "SELECTED", "CLOSING"].includes(phaseRef.current))
        transition("OPENING");
    } else if (["OPEN", "EDITING", "OPENING"].includes(phaseRef.current))
      transition("CLOSING");
    else {
      transition(selected ? "SELECTED" : hover ? "HOVERED" : "IDLE");
    }
  }, [cell.opened, dragging, selected, hover]);
  const page = cell.pages[cell.page];
  const content = textContent(page.content).trim();
  const hasContent =
    !!content ||
    page.attachments.length > 0 ||
    JSON.stringify(page.content).includes('"image"') ||
    JSON.stringify(page.content).includes('"localVideo"');
  const controls = !presentation && (selected || hover || cell.opened);
  const showPreview = hasContent && cell.preview !== false;
  const width = cell.opened || showPreview
    ? cell.width
    : selected
      ? 376
      : Math.max(
          60,
          Math.min(
            280,
            cell.title.length * (cell.titleSize ?? 35) * (16 / 35) + 44,
          ),
        );
  const height = cell.opened
    ? selected
      ? cell.height
      : "auto"
    : showPreview
      ? "auto"
      : selected
        ? 158
        : 78;
  const palette = (el: HTMLElement) => {
    const r = el.getBoundingClientRect();
    useUI
      .getState()
      .panelAt(r.left - 65, r.bottom + 12, <ColorPalette id={cell.id} />);
  };
  return (
    <div
      className={`cell-shell ${selected ? "selected" : ""} ${source === cell.id ? "connecting" : ""}`}
      data-testid={`cell-${cell.id}`}
      data-cell-id={cell.id}
      data-phase={phase}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={(e) => {
        e.stopPropagation();
        if (source && source !== cell.id) {
          useStore.getState().connect(source, cell.id);
        } else useStore.getState().select(cell.id);
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        cellMenu(cell.id, e.clientX, e.clientY);
      }}
    >
      <NodeResizer
        isVisible={selected && cell.opened && !presentation}
        minWidth={300}
        minHeight={220}
        color="#00b9d6"
        onResizeStart={() => {
          useStore.getState().checkpoint();
          if (phaseRef.current === "EDITING") transition("OPEN");
          transition("RESIZING");
        }}
        onResize={(_, p) => {
          useStore
            .getState()
            .updateCell(
              cell.id,
              { width: p.width, height: p.height, x: p.x, y: p.y },
              false,
            );
        }}
        onResizeEnd={() => transition("OPEN")}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="in"
        className="connection-handle target-handle"
        isConnectable={!presentation}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="out"
        className="connection-handle source-handle"
        isConnectable={!presentation}
      />
      <AnimatePresence>
        {controls && (
          <motion.div
            className="cell-toolbar toolbar nodrag nopan"
            style={{ x: "-50%" }}
            role="toolbar"
            aria-label="Cell actions"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.14 }}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <Button
              label="Select cell"
              active={selected && !cell.opened}
              onClick={() => useStore.getState().select(cell.id)}
            >
              <MousePointer2 />
            </Button>
            <button
              className="icon-button color-button active"
              aria-label="Cell color"
              onClick={(e) => palette(e.currentTarget)}
            >
              Aa
            </button>
            {!cell.opened && (
              <Button
                label="Connect cell"
                active={source === cell.id}
                onClick={() =>
                  useStore.setState({
                    connectSource: source === cell.id ? null : cell.id,
                  })
                }
              >
                <Link2 />
              </Button>
            )}
            {cell.opened && (
              <Button
                label="Close cell"
                onClick={() =>
                  useStore.getState().updateCell(cell.id, { opened: false })
                }
              >
                <ChevronsDownUp />
              </Button>
            )}
            <Button
              label="Delete cell"
              danger
              onClick={() => {
                void removeCell(cell.id);
              }}
            >
              <Trash2 />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
      <motion.div
        className={`cell-card${cell.opened && !selected ? " reading" : ""}`}
        style={
          {
            "--header": cell.color,
            minHeight: cell.opened && !selected ? cell.height : undefined,
            "--header-text": ["#784f67", "#79547e"].includes(cell.color)
              ? "#f1d1e8"
              : "#c1f4f5",
          } as React.CSSProperties
        }
        initial={false}
        animate={{ width, height }}
        transition={{
          duration:
            reduced || phase === "RESIZING" ? 0 : cell.opened ? 0.8 : 0.24,
          ease: [0.22, 0.75, 0.2, 1],
        }}
        onAnimationComplete={() => {
          if (phaseRef.current === "OPENING" && desired.current)
            transition("OPEN");
          if (phaseRef.current === "CLOSING" && !desired.current)
            transition("SELECTED");
        }}
      >
        <div
          className="cell-header drag-handle"
          style={{ fontSize: cell.titleSize ?? 35 }}
          onDoubleClick={(e) => {
            e.stopPropagation();
            if (!presentation) void renameCell(cell.id);
          }}
        >
          {cell.title || <span className="untitled">Untitled</span>}
        </div>
        {cell.opened ? (
          <CellEditor
            key={`${boardId}:${cell.pages[cell.page].id}`}
            cell={cell}
            onFocus={() => {
              if (phaseRef.current === "OPENING") transition("OPEN");
              transition("EDITING");
            }}
            onBlur={() => transition("OPEN")}
          />
        ) : selected ? (
          <button
            className="cell-placeholder nodrag nopan"
            aria-label="Open cell"
            onClick={(e) => {
              e.stopPropagation();
              useStore.getState().updateCell(cell.id, { opened: true });
            }}
          >
            {showPreview ? (
              <span className="compact-content">
                {content || "Media attachment"}
              </span>
            ) : (
              <>
                <Plus size={18} /> Click to write
              </>
            )}
          </button>
        ) : showPreview ? (
          <div
            className="compact-preview"
            onDoubleClick={(e) => {
              e.stopPropagation();
              useStore.getState().updateCell(cell.id, { opened: true });
            }}
          >
            {content || "Media attachment"}
          </div>
        ) : null}
      </motion.div>
      {controls && (
        <button
          className="page-add nodrag nopan"
          aria-label="Add page"
          title="Add content page"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            useStore.getState().addPage(cell.id);
          }}
        >
          <FilePlus2 size={22} />
        </button>
      )}
    </div>
  );
}
