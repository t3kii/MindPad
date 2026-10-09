import { test, expect } from "@playwright/test";
test("upgrades a version-2 database without losing its existing content", async ({
  page,
}) => {
  await page.route("http://127.0.0.1:5173/", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: "<!doctype html><p>Preparing legacy storage</p>",
    }),
  );
  await page.goto("/");
  await page.evaluate(
    () =>
      new Promise<void>((resolve, reject) => {
        const request = indexedDB.open("mindpad-personal-canvas", 20);
        request.onupgradeneeded = () => {
          const table = request.result.createObjectStore("boards", {
            keyPath: "id",
          });
          table.createIndex("updated", "updated");
        };
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const database = request.result;
          const tx = database.transaction("boards", "readwrite");
          tx.objectStore("boards").put({
            id: "legacy-board",
            title: "Legacy board",
            cells: [
              {
                id: "legacy-cell",
                x: 100,
                y: 100,
                title: "Preserved cell",
                color: "#4c657f",
                opened: true,
                width: 500,
                height: 384,
                pages: [
                  {
                    id: "legacy-page",
                    content: {
                      type: "doc",
                      content: [
                        {
                          type: "paragraph",
                          content: [
                            {
                              type: "text",
                              text: "Content from the old database",
                            },
                          ],
                        },
                      ],
                    },
                    attachments: [],
                  },
                ],
                page: 0,
              },
            ],
            connections: [],
            viewport: { x: 0, y: 0, zoom: 1 },
            locations: [],
            updated: Date.now(),
          });
          tx.oncomplete = () => {
            database.close();
            resolve();
          };
          tx.onerror = () => reject(tx.error);
        };
      }),
  );
  await page.unroute("http://127.0.0.1:5173/");
  await page.reload();
  await expect(page.getByRole("textbox", { name: "Cell content" })).toHaveText(
    "Content from the old database",
  );
  const migrated = await page.evaluate(
    () =>
      new Promise<{ version: number; titleSize: number; preview: boolean }>(
        (resolve, reject) => {
          const r = indexedDB.open("mindpad-personal-canvas");
          r.onerror = () => reject(r.error);
          r.onsuccess = () => {
            const database = r.result;
            const get = database
              .transaction("boards")
              .objectStore("boards")
              .get("legacy-board");
            get.onsuccess = () => {
              resolve({
                version: database.version,
                titleSize: get.result.cells[0].titleSize,
                preview: get.result.cells[0].preview,
              });
              database.close();
            };
          };
        },
      ),
  );
  expect(migrated).toEqual({ version: 30, titleSize: 35, preview: true });
});
