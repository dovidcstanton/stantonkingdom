import { useEffect, useRef, useState } from "react";
import markUrl from "../assets/stanton-mark.png";
import { WHATSAPP_URL } from "../lib/social";

const KB: { k: string[]; a: string }[] = [
  { k: ["commission", "work", "process", "start", "begin", "how does"], a: "It begins with a conversation. Share an image, a rendering, an heirloom, or simply an idea — we translate it into a detailed design rendering, refine it with you until it's exactly right, and only then begin crafting. You approve every detail first." },
  { k: ["natural", "lab", "grown", "difference", "which"], a: "Lab-grown diamonds are chemically and optically identical to natural at a fraction of the price — more carat for the same commitment. Natural diamonds carry billion-year rarity and stronger long-term value. We'll walk you through both honestly; the choice is entirely yours." },
  { k: ["certif", "graded", "gia", "igi", "authentic"], a: "Yes — our stones are graded and certified by independent gemological laboratories, and the certificate accompanies your piece." },
  { k: ["long", "time", "weeks", "fast", "when", "deadline", "rush"], a: "Most commissions complete within three to six weeks. If you have a date — a proposal, an anniversary — tell us first and we build the timeline around it. Rush timelines are often possible." },
  { k: ["cost", "price", "budget", "expensive", "afford", "much"], a: "Often less than you'd expect. No inventory, no showroom — you pay for the stone, the metal, and the craft, not retail markup. Tell us your budget and we design within it. Every quote is itemized before we begin." },
  { k: ["heirloom", "own stone", "my diamond", "reset", "existing"], a: "Absolutely — we can reset an heirloom diamond into a new design, redesign an existing piece entirely, or build around a stone you've sourced yourself." },
  { k: ["metal", "gold", "platinum", "rose", "white", "yellow"], a: "We work in 18k and 14k gold — yellow, white and rose — and platinum. Mixed metals, finishes and engraving are all within reach." },
  { k: ["ship", "deliver", "worldwide", "international", "insured"], a: "Yes — every piece is fully insured in transit, discreetly packaged, and delivered to your door on any continent." },
  { k: ["copy", "replica", "another brand", "tiffany", "cartier", "photo of"], a: "Send anything as inspiration. We won't copy another house's piece — we'll design something in its spirit that's original and yours alone." },
  { k: ["ring", "engagement", "wedding", "propose"], a: "Engagement rings are the heart of the House — each designed around one hand and one story, in any shape or style: Classic, Trendsetting, Vintage, or Uniquely Yours. Tap 'Start Your Story' below and tell us about her." },
  { k: ["render", "modify", "redesign", "change", "reimagine"], a: "We can reimagine any existing piece — a different stone, a new setting, another metal. Send a photo through Start Your Story or WhatsApp and we'll show you design renderings of the transformation before anything is remade." },
  { k: ["contact", "call", "phone", "email", "speak", "talk", "appointment", "consult", "meet"], a: "Reach out for a complimentary private consultation — in person or virtual. WhatsApp is fastest, or call +1 (646) 450-8840 (Mon–Thu 9–5, Fri 9–3 ET), or email sales@stantonkingdom.com." },
  { k: ["hour", "open", "when are you"], a: "Mon–Thu 9am–5pm, Friday 9am–3pm ET. WhatsApp messages are welcome anytime." },
];

function reply(q: string) {
  const t = q.toLowerCase();
  let best: string | null = null;
  let score = 0;
  KB.forEach((e) => {
    let s = 0;
    e.k.forEach((k) => {
      if (t.includes(k)) s += k.length;
    });
    if (s > score) {
      score = s;
      best = e.a;
    }
  });
  return best ?? "That deserves a personal answer. Tap 'Continue on WhatsApp' below and we'll reply personally — or leave your details in Start Your Story.";
}

type Msg = { who: "bot" | "user"; text: string };

