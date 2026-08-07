/** Server-side Shopify Storefront API access.
 *
 *  Everything here runs on the server only. The Storefront token is read from
 *  the environment and never reaches the browser bundle — the browser calls
 *  these as RPC endpoints via TanStack Start's createServerFn. That matters
 *  less for a Storefront token (it is read-only and designed to be public) than
 *  for keeping one place that knows how to talk to Shopify.
 *
 *  Required environment variables:
 *    SHOPIFY_DOMAIN            stanton-kingdom-atelier-dyc8z.myshopify.com
 *    SHOPIFY_STOREFRONT_TOKEN  the Storefront API access token
 *  Locally these live in .dev.vars; in production they are Cloudflare Worker
 *  secrets. When either is absent every call returns an unconfigured payload
 *  rather than throwing, so the site still renders — it simply has no stock. */

import { createServerFn } from "@tanstack/react-start";
import { type Acquisition, type CatalogPayload, type SkCart, type SkProduct } from "./catalog";
import { SAMPLE_CATALOG, sampleByHandle } from "./sample-catalog";

/** The prototype's stand-in stock. Served ONLY when the SK_SAMPLE_CATALOG
 *  environment flag is set AND no Shopify credentials exist — the flag lives
 *  on the dev Worker and in local .dev.vars, never on production, so a
 *  production credential mishap degrades to an empty catalogue exactly as it
 *  does today rather than quietly exhibiting sample pieces. */
const sampleMode = () => process.env.SK_SAMPLE_CATALOG === "1";

const API_VERSION = "2025-01";

/** Metafields the site reads. Kept in one list because the Storefront API wants
 *  them as explicit identifiers — there is no "give me everything" form — and
 *  because forgetting one here is otherwise a silent empty string downstream. */
const METAFIELD_KEYS = [
  "category",
  "piece_type",
  "style",
  "stone_shape",
  "acquisition",
  "specification",
  "product_code",
  "details",
] as const;

const METAFIELD_IDENTIFIERS = METAFIELD_KEYS.map((k) => `{namespace:"custom",key:"${k}"}`).join(
  ",",
);

const PRODUCT_FIELDS = `
  id
  handle
  title
  description
  descriptionHtml
  createdAt
  availableForSale
  images(first: 12) { edges { node { url altText width height } } }
  priceRange { minVariantPrice { amount currencyCode } }
  compareAtPriceRange { minVariantPrice { amount currencyCode } }
  metafields(identifiers: [${METAFIELD_IDENTIFIERS}]) { key value }
  variants(first: 50) {
    edges {
      node {
        id
        title
        sku
        availableForSale
        price { amount currencyCode }
        compareAtPrice { amount currencyCode }
        selectedOptions { name value }
      }
    }
  }
`;

const CART_FIELDS = `
  id
  checkoutUrl
  totalQuantity
  cost { subtotalAmount { amount currencyCode } }
  lines(first: 50) {
    edges {
      node {
        id
        quantity
        merchandise {
          ... on ProductVariant {
            id
            title
            price { amount currencyCode }
            image { url }
            product { title handle }
          }
        }
      }
    }
  }
`;

type StorefrontResult<T> = { data?: T; errors?: { message: string }[] };

function credentials() {
  const domain = process.env.SHOPIFY_DOMAIN;
  const token = process.env.SHOPIFY_STOREFRONT_TOKEN;
  if (!domain || !token) return null;
  return { domain, token };
}

/** One request to the Storefront API. Returns null on any failure — missing
 *  credentials, network error, or a GraphQL error list — because a storefront
 *  that half-renders is better than one that shows an error page, and the
 *  callers all have a meaningful empty state. Failures are logged so they are
 *  visible in `wrangler tail` rather than disappearing. */
