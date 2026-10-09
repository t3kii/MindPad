import { Button } from "../toolbars/Button";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  SelectionMode,
  type NodeChange,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Plus, ArrowUpRight, X, ChevronLeft, ChevronRight } from "lucide-react";
import { CellNode, removeCell, type CanvasNode } from "../cells/CellNode";
import { CanvasEdge } from "../connections/CanvasEdge";
import { Navigation, ViewControls } from "../navigation/Navigation";
import { Boards, SearchPanel } from "../navigation/Boards";
import { useStore } from "../../state/store";
import { useUI, promptText } from "../../state/ui";
import { uid, type Cell } from "../../types";
const nodeTypes = { cell: CellNode };
const edgeTypes = { canvas: CanvasEdge };
function CanvasInner() {
  const s = useStore();
  const flow = useReactFlow<CanvasNode>();
  const [slide, setSlide] = useState(0);
  const [dragged, setDragged] = useState<string | null>(null);
  const dragRecorded = useRef(false);
  const [dashboard, setDashboard] = useState(false);
  const [search, setSearch] = useState(false);
  const [zoom, setZoom] = useState(s.board.viewport.zoom);
  const clipboard = useRef<Cell | null>(null);
  const wrapper = useRef<HTMLDivElement>(null);
  const boardId = s.board.id;
  useEffect(() => {
    void flow.setViewport(useStore.getState().board.viewport);
  }, [boardId, flow]);
  const nodeKey = JSON.stringify(
    s.board.cells.map((c) => ({
      ...c,
      pages: c.pages.map((p) => ({
        ...p,
        content: c.opened ? null : p.content,
      })),
    })),
  );
  const nodes = useMemo(
    () =>
      s.board.cells.map((c) => ({
        id: c.id,
        type: "cell" as const,
        position: { x: c.x, y: c.y },
        data: { cell: c },
        selected: s.selected === c.id,
        dragHandle: ".drag-handle",
        draggable: !s.presentation,
        dragging: dragged === c.id,
      })),
    [boardId, nodeKey, s.selected, s.presentation, dragged],
  );
  const edges = useMemo(
    () =>
      s.board.connections.map((e) => ({
        ...e,
        type: "canvas",
        sourceHandle: "out",
        targetHandle: "in",
        selected: s.edgeSelected === e.id,
      })),
    [s.board.connections, s.edgeSelected],
  );
  const add = useCallback(() => {
    const r = wrapper.current?.getBoundingClientRect();
    if (!r) return;
    const p = flow.screenToFlowPosition({
      x: r.left + r.width / 2,
      y: r.top + r.height / 2,
    });
    useStore.getState().addCell(p.x - 188, p.y - 79);
  }, [flow]);
  const fit = useCallback(() => {
    void flow.fitView({ padding: 0.25, duration: 450, maxZoom: 1 });
  }, [flow]);
  const focus = useCallback(
    (id: string) => {
      const node = flow.getNode(id);
      if (!node) return;
      useStore.getState().select(id);
      void flow.setCenter(
        node.position.x + (node.measured?.width ?? 200) / 2,
        node.position.y + (node.measured?.height ?? 80) / 2,
        { zoom: Math.max(flow.getZoom(), 0.8), duration: 450 },
      );
    },
    [flow],
  );
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        useUI.getState().modal ||
        useUI.getState().menu ||
        dashboard ||
        search ||
        target.closest('input,textarea,[contenteditable="true"]')
      )
        return;
      const st = useStore.getState();
      const mod = e.ctrlKey || e.metaKey;
      if (e.key === "Escape") {
        useStore.setState({
          connectSource: null,
          selected: null,
          edgeSelected: null,
          presentation: false,
        });
        return;
      }
      if (st.presentation) return;
      if (mod && e.key.toLowerCase() === "z") {
        e.preventDefault();
        e.shiftKey ? st.redo() : st.undo();
      } else if (mod && e.key.toLowerCase() === "y") {
        e.preventDefault();
        st.redo();
      } else if (mod && e.key.toLowerCase() === "d" && st.selected) {
        e.preventDefault();
        st.duplicate(st.selected);
      } else if (mod && e.key.toLowerCase() === "c" && st.selected) {
        e.preventDefault();
        clipboard.current = structuredClone(
          st.board.cells.find((c) => c.id === st.selected)!,
        );
      } else if (mod && e.key.toLowerCase() === "v" && clipboard.current) {
        e.preventDefault();
        const c = structuredClone(clipboard.current);
        c.id = uid();
        c.x += 60;
        c.y += 60;
        c.pages = c.pages.map((p) => ({ ...p, id: uid() }));
        st.mutate((b) => b.cells.push(c));
        st.select(c.id);
        clipboard.current = c;
      } else if (["Delete", "Backspace"].includes(e.key)) {
        if (st.edgeSelected) {
          e.preventDefault();
          st.deleteEdge(st.edgeSelected);
        } else if (st.selected) {
          e.preventDefault();
          void removeCell(st.selected);
        }
      }
    };
    document.addEventListener("keydown", key);
    return () => document.removeEventListener("keydown", key);
  }, [dashboard, search]);
  const slideCount = s.board.locations.length || s.board.cells.length;
  const showSlide = useCallback(
    (index: number) => {
      const st = useStore.getState();
      const count = st.board.locations.length || st.board.cells.length;
      if (!count) return;
      const next = Math.max(0, Math.min(count - 1, index));
      setSlide(next);
      if (st.board.locations.length) {
        void flow.setViewport(st.board.locations[next].viewport, {
          duration: 450,
        });
      } else {
        const cell = st.board.cells[next];
        const node = flow.getNode(cell.id);
        if (node)
          void flow.setCenter(
            node.position.x + (node.measured?.width ?? 200) / 2,
            node.position.y + (node.measured?.height ?? 80) / 2,
            { zoom: 1, duration: 450 },
          );
      }
    },
    [flow],
  );
  useEffect(() => {
    if (s.presentation) showSlide(0);
  }, [s.presentation, showSlide]);
  useEffect(() => {
    if (!s.presentation) return;
    const key = (e: KeyboardEvent) => {
      if (useUI.getState().modal || useUI.getState().menu) return;
      if (e.key === "ArrowRight") {
        e.preventDefault();
        showSlide(slide + 1);
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        showSlide(slide - 1);
      }
    };
    document.addEventListener("keydown", key);
    return () => document.removeEventListener("keydown", key);
  }, [s.presentation, slide, showSlide]);
  const nodeChange = (changes: NodeChange<CanvasNode>[]) => {
    for (const change of changes) {
      if (change.type === "position" && change.position) {
        const current = useStore
          .getState()
          .board.cells.find((c) => c.id === change.id);
        if (current?.x === change.position.x && current.y === change.position.y)
          continue;
        if (change.dragging && !dragRecorded.current) {
          useStore.getState().checkpoint();
          dragRecorded.current = true;
        }
        useStore
          .getState()
          .updateCell(
            change.id,
            { x: change.position.x, y: change.position.y },
            false,
          );
      }
    }
  };
  const closeBoards = useCallback(() => setDashboard(false), []);
  const closeSearch = useCallback(() => setSearch(false), []);
  const locations = (el: HTMLElement) => {
    const r = el.getBoundingClientRect();
    const st = useStore.getState();
    useUI.getState().menuAt(r.left - 150, r.top - 100, [
      {
        label: "Save current location",
        action: () => {
          void (async () => {
            const name = await promptText("Save canvas location", "My view");
            if (name)
              st.mutate((b) =>
                b.locations.push({ name, viewport: flow.getViewport() }),
              );
          })();
        },
      },
      ...st.board.locations.map((l, index) => ({
        label: `Go to ${l.name}`,
        action: () => {
          void flow.setViewport(l.viewport, { duration: 450 });
        },
      })),
      ...st.board.locations.map((l, index) => ({
        label: `Remove ${l.name}`,
        action: () =>
          st.mutate((b) => {
            b.locations.splice(index, 1);
          }),
      })),
    ]);
  };
  return (
    <>
      <Navigation
        onBoards={() => setDashboard(true)}
        onSearch={() => setSearch(true)}
        onAdd={add}
        onFit={fit}
      />
      <main ref={wrapper} className="canvas-area" aria-label="Visual canvas">
        <ReactFlow<CanvasNode>
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodesChange={nodeChange}
          onNodeDragStart={(_, n) => {
            setDragged(n.id);
            dragRecorded.current = false;
          }}
          onNodeDragStop={() => setDragged(null)}
          onNodeClick={(_, node) => {
            const source = useStore.getState().connectSource;
            if (source && source !== node.id)
              useStore.getState().connect(source, node.id);
            else useStore.getState().select(node.id);
          }}
          onConnect={(c) => {
            if (c.source && c.target) s.connect(c.source, c.target);
          }}
          onEdgeClick={(_, edge) =>
            useStore.setState({ edgeSelected: edge.id, selected: null })
          }
          onPaneClick={() =>
            useStore.setState({
              selected: null,
              edgeSelected: null,
              connectSource: null,
            })
          }
          onPaneContextMenu={(e) => {
            e.preventDefault();
            const p = flow.screenToFlowPosition({ x: e.clientX, y: e.clientY });
            useUI.getState().menuAt(e.clientX, e.clientY, [
              {
                label: "New cell here",
                action: () => {
                  s.addCell(p.x, p.y);
                },
              },
              { label: "Fit all cells", action: fit },
              { label: "Undo", action: s.undo, disabled: !s.history.length },
            ]);
          }}
          onDoubleClick={(e) => {
            if (
              (e.target as HTMLElement).classList.contains(
                "react-flow__pane",
              ) &&
              !s.presentation
            ) {
              const p = flow.screenToFlowPosition({
                x: e.clientX,
                y: e.clientY,
              });
              s.addCell(p.x - 188, p.y - 79);
            }
          }}
          defaultViewport={s.board.viewport}
          onMove={(_, v) => setZoom(v.zoom)}
          onMoveEnd={(_, v) => s.camera(v)}
          minZoom={0.1}
          maxZoom={3}
          panOnDrag
          panOnScroll
          zoomOnScroll={false}
          zoomOnPinch
          zoomActivationKeyCode={["Control", "Meta"]}
          zoomOnDoubleClick={false}
          selectionMode={SelectionMode.Partial}
          deleteKeyCode={null}
          nodesConnectable={!s.presentation}
          elementsSelectable={!s.presentation}
          proOptions={{ hideAttribution: true }}
        />
        {!s.board.cells.length && (
          <div className="empty-canvas">
            <div className="empty-mark">
              <span />
              <span />
              <span />
            </div>
            <span className="eyebrow">PERSONAL VISUAL CANVAS</span>
            <h1>
              Make room for
              <br />
              your next idea.
            </h1>
            <p>
              Write a thought. Follow a connection.
              <br />
              See where it takes you.
            </p>
            <button className="first-cell" onClick={add}>
              <Plus size={18} /> Create your first cell{" "}
              <ArrowUpRight size={16} />
            </button>
            <small>Or double click anywhere on the canvas</small>
          </div>
        )}
        {s.connectSource && (
          <div className="connection-hint">
            Click another cell to connect
            <button
              aria-label="Cancel connection"
              onClick={() => useStore.setState({ connectSource: null })}
            >
              <X size={14} />
            </button>
          </div>
        )}
        {s.presentation && (
          <>
            <div className="presentation-hint">
              Presentation mode · Escape to return
            </div>
            {slideCount > 0 && (
              <div className="presentation-steps toolbar">
                <Button
                  label="Previous slide"
                  disabled={slide === 0}
                  onClick={() => showSlide(slide - 1)}
                >
                  <ChevronLeft />
                </Button>
                <span>
                  View {slide + 1} / {slideCount}
                </span>
                <Button
                  label="Next slide"
                  disabled={slide === slideCount - 1}
                  onClick={() => showSlide(slide + 1)}
                >
                  <ChevronRight />
                </Button>
              </div>
            )}
          </>
        )}
        {s.status === "error" && (
          <div className="storage-warning" role="alert">
            {s.error}
          </div>
        )}
        <ViewControls
          zoom={zoom}
          onZoom={(d) => {
            void flow.zoomTo(
              Math.max(
                0.1,
                Math.min(3, flow.getZoom() * (d > 0 ? 1.2 : 1 / 1.2)),
              ),
              { duration: 200 },
            );
          }}
          onFit={fit}
          onCenter={() => {
            if (s.selected) focus(s.selected);
          }}
          onLocations={locations}
        />
        <div className="canvas-caption">
          MINDPAD<span>LOCAL / PRIVATE</span>
        </div>
      </main>
      {dashboard && <Boards close={closeBoards} />}{" "}
      {search && <SearchPanel close={closeSearch} onResult={focus} />}
    </>
  );
}
export function Canvas() {
  return (
    <ReactFlowProvider>
      <CanvasInner />
    </ReactFlowProvider>
  );
}
