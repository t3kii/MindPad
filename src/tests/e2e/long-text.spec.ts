import { test, expect, type Locator } from "@playwright/test";

const expectUnclipped = async (text: Locator) => {
  await expect.poll(() => text.evaluate((element) => {
    const card = element.closest(".cell-card")!;
    const range = document.createRange();
    range.selectNodeContents(element);
    const content = range.getBoundingClientRect();
    const bounds = card.getBoundingClientRect();
    return content.bottom <= bounds.bottom + 1 &&
      content.right <= bounds.right + 1 &&
      element.scrollHeight <= element.clientHeight + 1 &&
      element.scrollWidth <= element.clientWidth + 1;
  })).toBe(true);
};

test("long text stays fully readable after clicking away, closing, selecting and reloading", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "New cell", exact: true }).click();
  const card = page.locator(".cell-card");
  await page.getByRole("button", { name: "Open cell", exact: true }).click();
  const text = "A long thought should remain completely readable on the canvas. ".repeat(30) + "x".repeat(200) + " End of thought.";
  await page.getByRole("textbox", { name: "Cell content" }).fill(text);
  await expect(page.locator(".save-status")).toHaveText("Saved locally");
  await expectUnclipped(page.locator(".rich-editor"));

  // Clicking the canvas leaves an open cell in reading mode, without a scrollbar.
  await page.mouse.click(100, 200);
  await expect(card).toHaveClass(/reading/);
  await expectUnclipped(page.locator(".rich-editor"));
  await expect.poll(() => card.evaluate(el => el.getBoundingClientRect().height)).toBeGreaterThan(384);
  await expect(card).toHaveCSS("background-color", "rgb(80, 80, 74)");
  await expect(page.locator(".react-flow")).toHaveCSS("background-color", "rgb(48, 48, 43)");

  // Closing the editor retains every character in the selected preview.
  await page.locator(".cell-header").click();
  await page.getByRole("button", { name: "Close cell", exact: true }).click();
  await expect(page.locator(".compact-content")).toHaveText(text);
  await expectUnclipped(page.locator(".compact-content"));
  const width = await card.evaluate(el => Math.round(el.getBoundingClientRect().width));

  // Deselecting does not shrink or truncate the preview, including an unbroken word.
  await page.mouse.click(100, 200);
  await expect(page.locator(".compact-preview")).toHaveText(text);
  await expectUnclipped(page.locator(".compact-preview"));
  await expect.poll(() => card.evaluate(el => Math.round(el.getBoundingClientRect().width))).toBe(width);
  await expect(page.locator(".save-status")).toHaveText("Saved locally");
  await page.reload();
  await expect(page.locator(".compact-preview")).toHaveText(text);
  await expectUnclipped(page.locator(".compact-preview"));
  await page.locator(".cell-header").click();
  await page.getByRole("button", { name: "Open cell", exact: true }).click();
  await expect(page.getByRole("textbox", { name: "Cell content" })).toHaveText(text);
  await expectUnclipped(page.locator(".rich-editor"));
});

test("background choices visibly change the canvas and cells and survive reload", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "New cell", exact: true }).click();
  for (const [label, value, canvasColor, cellColor] of [
    ["Dark background", "dark", "rgb(31, 31, 28)", "rgb(58, 58, 53)"],
    ["Lighter background", "lighter", "rgb(48, 48, 43)", "rgb(80, 80, 74)"],
    ["Light background", "light", "rgb(245, 245, 240)", "rgb(250, 250, 245)"],
  ]) {
    await page.getByRole("button", { name: "Background options", exact: true }).click();
    await page.getByRole("menuitem", { name: label, exact: true }).click();
    await expect(page.locator(".app")).toHaveAttribute("data-background", value);
    await expect(page.locator(".react-flow")).toHaveCSS("background-color", canvasColor);
    await expect(page.locator(".cell-card")).toHaveCSS("background-color", cellColor);
    await page.reload();
    await expect(page.locator(".app")).toHaveAttribute("data-background", value);
    await expect(page.locator(".react-flow")).toHaveCSS("background-color", canvasColor);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Background options", exact: true }).click();
  await page.getByRole("menuitem", { name: "Lighter background", exact: true }).click();
  await expect(page.locator(".app")).toHaveAttribute("data-background", "lighter");
});
