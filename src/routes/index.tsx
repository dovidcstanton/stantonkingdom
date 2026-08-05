import { useEffect, useRef, useState, type MutableRefObject, type ReactNode } from "react";
import { createFileRoute, useNavigate, useRouterState } from "@tanstack/react-router";
import { collectionPath } from "@/lib/catalog";
import { SiteFooter } from "@/components/SiteFooter";
import { SignatureMark } from "@/components/SignatureMark";
import phoneIconUrl from "@/assets/icon-phone-mask.png";
import { WHATSAPP_URL } from "@/lib/social";
/* Shared with The Kingdom Concierge — see src/lib/faq.ts. */
import { FAQ } from "@/lib/faq";
import { HONEYPOT_FIELD, TIMESTAMP_FIELD } from "@/lib/inquiry";
import { submitInquiry } from "@/lib/inquiry.server";

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
      {/* A 1-unit overscan on the flat edge and sides absorbs sub-pixel
          antialiasing so no seam line of the container's own background can
          peek through there. The apex must NOT be overscanned: SVG clips to
          the viewBox, so an apex at 101 loses its last unit, and because this
          point is very shallow that removes a ~10px-wide flat segment rather
          than a hairline — every divider on the site ended up blunt-tipped.
          Landing it exactly on the edge keeps the point intact. */}
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" shapeRendering="geometricPrecision">
        <polygon
          points={flip ? "-1,101 101,101 50,0" : "-1,-1 101,-1 50,100"}
          fill={fill}
          stroke={accent ? "var(--gold)" : undefined}
          strokeWidth={accent ? 1.5 : undefined}
          vectorEffect={accent ? "non-scaling-stroke" : undefined}
        />
      </svg>
    </div>
  );
}

/* ---- Consult form dropdowns ----
   One control, used by all four selects, so the field and the menu it opens
   are the same object rather than a styled box that hands off to the
   browser's own list. Marks are drawn at a single weight in currentColor and
   inherit the field's ink: they are there to be recognised at a glance, not
   to import eight brand palettes into a cream form. */
const DD_ICON = {
  referral: (
    <svg className="ic-people" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.4 19.4a5.8 5.8 0 0 1 11.2 0" />
      <path d="M16.4 5.2a3 3 0 0 1 0 5.6M18.2 19.4a5.9 5.9 0 0 0-2.4-4.7" />
    </svg>
  ),
  google: (
    <svg className="ic-mass" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48Z" />
    </svg>
  ),
  /* The same solid mark the Chat pill carries — bubble filled, handset knocked
     out with evenodd — so the two WhatsApps on the page are one drawing. */
  whatsapp: (
    <svg className="ic-mass" viewBox="0 0 24 24" fill="currentColor">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413A11.815 11.815 0 0 0 12.05 0Zm5.422 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347Z"
      />
    </svg>
  ),
  /* Back to the outline. Instagram's mark IS a line drawing — filling it in to
     match Facebook's mass made it the heaviest thing in the list and stopped
     looking like the logo. Optical balance here is not a matter of construction
     but of the core shape: this square is drawn at 18.4 units against Facebook's
     24-unit disc, because an enclosed square reads larger than a circle of the
     same measure, and its 1.9 stroke is set to carry the same ink as the solid
     marks beside it. */
  instagram: (
    <svg className="ic-ig" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
      <rect x="2.8" y="2.8" width="18.4" height="18.4" rx="5.2" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="17.6" cy="6.4" r="1.25" fill="currentColor" stroke="none" />
    </svg>
  ),
  facebook: (
    <svg className="ic-mass" viewBox="0 0 24 24" fill="currentColor">
      <path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z" />
    </svg>
  ),
  linkedin: (
    <svg className="ic-mass" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286ZM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065Zm1.782 13.019H3.555V9h3.564v11.452ZM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003Z" />
    </svg>
  ),
  tiktok: (
    <svg className="ic-mass" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07Z" />
    </svg>
  ),
  x: (
    <svg className="ic-mass" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
    </svg>
  ),
  other: (
    <svg className="ic-dots" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="5.4" cy="12" r="1.7" />
      <circle cx="12" cy="12" r="1.7" />
      <circle cx="18.6" cy="12" r="1.7" />
    </svg>
  ),
} as const;

type DdOption = { value: string; icon?: ReactNode; alt?: boolean };

