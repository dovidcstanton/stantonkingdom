import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Catalog, type CatalogSelection } from "@/components/sections/Catalog";
import { SiteFooter } from "@/components/SiteFooter";
import phoneIconUrl from "@/assets/icon-phone-mask.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Stanton Kingdom — Bespoke Diamond Jewelry" },
      { name: "description", content: "Every piece begins with a story. Ours begins with yours. Bespoke engagement rings and fine diamond jewelry, crafted around your story." },
      { property: "og:title", content: "Stanton Kingdom — Bespoke Diamond Jewelry" },
      { property: "og:description", content: "Bespoke engagement rings and fine diamond jewelry, crafted around your story." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomePage,
});

const V_DIV_BG_NAVY_FILL_PAPER = { bg: "var(--paper)", fill: "var(--navy)" } as const;

function VDivider({ bg, fill, accent, className, flip }: { bg: string; fill: string; accent?: boolean; className?: string; flip?: boolean }) {
  return (
    <div className={"v-divider" + (className ? ` ${className}` : "")} style={{ background: bg }}>
      {/* A 1-unit overscan beyond the viewBox on the flat edge and sides
          absorbs sub-pixel antialiasing so no seam line of the container's
          own background can peek through at the top/side edges. */}
      <svg viewBox="0 0 100 100" preserveAspectRatio="none">
        <polygon
          points={flip ? "-1,101 101,101 50,-1" : "-1,-1 101,-1 50,101"}
          fill={fill}
          stroke={accent ? "var(--gold)" : undefined}
          strokeWidth={accent ? 1.5 : undefined}
          vectorEffect={accent ? "non-scaling-stroke" : undefined}
        />
      </svg>
    </div>
  );
}

function PhilosophyText() {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="phil-copy">
      <div className={`phil${expanded ? " phil-expanded" : ""}`}>
        <p>
          &ldquo;I've never believed that what makes a piece of jewelry valuable is the stone, the gold, or even the craftsmanship. The most valuable part of a piece of jewelry is the story it carries.
          {!expanded && (
            <>
              {" "}
              <button type="button" className="phil-more-toggle" onClick={() => setExpanded(true)}>
                Continue&hellip;
              </button>
            </>
          )}
        </p>
        <div className="phil-more">
          <p>When crafted with intention, jewelry has the extraordinary ability to tell a story words never could.</p>
          <p>A story of a promise, a milestone, a sacrifice, a celebration, a love for another or a love for yourself, worth remembering.</p>
          <p>Long after the flowers and ink have faded and the words have been forgotten, jewelry remains. It becomes more than something you wear. It becomes a reminder of who you are, who you love, what you've overcome, and the moments that have shaped your story.</p>
          <p>That is why Stanton Kingdom was born. Not simply to craft beautiful bespoke jewelry, but to preserve your story in a way words never could.</p>
          <p className="phil-close">Because every story — your story — deserves to be remembered.&rdquo;</p>
        </div>
      </div>
    </div>
  );
}

/* -------- Reveal-on-scroll hook -------- */
function useReveal() {
  useEffect(() => {
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      }),
      { threshold: 0.12 },
    );
    document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

/* -------- FAQ data -------- */
const FAQ = [
  {
    q: "Do you offer both natural and lab-grown diamonds?",
    a: [
      "Absolutely. The choice is entirely yours.",
      "Natural and lab-grown diamonds are chemically, physically, and optically identical. The only differences are origin, price, and resale potential.",
      "Our role is to educate, design, and craft. If you'd like guidance choosing, we're here to help.",
    ],
  },
  {
    q: "Do I need to know exactly what I want?",
    a: [
      "Not at all.",
      "Some clients arrive with a clear vision, others simply know they want something meaningful. Whether you have a complete design, a rough idea, or no idea at all, we'll help shape it into something powerfully personal and unmistakably yours.",
    ],
  },
  {
    q: "Can I repurpose or trade in my existing jewelry?",
    a: [
      "Absolutely.",
      "A family heirloom, an existing diamond, or gold you already own — we can often repurpose it into a new creation or offer a trade-in value toward your bespoke piece.",
      "Giving new life to something meaningful is one of our favorite parts of what we do.",
    ],
  },
  {
    q: "Will I see the design before it's in production?",
    a: [
      "Absolutely.",
      "Before production begins, you'll receive a detailed CAD rendering, along with the product dimensions, total carat weight, metal type, and key specifications for your approval.",
      "Nothing moves into production until we've got your confirmation.",
    ],
  },
  {
    q: "Is there a minimum budget for going custom?",
    a: [
      "No.",
      "Every piece is unique, and the cost is shaped entirely by your preferences — design, materials, and required craftsmanship.",
      "That flexibility is one of the greatest advantages of going custom. Tell us your vision and ideal budget. From there, we'll recommend the best design for you.",
    ],
  },
  {
    q: "How does payment work on custom?",
    a: [
      "For custom projects, we typically take a deposit.",
      "Every creation is unique, so the deposit amount is tailored to the project itself. The remaining balance is due once your piece is complete and ready for collection or shipment.",
      "If you have a preferred payment arrangement, let us know. We'll always do our best to accommodate.",
    ],
  },
  {
    q: "How long does a custom project take?",
    a: [
      "Most creations are completed within 3–6 weeks, depending on complexity.",
      "If you're working toward a proposal, anniversary, birthday, or another important date, let us know. We'll do everything we can to meet your timeline, and rush orders are often possible.",
    ],
  },
  {
    q: "What if I want to make a change?",
    a: [
      "We'll always do our very best to accommodate.",
      "Whether your piece is in production or already complete, we'll gladly make changes wherever possible. If additional materials or craftsmanship are required, we'll discuss your options and any associated costs with you beforehand.",
      "As every piece is handcrafted exclusively for its owner, custom commissions are generally non-refundable. That said, every situation is unique, and we'll always work with you to ensure you're exceptionally pleased with both your piece and your experience.",
    ],
  },
  {
    q: "Do you ship worldwide?",
    a: [
      "Yes. Complimentary worldwide shipping is included with every order.",
      "Every piece is fully insured in transit, discreetly packaged, and delivered safely to your door.",
    ],
  },
  {
    q: "How do I get started?",
    a: ["Reach out. We'd love to hear from you."],
  },
];

