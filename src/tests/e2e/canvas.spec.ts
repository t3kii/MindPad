import { test, expect, type Page, type Locator } from "@playwright/test";
import { readFile } from "node:fs/promises";
const cell = (page: Page) => page.locator("[data-cell-id]");
const selected = (page: Page) => page.locator(".cell-shell.selected");
const create = async (page: Page, title = "") => {
  await page.getByRole("button", { name: "New cell", exact: true }).click();
  const node = selected(page);
  if (title) {
    await node.locator(".cell-header").dblclick();
    await page
      .getByRole("textbox", { name: "Cell title", exact: true })
      .fill(title);
    await page.getByRole("button", { name: "Save", exact: true }).click();
  }
  return node;
};
const open = async (page: Page) => {
  await selected(page)
    .getByRole("button", { name: "Open cell", exact: true })
    .click();
  await expect(
    selected(page).getByRole("textbox", { name: "Cell content" }),
  ).toBeVisible();
  await page.waitForTimeout(750);
};
const saved = async (page: Page) => {
  await expect(page.locator(".save-status")).toHaveText("Saved locally");
};
const move = async (page: Page, node: Locator, dx: number, dy: number) => {
  const r = await node.locator(".cell-header").boundingBox();
  if (!r) throw Error("Missing header");
  await page.mouse.move(r.x + r.width / 2, r.y + r.height / 2);
  await page.mouse.down();
  // Activate XYFlow's drag threshold before measuring the movement itself.
  await page.mouse.move(r.x + r.width / 2 + 5, r.y + r.height / 2);
  await page.mouse.move(r.x + r.width / 2 + dx + 5, r.y + r.height / 2 + dy, {
    steps: 15,
  });
  await page.mouse.up();
};
const selectEdge = async (page: Page) => {
  await page.evaluate(
    () =>
      new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve)),
      ),
  );
  const point = await page
    .locator(".react-flow__edge-path")
    .first()
    .evaluate((path: SVGPathElement) => {
      const p = path.getPointAtLength(path.getTotalLength() / 2);
      const screen = new DOMPoint(p.x, p.y).matrixTransform(
        path.getScreenCTM()!,
      );
      return { x: screen.x, y: screen.y };
    });
  await page.mouse.click(point.x, point.y);
};
test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "New cell", exact: true }),
  ).toBeVisible();
});
test("create, rename, select, palette keyboard, open, close and persistence", async ({
  page,
}) => {
  await page.screenshot({ path: "docs/implementation-screenshots/empty.png" });
  await create(page, "Blue thought");
  await expect(selected(page).locator(".cell-header")).toHaveText(
    "Blue thought",
  );
  await page.screenshot({
    path: "docs/implementation-screenshots/compact-blue.png",
  });
  await selected(page)
    .getByRole("button", { name: "Cell color", exact: true })
    .click();
  await expect(page.getByRole("menu")).toBeVisible();
  await page.screenshot({
    path: "docs/implementation-screenshots/palette.png",
  });
  await page.getByRole("button", { name: "Small title", exact: true }).click();
  await expect(selected(page).locator(".cell-header")).toHaveCSS(
    "font-size",
    "28px",
  );
  await page.getByRole("button", { name: "Large title", exact: true }).click();
  await expect(selected(page).locator(".cell-header")).toHaveCSS(
    "font-size",
    "42px",
  );
  await page.getByRole("button", { name: "Medium title", exact: true }).click();
  await page
    .getByRole("button", { name: "Show compact preview", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Show compact preview", exact: true }),
  ).toHaveAttribute("aria-pressed", "false");
  await page.getByRole("button", { name: "Color 15", exact: true }).click();
  await expect(selected(page).locator(".cell-card")).toHaveCSS(
    "--header",
    "#784f67",
  );
  await page.screenshot({ path: "docs/implementation-screenshots/pink.png" });
  await open(page);
  await selected(page)
    .getByRole("textbox", { name: "Cell content" })
    .fill("Persist this thought");
  await selected(page)
    .getByRole("button", { name: "Close cell", exact: true })
    .click();
  await expect(page.getByRole("textbox", { name: "Cell content" })).toHaveCount(
    0,
  );
  await saved(page);
  await page.reload();
  await expect(cell(page)).toHaveCount(1);
  await cell(page).locator(".cell-header").click();
  await open(page);
  await expect(page.getByRole("textbox", { name: "Cell content" })).toHaveText(
    "Persist this thought",
  );
  await expect(selected(page).locator(".cell-card")).toHaveCSS(
    "--header",
    "#784f67",
  );
});
test("numbered lists, Enter continuation, empty-item exit and selection formatting", async ({
  page,
}) => {
  await create(page, "Lists");
  await open(page);
  const editor = page.getByRole("textbox", { name: "Cell content" });
  await editor.click();
  await page.keyboard.type("First idea");
  await page
    .getByRole("button", { name: "Numbered list", exact: true })
    .click();
  await page.keyboard.press("End");
  await page.keyboard.press("Enter");
  await page.keyboard.type("Second idea");
  await expect(editor.locator("ol li")).toHaveCount(2);
  await expect(editor.locator("ol li").nth(1)).toHaveText("Second idea");
  await page.screenshot({
    path: "docs/implementation-screenshots/numbered-list.png",
  });
  await page.keyboard.press("Enter");
  await page.keyboard.press("Enter");
  await page.keyboard.type("Outside list");
  await expect(editor.locator("ol li")).toHaveCount(2);
  await expect(
    editor.locator(":scope > p").filter({ hasText: /^Outside list$/ }),
  ).toHaveText("Outside list");
  await page.keyboard.press("Control+a");
  await page.getByRole("button", { name: "Bold", exact: true }).click();
  await expect(editor.locator("strong")).toHaveCount(3);
  await saved(page);
  await page.reload();
  await expect(
    page.getByRole("textbox", { name: "Cell content" }).locator("ol li"),
  ).toHaveCount(2);
});
test("rapid animation reversals and two independently edited cells", async ({
  page,
}) => {
  await create(page, "First");
  await open(page);
  await page.getByRole("textbox", { name: "Cell content" }).fill("First page");
  await move(page, selected(page), -340, -160);
  await create(page, "Second");
  await open(page);
  await selected(page)
    .getByRole("textbox", { name: "Cell content" })
    .fill("Second page");
  for (let i = 0; i < 3; i++) {
    await selected(page)
      .getByRole("button", { name: "Close cell", exact: true })
      .click();
    await selected(page)
      .getByRole("button", { name: "Open cell", exact: true })
      .click();
  }
  await page.waitForTimeout(800);
  await expect(page.getByRole("textbox", { name: "Cell content" })).toHaveCount(
    2,
  );
  await expect(
    selected(page).getByRole("textbox", { name: "Cell content" }),
  ).toHaveText("Second page");
  await expect(selected(page)).toHaveAttribute("data-phase", /OPEN|EDITING/);
  await saved(page);
  await page.reload();
  await expect(page.getByRole("textbox", { name: "Cell content" })).toHaveCount(
    2,
  );
});
test("drag, connect, endpoint movement, edge controls, deletion, undo and redo", async ({
  page,
}) => {
  await create(page, "Source");
  await move(page, selected(page), -350, 80);
  const first = cell(page).first();
  const firstId = await first.getAttribute("data-cell-id");
  await create(page, "Target");
  await move(page, selected(page), 200, -180);
  await first.locator(".cell-header").click();
  await selected(page)
    .getByRole("button", { name: "Connect cell", exact: true })
    .click();
  await cell(page).nth(1).locator(".cell-header").click();
  const edge = page.locator(".react-flow__edge");
  await expect(edge).toHaveCount(1);
  const path = edge.locator("path.react-flow__edge-path");
  const before = await path.getAttribute("d");
  await move(page, cell(page).nth(1), -80, 70);
  await expect(path).not.toHaveAttribute("d", before!);
  await page.screenshot({
    path: "docs/implementation-screenshots/connected.png",
  });
  await selectEdge(page);
  await page
    .getByRole("button", { name: "Connection label", exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "Connection label", exact: true })
    .fill("Related");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await page
    .getByRole("button", { name: "Toggle connection arrow", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Delete connection", exact: true })
    .click();
  await expect(edge).toHaveCount(0);
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(edge).toHaveCount(1);
  await page.getByRole("button", { name: "Redo", exact: true }).click();
  await expect(edge).toHaveCount(0);
  await saved(page);
  await page.reload();
  await expect(cell(page).first()).toHaveAttribute("data-cell-id", firstId!);
  await expect(edge).toHaveCount(0);
});
test("drag-handle connections have a live preview", async ({ page }) => {
  await create(page, "A");
  await move(page, selected(page), -300, 100);
  await create(page, "B");
  await move(page, selected(page), 200, -100);
  await cell(page).first().locator(".cell-header").click();
  await cell(page).first().locator(".source-handle").hover();
  const a = await cell(page).first().locator(".source-handle").boundingBox();
  const b = await cell(page).nth(1).locator(".target-handle").boundingBox();
  if (!a || !b) throw Error("Missing handles");
  await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
  await page.mouse.down();
  await page.mouse.move((a.x + b.x) / 2, (a.y + b.y) / 2, { steps: 5 });
  await expect(page.locator(".react-flow__connection")).toBeVisible();
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 5 });
  await page.mouse.up();
  await expect(page.locator(".react-flow__edge")).toHaveCount(1);
});
test("popup Escape/outside, context menu, confirmation, duplicate and copy/paste", async ({
  page,
}) => {
  await create(page, "Original");
  await selected(page)
    .getByRole("button", { name: "Cell color", exact: true })
    .click();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("menu")).toHaveCount(0);
  await selected(page)
    .getByRole("button", { name: "Cell color", exact: true })
    .click();
  await page.mouse.click(50, 200);
  await expect(page.getByRole("menu")).toHaveCount(0);
  await cell(page).locator(".cell-header").click({ button: "right" });
  await page.getByRole("menuitem", { name: "Duplicate", exact: true }).click();
  await expect(cell(page)).toHaveCount(2);
  await page.keyboard.press("Control+c");
  await page.keyboard.press("Control+v");
  await expect(cell(page)).toHaveCount(3);
  await selected(page)
    .getByRole("button", { name: "Delete cell", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.screenshot({ path: "docs/implementation-screenshots/modal.png" });
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(cell(page)).toHaveCount(3);
  await selected(page)
    .getByRole("button", { name: "Delete cell", exact: true })
    .click();
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await expect(cell(page)).toHaveCount(2);
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(cell(page)).toHaveCount(3);
});
test("export/import roundtrip and invalid imports leave current board intact", async ({
  page,
}) => {
  await create(page, "Portable");
  await open(page);
  await page
    .getByRole("textbox", { name: "Cell content" })
    .fill("Offline content");
  await saved(page);
  const dl = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export board", exact: true }).click();
  const file = await dl;
  const path = await file.path();
  if (!path) throw Error("No download");
  const raw = await readFile(path);
  await page
    .getByRole("button", { name: "Local settings", exact: true })
    .click();
  await page
    .getByRole("menuitem", { name: "Import board / backup", exact: true })
    .click();
  await page.getByLabel("Choose file").setInputFiles({
    name: "roundtrip.json",
    mimeType: "application/json",
    buffer: raw,
  });
  await page.getByRole("button", { name: "Insert", exact: true }).click();
  await expect(cell(page)).toHaveCount(1);
  await expect(page.getByRole("textbox", { name: "Cell content" })).toHaveText(
    "Offline content",
  );
  await page
    .getByRole("button", { name: "Local settings", exact: true })
    .click();
  await page
    .getByRole("menuitem", { name: "Import board / backup", exact: true })
    .click();
  await page.getByLabel("Choose file").setInputFiles({
    name: "bad.json",
    mimeType: "application/json",
    buffer: Buffer.from("{"),
  });
  await page.getByRole("button", { name: "Insert", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("Import failed");
  await expect(cell(page)).toHaveCount(1);
});
test("viewport zoom, pan and saved location survive reload", async ({
  page,
}) => {
  await create(page, "Camera");
  await page.getByRole("button", { name: "Zoom in", exact: true }).click();
  await page.waitForTimeout(300);
  await expect(page.getByTestId("zoom-level")).toHaveText("120%");
  const view = page.locator(".react-flow__viewport");
  const before = await view.getAttribute("style");
  await page.mouse.move(100, 220);
  await page.mouse.down();
  await page.mouse.move(250, 330, { steps: 10 });
  await page.mouse.up();
  await expect(view).not.toHaveAttribute("style", before!);
  await page
    .getByRole("button", { name: "Saved locations", exact: true })
    .click();
  await page
    .getByRole("menuitem", { name: "Save current location", exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "Save canvas location", exact: true })
    .fill("Home");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await saved(page);
  const current = await view.getAttribute("style");
  await page.reload();
  await expect(page.getByTestId("zoom-level")).toHaveText("120%");
  await expect(view).toHaveAttribute("style", current!);
  await page
    .getByRole("button", { name: "Saved locations", exact: true })
    .click();
  await expect(
    page.getByRole("menuitem", { name: "Go to Home", exact: true }),
  ).toBeVisible();
});
test("multiple pages, math, tables, images and PDF attachments", async ({
  page,
}) => {
  await create(page, "Rich content");
  await open(page);
  await page.getByRole("textbox", { name: "Cell content" }).fill("Page one");
  await selected(page)
    .getByRole("button", { name: "Add page", exact: true })
    .click();
  await page.getByRole("textbox", { name: "Cell content" }).fill("Page two");
  await expect(page.getByText("Page 2 / 2", { exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: "Insert content", exact: true })
    .click();
  await page
    .getByRole("menuitem", { name: "Mathematical expression", exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "Mathematical expression", exact: true })
    .fill("x^2");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.locator(".katex")).toBeVisible();
  await page
    .getByRole("button", { name: "Insert content", exact: true })
    .click();
  await page.getByRole("menuitem", { name: "Table", exact: true }).click();
  await expect(page.locator(".rich-editor table")).toBeVisible();
  await page
    .getByRole("button", { name: "Insert content", exact: true })
    .click();
  await page.getByRole("menuitem", { name: "Image", exact: true }).click();
  await page.getByLabel("Choose file").setInputFiles({
    name: "pixel.png",
    mimeType: "image/png",
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/a9sAAAAASUVORK5CYII=",
      "base64",
    ),
  });
  await page.getByRole("button", { name: "Insert", exact: true }).click();
  await expect(page.getByAltText("pixel.png")).toBeVisible();
  await page
    .getByRole("button", { name: "Insert content", exact: true })
    .click();
  await page
    .getByRole("menuitem", { name: "PDF attachment", exact: true })
    .click();
  await page.getByLabel("Choose file").setInputFiles({
    name: "notes.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("%PDF-1.4\n%%EOF"),
  });
  await page.getByRole("button", { name: "Insert", exact: true }).click();
  await expect(
    page.getByRole("link", { name: "notes.pdf", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Previous page", exact: true })
    .click();
  await expect(page.getByRole("textbox", { name: "Cell content" })).toHaveText(
    "Page one",
  );
  await page.getByRole("button", { name: "Next page", exact: true }).click();
  await saved(page);
  await page.reload();
  await expect(page.locator(".katex")).toBeVisible();
  await expect(
    page.getByRole("link", { name: "notes.pdf", exact: true }),
  ).toBeVisible();
});
test("boards, search, presentation and light mode", async ({ page }) => {
  await create(page, "Find me");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Search cells", exact: true })
    .fill("Find");
  await page.getByRole("button", { name: "Find me Empty cell" }).click();
  await expect(selected(page).locator(".cell-header")).toHaveText("Find me");
  await page.getByRole("button", { name: "Presentation", exact: true }).click();
  await expect(
    page.getByText("Presentation mode · Escape to return"),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Cell color", exact: true }),
  ).toHaveCount(0);
  await page.keyboard.press("Escape");
  await page
    .getByRole("button", { name: "Local settings", exact: true })
    .click();
  await page
    .getByRole("menuitem", { name: "Switch to light mode", exact: true })
    .click();
  await expect(page.locator(".app")).toHaveAttribute("data-theme", "light");
  await page.getByRole("button", { name: "Boards", exact: true }).click();
  await page.getByRole("button", { name: "New board", exact: true }).click();
  await expect(cell(page)).toHaveCount(0);
  await page.getByRole("button", { name: "Boards", exact: true }).click();
  await page
    .getByRole("button", { name: "My visual canvas 1 cells · 0 connections" })
    .click();
  await expect(cell(page)).toHaveCount(1);
});
test("blank-canvas creation, resizing persists, menu keyboard and modal focus trap", async ({
  page,
}) => {
  await page
    .locator(".react-flow__pane")
    .dblclick({ position: { x: 800, y: 350 } });
  await expect(cell(page)).toHaveCount(1);
  await open(page);
  const card = selected(page).locator(".cell-card");
  const before = await card.boundingBox();
  const handle = selected(page).locator(
    ".react-flow__resize-control.handle.bottom.right",
  );
  await handle.hover();
  const r = await handle.boundingBox();
  if (!r || !before) throw Error("Missing resize control");
  await page.mouse.move(r.x + r.width / 2, r.y + r.height / 2);
  await page.mouse.down();
  await page.mouse.move(r.x + 90, r.y + 80, { steps: 10 });
  await page.mouse.up();
  await expect
    .poll(async () => Math.round((await card.boundingBox())?.width ?? 0))
    .toBeGreaterThan(Math.round(before.width + 60));
  await saved(page);
  const width = Math.round((await card.boundingBox())!.width);
  await page.reload();
  await cell(page).locator(".cell-header").click();
  await expect
    .poll(async () => Math.round((await card.boundingBox())?.width ?? 0))
    .toBe(width);
  await selected(page)
    .getByRole("button", { name: "Cell color", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Large title", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await expect(
    page.getByRole("button", { name: "Medium title", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await selected(page)
    .getByRole("button", { name: "Delete cell", exact: true })
    .click();
  await page.keyboard.press("Shift+Tab");
  await expect(
    page.getByRole("button", { name: "Delete", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
});
test("storage failures show an actionable error and still allow export", async ({
  page,
}) => {
  await create(page, "Keep me");
  await saved(page);
  await page.evaluate(() => {
    IDBObjectStore.prototype.put = function () {
      throw new DOMException("Test quota exceeded", "QuotaExceededError");
    };
  });
  await open(page);
  await page
    .getByRole("textbox", { name: "Cell content" })
    .fill("Export me despite quota failure");
  await expect(page.getByRole("alert")).toContainText("Autosave failed");
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export board", exact: true }).click();
  const file = await download;
  const path = await file.path();
  expect(
    JSON.parse(await readFile(path!, "utf8")).boards[0].cells[0].pages[0]
      .content.content[0].content[0].text,
  ).toBe("Export me despite quota failure");
});
test("links, inline formatting, code, local video and presentation navigation", async ({
  page,
}) => {
  await create(page, "Media");
  await open(page);
  const editor = page.getByRole("textbox", { name: "Cell content" });
  await editor.fill("Styled text");
  await page.keyboard.press("Control+a");
  await page.getByRole("button", { name: "Italic", exact: true }).click();
  await expect(editor.locator("em")).toHaveText("Styled text");
  await page.getByRole("button", { name: "Underline", exact: true }).click();
  await expect(editor.locator("u")).toHaveText("Styled text");
  await page
    .getByRole("button", { name: "Insert content", exact: true })
    .click();
  await page.getByRole("menuitem", { name: "Link", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Insert link", exact: true })
    .fill("https://example.com");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(editor.locator("a")).toHaveAttribute(
    "href",
    "https://example.com",
  );
  await page
    .getByRole("button", { name: "Insert content", exact: true })
    .click();
  await page
    .getByRole("menuitem", { name: "Inline code", exact: true })
    .click();
  await expect(editor.locator("code")).toHaveText("Styled text");
  await page.keyboard.press("ArrowRight");
  await page
    .getByRole("button", { name: "Insert content", exact: true })
    .click();
  await page.getByRole("menuitem", { name: "Video", exact: true }).click();
  await page.getByLabel("Choose file").setInputFiles({
    name: "sample.webm",
    mimeType: "video/webm",
    buffer: await readFile("src/tests/fixtures/sample.webm"),
  });
  await page.getByRole("button", { name: "Insert", exact: true }).click();
  await expect(editor.locator("video")).toBeVisible();
  await expect
    .poll(() =>
      editor.locator("video").evaluate((v: HTMLVideoElement) => v.readyState),
    )
    .toBeGreaterThan(0);
  await saved(page);
  await page.reload();
  await expect(page.locator(".rich-editor video")).toBeVisible();
  await create(page, "Next idea");
  await page.getByRole("button", { name: "Presentation", exact: true }).click();
  await expect(page.getByText("View 1 / 2", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Next slide", exact: true }).click();
  await expect(page.getByText("View 2 / 2", { exact: true })).toBeVisible();
  await page.keyboard.press("ArrowLeft");
  await expect(page.getByText("View 1 / 2", { exact: true })).toBeVisible();
});
test("replays the reference composition at original resolution", async ({
  page,
}) => {
  await create(page, "ahoj jak");
  await selected(page)
    .getByRole("button", { name: "Cell color", exact: true })
    .click();
  await page.getByRole("button", { name: "Color 15", exact: true }).click();
  const place = async (node: Locator, x: number, y: number) => {
    await node.locator(".cell-header").hover();
    const box = await node.locator(".cell-card").boundingBox();
    if (!box) throw Error("Missing card");
    await move(page, node, x - box.x, y - box.y);
    await expect
      .poll(async () =>
        Math.round((await node.locator(".cell-card").boundingBox())!.x),
      )
      .toBe(x);
  };
  await place(selected(page), 783, 591);
  await create(page, "totoo je neco");
  await open(page);
  const editor = selected(page).getByRole("textbox", { name: "Cell content" });
  await editor.click();
  await page.keyboard.type("wrwererew");
  await selected(page)
    .getByRole("button", { name: "Numbered list", exact: true })
    .click();
  await page.keyboard.press("End");
  await page.keyboard.press("Enter");
  await page.keyboard.type("tyui");
  await page.keyboard.press("Enter");
  await place(selected(page), 1041, 185);
  await page.mouse.click(100, 200);
  await saved(page);
  await page.screenshot({
    path: "docs/implementation-screenshots/reference-expanded.png",
  });
  const blue = cell(page).nth(1);
  const r = await blue.locator(".cell-card").boundingBox();
  expect(Math.round(r!.width)).toBe(500);
  expect(Math.round(r!.height)).toBe(384);
  await blue.locator(".cell-header").click();
  await page.screenshot({
    path: "docs/implementation-screenshots/reference-selected.png",
  });
  await blue.getByRole("button", { name: "Cell color", exact: true }).click();
  await page.screenshot({
    path: "docs/implementation-screenshots/reference-palette.png",
  });
  await page.keyboard.press("Escape");
  await blue.locator(".cell-header").click({ button: "right" });
  await page
    .getByRole("menuitem", { name: "Connect to cell", exact: true })
    .click();
  await cell(page).first().locator(".cell-header").click();
  await expect(page.locator(".react-flow__edge")).toHaveCount(1);
  await page.mouse.click(100, 200);
  await expect(cell(page).first().locator(".cell-card")).toHaveCSS(
    "width",
    "172px",
  );
  await selectEdge(page);
  await page
    .getByRole("button", { name: "Toggle connection arrow", exact: true })
    .click();
  await page.mouse.click(100, 200);
  await page.screenshot({
    path: "docs/implementation-screenshots/reference-connected.png",
  });
  await blue
    .getByRole("button", { name: "Insert content", exact: true })
    .click();
  await page.getByRole("menuitem", { name: "Image", exact: true }).click();
  await page.screenshot({
    path: "docs/implementation-screenshots/reference-image-dialog.png",
  });
  await page.keyboard.press("Escape");
});
