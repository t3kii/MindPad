import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { useUI } from "../../state/ui";
export function OverlayHost() {
  const { menu, modal } = useUI();
  const popup = useRef<HTMLDivElement>(null);
  const dialog = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ left: 0, top: 0 });
  const [value, setValue] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  useLayoutEffect(() => {
    if (!menu || !popup.current) return;
    const r = popup.current.getBoundingClientRect();
    setPosition({
      left: Math.max(8, Math.min(menu.x, innerWidth - r.width - 8)),
      top: Math.max(8, Math.min(menu.y, innerHeight - r.height - 8)),
    });
  }, [menu]);
  useEffect(() => {
    if (!menu) return;
    const previous = document.activeElement as HTMLElement;
    popup.current
      ?.querySelector<HTMLButtonElement>("button:not(:disabled)")
      ?.focus();
    const down = (e: PointerEvent) => {
      if (!popup.current?.contains(e.target as Node)) useUI.getState().close();
    };
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        useUI.getState().close();
      }
      if (
        [
          "ArrowDown",
          "ArrowUp",
          "ArrowRight",
          "ArrowLeft",
          "Home",
          "End",
        ].includes(e.key)
      ) {
        const buttons = Array.from(
          popup.current?.querySelectorAll<HTMLButtonElement>(
            "button:not(:disabled)",
          ) ?? [],
        );
        const index = buttons.indexOf(
          document.activeElement as HTMLButtonElement,
        );
        const next =
          e.key === "Home"
            ? 0
            : e.key === "End"
              ? buttons.length - 1
              : (index +
                  (["ArrowUp", "ArrowLeft"].includes(e.key) ? -1 : 1) +
                  buttons.length) %
                buttons.length;
        buttons[next]?.focus();
        e.preventDefault();
      }
    };
    document.addEventListener("pointerdown", down);
    document.addEventListener("keydown", key, true);
    return () => {
      document.removeEventListener("pointerdown", down);
      document.removeEventListener("keydown", key, true);
      previous?.focus?.();
    };
  }, [menu]);
  const dismiss = () => {
    modal?.resolve(null);
    useUI.setState({ modal: null });
  };
  useEffect(() => {
    if (!modal) return;
    const previous = document.activeElement as HTMLElement;
    setValue(modal.value ?? "");
    setFile(null);
    setError("");
    const tick = requestAnimationFrame(() =>
      dialog.current?.querySelector<HTMLElement>("input,button")?.focus(),
    );
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        modal.resolve(null);
        useUI.setState({ modal: null });
      }
      if (e.key === "Tab") {
        const items = Array.from(
          dialog.current?.querySelectorAll<HTMLElement>(
            "button:not(:disabled),input,a[href]",
          ) ?? [],
        );
        const first = items[0],
          last = items.at(-1);
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", key, true);
    return () => {
      cancelAnimationFrame(tick);
      document.removeEventListener("keydown", key, true);
      previous?.focus?.();
    };
  }, [modal]);
  const submit = () => {
    if (modal?.kind === "file" && !file) {
      setError("Choose a file first.");
      return;
    }
    modal?.resolve(
      modal.kind === "input" ? value : modal.kind === "file" ? file : true,
    );
    useUI.setState({ modal: null });
  };
  return (
    <div className="overlay-host" data-modal={!!modal} data-menu={!!menu}>
      <AnimatePresence>
        {menu && (
          <motion.div
            ref={popup}
            className="popup"
            style={{ left: position.left, top: position.top }}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            onPointerDown={(e) => e.stopPropagation()}
            role="menu"
            aria-label="Actions"
          >
            {menu.items?.map((item) => (
              <button
                role="menuitem"
                key={item.label}
                className={`menu-item ${item.danger ? "danger" : ""}`}
                disabled={item.disabled}
                onClick={() => {
                  useUI.getState().close();
                  item.action();
                }}
              >
                {item.label}
              </button>
            ))}
            {menu.content}
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {modal && (
          <motion.div
            className="scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onPointerDown={(e) => {
              if (e.target === e.currentTarget) dismiss();
            }}
          >
            <motion.div
              ref={dialog}
              className="dialog"
              role="dialog"
              aria-modal="true"
              aria-labelledby="dialog-title"
              initial={{ scale: 0.97, y: 8 }}
              animate={{ scale: 1, y: 0 }}
            >
              <button
                className="dialog-close icon-button"
                aria-label="Close dialog"
                onClick={dismiss}
              >
                <X size={18} />
              </button>
              <h2 id="dialog-title">{modal.title}</h2>
              {modal.description && <p>{modal.description}</p>}
              {modal.kind === "info" ? (
                <div className="dialog-actions">
                  <button className="primary" onClick={dismiss}>
                    Close
                  </button>
                </div>
              ) : modal.kind === "help" ? (
                <div className="help-grid">
                  <kbd>Double click canvas</kbd>
                  <span>Create a cell</span>
                  <kbd>Drag header</kbd>
                  <span>Move cell</span>
                  <kbd>Drag background</kbd>
                  <span>Pan canvas</span>
                  <kbd>Ctrl / ⌘ + wheel</kbd>
                  <span>Zoom</span>
                  <kbd>Ctrl / ⌘ + D</kbd>
                  <span>Duplicate selected</span>
                  <kbd>Ctrl / ⌘ + C / V</kbd>
                  <span>Copy / paste cell</span>
                  <kbd>Ctrl / ⌘ + Z</kbd>
                  <span>Undo</span>
                  <kbd>Escape</kbd>
                  <span>Close menu / leave presentation</span>
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    submit();
                  }}
                >
                  {modal.kind === "input" && (
                    <input
                      aria-label={modal.title}
                      value={value}
                      placeholder={modal.placeholder}
                      onChange={(e) => setValue(e.target.value)}
                    />
                  )}{" "}
                  {modal.kind === "file" && (
                    <input
                      aria-label="Choose file"
                      type="file"
                      accept={modal.accept}
                      onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                    />
                  )}{" "}
                  {error && <p role="alert">{error}</p>}
                  <div className="dialog-actions">
                    <button type="button" onClick={dismiss}>
                      Cancel
                    </button>
                    <button
                      className={modal.danger ? "danger" : "primary"}
                      type="submit"
                    >
                      {modal.confirm ??
                        (modal.kind === "file" ? "Insert" : "Save")}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
