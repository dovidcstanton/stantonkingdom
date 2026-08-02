/** Shared catalogue vocabulary and types.
 *
 *  Pure data and pure functions only — no server functions, no React — so this
 *  is safe to import from both the browser bundle and the SSR worker. The
 *  server-side Shopify calls live in ./shopify.functions.ts.
 *
 *  The taxonomy here is the single source of truth for three things that must
 *  agree or the catalogue silently shows nothing:
 *    1. the navigation menu in SiteHeader,
 *    2. the filters in the Catalog section,
 *    3. the metafield choice lists on the Shopify product form.
 *  If a value is added here it must be added to the matching Shopify metafield
 *  definition too, otherwise no product can ever carry it. */

/** Wildcard for any level of a selection. The menu lets you stop drilling at
 *  any depth — "View all Rings" leaves type and style open, "View all pieces"
 *  leaves all three — so each field independently needs a value meaning "don't
 *  filter on this". A sentinel that cannot collide with a real name, rather
 *  than reusing "Uniquely Yours", which is an actual style and would have shown
 *  up in the heading as a claim about the pieces listed. */
export const ANY = " any";

export const COLLECTION_TREE = [
  { name: "Rings", types: ["Engagement", "Wedding", "Eternity", "Haute Couture"] },
  { name: "Necklaces", types: ["Solitaires", "Pendants", "Riviera & Tennis", "Statement & Link"] },
  { name: "Bracelets", types: ["Tennis", "Bangles", "Statement & Link"] },
  { name: "Earrings", types: ["Studs & Clusters", "Hoops & Huggies", "Drops & Chandeliers"] },
] as const;

export const STYLES = ["Classic", "Trendsetting", "Vintage", "Uniquely Yours"] as const;

export const SHAPES = [
  "Round",
  "Oval",
  "Emerald",
  "Pear",
  "Cushion",
  "Radiant",
  "Princess",
  "Marquise",
  "Asscher",
  "Heart",
] as const;

export const SORTS = [
  { v: "new", label: "Newest Arrivals" },
  { v: "lo", label: "Price ↓" },
  { v: "hi", label: "Price ↑" },
] as const;

/** "Uniquely Yours" is a commissioning invitation rather than a filterable
 *  attribute — a bespoke piece is by definition not yet in the catalogue — so
 *  selecting it must not narrow the grid to nothing. */
export const STYLE_MATCHES_EVERYTHING = "Uniquely Yours";

/** The Shopify product option that carries metal. Matched case-insensitively
 *  because the option is typed by hand in the admin, and "metal" vs "Metal"
 *  should not decide whether the colour swatches appear. */
export const METAL_OPTION = "metal";

/** Swatch colours for the metals the house works in. A metal the site doesn't
 *  recognise still gets a button — it just renders without a swatch, so an
 *  unusual finish is never silently dropped from the page. */
export const METAL_SWATCHES: Record<string, string> = {
  platinum: "linear-gradient(135deg,#F2F2F0,#D3D5D8)",
  "white gold": "linear-gradient(135deg,#F4F4F2,#DADBDC)",
  "yellow gold": "linear-gradient(135deg,#F0D695,#D4A94E)",
  "rose gold": "linear-gradient(135deg,#F2CFC0,#D79C86)",
};

/* ------------------------------------------------------------------ slugs */

/** URL segment for a taxonomy name. Ampersands become nothing rather than
 *  "and" — "Riviera & Tennis" reads better as `riviera-tennis` than as
 *  `riviera-and-tennis`, and the reverse lookup below never has to guess,
 *  because it compares against the same function's output. */