/* -------- Collections data -------- */
const COLLECTIONS = [
  {
    name: "Rings",
    img: "https://stantonkingdom.com/wp-content/uploads/2023/10/7c23248354327e336479345356485da4.jpg",
    types: ["Engagement", "Wedding", "Eternity", "Haute Couture"],
  },
  {
    name: "Necklaces",
    img: "https://stantonkingdom.com/wp-content/uploads/2023/10/Necklace-e1698231277111-768x768.jpg",
    types: ["Pendants", "Riviera & Tennis Necklaces", "Milestone Pieces"],
  },
  {
    name: "Bracelets",
    img: "https://stantonkingdom.com/wp-content/uploads/2023/10/shutterstock_1788848870-scaled-e1697638089202-768x548.jpg",
    types: ["Tennis", "Bangles", "Statement & Link"],
  },
  {
    name: "Earrings",
    img: "https://stantonkingdom.com/wp-content/uploads/2023/10/Earrings-e1698231240846-768x768.jpg",
    types: ["Studs & Clusters", "Hoops & Huggies", "Drops & Chandeliers"],
  },
];

const STYLES = ["Classic", "Trendsetting", "Vintage", "Uniquely Yours"];

function CollectionCard({
  col,
  onPick,
  isActive,
  expanded,
  onToggle,
}: {
  col: (typeof COLLECTIONS)[number];
  onPick: (category: string, type: string, style: string) => void;
  isActive: boolean;
  expanded: boolean;
  onToggle: () => void;
}) {
  const [openType, setOpenType] = useState<string | null>(null);
  useEffect(() => {
    if (!expanded) setOpenType(null);
  }, [expanded]);
  useEffect(() => {
    if (!isActive) setOpenType(null);
  }, [isActive]);

  // Own reveal state (rather than relying on the page-level IntersectionObserver
  // to add an "in" class imperatively) — this card's className is recomputed by
  // React whenever isActive/expanded change (e.g. on click), which would wipe an
  // imperatively-added class on every interaction. Tracking it as state keeps it
  // part of what React actually renders, so it survives re-renders.
  const cardRef = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(false);
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) {
          setRevealed(true);
          io.unobserve(e.target);
        }
      }),
      { threshold: 0.12 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const isToggleTarget = (target: EventTarget | null) => {
    return target instanceof Element && Boolean(target.closest(".col-photo,.col-title"));
  };

  const handleToggleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isToggleTarget(e.target)) return;
    e.preventDefault();
    e.stopPropagation();
    onToggle();
  };

  return (
    <div
      ref={cardRef}
      className={"col-card reveal show" + (revealed ? " in" : "") + (isActive ? " centered" : "") + (expanded && isActive ? " expanded" : "")}
      onClickCapture={handleToggleClick}
    >
      <button
        type="button"
        className="col-photo"
        aria-label={expanded ? `Close ${col.name}` : `Open ${col.name}`}
        aria-expanded={expanded && isActive}
      >
        <div className="img" style={{ backgroundImage: `url('${col.img}')` }} />
        <div className="tint" />
      </button>
      <h3 className="serif">
        <button
          type="button"
          className="col-title"
          aria-expanded={expanded && isActive}
        >
          {col.name}
        </button>
      </h3>
      <ul className="types">
        {col.types.map((t) => {
          const isOpen = openType === t;
          return (
            <li key={t} className={"type" + (isOpen ? " open" : "")}>
              <button
                className="type-q"
                onClick={() => setOpenType(isOpen ? null : t)}
              >
                {t} <span className="tx">+</span>
              </button>
              <div className="type-a" style={{ maxHeight: isOpen ? 500 : 0 }}>
                <ul>
                  {STYLES.map((s) => (
                    <li key={s} className={s === "Uniquely Yours" ? "yours" : undefined}>
                      <a
                        href="#catalog"
                        onClick={(e) => {
                          e.preventDefault();
                          onPick(col.name, t, s);
                        }}
                      >
                        {s}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}


function CollectionsCarousel({ onPick }: { onPick: (category: string, type: string, style: string) => void }) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [activeLoopIdx, setActiveLoopIdx] = useState(COLLECTIONS.length);
  const [expandedLoopIdx, setExpandedLoopIdx] = useState<number | null>(null);
  const activeLoopRef = useRef(COLLECTIONS.length);
  const expandedRef = useRef<number | null>(null);
  const ignoreScrollCollapseUntilRef = useRef(0);
  const dragGestureUntilRef = useRef(0);
  const n = COLLECTIONS.length;
  const total = n * 3;
  const active = ((activeLoopIdx % n) + n) % n;

  useEffect(() => {
    expandedRef.current = expandedLoopIdx;
  }, [expandedLoopIdx]);

  // Center on middle set at mount (mobile only)
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const mq = window.matchMedia("(max-width:640px)");
    if (!mq.matches) return;
    const cards = el.querySelectorAll<HTMLElement>(".col-card");
    if (!cards.length) return;
    const target = cards[n];
    el.scrollLeft = target.offsetLeft - (el.clientWidth - target.clientWidth) / 2;
    activeLoopRef.current = n;
    setActiveLoopIdx(n);
  }, [n]);

  const scrollCardToCenter = (loopIdx: number, smooth: boolean) => {
    const el = scrollerRef.current;
    if (!el) return;
    const cards = el.querySelectorAll<HTMLElement>(".col-card");
    const target = cards[loopIdx];
    if (!target) return;
    const left = target.offsetLeft - (el.clientWidth - target.clientWidth) / 2;
    if (smooth) el.scrollTo({ left, behavior: "smooth" });
    else { el.scrollLeft = left; }
  };

  // Track active dot and seamless wrap on idle; only intentional horizontal swipes collapse.
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    let raf = 0;
    let idleT: number | undefined;
    let touching = false;
    let pointerStart: { x: number; y: number } | null = null;
    let pointerResetT: number | undefined;
    let touchStart: { x: number; y: number } | null = null;

    const collapseExpanded = () => {
      if (expandedRef.current !== null) {
        expandedRef.current = null;
        setExpandedLoopIdx(null);
      }
    };

    const findCenteredIdx = () => {
      const cards = el.querySelectorAll<HTMLElement>(".col-card");
      if (!cards.length) return -1;
      const center = el.scrollLeft + el.clientWidth / 2;
      let bestIdx = 0, bestDist = Infinity;
      cards.forEach((c, i) => {
        const cc = c.offsetLeft + c.clientWidth / 2;
        const d = Math.abs(cc - center);
        if (d < bestDist) { bestDist = d; bestIdx = i; }
      });
      return bestIdx;
    };

    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const idx = findCenteredIdx();
        if (idx < 0) return;
        if (idx !== activeLoopRef.current) {
          activeLoopRef.current = idx;
          setActiveLoopIdx(idx);
        }
      });
      window.clearTimeout(idleT);
      idleT = window.setTimeout(() => {
        if (touching) return;
        const idx = findCenteredIdx();
        if (idx < 0) return;
        if (idx < n || idx >= n * 2) {
          const targetIdx = (idx % n) + n;
          const prev = el.style.scrollBehavior;
          el.style.scrollBehavior = "auto";
          scrollCardToCenter(targetIdx, false);
          activeLoopRef.current = targetIdx;
          setActiveLoopIdx(targetIdx);
          el.style.scrollBehavior = prev;
        }
      }, 250);
    };

    const onTouchStart = () => { touching = true; };
    const onTouchEnd = () => { touching = false; onScroll(); };

    const onPointerDown = (e: PointerEvent) => {
      pointerStart = { x: e.clientX, y: e.clientY };
      window.clearTimeout(pointerResetT);
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!pointerStart || performance.now() < dragGestureUntilRef.current) return;
      const dx = Math.abs(e.clientX - pointerStart.x);
      const dy = Math.abs(e.clientY - pointerStart.y);
      // Only horizontal swipes collapse — vertical page scroll must not.
      if (dx > 18 && dx > dy) {
        dragGestureUntilRef.current = performance.now() + 450;
        collapseExpanded();
      }
    };
    const onPointerUp = () => {
      pointerStart = null;
      pointerResetT = window.setTimeout(() => {
        dragGestureUntilRef.current = 0;
      }, 180);
    };
    const onTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (!touch) return;
      if (!touchStart) {
        touchStart = { x: touch.clientX, y: touch.clientY };
        return;
      }
      const dx = Math.abs(touch.clientX - touchStart.x);
      const dy = Math.abs(touch.clientY - touchStart.y);
      // Only horizontal swipes collapse.
      if (dx > 14 && dx > dy) collapseExpanded();
    };
    const onTouchStartAny = (e: TouchEvent) => {
      const touch = e.touches[0];
      touchStart = touch ? { x: touch.clientX, y: touch.clientY } : null;
    };
    const onTouchEndAny = () => { touchStart = null; };

    el.addEventListener("scroll", onScroll, { passive: true });
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchend", onTouchEnd, { passive: true });
    el.addEventListener("touchcancel", onTouchEnd, { passive: true });
    el.addEventListener("pointerdown", onPointerDown, { passive: true });
    el.addEventListener("pointermove", onPointerMove, { passive: true });
    el.addEventListener("pointerup", onPointerUp, { passive: true });
    el.addEventListener("pointercancel", onPointerUp, { passive: true });
    window.addEventListener("pointerdown", onPointerDown, { passive: true });
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerup", onPointerUp, { passive: true });
    window.addEventListener("pointercancel", onPointerUp, { passive: true });
    window.addEventListener("touchstart", onTouchStartAny, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEndAny, { passive: true });
    window.addEventListener("touchcancel", onTouchEndAny, { passive: true });

    requestAnimationFrame(() => {
      const idx = findCenteredIdx();
      if (idx >= 0) {
        activeLoopRef.current = idx;
        setActiveLoopIdx(idx);
      }
    });

    return () => {
      el.removeEventListener("scroll", onScroll);
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("touchcancel", onTouchEnd);
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerup", onPointerUp);
      el.removeEventListener("pointercancel", onPointerUp);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
      window.removeEventListener("touchstart", onTouchStartAny);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEndAny);
      window.removeEventListener("touchcancel", onTouchEndAny);
      cancelAnimationFrame(raf);
      window.clearTimeout(idleT);
      window.clearTimeout(pointerResetT);
    };
  }, [n]);

  const handleCardToggle = (loopIdx: number) => {
    if (performance.now() < dragGestureUntilRef.current) return;
    if (loopIdx !== activeLoopRef.current) {
      // Tapped a side card: scroll that exact card into center and open it.
      ignoreScrollCollapseUntilRef.current = performance.now() + 650;
      scrollCardToCenter(loopIdx, true);
      activeLoopRef.current = loopIdx;
      setActiveLoopIdx(loopIdx);
      expandedRef.current = loopIdx;
      setExpandedLoopIdx(loopIdx);
    } else {
      ignoreScrollCollapseUntilRef.current = performance.now() + 100;
      setExpandedLoopIdx((v) => {
        const next = v === loopIdx ? null : loopIdx;
        expandedRef.current = next;
        return next;
      });
    }
  };

  const goTo = (i: number) => {
    const targetIdx = i + n;
    expandedRef.current = null;
    setExpandedLoopIdx(null);
    activeLoopRef.current = targetIdx;
    setActiveLoopIdx(targetIdx);
    scrollCardToCenter(i + n, true);
  };

  const loopItems = Array.from({ length: total }, (_, i) => COLLECTIONS[i % n]);

  return (
    <>
      <div className="col-grid" ref={scrollerRef}>
        {loopItems.map((c, i) => (
          <CollectionCard
            key={i}
            col={c}
            onPick={onPick}
            isActive={i === activeLoopIdx}
            expanded={expandedLoopIdx === i}
            onToggle={() => handleCardToggle(i)}
          />
        ))}
      </div>
      <div className="col-dots" aria-hidden="true">
        {COLLECTIONS.map((_, i) => (
          <button
            key={i}
            className={"col-dot" + (i === active ? " active" : "")}
            onClick={() => goTo(i)}
            aria-label={`Go to ${COLLECTIONS[i].name}`}
          />
        ))}
      </div>
    </>
  );
}




