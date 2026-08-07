/** The body of every collection page.
 *
 *  One component behind three routes (/collection, /collection/$category and
 *  /collection/$category/$type) because the three differ only in how far the
 *  selection is drilled — the header, the controls and the grid are identical,
 *  and keeping them identical is the point.
 *
 *  The screen keeps exactly three immediate controls — Style, the shape row,
 *  and Filter — over a white page. Everything secondary (layout mode, sort)
 *  lives inside the Filter sheet. Two layouts share one array of pieces:
 *
 *  EDITORIAL — the default — runs a repeating rhythm of two portrait cards
 *  side by side and then one full-width card. The large position is pure
 *  presentation: whichever piece falls third in the current sort is drawn
 *  bigger. The array is mapped once, keyed by id, so nothing appears twice.
 *
 *  COMPACT is a plain two-column grid for visitors who want the overview
 *  rather than the promenade. */

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import * as Popover from "@radix-ui/react-popover";
import { Drawer } from "vaul";

import { fetchCatalog } from "@/lib/shopify.functions";
import {
  SHAPES,
  SORTS,
  STYLES,
  STYLE_MATCHES_EVERYTHING,
  money,
  productShapes,
  sortProducts,
  type SkProduct,
} from "@/lib/catalog";
import { CategoryBar } from "@/components/CategoryBar";
import { InquiryDialog } from "@/components/InquiryDialog";
import { PieceCard } from "@/components/PieceCard";
import { ShapeMark } from "@/components/ShapeMark";

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
  // Style control on the page, whichever door the visitor came in through.
  const [styleFilter, setStyleFilter] = useState<string | null>(style);
  const [styleOpen, setStyleOpen] = useState(false);

  // The Filter sheet edits a draft and commits on Apply — closing it without
  // applying leaves the grid exactly as it was.
  const [sheetOpen, setSheetOpen] = useState(false);
  const [draftLayout, setDraftLayout] = useState<Layout>(layout);
  const [draftSort, setDraftSort] = useState<string>(sort);

  const [inquiring, setInquiring] = useState<SkProduct | null>(null);

  const { data, isPending, isError } = useQuery({
    queryKey: ["catalog"],
    queryFn: () => fetchCatalog(),
    staleTime: 5 * 60 * 1000,
  });

  const products = useMemo(() => data?.products ?? [], [data]);

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

  const items = useMemo(
    () =>
      sortProducts(
        inSelection.filter((p) => !shape || productShapes(p).includes(shape)),
        sort,
      ),
    [inSelection, shape, sort],
  );

  const heading = type ?? category ?? "All Pieces";
  const unreachable = isError || data?.configured === false;
  const gridClass = layout === "editorial" ? "cat-flow cat-mosaic" : "cat-flow cat-compact";

  const openSheet = () => {
    setDraftLayout(layout);
    setDraftSort(sort);
    setSheetOpen(true);
  };

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
          </div>

          {/* Style, then the shape row, then Filter — the three immediate
              controls, everything else behind the third. */}
          <div className="cat-controls">
            <Popover.Root open={styleOpen} onOpenChange={setStyleOpen}>
              <Popover.Trigger className="glass-pill" aria-label="Filter by style">
                {styleFilter ?? "Style"}
                <svg className="pill-chev" viewBox="0 0 10 6" aria-hidden="true">
                  <path
                    d="M1 1.2 5 5 9 1.2"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                  />
                </svg>
              </Popover.Trigger>
              <Popover.Portal>
                <Popover.Content className="style-pop" sideOffset={8} align="start">
                  <button
                    className={"style-opt" + (styleFilter === null ? " on" : "")}
                    onClick={() => {
                      setStyleFilter(null);
                      setStyleOpen(false);
                    }}
                  >
                    All Styles
                  </button>
                  {STYLES.map((s) => (
                    <button
                      key={s}
                      className={"style-opt" + (styleFilter === s ? " on" : "")}
                      onClick={() => {
                        setStyleFilter(styleFilter === s ? null : s);
                        setStyleOpen(false);
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </Popover.Content>
              </Popover.Portal>
            </Popover.Root>

            <button className="glass-pill" onClick={openSheet}>
              Filter
              <svg className="pill-chev" viewBox="0 0 12 10" aria-hidden="true">
                <path
                  d="M1 2h10M3 5h6M5 8h2"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>

          {/* The full canon of cuts, always — the row states what the house
              works in. Swipes sideways; nothing is boxed. */}
          <div className="shape-row" role="group" aria-label="Filter by diamond shape">
            <button
              className={"shp shp-all" + (shape === null ? " on" : "")}
              onClick={() => setShape(null)}
              aria-pressed={shape === null}
            >
              <span className="shp-name">All</span>
            </button>
            {SHAPES.map((s) => (
              <button
                key={s}
                className={"shp" + (shape === s ? " on" : "")}
                onClick={() => setShape(shape === s ? null : s)}
                aria-pressed={shape === s}
              >
                <ShapeMark shape={s} />
                <span className="shp-name">{s}</span>
              </button>
            ))}
          </div>

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
                  <div className="cc-frame">
                    <div className="cc-photo" />
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
                  // Index-derived — a property of the position, never of the
                  // piece — so no product is ever duplicated to fill it.
                  wide={layout === "editorial" && i % 3 === 2}
                  onInquire={setInquiring}
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

      <Drawer.Root open={sheetOpen} onOpenChange={setSheetOpen}>
        <Drawer.Portal>
          <Drawer.Overlay className="sheet-scrim" />
          <Drawer.Content className="sheet">
            <div className="sheet-grip" aria-hidden="true" />
            <Drawer.Title className="sheet-title">Refine</Drawer.Title>

            <p className="sheet-label">Layout</p>
            <div className="sheet-opts">
              <button
                className={"sheet-opt" + (draftLayout === "editorial" ? " on" : "")}
                onClick={() => setDraftLayout("editorial")}
                aria-pressed={draftLayout === "editorial"}
              >
                Editorial mosaic
              </button>
              <button
                className={"sheet-opt" + (draftLayout === "grid" ? " on" : "")}
                onClick={() => setDraftLayout("grid")}
                aria-pressed={draftLayout === "grid"}
              >
                Compact grid
              </button>
            </div>

            <p className="sheet-label">Sort</p>
            <div className="sheet-opts">
              {SORTS.map((s) => (
                <button
                  key={s.v}
                  className={"sheet-opt" + (draftSort === s.v ? " on" : "")}
                  onClick={() => setDraftSort(s.v)}
                  aria-pressed={draftSort === s.v}
                >
                  {s.v === "new"
                    ? "Newest arrivals"
                    : s.v === "lo"
                      ? "Price: low to high"
                      : "Price: high to low"}
                </button>
              ))}
            </div>

            <div className="sheet-actions">
              <button
                className="sheet-clear"
                onClick={() => {
                  setDraftLayout("editorial");
                  setDraftSort("new");
                }}
              >
                Clear
              </button>
              <button
                className="btn btn-solid sheet-apply"
                onClick={() => {
                  setLayout(draftLayout);
                  setSort(draftSort);
                  setSheetOpen(false);
                }}
              >
                Apply
              </button>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>

      {inquiring ? <InquiryDialog piece={inquiring} onClose={() => setInquiring(null)} /> : null}
    </>
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