function Dropdown({
  value,
  onChange,
  options,
  placeholder = "Please select",
  invalid,
  boxRef,
}: {
  value: string;
  onChange: (v: string) => void;
  options: DdOption[];
  placeholder?: string;
  invalid?: boolean;
  boxRef?: MutableRefObject<HTMLDivElement | null>;
}) {
  const [open, setOpen] = useState(false);
  const local = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (local.current && !local.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("click", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);
  const chosen = options.find((o) => o.value === value);
  return (
    <div
      ref={(n) => {
        local.current = n;
        if (boxRef) boxRef.current = n;
      }}
      className={"dd" + (open ? " open" : "") + (invalid ? " invalid" : "")}
    >
      <button
        type="button"
        className="dd-btn"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {chosen?.icon ? <span className="dd-ic">{chosen.icon}</span> : null}
        <span className={value ? undefined : "dd-ph"}>{value || placeholder}</span>
      </button>
      <div className="dd-list" role="listbox">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            role="option"
            aria-selected={o.value === value}
            className={(o.alt ? "dd-alt" : "") + (o.value === value ? " is-sel" : "")}
            onClick={() => {
              onChange(o.value);
              setOpen(false);
            }}
          >
            {o.icon ? <span className="dd-ic">{o.icon}</span> : null}
            <span>{o.value}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

const CATEGORY_OPTS: DdOption[] = [
  { value: "Engagement" },
  { value: "Eternity" },
  { value: "Ring" },
  { value: "Earrings" },
  { value: "Necklace" },
  { value: "Bracelet" },
  /* Not another category — a way of saying "none of the above yet". Set a
     shade lighter and in italic, behind a divider, so it reads as the
     exploratory alternative rather than as a disabled row. */
  { value: "Exploring Ideas", alt: true },
];

const DIAMOND_OPTS: DdOption[] = [
  { value: "Natural" },
  { value: "Lab-Grown" },
  { value: "Open to Either" },
];

const BUDGET_OPTS: DdOption[] = [
  { value: "Up to $2,500" },
  { value: "$2,500 – $5,000" },
  { value: "$5,000+" },
  { value: "To Be Determined", alt: true },
];

const REFERRAL_OPTS: DdOption[] = [
  { value: "Referral", icon: DD_ICON.referral },
  { value: "Google", icon: DD_ICON.google },
  { value: "Instagram", icon: DD_ICON.instagram },
  { value: "WhatsApp", icon: DD_ICON.whatsapp },
  { value: "Facebook", icon: DD_ICON.facebook },
  { value: "LinkedIn", icon: DD_ICON.linkedin },
  { value: "TikTok", icon: DD_ICON.tiktok },
  { value: "X", icon: DD_ICON.x },
  { value: "Other", icon: DD_ICON.other },
];

/* Far-right affordance inside each Start Your Story pill. Decorative only —
   the whole pill is the link, so this is hidden from assistive tech. */
function Chevron() {
  return (
    <svg className="cc-chev" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 5 7 7-7 7" />
    </svg>
  );
}

function PhilosophyText() {
  const [expanded, setExpanded] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // Collapse once the panel is off screen, so returning to it always starts
  // from the excerpt and "Continue…" again. Leaving it expanded meant sliding
  // back to this frame landed you mid-essay with no way back to the short form.
  // The panel is translated fully aside during the Heritage leg of the pan, so
  // it stops intersecting there too — scrolling back up resets it as well.
  useEffect(() => {
    if (!expanded) return;
    const panel = rootRef.current?.closest(".duo-panel");
    if (!panel) return;
    const io = new IntersectionObserver(
      ([entry]) => { if (!entry.isIntersecting) setExpanded(false); },
      // The root is squeezed to the middle 30% of the screen on purpose. During
      // the Heritage leg this panel is parked exactly one screen-width to the
      // right, so its left edge lands precisely ON the viewport edge — and a
      // rect that merely touches the boundary still reports isIntersecting with
      // a ratio of 0. Requiring it to reach the centre band makes "off screen"
      // mean actually off screen.
      { threshold: 0, rootMargin: "0px -35% 0px -35%" },
    );
    io.observe(panel);
    return () => io.disconnect();
  }, [expanded]);

  return (
    <div className="phil-copy" ref={rootRef}>
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


/* -------- Collections data -------- */
const COLLECTIONS = [
  {
    name: "Rings",
    img: "/collection-rings.jpg",
    types: ["Engagement", "Wedding", "Eternity", "Haute Couture"],
  },
  {
    name: "Earrings",
    img: "/collection-earrings.jpg",
    types: ["Studs & Clusters", "Hoops & Huggies", "Drops & Chandeliers"],
  },
  {
    name: "Bracelets",
    img: "/collection-bracelets.jpg",
    types: ["Tennis", "Bangles", "Statement & Link"],
  },
  {
    name: "Necklaces",
    img: "/collection-necklaces.jpg",
    types: ["Solitaires", "Pendants", "Riviera & Tennis", "Statement & Link"],
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
        // Where the pointer is inside the card, as a percentage, handed to CSS
        // as the zoom's transform-origin. Written straight to the node rather
        // than through state: this fires on every mousemove, and re-rendering
        // the card at that rate would cost far more than it buys. The easing
        // lives in CSS, so this only ever reports a position.
        onMouseMove={(e) => {
          const el = e.currentTarget;
          const r = el.getBoundingClientRect();
          el.style.setProperty("--ox", `${((e.clientX - r.left) / r.width) * 100}%`);
          el.style.setProperty("--oy", `${((e.clientY - r.top) / r.height) * 100}%`);
        }}
      >
        <div className="img" style={{ backgroundImage: `url('${col.img}')` }} />
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




/** "Questions, answered." rising out from behind the "Before you ask." button.
 *
 *  There is no delay and no timer. The rise starts the instant the section
 *  begins to come into frame and runs while it is still arriving, so the words
 *  are already floating up as you scroll toward them and have settled by about
 *  the time the button reaches its place. Held back even slightly, it stops
 *  reading as part of the section's arrival and starts reading as a heading
 *  that animated in afterwards.
 *
 *  Two settings do that, and they matter more than they look:
 *
 *  threshold 0 — fire on the very first pixel, not on some fraction of the
 *  element. The eyebrow's box is only ~18px tall, so waiting for a proportion
 *  of it is nearly the same as waiting for all of it.
 *
 *  rootMargin +20% top AND bottom — the deciding one. It grows the observer's
 *  box past both folds, so the reveal is triggered while the section is still
 *  approaching rather than once it has landed. That is what buys the movement
 *  its head start: it is already underway before the button is fully in frame.
 *
 *  20% is a judgement between two things a fixed-duration animation cannot
 *  both have. Too small and the rise only begins once you are looking at the
 *  section, so it finishes well after the button has settled. Too large and it
 *  is over before the section is even on screen — 40% was tried and on an
 *  unhurried scroll the words were 100% risen by the time the button landed,
 *  which is precisely the "it was always sitting there" look this exists to
 *  avoid. 20% keeps the emergence where it has to be — on screen, in front of
 *  the reader — while still starting it before the button comes to rest.
 *  Seeing it happen is the point; finishing in perfect step is not.
 *
 *  Both edges, because the section is approached from both. With the margin on
 *  the bottom alone the downward arrival was right and the upward one was not:
 *  coming back up the page the section enters over the TOP fold, where there
 *  was no margin to trigger against, so the button had already settled before
 *  the words began to move — measured at 551ms against 584ms. Mirroring the
 *  margin makes the two arrivals behave identically.
 *
 *  A repeating observer, deliberately. The page-level reveal in useReveal()
 *  unobserves each element the first time it lands, which is right for a
 *  one-off entrance but would let this play once and never again. This one
 *  keeps watching, so the eyebrow drops back behind the button whenever the
 *  section leaves and rises again on the way back — down the page or up it.
 *
 *  The class is all this does; the occlusion, the offset and the easing are
 *  entirely in the stylesheet (see the note on #faq .faq-head there), and the
 *  whole effect is scoped to mobile by the media query around those rules. On
 *  a desktop the class lands too and changes nothing — as does reduced motion,
 *  where the stylesheet holds the eyebrow at its resting position throughout. */
function useFaqEyebrowRise() {
  useEffect(() => {
    const head = document.querySelector("#faq .faq-head");
    if (!head) return;
    const io = new IntersectionObserver(
      ([entry]) => head.classList.toggle("is-risen", entry.isIntersecting),
      { threshold: 0, rootMargin: "20% 0px 20% 0px" },
    );
    io.observe(head);
    return () => io.disconnect();
  }, []);
}

/** Arriving at the FAQ — at the head of the list, or at one exact question.
 *
 *  A search result for "how long does it take" has to finish the job: open the
 *  list, expand THAT question, and leave the visitor looking at the answer. The
 *  old behaviour — scroll to #faq — put them at the top of a closed accordion
 *  with ten collapsed rows and no indication which one they had asked for.
 *
 *  Two ways in, deliberately. The URL hash is the durable one: it survives a
 *  refresh, it can be shared, and it is what makes the deep link real rather
 *  than a side effect of having clicked something. The event is for the case
 *  the hash cannot cover — asking for the question you are already on, where
 *  the address does not change and so nothing would fire.
 *
 *  Positioning is done by arithmetic, not by scrollIntoView. The header is
 *  fixed, so the browser's own "top of the viewport" is underneath it, and this
 *  page in particular has pinned sections that make scrollIntoView land
 *  somewhere different depending on where it started. --sk-hdr is read from the
 *  document rather than assumed, so the 64px desktop bar and the 80px mobile
 *  one are both cleared without this function knowing which it is looking at.
 *  It settles twice: once on the next frame, and again after the answer's
 *  height transition has finished, because expanding a row above the target
 *  moves the target. */
function useFaqDeepLink(
  setFaqOpen: (v: boolean) => void,
  setOpenFaq: (v: number | null) => void,
) {
  const hash = useRouterState({ select: (s) => s.location.hash });

  useEffect(() => {
    /* One arrival, two depths.
       `null` asks for the SECTION — open the list and put the visitor at the
       top of it with the questions laid out beneath, choosing none of them.
       An id asks for one exact QUESTION and expands it. Both take the same
       route in, because the hard parts — opening the list, waiting for it to
       exist, and clearing the fixed header — are identical, and having two
       scrolling systems arguing over the same page is how you get a landing
       position that depends on which one finished last. */
    const reveal = (id: string | null) => {
      const i = id ? FAQ.findIndex((f) => f.id === id) : -1;
      if (id && i < 0) return;
      setFaqOpen(true);
      // Only a question deep link chooses a row. Arriving at the section must
      // leave the accordion as the visitor left it — and must never expand one
      // for them, or the list they came to browse opens already committed.
      if (id) setOpenFaq(i);
      const settle = () => {
        /* What has to sit under the header differs by depth, and it is the
           whole point of the distinction. For a question it is that question.
           For the section it is the BUTTON carrying "Before you ask." — not
           the #faq section box, whose top is the "Questions, Answered."
           eyebrow. Scrolling to the section put that eyebrow at the top with
           the questions pushed below the fold; scrolling to the button puts
           "Before you ask." at the top with question one directly under it,
           which is the thing the visitor actually came to use. */
        const el = id
          ? document.getElementById("faq-" + id)
          : document.querySelector<HTMLElement>("#faq .faq-toggle");
        if (!el) return;
        const hdr =
          parseFloat(
            getComputedStyle(document.documentElement).getPropertyValue("--sk-hdr"),
          ) || 64;
        // A little air under the bar, so the target reads as sitting at the
        // top of the page rather than tucked against the header's own edge.
        const y = window.scrollY + el.getBoundingClientRect().top - hdr - 16;
        // Already there. Re-issuing a smooth scroll to the spot you are
        // standing on restarts the animation for nothing, and on the last pass
        // it would fight a user who has begun scrolling away.
        if (Math.abs(y - window.scrollY) < 2) return;
        window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
      };
      /* Settled more than once, and the reason is this page rather than
         nervousness. Everything above the FAQ — the hero track at 400vh, the
         Heritage/Philosophy duo — is pinned and multi-viewport, and its height
         is still resolving while the scroll is in flight. A target computed
         before that settles is stale by the time it is reached: measured live,
         a single correction at 480ms landed "Before you ask." twenty pixels
         UNDER the fixed header, because the document above it had grown after
         the last measurement was taken.
         Each pass recomputes from live rects, so the later ones correct the
         earlier ones rather than repeating them, and the no-op guard above
         means a pass that finds nothing wrong does nothing at all. 1200ms is
         past the point where the pinned sections have stopped moving. */
      requestAnimationFrame(() => requestAnimationFrame(settle));
      const timers = [480, 1200].map((ms) => window.setTimeout(settle, ms));
      return () => timers.forEach(window.clearTimeout);
    };

    // On mount and on every hash change — which is what makes a refresh of
    // /#faq-shipping land on the shipping question, and /#faq on the head of
    // the list, rather than at the top of the page.
    const fromHash = (hash || "").replace(/^#/, "");
    if (fromHash === "faq") reveal(null);
    else if (fromHash.startsWith("faq-")) reveal(fromHash.slice(4));

    // detail carries the question id, or nothing at all for the section.
    const onEvent = (e: Event) => reveal((e as CustomEvent<string | null>).detail ?? null);
    window.addEventListener("sk:faq", onEvent);
    return () => window.removeEventListener("sk:faq", onEvent);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hash]);
}

function HomePage() {
  useReveal();
  useFaqEyebrowRise();
  const [faqOpen, setFaqOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  useFaqDeepLink(setFaqOpen, setOpenFaq);
  const [meetOpen, setMeetOpen] = useState(false);
  const [refVal, setRefVal] = useState("");
  /* All three are optional — the point is to gather context, not to make
     someone settle these questions before they can say hello. */
  const [catVal, setCatVal] = useState("");
  const [diaVal, setDiaVal] = useState("");
  const [budVal, setBudVal] = useState("");
  const [fileName, setFileName] = useState("");
  const navigate = useNavigate();
  const formRef = useRef<HTMLFormElement>(null);

  /* ---- Submitting an enquiry ----
     Four states, and the transitions between them are the whole of the
     behaviour: idle -> sending -> sent, or idle -> sending -> error -> idle.

     "sending" is what prevents a double submission. It disables the button and
     is checked at the top of the handler, so neither a second click nor a
     second Enter can start a second request — a duplicate enquiry means the
     client gets two confirmations and an advisor cannot tell whether they
     wrote twice.

     On failure NOTHING is reset. The form is never re-rendered from scratch,
     the fields are uncontrolled DOM inputs, and the file input is left alone,
     so every answer the visitor typed is still exactly where they left it and
     the only thing that changed is the appearance of a line of text. Losing a
     long message to a network blip is the fastest way to lose the enquiry
     entirely. */
  type SubmitStatus = "idle" | "sending" | "sent" | "error";
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>("idle");
  /* Stamped once, when the form is first mounted. The server compares it with
     the moment of arrival: a form completed in under three seconds was not
     completed by a person. See checkNotSpam in src/lib/inquiry.ts. */
  const formRenderedAt = useRef(Date.now());

  const onInquirySubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitStatus === "sending") return;

    const form = e.currentTarget;
    // The browser's own required-field checking still runs first and is still
    // the only thing a visitor sees for an empty field — this changes nothing
    // about that, it just refuses to proceed past it.
    if (!form.reportValidity()) return;

    setSubmitStatus("sending");
    const payload = new FormData(form);
    payload.set(TIMESTAMP_FIELD, String(formRenderedAt.current));
    payload.set("source", "consult");
    payload.set("page_url", window.location.href);

    try {
      const res = await submitInquiry({ data: payload });
      if (res.ok) {
        /* The collapse animates between two measured heights — max-height
           can only transition length to length, never auto to auto — so the
           numbers are frozen HERE, after the server has confirmed and
           before the class flips. h0 is the form as it stands; h1 is the
           card's own height, real even now because visibility:hidden keeps
           layout. Reading offsetHeight commits h0 as the starting value in
           this frame, so the flip to .acq-sent has something to animate
           from. Failure never reaches this branch: the error state remains
           exactly as it was. */
        const card = form.querySelector<HTMLElement>(".acq-done-card");
        if (card) {
          form.style.setProperty("--acq-h0", `${form.offsetHeight}px`);
          form.style.setProperty("--acq-h1", `${card.offsetHeight}px`);
          void form.offsetHeight;
        }
        setSubmitStatus("sent");
      } else {
        setSubmitStatus("error");
      }
    } catch {
      setSubmitStatus("error");
    }
  };

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
  // Pinned like the hero. Heritage slides in from the LEFT and settles dead
  // centre exactly as the section takes the screen, holds there to be read,
  // then continues on to exit further left while Philosophy of the Founder
  // enters from the right (the "other side"), landing exactly where Heritage's
  // trailing edge is at every instant so the two edges always meet with zero
  // gap between them. Philosophy then holds for the same beat before the pin
  // releases. Fully reversible scrolling up.
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
  // DUO_REST parks a panel dead centre for a beat so it can actually be read
  // before it leaves. It is a flat hold, not an eased one: easing into and out
  // of a stop spreads the slowdown across the surrounding motion and reads as
  // the page lagging, whereas a clean stop reads as a deliberate pause.
  // Heritage and Philosophy get the *same* rest, so the section's rhythm is
  // symmetrical: arrive, hold, cross, hold, release.
  const DUO_LEG = 4 / 3; // screen-widths of pan, in pan-units
  const DUO_REST = 0.6; // pan-units each panel holds at centre
  const DUO_REST_END = DUO_REST; // Philosophy holds exactly as long as Heritage
  const DUO_SPAN = 2 * DUO_LEG + DUO_REST + DUO_REST_END;

  // DUO_LEAD is how much of the pan happens *before* the panel pins. It is
  // derived, not chosen, because the requirement is exact: Heritage must be
  // dead centre at the very instant the section takes over the screen — not
  // still drifting in, which left you scrolling against an already-full panel.
  //
  // The pan is driven by `travelled = p * DUO_SPAN`, and the pin engages when
  // the track's top hits the viewport top, i.e. at p = DUO_LEAD / total where
  // total = DUO_SPAN - 1 + DUO_LEAD. Setting travelled-at-pin equal to the
  // entry leg (DUO_LEG) and solving for DUO_LEAD gives the expression below.
  // Deriving it keeps the guarantee intact if DUO_LEG or the rests are retuned.
  const DUO_LEAD = (DUO_LEG * (DUO_SPAN - 1)) / (DUO_SPAN - DUO_LEG);
  // Track height equals the pan span because the lead is exactly one screen.
  const DUO_HOLD = `${Math.round(DUO_SPAN * 100)}vh`;

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

      // How far into the pan we are, in screen-heights of scroll. Both legs
      // divide by the same DUO_LEG, which is what keeps Heritage arriving,
      // Heritage leaving and Philosophy arriving at one identical rate; the
      // rest simply sits between them without stretching either.
      const travelled = p * DUO_SPAN;
      const enter = clamp01(travelled / DUO_LEG);
      const cross = clamp01((travelled - DUO_LEG - DUO_REST) / DUO_LEG);

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

  // Consult, reached from the navigation menu. Opens rather than toggles: the
  // menu's intent is unambiguous, whereas the card on the page is a toggle
  // because you can press it twice. The scroll waits a tick because the form is
  // hidden until meetOpen commits, and you cannot scroll to what is not laid
  // out yet.
  useEffect(() => {
    const onConsult = () => {
      setMeetOpen(true);
      window.setTimeout(() => {
        formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 80);
      window.setTimeout(() => {
        (formRef.current?.querySelector('input[name="first_name"]') as HTMLInputElement | null)
          ?.focus({ preventScroll: true });
      }, 800);
    };
    window.addEventListener("sk:consult", onConsult);
    return () => window.removeEventListener("sk:consult", onConsult);
  }, []);

  // The Collections carousel used to open the catalogue in place, further down
  // this same page. A collection is a page of its own now, so picking one
  // leaves home rather than growing it.
  const openCatalog = (category: string, type: string, style: string) => {
    navigate({
      to: collectionPath(category || undefined, type || undefined),
      search: style && style !== "Uniquely Yours" ? { style } : {},
    });
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
                    <div className="her-frame">
                      <img src="/heritage-portrait.png" alt="David C. Stanton, Founder of Stanton Kingdom" loading="lazy" />
                    </div>
                  </div>
                </div>
                <div className="her-body">
                  {/* The two names are held together: "David C." was breaking
                      from "Stanton" across a line, which reads as a stumble in
                      the one sentence that introduces the founder. */}
                  <p className="reveal">Stanton Kingdom was established by <span className="nb">David C. Stanton</span>, whose voyage amidst the stones commenced at the tender age of fifteen, apprenticing under the leadership of his esteemed brother, <span className="nb">Doniel Stanton</span>, a renowned gemologist and jewelry manufacturer throughout the United Kingdom.</p>
                  <p className="reveal">Born and raised in England, David now resides in the United States with his beloved wife and four remarkable children.</p>
                </div>
              </div>
            </div>
          </section>

          <section id="belief" className="duo-panel" ref={duoPhilRef as any}>
            <div className="wrap">
              {/* One typeface for the whole heading — "The" used to be a
                  calligraphic swash mask; simplified to plain type so it
                  reads as one consistent title rather than two treatments. */}
              <div className="phil-heading-wrap reveal">
                <span className="phil-heading uni-h">
                  The Philosophy of the Founder
                </span>
              </div>
              <div className="phil-grid">
                <div className="phil-art reveal">
                  <img src="/philosophy.webp" alt="The Philosophy of the Founder, handwritten by David C. Stanton" loading="lazy" />
                </div>
                <PhilosophyText />
              </div>
              {/* The signature artwork carries the date itself, so no role
                  line beneath it. */}
              <div className="phil-sig">
                <SignatureMark className="phil-sig-name" />
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
            {/* One sentence, in two unbreakable halves. The line is meant to
                read as a single line and the type is sized to keep it that way
                down to ~340px; below that there is genuinely no size at which
                it both fits and stays legible, so it has to break — and these
                spans decide where. Without them the browser breaks at whatever
                space happens to fall last ("…Vintage, or" / "Uniquely Yours."),
                which reads as an accident. The only break available now is the
                one between the two halves, so the second line is always and
                only "or Uniquely Yours." */}
            <p className="collection-sub">
              <span>A Style for Everyone — Classic, Trendsetting, Vintage,</span>{" "}
              <span>or Uniquely Yours.</span>
            </p>
          </div>
          <CollectionsCarousel onPick={openCatalog} />
        </div>
      </section>
      {/* The catalogue used to render here, and this divider had to guess its
          background from whether a style was picked. Collections are their own
          pages now, so the section below is always Journey, always navy. */}
      <VDivider bg="var(--navy)" fill="var(--ivory)" />

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
              { n: 4, h: "Deliver", p: "Exclusively yours, delivered worldwide." },
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
              /* The question's permanent id, on the element a deep link has to
                 find. It is the FAQ entry's own id rather than its position, so
                 /#faq-timeline keeps meaning the same question however the ten
                 are reordered or reworded — see the note in src/lib/faq.ts. */
              <div key={f.id} id={"faq-" + f.id} className={"faq-item" + (openFaq === i ? " open" : "")}>
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
          <a className="contact-opt" href={WHATSAPP_URL}>
            {/* WhatsApp, built to match the weight of the solid phone and
                calendar glyphs beside it. The official mark's own geometry
                (simple-icons) is used, but only its OUTER contour — the ring's
                inner edge is dropped so the bubble fills solid — and the
                handset is knocked out of it as negative space via evenodd,
                which is how the real logo is drawn. Filling the stock outline
                path directly gives a thin gold ring; thickening that ring
                would have been the wrong fix. The tail sits lower-left and the
                handset carries the logo's tilt. */}
            <svg className="cc-icon cc-icon-wa" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413A11.815 11.815 0 0 0 12.05 0Zm5.422 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347Z"
              />
            </svg>
            <span className="cc-text">
              <span className="cc-label serif canela">Chat</span>
              <span className="cc-sub">Message us anytime.</span>
            </span>
            <Chevron />
          </a>
          <a className="contact-opt" href="tel:+16464508840">
            {/* The mask sits on an inner span, not on .cc-icon itself. A mask
                is applied after filters, so a drop-shadow on the masked
                element is clipped away by that same mask — which is why Call
                alone had no glow. Filtering the unmasked parent shadows the
                masked child's real silhouette. */}
            <span className="cc-icon cc-icon-mask" aria-hidden="true">
              <span
                className="cc-mask-glyph"
                style={{ WebkitMaskImage: `url(${phoneIconUrl})`, maskImage: `url(${phoneIconUrl})` }}
              />
            </span>
            <span className="cc-text">
              <span className="cc-label serif canela">Call</span>
              <span className="cc-sub">Speak with us directly.</span>
            </span>
            <Chevron />
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
            <span className="cc-text">
              <span className="cc-label serif canela">Consult</span>
              <span className="cc-sub">Discuss in person or virtually.</span>
            </span>
            <Chevron />
          </button>
        </div>

        {/* The panel stays. Whatever state the enquiry is in, this is the same
            element in the same place in the page — the success message is not
            a new screen, it is this form's own content replaced. That is why
            `hidden` still keys off meetOpen alone and the status only ever
            changes what is inside. */}
        <form
          ref={formRef}
          className={"acq-form acq-" + submitStatus}
          hidden={!meetOpen}
          method="POST"
          encType="multipart/form-data"
          onSubmit={onInquirySubmit}
          noValidate={false}
        >
          {/* Not a real field. A person never sees it and never fills it; a bot
              reads the HTML, finds an input with a plausible name, and fills
              everything it finds. Anything arriving with this populated was not
              typed by a human, and is rejected server-side.
              Hidden with position/opacity rather than `hidden` or
              display:none, because the simpler the concealment the more bots
              detect it — and tabindex/autocomplete keep it away from anyone
              navigating by keyboard or password manager.
              readOnly is the fix for the one "bot" this trap must never catch:
              the visitor's own browser. Chrome ignores autocomplete="off" and
              was writing the saved company name into this field on page load,
              which made every hand-typed enquiry look like spam. Autofill
              never writes to a read-only input; the bots this exists for
              fabricate the POST from parsed HTML and never notice. */}
          <div className="acq-hp" aria-hidden="true">
            <label htmlFor={HONEYPOT_FIELD}>Company website</label>
            <input
              id={HONEYPOT_FIELD}
              type="text"
              name={HONEYPOT_FIELD}
              tabIndex={-1}
              autoComplete="off"
              readOnly
            />
          </div>
          <div className="f-row">
            <label>First Name<input type="text" name="first_name" required /></label>
            <label>Last Name<input type="text" name="last_name" required /></label>
          </div>
          <div className="f-row">
            <label>Email<input type="email" name="email" required /></label>
            <label>Contact Number<input type="tel" name="phone" required /></label>
          </div>
          {/* The four selects pair off exactly as the two rows above them do —
              same columns, same gap — which takes four full-width rows out of
              the form's height. */}
          <div className="f-row">
            <label>Category
              <input type="hidden" name="category" value={catVal} />
              <Dropdown value={catVal} onChange={setCatVal} options={CATEGORY_OPTS} />
            </label>
            <label>Diamond Type
              <input type="hidden" name="diamond_preference" value={diaVal} />
              <Dropdown value={diaVal} onChange={setDiaVal} options={DIAMOND_OPTS} />
            </label>
          </div>
          <div className="f-row f-row-stack">
            <label>Ideal Budget
              <input type="hidden" name="ideal_budget" value={budVal} />
              <Dropdown value={budVal} onChange={setBudVal} options={BUDGET_OPTS} />
            </label>
            {/* The one caption too long for half a phone row. Rather than
                shrink it or let it wrap, this row stops being a row on a
                phone and both fields take the full width — see .f-row-stack.
                The pair still sits two-up on tablet and desktop. */}
            <label>How did you hear about us?
              <input type="hidden" name="referral" value={refVal} />
              <Dropdown value={refVal} onChange={setRefVal} options={REFERRAL_OPTS} />
            </label>
          </div>
          {/* Only ever one of the two, and only when the answer above calls for
              it. Rendered inside the flow rather than absolutely, so the fields
              beneath simply move down by one row. */}
          {/* "(optional)" is said out loud in exactly one place on this form:
              naming a referrer is an invitation, and without it the revealed
              field reads as a demand for information the visitor may not have. */}
          {refVal === "Referral" && (
            <label className="f-cond">Referred by <span className="f-hint">(optional)</span>
              <input type="text" name="referred_by" />
            </label>
          )}
          {refVal === "Other" && (
            <label className="f-cond">Please specify
              <input type="text" name="referral_other" />
            </label>
          )}
          <label>Message<textarea name="message" rows={3} placeholder="Anything else you'd like us to know?" /></label>
          {/* The native control is kept — it is what actually carries the file
              on submit — but visually hidden, with the label's own box acting
              as the button. Clicking anywhere in it opens the picker, because
              the input is a descendant of the label. */}
          <label className="f-file">Share Your Inspiration
            <span className="f-file-box">
              <span className="f-file-btn">Upload Inspo</span>
              {/* The action is the gold; this stays quiet, and steps aside for
                  the filename once something has actually been chosen. Kept
                  short so the button and its caption hold one line on a phone
                  rather than pushing the row wider. */}
              <span className="f-file-name">{fileName || "pics, sketches, etc."}</span>
            </span>
            <input
              type="file"
              name="attachment"
              accept="image/*"
              onChange={(e) => setFileName(e.currentTarget.files?.[0]?.name ?? "")}
            />
          </label>
          {/* Discreet, and only ever where the eye already is — directly above
              the button that just failed. It says what to do next rather than
              what went wrong internally; the reason is in the Worker log. */}
          {submitStatus === "error" && (
            <p className="acq-error" role="alert">
              That didn&rsquo;t send. Please try again — or write to us at{" "}
              <a href="mailto:sales@stantonkingdom.com">sales@stantonkingdom.com</a>.
            </p>
          )}
          <button type="submit" className="btn btn-gold" disabled={submitStatus === "sending"}>
            {submitStatus === "sending" ? "Sending…" : "Start Your Story"}
          </button>

          {/* The success state. It lives INSIDE the form and is positioned over
              it, so the panel does not resize, does not jump, and does not
              close — the fields fade under it and this fades in over them.
              aria-live so it is announced rather than silently swapped.

              The card is one of the form's own fields, expanded: same face,
              same rim, same recess — see .acq-done-card. The heading is the
              section's own "Start <em>Your Story.</em>" construction — same
              classes, same em, resized through the .uni-h scoping idiom — and
              the same two voices: navy roman, gold italic. "Message Received."
              answers "Start Your Story." in its own typography. */}
          <div className="acq-done" role="status" aria-live="polite">
            <div className="acq-done-card">
              <p className="acq-done-h serif canela uni-h">Message <em>Received.</em></p>
              <p className="acq-done-p">A client advisor will be in touch with you shortly.</p>
            </div>
          </div>
        </form>
      </section>
      <SiteFooter />
      </div>
    </>
  );
}
