/** The body of every collection page.
 *
 *  One component behind three routes (/collection, /collection/$category and
 *  /collection/$category/$type) because the three differ only in how far the
 *  selection is drilled — the header, the controls and the grid are identical,
 *  and keeping them identical is the point.
 *
 *  Two ways of laying out the same pieces, chosen by the toggle at the top:
 *
 *  EDITORIAL — the default — runs a repeating rhythm of two cards side by
 *  side and then one full-width card: small, small, large, and again. The
 *  large position is pure presentation: it is whichever piece falls third in
 *  the current sort, drawn bigger, not a separate "featured" list — the array
 *  is mapped once, keyed by id, so nothing can appear twice.
 *
 *  COMPACT is a plain two-column grid, four pieces to a phone screen, for
 *  visitors who want the overview rather than the promenade. */

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";

import { fetchCatalog } from "@/lib/shopify.functions";
import {
  SORTS,
  STYLES,
  STYLE_MATCHES_EVERYTHING,
  availableShapes,
  money,
  sortProducts,
  type SkProduct,
} from "@/lib/catalog";
import { whatsappForPiece } from "@/lib/social";
import { CategoryBar } from "@/components/CategoryBar";
import { ShapeMark } from "@/components/ShapeMark";
import { SiteFooter } from "@/components/SiteFooter";

type Layout = "editorial" | "grid";

