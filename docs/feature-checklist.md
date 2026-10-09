# Feature checklist and validation

## Reference analysis
- [x] All three video parts decoded for original1918×994 reference frames; native frame rate verified as30 fps. Opening additionally measured through consecutive decoded frames.
- [x] Global timeline, sampled full-resolution frames and adjacent opening frames.
- [x] Colors sampled, geometry measured, controls inventoried.
- [x] Unobservable pointer triggers and timing marked UNKNOWN or provisional.
- [x] Original branding, code and assets; cloud-only controls replaced with local actions.

## Implemented workflow
- [x] Create, select, hover, rename, duplicate, delete and internal copy/paste cells.
- [x] Compact and expanded states with continuous geometry, independent editing and rapid reversal.
- [x] Color picker, accessible swatches, title-size controls, compact-preview toggle, immediate updates and persistence.
- [x] Header drag, corner resize, contextual menu and confirmation.
- [x] Tiptap paragraphs, headings, bold/italic/underline, numbered/bullet lists, indent/outdent, links, code, tables, images and KaTeX math.
- [x] Multiple content pages, local raster images, native MP4/WebM video and PDF downloads.
- [x] Floating cell/editor toolbars, dropdowns, modal overlay, keyboard focus trap, Escape and outside dismissal.
- [x] Connection handle drag with live preview, click-to-connect, boundary anchors, selection, deletion, arrow, color and label.
- [x] Connections follow moved/resized endpoints; duplicate pairs and self-links rejected.
- [x] Pan, scroll, modifier-wheel zoom, fit, focus selection and saved camera locations.
- [x] Multiple boards, dashboard, search across pages, light/dark theme.
- [x] Presentation with next/previous controls and arrow keys; saved locations act as views, or cells in creation order.
- [x] Board undo/redo and independent editor undo/redo.
- [x] Dexie IndexedDB autosave, serialized writes, restoration, JSON export/import and all-board backup.
- [x] Schema migration and validated imports; invalid data leaves current board intact.
- [x] Storage failure message; current in-memory data still exports.

## Automated coverage
The browser suite exercises all18 requested core scenarios through integrated workflows: creation, renaming, color, open/close, editing, list continuation/exit, selection, movement, connections, moving endpoints, deleting connections, popup opening/dismissal, undo/redo, reload, export/import and zoom/pan. It also exercises independent pages, images, PDF, math, tables, links, inline code, video decoding, board switching, search, theme, presentation, resize, keyboard menus, modal focus containment and simulated IndexedDB quota failure. Video is checked for actual metadata decoding, rather than merely the presence of a video tag.

Vitest checks import roundtrips, invalid identities/endpoints/geometry, executable URLs, local media, corrupt JSON and conflicting gesture states. Browser traces are retained on failure; screenshots live in implementation-screenshots. See validation.md for final run outcomes.

## Known limitations / unverified details
- Exact font, easing, hidden gesture triggers and several reference-control meanings are UNKNOWN. The documented local conventions are approximations.
- Layout and measured colors match selected reference states; every OrgPad screen and undocumented capability is not reproduced. No similarity percentage is asserted.
- Native local-video and file dialogs differ from OrgPad's cloud upload/URL forms. No remote iframe embeds, cloud collaboration, accounts or live sharing.
- Copy/paste is an internal single-cell clipboard. Backups transfer work between browser profiles.
- Floating toolbars scale with canvas zoom and may leave the viewport at extreme cell positions; menus and dialogs clamp to the viewport.
- Desktop Chromium is tested. Safari, Firefox, touch devices, assistive-technology reading order, very large boards and very large media collections have not been validated.
- Schema migration from a synthetic version-2 database is tested. Previously deployed external database variants remain unverified.
- The local PDF fixture verifies attachment storage/download linkage, not an in-app PDF renderer. No in-app PDF renderer is offered.
