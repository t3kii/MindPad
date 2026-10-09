import type { Board } from "../types";
const colors = /^#[0-9a-f]{6}$/i;
const finite = (n: unknown): n is number =>
  typeof n === "number" && Number.isFinite(n) && Math.abs(n) < 1e7;
const id = (n: unknown): n is string =>
  typeof n === "string" && n.length > 0 && n.length < 200;
function validJSON(v: unknown, depth = 0): boolean {
  if (depth > 30 || !v || typeof v !== "object") return false;
  const n = v as Record<string, unknown>;
  return (
    typeof n.type === "string" &&
    (!n.text || typeof n.text === "string") &&
    (!n.content ||
      (Array.isArray(n.content) &&
        n.content.every((c) => validJSON(c, depth + 1))))
  );
}
export function parseImport(raw: string): Board[] {
  const data = JSON.parse(raw);
  if (
    data.version !== 1 ||
    !Array.isArray(data.boards) ||
    !data.boards.length ||
    data.boards.length > 100
  )
    throw new Error("This is not a supported MindPad backup.");
  for (const b of data.boards) {
    if (
      !id(b.id) ||
      typeof b.title !== "string" ||
      !Array.isArray(b.cells) ||
      b.cells.length > 2000 ||
      !Array.isArray(b.connections) ||
      !Array.isArray(b.locations) ||
      !b.viewport ||
      ![b.viewport.x, b.viewport.y, b.viewport.zoom].every(finite) ||
      b.viewport.zoom < 0.1 ||
      b.viewport.zoom > 3
    )
      throw new Error("Invalid board data.");
    const ids = new Set<string>();
    for (const c of b.cells) {
      if (c.titleSize !== undefined && ![28, 35, 42].includes(c.titleSize))
        throw new Error("Invalid title size.");
      if (c.preview !== undefined && typeof c.preview !== "boolean")
        throw new Error("Invalid preview mode.");
      if (
        !id(c.id) ||
        ids.has(c.id) ||
        typeof c.title !== "string" ||
        !colors.test(c.color) ||
        ![c.x, c.y, c.width, c.height].every(finite) ||
        c.width < 250 ||
        c.height < 150 ||
        typeof c.opened !== "boolean" ||
        !Array.isArray(c.pages) ||
        !c.pages.length ||
        c.pages.length > 100 ||
        !Number.isInteger(c.page) ||
        c.page < 0 ||
        c.page >= c.pages.length
      )
        throw new Error("Invalid cell data.");
      ids.add(c.id);
      for (const p of c.pages) {
        if (!id(p.id) || !validJSON(p.content) || !Array.isArray(p.attachments))
          throw new Error("Invalid page data.");
        for (const a of p.attachments)
          if (
            !id(a.id) ||
            typeof a.name !== "string" ||
            typeof a.type !== "string" ||
            typeof a.data !== "string" ||
            !/^data:(application\/pdf|image\/(png|jpeg|gif|webp));base64,/.test(
              a.data,
            )
          )
            throw new Error("Invalid attachment.");
      }
      // Disallow executable links and remote image sources in imported editor JSON.
      const walk = (n: any) => {
        if (
          n.type === "localVideo" &&
          !(
            typeof n.attrs?.src === "string" &&
            /^data:video\/(mp4|webm);base64,/.test(n.attrs.src)
          )
        )
          throw new Error("Invalid local video.");
        if (
          n.type === "image" &&
          !(
            typeof n.attrs?.src === "string" &&
            /^data:image\/(png|jpeg|gif|webp);base64,/.test(n.attrs.src)
          )
        )
          throw new Error("Only local raster images can be imported.");
        for (const m of n.marks ?? [])
          if (m.type === "link" && !/^https?:\/\//i.test(m.attrs?.href ?? ""))
            throw new Error("Invalid link.");
        for (const ch of n.content ?? []) walk(ch);
      };
      for (const p of c.pages) walk(p.content);
    }
    const edges = new Set();
    for (const e of b.connections) {
      if (
        !id(e.id) ||
        edges.has(e.id) ||
        !ids.has(e.source) ||
        !ids.has(e.target) ||
        e.source === e.target ||
        !colors.test(e.color) ||
        typeof e.label !== "string" ||
        typeof e.arrow !== "boolean"
      )
        throw new Error("Invalid connection.");
      edges.add(e.id);
    }
    for (const l of b.locations)
      if (
        typeof l.name !== "string" ||
        !l.viewport ||
        ![l.viewport.x, l.viewport.y, l.viewport.zoom].every(finite) ||
        l.viewport.zoom < 0.1 ||
        l.viewport.zoom > 3
      )
        throw new Error("Invalid saved location.");
  }
  return data.boards;
}
export function serialize(boards: Board[]) {
  return JSON.stringify({ version: 1, boards }, null, 2);
}
export function download(
  name: string,
  data: string,
  type = "application/json",
) {
  const url = URL.createObjectURL(new Blob([data], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export const fileData = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error("Could not read file."));
    r.readAsDataURL(file);
  });
