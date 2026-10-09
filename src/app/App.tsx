import { useEffect } from "react";
import { Canvas } from "../components/canvas/Canvas";
import { OverlayHost } from "../components/popups/OverlayHost";
import { useStore } from "../state/store";
export function App() {
  const ready = useStore((s) => s.ready);
  const theme = useStore((s) => s.theme);
  const background = useStore((s) => s.background);
  useEffect(() => {
    void useStore.getState().init();
    const flush = () => {
      if (document.visibilityState === "hidden")
        void useStore.getState().save();
    };
    document.addEventListener("visibilitychange", flush);
    return () => document.removeEventListener("visibilitychange", flush);
  }, []);
  return (
    <div className="app" data-theme={theme} data-background={background}>
      {ready ? <Canvas /> : <div className="loading">Opening your canvas…</div>}
      <OverlayHost />
    </div>
  );
}