async function storefront<T>(
  query: string,
  variables: Record<string, unknown> = {},
): Promise<T | null> {
  const creds = credentials();
  if (!creds) return null;

  try {
    const res = await fetch(`https://${creds.domain}/api/${API_VERSION}/graphql.json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": creds.token,
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!res.ok) {
      console.error(`Shopify Storefront ${res.status} ${res.statusText}`);
      return null;
    }

    const payload = (await res.json()) as StorefrontResult<T>;
    if (payload.errors?.length) {
      console.error("Shopify Storefront errors:", payload.errors.map((e) => e.message).join("; "));
      return null;
    }
    return payload.data ?? null;
  } catch (err) {
    console.error("Shopify Storefront request failed:", err);
    return null;
  }
}

const num = (v: string | null | undefined) => {
  const n = parseFloat(v ?? "");
  return Number.isFinite(n) ? n : 0;
};

/** Shopify returns an entry for every requested identifier, with a null value
 *  where the merchant has not filled that field in, so this flattens to a
 *  plain lookup with "" for absent. */
function readMetafields(raw: ({ key: string; value: string | null } | null)[] | undefined) {
  const map: Record<string, string> = {};
  for (const m of raw ?? []) {
    if (m?.key) map[m.key] = m.value ?? "";
  }
  return map;
}

/** The metafield is a human-facing phrase on the Shopify product form; the site
 *  wants a stable token. Anything not explicitly "Add to Cart" is treated as an
 *  enquiry, including blank — see the Acquisition type for why that default. */
function readAcquisition(value: string): Acquisition {
  return value.trim().toLowerCase() === "add to cart" ? "cart" : "inquire";
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function toProduct(n: any): SkProduct {
  const mf = readMetafields(n.metafields);
  const variants = (n.variants?.edges ?? []).map(({ node: v }: any) => ({
    id: v.id,
    title: v.title,
    available: Boolean(v.availableForSale),
    price: num(v.price?.amount),
    compareAt: v.compareAtPrice ? num(v.compareAtPrice.amount) : null,
    options: (v.selectedOptions ?? []).map((o: any) => ({ name: o.name, value: o.value })),
  }));

  const compareAt = num(n.compareAtPriceRange?.minVariantPrice?.amount);
  const price = num(n.priceRange?.minVariantPrice?.amount);

  // The house reference: the product_code metafield, or the first variant's
  // SKU with any trailing size/variant suffix ("-65") trimmed away.
  const code =
    (mf.product_code ?? "").trim() ||
    String(n.variants?.edges?.[0]?.node?.sku ?? "")
      .replace(/-\d+$/, "")
      .trim();

  // custom.details is authored one row per line as "Label: value"; anything
  // without a colon is skipped rather than rendered as a broken row.
  const details = String(mf.details ?? "")
    .split("\n")
    .map((line): [string, string] | null => {
      const at = line.indexOf(":");
      if (at < 1) return null;
      return [line.slice(0, at).trim(), line.slice(at + 1).trim()];
    })
    .filter((r): r is [string, string] => r !== null && Boolean(r[0]) && Boolean(r[1]));

  return {
    id: n.id,
    handle: n.handle,
    name: n.title,
    description: n.description ?? "",
    descriptionHtml: n.descriptionHtml ?? "",
    spec: mf.specification ?? "",
    category: mf.category ?? "",
    type: mf.piece_type ?? "",
    style: mf.style ?? "",
    shape: mf.stone_shape ?? "",
    acquisition: readAcquisition(mf.acquisition ?? ""),
    code,
    details,
    price,
    // Only a genuine markdown counts; Shopify reports the compare-at as equal
    // to the price when the merchant never set one.
    compareAt: compareAt > price ? compareAt : null,
    currency: n.priceRange?.minVariantPrice?.currencyCode ?? "USD",
    soldOut: !n.availableForSale,
    date: (n.createdAt ?? "").slice(0, 10),
    images: (n.images?.edges ?? []).map(({ node: i }: any) => ({
      url: i.url,
      alt: i.altText ?? n.title,
      width: i.width ?? null,
      height: i.height ?? null,
    })),
    variants,
  };
}

function toCart(c: any): SkCart {
  return {
    id: c.id,
    checkoutUrl: c.checkoutUrl,
    totalQuantity: c.totalQuantity ?? 0,
    subtotal: num(c.cost?.subtotalAmount?.amount),
    currency: c.cost?.subtotalAmount?.currencyCode ?? "USD",
    lines: (c.lines?.edges ?? []).map(({ node: l }: any) => ({
      id: l.id,
      quantity: l.quantity,
      variantId: l.merchandise?.id ?? "",
      variantTitle: l.merchandise?.title ?? "",
      productTitle: l.merchandise?.product?.title ?? "",
      handle: l.merchandise?.product?.handle ?? "",
      image: l.merchandise?.image?.url ?? null,
      price: num(l.merchandise?.price?.amount),
      currency: l.merchandise?.price?.currencyCode ?? "USD",
    })),
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/* ---------------------------------------------------------------- products */

/** Every published piece, for the catalogue grid.
 *
 *  250 is the Storefront API's per-page ceiling and comfortably more than the
 *  house will hold for a long while; when it stops being enough this needs
 *  cursor pagination rather than a bigger number. Draft products are invisible
 *  to the Storefront API by design, which is what makes the preview drafts safe
 *  to leave in the store while the site is public. */
export const fetchCatalog = createServerFn({ method: "GET" }).handler(
  async (): Promise<CatalogPayload> => {
    if (!credentials()) {
      if (sampleMode()) return { configured: true, products: SAMPLE_CATALOG };
      return { configured: false, products: [] };
    }

    const data = await storefront<{ products: { edges: { node: unknown }[] } }>(
      `{ products(first: 250, sortKey: CREATED_AT, reverse: true) {
        edges { node { ${PRODUCT_FIELDS} } }
      } }`,
    );
    if (!data) return { configured: true, products: [] };

    return {
      configured: true,
      products: (data.products?.edges ?? []).map(({ node }) => toProduct(node)),
    };
  },
);

/** A single piece for its own page. Returns null for an unknown or unpublished
 *  handle so the route can render a proper 404 instead of an empty shell. */
export const fetchPiece = createServerFn({ method: "GET" })
  .inputValidator((handle: string) => handle)
  .handler(async ({ data: handle }): Promise<SkProduct | null> => {
    if (!credentials()) return sampleMode() ? sampleByHandle(handle) : null;

    const data = await storefront<{ product: unknown | null }>(
      `query Piece($handle: String!) {
        product(handle: $handle) { ${PRODUCT_FIELDS} }
      }`,
      { handle },
    );
    if (!data?.product) return null;
    return toProduct(data.product);
  });

/* -------------------------------------------------------------------- cart */

/** Fetch an existing cart by id.
 *
 *  Shopify expires carts, and a cart id kept in localStorage outlives that, so
 *  a null here is an ordinary outcome meaning "start a new one" rather than an
 *  error. */
export const fetchCart = createServerFn({ method: "GET" })
  .inputValidator((cartId: string) => cartId)
  .handler(async ({ data: cartId }): Promise<SkCart | null> => {
    const data = await storefront<{ cart: unknown | null }>(
      `query Cart($id: ID!) { cart(id: $id) { ${CART_FIELDS} } }`,
      { id: cartId },
    );
    if (!data?.cart) return null;
    return toCart(data.cart);
  });

/** Add a variant to the cart, creating the cart if there isn't a live one.
 *
 *  Create-or-add is one operation rather than two because the caller cannot
 *  know whether its stored cart id is still valid until it tries, and splitting
 *  it would mean a failed add followed by a create followed by a second add. */
export const addToCart = createServerFn({ method: "POST" })
  .inputValidator((d: { cartId: string | null; variantId: string; quantity?: number }) => d)
  .handler(async ({ data }): Promise<SkCart | null> => {
    const lines = [{ merchandiseId: data.variantId, quantity: data.quantity ?? 1 }];

    if (data.cartId) {
      const added = await storefront<{ cartLinesAdd: { cart: unknown | null } }>(
        `mutation Add($id: ID!, $lines: [CartLineInput!]!) {
          cartLinesAdd(cartId: $id, lines: $lines) {
            cart { ${CART_FIELDS} }
            userErrors { message }
          }
        }`,
        { id: data.cartId, lines },
      );
      if (added?.cartLinesAdd?.cart) return toCart(added.cartLinesAdd.cart);
      // Fall through: the stored cart was expired or invalid, so make a new one.
    }

    const created = await storefront<{ cartCreate: { cart: unknown | null } }>(
      `mutation Create($lines: [CartLineInput!]!) {
        cartCreate(input: { lines: $lines }) {
          cart { ${CART_FIELDS} }
          userErrors { message }
        }
      }`,
      { lines },
    );
    if (!created?.cartCreate?.cart) return null;
    return toCart(created.cartCreate.cart);
  });

/** Change a line's quantity. A quantity of 0 removes the line, which is what
 *  the drawer's minus button reaches at the bottom of its range. */
export const setCartLineQuantity = createServerFn({ method: "POST" })
  .inputValidator((d: { cartId: string; lineId: string; quantity: number }) => d)
  .handler(async ({ data }): Promise<SkCart | null> => {
    if (data.quantity <= 0) {
      const removed = await storefront<{ cartLinesRemove: { cart: unknown | null } }>(
        `mutation Remove($id: ID!, $lineIds: [ID!]!) {
          cartLinesRemove(cartId: $id, lineIds: $lineIds) {
            cart { ${CART_FIELDS} }
            userErrors { message }
          }
        }`,
        { id: data.cartId, lineIds: [data.lineId] },
      );
      if (!removed?.cartLinesRemove?.cart) return null;
      return toCart(removed.cartLinesRemove.cart);
    }

    const updated = await storefront<{ cartLinesUpdate: { cart: unknown | null } }>(
      `mutation Update($id: ID!, $lines: [CartLineUpdateInput!]!) {
        cartLinesUpdate(cartId: $id, lines: $lines) {
          cart { ${CART_FIELDS} }
          userErrors { message }
        }
      }`,
      { id: data.cartId, lines: [{ id: data.lineId, quantity: data.quantity }] },
    );
    if (!updated?.cartLinesUpdate?.cart) return null;
    return toCart(updated.cartLinesUpdate.cart);
  });
