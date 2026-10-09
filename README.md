# MindPad — Personal Visual Canvas

A private visual knowledge canvas. Original implementation and branding; no proprietary source, assets, private APIs, accounts or paid services.

## Run

The browser version is hosted at https://t3kii.github.io/MindPad/ once GitHub Pages is enabled. In the repository's **Settings → Pages**, select **GitHub Actions** as the source. Then open **Actions → Deploy browser app → Run workflow**, select `main`, and run it. After the first successful deployment, the workflow rebuilds and deploys the site after every push to `main`.

Your boards are saved in your browser, so export backups to move them between devices.

Requires Node.js 22.12+ (verified with 24.19) and npm. From this checkout:

```sh
npm ci
npm run dev
```

Open the address printed by Vite in a normal local development session. The cloud onboarding UI does not expose a localhost preview. The application saves to IndexedDB **in the browser that opens it**, not on the development server. Export backups before changing browser profiles or clearing site data.

```sh
npm run build          # strict TypeScript + production bundle
npm test               # import integrity and gesture-state tests
npm run test:e2e       # Chromium browser interaction tests
npm run preview        # serve the production build
```

Playwright uses `/usr/bin/chromium` when available. Else install its browser with `npx playwright install chromium` or provide `CHROMIUM_PATH`. Cloud npm cache: `npm --cache /workspace/.npm-cache ci`. No application credentials are needed.

## Use

Double click empty canvas or use **+** to create a cell. Double click its title to rename. Click **Click to write** to open the editor. Drag the header to move; resize the selected open cell with corner handles. **Aa** opens the color palette. Right click a cell for actions.

Drag a connection handle onto another cell, or choose **Connect to cell** and click a destination. Select a line to change its label, color, arrow or delete it. **Undo / redo** applies to board operations; editor text has its own history.

The lower text toolbar supports headings and lists; selecting text exposes bold, italic and underline. **+** opens insertion and additional formatting actions: links, local raster images, MP4/WebM videos, PDF attachments, tables, LaTeX expressions and code. Each cell can contain multiple independent pages. Images/videos are limited to 10 MB per file and PDFs to 20 MB.

Drag background / scroll to pan. Ctrl/Cmd + wheel zooms. Navigation includes zoom, fit, center selection and saved camera locations. Presentation follows saved locations, or cells in creation order, using arrows. Escape returns to editing.

The menu opens multiple boards. Search includes all content pages. Local settings provide light/dark mode, import, current-board export, all-board backup and shortcut help. Import adds boards with new board IDs, leaving existing boards intact.

## Implementation

React, TypeScript, Vite, Tailwind CSS, XYFlow, Motion, Tiptap, Zustand and Dexie. Canvas state and transient animation/editor state are separate. Open editor node data stays stable during text transactions, preventing canvas rerenders from disturbing the caret. IndexedDB writes are debounced and serialized; errors surface without blocking export. Schema versions and import validation cover geometry, identity, connections, local media and safe links.

Reference analysis, extracted frames, comparison evidence and feature coverage are under [docs](docs/feature-checklist.md). Exact reference gestures that cannot be observed are marked UNKNOWN. This is a tested local recreation, with documented visual differences; it does not claim exact equivalence to every OrgPad capability.
