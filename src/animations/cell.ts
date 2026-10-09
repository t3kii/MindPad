import type { CellPhase } from "../types";
export const legalTransitions: Record<CellPhase, CellPhase[]> = {
  IDLE: ["HOVERED", "SELECTED", "OPENING"],
  HOVERED: ["IDLE", "SELECTED", "OPENING"],
  SELECTED: ["IDLE", "HOVERED", "OPENING", "DRAGGING"],
  OPENING: ["OPEN", "CLOSING", "DRAGGING"],
  OPEN: ["EDITING", "CLOSING", "DRAGGING", "RESIZING", "IDLE"],
  EDITING: ["OPEN", "CLOSING"],
  CLOSING: ["SELECTED", "OPENING", "DRAGGING"],
  DRAGGING: ["SELECTED", "OPEN", "OPENING", "CLOSING"],
  RESIZING: ["OPEN"],
};
export const canTransition = (from: CellPhase, to: CellPhase) =>
  from === to || legalTransitions[from].includes(to);
