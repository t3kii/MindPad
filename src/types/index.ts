import type { JSONContent } from "@tiptap/react";
export type CellPhase =
  | "IDLE"
  | "HOVERED"
  | "SELECTED"
  | "OPENING"
  | "OPEN"
  | "EDITING"
  | "CLOSING"
  | "DRAGGING"
  | "RESIZING";
export type Page = {
  id: string;
  content: JSONContent;
  attachments: Attachment[];
};
export type Attachment = {
  id: string;
  name: string;
  type: string;
  data: string;
};
export type Cell = {
  id: string;
  x: number;
  y: number;
  title: string;
  color: string;
  titleSize?: number;
  preview?: boolean;
  opened: boolean;
  width: number;
  height: number;
  pages: Page[];
  page: number;
};
export type Connection = {
  id: string;
  source: string;
  target: string;
  color: string;
  label: string;
  arrow: boolean;
};
export type Camera = { x: number; y: number; zoom: number };
export type Board = {
  id: string;
  title: string;
  cells: Cell[];
  connections: Connection[];
  viewport: Camera;
  locations: { name: string; viewport: Camera }[];
  updated: number;
};
export const COLORS = [
  "#5e5d59",
  "#75494e",
  "#687740",
  "#416f6b",
  "#6b5784",
  "#41433e",
  "#7b5943",
  "#4f7c47",
  "#4c657f",
  "#79547e",
  "#33362f",
  "#75764c",
  "#44785e",
  "#565682",
  "#784f67",
];
export const uid = () => crypto.randomUUID();
export const blankPage = (): Page => ({
  id: uid(),
  content: { type: "doc", content: [{ type: "paragraph" }] },
  attachments: [],
});
export const newCell = (x: number, y: number): Cell => ({
  id: uid(),
  x,
  y,
  title: "",
  color: "#4c657f",
  opened: false,
  width: 500,
  height: 384,
  pages: [blankPage()],
  page: 0,
});
export const newBoard = (title = "Untitled board"): Board => ({
  id: uid(),
  title,
  cells: [],
  connections: [],
  viewport: { x: 0, y: 0, zoom: 1 },
  locations: [],
  updated: Date.now(),
});
export const textContent = (content: JSONContent): string =>
  (content.text ?? "") + (content.content?.map(textContent).join(" ") ?? "");
