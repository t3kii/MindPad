import {
  Menu,
  Search,
  Pencil,
  Link2,
  Plus,
  Download,
  SlidersHorizontal,
  Check,
  Loader2,
  Sun,
  Moon,
  Upload,
  FolderOpen,
  Undo2,
  Redo2,
  Presentation,
  Bookmark,
  HelpCircle,
  HardDrive,
  Maximize,
} from "lucide-react";
import { useStore } from "../../state/store";
import { useUI, promptText, pickFile } from "../../state/ui";
import { download, serialize } from "../../utils/transfer";
import { Button } from "../toolbars/Button";
export const exportBoard = () => {
  const s = useStore.getState();
  download(
    `${s.board.title.replace(/[^a-z0-9_-]/gi, "_")}.mindpad.json`,
    serialize([s.board]),
  );
};
export const importBoard = async () => {
  const f = await pickFile("Import MindPad board or backup", ".json");
  if (!f) return;
  try {
    if (f.size > 100 * 1024 * 1024) throw new Error("Backup exceeds 100 MB.");
    await useStore.getState().importBoards(await f.text());
  } catch (e) {
    void useUI
      .getState()
      .ask({ kind: "info", title: "Import failed", description: String(e) });
  }
};
export const help = () => {
  void useUI.getState().ask({
    kind: "help",
    title: "A little room for big ideas",
    description:
      "Your boards stay in this browser. Export a backup to keep another copy.",
  });
};
export function Navigation({
  onBoards,
  onSearch,
  onAdd,
  onFit,
}: {
  onBoards: () => void;
  onSearch: () => void;
  onAdd: () => void;
  onFit: () => void;
}) {
  const s = useStore();
  const rename = async () => {
    const title = await promptText("Board title", s.board.title);
    if (title?.trim())
      s.mutate((b) => {
        b.title = title.trim();
      });
  };
  const settings = (el: HTMLElement) => {
    const r = el.getBoundingClientRect();
    useUI.getState().menuAt(r.right - 220, r.bottom + 10, [
      {
        label:
          s.theme === "dark" ? "Switch to light mode" : "Switch to dark mode",
        action: s.toggleTheme,
      },
      {
        label: "Import board / backup",
        action: () => {
          void importBoard();
        },
      },
      { label: "Export current board", action: exportBoard },
      {
        label: "Backup all boards",
        action: () => {
          const state = useStore.getState();
          download(
            "mindpad-backup.json",
            serialize([
              state.board,
              ...state.boards.filter((b) => b.id !== state.board.id),
            ]),
          );
        },
      },
      { label: "Keyboard help", action: help },
    ]);
  };
  const display = (el: HTMLElement) => {
    const r = el.getBoundingClientRect();
    useUI.getState().menuAt(r.left, r.bottom + 10, [
      { label: "Fit all cells", action: onFit },
      {
        label: s.presentation ? "Leave presentation" : "Start presentation",
        action: () =>
          useStore.setState({ presentation: !s.presentation, selected: null }),
      },
      {
        label: "Save canvas location",
        action: () => {
          void (async () => {
            const name = await promptText("Save canvas location", "My view");
            if (name)
              s.mutate((b) =>
                b.locations.push({ name, viewport: { ...b.viewport } }),
              );
          })();
        },
      },
    ]);
  };
  const backgroundOptions = (el: HTMLElement) => {
    const r = el.getBoundingClientRect();
    useUI.getState().menuAt(r.left, r.bottom + 10, [
      { label: "Dark background", action: () => s.setBackground("dark") },
      { label: "Lighter background", action: () => s.setBackground("lighter") },
      { label: "Light background", action: () => s.setBackground("light") },
    ]);
  };
  return (
    <header className="topbar">
      <div className="nav-left">
        <Button label="Boards" onClick={onBoards}>
          <Menu />
        </Button>
        <button
          className="brand"
          aria-label="MindPad boards"
          onClick={onBoards}
        >
          <span className="brand-symbol">m</span>
        </button>
        <button
          className="board-title"
          onClick={() => {
            void rename();
          }}
        >
          {s.board.title}
        </button>
        <Button
          label="Rename board"
          onClick={() => {
            void rename();
          }}
        >
          <Pencil size={16} />
        </Button>
        <span
          className={`save-status ${s.status}`}
          title={
            s.status === "saved"
              ? "Saved locally"
              : s.status === "saving"
                ? "Saving locally"
                : s.error
          }
          aria-live="polite"
        >
          {s.status === "saved" ? (
            <Check size={12} />
          ) : s.status === "saving" ? (
            <Loader2 className="spin" size={12} />
          ) : (
            <HardDrive size={12} />
          )}
          <span>
            {s.status === "saved"
              ? "Saved locally"
              : s.status === "saving"
                ? "Saving…"
                : "Save failed"}
          </span>
        </span>
      </div>
      <div className="nav-right">
        {!s.presentation && (
          <>
            <Button label="Undo" disabled={!s.history.length} onClick={s.undo}>
              <Undo2 />
            </Button>
            <Button label="Redo" disabled={!s.future.length} onClick={s.redo}>
              <Redo2 />
            </Button>
            <span className="nav-divider" />
            <Button label="New cell" onClick={onAdd}>
              <Plus />
            </Button>
          </>
        )}
        <Button label="Search" onClick={onSearch}>
          <Search />
        </Button>
        <button
          className="background-button"
          aria-label="Background options"
          aria-haspopup="menu"
          title={`Background: ${s.background}`}
          onClick={(e) => backgroundOptions(e.currentTarget)}
        >
          <Sun size={18} /> <span>Background</span>
        </button>
        <button
          className="display-button"
          aria-label="Display settings"
          onClick={(e) => display(e.currentTarget)}
        >
          Aa <SlidersHorizontal size={18} />
        </button>
        {!s.presentation && (
          <Button
            label="Connection mode"
            active={!!s.connectSource}
            disabled={!s.selected}
            onClick={() =>
              useStore.setState({
                connectSource: s.connectSource ? null : s.selected,
              })
            }
          >
            <Link2 />
          </Button>
        )}
        <Button
          label={s.presentation ? "Leave presentation" : "Presentation"}
          active={s.presentation}
          onClick={() =>
            useStore.setState({ presentation: !s.presentation, selected: null })
          }
        >
          <Presentation />
        </Button>
        <button
          className="export-button"
          aria-label="Export board"
          onClick={exportBoard}
        >
          <Download size={17} />
          <span>Export</span>
        </button>
        <button
          className="local-profile"
          aria-label="Local settings"
          title="Local settings"
          onClick={(e) => settings(e.currentTarget)}
        >
          <FolderOpen size={19} />
        </button>
      </div>
    </header>
  );
}
export function ViewControls({
  zoom,
  onZoom,
  onFit,
  onCenter,
  onLocations,
}: {
  zoom: number;
  onZoom: (delta: number) => void;
  onFit: () => void;
  onCenter: () => void;
  onLocations: (el: HTMLElement) => void;
}) {
  const selected = useStore((s) => s.selected);
  return (
    <div className="view-controls">
      <div className="view-tools toolbar">
        <Button label="Keyboard help" onClick={help}>
          <HelpCircle />
        </Button>
        <Button
          label="Saved locations"
          onClick={() => {
            const el = document.querySelector<HTMLElement>(
              '[aria-label="Saved locations"]',
            );
            if (el) onLocations(el);
          }}
        >
          <Bookmark />
        </Button>
        <Button
          label="Center selection"
          disabled={!selected}
          onClick={onCenter}
        >
          <Maximize size={16} />
        </Button>
        <Button label="Fit content" onClick={onFit}>
          <SlidersHorizontal />
        </Button>
      </div>
      <div className="zoom-controls toolbar">
        <Button label="Zoom in" onClick={() => onZoom(1)}>
          <Plus />
        </Button>
        <span data-testid="zoom-level">{Math.round(zoom * 100)}%</span>
        <Button label="Zoom out" onClick={() => onZoom(-1)}>
          <span style={{ fontSize: 25 }}>−</span>
        </Button>
      </div>
    </div>
  );
}
