import {
  BaseEdge,
  EdgeLabelRenderer,
  useInternalNode,
  getBezierPath,
  type EdgeProps,
  Position,
} from "@xyflow/react";
import { ArrowRight, Palette, Trash2, Type } from "lucide-react";
import { useStore } from "../../state/store";
import { promptText } from "../../state/ui";
import { Button } from "../toolbars/Button";
export function CanvasEdge({ id, source, target }: EdgeProps) {
  const a = useInternalNode(source),
    b = useInternalNode(target);
  const connection = useStore((s) =>
    s.board.connections.find((e) => e.id === id),
  );
  const selected = useStore((s) => s.edgeSelected === id);
  const presentation = useStore((s) => s.presentation);
  if (!a || !b || !connection) return null;
  const aw = a.measured.width ?? 200,
    ah = a.measured.height ?? 80,
    bw = b.measured.width ?? 200,
    bh = b.measured.height ?? 80;
  const ac = {
      x: a.internals.positionAbsolute.x + aw / 2,
      y: a.internals.positionAbsolute.y + ah / 2,
    },
    bc = {
      x: b.internals.positionAbsolute.x + bw / 2,
      y: b.internals.positionAbsolute.y + bh / 2,
    };
  const dx = bc.x - ac.x,
    dy = bc.y - ac.y;
  const anchor = (
    c: { x: number; y: number },
    w: number,
    h: number,
    vx: number,
    vy: number,
  ) => {
    const scale =
      1 / Math.max(Math.abs(vx) / (w / 2), Math.abs(vy) / (h / 2), 0.0001);
    return {
      x: c.x + vx * scale,
      y: c.y + vy * scale,
      pos:
        Math.abs(vx) / (w / 2) > Math.abs(vy) / (h / 2)
          ? vx > 0
            ? Position.Right
            : Position.Left
          : vy > 0
            ? Position.Bottom
            : Position.Top,
    };
  };
  const aa = anchor(ac, aw, ah, dx, dy),
    bb = anchor(bc, bw, bh, -dx, -dy);
  const [path, x, y] = getBezierPath({
    sourceX: aa.x,
    sourceY: aa.y,
    targetX: bb.x,
    targetY: bb.y,
    sourcePosition: aa.pos,
    targetPosition: bb.pos,
    curvature: 0.2,
  });
  return (
    <>
      <defs>
        <marker
          id={`arrow-${id}`}
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill={connection.color} />
        </marker>
      </defs>
      <BaseEdge
        id={id}
        path={path}
        interactionWidth={24}
        style={{
          stroke: selected ? "#00b9d6" : connection.color,
          strokeWidth: selected ? 3 : 2.5,
        }}
        markerEnd={connection.arrow ? `url(#arrow-${id})` : undefined}
      />
      <EdgeLabelRenderer>
        {connection.label && !selected && (
          <div
            className="edge-label nodrag nopan"
            style={{
              transform: `translate(-50%,-50%) translate(${x}px,${y}px)`,
            }}
          >
            {connection.label}
          </div>
        )}
        {selected && !presentation && (
          <div
            className="edge-toolbar toolbar nodrag nopan"
            role="toolbar"
            aria-label="Connection actions"
            style={{
              transform: `translate(-50%,-50%) translate(${x}px,${y}px)`,
            }}
          >
            <Button
              label="Toggle connection arrow"
              active={connection.arrow}
              onClick={() =>
                useStore.getState().updateEdge(id, { arrow: !connection.arrow })
              }
            >
              <ArrowRight />
            </Button>
            <Button
              label="Connection color"
              onClick={() =>
                useStore.getState().updateEdge(id, {
                  color: connection.color === "#4b8dd0" ? "#b875a1" : "#4b8dd0",
                })
              }
            >
              <Palette />
            </Button>
            <Button
              label="Connection label"
              onClick={() => {
                void (async () => {
                  const label = await promptText(
                    "Connection label",
                    connection.label,
                  );
                  if (label !== null)
                    useStore.getState().updateEdge(id, { label });
                })();
              }}
            >
              <Type />
            </Button>
            <Button
              label="Delete connection"
              danger
              onClick={() => useStore.getState().deleteEdge(id)}
            >
              <Trash2 />
            </Button>
          </div>
        )}
      </EdgeLabelRenderer>
    </>
  );
}
