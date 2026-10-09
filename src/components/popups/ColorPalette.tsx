import { COLORS } from "../../types";
import { useStore } from "../../state/store";
import { useUI } from "../../state/ui";
import { Check, MessageSquare } from "lucide-react";
export function ColorPalette({ id }: { id: string }) {
  const cell = useStore((s) => s.board.cells.find((c) => c.id === id));
  if (!cell) return null;
  return (
    <div className="color-panel">
      <div className="palette-title">
        <div className="palette-fonts" aria-label="Title size">
          {[42, 35, 28].map((size, i) => (
            <button
              key={size}
              aria-label={`${["Large", "Medium", "Small"][i]} title`}
              aria-pressed={(cell.titleSize ?? 35) === size}
              style={{ fontSize: 30 - i * 5 }}
              onClick={() =>
                useStore.getState().updateCell(id, { titleSize: size })
              }
            >
              A
            </button>
          ))}
        </div>
        <button
          className="icon-button"
          aria-label="Show compact preview"
          aria-pressed={cell.preview !== false}
          onClick={() =>
            useStore
              .getState()
              .updateCell(id, { preview: cell.preview === false })
          }
        >
          <MessageSquare size={20} />
        </button>
      </div>
      <div className="swatches">
        {COLORS.map((color, i) => (
          <button
            key={color}
            aria-label={`Color ${i + 1}`}
            aria-pressed={cell.color === color}
            style={{ background: color }}
            onClick={() => {
              useStore.getState().updateCell(id, { color });
              useUI.getState().close();
            }}
          >
            {cell.color === color && <Check size={18} />}
          </button>
        ))}
      </div>
    </div>
  );
}
