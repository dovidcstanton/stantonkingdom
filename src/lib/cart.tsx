/** Cart state for the whole site.
 *
 *  Shopify owns the cart; this holds only the cart's id and a cached copy of
 *  what Shopify last told us it contained. The id lives in localStorage so a
 *  client can close the tab mid-decision — which, on a piece costing as much as
 *  a car, they will — and come back to it. Everything else is derived. */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { addToCart, fetchCart, setCartLineQuantity } from "./shopify.functions";
import { SAMPLE_CATALOG } from "./sample-catalog";
import type { SkCart } from "./catalog";

const STORAGE_KEY = "sk_cart_id";

/* ---- the sample basket ----
   The prototype's pieces have no Shopify variants behind them, so their ids
   ("sample:…") can never reach the Storefront cart API. They get a basket of
   their own: held in localStorage, shaped exactly like a Shopify cart, so the
   drawer renders it without knowing the difference. Its checkoutUrl is empty,
   which the drawer shows as a preview basket rather than a way to pay. Real
   variant ids never enter this path, and production never mints sample ids. */
const SAMPLE_CART_KEY = "sk_sample_cart";
const isSampleVariant = (id: string) => id.startsWith("sample:");
const isSampleLine = (id: string) => id.startsWith("sample-line:");

const readSampleCart = (): SkCart | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SAMPLE_CART_KEY);
    return raw ? (JSON.parse(raw) as SkCart) : null;
  } catch {
    return null;
  }
};

const writeSampleCart = (cart: SkCart | null) => {
  if (typeof window === "undefined") return;
  try {
    if (cart && cart.lines.length)
      window.localStorage.setItem(SAMPLE_CART_KEY, JSON.stringify(cart));
    else window.localStorage.removeItem(SAMPLE_CART_KEY);
  } catch {
    /* see readStoredId */
  }
};

const recomputeSampleTotals = (cart: SkCart) => {
  cart.totalQuantity = cart.lines.reduce((n, l) => n + l.quantity, 0);
  cart.subtotal = cart.lines.reduce((n, l) => n + l.quantity * l.price, 0);
};

function sampleCartAdd(variantId: string, quantity: number): SkCart | null {
  for (const p of SAMPLE_CATALOG) {
    const v = p.variants.find((x) => x.id === variantId);
    if (!v) continue;
    const cart = readSampleCart() ?? {
      id: "sample-cart",
      checkoutUrl: "",
      totalQuantity: 0,
      subtotal: 0,
      currency: p.currency,
      lines: [],
    };
    const existing = cart.lines.find((l) => l.variantId === variantId);
    if (existing) existing.quantity += quantity;
    else
      cart.lines.push({
        id: `sample-line:${variantId}`,
        quantity,
        variantId,
        variantTitle: v.title,
        productTitle: p.name,
        handle: p.handle,
        image: p.images[0]?.url ?? null,
        price: v.price,
        currency: p.currency,
      });
    recomputeSampleTotals(cart);
    writeSampleCart(cart);
    return cart;
  }
  return null;
}

function sampleCartSetQuantity(lineId: string, quantity: number): SkCart | null {
  const cart = readSampleCart();
  if (!cart) return null;
  const line = cart.lines.find((l) => l.id === lineId);
  if (line) {
    if (quantity <= 0) cart.lines = cart.lines.filter((l) => l.id !== lineId);
    else line.quantity = quantity;
  }
  recomputeSampleTotals(cart);
  writeSampleCart(cart);
  return cart;
}

type CartContextValue = {
  cart: SkCart | null;
  /** A mutation is in flight. Drives button spinners and disables quantity
   *  controls so a fast double-click cannot desync the drawer from Shopify. */
  busy: boolean;
  open: boolean;
  /** Set when Shopify could not be reached, so the drawer can say so rather
   *  than silently doing nothing. */
  error: string | null;
  count: number;
  openCart: () => void;
  closeCart: () => void;
  add: (variantId: string, quantity?: number) => Promise<boolean>;
  setQuantity: (lineId: string, quantity: number) => Promise<void>;
};

