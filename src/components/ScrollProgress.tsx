import { useEffect, useRef } from "react";

/* Written straight to the DOM, not through React state. The old version set
   state on every scroll event, which re-rendered this component on every
   frame of every scroll on every page; and it grew the bar by animating
   `width`, a layout property the browser must reflow and repaint each time.
   A ref plus a scaleX transform costs neither: no render, and the transform
   (with its transition, in styles.css) runs on the compositor thread. */
export function ScrollProgress() {
  const barRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      raf = 0;
      const h = document.documentElement;
      const p = h.scrollTop / (h.scrollHeight - h.clientHeight);
      const clamped = isFinite(p) ? Math.min(1, Math.max(0, p)) : 0;
      barRef.current?.style.setProperty("transform", `scaleX(${clamped})`);
    };
    const on = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };
    tick();
    window.addEventListener("scroll", on, { passive: true });
    window.addEventListener("resize", on);
    return () => {
      window.removeEventListener("scroll", on);
      window.removeEventListener("resize", on);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);
  return <div className="scroll-progress" ref={barRef} />;
}
