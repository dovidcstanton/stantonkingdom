/** A single piece.
 *
 *  Server-rendered through a loader rather than fetched in the browser, because
 *  this is the page that gets shared, indexed and pasted into a message — it
 *  has to arrive complete, with its own title and preview image, not as an
 *  empty shell that fills in a moment later.
 *
 *  The page reads top to bottom in one obvious order: gallery, name, price,
 *  fully customizable, the three configuration controls, Add to Basket, a
 *  small Inquire link, the made-to-order line, then the accordions.
 *
 *  The gallery is one continuous horizontal rail — every photograph the piece
 *  owns, edge to edge, in a fixed promenade order: the signature shots first,
 *  then the White Gold group, Yellow, Rose. Native scroll-snap carries the
 *  touch physics. The colourway selection and the rail are two views of one
 *  state: choosing a swatch glides the rail to that group's first frame, and
 *  swiping into a group by hand moves the swatch — in both directions,
 *  without either fighting the other. */

import { useMemo, useRef, useState } from "react";
import { Link, createFileRoute, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import * as Accordion from "@radix-ui/react-accordion";

import { fetchCatalog, fetchPiece } from "@/lib/shopify.functions";
import {
  METAL_SWATCHES,
  cleanAlt,
  collectionPath,
  configMatrix,
  galleryPlan,
  isMetalColorOption,
  isMetalOption,
  isOriginOption,
  money,
  needsCertification,
  type MetalColor,
  type SkProduct,
} from "@/lib/catalog";
import { useCart } from "@/lib/cart";
import { InquiryDialog } from "@/components/InquiryDialog";
import { PieceCard } from "@/components/PieceCard";

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

/** A segmented control whose active background glides between the options
 *  rather than jumping — one indicator element, moved by transform, sized by
 *  the option count. */
function GlideSeg({
  label,
  options,
  value,
  onSelect,
  disabledOptions,
}: {
  label: string;
  options: string[];
  value: string | null;
  onSelect: (v: string) => void;
  disabledOptions?: Set<string>;
}) {
  const index = Math.max(0, options.indexOf(value ?? ""));
  return (
    <div className="cfg-row">
      <span className="cfg-label">{label}</span>
      <div
        className="seg"
        role="group"
        aria-label={label}
        style={{ ["--seg-n" as string]: options.length, ["--seg-i" as string]: index }}
      >
        <span className="seg-glide" aria-hidden="true" />
        {options.map((o) => (
          <button
            key={o}
            className={"seg-opt" + (value === o ? " on" : "")}
            onClick={() => onSelect(o)}
            disabled={disabledOptions?.has(o)}
            aria-pressed={value === o}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}

function PiecePage() {
  const piece = Route.useLoaderData();
  const [inquiring, setInquiring] = useState(false);

  const matrix = useMemo(() => configMatrix(piece.variants), [piece.variants]);

  // ---- one configuration state; every control reads and writes it ----
  const [origin, setOrigin] = useState<string | null>(() => matrix.origins[0] ?? null);
  const [purity, setPurity] = useState<string | null>(() => matrix.purities[0] ?? null);
  const [color, setColor] = useState<MetalColor | null>(() => {
    const first = matrix.colors.find((c) =>
      matrix.some({ purity: matrix.purities[0] ?? null, color: c }),
    );
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
    if (purity && !matrix.some({ purity, color: c })) {
      setPurity(matrix.purities.find((p) => matrix.some({ purity: p, color: c })) ?? null);
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
    } else if (color && !matrix.some({ purity: p, color })) {
      const c = matrix.colors.find((cc) => matrix.some({ purity: p, color: cc }));
      if (c) selectColor(c);
    }
  };

  // The exact variant the three axes name. Each axis participates only when
  // the product actually carries it, so legacy single-variant pieces resolve
  // to their one variant untouched.
  const variant = useMemo(() => {
    const matches = piece.variants.filter((v) => {
      const vo = v.options.find((o) => isOriginOption(o.name))?.value.trim() ?? null;
      const vp = v.options.find((o) => isMetalOption(o.name))?.value.trim() ?? null;
      const vc = v.options.find((o) => isMetalColorOption(o.name))?.value.trim() ?? null;
      if (matrix.origins.length && origin && vo !== origin) return false;
      if (matrix.purities.length && purity && vp !== purity) return false;
      if (matrix.colors.length && color && vc !== color) return false;
      return true;
    });
    return matches.find((v) => v.available) ?? matches[0] ?? piece.variants[0];
  }, [piece.variants, matrix, origin, purity, color]);

  const price = variant?.price ?? piece.price;
  const canBuy = piece.acquisition === "cart" && !piece.soldOut && Boolean(variant?.available);
  const certified = useMemo(() => needsCertification(piece), [piece]);

  const platinumLocked = useMemo(
    () =>
      new Set<MetalColor>(
        purity === "Platinum" ? matrix.colors.filter((c) => c !== "White Gold") : [],
      ),
    [purity, matrix.colors],
  );

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
              <h1 className="serif piece-title">{piece.name}</h1>

              <div className="piece-price">
                <span className="pp-now">{money(price, piece.currency)}</span>
                <span className="pp-custom">Fully customizable</span>
              </div>

              <div className="piece-config">
                {matrix.origins.length > 1 ? (
                  <GlideSeg
                    label="Diamond origin"
                    options={matrix.origins}
                    value={origin}
                    onSelect={setOrigin}
                  />
                ) : null}

                {matrix.colors.length ? (
                  <div className="cfg-row">
                    <span className="cfg-label">Metal colour</span>
                    <div className="metal-colors" role="group" aria-label="Metal colour">
                      {matrix.colors.map((c) => (
                        <button
                          key={c}
                          className={"mc-swatch" + (color === c ? " sel" : "")}
                          style={{ background: METAL_SWATCHES[c.toLowerCase()] }}
                          onClick={() => selectColor(c)}
                          disabled={platinumLocked.has(c)}
                          aria-pressed={color === c}
                          aria-label={
                            c + (platinumLocked.has(c) ? " (not offered in platinum)" : "")
                          }
                          title={c}
                        />
                      ))}
                      {color ? <span className="mc-name">{color}</span> : null}
                    </div>
                    {purity === "Platinum" ? (
                      <p className="cfg-note">Platinum is offered in its natural white.</p>
                    ) : null}
                  </div>
                ) : null}

                {matrix.purities.length > 1 ? (
                  <GlideSeg
                    label="Metal"
                    options={matrix.purities}
                    value={purity}
                    onSelect={selectPurity}
                  />
                ) : null}
              </div>

              <Actions
                piece={piece}
                variantId={variant?.id}
                canBuy={canBuy}
                onInquire={() => setInquiring(true)}
              />

              <p className="made-line">
                Made to order • typically 3–4 weeks. More extensive customizations may require
                additional time.
              </p>

              <PieceAccordions piece={piece} certified={certified} />
            </div>
          </div>

          <RelatedPieces piece={piece} />
        </div>
      </main>

      {inquiring ? <InquiryDialog piece={piece} onClose={() => setInquiring(false)} /> : null}
    </>
  );
}

/** The continuous showroom rail. Pure scroll-snap: each slide is exactly one
 *  viewport of the gallery wide, the images touch, and the browser owns the
 *  physics. Every frame is eagerly loaded — a lazy image arriving mid-swipe
 *  is exactly the white flash the rail must never show. The active index is
 *  read back off the scroll position itself, so the indicators and the
 *  colourway can never drift from what the eye sees. */
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
        <div className="pg-main rail-main">
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
                loading="eager"
                decoding="async"
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
              className={"rail-dot" + (i === active ? " on" : "")}
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

function Actions({
  piece,
  variantId,
  canBuy,
  onInquire,
}: {
  piece: SkProduct;
  variantId: string | undefined;
  canBuy: boolean;
  onInquire: () => void;
}) {
  const { add, busy } = useCart();
  const [failed, setFailed] = useState(false);

  if (piece.soldOut) {
    return (
      <div className="piece-actions">
        <button className="btn btn-solid" disabled>
          Acquired
        </button>
        <button className="pa-inquire" onClick={onInquire}>
          Inquire
        </button>
      </div>
    );
  }

  if (!canBuy || !variantId) {
    return (
      <div className="piece-actions">
        <button className="btn btn-solid" onClick={onInquire}>
          Enquire About This Piece
        </button>
      </div>
    );
  }

  return (
    <div className="piece-actions">
      <button
        className="btn btn-solid"
        disabled={busy}
        onClick={async () => {
          const ok = await add(variantId, 1);
          setFailed(!ok);
        }}
      >
        {busy ? "Adding…" : "Add to Basket"}
      </button>
      <button className="pa-inquire" onClick={onInquire}>
        Inquire
      </button>
      {failed ? (
        <p className="piece-action-note err">
          That didn't go through. Please try again, or write to{" "}
          <a href="mailto:sales@stantonkingdom.com">sales@stantonkingdom.com</a>.
        </p>
      ) : null}
    </div>
  );
}

/** Description, the factual specification, and — when the stones warrant it —
 *  certification. No rule between an open heading and its content: the
 *  heading and the text read as one continuous section, and only whole
 *  sections are separated. */
function PieceAccordions({ piece, certified }: { piece: SkProduct; certified: boolean }) {
  const rows: [string, string][] = [
    ...piece.details,
    ...(piece.code ? ([["Product code", piece.code]] as [string, string][]) : []),
  ];

  const chev = (
    <svg className="pacc-chev" viewBox="0 0 12 8" aria-hidden="true">
      <path
        d="M1 1.5 6 6.5 11 1.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );

  return (
    <Accordion.Root type="multiple" defaultValue={["desc"]} className="pacc">
      <Accordion.Item value="desc" className="pacc-item">
        <Accordion.Header className="pacc-head">
          <Accordion.Trigger className="pacc-trigger">Description {chev}</Accordion.Trigger>
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
          </div>
        </Accordion.Content>
      </Accordion.Item>

      {rows.length ? (
        <Accordion.Item value="details" className="pacc-item">
          <Accordion.Header className="pacc-head">
            <Accordion.Trigger className="pacc-trigger">Product Details {chev}</Accordion.Trigger>
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

      {certified ? (
        <Accordion.Item value="cert" className="pacc-item">
          <Accordion.Header className="pacc-head">
            <Accordion.Trigger className="pacc-trigger">Certification {chev}</Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content className="pacc-content">
            <div className="pacc-inner">
              <p className="pacc-cert">
                Diamonds over 1.00 carat are typically accompanied by a GIA or IGI grading report.
              </p>
            </div>
          </Accordion.Content>
        </Accordion.Item>
      ) : null}
    </Accordion.Root>
  );
}

/** Other pieces from the same collection, in the catalogue's own card
 *  language. Silent when there are none, rather than an empty rail with a
 *  heading over it. */
function RelatedPieces({ piece }: { piece: SkProduct }) {
  const { data } = useQuery({
    queryKey: ["catalog"],
    queryFn: () => fetchCatalog(),
    staleTime: 5 * 60 * 1000,
  });

  const [inquiring, setInquiring] = useState<SkProduct | null>(null);

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
      <div className="cat-flow cat-compact related-flow">
        {related.map((p) => (
          <PieceCard key={p.id} piece={p} onInquire={setInquiring} />
        ))}
      </div>
      {inquiring ? <InquiryDialog piece={inquiring} onClose={() => setInquiring(null)} /> : null}
    </section>
  );
}
