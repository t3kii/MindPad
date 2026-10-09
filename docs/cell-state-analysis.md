# Cell state analysis
Persistent data: identity, title, pages, coordinates, open dimensions, color, opened flag. Transient state: hover, selection, connection source, gesture, animation phase, editor focus. Editor and animation state are separate.

Legal transitions:
- IDLE ↔ HOVERED; IDLE/HOVERED → SELECTED.
- SELECTED → OPENING → OPEN; OPEN → EDITING → OPEN.
- OPEN/EDITING → CLOSING → SELECTED.
- SELECTED/OPEN → DRAGGING → previous resting state.
- OPEN → RESIZING → OPEN.
- Selection change → IDLE or OPEN depending on opened flag.
- Opposite animation request during OPENING/CLOSING reverses toward requested target; stale completion must never override newer target.

No implicit data removal on close. Content is committed on each Tiptap transaction. Header alone is the drag handle; editable body and floating controls are nodrag/nopan. All other open cells keep independent editor instances. Single click selects; title double click renames; body double click opens; empty content button opens directly. Blank canvas double click creates. Gesture mapping where missing is provisional and documented in interaction specification.
