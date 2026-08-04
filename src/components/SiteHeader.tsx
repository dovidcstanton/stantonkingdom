import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { collectionPath } from "../lib/catalog";
import wordmarkUrl from "../assets/stanton-wordmark.png";
import phoneIconUrl from "../assets/icon-phone-mask.png";
import bagIconUrl from "../assets/icon-bag-mask.png";
import { WHATSAPP_URL } from "../lib/social";
/* Matching, ranking and destinations all live in one place — see
   src/lib/search.ts for why, and for what happens when the catalogue opens. */
import { search as searchSite, type SearchRecord } from "../lib/search";

// Collections is not in this list — it opens its own panel. Start Your Story is
// not here either: it names the contact block at the foot of the drawer, and
// having it in both places made one action look like two different things.
const NAV_LINKS = [
  { label: "Bespoke", href: "#journey" },
  { label: "Heritage", href: "#heritage" },
  { label: "Philosophy", href: "#belief" },
  { label: "FAQ", href: "#faq" },
];

// The three ways in — worded, coloured and iconed exactly as the Start Your
// Story section does it, so the site says one thing in one voice wherever you
// meet it. The glyphs are the same paths that section uses.
const ICON_CHAT = "M12 2C6.48 2 2 6.48 2 12c0 1.85.5 3.58 1.38 5.07L2 22l5.06-1.33A9.94 9.94 0 0 0 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm5.2 14.2c-.22.62-1.09 1.15-1.79 1.3-.48.1-1.1.18-3.2-.69-2.69-1.11-4.43-3.83-4.57-4.01-.13-.18-1.09-1.45-1.09-2.77 0-1.32.69-1.96.94-2.23.22-.24.48-.3.64-.3.16 0 .32 0 .46.01.15.01.35-.06.55.42.22.53.74 1.83.8 1.96.06.13.1.29.02.47-.08.18-.12.29-.24.44-.12.15-.25.34-.36.46-.12.12-.24.25-.1.49.14.24.62 1.02 1.33 1.65.91.81 1.68 1.06 1.92 1.18.24.12.38.1.52-.06.14-.16.6-.7.76-.94.16-.24.32-.2.54-.12.22.08 1.4.66 1.64.78.24.12.4.18.46.28.06.1.06.58-.16 1.2z";
// The original: a dialogue window with three dots. Restored after a spell as a
// calendar-with-a-diamond — this is the glyph the house had, and it echoes the
// header's speech bubble, which carries the same three dots.
const ICON_CONSULT = "M5 4h14a2.5 2.5 0 0 1 2.5 2.5V19A2.5 2.5 0 0 1 19 21.5H5A2.5 2.5 0 0 1 2.5 19V6.5A2.5 2.5 0 0 1 5 4zM4 8.7h16v1.4H4V8.7zm3.3 3.9a1.1 1.1 0 1 1 0 2.2 1.1 1.1 0 0 1 0-2.2zm4.7 0a1.1 1.1 0 1 1 0 2.2 1.1 1.1 0 0 1 0-2.2zm4.7 0a1.1 1.1 0 1 1 0 2.2 1.1 1.1 0 0 1 0-2.2z";

const ICON_MAIL ="M3 6.2A2.2 2.2 0 0 1 5.2 4h13.6A2.2 2.2 0 0 1 21 6.2v11.6a2.2 2.2 0 0 1-2.2 2.2H5.2A2.2 2.2 0 0 1 3 17.8V6.2Zm2.6.3L12 11.6l6.4-5.1H5.6Z";
const ICON_INFO = "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 4.3a1.35 1.35 0 1 1 0 2.7 1.35 1.35 0 0 1 0-2.7ZM10.9 10.9h2.2v6.8h-2.2v-6.8Z";

// Each way in opens to reveal how. The headline row carries the same glyph the
// Start Your Story section uses for it, so the two read as the same thing in
// two places rather than as two different lists.
type ContactItem = {
  label: string;
  href?: string;
  external?: boolean;
  consult?: boolean;
  icon?: string;
  phoneMask?: boolean;
  evenOdd?: boolean;
  /** "cta" is the one thing in the panel that looks like a button; "text" is a
   *  plain underlined link that deliberately yields to it. Everything else
   *  renders as the standard indented row. */
  variant?: "cta" | "text";
};
type ContactGroup = {
  key: string;
  label: string;
  sub: string;
  icon?: string;
  phoneMask?: boolean;
  evenOdd?: boolean;
  items: ContactItem[];
};

// Worded exactly as the Start Your Story section words it, so the site says one
// thing in one voice wherever you meet it.
const CONTACT_GROUPS: ContactGroup[] = [
  {
    key: "chat", label: "Chat", icon: ICON_CHAT,
    sub: "Message us anytime.",
    items: [
      // WhatsApp is how most people actually reach us, so it carries the weight.
      { label: "WhatsApp", href: WHATSAPP_URL, external: true, icon: ICON_CHAT, variant: "cta" },
      { label: "sales@stantonkingdom.com", href: "mailto:sales@stantonkingdom.com", variant: "text" },
    ],
  },
  {
    key: "call", label: "Call", phoneMask: true,
    sub: "Speak with us directly.",
    items: [{ label: "+1 (646) 450-8840", href: "tel:+16464508840", phoneMask: true }],
  },
  {
    key: "consult", label: "Consult", icon: ICON_CONSULT, evenOdd: true,
    sub: "Discuss in person or virtually.",
    items: [{ label: "Book a consultation", consult: true, icon: ICON_CONSULT, evenOdd: true }],
  },
];

// Must mirror the page's COLLECTIONS list — these names are what the catalogue
// filters on when it receives the deep-link event below. Structured for a real
// storefront: category opens in place, and choosing a type goes straight to the
// selection rather than dropping you back on the home page to hunt for it.
const COLLECTION_TREE = [
  { name: "Rings", types: ["Engagement", "Wedding", "Eternity", "Haute Couture"] },
  { name: "Necklaces", types: ["Solitaires", "Pendants", "Riviera & Tennis", "Statement & Link"] },
  { name: "Bracelets", types: ["Tennis", "Bangles", "Statement & Link"] },
  { name: "Earrings", types: ["Studs & Clusters", "Hoops & Huggies", "Drops & Chandeliers"] },
];

const STYLES = ["Classic", "Trendsetting", "Vintage", "Uniquely Yours"];

/* ---- Direction lock ----
   One question, asked once per gesture, by every swipe in this file: "is this
   horizontal, vertical, or too early to say?"

   It replaces a test that got both halves wrong, and cost the menu its manners
   on a phone:

   1. The old gate fired as soon as EITHER axis passed 8px. A finger does not
      set off in a straight line — it leaves on a small arc — so a swipe about
      to travel 300px straight up could cross the gate at a moment when it had
      moved 9px sideways and only 6px up, and be locked horizontal on that
      evidence. The panel then sat visibly dragged for the whole of a gesture
      the user meant as a scroll. Deciding on RADIAL distance instead means the
      vote is always taken after the same amount of real travel, by which point
      the direction is actually expressed.

   2. The old test was a bare `|dx| > |dy|`, so a 46° diagonal counted as
      horizontal — near enough a coin toss deciding whether the menu closed.
      Horizontal now has to WIN, not merely tie: DOMINANCE of 1.6 asks for
      about 32° either side of the horizontal, comfortably wider than any
      deliberate sideways swipe and comfortably clear of anything meant as a
      scroll.

   Neither number is a "make the threshold huge" workaround: 12px is smaller
   than the browser's own scroll slop, and a genuine sideways swipe is claimed
   just as early as it always was. What changed is WHEN the question is asked
   and how convincingly it has to be answered.

   Module scope, not component scope: the open, close and edge gestures all ask
   it, and one of them asks from a listener bound once for the life of the page.
   It is a pure function of two numbers, so there is nothing to capture. */
const DECIDE_DISTANCE = 12; // px of radial travel before intent is judged
const DOMINANCE = 1.6;      // how far |dx| must exceed |dy| to count as sideways
type Axis = "pending" | "horizontal" | "vertical";
function decideAxis(dx: number, dy: number, wantSign: -1 | 1): Axis {
  if (Math.hypot(dx, dy) < DECIDE_DISTANCE) return "pending";
  // Anything that is not a clear sideways move is handed back to the page,
  // including a sideways move in the wrong direction — pulling the nav drawer
  // rightward is not a request to close it.
  if (Math.abs(dx) < Math.abs(dy) * DOMINANCE) return "vertical";
  return Math.sign(dx) === wantSign ? "horizontal" : "vertical";
}

/** One arrow, used by both drawers.
 *
 *  Shaft and head live in a single svg sharing one coordinate system, so they
 *  are aligned by construction — an earlier version was a div and an svg held
 *  together by a negative margin, which is what produced the visible seam.
 *
 *  Growth scales the shaft from its left edge; a non-scaling stroke keeps the
 *  line 1px however far it stretches, and the head translates to the shaft's
 *  new end rather than being scaled, so it never distorts and never turns — it
 *  faces the way it travels, going out and coming back. */
