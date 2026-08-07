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

/** Is the catalogue itself open to the public yet?
 *
 *  false hides the FINAL destinations only — the pages that list actual pieces
 *  (/collection, /collection/rings, /collection/rings/engagement?style=…). They
 *  render the holding page instead. Nothing about the navigation changes: the
 *  side menu still drills Jewelry → Rings → Engagement → Classic exactly as it
 *  does today, every level, every transition, every breadcrumb — a visitor only
 *  meets the holding page at the moment they ask for the results themselves.
 *
 *  CollectionView, the piece page and everything behind them are untouched and
 *  still compile; this is a curtain, not a demolition. Flip to true to open.
 *
 *  true on the DEVELOPMENT branch while the catalogue experience is being
 *  built — the dev Worker needs the pages visible to evaluate them. Any
 *  promotion of this branch to production must decide this flag deliberately. */
export const CATALOGUE_LIVE = true;

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

/** Every cut the house recognises, in display order. Adding one here requires
 *  adding it to the Shopify stone_shape metafield definition too. A product's
 *  stone_shape may carry SEVERAL of these, comma-separated — a drop earring
 *  can hold a marquise over a pear — see productShapes(). */
export const SHAPES = [
  "Round",
  "Oval",
  "Pear",
  "Emerald",
  "Radiant",
  "Elongated Radiant",
  "Cushion",
  "Princess",
  "Marquise",
  "Asscher",
  "Heart",
] as const;

/** The shapes a piece belongs to. The metafield is a single line in the admin;
 *  a comma makes it several memberships, so one piece can answer more than one
 *  filter without duplicating the product. */
export const productShapes = (p: { shape: string }) =>
  p.shape
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

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

/* ------------------------------------------------- metal colour and purity */

/** The two metal axes a piece can carry as Shopify options.
 *
 *  "Metal" is the PURITY axis — 14K Gold, 18K Gold, Platinum — and "Metal
 *  Colour" (or "Metal Color"; both admin spellings match) is the COLOUR axis:
 *  White, Yellow or Rose Gold. Platinum is deliberately not a colour: a
 *  platinum piece is white by nature, so its variants exist only against
 *  White Gold's colourway and the UI forces white when platinum is chosen. */
export const METAL_COLORS = ["White Gold", "Yellow Gold", "Rose Gold"] as const;
export type MetalColor = (typeof METAL_COLORS)[number];
export const METAL_PURITIES = ["14K Gold", "18K Gold", "Platinum"] as const;

/** The third configuration axis: where the stone comes from. Like the metal
 *  axes it is a Shopify product option ("Diamond Origin"), present only on
 *  products that offer the choice. */
export const DIAMOND_ORIGINS = ["Natural", "Lab-Grown"] as const;

export const isMetalOption = (name: string) => name.trim().toLowerCase() === METAL_OPTION;
export const isMetalColorOption = (name: string) =>
  /^metal[\s-]*colou?r$/.test(name.trim().toLowerCase());
export const isOriginOption = (name: string) =>
  /^diamond[\s-]*origin$/.test(name.trim().toLowerCase());

const normalizeColor = (value: string): MetalColor | null => {
  const v = value.trim().toLowerCase();
  return (
    ((METAL_COLORS as readonly string[]).find((c) => c.toLowerCase() === v) as MetalColor) ??
    (v === "white"
      ? "White Gold"
      : v === "yellow"
        ? "Yellow Gold"
        : v === "rose"
          ? "Rose Gold"
          : null)
  );
};

export type MetalCombo = {
  origin: string | null;
  purity: string | null;
  color: MetalColor | null;
  variant: SkVariant;
};

/** Every (origin, purity, colour) combination the product's variants actually
 *  offer, so the selectors can only ever lead somewhere real. Axes come back
 *  in the house's canonical order regardless of admin entry order; an axis no
 *  variant carries returns an empty list and draws no control. */