export function CollectionView({
  category,
  type,
  style,
}: {
  category: string | null;
  type: string | null;
  style: string | null;
}) {
  const [layout, setLayout] = useState<Layout>("editorial");
  const [shape, setShape] = useState<string | null>(null);
  const [sort, setSort] = useState<string>("new");
  // Seeded by the menu's third drill level (?style=…) and then owned by the
  // chips on the page — the chip row is the one control, whichever door the
  // visitor came in through.
  const [styleFilter, setStyleFilter] = useState<string | null>(style);

  const { data, isPending, isError } = useQuery({
    queryKey: ["catalog"],
    queryFn: () => fetchCatalog(),
    staleTime: 5 * 60 * 1000,
  });

  const products = useMemo(() => data?.products ?? [], [data]);

  // Everything in this category/type, before shape narrows it — the shape row
  // is built from this so it only ever offers shapes that lead somewhere.
  const inSelection = useMemo(
    () =>
      products.filter(
        (p) =>
          (category === null || p.category === category) &&
          (type === null || p.type === type) &&
          // "Uniquely Yours" is an invitation to commission, not an attribute
          // any finished piece carries, so it must never narrow the grid.
          (styleFilter === null ||
            styleFilter === STYLE_MATCHES_EVERYTHING ||
            p.style === styleFilter),
      ),
    [products, category, type, styleFilter],
  );

  const shapes = useMemo(() => availableShapes(inSelection), [inSelection]);

  const items = useMemo(
    () =>
      sortProducts(
        inSelection.filter((p) => !shape || p.shape === shape),
        sort,
      ),
    [inSelection, shape, sort],
  );

  const heading = type ?? category ?? "All Pieces";
  const unreachable = isError || data?.configured === false;
  const gridClass = layout === "editorial" ? "cat-flow cat-mosaic" : "cat-flow cat-compact";

  return (
    <>
      <CategoryBar category={category} type={type} />

      <main className="coll">
        <div className="wrap">
          <div className="coll-meta">
            <h1 className="serif">
              {heading}
              {!isPending && !unreachable ? (
                <span>
                  {items.length} {items.length === 1 ? "piece" : "pieces"}
                </span>
              ) : null}
            </h1>
            {items.length > 1 ? (
              <select
                className="coll-sort"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                aria-label="Sort pieces"
              >
                {SORTS.map((s) => (
                  <option key={s.v} value={s.v}>
                    {s.label}
                  </option>
                ))}
              </select>
            ) : null}
          </div>

          {/* Layout first, filters immediately after — one quiet row. */}
          <div className="cat-controls">
            <div className="lay-toggle" role="group" aria-label="Layout">
              <button
                className={"lt-btn" + (layout === "editorial" ? " on" : "")}
                onClick={() => setLayout("editorial")}
                aria-pressed={layout === "editorial"}
                aria-label="Editorial layout"
                title="Editorial"
              >
                <svg viewBox="0 0 16 16" aria-hidden="true">
                  <rect x="1" y="1" width="6.4" height="5.4" rx="1.2" />
                  <rect x="8.6" y="1" width="6.4" height="5.4" rx="1.2" />
                  <rect x="1" y="8.2" width="14" height="6.8" rx="1.2" />
                </svg>
              </button>
              <button
                className={"lt-btn" + (layout === "grid" ? " on" : "")}
                onClick={() => setLayout("grid")}
                aria-pressed={layout === "grid"}
                aria-label="Compact grid layout"
                title="Compact"
              >
                <svg viewBox="0 0 16 16" aria-hidden="true">
                  <rect x="1" y="1" width="6.4" height="6.4" rx="1.2" />
                  <rect x="8.6" y="1" width="6.4" height="6.4" rx="1.2" />
                  <rect x="1" y="8.6" width="6.4" height="6.4" rx="1.2" />
                  <rect x="8.6" y="8.6" width="6.4" height="6.4" rx="1.2" />
                </svg>
              </button>
            </div>

            <div className="cat-filter" role="group" aria-label="Filter by style">
              <button
                className={"cf-chip" + (styleFilter === null ? " on" : "")}
                onClick={() => setStyleFilter(null)}
                aria-pressed={styleFilter === null}
              >
                All Styles
              </button>
              {STYLES.filter((s) => s !== STYLE_MATCHES_EVERYTHING).map((s) => (
                <button
                  key={s}
                  className={"cf-chip" + (styleFilter === s ? " on" : "")}
                  onClick={() => setStyleFilter(styleFilter === s ? null : s)}
                  aria-pressed={styleFilter === s}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {shapes.length > 1 ? (
            <div className="cat-shapes" role="group" aria-label="Filter by stone shape">
              <button
                className={"sh" + (shape === null ? " sel" : "")}
                onClick={() => setShape(null)}
                aria-pressed={shape === null}
              >
                <ShapeMark shape={null} />
                <span>All</span>
              </button>
              {shapes.map((s) => (
                <button
                  key={s}
                  className={"sh" + (shape === s ? " sel" : "")}
                  onClick={() => setShape(shape === s ? null : s)}
                  aria-pressed={shape === s}
                >
                  <ShapeMark shape={s} />
                  <span>{s}</span>
                </button>
              ))}
            </div>
          ) : null}

          {isPending ? (
            <div className={gridClass} aria-busy="true">
              {Array.from({ length: 6 }, (_, i) => (
                <div
                  key={i}
                  className={
                    "cat-card p-skeleton" +
                    (layout === "editorial" && i % 3 === 2 ? " cc-wide" : "")
                  }
                  aria-hidden="true"
                >
                  <div className="cc-img" />
                  <div className="cc-body">
                    <span className="sk-bar w70" />
                    <span className="sk-bar w40" />
                  </div>
                </div>
              ))}
            </div>
          ) : items.length ? (
            <div className={gridClass}>
              {items.map((p, i) => (
                <PieceCard
                  key={p.id}
                  piece={p}
                  // The editorial rhythm: every third card takes the full row.
                  // Index-derived, so it is a property of the position, never
                  // of the piece — resort the grid and the large slots simply
                  // fall on whoever stands third.
                  wide={layout === "editorial" && i % 3 === 2}
                />
              ))}
            </div>
          ) : (
            <Empty
              unreachable={unreachable}
              narrowed={(Boolean(shape) || Boolean(styleFilter)) && products.length > 0}
              onWiden={() => {
                setShape(null);
                setStyleFilter(null);
              }}
            />
          )}
        </div>
      </main>

      <SiteFooter />
    </>
  );
}

/** One piece. The whole card is a doorway to the piece's page — image and
 *  caption are both real links — and the only other thing on it is the
 *  frosted Inquire control, a true sibling of the link so a tap on it goes to
 *  WhatsApp and nowhere else. */
function PieceCard({ piece, wide }: { piece: SkProduct; wide?: boolean }) {
  const cover = piece.images[0];

  const inquire = () => {
    window.open(
      whatsappForPiece({
        name: piece.name,
        code: piece.code,
        url: `${window.location.origin}/piece/${piece.handle}`,
      }),
      "_blank",
      "noopener,noreferrer",
    );
  };

  return (
    <article className={"cat-card" + (wide ? " cc-wide" : "")}>
      <div className="cc-img">
        <Link
          to="/piece/$handle"
          params={{ handle: piece.handle }}
          className="cc-photo"
          style={cover ? { backgroundImage: `url('${cover.url}')` } : undefined}
          aria-label={piece.name}
        />
        {piece.soldOut ? <span className="p-flag">Acquired</span> : null}
        <button
          className="cc-inquire"
          onClick={inquire}
          aria-label={`Inquire about ${piece.name} on WhatsApp`}
        >
          Inquire
        </button>
      </div>
      <Link to="/piece/$handle" params={{ handle: piece.handle }} className="cc-body">
        <h3>{piece.name}</h3>
        <p className="cc-sub">
          From {money(piece.price, piece.currency)} <span aria-hidden="true">•</span> Customizable
        </p>
      </Link>
    </article>
  );
}

function Empty({
  unreachable,
  narrowed,
  onWiden,
}: {
  unreachable: boolean;
  narrowed: boolean;
  onWiden: () => void;
}) {
  if (unreachable) {
    return (
      <div className="cat-empty">
        <p className="serif">The collection is momentarily out of reach.</p>
        <p>
          Please refresh, or write to{" "}
          <a href="mailto:sales@stantonkingdom.com">sales@stantonkingdom.com</a> and we will send
          you the pieces directly.
        </p>
      </div>
    );
  }

  if (narrowed) {
    return (
      <div className="cat-empty">
        <p className="serif">Nothing matches that combination, presently.</p>
        <p>There are other pieces here worth seeing.</p>
        <button className="btn btn-gold cat-empty-go" onClick={onWiden}>
          Show Everything
        </button>
      </div>
    );
  }

  return (
    <div className="cat-empty">
      <p className="serif">Pieces for this collection are being added.</p>
      <p>Tell us what you're looking for and we'll craft it — that's the point of bespoke.</p>
      <Link to="/" hash="begin" className="btn btn-gold cat-empty-go">
        Start Your Story
      </Link>
    </div>
  );
}