function SkArrow({ className = "" }: { className?: string }) {
  return (
    <svg
      className={"sk-arrow " + className}
      viewBox="0 0 64 8"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line className="sk-arrow-shaft" x1="0" y1="4" x2="16" y2="4" vectorEffect="non-scaling-stroke" />
      <polyline className="sk-arrow-head" points="12.5,1 16,4 12.5,7" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

/** One glyph renderer for the contact panel — SVG path, or the phone mask the
 *  header and the Start Your Story section already share.
 *
 *  The three glyphs are not the same width by design: the phone is a raster mask
 *  with its own padding and needs a few more pixels to look the same size as the
 *  two vector ones. Left to themselves they pushed their labels to three
 *  different x positions, so callers wrap this in a fixed square (.cg-ico) that
 *  centres whatever it is given — uniform column, unchanged optical weight. */
function ContactGlyph({
  path, mask, className, evenOdd,
}: { path?: string; mask?: boolean; className: string; evenOdd?: boolean }) {
  if (mask) {
    return (
      <span
        className={className + " contact-glyph-mask"}
        style={{ WebkitMaskImage: `url(${phoneIconUrl})`, maskImage: `url(${phoneIconUrl})` }}
        aria-hidden="true"
      />
    );
  }
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d={path} {...(evenOdd ? { fillRule: "evenodd" as const, clipRule: "evenodd" as const } : {})} />
    </svg>
  );
}

/* ---- The three drawn icons sit INSIDE their 18px box ----
   Search, Contact and Bag are each one 18px drawing in a 24 viewBox at a 2px
   stroke, whole glyph included — handle, tail and all. They were briefly
   redrawn to size their bodies against the burger's 16px bar block instead,
   which meant scaling each drawing up until its lens/bubble/bag reached 16px
   and letting the protruding parts run outside the box. It made every mark
   individually better matched to the burger and the row collectively heavier:
   four glyphs overflowing their boxes put visibly more ink across a bar whose
   height had not changed, and the header read thicker for it.
   Back to the approved drawings. The burger is the only icon still sized to
   its own block, and that is deliberate — leave it alone. */
/* ================= THE SHARED OPTICAL BAND =================
   The three drawn marks are measured against ONE horizontal band, stated in
   viewBox units and true of the INK — the drawn line including its stroke, not
   the geometric path and not the box around it:

       ink top y=4     ink bottom y=20     16 units = exactly 12.00px at 18px

   The band is centred on y=12, which is the centre of the 24-unit box and
   therefore the centre of the button, so the burger's own block sits on it too
   and all four marks share one pair of guides.

   ---- what was wrong before ----
   The previous pass equalised the three body HEIGHTS and stopped there, which
   is only half of "sharing guides". All three measured 12.00px, but the bag
   body sat at ink 7..23 against the lens and bubble at 3..19 — three whole
   units, 2.25px, lower than everything beside it, and 2.25px below the burger.
   That offset is what the eye was reading as the bag being bigger and the
   search being small: they were not the same size and different, they were the
   same size and misaligned.

   ---- the binding constraint, and what it costs ----
   The bag's handle is the reason this is not simply "move the bag up". At its
   old size the handle rose 6.2u above the body; put the body on a centred 16u
   band and the handle lands at y=-2.2, outside the box. Letting it overflow is
   what made the header read heavy once before and was reverted, so the handle
   is the thing that gives: a 3.4u arch, springing off the body's own top edge,
   which fits with 0.6u to spare. It is smaller, and deliberately so — the bag
   was the heaviest mark in the row and had to lose weight somewhere.

   ---- perceived stroke, which is not numeric stroke ----
   Equal stroke-width does not render as equal weight, because weight is ink
   across the eye's path and the four marks put down very different amounts of
   it. Measured as stroke x drawn length, at a flat 2 units the row ran
   lens 99 : menu 104 : bubble 116 : bag 144 — the bag half again as heavy as
   the lens, which is exactly the order the eye reported. The strokes are now
   trimmed against that, lens up and bag down, all within 6% of 1.5px so no
   individual line looks unlike its neighbours:

       lens 1.80u (1.350px) · bubble 1.83u (1.373px) · bag 1.82u (1.365px)
       burger 1.35px

   Because the ink band is fixed, each shape's geometry is derived FROM its
   stroke rather than the other way round — a thicker line means a slightly
   smaller radius, so the ink still lands on 4 and 20.

   ---- the final optical pass ----
   Those weights were then judged the only way they can honestly be judged: by
   rasterising the real glyphs at their true 18px and magnifying THOSE pixels,
   rather than by looking at a large clean redraw. At that size the arithmetic
   and the eye disagreed. Measured as stroke x drawn length the bubble and the
   bag both carried plenty of ink, because both have more outline than a bare
   circle — but the eye does not add up outline, it reads LINE THICKNESS, and
   on those two the line was landing thinner and paler than the lens's.
   So the last correction is to thickness alone:
       bubble 2.00u -> 2.08u   (its ring carried 88.0 u2 against the lens's
                                91.7 — a 4% deficit on the one element the two
                                are directly compared by, side by side across
                                the header. Now 90.9, level with it.)
       bag    1.85u -> 1.95u   (palest line in the row at real size. Raised
                                toward, but deliberately still under, the lens:
                                the bag's outline is half as long again, so
                                matching thickness outright would bring back
                                the heaviness this whole exercise removed.)
       burger 13.5px -> 13.0px wide, thickness untouched (see the stylesheet).
   Every one of these is a stroke change. No body moved, no diameter changed,
   no angle changed: the centrelines shift by hundredths of a unit purely so
   the INK stays on 4.00 and 20.00, which is what the guides are.

   ---- and then finer still ----
   The weights above were a balancing exercise; this last pass is a decision
   about the house's own line. At 1.5px the row was correct but upholstered —
   the weight of a utility bar rather than of a jeweller's mark. The whole
   family now sits near 1.35px: fine, even, and drawn as one hand.

   The three drawn marks came down together and were re-matched at the new
   weight rather than scaled by a common factor, because the optical penalties
   are not proportional. The measured relationship between the nominal stroke
   and what actually lands on screen at 18px differs per shape — a small ring
   returns ~0.995 of its nominal, the bubble ~0.988, the bag's long straights
   and corners only ~0.971 — so equal numbers would NOT have produced equal
   lines. Hence 1.80 / 1.83 / 1.82: three different numbers chosen to arrive
   at the same place.

   The burger is the one that must stay under the rest. Three uninterrupted
   bars have no counter-space to lighten them, so at equal measured thickness
   they read heaviest; 1.35px against the drawn marks' ~1.34-1.36 measured is
   what makes the four sit level. Its width, its +/-5.3px offsets and all
   three bar centres are untouched — only the bars' thickness changes.

   Nothing here sets a height: the svgs are a fixed 18x18 in a fixed
   --icon-size box, so the header, its background and its padding are
   untouched. */
function IconSearch() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {/* r 7.10 with a 1.8 stroke puts the ink on 4.00 and 20.00 exactly.
          The DRAWN circle is the same circle it has always been: its outer
          edge sits on 4.00 and 20.00 vertically and 3.00 and 19.00
          horizontally, to the same five decimals as before. Only the
          centreline moved outward, by exactly half of what came off the
          stroke — which is the arithmetic of thinning a line while holding
          its outer edge still, not a resize. Radius and stroke are two halves
          of one number here; neither can be read on its own. */}
      <circle cx="11" cy="12" r="7.1" />
      {/* 30° below the horizontal — 4:00 on a clock face.
          Three angles were rendered at the real 18px size and compared: at 25°
          the handle still reads flat, at 27.5° it is acceptable, at 30° it
          reads unmistakably as a magnifier — long enough and diagonal enough
          to be a grip rather than a spout. The 18° version this replaces was
          the real complaint: near-horizontal, it stopped looking attached to
          the lens and started looking like a tail.
          Both ends are computed on the ring's own centre (11,12), so the
          handle is collinear with it however the angle is retuned: the near end
          at radius 6.85 seats inside the stroke rather than showing a seam, the
          far end at 13.6 puts the round cap at x 23.83 — inside the 24-unit box
          with nothing overflowing. */}
      <line x1="16.93" y1="15.43" x2="22.78" y2="18.80" />
    </svg>
  );
}

/** Drawn to exactly the search icon's spec — 18px in a 24 viewBox, 2px stroke,
 *  round caps and joins — so the two sides of the header carry the same line.
 *  The three dots are zero-length strokes rather than filled circles: with a
 *  round linecap they render as perfect dots at precisely the stroke's own
 *  weight, so they can never drift from the bubble they sit in. */
