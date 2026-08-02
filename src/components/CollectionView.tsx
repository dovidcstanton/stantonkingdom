/** The body of every collection page.
 *
 *  One component behind three routes (/collection, /collection/$category and
 *  /collection/$category/$type) because the three differ only in how far the
 *  selection is drilled — the header, the shape filter and the grid are
 *  identical, and keeping them identical is the point. */

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";

import { fetchCatalog } from "@/lib/shopify.functions";
import {
  SORTS,
  STYLE_MATCHES_EVERYTHING,
  availableShapes,
  collectionPath,
  money,
  sortProducts,
  type SkProduct,
} from "@/lib/catalog";
import { CategoryBar } from "@/components/CategoryBar";
import { ShapeMark } from "@/components/ShapeMark";
import { SiteFooter } from "@/components/SiteFooter";

export function CollectionView({
  category,
  type,
  style,
}: {
  category: string | null;
  type: string | null;
  style: string | null;
}) {
  const [shape, setShape] = useState<string | null>(null);
  const [sort, setSort] = useState<string>("new");

  const { data, isPending, isError } = useQuery({
    queryKey: ["catalog"],
    queryFn: () => fetchCatalog(),
    staleTime: 5 * 60 * 1000,
  });

  const products = useMemo(() => data?.products ?? [], [data]);

  // Everything in this category/type, before the shape filter — the shape row
  // is built from this so it only ever offers shapes that lead somewhere.
  const inSelection = useMemo(
    () =>
      products.filter(
        (p) =>
          (category === null || p.category === category) &&
          (type === null || p.type === type) &&
          // "Uniquely Yours" is an invitation to commission, not an attribute
          // any finished piece carries, so it must never narrow the grid.
          (style === null || style === STYLE_MATCHES_EVERYTHING || p.style === style),
      ),
    [products, category, type, style],
  );

  const shapes = useMemo(() => availableShapes(inSelection), [inSelection]);

  const items = useMemo(
    () => sortProducts(inSelection.filter((p) => !shape || p.shape === shape), sort),
    [inSelection, shape, sort],
  );

  const heading = type ?? category ?? "All Pieces";
  const unreachable = isError || data?.configured === false;

  return (
    <>
      <CategoryBar category={category} type={type} />

      {shapes.length > 1 ? (
        <div className="shapes">
          <div className="wrap shaperow">
            <span className="shapelab">Stone Shape</span>
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
        </div>
      ) : null}

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
            {/* Style arrives from the side menu's third level and has no
                control of its own on this page, so it shows as a chip that
                says what is being hidden and offers the way out. */}
            {style && style !== STYLE_MATCHES_EVERYTHING ? (
              <Link
                to={collectionPath(category ?? undefined, type ?? undefined)}
                className="coll-chip"
              >
                {style} <span aria-hidden="true">×</span>
                <span className="sr-only">Remove the {style} filter</span>
              </Link>
            ) : null}
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

          {isPending ? (
            <div className="coll-grid" aria-busy="true">
              {Array.from({ length: 8 }, (_, i) => (
                <div key={i} className="p-card p-skeleton" aria-hidden="true">
                  <div className="p-img" />
                  <div className="p-body">
                    <span className="sk-bar w70" />
                    <span className="sk-bar w40" />
                  </div>
                </div>
              ))}
            </div>
          ) : items.length ? (
            <div className="coll-grid">
              {items.map((p) => (
                <PieceCard key={p.id} piece={p} />
              ))}
            </div>
          ) : (
            <Empty
              unreachable={unreachable}
              narrowed={Boolean(shape) && inSelection.length > 0}
              onWiden={() => setShape(null)}
            />
          )}
        </div>
      </main>

      <SiteFooter />
    </>
  );
}

function PieceCard({ piece }: { piece: SkProduct }) {
  const cover = piece.images[0];
  return (
    <Link to="/piece/$handle" params={{ handle: piece.handle }} className="p-card">
      <div className="p-img">
        <div style={cover ? { backgroundImage: `url('${cover.url}')` } : undefined} />
        {piece.soldOut ? <span className="p-flag">Acquired</span> : null}
      </div>
      <div className="p-body">
        <h3>{piece.name}</h3>
        {piece.shape || piece.style ? (
          <div className="p-spec">{[piece.shape, piece.style].filter(Boolean).join(" · ")}</div>
        ) : null}
        <div className="p-price">
          <span>{money(piece.price, piece.currency)}</span>
          <span className={"p-tag" + (piece.acquisition === "cart" && !piece.soldOut ? " buy" : "")}>
            {piece.soldOut ? "Acquired" : piece.acquisition === "cart" ? "Available" : "Enquire"}
          </span>
        </div>
      </div>
    </Link>
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
          <a href="mailto:sales@stantonkingdom.com">sales@stantonkingdom.com</a> and we will
          send you the pieces directly.
        </p>
      </div>
    );
  }

  if (narrowed) {
    return (
      <div className="cat-empty">
        <p className="serif">Nothing in that shape, presently.</p>
        <p>There are other pieces here worth seeing.</p>
        <button className="btn btn-gold cat-empty-go" onClick={onWiden}>
          Show Every Shape
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
