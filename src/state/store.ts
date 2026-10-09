import { create } from "zustand";
import { db } from "../storage/db";
import {
  blankPage,
  newBoard,
  newCell,
  uid,
  type Board,
  type Camera,
  type Cell,
  type Connection,
} from "../types";
import { parseImport } from "../utils/transfer";
type Background = "dark" | "lighter" | "light";
const savedBackground = localStorage.getItem("mindpad-background");
const initialBackground: Background =
  savedBackground === "dark" || savedBackground === "lighter" || savedBackground === "light"
    ? savedBackground
    : localStorage.getItem("mindpad-theme") === "light" ? "light" : "lighter";
type State = {
  revision: number;
  board: Board;
  boards: Board[];
  ready: boolean;
  selected: string | null;
  edgeSelected: string | null;
  history: Board[];
  future: Board[];
  status: "saved" | "saving" | "error";
  error: string;
  theme: "dark" | "light";
  background: Background;
  presentation: boolean;
  connectSource: string | null;
  init: () => Promise<void>;
  save: () => Promise<void>;
  mutate: (fn: (b: Board) => void, record?: boolean) => void;
  checkpoint: () => void;
  updateCell: (id: string, patch: Partial<Cell>, record?: boolean) => void;
  addCell: (x: number, y: number) => string;
  deleteCell: (id: string) => void;
  duplicate: (id: string) => void;
  select: (id: string | null) => void;
  connect: (source: string, target: string) => void;
  updateEdge: (id: string, patch: Partial<Connection>) => void;
  deleteEdge: (id: string) => void;
  undo: () => void;
  redo: () => void;
  camera: (v: Camera) => void;
  addPage: (id: string) => void;
  switchBoard: (id: string) => Promise<void>;
  createBoard: () => Promise<void>;
  deleteBoard: (id: string) => Promise<void>;
  importBoards: (raw: string) => Promise<void>;
  toggleTheme: () => void;
  setBackground: (background: Background) => void;
};
const clone = <T>(v: T): T => structuredClone(v);
let timer: ReturnType<typeof setTimeout>;
let writeQueue = Promise.resolve();
const enqueue = (board: Board) => {
  const snapshot = clone(board);
  const result = writeQueue.then(() => db.boards.put(snapshot)).then(() => {});
  writeQueue = result.catch(() => {});
  return result;
};
const schedule = () => {
  clearTimeout(timer);
  useStore.setState({ status: "saving" });
  timer = setTimeout(() => void useStore.getState().save(), 350);
};
export const useStore = create<State>((set, get) => ({
  revision: 0,
  board: newBoard(),
  boards: [],
  ready: false,
  selected: null,
  edgeSelected: null,
  history: [],
  future: [],
  status: "saved",
  error: "",
  theme: initialBackground === "light" ? "light" : "dark",
  background: initialBackground,
  presentation: false,
  connectSource: null,
  init: async () => {
    try {
      const boards = await db.boards.orderBy("updated").reverse().toArray();
      let board =
        boards.find((b) => b.id === localStorage.getItem("mindpad-current")) ??
        boards[0];
      if (!board) {
        board = newBoard("My visual canvas");
        await db.boards.put(board);
        boards.push(board);
      }
      set({ board, boards, ready: true });
    } catch (e) {
      set({
        ready: true,
        status: "error",
        error: `Storage unavailable: ${String(e)}. Export your work before leaving.`,
      });
    }
  },
  save: async () => {
    clearTimeout(timer);
    const board = get().board;
    try {
      await enqueue(board);
      set((s) => ({
        status: s.board === board ? "saved" : s.status,
        boards: [board, ...s.boards.filter((b) => b.id !== board.id)],
      }));
    } catch (e) {
      set({
        status: "error",
        error: `Autosave failed: ${String(e)}. Export your work to avoid losing it.`,
      });
    }
  },
  mutate: (fn, record = true) => {
    const before = get().board;
    const board = clone(before);
    fn(board);
    board.updated = Date.now();
    set((s) => ({
      board,
      history: record ? [...s.history.slice(-79), clone(before)] : s.history,
      future: record ? [] : s.future,
    }));
    schedule();
  },
  checkpoint: () =>
    set((s) => ({
      history: [...s.history.slice(-79), clone(s.board)],
      future: [],
    })),
  updateCell: (id, patch, record = true) =>
    get().mutate((b) => {
      const c = b.cells.find((c) => c.id === id);
      if (c) {
        if (patch.opened !== undefined && patch.opened !== c.opened) {
          const sign = patch.opened ? -1 : 1;
          patch = {
            x: c.x + (sign * (c.width - 376)) / 2,
            y: c.y + sign * 60,
            ...patch,
          };
        }
        Object.assign(c, patch);
      }
    }, record),
  addCell: (x, y) => {
    const c = newCell(x, y);
    get().mutate((b) => b.cells.push(c));
    set({ selected: c.id });
    return c.id;
  },
  deleteCell: (id) => {
    get().mutate((b) => {
      b.cells = b.cells.filter((c) => c.id !== id);
      b.connections = b.connections.filter(
        (e) => e.source !== id && e.target !== id,
      );
    });
    set({ selected: null, connectSource: null });
  },
  duplicate: (id) => {
    const cell = get().board.cells.find((c) => c.id === id);
    if (!cell) return;
    const c = clone(cell);
    c.id = uid();
    c.x += 60;
    c.y += 60;
    c.pages = c.pages.map((p) => ({ ...p, id: uid() }));
    get().mutate((b) => b.cells.push(c));
    set({ selected: c.id });
  },
  select: (id) => set({ selected: id, edgeSelected: null }),
  connect: (source, target) => {
    if (
      source === target ||
      get().board.connections.some(
        (e) =>
          (e.source === source && e.target === target) ||
          (e.source === target && e.target === source),
      )
    )
      return;
    get().mutate((b) =>
      b.connections.push({
        id: uid(),
        source,
        target,
        color: "#4b8dd0",
        label: "",
        arrow: false,
      }),
    );
    set({ connectSource: null });
  },
  updateEdge: (id, patch) =>
    get().mutate((b) => {
      const e = b.connections.find((e) => e.id === id);
      if (e) Object.assign(e, patch);
    }),
  deleteEdge: (id) => {
    get().mutate((b) => {
      b.connections = b.connections.filter((e) => e.id !== id);
    });
    set({ edgeSelected: null });
  },
  undo: () => {
    const s = get();
    if (!s.history.length) return;
    set({
      revision: s.revision + 1,
      board: clone(s.history.at(-1)!),
      history: s.history.slice(0, -1),
      future: [...s.future, clone(s.board)],
      selected: null,
    });
    schedule();
  },
  redo: () => {
    const s = get();
    if (!s.future.length) return;
    set({
      revision: s.revision + 1,
      board: clone(s.future.at(-1)!),
      future: s.future.slice(0, -1),
      history: [...s.history, clone(s.board)],
      selected: null,
    });
    schedule();
  },
  camera: (v) =>
    get().mutate((b) => {
      b.viewport = v;
    }, false),
  addPage: (id) => {
    get().mutate((b) => {
      const c = b.cells.find((c) => c.id === id);
      if (c) {
        c.pages.push(blankPage());
        c.page = c.pages.length - 1;
        if (!c.opened) {
          c.x -= (c.width - 376) / 2;
          c.y -= 60;
        }
        c.opened = true;
      }
    });
  },
  switchBoard: async (id) => {
    await get().save();
    const board = get().boards.find((b) => b.id === id);
    if (board) {
      localStorage.setItem("mindpad-current", id);
      set({
        board: clone(board),
        history: [],
        future: [],
        selected: null,
        edgeSelected: null,
        connectSource: null,
        presentation: false,
      });
    }
  },
  createBoard: async () => {
    await get().save();
    const board = newBoard();
    set((s) => ({
      board,
      boards: [board, ...s.boards],
      selected: null,
      history: [],
      future: [],
    }));
    localStorage.setItem("mindpad-current", board.id);
    await get().save();
  },
  deleteBoard: async (id) => {
    await get().save();
    await writeQueue;
    await db.boards.delete(id);
    let boards = get().boards.filter((b) => b.id !== id);
    if (!boards.length) {
      const board = newBoard();
      await db.boards.put(board);
      boards = [board];
    }
    set({ boards });
    if (get().board.id === id) {
      set({ board: clone(boards[0]), history: [], future: [], selected: null });
      localStorage.setItem("mindpad-current", boards[0].id);
    }
  },
  importBoards: async (raw) => {
    const incoming = parseImport(raw).map((b) => ({
      ...b,
      id: uid(),
      updated: Date.now(),
    }));
    await get().save();
    await writeQueue;
    await db.boards.bulkPut(incoming);
    set((s) => ({
      boards: [...incoming, ...s.boards],
      board: incoming[0],
      selected: null,
      history: [],
      future: [],
    }));
    localStorage.setItem("mindpad-current", incoming[0].id);
  },
  toggleTheme: () => {
    get().setBackground(get().theme === "dark" ? "light" : "lighter");
  },
  setBackground: (background) => {
    const theme = background === "light" ? "light" : "dark";
    localStorage.setItem("mindpad-theme", theme);
    localStorage.setItem("mindpad-background", background);
    set({ theme, background });
  },
}));