function IconChatBubble() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {/* The drawing is untouched; it is simply held at a smaller size and in
          a different place.
          The original is an 8.5-unit ring centred on (12.5,11.5) — 19 units of
          outer body, the tallest mark in the header. Scaled by 14/17 it becomes
          a 7-unit ring, and re-centred on (11,12) its ink lands on 4.00 and
          20.00: the band, and the same circle the lens draws. Doing it as a
          transform rather than by redrawing the path keeps the tail's curve,
          the dots' spacing and the ring's join in the proportions they were
          drawn in — every relationship inside the glyph survives, only its size
          and position change.
          stroke-width is pre-divided by the same factor so the RENDERED line is
          still 2 units — a scaled group would otherwise thin its stroke to 1.65
          and the bubble would go quietly lighter than the marks beside it. The
          dots are zero-length strokes, so they follow the stroke and stay
          exactly one line-weight across, as drawn.
          The tail reaches y≈19.8, a little under the body where a tail belongs,
          and well clear of the viewBox floor. */}
      {/* The scale and the stroke-width move together, and only because the
          two of them are what set the line's thickness AND where its outer
          edge falls. Rendered stroke 1.83u with the ring at 7.085u is the same
          ink band to five decimal places — 12 ± 8.00, body width 16.00 — drawn
          with a finer line. strokeWidth is the rendered weight divided by the
          scale, because a scaled group scales its stroke with everything else.
          The shape, the tail, the dots and their spacing are all carried by
          the transform exactly as drawn; nothing inside the glyph is redrawn
          or re-proportioned. */}
      <g transform="translate(11 12) scale(0.8335294) translate(-12.5 -11.5)" strokeWidth="2.1954657">
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
        <path d="M8.5 11.5h.01M12.5 11.5h.01M16.5 11.5h.01" />
      </g>
    </svg>
  );
}

/** The bag was the one solid glyph in a row of outlines, which is why it read
 *  heavier than everything beside it. Redrawn to the same spec as the search and
 *  chat icons — 18px in a 24 viewBox, 2px stroke, round caps and joins — keeping
 *  the original silhouette: an arched handle over a body that flares out towards
 *  the base. */
