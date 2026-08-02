/** A single piece.
 *
 *  Server-rendered through a loader rather than fetched in the browser, because
 *  this is the page that gets shared, indexed and pasted into a message — it
 *  has to arrive complete, with its own title and preview image, not as an
 *  empty shell that fills in a moment later. */

import { useMemo, useRef, useState } from "react";
import { Link, createFileRoute, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { fetchCatalog, fetchPiece } from "@/lib/shopify.functions";
import {
  METAL_OPTION,
  METAL_SWATCHES,
  collectionPath,
  money,
  type SkProduct,
  type SkVariant,
} from "@/lib/catalog";
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

  // Variants whose options are all "Default Title" are Shopify's stand-in for
  // a product with no options at all, and must not draw a selector.
  const hasChoices = piece.variants.length > 1;
  const [variantId, setVariantId] = useState(
    () => (piece.variants.find((v) => v.available) ?? piece.variants[0])?.id ?? "",
  );
  const variant = piece.variants.find((v) => v.id === variantId) ?? piece.variants[0];

  const price = variant?.price ?? piece.price;
  const compareAt = variant?.compareAt ?? piece.compareAt;
  const canBuy = piece.acquisition === "cart" && !piece.soldOut && Boolean(variant?.available);

  return (
    <>
      <main className="piece">
        <div className="wrap piece-wrap">
          {/* Real links, not labels: arriving here from a search result is the
              common case, and the crumb is then the only route into the rest of
              the collection. */}
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
            <Gallery piece={piece} />

            <div className="piece-detail">
              {piece.style ? <span className="eyebrow">{piece.style}</span> : null}
              <h1 className="serif piece-title">{piece.name}</h1>
              {piece.spec ? <p className="piece-spec">{piece.spec}</p> : null}

              <div className="piece-price">
                <span className="pp-now">{money(price, piece.currency)}</span>
                {compareAt ? (
                  <span className="pp-was">{money(compareAt, piece.currency)}</span>
                ) : null}
              </div>

              <Attributes piece={piece} />

              {hasChoices ? (
                <VariantPicker
                  variants={piece.variants}
                  selectedId={variantId}
                  onSelect={setVariantId}
                />
              ) : null}

              <Actions
                piece={piece}
                variant={variant}
                canBuy={canBuy}
                onInquire={() => setInquiring(true)}
              />

              {piece.descriptionHtml ? (
                <div
                  className="piece-copy"
                  // Shopify's rich-text description, authored by David in the
                  // admin. Same trust boundary as the rest of the store's copy.
                  dangerouslySetInnerHTML={{ __html: piece.descriptionHtml }}
                />
              ) : null}

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

/** The piece's photography, as a slider.
 *
 *  Native horizontal scroll-snap rather than a transform-driven carousel —
 *  the same mechanism the Collections carousel on the home page uses. It costs
 *  nothing on the main thread, and on a phone it inherits real momentum
 *  scrolling, so a swipe feels like the operating system rather than like
 *  JavaScript imitating one. Arrows, dots and thumbnails are three ways to
 *  drive the same scroll position; the active index is read back off the
 *  scroll rather than tracked separately, so nothing can drift out of sync. */
function Gallery({ piece }: { piece: SkProduct }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const images = piece.images;

  const goTo = (i: number) => {
    const el = trackRef.current;
    if (!el) return;
    const clamped = Math.max(0, Math.min(images.length - 1, i));
    el.scrollTo({ left: clamped * el.clientWidth, behavior: "smooth" });
  };

  // Read the index back off the scroll position, coalesced to a frame so a
  // momentum scroll doesn't run this on every pixel.
  const onScroll = () => {
    const el = trackRef.current;
    if (!el) return;
    window.requestAnimationFrame(() => {
      const i = Math.round(el.scrollLeft / el.clientWidth);
      setActive((prev) => (prev === i ? prev : i));
    });
  };

  if (!images.length) {
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
      <div className="pg-main">
        <div className="pg-track" ref={trackRef} onScroll={onScroll}>
          {images.map((img, i) => (
            <div className="pg-slide" key={img.url}>
              <img
                src={img.url}
                alt={img.alt}
                width={img.width ?? undefined}
                height={img.height ?? undefined}
                // The first frame is what the client waits on; the rest can
                // arrive as they scroll to them.
                loading={i === 0 ? "eager" : "lazy"}
              />
            </div>
          ))}
        </div>

        {piece.soldOut ? <span className="pg-flag">Acquired</span> : null}

        {images.length > 1 ? (
          <>
            <button
              className="pg-arw l"
              onClick={() => goTo(active - 1)}
              disabled={active === 0}
              aria-label="Previous image"
            >
              ‹
            </button>
            <button
              className="pg-arw r"
              onClick={() => goTo(active + 1)}
              disabled={active === images.length - 1}
              aria-label="Next image"
            >
              ›
            </button>
          </>
        ) : null}
      </div>

      {images.length > 1 ? (
        <>
          <div className="pg-dots">
            {images.map((img, i) => (
              <button
                key={img.url}
                className={"pg-dot" + (i === active ? " on" : "")}
                onClick={() => goTo(i)}
                aria-label={`Go to image ${i + 1} of ${images.length}`}
                aria-current={i === active}
              />
            ))}
          </div>
          <div className="pg-thumbs">
            {images.map((img, i) => (
              <button
                key={img.url}
                className={"pg-thumb" + (i === active ? " sel" : "")}
                onClick={() => goTo(i)}
                aria-label={`View image ${i + 1} of ${images.length}`}
              >
                <span style={{ backgroundImage: `url('${img.url}')` }} />
              </button>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}

/** The specification table. Only rows the piece actually carries — a table half
 *  full of dashes reads as an unfinished listing. */
function Attributes({ piece }: { piece: SkProduct }) {
  const rows = [
    ["Collection", piece.category],
    ["Type", piece.type],
    ["Stone Shape", piece.shape],
    ["Style", piece.style],
  ].filter(([, v]) => Boolean(v));

  if (!rows.length) return null;

  return (
    <dl className="piece-attrs">
      {rows.map(([k, v]) => (
        <div key={k}>
          <dt>{k}</dt>
          <dd>{v}</dd>
        </div>
      ))}
    </dl>
  );
}

function VariantPicker({
  variants,
  selectedId,
  onSelect,
}: {
  variants: SkVariant[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  // Rebuild the option axes from the variants themselves. Shopify gives each
  // variant its resolved option values, so the axes are the distinct values per
  // option name, in first-seen order.
  const axes = useMemo(() => {
    const byName = new Map<string, string[]>();
    for (const v of variants) {
      for (const o of v.options) {
        if (o.name === "Title" && o.value === "Default Title") continue;
        const seen = byName.get(o.name) ?? [];
        if (!seen.includes(o.value)) seen.push(o.value);
        byName.set(o.name, seen);
      }
    }
    return [...byName.entries()].map(([name, values]) => ({ name, values }));
  }, [variants]);

  const selected = variants.find((v) => v.id === selectedId);

  if (!axes.length) return null;

  return (
    <div className="piece-variants">
      {axes.map((axis) => {
        // Metal is the one axis where the word alone is the weaker label — a
        // client choosing between yellow and rose is choosing a colour, so the
        // colour is shown. Matched case-insensitively because the option name
        // is typed by hand in the Shopify admin.
        const isMetal = axis.name.trim().toLowerCase() === METAL_OPTION;
        const chosen = selected?.options.find((o) => o.name === axis.name)?.value;

        return (
          <div key={axis.name} className="pv-axis">
            <span className="pv-label">
              {axis.name}
              {chosen ? <b>{chosen}</b> : null}
            </span>
            <div className={"pv-opts" + (isMetal ? " pv-metal" : "")}>
              {axis.values.map((value) => {
                // Hold every other axis steady and move only this one, so each
                // button leads to a variant that actually exists.
                const target = variants.find((v) =>
                  v.options.every((o) =>
                    o.name === axis.name
                      ? o.value === value
                      : o.value === selected?.options.find((s) => s.name === o.name)?.value,
                  ),
                );
                const isSel = chosen === value;
                const swatch = METAL_SWATCHES[value.trim().toLowerCase()];

                return (
                  <button
                    key={value}
                    className={
                      "pv-opt" +
                      (isSel ? " sel" : "") +
                      (target && !target.available ? " out" : "")
                    }
                    disabled={!target}
                    onClick={() => target && onSelect(target.id)}
                  >
                    {/* A metal the site has no swatch for still gets its
                        button — it just renders as a plain label rather than
                        being dropped from the page. */}
                    {isMetal && swatch ? (
                      <i className="pv-sw" style={{ background: swatch }} aria-hidden="true" />
                    ) : null}
                    {value}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Actions({
  piece,
  variant,
  canBuy,
  onInquire,
}: {
  piece: SkProduct;
  variant: SkVariant | undefined;
  canBuy: boolean;
  onInquire: () => void;
}) {
  const { add, busy } = useCart();
  const [failed, setFailed] = useState(false);

  if (piece.soldOut || (variant && !variant.available && piece.acquisition === "cart")) {
    return (
      <div className="piece-actions">
        <button className="btn btn-solid" disabled>
          Acquired
        </button>
        <button className="btn btn-ghost-d" onClick={onInquire}>
          Commission Something Similar
        </button>
      </div>
    );
  }

  if (!canBuy) {
    return (
      <div className="piece-actions">
        <button className="btn btn-solid" onClick={onInquire}>
          Enquire About This Piece
        </button>
        <p className="piece-action-note">
          Pieces at this level are placed personally. We'll answer within one business day.
        </p>
      </div>
    );
  }

  return (
    <div className="piece-actions">
      <button
        className="btn btn-solid"
        disabled={busy}
        onClick={async () => {
          const ok = await add(variant!.id, 1);
          setFailed(!ok);
        }}
      >
        {busy ? "Adding…" : "Add to Selection"}
      </button>
      <button className="btn btn-ghost-d" onClick={onInquire}>
        Ask a Question
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