export const slug = (name: string) =>
  name
    .toLowerCase()
    .replace(/&/g, " ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/** Resolve a URL segment back to its canonical category name, or null if it
 *  names nothing the house sells — which the route turns into a 404 rather
 *  than an empty grid, so a typo'd URL says so instead of implying we stock
 *  nothing. */
export function categoryFromSlug(s: string): string | null {
  return COLLECTION_TREE.find((c) => slug(c.name) === s)?.name ?? null;
}

/** Resolve a type segment within a known category. Scoped to the category
 *  because "Statement & Link" and "Tennis" each live under two of them, so a
 *  global lookup would resolve to whichever happened to be listed first. */
export function typeFromSlug(category: string, s: string): string | null {
  const cat = COLLECTION_TREE.find((c) => c.name === category);
  return cat?.types.find((t) => slug(t) === s) ?? null;
}

/** Path for any depth of selection, so links are built in one place rather
 *  than assembled from string fragments at each call site. */
export function collectionPath(category?: string, type?: string) {
  if (!category) return "/collection";
  if (!type) return `/collection/${slug(category)}`;
  return `/collection/${slug(category)}/${slug(type)}`;
}

/** Style stays a search param rather than a fourth path segment.
 *
 *  It is a cross-cutting adjective — there are Vintage rings and Vintage
 *  necklaces — so promoting it to a path would multiply every collection by
 *  four near-identical URLs competing with each other in search results. As a
 *  param it still survives being shared, which is what the side menu's third
 *  drill level needs. An unrecognised value is dropped rather than filtered on,
 *  so a mangled URL shows the collection instead of an empty grid. */
export type CollectionSearch = { style?: string };

export function validateCollectionSearch(raw: Record<string, unknown>): CollectionSearch {
  const style = typeof raw.style === "string" ? raw.style : undefined;
  return style && (STYLES as readonly string[]).includes(style) ? { style } : {};
}

export type SkImage = { url: string; alt: string; width: number | null; height: number | null };

export type SkVariant = {
  id: string;
  title: string;
  available: boolean;
  price: number;
  compareAt: number | null;
  /** Ordered option values for this variant, e.g. [{name:"Size", value:"6.5"}]. */
  options: { name: string; value: string }[];
};

/** How a client acquires the piece. Set per product in Shopify via the
 *  "How It Is Acquired" metafield; anything unset falls back to "inquire",
 *  because quietly putting an Add to Cart button on a piece David meant to
 *  sell in person is the more damaging of the two possible mistakes. */
export type Acquisition = "cart" | "inquire";

export type SkProduct = {
  id: string;
  handle: string;
  name: string;
  description: string;
  descriptionHtml: string;
  /** The short technical line under the title, from the Specification metafield. */
  spec: string;
  category: string;
  type: string;
  style: string;
  shape: string;
  acquisition: Acquisition;
  price: number;
  compareAt: number | null;
  currency: string;
  /** true when every variant is sold out — the piece still shows, as a record
   *  of the house's work, but it cannot be added to a cart. */
  soldOut: boolean;
  date: string;
  images: SkImage[];
  variants: SkVariant[];
};

export type SkCartLine = {
  id: string;
  quantity: number;
  variantId: string;
  variantTitle: string;
  productTitle: string;
  handle: string;
  image: string | null;
  price: number;
  currency: string;
};

export type SkCart = {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  subtotal: number;
  currency: string;
  lines: SkCartLine[];
};

/** What the catalogue got back from Shopify. `configured` separates "the store
 *  credentials are missing" from "the store is connected and genuinely empty",
 *  which need different messages — one is David's problem, the other is a
 *  normal state of a new atelier. */
export type CatalogPayload = {
  configured: boolean;
  products: SkProduct[];
};

export type CatalogSelection = { category: string; type: string; style: string } | null;

export const money = (n: number, currency = "USD") =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: n % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(n);

/** Heading text for a selection, so "all of something" reads as English rather
 *  than as a filter dump. */
export function selectionLabels(sel: { category: string; type: string; style: string }) {
  const anyCat = sel.category === ANY;
  const anyType = sel.type === ANY;
  const anyStyle = sel.style === ANY;
  if (anyCat) return { eyebrow: "The Collection", title: "Every Piece" };
  if (anyType) return { eyebrow: sel.category, title: "All " + sel.category };
  return {
    eyebrow: `${sel.category} — ${sel.type}`,
    title: anyStyle ? "All Styles" : sel.style,
  };
}

/** Does a piece belong in the grid for this selection? Each level is
 *  independently wildcardable, so this is three separate tests rather than one
 *  path comparison. */
export function matchesSelection(
  p: SkProduct,
  sel: { category: string; type: string; style: string },
  shape: string,
) {
  if (sel.category !== ANY && p.category !== sel.category) return false;
  if (sel.type !== ANY && p.type !== sel.type) return false;
  if (sel.style !== ANY && sel.style !== STYLE_MATCHES_EVERYTHING && p.style !== sel.style)
    return false;
  if (shape !== "all" && p.shape !== shape) return false;
  return true;
}

export function sortProducts(items: SkProduct[], sort: string) {
  const out = [...items];
  if (sort === "new") return out.sort((a, b) => b.date.localeCompare(a.date));
  if (sort === "lo") return out.sort((a, b) => a.price - b.price);
  if (sort === "hi") return out.sort((a, b) => b.price - a.price);
  return out;
}

/** Only offer a shape filter for shapes actually present in the current grid.
 *  A row of ten shape buttons where eight lead to an empty result reads as a
 *  broken catalogue rather than a small one. */
export function availableShapes(items: SkProduct[]) {
  const present = new Set(items.map((p) => p.shape).filter(Boolean));
  return SHAPES.filter((s) => present.has(s));
}