export function configMatrix(variants: SkVariant[]) {
  const combos: MetalCombo[] = [];
  const origins = new Set<string>();
  const purities = new Set<string>();
  const colors = new Set<MetalColor>();
  for (const v of variants) {
    const origin = v.options.find((o) => isOriginOption(o.name))?.value.trim() || null;
    const purity = v.options.find((o) => isMetalOption(o.name))?.value.trim() || null;
    const rawColor = v.options.find((o) => isMetalColorOption(o.name))?.value ?? "";
    const color = rawColor ? normalizeColor(rawColor) : null;
    if (origin) origins.add(origin);
    if (purity) purities.add(purity);
    if (color) colors.add(color);
    if (origin || purity || color) combos.push({ origin, purity, color, variant: v });
  }
  const order = (canon: readonly string[], present: Set<string>) => [
    ...canon.filter((x) => present.has(x)),
    ...[...present].filter((x) => !canon.includes(x)),
  ];
  return {
    combos,
    origins: order(DIAMOND_ORIGINS, origins),
    purities: order(METAL_PURITIES, purities),
    colors: METAL_COLORS.filter((c) => colors.has(c)),
    /** Does any variant satisfy the given axes? Omit an axis to ignore it. */
    some: (q: { origin?: string | null; purity?: string | null; color?: MetalColor | null }) =>
      combos.some(
        (c) =>
          (q.origin === undefined || c.origin === q.origin) &&
          (q.purity === undefined || c.purity === q.purity) &&
          (q.color === undefined || c.color === q.color),
      ),
  };
}

/** Whether the certification accordion applies: any stated stone at or above a
 *  full carat. Reads the details rows and the spec line, so it follows the
 *  product data rather than being asserted per piece. */
export function needsCertification(p: { details: [string, string][]; spec: string }) {
  const texts = [p.spec, ...p.details.map(([, v]) => v)];
  return texts.some((t) =>
    [...t.matchAll(/(\d+(?:\.\d+)?)\s*ct/gi)].some((m) => parseFloat(m[1]) >= 1),
  );
}

/* -------------------------------------------------------- gallery grouping */

/** Which colourway a gallery image belongs to is written in its alt text as a
 *  leading token — "#white-gold A ring turned to the light" — because alt text
 *  is the one field the Shopify media manager lets David edit per image
 *  without an app. The token is stripped before the alt reaches a screen
 *  reader. Untagged images are the piece's signature shots: they open the
 *  rail, ahead of the colour groups, and belong to no colour. */
const COLOR_TOKEN = /^\s*#(white|yellow|rose)[\s-]*gold\b[\s:—-]*/i;

export function imageColor(img: SkImage): MetalColor | null {
  const m = img.alt.match(COLOR_TOKEN);
  if (!m) return null;
  return normalizeColor(m[1] + " gold");
}

export const cleanAlt = (img: SkImage) => img.alt.replace(COLOR_TOKEN, "").trim();

export type GallerySlide = { img: SkImage; color: MetalColor | null };

/** The rail's slide order: signature shots first, then White, Yellow, Rose —
 *  a fixed order so the same swipe direction always moves through the metals
 *  the same way, whatever order the images were uploaded in. */
export function galleryPlan(images: SkImage[]) {
  const slides: GallerySlide[] = [
    ...images.filter((i) => imageColor(i) === null).map((img) => ({ img, color: null })),
    ...METAL_COLORS.flatMap((c) =>
      images.filter((i) => imageColor(i) === c).map((img) => ({ img, color: c })),
    ),
  ];
  const firstIndex = (color: MetalColor) => slides.findIndex((s) => s.color === color);
  return { slides, firstIndex };
}

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

export type SkImage = {
  url: string;
  alt: string;
  width: number | null;
  height: number | null;
  /** PROTOTYPE ONLY — set by the sample catalogue, never by Shopify data.
   *  The sample library has one photograph per piece, so the metal groups
   *  tint it in CSS to stay visually tellable-apart while the rail mechanics
   *  are evaluated. Real products carry real per-metal photography instead. */
  tint?: "white" | "yellow" | "rose";
};

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
  /** The house reference for the piece — SK-RING-SOV — from the
   *  custom.product_code metafield, with the first variant's SKU stem as the
   *  fallback. Travels in every WhatsApp enquiry so the advisor knows the
   *  piece without asking. */
  code: string;
  /** Factual specification rows for the Product Details accordion, parsed from
   *  the custom.details metafield: one "Label: value" per line. */
  details: [string, string][];
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
  if (shape !== "all" && !productShapes(p).includes(shape)) return false;
  return true;
}

export function sortProducts(items: SkProduct[], sort: string) {
  const out = [...items];
  if (sort === "new") return out.sort((a, b) => b.date.localeCompare(a.date));
  if (sort === "lo") return out.sort((a, b) => a.price - b.price);
  if (sort === "hi") return out.sort((a, b) => b.price - a.price);
  return out;
}

/** Shapes actually present in a set of pieces, multi-membership included.
 *  The collection's shape row shows the FULL canon regardless — the selector
 *  is a statement of what the house cuts — but search and future rails still
 *  want to know what a given set actually holds. */
export function availableShapes(items: SkProduct[]) {
  const present = new Set(items.flatMap((p) => productShapes(p)));
  return SHAPES.filter((s) => present.has(s));
}