const CartContext = createContext<CartContextValue | null>(null);

const readStoredId = () => {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    // Safari in private mode throws on localStorage access. A cart that does
    // not survive a reload is worth more than a page that will not render.
    return null;
  }
};

const writeStoredId = (id: string | null) => {
  if (typeof window === "undefined") return;
  try {
    if (id) window.localStorage.setItem(STORAGE_KEY, id);
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* see readStoredId */
  }
};

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<SkCart | null>(null);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Rehydrate on mount. A stored id that Shopify no longer recognises — carts
  // expire — is dropped quietly; the next add simply creates a fresh cart.
  useEffect(() => {
    const stored = readStoredId();
    if (!stored) {
      // No Shopify cart to restore; a sample basket may still be waiting.
      const sample = readSampleCart();
      if (sample) setCart(sample);
      return;
    }
    let cancelled = false;
    fetchCart({ data: stored })
      .then((c) => {
        if (cancelled) return;
        if (c) setCart(c);
        else writeStoredId(null);
      })
      .catch(() => writeStoredId(null));
    return () => {
      cancelled = true;
    };
  }, []);

  const openCart = useCallback(() => setOpen(true), []);
  const closeCart = useCallback(() => setOpen(false), []);

  const add = useCallback(async (variantId: string, quantity = 1) => {
    setBusy(true);
    setError(null);
    if (isSampleVariant(variantId)) {
      const next = sampleCartAdd(variantId, quantity);
      setBusy(false);
      if (!next) {
        setError("We couldn't find that piece. Please refresh and try again.");
        return false;
      }
      setCart(next);
      setOpen(true);
      return true;
    }
    try {
      const next = await addToCart({
        data: { cartId: readStoredId(), variantId, quantity },
      });
      if (!next) {
        setError("We couldn't reach the atelier's stock room. Please try again.");
        return false;
      }
      setCart(next);
      writeStoredId(next.id);
      setOpen(true);
      return true;
    } catch {
      setError("We couldn't reach the atelier's stock room. Please try again.");
      return false;
    } finally {
      setBusy(false);
    }
  }, []);

  const setQuantity = useCallback(
    async (lineId: string, quantity: number) => {
      if (isSampleLine(lineId)) {
        setCart(sampleCartSetQuantity(lineId, quantity));
        return;
      }
      const id = cart?.id ?? readStoredId();
      if (!id) return;
      setBusy(true);
      setError(null);
      try {
        const next = await setCartLineQuantity({ data: { cartId: id, lineId, quantity } });
        if (next) {
          setCart(next);
          writeStoredId(next.id);
        } else {
          setError("That change didn't save. Please try again.");
        }
      } catch {
        setError("That change didn't save. Please try again.");
      } finally {
        setBusy(false);
      }
    },
    [cart?.id],
  );

  // Close on Escape, matching the rest of the site's overlays.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Hold the page still behind the drawer. Compensating for the scrollbar's
  // width prevents the layout jumping sideways as it disappears.
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (!open) return;
    const { body } = document;
    const gap = window.innerWidth - document.documentElement.clientWidth;
    const prevOverflow = body.style.overflow;
    const prevPad = body.style.paddingRight;
    body.style.overflow = "hidden";
    if (gap > 0) body.style.paddingRight = `${gap}px`;
    return () => {
      body.style.overflow = prevOverflow;
      body.style.paddingRight = prevPad;
    };
  }, [open]);

  const value = useMemo<CartContextValue>(
    () => ({
      cart,
      busy,
      open,
      error,
      count: cart?.totalQuantity ?? 0,
      openCart,
      closeCart,
      add,
      setQuantity,
    }),
    [cart, busy, open, error, openCart, closeCart, add, setQuantity],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
