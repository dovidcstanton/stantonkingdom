/** A single piece.
 *
 *  Server-rendered through a loader rather than fetched in the browser, because
 *  this is the page that gets shared, indexed and pasted into a message — it
 *  has to arrive complete, with its own title and preview image, not as an
 *  empty shell that fills in a moment later.
 *
 *  The gallery is one continuous horizontal rail — every photograph the piece
 *  owns, edge to edge, in a fixed promenade order: the signature shots first,
 *  then the White Gold group, Yellow, Rose. Native scroll-snap carries the
 *  touch physics; nothing is transform-driven, so a swipe has the operating
 *  system's own momentum. The colourway selection and the rail are two views
 *  of one state: choosing a swatch glides the rail to that group's first
 *  frame, and swiping into a group by hand moves the swatch — in both
 *  directions, without either fighting the other. */

import { useMemo, useRef, useState } from "react";
import { Link, createFileRoute, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import * as Accordion from "@radix-ui/react-accordion";

import { fetchCatalog, fetchPiece } from "@/lib/shopify.functions";
import {
  METAL_SWATCHES,
  cleanAlt,
  collectionPath,
  galleryPlan,
  isMetalColorOption,
  isMetalOption,
  metalMatrix,
  money,
  type MetalColor,
  type SkProduct,
  type SkVariant,
} from "@/lib/catalog";
import { whatsappForPiece } from "@/lib/social";
import { useCart } from "@/lib/cart";
import { InquiryDialog } from "@/components/InquiryDialog";
import { SiteFooter } from "@/components/SiteFooter";

export const Route = createFileRoute("/piece/$handle")({
  loader: async ({ params }) => {
    const piece = await fetchPiece({ data: params.handle });
    if (!piece) throw notFound();
    return piece;
  },
  head: ({ loaderData }) => {
    if (!loaderData) return {};
    const desc =
      loaderData.spec ||
      loaderData.description.slice(0, 155) ||
      `${loaderData.name} — Stanton Kingdom`;
    return {
      meta: [
        { title: `${loaderData.name} — Stanton Kingdom` },
        { name: "description", content: desc },
        { property: "og:title", content: `${loaderData.name} — Stanton Kingdom` },
        { property: "og:description", content: desc },
        ...(loaderData.images[0]
          ? [{ property: "og:image", content: loaderData.images[0].url }]
          : []),
      ],
    };
  },
  component: PiecePage,
});

function PiecePage() {
  const piece = Route.useLoaderData();
  const [inquiring, setInquiring] = useState(false);

  const matrix = useMemo(() => metalMatrix(piece.variants), [piece.variants]);
  const hasMetalAxes = matrix.purities.length > 0 || matrix.colors.length > 0;

  // ---- the one metal state both the rail and the selectors read ----
  const [purity, setPurity] = useState<string | null>(() => {
    const p = matrix.purities.find((pp) =>
      matrix.colors.length ? matrix.colors.some((c) => matrix.has(pp, c)) : true,
    );
    return p ?? null;
  });
  const [color, setColor] = useState<MetalColor | null>(() => {
    const first = matrix.colors.find((c) => matrix.has(matrix.purities[0] ?? null, c));
    return first ?? matrix.colors[0] ?? null;
  });

  const plan = useMemo(() => galleryPlan(piece.images), [piece.images]);
  const trackRef = useRef<HTMLDivElement>(null);
  // While the rail is gliding to a colour the visitor CHOSE, the slides it
  // passes through must not re-derive the choice — the glide crosses other
  // groups on the way and would flap the swatches mid-flight.
  const suppressUntil = useRef(0);

  const glideToColor = (c: MetalColor) => {
    const i = plan.firstIndex(c);
    const el = trackRef.current;
    if (i < 0 || !el) return;
    suppressUntil.current = performance.now() + 900;
    el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  };

  /** Choosing a colour: settle the purity onto one that exists in that
   *  colour, and glide the rail — unless the choice CAME from the rail. */
  const selectColor = (c: MetalColor, fromRail = false) => {
    setColor(c);
    if (purity && !matrix.has(purity, c)) {
      setPurity(matrix.purities.find((p) => matrix.has(p, c)) ?? null);
    }
    if (!fromRail) glideToColor(c);
  };

  /** Choosing a purity: platinum is white by nature, so it forces the white
   *  colourway; any other purity keeps the colour if the combination exists
   *  and otherwise moves to the first that does. */
  const selectPurity = (p: string) => {
    setPurity(p);
    if (p === "Platinum") {
      if (color !== "White Gold") selectColor("White Gold");
    } else if (color && !matrix.has(p, color)) {
      const c = matrix.colors.find((cc) => matrix.has(p, cc));
      if (c) selectColor(c);
    }
  };

  // The variant the current metal selection names. Non-metal axes (a ring
  // size, say) are not part of this slice's selectors, so the first available
  // variant matching the metal axes stands for the piece.
  const variant = useMemo(() => {
    const matches = piece.variants.filter((v) => {
      const vp = v.options.find((o) => isMetalOption(o.name))?.value.trim() ?? null;
      const vc = v.options.find((o) => isMetalColorOption(o.name))?.value.trim() ?? null;
      if (purity && vp !== purity) return false;
      if (color && vc !== color) return false;
      return true;
    });
    return matches.find((v) => v.available) ?? matches[0] ?? piece.variants[0];
  }, [piece.variants, purity, color]);

  const price = variant?.price ?? piece.price;
  const fromPrice = piece.price;
  const canBuy = piece.acquisition === "cart" && !piece.soldOut && Boolean(variant?.available);

  const whatsapp = () => {
    const metal = [color, purity].filter(Boolean).join(" · ");
    window.open(
      whatsappForPiece({
        name: piece.name,
        code: piece.code,
        metal: hasMetalAxes && metal ? metal : undefined,
        url: window.location.href.split("#")[0],
      }),
      "_blank",
      "noopener,noreferrer",
    );
  };

  return (
    <>
      <main className="piece">
        <div className="wrap piece-wrap">
          <nav className="piece-crumbs" aria-label="Breadcrumb">
            <Link to="/">Home</Link>
            {piece.category ? (
              <>
                <span aria-hidden="true">/</span>
                <Link to={collectionPath(piece.category)}>{piece.category}</Link>
              </>
            ) : null}
            {piece.category && piece.type ? (
              <>
                <span aria-hidden="true">/</span>
                <Link to={collectionPath(piece.category, piece.type)}>{piece.type}</Link>
              </>
            ) : null}
          </nav>

          <div className="piece-grid">
            <Rail
              piece={piece}
              plan={plan}
              trackRef={trackRef}
              suppressUntil={suppressUntil}
              activeColor={color}
              onRailColor={(c) => selectColor(c, true)}
            />

            <div className="piece-detail">
              {piece.style ? <span className="eyebrow">{piece.style}</span> : null}
              <h1 className="serif piece-title">{piece.name}</h1>

              <div className="piece-price">
                <span className="pp-now">
                  {price !== fromPrice
                    ? money(price, piece.currency)
                    : `From ${money(fromPrice, piece.currency)}`}
                </span>
                <span className="pp-custom">Fully customizable</span>
              </div>

              {matrix.colors.length ? (
                <div className="metal-colors" role="group" aria-label="Metal colour">
                  {matrix.colors.map((c) => {
                    const platinumLocked = purity === "Platinum" && c !== "White Gold";
                    return (
                      <button
                        key={c}
                        className={"mc-swatch" + (color === c ? " sel" : "")}
                        style={{ background: METAL_SWATCHES[c.toLowerCase()] }}
                        onClick={() => selectColor(c)}
                        disabled={platinumLocked}
                        aria-pressed={color === c}
                        aria-label={c + (platinumLocked ? " (not offered in platinum)" : "")}
                        title={c}
                      />
                    );
                  })}
                  {color ? <span className="mc-name">{color}</span> : null}
                </div>
              ) : null}

              {matrix.purities.length ? (
                <div className="metal-purity" role="group" aria-label="Metal">
                  <span className="mp-label">Metal</span>
                  <div className="mp-seg">
                    {matrix.purities.map((p) => (
                      <button
                        key={p}
                        className={"mp-opt" + (purity === p ? " sel" : "")}
                        onClick={() => selectPurity(p)}
                        aria-pressed={purity === p}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="piece-actions">
                <button className="btn btn-solid btn-wa" onClick={whatsapp}>
                  Enquire via WhatsApp
                </button>
                {canBuy ? <BuyButton variant={variant} /> : null}
                <button className="pa-quiet" onClick={() => setInquiring(true)}>
                  Prefer email? Write to us instead
                </button>
              </div>

              <PieceAccordions piece={piece} />

              <Assurance />
            </div>
          </div>

          <RelatedPieces piece={piece} />
        </div>
      </main>

      <SiteFooter />

      {inquiring ? <InquiryDialog piece={piece} onClose={() => setInquiring(false)} /> : null}
    </>
  );
}

/** The continuous showroom rail. Pure scroll-snap: each slide is exactly one
 *  viewport of the gallery wide, the images touch, and the browser owns the
 *  physics. The active index is read back off the scroll position itself, so
 *  the indicators and the colourway can never drift from what the eye sees. */
function Rail({
  piece,
  plan,
  trackRef,
  suppressUntil,
  activeColor,
  onRailColor,
}: {
  piece: SkProduct;
  plan: ReturnType<typeof galleryPlan>;
  trackRef: React.RefObject<HTMLDivElement | null>;
  suppressUntil: React.MutableRefObject<number>;
  activeColor: MetalColor | null;
  onRailColor: (c: MetalColor) => void;
}) {
  const [active, setActive] = useState(0);
  const raf = useRef(0);

  const onScroll = () => {
    if (raf.current) return;
    raf.current = window.requestAnimationFrame(() => {
      raf.current = 0;
      const el = trackRef.current;
      if (!el || !el.clientWidth) return;
      const i = Math.round(el.scrollLeft / el.clientWidth);
      setActive((prev) => (prev === i ? prev : i));
      if (performance.now() < suppressUntil.current) return;
      const c = plan.slides[i]?.color;
      if (c && c !== activeColor) onRailColor(c);
    });
  };

  if (!plan.slides.length) {
    return (
      <div className="piece-gallery">
        <div className="pg-main">
          <div className="pg-none" aria-label="Photography to follow" />
          {piece.soldOut ? <span className="pg-flag">Acquired</span> : null}
        </div>
      </div>
    );
  }

  return (
    <div className="piece-gallery">
      <div className="pg-main rail-main">
        <div className="pg-track rail-track" ref={trackRef} onScroll={onScroll}>
          {plan.slides.map(({ img, color }, i) => (
            <div className="pg-slide" key={`${img.url}#${i}`}>
              <img
                src={img.url}
                alt={cleanAlt(img)}
                width={img.width ?? undefined}
                height={img.height ?? undefined}
                className={img.tint ? `rail-tint-${img.tint}` : undefined}
                loading={i === 0 ? "eager" : "lazy"}
                draggable={false}
              />
              {color ? <span className="rail-caption">{color}</span> : null}
            </div>
          ))}
        </div>
        {piece.soldOut ? <span className="pg-flag">Acquired</span> : null}
      </div>

      {plan.slides.length > 1 ? (
        <div className="rail-dots" role="tablist" aria-label="Gallery position">
          {plan.slides.map(({ color }, i) => (
            <button
              key={i}
              className={"rail-dot" + (i === active ? " on" : "") + (color ? "" : " sig")}
              onClick={() => {
                const el = trackRef.current;
                if (!el) return;
                suppressUntil.current = performance.now() + 900;
                el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
                if (color) onRailColor(color);
              }}
              aria-label={`Image ${i + 1} of ${plan.slides.length}${color ? `, ${color}` : ""}`}
              aria-current={i === active}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

/** Description first — the piece's narrative, closed by the house's
 *  manufacturing line — then the factual specification. Radix carries the
 *  keyboard and ARIA work; the styling keeps it to thin rules and one quiet
 *  chevron. */
function PieceAccordions({ piece }: { piece: SkProduct }) {
  const rows: [string, string][] = [
    ...piece.details,
    ...(piece.code ? ([["Product code", piece.code]] as [string, string][]) : []),
  ];

  return (
    <Accordion.Root type="multiple" defaultValue={["desc"]} className="pacc">
      <Accordion.Item value="desc" className="pacc-item">
        <Accordion.Header className="pacc-head">
          <Accordion.Trigger className="pacc-trigger">
            Description
            <svg className="pacc-chev" viewBox="0 0 12 8" aria-hidden="true">
              <path
                d="M1 1.5 6 6.5 11 1.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
            </svg>
          </Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Content className="pacc-content">
          <div className="pacc-inner">
            {piece.descriptionHtml ? (
              <div
                className="piece-copy"
                // Shopify's rich-text description, authored by David in the
                // admin. Same trust boundary as the rest of the store's copy.
                dangerouslySetInnerHTML={{ __html: piece.descriptionHtml }}
              />
            ) : null}
            <p className="pacc-made">
              Made to order • typically 3–4 weeks. More extensive customizations may require
              additional time.
            </p>
          </div>
        </Accordion.Content>
      </Accordion.Item>

      {rows.length ? (
        <Accordion.Item value="details" className="pacc-item">
          <Accordion.Header className="pacc-head">
            <Accordion.Trigger className="pacc-trigger">
              Product Details
              <svg className="pacc-chev" viewBox="0 0 12 8" aria-hidden="true">
                <path
                  d="M1 1.5 6 6.5 11 1.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                />
              </svg>
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content className="pacc-content">
            <div className="pacc-inner">
              <dl className="pacc-rows">
                {rows.map(([k, v]) => (
                  <div key={k}>
                    <dt>{k}</dt>
                    <dd>{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </Accordion.Content>
        </Accordion.Item>
      ) : null}
    </Accordion.Root>
  );
}

function BuyButton({ variant }: { variant: SkVariant | undefined }) {
  const { add, busy } = useCart();
  const [failed, setFailed] = useState(false);
  if (!variant) return null;
  return (
    <>
      <button
        className="btn btn-ghost-d"
        disabled={busy}
        onClick={async () => {
          const ok = await add(variant.id, 1);
          setFailed(!ok);
        }}
      >
        {busy ? "Adding…" : "Add to Selection"}
      </button>
      {failed ? (
        <p className="piece-action-note err">
          That didn't go through. Please try again, or write to{" "}
          <a href="mailto:sales@stantonkingdom.com">sales@stantonkingdom.com</a>.
        </p>
      ) : null}
    </>
  );
}

function Assurance() {
  const points = [
    ["Certification", "Every stone above 0.50ct ships with its independent laboratory report."],
    ["Insured Delivery", "Fully insured, signature-required, worldwide."],
    [
      "Lifetime Care",
      "Complimentary cleaning, inspection and re-polishing, for as long as you own it.",
    ],
  ];
  return (
    <ul className="piece-assure">
      {points.map(([k, v]) => (
        <li key={k}>
          <span className="pa-k">{k}</span>
          <span className="pa-v">{v}</span>
        </li>
      ))}
    </ul>
  );
}

/** Other pieces from the same collection. Silent when there are none, rather
 *  than showing an empty rail with a heading over it. */
function RelatedPieces({ piece }: { piece: SkProduct }) {
  const { data } = useQuery({
    queryKey: ["catalog"],
    queryFn: () => fetchCatalog(),
    staleTime: 5 * 60 * 1000,
  });

  const related = (data?.products ?? [])
    .filter((p) => p.id !== piece.id && p.category === piece.category)
    .slice(0, 4);

  if (!related.length) return null;

  return (
    <section className="piece-related">
      <div className="cat-head">
        <div>
          <span className="eyebrow">{piece.category}</span>
          <h2 className="serif">Also In This Collection</h2>
        </div>
      </div>
      <div className="cat-grid">
        {related.map((p) => (
          <Link key={p.id} to="/piece/$handle" params={{ handle: p.handle }} className="p-card">
            <div className="p-img">
              <div
                style={p.images[0] ? { backgroundImage: `url('${p.images[0].url}')` } : undefined}
              />
            </div>
            <div className="p-body">
              <h3>{p.name}</h3>
              {p.shape || p.style ? (
                <div className="p-spec">{[p.shape, p.style].filter(Boolean).join(" · ")}</div>
              ) : null}
              <div className="p-price">{money(p.price, p.currency)}</div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