function HomePage() {
  useReveal();
  const [faqOpen, setFaqOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [meetOpen, setMeetOpen] = useState(false);
  const [refOpen, setRefOpen] = useState(false);
  const [refVal, setRefVal] = useState("");
  const [refInvalid, setRefInvalid] = useState(false);
  const [selection, setSelection] = useState<CatalogSelection>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const refDdRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (refDdRef.current && !refDdRef.current.contains(e.target as Node)) setRefOpen(false);
    };
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);

  // ============ Hero scroll choreography (tunable) ============
  // Track = 400vh → 300vh of scroll = ~3 viewport "strokes" on mobile.
  // Reveals overlap in staggered windows; everything settles by p≈0.85
  // so the handoff into Belief is a clean darken, not a late pop.
  const HOLD = "400vh";
  const PAN = {
    desktopStart: 16,
    desktopEnd: 52,
    mobileStart: 24,
    mobileEnd: 52,
  } as const;
  // Stretched so the last reveal (btn2) finishes exactly at p=1 — the track
  // used to release into Heritage ~17% late, after the buttons had already
  // fully appeared, leaving a stretch of "dead" scroll with nothing changing.
  const REVEAL = { line2: 0.17, btn1: 0.40, btn2: 0.61 } as const;
  const REVEAL_SPAN = 0.39;             // longer, overlapping fade-ins
  const HANDOFF_START = 0.65;           // navy fade begins earlier

  const heroTrackRef = useRef<HTMLDivElement>(null);
  const heroBgRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const heroHandoffRef = useRef<HTMLDivElement>(null);
  const lastBgxRef = useRef<number>(-1);

  // Two-way, scroll-linked hero: everything below is a pure function of the
  // current scroll position, computed fresh on every scroll event in either
  // direction. There is no "play once and freeze" state — scrolling back up
  // simply runs the same choreography in reverse, exactly like scrolling down
  // runs it forward. Nothing here ever moves the scroll position itself.
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const getPanRange = () => window.matchMedia("(max-width: 899px)").matches
      ? { start: PAN.mobileStart, end: PAN.mobileEnd }
      : { start: PAN.desktopStart, end: PAN.desktopEnd };

    if (reduced) {
      const { end } = getPanRange();
      heroBgRef.current?.style.setProperty("--bgx", `${end}%`);
      heroHandoffRef.current?.style.setProperty("--pan-p", "1");
      const hero = heroRef.current;
      if (hero) {
        hero.style.setProperty("--l2", "1");
        hero.style.setProperty("--b1", "1");
        hero.style.setProperty("--b2", "1");
        hero.classList.add("hero-btn1-ready", "hero-btn2-ready");
      }
      return;
    }

    let raf = 0;
    // easeInOutSine — gentler than the previous quadratic
    const easeInOutSine = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2;
    // easeOutQuint — soft settle on reveals
    const easeOutQuint = (t: number) => 1 - Math.pow(1 - t, 5);

    const tick = () => {
      raf = 0;
      const track = heroTrackRef.current;
      const hero = heroRef.current;
      if (!track || !hero) return;
      const rect = track.getBoundingClientRect();
      const total = Math.max(1, track.offsetHeight - window.innerHeight);
      const p = Math.min(1, Math.max(0, -rect.top / total));

      // Pan — skip DOM write if change is < 0.25% (no visible diff, avoids paints)
      const { start, end } = getPanRange();
      const bgx = start + easeInOutSine(p) * (end - start);
      if (Math.abs(bgx - lastBgxRef.current) >= 0.25 || p >= 1 || p <= 0) {
        heroBgRef.current?.style.setProperty("--bgx", `${bgx}%`);
        lastBgxRef.current = bgx;
      }

      // Handoff — extended tail (last 35%) for a continuous darken into Belief
      const handoff = Math.min(1, Math.max(0, (p - HANDOFF_START) / (1 - HANDOFF_START)));
      heroHandoffRef.current?.style.setProperty("--pan-p", String(easeInOutSine(handoff)));

      // Reveals — overlapping windows, easeOutQuint settle. Runs the same in
      // both directions: scroll down and the text/buttons write themselves
      // in; scroll back up and they erase themselves out, in sync with the
      // image panning back.
      const span = REVEAL_SPAN;
      const l2 = Math.min(1, Math.max(0, (p - REVEAL.line2) / span));
      const b1 = Math.min(1, Math.max(0, (p - REVEAL.btn1) / span));
      const b2 = Math.min(1, Math.max(0, (p - REVEAL.btn2) / span));
      hero.style.setProperty("--l2", String(easeOutQuint(l2)));
      hero.style.setProperty("--b1", String(easeOutQuint(b1)));
      hero.style.setProperty("--b2", String(easeOutQuint(b2)));
      // CTAs only clickable once basically fully revealed, either direction.
      // Each button becomes clickable independently, based on its own
      // reveal progress — Start Your Story (b1) lands first and should be
      // clickable before Discover the Kingdom (b2) has even appeared.
      hero.classList.toggle("hero-btn1-ready", b1 > 0.5);
      hero.classList.toggle("hero-btn2-ready", b2 > 0.5);
    };
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(tick);
    };
    tick();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  // ============ Heritage/Philosophy immersive duo (tunable) ============
  // Pinned like the hero. Heritage slides in from the LEFT and settles, then
  // — with no pause — continues on to exit further left while Philosophy of
  // the Founder enters from the right (the "other side"), landing exactly
  // where Heritage's trailing edge is at every instant so the two edges
  // always meet with zero gap between them. Fully reversible scrolling up.
  //
  // Modelled as one camera panning across a single long wall at a constant
  // rate, rather than two animations played back to back: Heritage slides in
  // from the left, keeps going to exit left, and Philosophy follows it in from
  // the right — one uninterrupted move. Because the pan is linear, every leg
  // covers a screen-width over the same amount of scrolling, so Heritage
  // arriving, Heritage leaving and Philosophy arriving are all literally the
  // same speed. Easing is deliberately absent: any ease-in/ease-out puts a
  // near-stationary patch at the phase junction, which reads as scrolling
  // against a frozen screen.
  //
  // DUO_LEAD starts the pan a full screen before the panel pins, so Heritage
  // is already ~75% of the way in by the time the section owns the screen —
  // the previous timing left an almost-empty panel sitting there. The pan
  // finishes exactly as the pin releases, so Philosophy lands at the same
  // moment you are free to scroll onward.
  const DUO_HOLD = "267vh";
  const DUO_LEAD = 1;     // screen-heights of pan that happen before pinning
  const DUO_TRAVEL = 2;   // screen-widths the camera covers in total

  const duoTrackRef = useRef<HTMLDivElement>(null);
  const duoHeritageRef = useRef<HTMLElement>(null);
  const duoPhilRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const heritage = duoHeritageRef.current;
    const phil = duoPhilRef.current;
    if (!heritage || !phil) return;

    if (reduced) {
      heritage.style.transform = "none";
      phil.style.transform = "none";
      return;
    }

    const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

    let raf = 0;
    const tick = () => {
      raf = 0;
      const track = duoTrackRef.current;
      if (!track) return;
      const rect = track.getBoundingClientRect();
      const lead = window.innerHeight * DUO_LEAD;
      const total = Math.max(1, track.offsetHeight - window.innerHeight + lead);
      const p = clamp01((-rect.top + lead) / total);

      // Camera position in screen-widths travelled. Heritage owns the first
      // width, the Heritage→Philosophy handoff the second; both are read off
      // the same linear ramp, which is what keeps their speeds identical.
      const camera = p * DUO_TRAVEL;
      const enter = clamp01(camera);
      const cross = clamp01(camera - 1);

      // Heritage: -100% (off-screen left) -> 0% (centered) -> -100% (exits left)
      const heritageX = -100 + 100 * enter - 100 * cross;
      // Philosophy: 100% (off-screen right, untouched during Heritage's solo
      // entrance) -> 0% (centered). During the cross phase this is always
      // exactly heritageX + 100, so the two panels' touching edges coincide
      // at every instant with zero gap — it just isn't tied to heritageX
      // before the cross phase starts, or Philosophy would move prematurely.
      const philX = 100 - 100 * cross;

      heritage.style.transform = `translateX(${heritageX}%)`;
      phil.style.transform = `translateX(${philX}%)`;
      heritage.style.pointerEvents = heritageX <= -99 ? "none" : "auto";
      phil.style.pointerEvents = philX >= 99 ? "none" : "auto";
    };
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(tick);
    };
    tick();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const openCatalog = (category: string, type: string, style: string) => {
    setSelection({ category, type, style });
  };
  const closeCatalog = () => {
    setSelection(null);
    setTimeout(() => document.getElementById("collections")?.scrollIntoView({ behavior: "smooth" }), 40);
  };

  return (
    <>
      {/* HERO */}
      <div className="hero-track" ref={heroTrackRef} style={{ ["--hero-hold" as any]: HOLD }}>
        <section className="hero" id="top" ref={heroRef as any}>
          <video className="hero-video" autoPlay muted loop playsInline aria-hidden="true" />
          <div className="hero-bg" ref={heroBgRef} aria-hidden="true" />
          <div className="hero-navy-handoff" ref={heroHandoffRef} aria-hidden="true" />
          <div className="hero-veil" aria-hidden="true" />
          <div className="hero-inner">
            <h1>
              <span className="hero-script">Every piece begins with a story…</span>
              <span className="hero-main serif canela canela-lighter uni-h">
                Ours begins with <em>yours.</em>
              </span>
            </h1>
            <div className="hero-actions">
              <a href="#begin" className="btn btn-gold hero-btn-1">Start Your Story</a>
              <a href="#collections" className="btn btn-ghost-l hero-btn-2">Discover the Kingdom</a>
            </div>
          </div>
          <div className="hero-v-notch" aria-hidden="true" />
        </section>
      </div>

      <VDivider bg="#f2eadb" fill="var(--navy)" />

      {/* HERITAGE + PHILOSOPHY — pinned immersive duo */}
      <div className="duo-track" ref={duoTrackRef} style={{ ["--duo-hold" as any]: DUO_HOLD }}>
        <div className="duo-pin">
          <section id="heritage" className="duo-panel" ref={duoHeritageRef as any}>
            <div className="wrap her-stack">
              <div className="her-head reveal">
                <span className="eyebrow">Our Heritage</span>
                <h2 className="serif canela uni-h">A Voyage Amidst the <em>Stones.</em></h2>
              </div>
              <div className="her-grid">
                <div className="her-photo reveal">
                  <div className="her-photo-crop">
                    <img src="https://stantonkingdom.com/wp-content/uploads/2023/10/David-Stanton-Frame-2-768x1012.png" alt="David C. Stanton, Founder of Stanton Kingdom" loading="lazy" />
                  </div>
                </div>
                <div className="her-body">
                  <p className="reveal">Stanton Kingdom was established by David C. Stanton, whose voyage amidst the stones commenced at the tender age of fifteen, apprenticing under the leadership of his esteemed brother, Doniel Stanton, a renowned gemologist and jewelry manufacturer throughout the United Kingdom.</p>
                  <p className="reveal">Born and raised in England, David now resides in the United States with his beloved wife and four remarkable children.</p>
                </div>
              </div>
            </div>
          </section>

          <section id="belief" className="duo-panel" ref={duoPhilRef as any}>
            <div className="wrap">
              <div className="phil-heading-wrap reveal">
                <span className="phil-heading uni-h">The Philosophy of the <em>Founder</em></span>
                <div className="phil-rule">
                  <span></span>
                  <svg className="phil-rule-icon" width="20" height="20" viewBox="0 0 792 783.134">
                    <path fill="currentColor" d="M 420.503906 331.320312 L 421.8125 330.535156 L 657.964844 194.234375 L 659.359375 193.449219 L 420.503906 193.449219 Z"/>
                    <path fill="currentColor" d="M 444.921875 373.703125 L 451.113281 377.277344 L 673.835938 505.816406 L 791.5625 377.277344 L 791.5625 352.597656 L 689.96875 232.257812 Z"/>
                    <path fill="currentColor" d="M 134.644531 193.460938 L 0.4375 352.609375 L 212.78125 352.609375 L 322.660156 416.007812 L 322.660156 656.519531 L 104.210938 418.1875 L 232.027344 418.1875 L 161.214844 377.289062 L 0.4375 377.289062 L 371.582031 782.269531 L 371.582031 387.839844 L 239.640625 311.710938 L 88.515625 311.710938 L 153.746094 234.445312 L 322.660156 234.445312 L 322.660156 303.164062 L 371.582031 331.332031 L 371.582031 193.460938 Z"/>
                    <path fill="currentColor" d="M 396.046875 0 L 369.359375 73.355469 L 271.023438 9.132812 L 263.746094 92.769531 L 130.300781 50.382812 L 180.539062 145.574219 L 611.414062 145.574219 L 661.796875 50.382812 L 528.351562 92.769531 L 521.070312 9.132812 L 422.738281 73.355469 Z"/>
                    <path fill="currentColor" d="M 420.503906 782.257812 L 639.914062 542.792969 L 420.503906 416.085938 Z"/>
                  </svg>
                  <span></span>
                </div>
              </div>
              <div className="phil-grid">
                <div className="phil-art reveal">
                  <img src="/philosophy.webp" alt="The Philosophy of the Founder, handwritten by David C. Stanton" loading="lazy" />
                </div>
                <PhilosophyText />
              </div>
              <div className="phil-sig">
                <span className="phil-sig-name">David C. Stanton</span>
                <span className="phil-sig-date">Founder of Stanton Kingdom</span>
              </div>
            </div>
          </section>
        </div>
      </div>
      <VDivider bg="var(--ivory)" fill="#e9dfcc" />

      {/* COLLECTIONS */}
      <section id="collections" style={{ padding: "7.5rem 0", background: "var(--ivory)", position: "relative" }}>
        <div className="wrap">
          <div className="sec-head reveal" style={{ marginBottom: "4rem" }}>
            <span className="eyebrow">Discover the Kingdom</span>
            <h2 className="serif canela canela-lighter collection-h2 uni-h">
              The David C. Stanton <em className="collection-em">Collection</em>
            </h2>
            <p className="collection-sub">A style for everyone — Classic, Trendsetting, Vintage, or Uniquely Yours.</p>
          </div>
          <CollectionsCarousel onPick={openCatalog} />
        </div>
      </section>
      {/* Catalog renders nothing until a style is picked, in which case the
          next visible section is Journey (navy) — but once a style IS picked,
          Catalog's own ivory background sits right below this divider instead. */}
      <VDivider bg={selection ? "var(--ivory)" : "var(--navy)"} fill="var(--ivory)" />

      {/* CATALOG */}
      <Catalog selection={selection} onClose={closeCatalog} />

      {/* JOURNEY */}
      <section id="journey">
        <div className="wrap">
          <div className="sec-head reveal">
            <span className="eyebrow">Bespoke Artistry</span>
            <h2 className="serif canela canela-lighter uni-h">Conversation to <em>Creation.</em></h2>
          </div>
          <div className="journey-grid">
            {[
              { n: 1, h: "Discuss", p: "Share your vision. We'll refine it together." },
              { n: 2, h: "Design", p: "Visualize every detail prior to production." },
              { n: 3, h: "Develop", p: "Master artisans bring your vision to life." },
              { n: 4, h: "Deliver", p: "Yours and yours only, delivered worldwide." },
            ].map((s) => (
              <div key={s.n} className="j-step reveal">
                <span className="j-num">{s.n}</span>
                <h3 className="serif canela">{s.h}</h3>
                <p>{s.p}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <VDivider bg="var(--ivory)" fill="#2b447a" />


      {/* FAQ */}
      <section id="faq">
        <div className="wrap">
          <div className="sec-head reveal faq-head">
            <span className="eyebrow">Questions, Answered.</span>
          </div>
          <button
            className="faq-toggle reveal"
            aria-expanded={faqOpen}
            onClick={() => {
              setFaqOpen((v) => !v);
              if (faqOpen) setOpenFaq(null);
            }}
          >
            <span className="faq-toggle-txt serif canela canela-light uni-h">Before you ask.</span>
            <span className="faq-toggle-icon"><span className="faq-toggle-icon-glyph">+</span></span>
          </button>
          <div className="faq-list" hidden={!faqOpen}>
            {FAQ.map((f, i) => (
              <div key={i} className={"faq-item" + (openFaq === i ? " open" : "")}>
                <button className="faq-q" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                  <span className="faq-txt">{f.q}</span>
                  <span className="fx">+</span>
                </button>
                <div className="faq-a" style={{ maxHeight: openFaq === i ? 600 : 0 }}>
                  {f.a.map((p, j) => <p key={j}>{p}</p>)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <VDivider bg="#f5efe1" fill="var(--ivory)" />


      {/* BEGIN + FOOTER — wrapped together so the footer's sticky reveal is
          bounded to just this tail stretch, not the whole document. */}
      <div className="curtain-wrap">
      <section id="begin">
        <h2 className="serif canela canela-light reveal uni-h begin-h">Start <em>Your Story.</em></h2>
        <div className="contact-grid reveal">
          <a className="contact-opt" href="https://wa.me/16464508840">
            <svg className="cc-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12c0 1.85.5 3.58 1.38 5.07L2 22l5.06-1.33A9.94 9.94 0 0 0 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm5.2 14.2c-.22.62-1.09 1.15-1.79 1.3-.48.1-1.1.18-3.2-.69-2.69-1.11-4.43-3.83-4.57-4.01-.13-.18-1.09-1.45-1.09-2.77 0-1.32.69-1.96.94-2.23.22-.24.48-.3.64-.3.16 0 .32 0 .46.01.15.01.35-.06.55.42.22.53.74 1.83.8 1.96.06.13.1.29.02.47-.08.18-.12.29-.24.44-.12.15-.25.34-.36.46-.12.12-.24.25-.1.49.14.24.62 1.02 1.33 1.65.91.81 1.68 1.06 1.92 1.18.24.12.38.1.52-.06.14-.16.6-.7.76-.94.16-.24.32-.2.54-.12.22.08 1.4.66 1.64.78.24.12.4.18.46.28.06.1.06.58-.16 1.2z"/></svg>
            <span className="cc-label serif canela">Chat</span>
            <span className="cc-sub">Message us anytime.</span>
          </a>
          <a className="contact-opt" href="tel:+16464508840">
            <span
              className="cc-icon cc-icon-mask"
              style={{ WebkitMaskImage: `url(${phoneIconUrl})`, maskImage: `url(${phoneIconUrl})` }}
              aria-hidden="true"
            />
            <span className="cc-label serif canela">Call</span>
            <span className="cc-sub">Speak with us directly.</span>
          </a>
          <button
            type="button"
            className="contact-opt"
            id="meetBtn"
            aria-expanded={meetOpen}
            onClick={() => {
              setMeetOpen((v) => !v);
              if (!meetOpen) {
                requestAnimationFrame(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }));
                setTimeout(() => (formRef.current?.querySelector('input[name="first_name"]') as HTMLInputElement | null)?.focus({ preventScroll: true }), 600);
              }
            }}
          >
            <svg className="cc-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <rect x="7" y="1.3" width="2.2" height="5.4" rx="1.1" />
              <rect x="14.8" y="1.3" width="2.2" height="5.4" rx="1.1" />
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M5 4h14a2.5 2.5 0 0 1 2.5 2.5V19A2.5 2.5 0 0 1 19 21.5H5A2.5 2.5 0 0 1 2.5 19V6.5A2.5 2.5 0 0 1 5 4zM4 8.7h16v1.4H4V8.7zm3.3 3.9a1.1 1.1 0 1 1 0 2.2 1.1 1.1 0 0 1 0-2.2zm4.7 0a1.1 1.1 0 1 1 0 2.2 1.1 1.1 0 0 1 0-2.2zm4.7 0a1.1 1.1 0 1 1 0 2.2 1.1 1.1 0 0 1 0-2.2z"
              />
            </svg>
            <span className="cc-label serif canela">Consult</span>
            <span className="cc-sub">Discuss in person or virtual.</span>
          </button>
        </div>

        <form
          ref={formRef}
          className="acq-form"
          hidden={!meetOpen}
          action="https://formsubmit.co/sales@stantonkingdom.com"
          method="POST"
          encType="multipart/form-data"
          onSubmit={(e) => {
            if (!refVal) {
              e.preventDefault();
              setRefInvalid(true);
              refDdRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
            }
          }}
        >
          <input type="hidden" name="_subject" value="New inquiry — stantonkingdom.com" />
          <input type="hidden" name="_captcha" value="false" />
          <div className="f-row">
            <label>First Name<input type="text" name="first_name" required /></label>
            <label>Last Name<input type="text" name="last_name" required /></label>
          </div>
          <div className="f-row">
            <label>Email<input type="email" name="email" required /></label>
            <label>Contact Number<input type="tel" name="phone" required /></label>
          </div>
          <label>How did you hear about us?
            <input type="hidden" name="referral" value={refVal} />
            <div
              ref={refDdRef}
              className={"dd" + (refOpen ? " open" : "") + (refInvalid ? " invalid" : "")}
            >
              <button type="button" className="dd-btn" onClick={() => setRefOpen((v) => !v)}>
                {refVal || "Please select"}
              </button>
              <div className="dd-list">
                {["Friend / Referral", "Google", "Instagram", "LinkedIn", "TikTok", "X", "Other"].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => {
                      setRefVal(v);
                      setRefOpen(false);
                      setRefInvalid(false);
                    }}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
            <span className="dd-error">Please select an option</span>
          </label>
          <label>Message<textarea name="message" rows={4} placeholder="Tell us about the piece you have in mind…" required /></label>
          <label className="f-file">Share an inspiration image <span className="f-hint">(optional)</span>
            <input type="file" name="attachment" accept="image/*" />
          </label>
          <button type="submit" className="btn btn-gold" style={{ marginTop: "1.6rem" }}>Begin the Conversation</button>
        </form>
      </section>
      <SiteFooter />
      </div>
    </>
  );
}