export function ConciergeWidget() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [msgs]);

  // Mobile only: the FAB sits over the hero's bottom-anchored buttons until
  // the page has scrolled a bit, so keep it out of the way until then.
  // Desktop/tablet keep the button visible immediately, as before.
  useEffect(() => {
    // Stay out of the hero entirely on a phone: the button sits exactly where
    // "Start Your Story" and "Discover the Kingdom" are, and 220px was nowhere
    // near clearing them — the hero is pinned for several screen-heights, so
    // the buttons are still under it long after that. Wait until the hero track
    // has actually released before appearing.
    const onScroll = () => {
      const track = document.querySelector<HTMLElement>(".hero-track");
      const threshold = track
        ? track.offsetTop + track.offsetHeight - window.innerHeight * 0.9
        : 220;
      setScrolled(window.scrollY > threshold);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const ask = (q: string) => {
    if (!q.trim()) return;
    setMsgs((m) => [...m, { who: "user", text: q }]);
    setTimeout(() => setMsgs((m) => [...m, { who: "bot", text: reply(q) }]), 450);
    setText("");
  };

  // ---- Draggable ----
  // The concierge is offset from its anchored corner by a transform rather than
  // being re-anchored, so the CSS corner position stays the single source of
  // truth and {0,0} is always "back where it belongs". Movement is clamped to
  // the viewport so it can never be dragged somewhere unreachable.
  const rootRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef<{ px: number; py: number; ox: number; oy: number; moved: boolean } | null>(null);
  const DRAG_SLOP = 5; // px of travel before a press counts as a drag, not a tap

  // Mirrors `pos` so clampToViewport can read the live offset without being
  // rebuilt on every drag frame — the resize listener below binds once.
  const posRef = useRef(pos);
  posRef.current = pos;

  const clampToViewport = (x: number, y: number) => {
    const el = rootRef.current;
    if (!el) return { x, y };
    const r = el.getBoundingClientRect();
    const M = 8; // keep this much of a gap from every edge
    // Undo the current transform to recover the element's anchored position,
    // then work out how far it may travel from there in each direction.
    const baseLeft = r.left - posRef.current.x;
    const baseTop = r.top - posRef.current.y;
    return {
      x: Math.min(Math.max(x, M - baseLeft), window.innerWidth - M - r.width - baseLeft),
      y: Math.min(Math.max(y, M - baseTop), window.innerHeight - M - r.height - baseTop),
    };
  };

  const onHandlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    dragRef.current = { px: e.clientX, py: e.clientY, ox: pos.x, oy: pos.y, moved: false };
    // Capture keeps the drag alive if the pointer outruns the button, but it
    // throws on an id the browser isn't tracking. Losing capture only costs a
    // dropped drag, so it must never take the handler down with it.
    try { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); } catch { /* no capture — drag still works */ }
  };

  const onHandlePointerMove = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d) return;
    const dx = e.clientX - d.px;
    const dy = e.clientY - d.py;
    if (!d.moved && Math.hypot(dx, dy) < DRAG_SLOP) return;
    if (!d.moved) {
      d.moved = true;
      setDragging(true);
    }
    setPos(clampToViewport(d.ox + dx, d.oy + dy));
  };

  const onHandlePointerUp = (e: React.PointerEvent) => {
    const d = dragRef.current;
    dragRef.current = null;
    try { (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId); } catch { /* never captured */ }
    if (!d) return;
    if (d.moved) {
      setDragging(false);
      return; // a drag, not a tap — don't toggle the panel
    }
    setOpen((v) => !v);
  };

  // A resize can strand the widget off-screen; pull it back into bounds.
  useEffect(() => {
    const onResize = () => setPos((p) => clampToViewport(p.x, p.y));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={rootRef}
      className={"cw" + (open ? " open" : "") + (scrolled ? "" : " cw-prescroll") + (dragging ? " cw-dragging" : "")}
      style={pos.x || pos.y ? { transform: `translate(${pos.x}px, ${pos.y}px)` } : undefined}
    >
      <button
        className="cw-btn"
        aria-label="Ask the Kingdom (drag to move)"
        onPointerDown={onHandlePointerDown}
        onPointerMove={onHandlePointerMove}
        onPointerUp={onHandlePointerUp}
        onPointerCancel={onHandlePointerUp}
      >
        {/* A mask, not an img with a colour filter. Filters recolour the
            rendered pixels, and a PNG's anti-aliased edge pixels sit between
            fully opaque and fully transparent — inverted or not, that half-
            transparent fringe still shows through as a faint pale outline
            against the border. Masking uses only the alpha channel to punch
            the shape out of a flat fill, so the fill IS the border's own
            colour with no source pixel involved, and the edge is exactly as
            clean as the border line itself. It also means the hover colour is
            a single background-color transition, timed to match the button's
            own background transition exactly. */}
        <span
          className="cw-btn-mark"
          aria-hidden="true"
          style={{ WebkitMaskImage: `url(${markUrl})`, maskImage: `url(${markUrl})` }}
        />
      </button>
      <div className="cw-panel" aria-hidden={!open}>
        <div className="cw-head">
          <div>
            <div className="cw-title serif">The Kingdom Concierge</div>
            <div className="cw-sub">Ask anything about bespoke</div>
          </div>
          <button className="cw-close" aria-label="Close" onClick={() => setOpen(false)}>×</button>
        </div>
        <div className="cw-body" ref={bodyRef}>
          <div className="cw-msg bot">Welcome. Ask me about commissions, diamonds, timing, or pricing — or tap a question below.</div>
          <div className="cw-chips">
            <button onClick={() => ask("how does a commission work")}>How does it work?</button>
            <button onClick={() => ask("natural or lab grown")}>Natural vs lab-grown?</button>
            <button onClick={() => ask("how long does it take")}>How long does it take?</button>
            <button onClick={() => ask("what does it cost")}>What does it cost?</button>
          </div>
          {msgs.map((m, i) => (
            <div key={i} className={"cw-msg " + m.who}>{m.text}</div>
          ))}
        </div>
        <div className="cw-foot">
          <input
            type="text"
            placeholder="Type a question…"
            aria-label="Your question"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") ask(text); }}
          />
          <button aria-label="Send" onClick={() => ask(text)}>→</button>
        </div>
        <a className="cw-wa" href={WHATSAPP_URL}>Continue on WhatsApp →</a>
      </div>
    </div>
  );
}
