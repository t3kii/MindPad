# Interaction specification
Recording-backed: colored title + body, floating Aa palette, editing in expanded card, list toolbar below, plus insertion menu, image/video dialogs with scrim, cyan selection, boundary-to-boundary links updating while moving, compact title-only cards and multiple open objects.

Chosen local conventions where exact gesture is UNKNOWN:
- Double click empty canvas creates; plus on top creates in viewport center.
- Single click selects. Double click title renames. Click empty placeholder/double click body opens; top collapse closes. Opening grows about center, keeping same identity.
- Drag header moves cell. Resize bottom-right handle while open. Drag background pans, wheel scroll pans, Ctrl/Cmd+wheel zooms; pinch handled by XYFlow. Plus/minus zoom.
- Drag connection handle to another, or choose Connect and click destination; Escape cancels. Edge click opens action menu. No self-links or duplicate endpoint pair.
- Right click cell/canvas opens context menu. Menus clamp to viewport. Arrow keys move menu focus, Escape closes, focus returns to trigger. Modal traps focus and returns it on close.
- Ctrl/Cmd+Z, Shift+Z undo/redo document changes outside editors; Tiptap owns text history inside editors. Ctrl/Cmd+D duplicate, Delete removes selected with confirmation, Ctrl/Cmd+C/V internal cell copy/paste outside editors. Escape leaves presentation or closes popup/selection.
- Rich text uses Tiptap JSON, not imported HTML. IndexedDB autosave retains viewport, dimensions, pages and data-URL media. Imported files schema-checked; invalid files leave board unchanged.
- Dashboard creates/switches/deletes boards. Search focuses matching cell. Local JSON export/import, all-board backup, theme, bookmarks and presentation work without paid/cloud services.

Advanced features not shown in recording are implementation choices and must be verified separately. Video embeds are not assumed from the modal alone; local MP4/WebM video insertion is provided; remote iframe embeds are omitted. Math uses KaTeX through Tiptap. Local PDF links use stored data URLs and downloadable attachments. Storage failures surface a persistent warning and export remains available.
