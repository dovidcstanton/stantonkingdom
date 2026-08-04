import { useEffect, useMemo, useRef, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import markUrl from "../assets/stanton-mark.png";
import { whatsappUrlWithQuestion } from "../lib/social";
/* The same ten questions "Before You Ask" asks, and the same answers, read
   from one file — see src/lib/faq.ts. The Concierge used to carry its own
   paraphrased knowledge base, which meant the site could answer the same
   question two different ways depending on where it was asked. It no longer
   holds any Stanton Kingdom facts of its own: everything it says about
   commissions, timings, payment or shipping is quoted from that file, and
   anything the file does not cover goes to WhatsApp rather than being
   invented. */
import { FAQ, type FaqEntry } from "../lib/faq";

/* Words that point at a question without appearing in it. Only used to route a
   typed question to an existing FAQ entry — never to compose an answer. */
const FAQ_KEYS: string[][] = [
  ["natural", "lab", "grown", "diamond", "stone", "difference"],
  ["know", "idea", "vision", "unsure", "sure", "design help", "where to start"],
  ["heirloom", "repurpose", "trade", "existing", "reset", "old", "inherited"],
  ["see", "design", "cad", "render", "rendering", "preview", "approve", "before"],
  ["minimum", "budget", "cost", "price", "afford", "expensive", "cheap", "much"],
  ["payment", "pay", "deposit", "instal", "balance", "invoice"],
  ["long", "time", "weeks", "timeline", "rush", "deadline", "when", "fast", "quick"],
  ["change", "amend", "alter", "modify", "refund", "return", "cancel", "mind"],
  ["ship", "shipping", "delivery", "deliver", "worldwide", "international", "insured", "post"],
  ["start", "begin", "get started", "first step", "contact", "reach"],
];

/* Which FAQ entry a typed question is asking about, or null. Deliberately
   conservative: a single incidental word is not enough, and when nothing
   scores the visitor is handed to WhatsApp rather than given a guess. */
function matchFaq(input: string): FaqEntry | null {
  const t = input.toLowerCase();
  if (t.trim().length < 3) return null;
  const words = t.split(/[^a-z0-9']+/).filter((w) => w.length > 2);
  let best = -1;
  let score = 0;
  FAQ.forEach((entry, i) => {
    let s = 0;
    // The question's own words carry the most weight.
    entry.q
      .toLowerCase()
      .split(/[^a-z0-9']+/)
      .filter((w) => w.length > 3)
      .forEach((w) => {
        if (words.includes(w)) s += 3;
      });
    (FAQ_KEYS[i] ?? []).forEach((k) => {
      if (t.includes(k)) s += 2;
    });
    if (s > score) {
      score = s;
      best = i;
    }
  });
  return score >= 3 ? FAQ[best] : null;
}

type Msg =
  | { who: "user"; text: string }
  /* Only ever set on the fallback. A predefined FAQ answer carries no CTA —
     the concierge is meant to be useful on its own, and appending "talk to us"
     to an answer that already answered the question reads as a sales prompt. */
  | { who: "concierge"; text: string[]; advisorHref?: string };

export function ConciergeWidget() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [scrolled, setScrolled] = useState(false);
  /* Questions already sent into the thread leave the suggestion tray, so the
     tray always shows what is still on offer rather than repeating what has
     just been answered. */
  const [used, setUsed] = useState<string[]>([]);
  const bodyRef = useRef<HTMLDivElement>(null);

  /* Follow the question, not the bottom of the list.
     Appending a message and leaving the view where it was is what made a
     chosen question look unanswered: the exchange landed above the fold of the
     thread while the visitor was still sitting among the remaining
     suggestions. So the view moves to the message they just sent and parks it
     near the top of the visible area, which puts its answer directly
     underneath it in the same glance. The same anchor serves both renders —
     the question, then the answer 220ms later — so the second arrival settles
     the position rather than jerking it somewhere new.

     scrollTo on the panel's own body, never scrollIntoView: scrollIntoView
     walks up every scrollable ancestor and would take the page with it. This
     moves one element's scrollTop and nothing else, so the document behind the
     concierge cannot move. */
  useEffect(() => {
    const body = bodyRef.current;
    if (!body || msgs.length === 0) return;
    const asked = body.querySelectorAll<HTMLElement>(".cw-msg.user");
    const last = asked[asked.length - 1];
    if (!last) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    /* Measured rect-to-rect, not by offsetTop. .cw-body is not a positioned
       element, so a message's offsetTop is counted from .cw-panel and silently
       includes the header — which landed every scroll one header-height too
       far and pushed the chosen question up out of sight. This asks the two
       elements where they actually are and needs no assumption about which
       ancestor either of them is measured from. */
    const delta = last.getBoundingClientRect().top - body.getBoundingClientRect().top;
    body.scrollTo({
      // A little air above it, so it reads as the top of the exchange rather
      // than as something clipped to the panel's edge.
      top: Math.max(0, body.scrollTop + delta - 12),
      behavior: reduce ? "auto" : "smooth",
    });
  }, [msgs]);

  /* Which route the page is on. What this widget measures — the hero track it
     has to stay clear of — belongs to the home route alone, so the measuring
     has to be redone whenever the route changes underneath it. This widget is
     mounted by the root layout and survives every navigation, so nothing else
     would tell it the page had changed. */
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // Mobile only: the FAB sits over the hero's bottom-anchored buttons until
  // the page has scrolled a bit, so keep it out of the way until then.
  // Desktop/tablet keep the button visible immediately, as before.
  useEffect(() => {
    // Stay out of the hero entirely on a phone: the button sits exactly where
    // "Start Your Story" and "Discover the Kingdom" are, and 220px was nowhere
    // near clearing them — the hero is pinned for several screen-heights, so
    // the buttons are still under it long after that. Wait until the hero track
    // has actually released before appearing.
    //
    // No hero on this page means nothing to stay out of, so the button shows at
    // once. It used to fall back to a flat 220px scroll here, which quietly
    // assumed every page was tall enough to scroll that far — the Coming Soon
    // holding page is exactly one screen and cannot scroll at all, so on a
    // phone the Concierge was hidden there permanently with no way to reach it.
    // -1 is the same idiom SiteHeader uses to decide the bar's own state on
    // hero-less pages, for exactly the same reason.
    const onScroll = () => {
      const track = document.querySelector<HTMLElement>(".hero-track");
      const threshold = track
        ? track.offsetTop + track.offsetHeight - window.innerHeight * 0.9
        : -1;
      setScrolled(window.scrollY > threshold);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
    // Re-evaluated on every navigation as well, so arriving on a hero-less
    // route shows the button without waiting for a scroll that may never come.
  }, [pathname]);

  /* A suggestion becomes a sent message. The question travels verbatim into
     the thread and its own answer follows — both quoted from the shared FAQ,
     never rebuilt here. */
  const answer = (entry: FaqEntry) => {
    setUsed((u) => [...u, entry.q]);
    setMsgs((m) => [...m, { who: "user", text: entry.q }]);
    window.setTimeout(
      () => setMsgs((m) => [...m, { who: "concierge", text: entry.a }]),
      220,
    );
  };

  const ask = (raw: string) => {
    const question = raw.trim();
    if (!question) return;
    setText("");
    setMsgs((m) => [...m, { who: "user", text: question }]);
    const hit = matchFaq(question);
    if (hit) setUsed((u) => (u.includes(hit.q) ? u : [...u, hit.q]));
    window.setTimeout(() => {
      setMsgs((m) => [
        ...m,
        hit
          ? /* An existing answer covers it, so it is returned exactly as
               written rather than reworded to fit the question asked. */
            { who: "concierge", text: hit.a }
          : {
              who: "concierge",
              /* Nothing in the FAQ covers this, so nothing is invented. The
                 one thing the concierge can honestly offer is a person — and
                 it carries the question over to them. */
              text: ["That one is best answered by us directly."],
              advisorHref: whatsappUrlWithQuestion(question),
            },
      ]);
    }, 220);
  };

  const remaining = useMemo(() => FAQ.filter((f) => !used.includes(f.q)), [used]);

  // ---- Draggable ----
  // The concierge is offset from its anchored corner by a transform rather than
  // being re-anchored, so the CSS corner position stays the single source of
  // truth and {0,0} is always "back where it belongs". Movement is clamped to
  // the viewport so it can never be dragged somewhere unreachable.
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const headRef = useRef<HTMLDivElement>(null);
  const footRef = useRef<HTMLDivElement>(null);
  const gripRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef<{ px: number; py: number; ox: number; oy: number; moved: boolean } | null>(null);
  const DRAG_SLOP = 5; // px of travel before a press counts as a drag, not a tap

  // Mirrors `pos` so clampToViewport can read the live offset without being
  // rebuilt on every drag frame — the resize listener below binds once.
  const posRef = useRef(pos);
  posRef.current = pos;

  /* Which box has to stay on screen depends on what is on screen.
     Closed, that is the launcher, and `.cw` measures it exactly. Open, it is
     the panel — and `.cw` does NOT measure that: the panel is absolutely
     positioned, so it is out of its parent's flow and `.cw` stays a 58px
     square whatever size the panel has grown to. Clamping against the wrong
     one is how an open panel gets dragged three quarters of the way off the
     top of the screen while the launcher's own box is still dutifully inside
     the viewport. Both boxes carry the same transform, so the same arithmetic
     serves either — it just has to be given the right rect. */
  const clampToViewport = (x: number, y: number, el?: HTMLElement | null) => {
    const box = el ?? rootRef.current;
    if (!box) return { x, y };
    const r = box.getBoundingClientRect();
    const M = 8; // keep this much of a gap from every edge
    // Undo the current transform to recover the element's anchored position,
    // then work out how far it may travel from there in each direction.
    const baseLeft = r.left - posRef.current.x;
    const baseTop = r.top - posRef.current.y;
    // A panel wider or taller than the space left for it would give a
    // max below its own min and inverted clamping would fling it to the far
    // edge; when that happens the lower bound wins and it stays pinned to the
    // top-left of the usable area rather than jumping.
    const minX = M - baseLeft;
    const minY = M - baseTop;
    const maxX = window.innerWidth - M - r.width - baseLeft;
    const maxY = window.innerHeight - M - r.height - baseTop;
    return {
      x: Math.min(Math.max(x, minX), Math.max(maxX, minX)),
      y: Math.min(Math.max(y, minY), Math.max(maxY, minY)),
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
  // Measured against whichever box is currently the visible one — see the note
  // on clampToViewport.
  useEffect(() => {
    const onResize = () =>
      setPos((p) => clampToViewport(p.x, p.y, openRef.current ? panelRef.current : rootRef.current));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ================= MOBILE: move, resize, and flick away =================
     Everything below is gated on a phone-width match and does nothing at all on
     a desktop, where the Concierge keeps exactly the behaviour it has always
     had: a draggable launcher and a fixed-size panel.

     The panel is divided into three zones and each one does ONE thing, because
     a surface that resizes when you meant to scroll it is worse than one that
     does neither:
       - the thin strip along the very top    -> resize (and flick to collapse)
       - the rest of the navy header          -> move the whole panel
       - the conversation                     -> scroll, and nothing else
     Nothing is bound to .cw-body. */
  const MOBILE_Q = "(max-width:760px)";
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(MOBILE_Q);
    const sync = () => setIsMobile(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  // Kept in a ref as well so the once-bound resize listener above can read the
  // live value without being rebuilt every time the panel opens or closes.
  const openRef = useRef(open);
  openRef.current = open;

  /* The height the user has chosen, or null for "whatever the stylesheet says".
     Null is not the same as the CSS value written out: leaving it null is what
     lets the panel keep its own responsive min() expression, and — critically —
     what lets the collapse animation run, since an inline height would pin the
     panel open at that number while the CSS tried to shrink it back to the
     58px launcher. */
  const [panelH, setPanelH] = useState<number | null>(null);
  const [resizing, setResizing] = useState(false);

  /* The floor is measured, never guessed. It is the two chrome bars that must
     stay whole — the grip and the navy header above, the composer below — plus
     one message's worth of thread, so the visitor can always see the last thing
     said AND type the next one. Deriving it from the live elements means a
     type-size or padding change upstream cannot silently make the composer
     unreachable. */
  const MIN_BODY = 56;
  const minPanelH = () => {
    const chrome =
      (gripRef.current?.offsetHeight ?? 0) +
      (headRef.current?.offsetHeight ?? 0) +
      (footRef.current?.offsetHeight ?? 0);
    return chrome + MIN_BODY;
  };

  /* The ceiling is where the panel's own top edge would reach the top of the
     screen. The panel is bottom-anchored, so height grows upward and this is
     simply "how much room is above my bottom edge". Computed from the live rect
     rather than from viewport height, because the panel may have been dragged
     away from its corner first. */
  const maxPanelH = () => {
    const r = panelRef.current?.getBoundingClientRect();
    if (!r) return window.innerHeight - 16;
    return Math.max(120, r.bottom - 8);
  };

  /* Distance AND speed, both required. Distance alone would collapse the panel
     at the end of any long slow shrink — which is exactly the intermediate
     height the user was trying to stop at. Speed alone would fire on a quick
     nudge. Only a gesture that is both far and fast is read as "put it away".
     Velocity is taken over the last 120ms rather than over the whole gesture,
     so a long unhurried drag that happens to finish with a small flick is
     judged on how it actually ended. */
  const FLICK_DISTANCE = 46;   // px travelled downward
  const FLICK_VELOCITY = 0.75; // px per ms, over the closing window
  const VELOCITY_WINDOW = 120; // ms

  const resizeRef = useRef<{
    y0: number; h0: number; dy: number;
    samples: { y: number; t: number }[];
  } | null>(null);

  const onGripPointerDown = (e: React.PointerEvent) => {
    if (!isMobile || !open) return;
    if (e.button !== 0 && e.pointerType === "mouse") return;
    const h = panelRef.current?.getBoundingClientRect().height ?? 0;
    resizeRef.current = { y0: e.clientY, h0: h, dy: 0, samples: [{ y: e.clientY, t: performance.now() }] };
    setResizing(true);
    try { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); } catch { /* no capture — still works */ }
  };

  const onGripPointerMove = (e: React.PointerEvent) => {
    const r = resizeRef.current;
    if (!r) return;
    const now = performance.now();
    r.samples.push({ y: e.clientY, t: now });
    while (r.samples.length > 2 && now - r.samples[0].t > VELOCITY_WINDOW) r.samples.shift();
    r.dy = e.clientY - r.y0;
    // Down shrinks, up expands — the strip is the panel's top edge, so it goes
    // where the finger goes.
    const lo = minPanelH();
    const hi = maxPanelH();
    setPanelH(Math.min(Math.max(r.h0 - r.dy, lo), Math.max(hi, lo)));
  };

  const onGripPointerUp = (e: React.PointerEvent) => {
    const r = resizeRef.current;
    resizeRef.current = null;
    setResizing(false);
    try { (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId); } catch { /* never captured */ }
    if (!r) return;
    const first = r.samples[0];
    const last = r.samples[r.samples.length - 1];
    const dt = Math.max(last.t - first.t, 1);
    const v = (last.y - first.y) / dt; // positive = travelling downward
    if (r.dy > FLICK_DISTANCE && v > FLICK_VELOCITY) {
      // Back to the icon. The chosen height is forgotten with it, so the panel
      // is not reopened at the sliver it was flicked away from.
      setPanelH(null);
      setOpen(false);
    }
  };

  const onGripPointerCancel = () => {
    resizeRef.current = null;
    setResizing(false);
  };

  /* Moving the open panel reuses the launcher's own drag state wholesale —
     same `pos`, same clamp, same {0,0} means home — so there is one notion of
     where the Concierge is, whichever part of it was grabbed. The only
     difference is which rect the clamp is given. */
  const onHeadPointerDown = (e: React.PointerEvent) => {
    if (!isMobile || !open) return;
    if (e.button !== 0 && e.pointerType === "mouse") return;
    // The collapse chevron is a control, not a handle.
    if ((e.target as HTMLElement).closest(".cw-collapse")) return;
    dragRef.current = { px: e.clientX, py: e.clientY, ox: pos.x, oy: pos.y, moved: false };
    try { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); } catch { /* no capture — still works */ }
  };

  const onHeadPointerMove = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d) return;
    const dx = e.clientX - d.px;
    const dy = e.clientY - d.py;
    if (!d.moved && Math.hypot(dx, dy) < DRAG_SLOP) return;
    if (!d.moved) { d.moved = true; setDragging(true); }
    setPos(clampToViewport(d.ox + dx, d.oy + dy, panelRef.current));
  };

  const onHeadPointerUp = (e: React.PointerEvent) => {
    const d = dragRef.current;
    dragRef.current = null;
    try { (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId); } catch { /* never captured */ }
    if (d?.moved) setDragging(false);
    // No tap behaviour on the header: pressing it and letting go does nothing,
    // which is what you want of a handle.
  };

  /* A chosen height must not survive a change of circumstances that makes it
     wrong. Rotating the phone, or opening the keyboard, can leave a 520px panel
     taller than the screen; and going from a phone to a desktop layout hands
     the panel back to the stylesheet entirely. */
  useEffect(() => {
    if (!isMobile) { setPanelH(null); return; }
    const onResize = () =>
      setPanelH((h) => (h === null ? null : Math.min(Math.max(h, minPanelH()), Math.max(maxPanelH(), minPanelH()))));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile]);

  return (
    <div
      ref={rootRef}
      className={
        "cw" +
        (open ? " open" : "") +
        (scrolled ? "" : " cw-prescroll") +
        (dragging ? " cw-dragging" : "") +
        (resizing ? " cw-resizing" : "")
      }
      style={pos.x || pos.y ? { transform: `translate(${pos.x}px, ${pos.y}px)` } : undefined}
    >
      {/* The launcher and the panel share this corner exactly: the panel's
          collapsed geometry IS the launcher's box, same navy, same radius, in
          the same place. Opening grows that one shape outward and upward;
          collapsing runs it back down into itself. The launcher only has to
          step aside for the frame in which the shape starts moving, which is
          why there is never a second icon sitting under the open panel. */}
      <button
        className="cw-btn"
        aria-label="The Kingdom Concierge"
        aria-expanded={open}
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
            clean as the border line itself. */}
        <span
          className="cw-btn-mark"
          aria-hidden="true"
          style={{ WebkitMaskImage: `url(${markUrl})`, maskImage: `url(${markUrl})` }}
        />
      </button>

      <div
        className="cw-panel"
        aria-hidden={!open}
        ref={panelRef}
        /* Only ever set while the panel is actually open on a phone. Applied
           to a closed panel it would override the 58px launcher geometry and
           the morph back into the icon would have nothing to travel to. */
        style={isMobile && open && panelH !== null ? { height: `${panelH}px` } : undefined}
      >
        {/* The resize strip. Deliberately its own thin element rather than a
            zone of the header, because the two gestures it separates —
            "make this smaller" and "move this elsewhere" — both begin with a
            finger pressed on the top of the panel, and only an edge the eye can
            see makes it obvious which one you are about to get. It carries a
            short bar for exactly that reason; the target around it is several
            times taller than the mark, so it is grabbable without being loud.
            Desktop never shows it and never binds it. */}
        <div
          className="cw-grip"
          ref={gripRef}
          role="separator"
          aria-orientation="horizontal"
          aria-label="Resize the concierge"
          onPointerDown={onGripPointerDown}
          onPointerMove={onGripPointerMove}
          onPointerUp={onGripPointerUp}
          onPointerCancel={onGripPointerCancel}
        >
          <span aria-hidden="true" />
        </div>
        {/* The mark and the name, and nothing else. On a phone it is also the
            handle the whole panel is carried by. */}
        <div
          className="cw-head"
          ref={headRef}
          onPointerDown={onHeadPointerDown}
          onPointerMove={onHeadPointerMove}
          onPointerUp={onHeadPointerUp}
          onPointerCancel={onHeadPointerUp}
        >
          <div className="cw-ident">
            <span
              className="cw-head-mark"
              aria-hidden="true"
              style={{ WebkitMaskImage: `url(${markUrl})`, maskImage: `url(${markUrl})` }}
            />
            <span className="cw-title serif">The Kingdom Concierge</span>
          </div>
          {/* Collapse, not close — the panel is going back to being the
              launcher, and a chevron says that where an × would say the
              conversation had been thrown away. */}
          <button
            className="cw-collapse"
            aria-label="Collapse the concierge"
            onClick={() => setOpen(false)}
          >
            <span aria-hidden="true" />
          </button>
        </div>

        <div className="cw-body" ref={bodyRef}>
          {msgs.map((m, i) =>
            m.who === "user" ? (
              <div key={i} className="cw-msg user">{m.text}</div>
            ) : (
              <div key={i} className="cw-msg concierge">
                {m.text.map((p, j) => <p key={j}>{p}</p>)}
                {m.advisorHref && (
                  <a className="cw-advisor" href={m.advisorHref}>
                    Speak with a client advisor via WhatsApp
                  </a>
                )}
              </div>
            ),
          )}

          {/* Suggested openers, not a menu: each question is its own bubble,
              sitting on the side of the thread the visitor sends from, so
              tapping one reads as sending it. They stay available underneath
              the conversation as it grows. */}
          {remaining.length > 0 && (
            /* Once an exchange is on screen the tray steps back: still there,
               still tappable, but set quieter so it cannot out-shout the
               answer the visitor just asked for. */
            <div className={"cw-suggest" + (msgs.length > 0 ? " is-secondary" : "")}>
              {remaining.map((f) => (
                <button type="button" key={f.q} className="cw-sugg" onClick={() => answer(f)}>
                  {f.q}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="cw-foot" ref={footRef}>
          <input
            type="text"
            placeholder="How do I get started?"
            aria-label="Ask your own question"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") ask(text); }}
          />
          <button className="cw-send" aria-label="Send" onClick={() => ask(text)}>
            <span aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
