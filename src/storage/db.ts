import Dexie, { type Table } from "dexie";
import type { Board } from "../types";
class CanvasDB extends Dexie {
  boards!: Table<Board, string>;
  constructor() {
    super("mindpad-personal-canvas");
    this.version(1).stores({ boards: "id,updated" });
    this.version(2)
      .stores({ boards: "id,updated" })
      .upgrade((tx) =>
        tx
          .table("boards")
          .toCollection()
          .modify((board) => {
            board.locations ??= [];
          }),
      );
    this.version(3)
      .stores({ boards: "id,updated" })
      .upgrade((tx) =>
        tx
          .table("boards")
          .toCollection()
          .modify((board) => {
            for (const cell of board.cells) {
              cell.titleSize ??= 35;
              cell.preview ??= true;
            }
          }),
      );
  }
}
export const db = new CanvasDB();
