import { describe, it, expect } from "vitest";
import { newBoard, newCell } from "../types";
import { parseImport, serialize } from "./transfer";
import { canTransition } from "../animations/cell";
const fixture = () => {
  const b = newBoard("Test board");
  b.cells.push(newCell(10, 20), newCell(400, 20));
  b.connections.push({
    id: "edge",
    source: b.cells[0].id,
    target: b.cells[1].id,
    color: "#4c657f",
    label: "Idea",
    arrow: true,
  });
  return b;
};
describe("portable local backups", () => {
  it("roundtrips cells, multiple pages, connections and viewport", () => {
    const b = fixture();
    b.viewport = { x: 120, y: -90, zoom: 1.2 };
    expect(parseImport(serialize([b]))).toEqual([b]);
  });
  it("rejects broken edge endpoints", () => {
    const b = fixture();
    b.connections[0].target = "missing";
    expect(() => parseImport(serialize([b]))).toThrow("Invalid connection");
  });
  it("rejects duplicate cell identities", () => {
    const b = fixture();
    b.cells[1].id = b.cells[0].id;
    expect(() => parseImport(serialize([b]))).toThrow("Invalid cell");
  });
  it("rejects invalid camera and geometry", () => {
    const b = fixture();
    b.viewport.zoom = -1;
    expect(() => parseImport(serialize([b]))).toThrow("Invalid board");
    b.viewport.zoom = 1;
    b.cells[0].width = 0;
    expect(() => parseImport(serialize([b]))).toThrow("Invalid cell");
  });
  it("rejects executable links and remote images", () => {
    const b = fixture();
    b.cells[0].pages[0].content = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "Bad",
              marks: [{ type: "link", attrs: { href: "javascript:alert(1)" } }],
            },
          ],
        },
      ],
    };
    expect(() => parseImport(serialize([b]))).toThrow("Invalid link");
    b.cells[0].pages[0].content = {
      type: "doc",
      content: [
        { type: "image", attrs: { src: "https://example.com/tracker.png" } },
      ],
    };
    expect(() => parseImport(serialize([b]))).toThrow("Only local");
  });
  it("accepts safe local media and expressions", () => {
    const b = fixture();
    b.cells[0].pages[0].content = {
      type: "doc",
      content: [
        { type: "image", attrs: { src: "data:image/png;base64,aGVsbG8=" } },
        {
          type: "paragraph",
          content: [{ type: "inlineMath", attrs: { latex: "x^2" } }],
        },
      ],
    };
    expect(parseImport(serialize([b]))[0].cells[0].pages).toEqual(
      b.cells[0].pages,
    );
  });
  it("rejects corrupted JSON without changing the source", () => {
    const b = fixture();
    const before = serialize([b]);
    expect(() => parseImport("{")).toThrow();
    expect(serialize([b])).toBe(before);
  });
});
describe("gesture conflicts", () => {
  it("prevents editing while dragging or resizing", () => {
    expect(canTransition("DRAGGING", "EDITING")).toBe(false);
    expect(canTransition("RESIZING", "EDITING")).toBe(false);
  });
  it("permits rapid reversal without completing the stale animation", () => {
    expect(canTransition("OPENING", "CLOSING")).toBe(true);
    expect(canTransition("CLOSING", "OPENING")).toBe(true);
  });
});