function IconBag() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.82" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {/* Body on the band. With a 1.82 stroke the centreline runs 4.91 to
          19.09, which puts the INK on 4.00 and 20.00 — the same two guides the
          lens and the bubble are drawn to. It used to sit at 7..23, three units
          low, which is the whole of why this mark read as the odd one out.
          The silhouette is unchanged: same 15.2-unit top edge, same flare out
          to the base, same 1.7 corner radius. The centreline tracks the stroke
          so the outer edge stays on 4.00 and 20.00 — the drawn box the eye
          sees is identical whatever the line weight. */}
      <path d="M4.4 4.91H19.6L20.8 17.39a1.7 1.7 0 0 1-1.7 1.7H4.9a1.7 1.7 0 0 1-1.7-1.7Z" />
      {/* The handle is what pays for the body's new position. A 4.4-unit arch
          on a body raised to the band would reach y=-2.2 and hang outside the
          viewBox; letting glyphs overflow their boxes is exactly what made this
          header read heavy once before. So it is a 3.4-unit arch springing off
          the body's own top edge — ink top 0.600, clear of the box — which also
          takes weight off the mark that was carrying the most of it. Its radius
          and span are untouched by the stroke change; it simply stays attached
          to the top edge, and its own ink top is unmoved — the arc springs
          from bodyTop − 3.4 and is drawn with half the stroke on either side,
          so its ink top is 0.600 for ANY stroke weight. That invariance is
          why the handle needs no attention when the line is refined. */}
      <path d="M8.6 4.91a3.4 3.4 0 0 1 6.8 0" />
    </svg>
  );
}

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  // Nothing is open when the panel arrives. The three words are the whole offer;
  // the glyph, the line and the actions are what opening one gives you. One at
  // a time, so the panel stays short.
  const [openContact, setOpenContact] = useState<string | null>(null);
  // ---- Drill-down motion system ----
  // One level on screen at a time, and the chosen row is the thread between
  // them: it does not slide away with a panel, it TRAVELS — siblings fade, the
  // label rises into the breadcrumb and takes its place on the path, and only
  // then does the next level arrive beneath it. Going back runs the same film
  // in reverse: the level folds up, the crumb steps down off the path into its
  // old place in the list, and its siblings return around it.
  //
  // `path` is where the user is (["Jewelry"], ["Jewelry","Rings"], …); `phase`
  // is where the film is. Every transition walks: focus → promote → reveal
  // going down, collapse → demote → reveal coming back. The ghost is the
  // travelling label itself — a fixed-position clone animated between the
  // measured start and end rects, so the motion is real geometry, not a guess.
  type NavPhase =
    | "idle"
    | "fwd-focus" | "fwd-promote" | "back-demote";
  const [path, setPath] = useState<string[]>([]);
  const [phase, setPhase] = useState<NavPhase>("idle");
  const [chosen, setChosen] = useState<string | null>(null);
  const [backTarget, setBackTarget] = useState<number | null>(null);
  // The travelling label is ONE object for the whole journey: a fixed-position
  // container that never fades, carrying the label in both its costumes — the
  // typography it left in and the typography it must arrive in, each cloned
  // from the real elements' computed styles so start and end are pixel-exact.
  //
  // The two directions place the costume change at different moments, because
  // the eye is not equally able to see it at both:
  //
  //   Going up, the change rides the final stretch of the flight and lands as
  //   the label reaches the breadcrumb. That reads well and is left alone.
  //
  //   Coming down, it cannot: the label would fly the whole way in capitals
  //   and flip once it had already arrived, which is the one moment the eye is
  //   locked onto it. So the change happens AT THE CLICK, in place, while the
  //   label is still sitting in the breadcrumb at its small size — capitals to
  //   lowercase, sans to serif, gold to ivory, all before anything moves. Only
  //   then does it travel, and the only thing that changes in flight is size:
  //   the small lowercase word grows into the row it is returning to. Size is
  //   continuous motion and reads as approach; the letterforms are the
  //   discontinuity, and they are spent under the click.
  const [ghost, setGhost] = useState<{
    label: string;
    kind: "fwd" | "back";
    from: DOMRect; to: DOMRect;
    fromStyle: CSSProperties; toStyle: CSSProperties;
  } | null>(null);
  // The level being left behind, kept mounted so it can travel off screen
  // alongside the one arriving. `slideOn` is the second frame — the panels are
  // painted at their starting offsets first, then released together.
  const [slide, setSlide] = useState<{ dir: "fwd" | "back"; rows: NavRow[] } | null>(null);
  const [slideOn, setSlideOn] = useState(false);
  const rowRefs = useRef(new Map<string, HTMLElement>());
  const crumbRefs = useRef(new Map<number, HTMLElement>());
  const levelViewportRef = useRef<HTMLDivElement | null>(null);
  const levelRef = useRef<HTMLElement | null>(null);
  const pendingFrom = useRef<DOMRect | null>(null);
  const pendingStyle = useRef<CSSProperties | null>(null);
  const navTimers = useRef<number[]>([]);
  const reduceMotion = useRef(false);
  useEffect(() => {
    reduceMotion.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  // Everything the eye reads as "the typography" of a label, lifted off the
  // live element. Cloning rather than restating means the ghost cannot drift
  // out of sync with the real styles it must hand over to.
  const grabTypo = (el: Element): CSSProperties => {
    const cs = window.getComputedStyle(el);
    return {
      fontFamily: cs.fontFamily, fontSize: cs.fontSize, fontWeight: cs.fontWeight,
      fontStyle: cs.fontStyle, letterSpacing: cs.letterSpacing,
      textTransform: cs.textTransform as CSSProperties["textTransform"],
      lineHeight: cs.lineHeight, color: cs.color,
    };
  };

  // The score the whole film is timed to. Deliberately unhurried: the fade,
  // the travel and the arrival read as three beats, not one gesture.
  const FOCUS_MS = 260;   // siblings cool and step back
  const GHOST_MS = 520;   // the label travels up, and the levels swipe across
  // The return is deliberately lighter than the departure: the label travels
  // in less time, and the two panels swipe in exactly the same span so the
  // whole return lands on one frame — one movement, not three.
  const BACK_MS = 440;

  /* ---- Direction lock ----
     One question, asked once per gesture, by every swipe in this file:
     "is this horizontal, vertical, or too early to say?"

     It replaces a test that got both halves wrong, and cost the menu its
     manners on a phone:

     1. The old gate fired as soon as EITHER axis passed 8px. A finger does not
        set off in a straight line — it leaves on a small arc — so a swipe that
        was about to travel 300px straight up could cross the gate at a moment
        when it had moved 9px sideways and only 6px up, and be locked
        horizontal on that evidence. The panel then sat visibly dragged for the
        whole of a gesture the user meant as a scroll. Deciding on RADIAL
        distance instead means the vote is always taken after the same amount
        of real travel, by which point the direction is actually expressed.

     2. The old test was a bare `|dx| > |dy|`, so a 46° diagonal counted as
        horizontal — near enough a coin toss deciding whether the menu closed.
        Horizontal now has to WIN, not merely tie: DOMINANCE of 1.6 asks for
        about 32° either side of the horizontal, which is comfortably wider
        than any deliberate sideways swipe and comfortably clear of anything
        meant as a scroll.

     Neither number is a "make the threshold huge" workaround: 12px is smaller
     than the browser's own scroll slop, and a genuine sideways swipe is claimed
     just as early as it always was. What changed is WHEN the question is asked
     and how convincingly it has to be answered. */
  // ---- Swipe to dismiss ----
  // The drawer came in from the left edge, so it should be returnable the same
  // way. It tracks the finger exactly while the gesture is live, and on release
  // either completes the journey it was already most of the way through or
  // falls back open. Distance OR speed decides: a short, quick flick is as
  // clear an instruction as a long, slow drag, and requiring both would make
  // the fast one feel ignored.
  const [dragX, setDragX] = useState<number | null>(null);
  const drawerRef = useRef<HTMLElement | null>(null);
  const drag = useRef({ x0: 0, y0: 0, dx: 0, t0: 0, live: false, decided: false });
  const DISMISS_FRACTION = 0.3;  // of the drawer's own width
  const DISMISS_VELOCITY = 0.45; // px per ms

  /* ---- Is a finger currently on this drawer? ----
     Nothing to do with dragging it. This exists solely to tell the scroll
     handler further down whether the page moved because the USER scrolled the
     page, or because a gesture on this panel scroll-chained into it. See the
     long note there; it is the difference between this panel and the contact
     one, and it is what was sliding the menu away on a vertical swipe.

     The settle deadline covers the tail: Android keeps delivering scroll
     events for the best part of a second after the finger leaves, and that
     inertia belongs to the gesture that started it, not to a new intention. */
  const drawerTouchRef = useRef(false);
  const drawerSettleRef = useRef(0);
  const DRAWER_SETTLE_MS = 900;

  const onDrawerTouchStart = (e: React.TouchEvent) => {
    if (!menuOpen) return;
    drawerTouchRef.current = true;
    const t = e.touches[0];
    drag.current = { x0: t.clientX, y0: t.clientY, dx: 0, t0: performance.now(), live: true, decided: false };
  };
  const onDrawerTouchMove = (e: React.TouchEvent) => {
    const d = drag.current;
    if (!d.live) return;
    const t = e.touches[0];
    const dx = t.clientX - d.x0;
    const dy = t.clientY - d.y0;
    // Which gesture this is gets decided once, and is not revisited —
    // otherwise a diagonal drag flickers between scrolling the panel and
    // dragging it. Nothing moves before the lock: while the answer is
    // "pending" this returns without touching dragX, so a gesture that turns
    // out to be vertical never displaces the panel by even a pixel.
    if (!d.decided) {
      const axis = decideAxis(dx, dy, -1); // closing this drawer means leftward
      if (axis === "pending") return;
      d.decided = true;
      if (axis === "vertical") { d.live = false; return; } // it's a scroll
    }
    // Rightward pull is resisted entirely: the drawer is already home.
    d.dx = Math.min(0, dx);
    setDragX(d.dx);
  };
  const onDrawerTouchEnd = () => {
    // Cleared before anything else can return early — a gesture that was
    // classified vertical exits above, and that is exactly the gesture whose
    // trailing scroll must still be attributed to this panel.
    drawerTouchRef.current = false;
    drawerSettleRef.current = performance.now() + DRAWER_SETTLE_MS;
    const d = drag.current;
    if (!d.live) { setDragX(null); return; }
    d.live = false;
    const width = drawerRef.current?.offsetWidth || 320;
    const speed = Math.abs(d.dx) / Math.max(performance.now() - d.t0, 1);
    setDragX(null);
    if (Math.abs(d.dx) > width * DISMISS_FRACTION || speed > DISMISS_VELOCITY) setMenuOpen(false);
  };

  // The contact drawer opens from the right, so its own gesture is the same
  // one mirrored: pull rightward (positive dx) to send it home, resist a
  // leftward pull the same way the nav drawer resists a rightward one. Same
  // thresholds, same follow-the-finger tracking — one interaction, two edges.
  const [contactDragX, setContactDragX] = useState<number | null>(null);
  const contactDrawerRef = useRef<HTMLElement | null>(null);
  const contactDrag = useRef({ x0: 0, y0: 0, dx: 0, t0: 0, live: false, decided: false });

  const onContactTouchStart = (e: React.TouchEvent) => {
    if (!contactOpen) return;
    const t = e.touches[0];
    contactDrag.current = { x0: t.clientX, y0: t.clientY, dx: 0, t0: performance.now(), live: true, decided: false };
  };
  const onContactTouchMove = (e: React.TouchEvent) => {
    const d = contactDrag.current;
    if (!d.live) return;
    const t = e.touches[0];
    const dx = t.clientX - d.x0;
    const dy = t.clientY - d.y0;
    // Identical arbitration to the nav drawer, mirrored — this panel had the
    // same bug for the same reason, and one shared rule is what keeps the two
    // edges feeling like one interaction.
    if (!d.decided) {
      const axis = decideAxis(dx, dy, 1); // closing this drawer means rightward
      if (axis === "pending") return;
      d.decided = true;
      if (axis === "vertical") { d.live = false; return; } // it's a scroll
    }
    // Leftward pull is resisted entirely: the drawer is already home.
    d.dx = Math.max(0, dx);
    setContactDragX(d.dx);
  };
  const onContactTouchEnd = () => {
    const d = contactDrag.current;
    if (!d.live) { setContactDragX(null); return; }
    d.live = false;
    const width = contactDrawerRef.current?.offsetWidth || 320;
    const speed = Math.abs(d.dx) / Math.max(performance.now() - d.t0, 1);
    setContactDragX(null);
    if (Math.abs(d.dx) > width * DISMISS_FRACTION || speed > DISMISS_VELOCITY) setContactOpen(false);
  };

  /* ---- Swipe to OPEN, from either edge ----
     The mirror of the dismiss gesture above, and deliberately built out of the
     same parts rather than beside them: an opening drawer is simply one that is
     already `.open` and `.dragging`, held at a negative offset by the very same
     `dragX` the close gesture uses. Progress therefore drives the panel, the
     scrim and the shadow through exactly the code that already exists, the two
     halves of the interaction cannot drift apart, and releasing at 60% feels
     identical whichever direction you were going.

     One listener on the document, one gesture model, and every decision made
     once. The alternative — a touchstart handler per edge — is how you end up
     with two drawers half-open at the same time.

     Everything below is phone-only and closed-state-only. */
  const contactOpenRef = useRef(contactOpen);
  contactOpenRef.current = contactOpen;
  const searchOpenRef = useRef(searchOpen);
  searchOpenRef.current = searchOpen;

  useEffect(() => {
    const EDGE = 22;        // px of screen edge that starts a drawer
    const mq = window.matchMedia("(max-width:760px)");

    // `side` is null until an edge press is seen, and `claimed` until the
    // movement has proved itself horizontal. Between those two the gesture
    // belongs to nobody and the page scrolls normally.
    let side: "left" | "right" | null = null;
    let x0 = 0, y0 = 0, t0 = 0, width = 320;
    let decided = false, claimed = false, dist = 0;

    const reset = () => { side = null; decided = false; claimed = false; dist = 0; };

    const onStart = (e: TouchEvent) => {
      reset();
      if (!mq.matches || e.touches.length !== 1) return;
      // Drawers never compete. If either is up, or search is, the edges are
      // not listening — the open panel's own dismiss gesture owns the screen.
      if (menuOpenRef.current || contactOpenRef.current || searchOpenRef.current) return;
      const t = e.touches[0];
      const target = e.target as HTMLElement | null;
      /* The David C. Stanton Collection scrolls sideways, and on a phone its
         first card sits against the left edge — so the gesture that browses the
         collection is, geometrically, the gesture that opens the menu. The
         carousel wins outright wherever the finger STARTS inside it. Origin,
         not visibility: the section merely being on screen must not disable the
         edges, or the drawers would be unreachable for a whole screenful of
         page. Closing a drawer by swiping is unaffected — that gesture starts
         on the drawer, which is above all of this. */
      if (target?.closest?.(".col-grid")) return;
      if (t.clientX <= EDGE) side = "left";
      else if (t.clientX >= window.innerWidth - EDGE) side = "right";
      else return;
      x0 = t.clientX; y0 = t.clientY; t0 = performance.now();
      width =
        (side === "left" ? drawerRef.current?.offsetWidth : contactDrawerRef.current?.offsetWidth) || 320;
    };

    const onMove = (e: TouchEvent) => {
      if (!side) return;
      const t = e.touches[0];
      const dx = t.clientX - x0;
      const dy = t.clientY - y0;
      if (!decided) {
        /* The same direction lock the close gesture uses, and for the same
           reason: a page scroll that happens to begin within 22px of the screen
           edge must never be mistaken for a drawer being pulled out — once
           claimed, this handler calls preventDefault and the scroll is dead.
           `wantSign` encodes "inward from the edge you started at": rightward
           from the left edge, leftward from the right. */
        const axis = decideAxis(dx, dy, side === "left" ? 1 : -1);
        if (axis === "pending") return;
        decided = true;
        if (axis === "vertical") { reset(); return; }
        claimed = true;
        if (side === "left") setMenuOpen(true);
        else setContactOpen(true);
      }
      if (!claimed) return;
      // Once claimed, the page must not also scroll underneath the drawer.
      if (e.cancelable) e.preventDefault();
      dist = Math.min(Math.max(side === "left" ? dx : -dx, 0), width);
      // Held short of home by however much of the journey is left, so the panel
      // is under the finger from the first frame rather than animating to it.
      if (side === "left") setDragX(-(width - dist));
      else setContactDragX(width - dist);
    };

    const onEnd = () => {
      if (!side || !claimed) { reset(); return; }
      const speed = dist / Math.max(performance.now() - t0, 1);
      const finish = dist > width * DISMISS_FRACTION || speed > DISMISS_VELOCITY;
      const which = side;
      reset();
      // Dropping the offset hands the panel back to its CSS transition, which
      // carries it the rest of the way home — or back off the edge.
      if (which === "left") { setDragX(null); if (!finish) setMenuOpen(false); }
      else { setContactDragX(null); if (!finish) setContactOpen(false); }
    };

    // Non-passive: claiming the gesture means preventing the page scroll, and a
    // passive listener is not allowed to.
    document.addEventListener("touchstart", onStart, { passive: true });
    document.addEventListener("touchmove", onMove, { passive: false });
    document.addEventListener("touchend", onEnd);
    document.addEventListener("touchcancel", onEnd);
    return () => {
      document.removeEventListener("touchstart", onStart);
      document.removeEventListener("touchmove", onMove);
      document.removeEventListener("touchend", onEnd);
      document.removeEventListener("touchcancel", onEnd);
    };
  }, []);

  // Both panels are painted at their starting offsets for one frame, then let
  // go on the next — the same two-frame handshake the ghost uses, so the swipe
  // and the travelling label begin on exactly the same tick.
  const releaseSlide = () => {
    requestAnimationFrame(() => requestAnimationFrame(() => setSlideOn(true)));
  };

  const later = (fn: () => void, ms: number) => {
    navTimers.current.push(window.setTimeout(fn, ms));
  };
  const clearNavTimers = () => {
    navTimers.current.forEach((t) => window.clearTimeout(t));
    navTimers.current = [];
  };
  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Where the page was when the menu was opened. The menu closes on scroll,
  // but only relative to this mark — never relative to the previous scroll
  // event. Closing on any 8px delta meant that on a phone the momentum still
  // decaying after your finger lifted counted as "the user scrolled", so a tap
  // landing mid-glide opened the menu and the leftover inertia shut it again
  // before it could paint. Further down the page there is almost always some
  // residual scrolling, which is exactly why it failed there and not at the top.
  const menuOpenAtYRef = useRef(0);
  const menuOpenRef = useRef(false);
  const MENU_SCROLL_DISMISS = 90; // px of deliberate scrolling that closes it

  useEffect(() => {
    menuOpenRef.current = menuOpen;
    if (menuOpen) menuOpenAtYRef.current = window.scrollY;
  }, [menuOpen]);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      // Only turn the header white once we've scrolled past the hero track
      // (into the next section). While panning through the hero, keep it transparent.
      //
      // Pages with no hero — the collection pages and a piece page — get the
      // white bar immediately. The transparency exists so the header can sit
      // over the hero's dark photography; over an ivory catalogue it renders as
      // a dark gradient smeared across the top of the page, and the wordmark
      // goes pale-on-pale until you scroll 60px for no reason.
      const track = document.querySelector(".hero-track") as HTMLElement | null;
      const threshold = track
        ? track.offsetTop + track.offsetHeight - window.innerHeight - 20
        : -1;
      setScrolled(y > threshold);
      /* ---- and the menu's own scroll dismissal ----
         This rule is the whole reason the LEFT panel behaved differently from
         the right one, and the difference was never in the gesture code: the
         two touch handlers are mirror images and both refuse a vertical swipe
         correctly. There is simply no scroll dismissal on the contact panel,
         so nothing there could go wrong.

         What was happening: .nav-drawer is `overflow-y:auto; touch-action:pan-y`,
         so a vertical swipe on it pans the drawer — and the drawer's five rows
         fit on a phone with nothing to scroll, so the pan chains straight into
         the document behind the scrim. Ninety pixels later this line fired and
         the menu was dismissed. The panel then slid horizontally off screen,
         which reads exactly like a drag but is nothing of the kind: it is the
         close animation. That is why it left no drag frames to catch, and why
         the synthetic gesture tests kept passing — they move a finger, they do
         not move the page.

         So the fix belongs here rather than in the gesture. Scrolling that a
         gesture ON THIS PANEL caused is not the user asking for the menu to go
         away; it re-baselines the mark instead, so the run of scrolling the
         drawer produced never counts toward dismissal and the counter simply
         restarts from wherever the page came to rest. A deliberate scroll that
         does not begin on the drawer — on the scrim, say — still dismisses it
         exactly as before, which is what this rule was written for. */
      if (menuOpenRef.current) {
        const fromDrawer =
          drawerTouchRef.current || performance.now() < drawerSettleRef.current;
        if (fromDrawer) menuOpenAtYRef.current = y;
        else if (Math.abs(y - menuOpenAtYRef.current) > MENU_SCROLL_DISMISS) {
          setMenuOpen(false);
        }
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);


  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSearchOpen(false);
        setContactOpen(false);
        setMenuOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (searchOpen) setTimeout(() => inputRef.current?.focus(), 350);
    else setQ("");
  }, [searchOpen]);

  /* Nothing until something is typed. Search used to render the entire index
     the moment it opened, which made it a second copy of the menu — the panel
     answered "what is on this site?" when the question it exists to answer is
     "where is this one thing?".

     The matching itself is no longer here. It is one weighted, typo-tolerant
     pass over a structured index in src/lib/search.ts, which is also where the
     ranking is explained and where products will join when the catalogue opens.
     Entirely local, so this still runs on every keystroke with nothing going
     over the wire. */
  const matches = useMemo(() => searchSite(q, 8).map((h) => h.record), [q]);

  const navigate = useNavigate();

  const go = (anchor: string) => {
    setSearchOpen(false);
    setMenuOpen(false);
    setContactOpen(false);
    document.querySelector(anchor)?.scrollIntoView({ behavior: "smooth" });
  };

  /* Where a result actually goes.
     Three kinds of destination, and the difference between them is the whole
     upgrade. A collection is a PAGE — navigated to by its canonical route, so
     "engagement" lands on /collection/rings/engagement with the selection
     already made, and that address can be refreshed, bookmarked and sent to
     someone. A question is a specific question, not the section it lives in:
     its permanent id travels in the URL hash so a refresh reopens the same one.
     A page section is the only thing still reached by an anchor, because that
     is genuinely what it is. */
  const goResult = (r: SearchRecord) => {
    setSearchOpen(false);
    setMenuOpen(false);
    setContactOpen(false);
    const d = r.dest;
    if (d.route !== "/") {
      navigate({ to: d.route, search: d.search ?? {} });
      return;
    }
    const hash = d.faqId ? `faq-${d.faqId}` : (d.hash ?? "").replace(/^#/, "");
    if (pathname !== "/") {
      navigate({ to: "/", hash: hash || undefined });
      return;
    }
    /* Already home. The hash is still written, so the address bar and a
       refresh agree with what the page just did — but the page is told
       directly as well, because navigating to the hash you are already on is
       not a change and would fire nothing. The home page listens for both. */
    if (hash) navigate({ to: "/", hash });
    if (d.faqId) {
      window.dispatchEvent(new CustomEvent("sk:faq", { detail: d.faqId }));
    } else if (d.hash) {
      document.querySelector(d.hash)?.scrollIntoView({ behavior: "smooth" });
    }
  };

  /* The contact panel's "Before you ask." card, and the one thing on this site
     that opens the FAQ as a LIST rather than at a single answer.

     It goes through exactly the machinery a search result goes through — the
     same `/#faq` hash, the same `sk:faq` event, the same arrival routine on the
     home page — with the question id left off, which is what the home page
     reads as "the section". That is deliberate: a second scroller aimed at the
     same block would be a race, and this way a shared or refreshed `/#faq`
     lands in precisely the same place as a click does.

     It carries `detail: null`, so the list opens and nothing inside it is
     expanded on the visitor's behalf. Search results keep their exact-question
     behaviour untouched. */
  const goFaqSection = (e: React.MouseEvent) => {
    e.preventDefault();
    setSearchOpen(false);
    setMenuOpen(false);
    setContactOpen(false);
    if (pathname !== "/") {
      // Off the home page the hash is the whole instruction: the route mounts,
      // reads it, and arrives. No event needed — and none would be heard,
      // since the listener does not exist until the page is there.
      navigate({ to: "/", hash: "faq" });
      return;
    }
    navigate({ to: "/", hash: "faq" });
    window.dispatchEvent(new CustomEvent("sk:faq", { detail: null }));
  };

  // Which page the bar is currently sitting on. The wordmark is the one control
  // in the header whose right answer depends on that, and it is subscribed
  // narrowly to the pathname so a search-param change (?style=…) does not
  // re-render the whole header.
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // The wordmark means "home" everywhere, but "home" is two different actions.
  // It used to be one: scroll to #top — an element that exists only on the home
  // page, so from a collection or a piece the site's own logo did nothing at
  // all. Now it goes by where you are: already home, it takes you back up the
  // page; anywhere else, it takes you home.
  //
  // It is a real <Link to="/"> underneath, so it carries a genuine href — it can
  // be middle-clicked, opened in a new tab and read by a crawler as the link to
  // the site root, none of which "#top" ever was. The handler only intercepts
  // the plain left-click, and only to convert it into a scroll when there is
  // nowhere to navigate to.
  const goHome = (e: React.MouseEvent) => {
    setSearchOpen(false);
    setMenuOpen(false);
    setContactOpen(false);
    if (pathname !== "/") return; // let the Link navigate
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Open the catalogue at whatever depth the user stopped at. Anything left
  // unspecified simply is not in the path, so "View all Rings" is genuinely all
  // rings rather than a guess at a default type.
  //
  // This used to dispatch a custom event that the home page caught and rendered
  // in place. That kept the client on "/" with no URL to bookmark, share, or
  // send back to — a collection is a page, so it now navigates to one. Style is
  // the one level that stays a search param; see validateCollectionSearch.
  const goCatalog = (category?: string, type?: string, style?: string) => {
    setMenuOpen(false);
    navigate({
      to: collectionPath(category, type),
      search: style && style !== "Uniquely Yours" ? { style } : {},
    });
  };

  // Going deeper. The clicked row is remembered, its siblings are faded
  // (focus), its label's rect is measured while it still exists, and only then
  // does the path advance — the promote effect below picks it up from there.
  const drill = (label: string) => {
    if (phase !== "idle") return;
    if (reduceMotion.current) { setPath((p) => [...p, label]); return; }
    setChosen(label);
    setPhase("fwd-focus");
    later(() => {
      const row = rowRefs.current.get(label);
      const span = row?.querySelector(".nav-row-label");
      pendingFrom.current = span ? span.getBoundingClientRect() : null;
      pendingStyle.current = span ? grabTypo(span) : null;
      // Captured before the path moves: this is the list that will travel off
      // to the left while the new one comes in behind it.
      setSlide({ dir: "fwd", rows });
      setPath((p) => [...p, label]);
      setPhase("fwd-promote");
    }, FOCUS_MS);
  };

  // Coming back — to any earlier crumb, not just one step. The level fades
  // away as a group and the crumb fades where it stands; the path steps back
  // and the level beneath returns — no travelling label on this leg.
  const back = (targetLen: number) => {
    if (phase !== "idle" || targetLen < 0 || targetLen >= path.length) return;
    if (reduceMotion.current) { setPath((p) => p.slice(0, targetLen)); return; }
    // Everything is staged on the click. There is no fold-away beat any more:
    // the level being left has to still be on screen in order to slide off
    // it, and it leaves at the same moment the crumb fades and the level
    // beneath comes back in — one gesture, not three.
    setBackTarget(targetLen);
    setChosen(path[targetLen]);
    setSlide({ dir: "back", rows });
    setPath((p) => p.slice(0, targetLen));
    setPhase("back-demote");
  };


  // The travel itself. Runs before paint, on the first frame the destination
  // exists: measure where the label must land, launch the ghost between the
  // two rects, and book the remaining beats — arrival, then the staggered
  // reveal of the level it now heads.
  useLayoutEffect(() => {
    if (phase === "fwd-promote") {
      const li = crumbRefs.current.get(path.length - 1);
      const target = li?.querySelector(".nav-crumb");
      if (pendingFrom.current && pendingStyle.current && target) {
        setGhost({
          label: path[path.length - 1], kind: "fwd",
          from: pendingFrom.current, to: target.getBoundingClientRect(),
          fromStyle: pendingStyle.current, toStyle: grabTypo(target),
        });
      }
      // The hand-over must be a single commit: the ghost leaves and the real
      // crumb becomes visible in the same frame, on the same pixels — there is
      // no cross-fade between them because there is nothing to cross-fade; by
      // now the ghost IS the crumb, typographically and geometrically.
      releaseSlide();
      later(() => {
        setGhost(null); setPhase("idle"); setChosen(null);
        setSlide(null); setSlideOn(false);
      }, GHOST_MS);
    } else if (phase === "back-demote") {
      // No ghost on the way back: the crumb simply fades where it stands
      // (.nav-crumbs li.is-leaving) while the previous level's panel slides
      // back in underneath it. Flying the title back into the list read as
      // mechanical — the return should feel like the list just reappearing.
      releaseSlide();
      later(() => {
        setGhost(null); setPhase("idle"); setChosen(null); setBackTarget(null);
        setSlide(null); setSlideOn(false);
      }, BACK_MS);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // Reset the journey after the drawer has finished closing, so it never
  // animates backwards in front of the user on the way out.
  useEffect(() => {
    if (menuOpen) return;
    const t = window.setTimeout(() => {
      clearNavTimers();
      setPath([]); setPhase("idle"); setChosen(null); setGhost(null); setBackTarget(null);
      setSlide(null); setSlideOn(false);
    }, 450);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [menuOpen]);

  // The contact panel is anchored to the right edge at 88vw, which puts it under
  // anything else pinned to a corner — the concierge button in particular lands
  // squarely on the panel's closing line. A flag on <body> lets those elements
  // stand down for as long as the panel is up, without them having to know the
  // header exists.
  useEffect(() => {
    document.body.classList.toggle("contact-panel-open", contactOpen);
    return () => document.body.classList.remove("contact-panel-open");
  }, [contactOpen]);

  // Closing the panel forgets which route was open. Without this the accordion
  // held its last position, so leaving on Consult — including by taking the
  // booking link, which closes the panel behind you — meant Consult was still
  // hanging open the next time you opened it, and only clicking Consult a
  // second time would put it away. Reset after the slide-out has finished so
  // the rows do not visibly collapse on the way off screen.
  useEffect(() => {
    if (contactOpen) return;
    const t = window.setTimeout(() => setOpenContact(null), 450);
    return () => window.clearTimeout(t);
  }, [contactOpen]);

  // The level the path points at, as one flat list. Whatever the depth, a
  // level is the same four kinds of row — drill deeper, follow a link, choose
  // a style, or View All of where you stand — which is what lets one motion
  // system serve every level identically.
  type NavRow =
    | { key: string; label: string; kind: "drill" }
    | { key: string; label: string; kind: "link"; href: string }
    | { key: string; label: string; kind: "leaf"; className?: string }
    | { key: string; label: string; kind: "viewall" };
  const rows = useMemo<NavRow[]>(() => {
    if (path.length === 0) {
      return [
        { key: "Jewelry", label: "Jewelry", kind: "drill" },
        ...NAV_LINKS.map((l) => ({ key: l.href, label: l.label, kind: "link" as const, href: l.href })),
      ];
    }
    if (path.length === 1) {
      return [
        ...COLLECTION_TREE.map((c) => ({ key: c.name, label: c.name, kind: "drill" as const })),
        { key: "viewall", label: "View All Jewelry", kind: "viewall" },
      ];
    }
    if (path.length === 2) {
      const c = COLLECTION_TREE.find((x) => x.name === path[1]);
      return [
        ...(c?.types ?? []).map((t) => ({ key: t, label: t, kind: "drill" as const })),
        { key: "viewall", label: `View All ${path[1]}`, kind: "viewall" },
      ];
    }
    return [
      ...STYLES.map((s) => ({
        key: s, label: s, kind: "leaf" as const,
        className: s === "Uniquely Yours" ? "nav-yours" : undefined,
      })),
      { key: "viewall", label: `View All ${path[2]}`, kind: "viewall" },
    ];
  }, [path]);

  // One row, rendered the same wherever it appears — in the level you are on
  // or in the copy of the level you are leaving. `ghosted` hides a label the
  // travelling ghost is currently carrying; `chosen` is the one the focus
  // state keeps bright while its siblings step back.
  const renderNavRow = (r: NavRow, o: { chosen?: boolean; ghosted?: boolean } = {}) => {
    const cls = (o.chosen ? " chosen" : "") + (o.ghosted ? " ghosted" : "");
    if (r.kind === "link") {
      return (
        <a
          key={r.key}
          href={r.href}
          className={"nav-row" + cls}
          onClick={(e) => { e.preventDefault(); if (phase === "idle") go(r.href); }}
        >
          {r.label}
        </a>
      );
    }
    if (r.kind === "viewall") {
      return (
        <button key={r.key} type="button" className="nav-row nav-viewall" onClick={viewAllHere}>
          <span className="nav-viewall-label">{r.label}</span>
          <SkArrow />
        </button>
      );
    }
    if (r.kind === "leaf") {
      return (
        <button
          key={r.key}
          type="button"
          className={("nav-row " + (r.className ?? "")).trim() + cls}
          onClick={() => { if (phase === "idle") goCatalog(path[1], path[2], r.label); }}
        >
          {r.label}
        </button>
      );
    }
    return (
      <button
        key={r.key}
        type="button"
        ref={(el) => {
          // The live panel is rendered last, so on a collision it is the one
          // left registered. On unmount, only forget the row if the element
          // being torn down is still the one on file — otherwise the outgoing
          // copy would delete the live panel's entry on its way out.
          if (el) rowRefs.current.set(r.label, el);
          else if (!rowRefs.current.get(r.label)?.isConnected) rowRefs.current.delete(r.label);
        }}
        className={"nav-row nav-drawer-group" + cls}
        onClick={() => drill(r.label)}
      >
        {/* Wrapped so the ghost can be measured from the text alone, not the
            full-width row it sits in. */}
        <span className="nav-row-label">{r.label}</span>
        <span className="nav-drawer-chev" aria-hidden="true" />
      </button>
    );
  };

  // View All belongs to the level you are standing on: anything below your
  // position is passed as ANY, so View All Rings is genuinely all Rings.
  const viewAllHere = () => {
    if (phase !== "idle") return;
    if (path.length <= 1) goCatalog();
    else if (path.length === 2) goCatalog(path[1]);
    else goCatalog(path[1], path[2]);
  };

  return (
    <header
      id="header"
      className={
        (scrolled ? "scrolled" : "") +
        (contactOpen ? " contact-open" : "") +
        /* Drops the burger back out of its raised layer while the search panel
           is up — see the .burger z-index note in the stylesheet. */
        (searchOpen ? " search-open" : "")
      }
    >
      <nav className="nav">
        <div className="nav-zone nav-zone-left">
          {/* The three overlays are mutually exclusive. They used to be
              independent booleans, so opening search on top of an open menu
              left both mounted — and since the drawer is z-index 270 against
              the search overlay's 250, the menu simply covered the thing you
              had just asked for. */}
          <button
            className="icon-btn burger"
            aria-label="Menu"
            aria-expanded={menuOpen}
            onClick={() => { setMenuOpen((v) => !v); setSearchOpen(false); setContactOpen(false); }}
          >
            <span></span><span></span><span></span>
          </button>
          <button
            className="icon-btn"
            aria-label="Search"
            onClick={() => { setSearchOpen((v) => !v); setMenuOpen(false); setContactOpen(false); }}
          >
            <IconSearch />
          </button>
        </div>

        <Link to="/" className="brand" aria-label="Stanton Kingdom home" onClick={goHome}>
          <img
            className="brand-logo"
            src={wordmarkUrl}
            alt="Stanton Kingdom"
          />
        </Link>

        <div className="nav-zone nav-zone-right">
          <button
            className="icon-btn"
            aria-label="Contact"
            aria-expanded={contactOpen}
            onClick={() => { setContactOpen((v) => !v); setMenuOpen(false); setSearchOpen(false); }}
          >
            <IconChatBubble />
          </button>
          <button
            className="icon-btn"
            aria-label="Bag (coming soon)"
            onClick={() => { /* wired to Shopify later */ }}
          >
            <IconBag />
          </button>
        </div>
      </nav>

      <div className={"search-overlay" + (searchOpen ? " open" : "")}>
        <div className="search-box">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2">
            <circle cx="11" cy="11" r="7" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            placeholder="Search the Kingdom…"
            autoComplete="off"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <button className="search-close" aria-label="Close search" onClick={() => setSearchOpen(false)}>×</button>
        </div>
        {/* Three states, and the first one is the point: at rest the panel is
            just the field and a line of guidance. Results are only ever a
            response to something typed. */}
        {q.trim() === "" ? (
          <div className="search-hint">Rings, heritage, timings, shipping — anything at all.</div>
        ) : (
          <div className="search-results">
            {matches.length ? (
              matches.map((m) => (
                <button type="button" key={m.id} className="search-result" onClick={() => goResult(m)}>
                  <span className="search-result-label">{m.title}</span>
                  <span className="search-result-tag">{m.tag}</span>
                </button>
              ))
            ) : (
              <div className="search-empty">
                Nothing matched that. Try “rings”, “heritage” or “shipping” — or{" "}
                <a href={WHATSAPP_URL}>ask us on WhatsApp</a>.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation drawer — deliberately the mirror of the contact drawer on
          the right: same scrim, same easing, same close affordance, entering
          from the side its own button sits on. A full-screen takeover for five
          links was heavier than the content warranted and had no obvious way
          out; the scrim gives an unambiguous tap-anywhere-to-close. */}
      <div
        className={"nav-scrim" + (menuOpen ? " open" : "")}
        onClick={() => setMenuOpen(false)}
        // The ground behind lightens in step with the drag, so the gesture
        // feels like it is dismissing the whole overlay rather than sliding one
        // panel around on top of a fixed backdrop.
        style={
          dragX !== null
            ? { opacity: Math.max(0, 1 - Math.abs(dragX) / (drawerRef.current?.offsetWidth || 320)), transition: "none" }
            : undefined
        }
        aria-hidden="true"
      />
      <aside
        ref={drawerRef as React.RefObject<HTMLElement>}
        className={"nav-drawer" + (menuOpen ? " open" : "") + (dragX !== null ? " dragging" : "")}
        role="dialog"
        aria-label="Menu"
        aria-hidden={!menuOpen}
        onTouchStart={onDrawerTouchStart}
        onTouchMove={onDrawerTouchMove}
        onTouchEnd={onDrawerTouchEnd}
        onTouchCancel={onDrawerTouchEnd}
        style={dragX !== null ? { transform: `translateX(${dragX}px)` } : undefined}
      >
        {/* No close button of its own: the burger has become the x and is the
            control that closes this, so a second one beside it would be two
            affordances for one action. The head is padded clear of the header
            so that x stays visible and clickable above the panel. */}
        <div className="nav-drawer-head">
          {path.length === 0 ? (
            <span className="nav-drawer-eyebrow">Discover the Kingdom</span>
          ) : (
            /* The living breadcrumb. It is not an indicator that updates — it
               is where the labels physically arrive: each one you choose rises
               off the list and takes its place here, and steps back down when
               you return. Every crumb but the last is a way back. */
            <nav className="nav-crumbs" aria-label="Breadcrumb">
              <button
                type="button"
                className="nav-crumb-back"
                aria-label="Back"
                onClick={() => back(path.length - 1)}
              >
                <span className="nav-drawer-backchev" aria-hidden="true" />
              </button>
              <ol>
                {path.map((label, i) => {
                  const isCurrent = i === path.length - 1;
                  // Held invisible while its ghost is still travelling up.
                  // No fade of its own: it appears in the same commit the
                  // ghost leaves, on the same pixels, so the swap is not a
                  // visible event — the object simply comes to rest.
                  const arriving = phase === "fwd-promote" && isCurrent;
                  // Crumbs past the level being returned to leave with it.
                  const leaving = backTarget !== null && i > backTarget;
                  return (
                    <li
                      key={label}
                      ref={(el) => {
                        if (el) crumbRefs.current.set(i, el);
                        else crumbRefs.current.delete(i);
                      }}
                      className={
                        ((arriving ? "is-arriving " : "") + (leaving ? "is-leaving" : "")).trim() || undefined
                      }
                    >
                      {/* One node whatever its role, so stepping between
                          "where you are" (ivory) and "a way back" (gold) is a
                          colour that travels, not an element that changes. */}
                      <button
                        type="button"
                        className={"nav-crumb" + (isCurrent ? " is-current" : "")}
                        aria-current={isCurrent ? "page" : undefined}
                        onClick={() => { if (!isCurrent) back(i + 1); }}
                      >
                        {label}
                      </button>
                    </li>
                  );
                })}
              </ol>
            </nav>
          )}
        </div>

        {/* Two levels, moving as one gesture. The level you are leaving and the
            level you are entering are both mounted and both travel at the same
            time, so a step deeper reads as a single horizontal swipe rather
            than as one list dying and another being born. The viewport clips,
            which is what lets each panel be exactly one drawer wide and simply
            run off the edge. */}
        <div className="nav-level-viewport" ref={levelViewportRef}>
          {slide && (
            <nav
              className={"nav-drawer-links nav-level nav-panel-out is-" + slide.dir + (slideOn ? " go" : "")}
              aria-hidden="true"
            >
              {/* The row whose label the ghost is currently carrying must not
                  also appear here, or the word would be on screen twice. */}
              {slide.rows.map((r) =>
                renderNavRow(r, { ghosted: slide.dir === "fwd" && r.label === chosen })
              )}
            </nav>
          )}
          <nav
            ref={levelRef}
            className={
              "nav-drawer-links nav-level nav-panel-in" +
              (slide ? " is-" + slide.dir + (slideOn ? " go" : "") : "") +
              (phase === "fwd-focus" ? " focusing" : "")
            }
          >
            {rows.map((r) =>
              renderNavRow(r, {
                chosen: phase === "fwd-focus" && r.label === chosen,
              })
            )}
          </nav>
        </div>

        {/* The travelling label — one continuous object for the whole journey.
            The container moves and never fades; inside it the SAME label is
            set twice, in the typography it left in and the typography it must
            arrive in, both cloned from the live elements. The two renderings
            scale toward each other as it travels and resolve one into the
            other — generously overlapped, so there is no frame in which the
            word is absent. By arrival the object already IS the destination
            text, pixel for pixel, and the real element is shown in the same
            commit that removes it: rest, not replacement.

            Where in the journey that resolve happens is the one thing the two
            directions disagree on, and it is set in CSS: late on the way up,
            early on the way down. Both hide the change inside a moment the eye
            is doing something else. */}
        {ghost && (
          <span
            key={ghost.kind + ghost.label + ghost.from.top}
            className={"nav-ghost" + (ghost.kind === "back" ? " nav-ghost-b" : "")}
            style={{
              top: ghost.from.top,
              left: ghost.from.left,
              ["--gx" as string]: `${ghost.to.left - ghost.from.left}px`,
              ["--gy" as string]: `${ghost.to.top - ghost.from.top}px`,
              ["--gs-out" as string]: `${ghost.to.height / ghost.from.height}`,
              ["--gs-in" as string]: `${ghost.from.height / ghost.to.height}`,
            } as CSSProperties}
            ref={(el) => {
              if (!el) return;
              // Two frames: one to paint at the start rect, one to travel.
              requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add("travel")));
            }}
            aria-hidden="true"
          >
            <span className="nav-ghost-from" style={ghost.fromStyle}>{ghost.label}</span>
            <span className="nav-ghost-to" style={ghost.toStyle}>{ghost.label}</span>
          </span>
        )}

        {/* The same three words the contact section itself uses — Chat, Call,
            Consult — so the menu teaches one vocabulary rather than a second.
            Email is deliberately absent: it duplicates what Consult does while
            capturing none of what the enquiry form captures. */}
        {/* One way in, not three. The contact drawer behind the phone icon now
            carries Chat/Call/Consult in full, and the section on the page
            carries them again — a third copy here would be the same choice
            offered three times. This simply takes you to it. */}
        <div className="nav-drawer-foot">
          <a
            className="nav-drawer-begin"
            href="#begin"
            onClick={(e) => { e.preventDefault(); go("#begin"); }}
          >
            <span className="nav-drawer-begin-txt">Start Your Story</span>
            <SkArrow />
          </a>
        </div>
      </aside>

      {/* Contact drawer */}
      <div
        className={"contact-scrim" + (contactOpen ? " open" : "")}
        onClick={() => setContactOpen(false)}
        style={
          contactDragX !== null
            ? { opacity: Math.max(0, 1 - Math.abs(contactDragX) / (contactDrawerRef.current?.offsetWidth || 320)), transition: "none" }
            : undefined
        }
        aria-hidden="true"
      />
      <aside
        ref={contactDrawerRef as React.RefObject<HTMLElement>}
        className={"contact-drawer" + (contactOpen ? " open" : "") + (contactDragX !== null ? " dragging" : "")}
        role="dialog"
        aria-label="Contact"
        aria-hidden={!contactOpen}
        onTouchStart={onContactTouchStart}
        onTouchMove={onContactTouchMove}
        onTouchEnd={onContactTouchEnd}
        onTouchCancel={onContactTouchEnd}
        style={contactDragX !== null ? { transform: `translateX(${contactDragX}px)` } : undefined}
      >
        {/* One statement, centred, then one sentence that covers all three
            routes — so the rows below need no description of their own until
            they are opened. */}
        <div className="contact-drawer-head">
          <button
            className="contact-drawer-close"
            aria-label="Close contact"
            onClick={() => setContactOpen(false)}
          >×</button>
          <span className="contact-drawer-h">Any Questions?</span>
          <p className="contact-drawer-note">We&rsquo;d be glad to help.</p>
        </div>
        <div className="contact-drawer-body">
          {CONTACT_GROUPS.map((g) => {
            const open = openContact === g.key;
            return (
              <div key={g.key} className={"cg" + (open ? " open" : "")}>
                <button
                  type="button"
                  className="cg-head"
                  aria-expanded={open}
                  onClick={() => setOpenContact(open ? null : g.key)}
                >
                  {/* Just the word, set exactly as the menu's own links are.
                      No arrow: the drawer speaks the same language as the
                      navigation now, where the word itself is the whole of the
                      hover — gold, and half a step to the right. The icon
                      lives once this opens, on the action itself below, so it
                      is never shown twice. */}
                  <span className="cg-label">{g.label}</span>
                </button>
                {/* Visible by default — this is the context, not the reveal.
                    Only the action(s) beneath are gated behind opening the
                    row. */}
                <p className="cg-sub">{g.sub}</p>
                {/* Grid rows animate from 0fr to 1fr, which gives a real height
                    transition without measuring anything in JS. `hidden` cannot
                    be used here — it would snap. Visibility is what takes the
                    collapsed content out of the tab order, switched after the
                    height has finished travelling. */}
                <div className="cg-panelwrap">
                  <div className="cg-panel">
                  <div className="cg-items">
                    {g.items.map((it) => {
                      const ext = it.external ? { target: "_blank", rel: "noreferrer" } : {};
                      // The primary route out of this panel. Filled, so there is
                      // never a question about what to press.
                      if (it.variant === "cta") {
                        return (
                          <a key={it.label} className="cg-cta" href={it.href} {...ext}>
                            <ContactGlyph className="cg-cta-icon" path={it.icon} mask={it.phoneMask} evenOdd={it.evenOdd} />
                            <span className="cg-cta-label">{it.label}</span>
                          </a>
                        );
                      }
                      // Deliberately plain: it should read as the other option,
                      // not as a second button competing with the first.
                      if (it.variant === "text") {
                        return (
                          <a key={it.label} className="cg-textlink" href={it.href} {...ext}>
                            {it.label}
                          </a>
                        );
                      }
                      return it.consult ? (
                        <button
                          key={it.label}
                          type="button"
                          className="cg-item"
                          onClick={() => {
                            setContactOpen(false);
                            window.dispatchEvent(new CustomEvent("sk:consult"));
                          }}
                        >
                          <span className="cg-ico">
                            <ContactGlyph className="cg-item-icon" path={it.icon} mask={it.phoneMask} evenOdd={it.evenOdd} />
                          </span>
                          {/* Wrapped, not bare: the fill behind these fields is
                              a pseudo-element, and only real elements can be
                              lifted above it. A loose text node would be
                              painted over as the navy swept across. */}
                          <span className="cg-item-label">{it.label}</span>
                        </button>
                      ) : (
                        <a key={it.label} className="cg-item" href={it.href} {...ext}>
                          <span className="cg-ico">
                            <ContactGlyph className="cg-item-icon" path={it.icon} mask={it.phoneMask} evenOdd={it.evenOdd} />
                          </span>
                          {/* Wrapped, not bare: the fill behind these fields is
                              a pseudo-element, and only real elements can be
                              lifted above it. A loose text node would be
                              painted over as the navy swept across. */}
                          <span className="cg-item-label">{it.label}</span>
                        </a>
                      );
                    })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* The fourth way in: not a contact route but the answer to most of
              what people open this panel to ask. */}
          {/* A real link to a real address, so it can be middle-clicked,
              opened in a new tab and read by a crawler — and so that with the
              handler removed it would still land in the right place. The whole
              card is this one element: the padding, the rule beneath it and the
              full width of the panel all belong to the anchor, which is why
              every part of it is clickable and why the hover treatment is
              driven from :hover on the anchor rather than on the text. */}
          <a className="cg-faq" href="/#faq" onClick={goFaqSection}>
            {/* The mark sits outside the text block, centred across both lines,
                so the eyebrow and the title range off one shared left edge. */}
            <ContactGlyph className="cg-faq-ico" path={ICON_INFO} />
            <span className="cg-faq-txt">
              <span className="cg-faq-eyebrow">Questions, answered.</span>
              <span className="cg-faq-title">Before you ask.</span>
            </span>
          </a>
        </div>
      </aside>
    </header>
  );
}
