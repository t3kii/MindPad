import { useEffect, useRef, useState } from "react";
import { X, Plus, ArrowUpRight, Trash2, Search, Layers } from "lucide-react";
import { useStore } from "../../state/store";
import { confirmAction } from "../../state/ui";
import { textContent } from "../../types";
export function Boards({ close }: { close: () => void }) {
  const s = useStore();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.querySelector<HTMLButtonElement>("button")?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", key);
    return () => document.removeEventListener("keydown", key);
  }, [close]);
  return (
    <div
      className="side-overlay"
      onPointerDown={(e) => {
        if (e.currentTarget === e.target) close();
      }}
    >
      <aside ref={ref} className="boards-panel" aria-label="Boards dashboard">
        <div className="panel-heading">
          <span className="eyebrow">YOUR SPACE</span>
          <button
            className="icon-button"
            aria-label="Close boards"
            onClick={close}
          >
            <X />
          </button>
        </div>
        <h1>
          Thoughts,
          <br />
          connected.
        </h1>
        <p className="panel-description">
          A private canvas for everything on your mind.
        </p>
        <button
          className="new-board"
          onClick={() => {
            void s.createBoard().then(close);
          }}
        >
          <Plus size={18} /> New board
        </button>
        <div className="board-list">
          {[s.board, ...s.boards.filter((b) => b.id !== s.board.id)].map(
            (b) => (
              <div
                className={`board-row ${b.id === s.board.id ? "current" : ""}`}
                key={b.id}
              >
                <button
                  onClick={() => {
                    void s.switchBoard(b.id).then(close);
                  }}
                >
                  <Layers size={20} />
                  <span>
                    <strong>{b.title}</strong>
                    <small>
                      {b.cells.length} cells · {b.connections.length}{" "}
                      connections
                    </small>
                  </span>
                  <ArrowUpRight size={16} />
                </button>
                <button
                  className="icon-button danger"
                  aria-label={`Delete board ${b.title}`}
                  onClick={() => {
                    void (async () => {
                      if (
                        await confirmAction(
                          "Delete board?",
                          `Delete “${b.title}” and all its contents? Export a copy first if you need a backup.`,
                        )
                      )
                        await s.deleteBoard(b.id);
                    })();
                  }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ),
          )}
        </div>
        <div className="panel-footer">
          Stored on this device. No account required.
        </div>
      </aside>
    </div>
  );
}
export function SearchPanel({
  close,
  onResult,
}: {
  close: () => void;
  onResult: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const cells = useStore((s) => s.board.cells);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    input.current?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", key);
    return () => document.removeEventListener("keydown", key);
  }, [close]);
  const results = cells.filter((c) =>
    `${c.title} ${c.pages.map((p) => textContent(p.content)).join(" ")}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  return (
    <div
      className="search-overlay"
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div className="search-panel">
        <div className="search-input">
          <Search size={20} />
          <input
            ref={input}
            aria-label="Search cells"
            placeholder="Find a thought…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button
            className="icon-button"
            aria-label="Close search"
            onClick={close}
          >
            <X size={18} />
          </button>
        </div>
        <div className="search-results">
          {results.map((c) => (
            <button
              key={c.id}
              onClick={() => {
                onResult(c.id);
                close();
              }}
            >
              <i style={{ background: c.color }} />
              <span>
                <strong>{c.title || "Untitled"}</strong>
                <small>
                  {textContent(c.pages[0].content).slice(0, 90) || "Empty cell"}
                </small>
              </span>
              <ArrowUpRight size={17} />
            </button>
          ))}
          {!results.length && <p>No matching cells.</p>}
        </div>
      </div>
    </div>
  );
}
